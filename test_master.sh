#!/bin/bash

echo "=========================================="
echo "    Hermes UI - Master Test Suite"
echo "=========================================="
echo ""

# Ensure we're in the right directory
cd "$(dirname "$0")"

# 1. Kill any stale backend on port 3008
STALE_PID=$(lsof -ti :3008 2>/dev/null | head -1)
if [ ! -z "$STALE_PID" ]; then
    echo "Killing stale backend (PID: $STALE_PID)..."
    kill "$STALE_PID" 2>/dev/null
    sleep 1
fi

# 2. Start the backend
echo "Starting Hermes Backend (server.js)..."
node server.js > backend_output.log 2>&1 &
BACKEND_PID=$!
echo "Waiting for backend to stabilize..."
sleep 3

# 2. Start the frontend if it's not running
if ! curl -s http://localhost:3006 > /dev/null; then
    echo "Starting Hermes UI dev server..."
    npm run dev > dev_output.log 2>&1 &
    DEV_PID=$!
    echo "Waiting for dev server to start..."
    sleep 10
fi

# 2. Run Playwright Tests for all views
echo "Running Playwright Tests for views..."
npx playwright test tests/views/ --project=chromium
PW_EXIT_CODE=$?

if [ $PW_EXIT_CODE -ne 0 ]; then
    echo "❌ Playwright tests failed! Please fix the UI or test specs."
    # We still run visual audit? Maybe not if playwright fails.
    # Actually, visual audit requires screenshots, so if some screenshots were taken, we can audit.
    # But for a strict pass, both must pass.
fi

# 3. Run LLM Visual Audit
echo ""
echo "Running LLM Visual Audit on screenshots..."
if [ -f "scripts/llm_visual_audit.js" ]; then
    node scripts/llm_visual_audit.js
    LLM_EXIT_CODE=$?
else
    # Compile typescript version if needed
    npx tsc scripts/llm_visual_audit.ts --esModuleInterop --moduleResolution node
    node scripts/llm_visual_audit.js
    LLM_EXIT_CODE=$?
fi

# 4. Generate Final QA Report
echo ""
echo "Orchestrating Final QA Report..."

REPORT_FILE="QA_Report.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

{
    echo "# Hermes UI - QA Master Diagnostic Report"
    echo ""
    echo "Generated: $TIMESTAMP"
    echo ""
    echo "## Execution Summary"
    echo ""
    if [ $PW_EXIT_CODE -eq 0 ]; then
        echo "- **Playwright Tests:** ✅ PASS"
    else
        echo "- **Playwright Tests:** ❌ FAIL (Exit Code: $PW_EXIT_CODE)"
    fi

    if [ $LLM_EXIT_CODE -eq 0 ]; then
        echo "- **LLM Visual Audit:** ✅ PASS"
    else
        echo "- **LLM Visual Audit:** ❌ FAIL (Exit Code: $LLM_EXIT_CODE)"
    fi
    echo ""
    echo "## Technical Breakdown"
    echo ""
    echo "### Playwright Results"
    if [ $PW_EXIT_CODE -eq 0 ]; then
        echo "All 14 tailored view tests completed successfully."
    else
        echo "Regression detected in one or more terminal views. Critical failure signals found."
    fi
    echo ""
    echo "### Visual Evaluation"
    if [ -f "QA_Visual_Report.md" ]; then
        cat QA_Visual_Report.md | grep -v "^# " | grep -v "^Generated"
    else
        echo "Visual audit was skipped or failed to initialize."
    fi
} > $REPORT_FILE

# 5. Summary Output
echo "=========================================="
if [ $PW_EXIT_CODE -eq 0 ] && [ $LLM_EXIT_CODE -eq 0 ]; then
    echo "✅ ALL TESTS PASSED (Playwright & LLM Visual Audit)"
    EXIT_CODE=0
else
    echo "❌ SOME TESTS FAILED"
    echo "   See $REPORT_FILE for detailed diagnostics."
    EXIT_CODE=1
fi

echo "=========================================="

if [ ! -z "$DEV_PID" ]; then
    echo "Cleaning up local dev server..."
    kill $DEV_PID
fi

if [ ! -z "$BACKEND_PID" ]; then
    echo "Cleaning up backend server..."
    kill $BACKEND_PID
fi

exit $EXIT_CODE
