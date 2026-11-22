import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

async function run() {
  const videoDir = path.resolve(__dirname, "../videos");
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  console.log("Launching Chrome to record actual product demo...");
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, // running headless with video recording
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
  await page.waitForTimeout(2000);

  // 1. Show Dashboard & Persona Switcher
  console.log("Scene 1: Persona switching and dashboard inspection...");
  // Open Persona dropdown
  await page.click('button[title*="Switch user"]');
  await page.waitForTimeout(1000);
  // Switch to Bob
  await page.click('button:has-text("Bob Smith")');
  await page.waitForTimeout(2000);

  // Switch to 'Shared with Me' tab
  await page.click('button:has-text("Shared with Me")');
  await page.waitForTimeout(2000);

  // Switch back to Danniel
  await page.click('button[title*="Switch user"]');
  await page.waitForTimeout(800);
  await page.click('button:has-text("Danniel Bacani")');
  await page.waitForTimeout(1500);

  // 2. Document Creation & Editing
  console.log("Scene 2: Creating a new document and editing rich-text...");
  await page.click('button:has-text("New Document")');
  await page.waitForURL(/\/documents\//, { timeout: 10000 });
  await page.waitForTimeout(1500);

  // Rename title
  const titleInput = page.locator('input[placeholder="Untitled Document"]');
  await titleInput.fill("Engineering & Product Roadmap 2026");
  await page.waitForTimeout(1000);

  // Click editor canvas and type content
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

  // 3. Verify Autosave
  console.log("Scene 3: Verifying autosave status...");
  await page.waitForTimeout(2500); // Give autosave time to show 'Saved at ...'

  // 4. Test Export
  console.log("Scene 4: Exporting document...");
  await page.click('button[title="Download Markdown copy"]');
  await page.waitForTimeout(1000);

  // Return to Dashboard
  await page.click('a[title="Back to All Documents"]');
  await page.waitForURL(baseUrl, { timeout: 10000 });
  await page.waitForTimeout(2000);

  // 5. Test File Import
  console.log("Scene 5: Ingesting markdown file...");
  const sampleFilePath = path.resolve(__dirname, "../Sprint_Retrospective.md");
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.click('button:has-text("Import File")');
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(sampleFilePath);

  // Wait for navigation into newly imported document
  await page.waitForURL(/\/documents\//, { timeout: 10000 });
  await page.waitForTimeout(2000);

  // 6. Sharing Flow
  console.log("Scene 6: Sharing document with Bob Smith...");
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

  // 7. Verify from Bob's perspective
  console.log("Scene 7: Switching to Bob to verify shared access...");
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
  await page.locator(".tiptap").click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Reviewed and approved by Bob Smith (Collaborator).");
  await page.waitForTimeout(2500);

  // Return to dashboard
  await page.click('a[title="Back to All Documents"]');
  await page.waitForURL(baseUrl, { timeout: 10000 });
  await page.waitForTimeout(1500);

  // 8. Verify Charlie (Unauthorized access boundary)
  console.log("Scene 8: Access control check for Charlie...");
  await page.click('button[title*="Switch user"]');
  await page.waitForTimeout(800);
  await page.click('button:has-text("Charlie Davis")');
  await page.waitForTimeout(2000);

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
  const ffmpegCmd = `ffmpeg -y -i "${latestVideo}" -vf "scale=1920:1080:flags=lanczos,fps=30" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart "${finalMp4Path}"`;
  execSync(ffmpegCmd, { stdio: "inherit" });

  console.log(`\n Walkthrough video successfully generated: ${finalMp4Path}`);
}

run().catch((err) => {
  console.error("Error generating demo video:", err);
  process.exit(1);
});
