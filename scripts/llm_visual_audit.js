import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const screenshotsDir = path.resolve(process.cwd(), 'tests', 'screenshots', 'audit');
const perfectionDir = path.resolve(process.cwd(), 'tests', 'screenshots', 'perfection');

if (!fs.existsSync(screenshotsDir)) {
    console.log(`Directory ${screenshotsDir} does not exist. Run playwright tests first.`);
    process.exit(0);
}

const files = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png') && !f.startsWith('error-'));

if (files.length === 0) {
    console.log("No .png screenshots found to audit in " + screenshotsDir);
    process.exit(0);
}

// Helper to find a "perfection" baseline for a given screenshot
function findBaseline(currentFile) {
    if (!fs.existsSync(perfectionDir)) return null;
    const perfectionFiles = fs.readdirSync(perfectionDir).filter(f => f.endsWith('.png'));
    
    const baseName = currentFile.replace(/^\d+-\d+-/, '').replace('.png', '');
    const match = perfectionFiles.find(f => f.toLowerCase().includes(baseName.toLowerCase()));
    if (match) return path.join(perfectionDir, match);
    
    return null;
}

const systemPrompt = `You are a world-class UI/UX Designer and QA Tester.
Analyze the provided screenshot(s) of the Hermes Automation Suite.

If ONE image is provided:
Analyze it for premium modern web design principles (contrast, padding, glassmorphism, dark mode). Look for layout issues, text clipping, or unstyled elements.

If TWO images are provided:
The first is the CURRENT screenshot, and the second is the "PERFECTION" baseline.
Identify any visual drift or regressions. 

Evaluation Criteria:
- Layout Alignment & Spacing
- Color Contrast & Visual Hierarchy (Sleek Dark Mode)
- Aesthetic Consistency
- No obvious visual bugs

Your output MUST start with "PASS:" or "FAIL:" followed by a concise reason.
Be strict. We only accept top quality designs.`;

const GEMINI_TIMEOUT_MS = 45000; // 45s max per screenshot

async function runGeminiCli(prompt, images) {
    return new Promise((resolve, reject) => {
        // Embed image references in the prompt using @path syntax
        let combinedPrompt = prompt;
        for (const img of images) {
            combinedPrompt += `\n\n@${img}`;
        }

        // Use default model (no -m flag), no positional args (conflicts with -p)
        const args = ['-p', combinedPrompt];

        const proc = spawn('gemini', args, { timeout: GEMINI_TIMEOUT_MS });
        proc.stdin.end();

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (d) => stdout += d.toString());
        proc.stderr.on('data', (d) => stderr += d.toString());

        // Hard timeout safety net
        const timer = setTimeout(() => {
            proc.kill('SIGTERM');
            reject(new Error('Gemini CLI timed out after 45s'));
        }, GEMINI_TIMEOUT_MS);

        proc.on('close', (code) => {
            clearTimeout(timer);
            const output = stdout.trim();

            // Detect quota exhaustion in stderr
            if (stderr.includes('Usage limit reached') || stderr.includes('RESOURCE_EXHAUSTED')) {
                reject(new Error('Gemini quota exhausted. Re-run when quota resets.'));
                return;
            }

            if (code === 0 && output) resolve(output);
            else reject(new Error(stderr.split('\n').pop() || `Gemini CLI exited with code ${code}`));
        });
    });
}

async function auditScreenshots() {
    let allPassed = true;
    const results = [];
    console.log(`\x1b[1m\x1b[35m[NEURAL AUDIT]\x1b[0m Starting visual inspection of ${files.length} views...`);

    for (const file of files) {
        const filePath = path.join(screenshotsDir, file);
        const baselinePath = findBaseline(file);
        
        process.stdout.write(`   \x1b[36m•\x1b[0m Analyzing ${file}${baselinePath ? ' (+Baseline)' : ''}... `);

        try {
            const images = [filePath];
            if (baselinePath) images.push(baselinePath);

            const text = await runGeminiCli(systemPrompt, images);
            
            const isPass = text.toUpperCase().startsWith("PASS");
            const isFail = text.toUpperCase().startsWith("FAIL");

            if (isPass) {
                console.log("\x1b[32m%s\x1b[0m", "PASS");
                results.push({ file, status: "PASS", message: text.replace(/^PASS:?\s*/i, "").trim() });
            } else if (isFail) {
                console.log("\x1b[31m%s\x1b[0m", "FAIL");
                const reason = text.replace(/^FAIL:?\s*/i, "").trim();
                console.log("     \x1b[31m└─\x1b[0m " + reason);
                results.push({ file, status: "FAIL", message: reason });
                allPassed = false;
            } else {
                console.log("\x1b[33m%s\x1b[0m", "UNKNOWN");
                results.push({ file, status: "UNKNOWN", message: text.trim() });
                allPassed = false;
            }
        } catch (error) {
            console.log("\x1b[31m%s\x1b[0m", "ERROR");
            console.error("     \x1b[31m└─\x1b[0m " + error.message);
            results.push({ file, status: "ERROR", message: error.message });
            allPassed = false;
        }
    }

    // Generate markdown report
    const reportPath = path.resolve(process.cwd(), 'QA_Visual_Report.md');
    let markdown = `# 🛡️ Hermes UI - Visual Audit Report\n\n**Generated:** ${new Date().toLocaleString()}\n\n`;
    markdown += `| View Screenshot | Status | Evaluation |\n`;
    markdown += `| :--- | :--- | :--- |\n`;
    
    for (const r of results) {
        const icon = r.status === "PASS" ? "✅" : (r.status === "FAIL" ? "❌" : "⚠️");
        markdown += `| ${r.file} | ${icon} **${r.status}** | ${r.message} |\n`;
    }
    
    fs.writeFileSync(reportPath, markdown);
    console.log(`\n\x1b[1m\x1b[32m[COMPLETE]\x1b[0m Report generated at: ${reportPath}`);

    if (!allPassed) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

auditScreenshots();

