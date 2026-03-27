# Plan: OpenAI-like Chat Interface Refactor

## Objective
Transform the current `ChatView.tsx` into a modern, OpenAI-like chat interface using `lucide-react`, `react-markdown`, and Tailwind CSS.

## Key Changes
1.  **Layout**:
    *   Implement a two-pane layout: Sidebar (sessions) and Main (chat).
    *   Use a centered, max-width container for messages (`max-w-3xl`) to match OpenAI's layout.
2.  **Sidebar**:
    *   Clean list of "Neural Traces" (sessions).
    *   Prominent "New Session" button at the top.
    *   Search functionality (existing) integrated cleanly.
3.  **Message Feed**:
    *   Render messages using `react-markdown` with `remark-gfm`.
    *   Add syntax highlighting for code blocks using `react-syntax-highlighter`.
    *   Distinct visual styles for User and Assistant (Hermes) roles.
    *   User messages: Bubbles or clean text on the right.
    *   Assistant messages: Icon-prefixed text on the left.
4.  **Input Area**:
    *   Floating or sticky centered input box.
    *   Auto-resizing `textarea`.
    *   Maintain "Awaiting commands..." placeholder for test compatibility.
5.  **Test Compatibility**:
    *   Keep `button[title="New Session"]`.
    *   Keep `[placeholder="Awaiting commands..."]`.
    *   Keep `.chat-sending-indicator`.

## Implementation Steps
1.  Refactor `ChatView.tsx` with the new design.
2.  Add sub-components for `ChatMessage` and `SessionItem`.
3.  Implement auto-resize logic for the textarea.
4.  Verify with `Comprehensive Hermes UI Gold Standard` test.

## Verification
*   Execute: `cd hermes-ui && xvfb-run npx playwright test tests/comprehensive_hermes.spec.ts --config playwright.config.ts`
*   Ensure all tests pass and screenshots look correct.
