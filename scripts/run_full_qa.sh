#!/bin/bash

# Hermes UI - Full QA Orchestration Script
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}==================================================${NC}"
echo -e "${PURPLE}   HERMES NEURAL UI - FULL QUALITY ASSURANCE      ${NC}"
echo -e "${PURPLE}==================================================${NC}"

# 1. Cleanup
echo -e "\n${CYAN}[1/4] Cleaning environment...${NC}"
fuser -k 3006/tcp 2>/dev/null || true
fuser -k 3008/tcp 2>/dev/null || true
rm -rf tests/screenshots/audit/*.png
mkdir -p tests/screenshots/audit

# 2. Start Servers
echo -e "${CYAN}[2/4] Initializing backend & frontend...${NC}"
node server.js > /tmp/hermes_backend.log 2>&1 &
BACKEND_PID=$!
npm run dev -- --port 3006 > /tmp/hermes_frontend.log 2>&1 &
FRONTEND_PID=$!

echo -e "      Waiting for services to stabilize..."
sleep 8

# 3. Execution
echo -e "${CYAN}[3/4] Triggering neural interaction tests (Playwright)...${NC}"
npx playwright test tests/visual_audit.spec.ts --project=chromium

if [ $? -eq 0 ]; then
    echo -e "${GREEN}      ✅ Interaction tests passed.${NC}"
else
    echo -e "${RED}      ❌ Interaction tests failed. Check logs.${NC}"
fi

# 4. Neural Audit
echo -e "${CYAN}[4/4] Activating Gemini Visual Audit (Local Reasoning)...${NC}"
node scripts/llm_visual_audit.js

AUDIT_STATUS=$?

# Cleanup
kill $BACKEND_PID
kill $FRONTEND_PID

echo -e "\n${PURPLE}==================================================${NC}"
if [ $AUDIT_STATUS -eq 0 ]; then
    echo -e "${GREEN}   FULL QA PIPELINE COMPLETED SUCCESSFULLY        ${NC}"
else
    echo -e "${RED}   QA PIPELINE COMPLETED WITH VISUAL REGRESSIONS   ${NC}"
fi
echo -e "${PURPLE}==================================================${NC}"

exit $AUDIT_STATUS
