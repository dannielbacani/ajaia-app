import { chromium, Page } from "playwright";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

async function setCaption(page: Page, title: string, subtitle?: string) {
  try {
    await page.evaluate(
      ({ title, subtitle }: { title: string; subtitle?: string }) => {
        let el = document.getElementById("demo-caption-banner");
        if (!el) {
          el = document.createElement("div");
          el.id = "demo-caption-banner";
          el.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.94);
            backdrop-filter: blur(8px);
            color: #ffffff;
            padding: 10px 24px;
            border-radius: 9999px;
            z-index: 999999;
            box-shadow: 0 10px 30px rgba(0,0,0,0.35);
            border: 1px solid rgba(255, 255, 255, 0.2);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            pointer-events: none;
            transition: all 0.25s ease-in-out;
          `;
          document.body.appendChild(el);
        }
        el.innerHTML = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">${title}</div>
          ${
            subtitle
              ? `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 500; color: #93c5fd; margin-top: 2px;">${subtitle}</div>`
              : ""
          }
        `;
      },
      { title, subtitle }
    );
  } catch (err) {
    // ignore if evaluating during page navigation
  }
}

async function run() {
  const videoDir = path.resolve(__dirname, "../videos");
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  console.log("Launching Chrome to record actual product demo with lower-third captions...");
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

  const page = await context.newPage();
  const baseUrl = "https://ajaia-app-ruddy.vercel.app";

  console.log(`Navigating to ${baseUrl}...`);
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Scene 1: Welcome & Persona Switcher
  console.log("Scene 1: Persona switching and dashboard inspection...");
  await setCaption(
    page,
    "Ajaia Docs — AI-Native Collaborative Editor",
    "Live Walkthrough by Danniel Bacani"
  );
  await page.waitForTimeout(2500);

  await setCaption(
    page,
    "Reviewer Persona Switcher",
    "1-Click persona switching to evaluate cross-user permissions without registration barriers"
  );
  await page.click('button[title*="Switch user"]');
  await page.waitForTimeout(1200);

  // Switch to Bob Smith
  await page.click('button:has-text("Bob Smith")');
  await page.waitForTimeout(1500);

  // Switch to 'Shared with Me' tab
  await setCaption(
    page,
    "Workspaces Separated by Ownership",
    "Inspecting Bob Smith's 'Shared with Me' documents"
  );
  await page.click('button:has-text("Shared with Me")');
  await page.waitForTimeout(2000);

  // Switch back to Danniel
  await page.click('button[title*="Switch user"]');
  await page.waitForTimeout(800);
  await page.click('button:has-text("Danniel Bacani")');
  await page.waitForTimeout(1500);

  // Scene 2: Document Creation & Rich Text
  console.log("Scene 2: Creating a new document and editing rich-text...");
  await setCaption(
    page,
    "Document Creation & TipTap Editor",
    "Full WYSIWYG editor with Heading 1-3, Bold, Italic, Underline & Lists"
  );
  await page.click('button:has-text("New Document")');
  await page.waitForURL(/\/documents\//, { timeout: 10000 });
  await page.waitForTimeout(1500);

  await setCaption(
    page,
    "Inline Document Renaming",
    "Immediate title synchronization across the collaborative workspace"
  );
  const titleInput = page.locator('input[placeholder="Untitled Document"]');
  await titleInput.fill("Engineering & Product Roadmap 2026");
  await page.waitForTimeout(1000);

  // Click editor canvas and type content
  await setCaption(
    page,
    "TipTap Rich-Text Formatting",
    "Applying Headings, styled lists, and keyboard-driven text formatting"
  );
  const editor = page.locator(".tiptap");
  await editor.click();
  await page.keyboard.type("Ajaia Collaborative Editor Overview");
  await page.waitForTimeout(500);

  // Apply Heading 1
  await page.click('button[title="Heading 1"]');
  await page.waitForTimeout(500);
  await page.keyboard.press("Enter");

  // Type body paragraph
  await page.keyboard.type(
    "This document demonstrates real-time formatting, persistence, and role-based sharing:"
  );
  await page.keyboard.press("Enter");

  // Add bullet list items
  await page.click('button[title="Bulleted List"]');
  await page.waitForTimeout(500);
  await page.keyboard.type("Rich-text formatting with Bold, Italic, and Underline");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Instant Markdown & plain text file ingestion");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Reliable debounced cloud persistence with PostgreSQL");
  await page.waitForTimeout(2000);

  // Scene 3: Verify Autosave
  console.log("Scene 3: Verifying autosave status...");
  await setCaption(
    page,
    "Cloud Persistence Engine",
    "Debounced 800ms autosave to Neon PostgreSQL with real-time status badge"
  );
  await page.waitForTimeout(3000);

  // Scene 4: Test Export
  console.log("Scene 4: Exporting document...");
  await setCaption(
    page,
    "Document Export",
    "Single-click export to Markdown (.md) or HTML format"
  );
  await page.click('button[title="Download Markdown copy"]');
  await page.waitForTimeout(1500);

  // Return to Dashboard
  await page.click('a[title="Back to All Documents"]');
  await page.waitForURL(baseUrl, { timeout: 10000 });
  await page.waitForTimeout(1500);

  // Scene 5: Test File Import
  console.log("Scene 5: Ingesting markdown file...");
  await setCaption(
    page,
    "File Ingestion Engine",
    "Upload Markdown (.md) or Plain Text (.txt) to convert into an editable document"
  );
  const sampleFilePath = path.resolve(__dirname, "../Sprint_Retrospective.md");
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.click('button:has-text("Import File")');
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(sampleFilePath);

  // Wait for navigation into newly imported document
  await page.waitForURL(/\/documents\//, { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Scene 6: Sharing Flow
  console.log("Scene 6: Sharing document with Bob Smith...");
  await setCaption(
    page,
    "Relational Access Control & Sharing",
    "Danniel grants Bob Smith 'Can Edit' collaborator permissions"
  );
  await page.click('button:has-text("Share")');
  await page.waitForTimeout(1000);

  // Click quick select button for Bob
  const bobBtn = page.locator('button:has-text("+Bob Smith")');
  if (await bobBtn.isVisible()) {
    await bobBtn.click();
    await page.waitForTimeout(500);
  } else {
    await page.fill('input[placeholder*="bob@ajaia.io"]', "bob@ajaia.io");
  }

  // Click submit share inside modal
  await page.click('form button[type="submit"]');
  await page.waitForTimeout(2000);

  // Copy document link
  await page.click('button:has-text("Copy Document Link")');
  await page.waitForTimeout(1000);

  // Close modal
  await page.click('button:has-text("Done")');
  await page.waitForTimeout(1000);

  // Back to dashboard
  await page.click('a[title="Back to All Documents"]');
  await page.waitForURL(baseUrl, { timeout: 10000 });
  await page.waitForTimeout(1500);

  // Scene 7: Verify from Bob's perspective
  console.log("Scene 7: Switching to Bob to verify shared access...");
  await setCaption(
    page,
    "Cross-User Verification: Bob Smith",
    "Bob receives the shared document in 'Shared with Me' with Editor privileges"
  );
  await page.click('button[title*="Switch user"]');
  await page.waitForTimeout(800);
  await page.click('button:has-text("Bob Smith")');
  await page.waitForTimeout(1500);

  await page.click('button:has-text("Shared with Me")');
  await page.waitForTimeout(2000);

  // Bob opens the newly shared imported document
  await page.locator('a[href*="/documents/"]').first().click();
  await page.waitForURL(/\/documents\//, { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Bob adds an engineering collaborator note
  await setCaption(
    page,
    "Collaborative Editing",
    "Bob contributes an engineering note directly into the shared draft"
  );
  await page.locator(".tiptap").click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Reviewed and approved by Bob Smith (Collaborator).");
  await page.waitForTimeout(2500);

  // Return to dashboard
  await page.click('a[title="Back to All Documents"]');
  await page.waitForURL(baseUrl, { timeout: 10000 });
  await page.waitForTimeout(1500);

  // Scene 8: Verify Charlie (Unauthorized access boundary)
  console.log("Scene 8: Access control check for Charlie...");
  await setCaption(
    page,
    "Strict Permission Boundaries",
    "Charlie Davis has zero access to private documents or unshared drafts"
  );
  await page.click('button[title*="Switch user"]');
  await page.waitForTimeout(800);
  await page.click('button:has-text("Charlie Davis")');
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

  // FFmpeg post-processing: convert to 1080p MP4 H.264 with crisp scaling and clean frame pacing
  const ffmpegCmd = `ffmpeg -y -i "${latestVideo}" -vf "scale=1920:1080:flags=lanczos,fps=30" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart "${finalMp4Path}"`;
  execSync(ffmpegCmd, { stdio: "inherit" });

  console.log(`\n Walkthrough video successfully generated with burned-in lower-third captions: ${finalMp4Path}`);
}

run().catch((err) => {
  console.error("Error generating demo video:", err);
  process.exit(1);
});
