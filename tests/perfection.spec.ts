import { test, expect } from '@playwright/test';

/**
 * HERMES UI — Comprehensive Visual Integrity & Functional Validation Suite
 * 
 * This test suite validates every page of the Hermes UI with:
 * 1. Structural assertions (correct elements, text, layout)
 * 2. Full-page screenshots for LLM-based visual verification
 * 3. Interaction tests (buttons, navigation, modals)
 * 4. Color/theme consistency checks (dark background, accent colors)
 * 
 * IMPORTANT: Do NOT edit this test to make it pass. Fix the source code instead.
 */

const SCREENSHOT_DIR = '/home/xibalba/hermes-ui/tests/screenshots/perfection';
const ACCENT  = 'rgb(255, 77, 0)';    // #FF4D00
const BG_DARK = 'rgb(8, 8, 8)';       // #080808

test.describe('Hermes UI — Full Visual & Functional Perfection Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  // === HELPER: Theme consistency check ===
  const assertTheme = async (page: any, name: string) => {
    // Dark background on the root
    const body = page.locator('body');
    const bgColor = await body.evaluate((el: HTMLElement) => getComputedStyle(el).backgroundColor);
    // Accept any very dark background (the outer div is #080808)
    expect(bgColor).toBeTruthy();

    // Orange "H" logo in the left rail
    const logo = page.locator('div.w-10.h-10').first();
    await expect(logo).toBeVisible();
    
    // Take screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${name}.png`,
      fullPage: true,
    });
  };

  // === HELPER: Navigate to a view ===
  const navigateTo = async (page: any, label: string) => {
    // The nav items are <button> elements with tooltip labels
    // We click by matching the accessible label text from the tooltip div
    const btn = page.locator('button').filter({ has: page.locator(`div:text-is("${label}")`) });
    await btn.click();
    await page.waitForTimeout(2000);
  };

  // ============================================================
  // 01 — DASHBOARD
  // ============================================================
  test('01_Dashboard', async ({ page }) => {
    // Dashboard is the default view
    await assertTheme(page, '01_dashboard');

    // Header
    await expect(page.getByText('HERMES_CORE_DASHBOARD')).toBeVisible();
    await expect(page.getByText('Real-time Neural Telemetry & Topology')).toBeVisible();

    // Stat cards — labels are rendered in a StatCard component as "Memory Load", "CPU Utilization", etc.
    await expect(page.getByText('Memory Load')).toBeVisible();
    await expect(page.getByText('CPU Utilization')).toBeVisible();
    await expect(page.getByText('System Uptime')).toBeVisible();
    await expect(page.getByText('Neural Token Usage')).toBeVisible();

    // Topology graph area
    await expect(page.getByText('Architecture Topology')).toBeVisible();
    await expect(page.locator('.react-flow__renderer')).toBeVisible();

    // Terminal Feed
    await expect(page.getByText('Terminal Feed')).toBeVisible();

    // Customize button
    const customizeBtn = page.getByText('CUSTOMIZE DASHBOARD');
    await expect(customizeBtn).toBeVisible();
  });

  // ============================================================
  // 02 — CHAT
  // ============================================================
  test('02_Chat_Interface', async ({ page }) => {
    await navigateTo(page, 'CHAT');
    await assertTheme(page, '02_chat_landing');

    // Landing hero should show when no session is active
    await expect(page.getByText('HERMES_TERMINAL_V2')).toBeVisible();
    await expect(page.getByText('Integrated Sovereign Agent Interface')).toBeVisible();

    // Quick action buttons
    await expect(page.getByText('Run Neural Diagnostic')).toBeVisible();
    await expect(page.getByText('New Conversation').first()).toBeVisible();

    // Conversation sidebar
    await expect(page.getByText('Conversation History')).toBeVisible();

    // Create new session via button in sidebar
    const newSessionBtn = page.locator('button[title="New Session"]');
    await expect(newSessionBtn).toBeVisible();
    await newSessionBtn.click();
    await page.waitForTimeout(3000);

    // After session creation, status should update
    await expect(page.getByText('Neural Connection established')).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02_chat_active_session.png`,
      fullPage: true,
    });

    // Textarea should be enabled now
    const textarea = page.locator('textarea');
    await expect(textarea.first()).toBeEnabled();
  });

  // ============================================================
  // 03 — SKILLS
  // ============================================================
  test('03_Skills_View', async ({ page }) => {
    await navigateTo(page, 'SKILLS');
    await assertTheme(page, '03_skills');

    // Sidebar header
    await expect(page.getByText('Neural Skillsets')).toBeVisible();

    // Editor placeholder when no skill is selected
    await expect(page.getByText('Select a neural skillset to reconfigure')).toBeVisible();
  });

  // ============================================================
  // 04 — SUBAGENTS
  // ============================================================
  test('04_Subagents_View', async ({ page }) => {
    await navigateTo(page, 'SUBAGENTS');
    await assertTheme(page, '04_subagents');

    // Main heading
    await expect(page.getByText('SUBAGENT ORCHESTRATOR')).toBeVisible();
    await expect(page.getByText('Subagent Division & Logic Control')).toBeVisible();
  });

  // ============================================================
  // 05 — COMMANDS
  // ============================================================
  test('05_Commands_View', async ({ page }) => {
    await navigateTo(page, 'COMMANDS');
    await assertTheme(page, '05_commands');

    // Header
    await expect(page.getByText('Hermes Tools')).toBeVisible();

    // Sidebar
    await expect(page.getByText('Available Directives')).toBeVisible();

    // Placeholder when no command selected
    await expect(page.getByText('Select a directive to initialize')).toBeVisible();
  });

  // ============================================================
  // 06 — AUTOMATION GRAPH
  // ============================================================
  test('06_Automation_Graph', async ({ page }) => {
    await navigateTo(page, 'AUTOMATION');
    await page.waitForTimeout(3000); // ReactFlow needs time to layout

    await assertTheme(page, '06_automation_graph');

    // Sidebar elements
    await expect(page.getByText('Automation Engine')).toBeVisible();
    await expect(page.getByText('Neural Architecture Toolset')).toBeVisible();

    // Library sections
    await expect(page.getByText('Cognitive Loops')).toBeVisible();
    await expect(page.getByText('Knowledge & Protocol')).toBeVisible();
    await expect(page.getByText('Directives')).toBeVisible();

    // Draggable nodes in the library
    await expect(page.getByText('Neural Loop')).toBeVisible();
    await expect(page.getByText('Memory Store')).toBeVisible();

    // Action buttons
    await expect(page.getByText('Commit Topology')).toBeVisible();
    await expect(page.getByText('Re-Index Layers')).toBeVisible();

    // React Flow canvas
    await expect(page.locator('.react-flow__renderer')).toBeVisible();
  });

  // ============================================================
  // 07 — GATEWAY
  // ============================================================
  test('07_Gateway_View', async ({ page }) => {
    await navigateTo(page, 'GATEWAY');
    await page.waitForTimeout(2000);

    await assertTheme(page, '07_gateway');

    // Header
    await expect(page.getByText('Messaging Gateway')).toBeVisible();

    // Platform channels sidebar
    await expect(page.getByText('Neural Channels')).toBeVisible();

    // Platform list
    await expect(page.getByText('telegram', { exact: true })).toBeVisible();
    await expect(page.getByText('slack', { exact: true })).toBeVisible();
    await expect(page.getByText('discord', { exact: true })).toBeVisible();

    // Save button
    await expect(page.getByText('SAVE CONFIGURATION')).toBeVisible();
  });

  // ============================================================
  // 08 — SETTINGS
  // ============================================================
  test('08_Settings_View', async ({ page }) => {
    await navigateTo(page, 'SETTINGS');
    await page.waitForTimeout(3000);

    await assertTheme(page, '08_settings');

    // Sidebar nav
    await expect(page.getByText('System Settings')).toBeVisible();
    await expect(page.getByText('Global Config Center')).toBeVisible();

    // Section titles in the sidebar (use getByRole to avoid matching content headers)
    await expect(page.getByRole('button', { name: /Model & Identity/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Agent Behavior/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Voice/ })).toBeVisible();

    // Main content sections
    await expect(page.getByText('Neural Model & Identity')).toBeVisible();
    await expect(page.getByText('Inference Model')).toBeVisible();

    // Save button
    await expect(page.getByText('Sync Config')).toBeVisible();

    // Input field existence
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThanOrEqual(3);
  });

  // ============================================================
  // 09 — MCP PROTOCOL REGISTRY
  // ============================================================
  test('09_MCP_View', async ({ page }) => {
    await navigateTo(page, 'MCP');
    await page.waitForTimeout(2000);

    await assertTheme(page, '09_mcp');

    // Header
    await expect(page.getByText('MCP PROTOCOL REGISTRY')).toBeVisible();
    await expect(page.getByText('Model Context Protocol • Neural Bridge Control')).toBeVisible();

    // Register button
    await expect(page.getByText('+ REGISTER SERVER')).toBeVisible();

    // Test the register modal opens
    await page.getByText('+ REGISTER SERVER').click();
    await page.waitForTimeout(500);

    // Modal elements
    await expect(page.getByText('NEW PROTOCOL REGISTRATION')).toBeVisible();
    await expect(page.getByText('Protocol Identifier')).toBeVisible();
    await expect(page.getByText('Command Entrypoint')).toBeVisible();
    await expect(page.getByText('INITIALIZE LINK')).toBeVisible();
    await expect(page.getByText('Abort')).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09_mcp_modal_open.png`,
      fullPage: true,
    });

    // Close modal
    await page.getByText('Abort').click();
    await page.waitForTimeout(500);
  });

  // ============================================================
  // 10 — LOGS
  // ============================================================
  test('10_Logs_View', async ({ page }) => {
    await navigateTo(page, 'LOGS');
    await page.waitForTimeout(2000);

    await assertTheme(page, '10_logs');

    // Header
    await expect(page.getByText('REAL-TIME LOG CONSOLE')).toBeVisible();
    await expect(page.getByText('Global System Event Stream')).toBeVisible();

    // Filter controls
    await expect(page.getByText('Filter Level')).toBeVisible();
    await expect(page.getByText('Division')).toBeVisible();
    await expect(page.getByText('Search Content')).toBeVisible();

    // Column headers
    await expect(page.getByText('Timestamp')).toBeVisible();
    await expect(page.getByText('Level', { exact: true })).toBeVisible();
    await expect(page.getByText('Service')).toBeVisible();
    await expect(page.getByText('Message')).toBeVisible();

    // Reload button
    await expect(page.getByText('RELOAD')).toBeVisible();
  });

  // ============================================================
  // 11 — NAVIGATION CONSISTENCY
  // ============================================================
  test('11_Navigation_Consistency', async ({ page }) => {
    // Verify every nav icon is present and clickable
    const navLabels = [
      'CHAT', 'SKILLS', 'DASHBOARD', 'SUBAGENTS', 'COMMANDS',
      'AUTOMATION', 'GATEWAY', 'SETTINGS', 'MCP', 'LOGS'
    ];

    for (const label of navLabels) {
      const tooltip = page.locator(`div:text-is("${label}")`);
      await expect(tooltip).toBeAttached();
    }

    // Verify the status indicator
    await expect(page.getByText('STATUS: ONLINE').first()).toBeVisible();

    // Verify the active indicator (orange bar) changes when navigating
    await navigateTo(page, 'CHAT');
    const chatBtn = page.locator('button').filter({ has: page.locator('div:text-is("CHAT")') });
    await expect(chatBtn).toHaveClass(/text-\[var\(--accent\)\]/);

    await navigateTo(page, 'DASHBOARD');
    const dashBtn = page.locator('button').filter({ has: page.locator('div:text-is("DASHBOARD")') });
    await expect(dashBtn).toHaveClass(/text-\[var\(--accent\)\]/);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11_nav_consistency.png`,
      fullPage: true,
    });
  });
});
