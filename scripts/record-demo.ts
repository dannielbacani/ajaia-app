import { chromium, Page, Locator } from "playwright";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const BASE = "https://ajaia-app-ruddy.vercel.app";
const scenes: { id: string; caption: string; text: string }[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "scenes.json"), "utf8")
);
const { pad, durations } = JSON.parse(
  fs.readFileSync(path.join(__dirname, "durations.json"), "utf8")
) as { pad: number; durations: Record<string, number> };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const BAR = 48;

// Cursor + click ripple (house style from the pr-demo-video skill)
const CURSOR_JS = `(() => {
  if (window.__demoCursor) return;
  window.__demoCursor = true;
  const mount = () => {
    const c = document.createElement('div');
    c.id = '__demo_cursor';
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M3 2v17l4.6-4.3 3 6.8 2.8-1.2-3-6.6H17z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-200px,-200px);filter:drop-shadow(0 1px 3px rgba(0,0,0,.4))';
    document.documentElement.appendChild(c);
    addEventListener('mousemove', (e) => { c.style.transform = 'translate(' + (e.clientX - 3) + 'px,' + (e.clientY - 2) + 'px)'; }, true);
    addEventListener('mousedown', (e) => {
      const r = document.createElement('div');
      r.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;width:44px;height:44px;border-radius:50%;border:3px solid #342EDC;background:rgba(52,46,220,.2);left:' + (e.clientX - 22) + 'px;top:' + (e.clientY - 22) + 'px;transform:scale(.3);opacity:1;transition:transform .45s ease-out,opacity .45s ease-out';
      document.documentElement.appendChild(r);
      requestAnimationFrame(() => requestAnimationFrame(() => { r.style.transform = 'scale(1.4)'; r.style.opacity = '0'; }));
      setTimeout(() => r.remove(), 600);
    }, true);
  };
  if (document.documentElement) mount(); else addEventListener('DOMContentLoaded', mount);
})()`;

const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

class Glider {
  x = 640;
  y = 360;
  constructor(private page: Page) {}
  async moveTo(tx: number, ty: number) {
    const { x: fx, y: fy } = this;
    const ms = Math.min(750, Math.max(220, Math.hypot(tx - fx, ty - fy) * 0.6));
    const steps = Math.max(10, Math.round(ms / 16));
    for (let i = 1; i <= steps; i++) {
      const k = ease(i / steps);
      await this.page.mouse.move(fx + (tx - fx) * k, fy + (ty - fy) * k);
      await sleep(ms / steps);
    }
    this.x = tx;
    this.y = ty;
  }
  async click(loc: Locator, pauseAfter = 350) {
    const target = loc.first();
    const box = await target.boundingBox();
    if (!box) return target.click();
    await this.moveTo(box.x + box.width / 2, box.y + box.height / 2);
    await sleep(120);
    await this.page.mouse.down();
    await sleep(80);
    await this.page.mouse.up();
    await sleep(pauseAfter);
  }
}

let current = { caption: "", n: 0 };
async function renderBar(page: Page) {
  await page
    .evaluate(
      ({ caption, tag, bar }) => {
        document.body.style.paddingBottom = bar + "px";
        let el = document.getElementById("demo-bottom-bar");
        if (!el) {
          el = document.createElement("div");
          el.id = "demo-bottom-bar";
          el.style.cssText = `position:fixed;bottom:0;left:0;width:100%;height:${bar}px;background:#1A1B3A;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 28px;z-index:2147483640;pointer-events:none;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;`;
          document.body.appendChild(el);
        }
        el.innerHTML = `<div style="font-size:17px;font-weight:700">${caption}</div><div style="font-size:14px;font-weight:600;color:#B0B4E6">${tag}</div>`;
      },
      { caption: current.caption, tag: `AJAIA DOCS · ${current.n}/${scenes.length}`, bar: BAR }
    )
    .catch(() => undefined);
}

async function showSlide(page: Page, title: string, bullets: string[], dur: number) {
  await page.evaluate(
    ({ title, bullets, dur }) => {
      document.getElementById("demo-slide")?.remove();
      const d = document.createElement("div");
      d.id = "demo-slide";
      d.style.cssText =
        'position:fixed;inset:0;z-index:2147483000;background:linear-gradient(135deg,#1A1B3A 0%,#2B2E7A 100%);color:#fff;display:flex;flex-direction:column;justify-content:center;padding:0 100px 48px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;';
      const step = (dur * 0.75) / (bullets.length + 1);
      d.innerHTML =
        `<div style="font-size:14px;letter-spacing:.14em;color:#B0B4E6;font-weight:700;margin-bottom:12px">AJAIA DOCS · WALKTHROUGH</div>` +
        `<h1 style="font-size:42px;margin:0 0 30px;font-weight:800">${title}</h1><ul style="list-style:none;padding:0;margin:0">` +
        bullets
          .map(
            (b, i) =>
              `<li style="font-size:23px;line-height:1.35;margin:0 0 14px;padding-left:28px;position:relative;opacity:0;transform:translateY(8px);transition:opacity .5s ease ${(i + 1) * step}s,transform .5s ease ${(i + 1) * step}s"><span style="position:absolute;left:0;color:#7C77FF">▸</span>${b}</li>`
          )
          .join("") +
        `</ul>`;
      document.body.appendChild(d);
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          d.querySelectorAll("li").forEach((li) => {
            (li as HTMLElement).style.opacity = "1";
            (li as HTMLElement).style.transform = "none";
          })
        )
      );
    },
    { title, bullets, dur }
  );
}
const hideSlide = (page: Page) => page.evaluate(() => document.getElementById("demo-slide")?.remove());

async function run() {
  const videoDir = path.join(ROOT, "videos");
  fs.rmSync(videoDir, { recursive: true, force: true });
  fs.mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  // 1280x720 keeps true 16:9 (no stretching) and large, readable UI text.
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
  });
  await context.addInitScript(CURSOR_JS);

  const t0 = Date.now();
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const g = new Glider(page);
  const starts: Record<string, number> = {};

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.mouse.move(640, 360);
  await sleep(500);

  const persona = () => g.click(page.locator('button[title*="Switch user"]'), 700);
  const pick = (name: string) => g.click(page.locator(`button.w-full:has-text("${name}")`), 1000);
  const toDashboard = async () => {
    await g.click(page.locator('a[title="Back to All Documents"]'), 400);
    await page.waitForURL((u) => u.pathname === "/");
    await renderBar(page);
    await sleep(900);
  };
  const tool = (title: string) => g.click(page.locator(`button[title="${title}"]`), 250);
  const type = (text: string) => page.keyboard.type(text, { delay: 28 });

  const actions: Record<string, (dur: number) => Promise<void>> = {
    s01: async (d) => {
      await showSlide(
        page,
        "Ajaia Docs: collaborative document editor",
        [
          "Create, rename, edit and reopen documents",
          "Rich text with TipTap · autosave to Postgres",
          "Upload .md / .txt · share with Editor or Viewer roles",
          "Next.js · Prisma · Neon Postgres · Vercel (live)",
        ],
        d
      );
    },
    s02: async () => {
      await hideSlide(page);
      await persona();
      await pick("Bob Smith");
      await g.click(page.locator('button:has-text("Shared with Me")'), 2500);
      await persona();
      await pick("Danniel Bacani");
      await g.click(page.locator('button:has-text("Owned by Me")'), 1500);
    },
    s03: async () => {
      await g.click(page.locator('button:has-text("New Document")'), 500);
      await page.waitForURL(/\/documents\//);
      await renderBar(page);
      await sleep(1000);
      const title = page.locator('input[placeholder="Untitled Document"]');
      await g.click(title, 200);
      await title.fill("");
      await title.pressSequentially("Q3 Launch Plan", { delay: 55 });
      await sleep(800);
    },
    s04: async () => {
      await g.click(page.locator(".tiptap"), 300);
      await tool("Heading 1");
      await type("Q3 Launch Plan");
      await page.keyboard.press("Enter");
      await tool("Heading 2");
      await type("Goals");
      await page.keyboard.press("Enter");
      await type("We will ship the ");
      await tool("Bold (Ctrl+B)");
      await type("editor");
      await tool("Bold (Ctrl+B)");
      await type(" with ");
      await tool("Italic (Ctrl+I)");
      await type("rich text");
      await tool("Italic (Ctrl+I)");
      await type(" and ");
      await tool("Underline (Ctrl+U)");
      await type("sharing");
      await tool("Underline (Ctrl+U)");
      await type(" support.");
      await page.keyboard.press("Enter");
      await tool("Bulleted List");
      await type("Create and rename documents");
      await page.keyboard.press("Enter");
      await type("Import Markdown files");
      await page.keyboard.press("Enter");
      await page.keyboard.press("Enter");
      await tool("Numbered List");
      await type("Share with teammates");
      await page.keyboard.press("Enter");
      await type("Review together");
    },
    s05: async () => {
      await sleep(2500);
      await page.reload({ waitUntil: "networkidle" });
      await renderBar(page);
      await page.locator(".tiptap h1").first().waitFor();
      await sleep(2500);
      await g.click(page.locator('button[title="Download Markdown copy"]'), 1000);
    },
    s06: async () => {
      await toDashboard();
      const chooser = page.waitForEvent("filechooser");
      await g.click(page.locator('button:has-text("Import File")'), 300);
      await (await chooser).setFiles(path.join(ROOT, "Sprint_Retrospective.md"));
      await page.waitForURL(/\/documents\//);
      await renderBar(page);
      await page.locator(".tiptap h1").first().waitFor();
      await sleep(2500);
    },
    s07: async () => {
      await g.click(page.locator('button:has-text("Share")'), 900);
      await g.click(page.locator('button:has-text("+Bob Smith")'), 500);
      await g.click(page.locator('form button[type="submit"]'), 2000);
      await g.click(page.locator('button:has-text("Done")'), 600);
    },
    s08: async () => {
      await toDashboard();
      await persona();
      await pick("Bob Smith");
      await g.click(page.locator('button:has-text("Shared with Me")'), 1800);
      await g.click(page.locator('a:has-text("Sprint Retrospective")'), 500);
      await page.waitForURL(/\/documents\//);
      await renderBar(page);
      await page.locator(".tiptap h1").first().waitFor();
      await sleep(1000);
      await g.click(page.locator(".tiptap"), 300);
      await page.keyboard.press("ControlOrMeta+ArrowDown");
      await page.keyboard.press("Enter");
      await type("Reviewed and approved by Bob Smith.");
      await sleep(1500);
    },
    s09: async () => {
      await persona();
      await pick("Danniel Bacani");
      await page.goto(`${BASE}/documents/doc_architecture`, { waitUntil: "networkidle" });
      await renderBar(page);
      await page.locator(".tiptap h1").first().waitFor();
      await sleep(3500);
      await persona();
      await pick("Charlie Davis");
      await sleep(3000);
    },
    s10: async (d) => {
      await showSlide(
        page,
        "What works end to end",
        [
          "Create, rename, edit with rich text · autosave · survives refresh",
          "Import .md / .txt into a new editable document",
          "Share as Editor or Viewer · owned vs shared views",
          "Server-side access checks (403) · 7 automated tests",
          "Live on Vercel + Neon Postgres, seeded test users",
        ],
        d
      );
    },
    s11: async (d) => {
      await showSlide(
        page,
        "Intentionally deprioritized",
        [
          "Real-time multi-user editing (CRDTs): edits are last-write-wins",
          "Real authentication: seeded personas instead",
          "Word / PDF import: only .md and .txt",
          "Comments and version history",
          "Next with 2-4 hours: presence, version history, real sign-in",
        ],
        d
      );
    },
    s12: async (d) => {
      await showSlide(
        page,
        "Key implementation decisions",
        [
          "TipTap (ProseMirror) instead of a custom editor",
          "Content stored as HTML in Postgres via Prisma",
          "Relational sharing: one row per document + user, roles enforced in API",
          "Debounced REST autosave instead of WebSockets",
        ],
        d
      );
    },
    s13: async (d) => {
      await showSlide(
        page,
        "How AI supported my workflow",
        [
          "Antigravity: scaffolding, Prisma schema + seed, TipTap toolbar, tests",
          "Scripted this recording with Playwright + FFmpeg",
          "Rejected: WebSockets / CRDTs (too heavy for the timebox)",
          "Fixed: experimental Next.js config that broke the build",
          "Verified with tests, live deployment, per-persona manual checks",
        ],
        d
      );
    },
    s14: async (d) => {
      await showSlide(
        page,
        "Thanks for watching",
        [
          "Live app: ajaia-app-ruddy.vercel.app",
          "Test users: Danniel, Bob, Charlie (top-right switcher)",
          "README, architecture note, AI workflow note in the folder",
        ],
        d
      );
    },
  };

  scenes.forEach(() => undefined);
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    const dur = durations[sc.id];
    current = { caption: sc.caption, n: i + 1 };
    starts[sc.id] = (Date.now() - t0) / 1000; // narration begins here
    await renderBar(page);
    const began = Date.now();
    console.log(`${sc.id} @ ${starts[sc.id].toFixed(1)}s (audio ${dur.toFixed(1)}s)`);
    await actions[sc.id](dur);
    const remaining = dur + pad - (Date.now() - began) / 1000;
    if (remaining > 0) await sleep(remaining * 1000);
  }
  await sleep(1500); // tail so the last sentence is never clipped

  await page.close();
  await context.close();
  await browser.close();

  // Trim the page-load lead-in so narration starts ~0.5s into the video.
  const offset = Math.max(0, starts.s01 - 0.5);
  const adjusted: Record<string, number> = {};
  for (const k of Object.keys(starts)) adjusted[k] = +(starts[k] - offset).toFixed(3);
  fs.writeFileSync(path.join(__dirname, "scene_starts.json"), JSON.stringify(adjusted, null, 2));

  const webm = fs
    .readdirSync(videoDir)
    .filter((f) => f.endsWith(".webm"))
    .map((f) => path.join(videoDir, f))[0];
  const silent = path.join(videoDir, "silent.mp4");
  execSync(
    `ffmpeg -y -ss ${offset.toFixed(3)} -i "${webm}" -vf "scale=1920:1080:flags=lanczos,fps=30" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart "${silent}"`,
    { stdio: "ignore" }
  );
  console.log(`Silent video: ${silent} (trimmed ${offset.toFixed(2)}s)`);
}

run().catch((e) => {
  console.error("Recording failed:", e);
  process.exit(1);
});
