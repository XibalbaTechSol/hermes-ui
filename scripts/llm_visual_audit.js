import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("⚠️  GEMINI_API_KEY environment variable is not set.");
    console.warn("⚠️  Skipping LLM visual audit. To enforce visual audit, set this variable.");
    process.exit(0);
}

const ai = new GoogleGenAI({ apiKey });
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

const screenshotsDir = path.resolve(process.cwd(), 'tests', 'screenshots', 'views');
const perfectionDir = path.resolve(process.cwd(), 'tests', 'screenshots', 'perfection');

if (!fs.existsSync(screenshotsDir)) {
    console.log(`Directory ${screenshotsDir} does not exist. No screenshots to process.`);
    process.exit(0);
}

const files = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png'));

if (files.length === 0) {
    console.log("No .png screenshots found to audit.");
    process.exit(0);
}

// Helper to find a "perfection" baseline for a given screenshot
function findBaseline(currentFile) {
    if (!fs.existsSync(perfectionDir)) return null;
    const perfectionFiles = fs.readdirSync(perfectionDir).filter(f => f.endsWith('.png'));
    
    // Try exact match first
    if (perfectionFiles.includes(currentFile)) return path.join(perfectionDir, currentFile);
    
    // Try prefix match (e.g. "dashboard" matches "01_dashboard.png")
    const prefix = currentFile.split('-')[0].split('_')[0].toLowerCase();
    const match = perfectionFiles.find(f => f.toLowerCase().includes(prefix));
    if (match) return path.join(perfectionDir, match);
    
    return null;
}

// System Instructions to guide the visual audit
const systemPrompt = `You are a world-class UI/UX Designer and QA Tester.
Analyze the provided screenshot(s) of a specific web application page.

If ONE image is provided:
Analyze it for premium modern web design principles (good contrast, proper padding, glassmorphism if applicable, dark mode aesthetics). Look for layout issues, text clipping, or "cheap" unstyled elements.

If TWO images are provided:
The first is the CURRENT screenshot, and the second is the "PERFECTION" baseline.
Identify any visual drift or regressions. If the core design has changed significantly or looks worse than the baseline, mark it as FAIL.

Evaluation Criteria:
- Layout Alignment & Spacing
- Color Contrast & Visual Hierarchy
- Aesthetic Consistency (Premium Dark Mode)
- No obvious visual bugs or text overlapping

Your output MUST start with "PASS:" or "FAIL:" followed by a concise reason.
Be strict. We only accept top quality designs.`;

function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType
        },
    };
}

async function auditScreenshots() {
    let allPassed = true;
    const results = [];
    console.log(`Auditing ${files.length} screenshots...`);

    for (const file of files) {
        const filePath = path.join(screenshotsDir, file);
        const baselinePath = findBaseline(file);
        
        process.stdout.write(`Analyzing ${file}${baselinePath ? ' (Comparison Mode)' : ''}... `);

        try {
            const contents = [systemPrompt, fileToGenerativePart(filePath, "image/png")];
            if (baselinePath) {
                contents.push(fileToGenerativePart(baselinePath, "image/png"));
            }

            const result = await model.generateContent(contents);
            const text = result.response.text();
            
            const isPass = text.toUpperCase().startsWith("PASS");
            const isFail = text.toUpperCase().startsWith("FAIL");

            if (isPass) {
                console.log("\x1b[32m%s\x1b[0m", "PASS"); // Green
                results.push({ file, status: "PASS", message: text.replace(/^PASS:?\s*/i, "").trim() });
            } else if (isFail) {
                console.log("\x1b[31m%s\x1b[0m", "FAIL"); // Red
                const reason = text.replace(/^FAIL:?\s*/i, "").trim();
                console.log("   Reason: " + reason);
                results.push({ file, status: "FAIL", message: reason });
                allPassed = false;
            } else {
                console.log("\x1b[33m%s\x1b[0m", "UNKNOWN");
                results.push({ file, status: "UNKNOWN", message: text.trim() });
                allPassed = false;
            }
        } catch (error) {
            console.log("\x1b[31m%s\x1b[0m", "ERROR");
            console.error("   API or execution error:", error.message);
            results.push({ file, status: "ERROR", message: error.message });
            allPassed = false;
        }
    }

    // Generate markdown report
    const reportPath = path.resolve(process.cwd(), 'QA_Visual_Report.md');
    let markdown = `# Hermes UI - Visual Audit Report\n\nGenerated: ${new Date().toLocaleString()}\n\n`;
    markdown += `| View Screenshot | Baseline | Status | Evaluation |\n`;
    markdown += `| :--- | :--- | :--- | :--- |\n`;
    
    for (const r of results) {
        const baseline = findBaseline(r.file) ? path.basename(findBaseline(r.file)) : "N/A";
        const icon = r.status === "PASS" ? "✅" : (r.status === "FAIL" ? "❌" : "⚠️");
        markdown += `| ${r.file} | ${baseline} | ${icon} ${r.status} | ${r.message} |\n`;
    }
    
    fs.writeFileSync(reportPath, markdown);
    console.log(`\n📄 Visual Audit Report generated at: ${reportPath}`);

    if (!allPassed) {
        console.error("\n❌ LLM Visual Audit failed for one or more screenshots.");
        process.exit(1);
    } else {
        console.log("\n✅ All screenshots passed the LLM Visual Audit.");
        process.exit(0);
    }
}

auditScreenshots();
