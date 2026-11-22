import { chromium, Page } from "playwright";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

// House style cursor & click ripple from pr-demo-video skill
const CURSOR_JS = `(() => {
  if (window.__demoCursor) return;
  window.__demoCursor = true;
  const mount = () => {
    const c = document.createElement('div');
    c.id = '__demo_cursor';
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M3 2v17l4.6-4.3 3 6.8 2.8-1.2-3-6.6H17z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-200px,-200px);filter:drop-shadow(0 1px 3px rgba(0,0,0,.4))';
    document.documentElement.appendChild(c);
    addEventListener('mousemove', (e) => {
      c.style.transform = 'translate(' + (e.clientX - 3) + 'px,' + (e.clientY - 2) + 'px)';
    }, true);
    addEventListener('mousedown', (e) => {
      const r = document.createElement('div');
      r.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;width:44px;height:44px;border-radius:50%;border:3px solid #342EDC;background:rgba(52,46,220,.2);left:' + (e.clientX - 22) + 'px;top:' + (e.clientY - 22) + 'px;transform:scale(.3);opacity:1;transition:transform .45s ease-out,opacity .45s ease-out';
      document.documentElement.appendChild(r);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        r.style.transform = 'scale(1.4)';
        r.style.opacity = '0';
      }));
      setTimeout(() => r.remove(), 600);
    }, true);
  };
  if (document.documentElement) mount(); else addEventListener('DOMContentLoaded', mount);
})()`;

const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

class MouseGlider {
  x: number = 720;
  y: number = 450;
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async moveTo(targetX: number, targetY: number) {
    const fromX = this.x;
    const fromY = this.y;
    const dist = Math.hypot(targetX - fromX, targetY - fromY);
    const ms = Math.min(800, Math.max(220, dist * 0.65));
    const steps = Math.max(12, Math.round(ms / 16));

    for (let i = 1; i <= steps; i++) {
      const k = ease(i / steps);
      const currX = fromX + (targetX - fromX) * k;
      const currY = fromY + (targetY - fromY) * k;
      await this.page.mouse.move(currX, currY);
      await new Promise((r) => setTimeout(r, ms / steps));
    }
    this.x = targetX;
    this.y = targetY;
  }

  async click(locator: any, options: { pauseAfter?: number; offsetX?: number; offsetY?: number } = {}) {
    const box = await locator.boundingBox();
    if (box) {
      const targetX = box.x + (options.offsetX ?? box.width / 2);
      const targetY = box.y + (options.offsetY ?? box.height / 2);
      await this.moveTo(targetX, targetY);
      await new Promise((r) => setTimeout(r, 120));
      await this.page.mouse.down();
      await new Promise((r) => setTimeout(r, 80));
      await this.page.mouse.up();
      await new Promise((r) => setTimeout(r, options.pauseAfter ?? 350));
    } else {
      await locator.click();
    }
  }
}

// Injects the fixed navy bottom bar (#1A1B3A) in the house style
async function setCaptionBar(page: Page, caption: string, sceneNum: number, totalScenes: number = 8) {
  try {
    await page.evaluate(
      ({ caption, tag }: { caption: string; tag: string }) => {
        let el = document.getElementById("demo-bottom-bar");
        if (!el) {
          el = document.createElement("div");
          el.id = "demo-bottom-bar";
          el.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 64px;
            background: #1A1B3A;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 32px;
            z-index: 2147483640;
            box-shadow: 0 -4px 16px rgba(0,0,0,0.25);
            border-top: 1px solid rgba(255,255,255,0.1);
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
            transition: all 0.25s ease;
          `;
          document.body.appendChild(el);
        }
        el.innerHTML = `
          <div style="font-size: 17px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.01em;">${caption}</div>
          <div style="font-size: 14px; font-weight: 600; color: #B0B4E6; letter-spacing: 0.02em;">${tag}</div>
        `;
      },
      { caption, tag: `AJAIA-DEMO · ${sceneNum}/${totalScenes}` }
    );
  } catch (err) {
    // ignore navigation race
  }
}

async function run() {
  const videoDir = path.resolve(__dirname, "../videos");
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  console.log("Launching Chrome with cursor simulation and navy caption bar...");
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1440, height: 900 },
    },
  });

  // Inject cursor script on every page load
  await context.addInitScript(CURSOR_JS);

  const page = await context.newPage();
  const glider = new MouseGlider(page);
  const baseUrl = "https://ajaia-app-ruddy.vercel.app";

  console.log(`Navigating to ${baseUrl}...`);
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.mouse.move(720, 450); // initial cursor placement
  await page.waitForTimeout(1000);

  // Scene 1: Reviewer Persona Switcher
  console.log("Scene 1: Persona switching...");
  await setCaptionBar(page, "Reviewer Persona Switcher: 1-click permission testing", 1);
  await glider.click(page.locator('button[title*="Switch user"]'), { pauseAfter: 800 });

  // Switch to Bob Smith
  await glider.click(page.locator('button.w-full:has-text("Bob Smith")'), { pauseAfter: 1200 });

  // Scene 2: Shared with Me
  console.log("Scene 2: Inspecting Bob's shared documents...");
  await setCaptionBar(page, "Workspaces separated by ownership: Bob's shared documents", 2);
  await glider.click(page.locator('button:has-text("Shared with Me")'), { pauseAfter: 1500 });

  // Switch back to Danniel
  await glider.click(page.locator('button[title*="Switch user"]'), { pauseAfter: 600 });
  await glider.click(page.locator('button.w-full:has-text("Danniel Bacani")'), { pauseAfter: 1200 });

  // Scene 3: Document Creation & Renaming
  console.log("Scene 3: Creating a new document and renaming...");
  await setCaptionBar(page, "Creating new document with inline title synchronization", 3);
  await glider.click(page.locator('button:has-text("New Document")'), { pauseAfter: 500 });
  await page.waitForURL(/\/documents\//, { timeout: 10000 });
  await page.waitForTimeout(1200);

  const titleInput = page.locator('input[placeholder="Untitled Document"]');
  await glider.click(titleInput, { pauseAfter: 200 });
  await titleInput.fill("Engineering & Product Roadmap 2026");
  await page.waitForTimeout(800);

  // Scene 4: Rich-Text Formatting
  console.log("Scene 4: TipTap rich-text formatting with toolbar controls...");
  await setCaptionBar(page, "TipTap WYSIWYG editor: Headings, Bold, Italic & Lists", 4);
  const editor = page.locator(".tiptap");
  await glider.click(editor, { pauseAfter: 300 });

  await page.keyboard.type("Ajaia Collaborative Editor Overview");
  await page.waitForTimeout(400);

  // Apply Heading 1 with cursor
  await glider.click(page.locator('button[title="Heading 1"]'), { pauseAfter: 400 });
  await page.keyboard.press("Enter");

  // Type body paragraph
  await page.keyboard.type("This document demonstrates real-time formatting, persistence, and role-based sharing:");
  await page.keyboard.press("Enter");

  // Add bullet list with cursor
  await glider.click(page.locator('button[title="Bulleted List"]'), { pauseAfter: 400 });
  await page.keyboard.type("Rich-text formatting with Bold, Italic, and Underline");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Instant Markdown & plain text file ingestion");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Reliable debounced cloud persistence with PostgreSQL");
  await page.waitForTimeout(1500);

  // Scene 5: Persistence & Export
  console.log("Scene 5: Persistence and export...");
  await setCaptionBar(page, "Debounced cloud autosave (800ms) & single-click export", 5);
  await page.waitForTimeout(2000); // verify 'Saved at' badge
  await glider.click(page.locator('button[title="Download Markdown copy"]'), { pauseAfter: 1000 });

  // Return to Dashboard
  await glider.click(page.locator('a[title="Back to All Documents"]'), { pauseAfter: 500 });
  await page.waitForURL(baseUrl, { timeout: 10000 });
  await page.waitForTimeout(1200);

  // Scene 6: File Ingestion (Markdown Import)
  console.log("Scene 6: Ingesting markdown file...");
  await setCaptionBar(page, "File ingestion: Uploading Markdown (.md) into editable draft", 6);
  const sampleFilePath = path.resolve(__dirname, "../Sprint_Retrospective.md");
  const fileChooserPromise = page.waitForEvent("filechooser");

  const importBtn = page.locator('button:has-text("Import File")');
  await glider.click(importBtn, { pauseAfter: 300 });
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(sampleFilePath);

  // Wait for navigation into newly imported document
  await page.waitForURL(/\/documents\//, { timeout: 10000 });
  await page.waitForTimeout(1800);

  // Scene 7: Relational Sharing
  console.log("Scene 7: Sharing document with Bob Smith...");
  await setCaptionBar(page, "Relational sharing: Granting Bob Smith 'Can Edit' access", 7);
  await glider.click(page.locator('button:has-text("Share")'), { pauseAfter: 800 });

  // Click quick select button for Bob
  const bobBtn = page.locator('button:has-text("+Bob Smith")');
  if (await bobBtn.isVisible()) {
    await glider.click(bobBtn, { pauseAfter: 400 });
  } else {
    await page.fill('input[placeholder*="bob@ajaia.io"]', "bob@ajaia.io");
  }

  // Click submit share inside modal
  await glider.click(page.locator('form button[type="submit"]'), { pauseAfter: 1500 });

  // Copy document link
  await glider.click(page.locator('button:has-text("Copy Document Link")'), { pauseAfter: 600 });

  // Close modal
  await glider.click(page.locator('button:has-text("Done")'), { pauseAfter: 800 });

  // Back to dashboard
  await glider.click(page.locator('a[title="Back to All Documents"]'), { pauseAfter: 500 });
  await page.waitForURL(baseUrl, { timeout: 10000 });
  await page.waitForTimeout(1200);

  // Scene 8: Collaborator Perspective & Access Boundaries
  console.log("Scene 8: Switching to Bob to verify shared editing...");
  await setCaptionBar(page, "Bob Smith receives document in 'Shared with Me' and edits", 8);
  await glider.click(page.locator('button[title*="Switch user"]'), { pauseAfter: 600 });
  await glider.click(page.locator('button.w-full:has-text("Bob Smith")'), { pauseAfter: 1200 });

  await glider.click(page.locator('button:has-text("Shared with Me")'), { pauseAfter: 1500 });

  // Bob opens the newly shared imported document
  const firstDoc = page.locator('a[href*="/documents/"]').first();
  await glider.click(firstDoc, { pauseAfter: 500 });
  await page.waitForURL(/\/documents\//, { timeout: 10000 });
  await page.waitForTimeout(1500);

  // Bob adds an engineering collaborator note
  await glider.click(page.locator(".tiptap"), { pauseAfter: 300 });
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Reviewed and approved by Bob Smith (Collaborator).");
  await page.waitForTimeout(2500);

  console.log("Demo flow complete! Closing browser and saving video...");
  await page.close();
  await context.close();
  await browser.close();

  // Find saved webm video
  const files = fs.readdirSync(videoDir).filter((f) => f.endsWith(".webm"));
  if (files.length === 0) {
    throw new Error("No recorded video found in videos directory.");
  }

  const latestVideo = files.map((f) => path.join(videoDir, f)).sort()[files.length - 1];
  const finalMp4Path = path.resolve(__dirname, "../ajaia_walkthrough_demo.mp4");

  console.log(`Processing recorded footage with FFmpeg: ${latestVideo} -> ${finalMp4Path}`);

  // FFmpeg post-processing: convert to 1080p MP4 H.264
  const ffmpegCmd = `ffmpeg -y -i "${latestVideo}" -vf "scale=1920:1080:flags=lanczos,fps=30" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart "${finalMp4Path}"`;
  execSync(ffmpegCmd, { stdio: "inherit" });

  console.log(`\n Walkthrough video successfully generated with gliding cursor pointer & navy caption bar: ${finalMp4Path}`);
}

run().catch((err) => {
  console.error("Error generating demo video:", err);
  process.exit(1);
});
