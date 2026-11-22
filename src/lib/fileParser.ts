import { marked } from "marked";

export interface ParsedFile {
  title: string;
  html: string;
}

/**
 * Parses uploaded text or markdown content into an editable document title and HTML structure.
 */
export function parseFileContent(fileName: string, rawContent: string): ParsedFile {
  // Strip extension for document title
  const cleanTitle = fileName
    .replace(/\.(md|txt|markdown)$/i, "")
    .replace(/[-_]+/g, " ")
    .trim() || "Imported Document";

  const lowerName = fileName.toLowerCase();
  const isMarkdown = lowerName.endsWith(".md") || lowerName.endsWith(".markdown");

  let html: string;

  if (isMarkdown) {
    // Synchronously parse markdown to HTML
    const parsed = marked.parse(rawContent, { async: false });
    html = typeof parsed === "string" ? parsed : rawContent;
  } else {
    // Plain text: split by double newlines into paragraphs, preserve single breaks
    const paragraphs = rawContent
      .split(/\r?\n\r?\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map((p) => `<p>${p.replace(/\r?\n/g, "<br />")}</p>`)
      .join("");

    html = paragraphs.length > 0 ? paragraphs : "<p></p>";
  }

  return {
    title: cleanTitle,
    html: html.trim(),
  };
}
