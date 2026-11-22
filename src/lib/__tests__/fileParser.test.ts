import { describe, it, expect } from "vitest";
import { parseFileContent } from "../fileParser";

describe("parseFileContent", () => {
  it("should extract clean title and parse Markdown into formatted HTML", () => {
    const rawMarkdown = `# Project Roadmap

This is a **bold statement** with a list:
* Feature Alpha
* Feature Beta
`;

    const result = parseFileContent("q1_roadmap_final.md", rawMarkdown);

    expect(result.title).toBe("q1 roadmap final");
    expect(result.html).toContain("<h1");
    expect(result.html).toContain("Project Roadmap");
    expect(result.html).toContain("<strong>bold statement</strong>");
    expect(result.html).toContain("<ul>");
    expect(result.html).toContain("<li>Feature Alpha</li>");
  });

  it("should correctly handle plain text files into paragraph tags", () => {
    const rawText = `First paragraph of plain text.

Second paragraph of text.`;

    const result = parseFileContent("meeting-notes.txt", rawText);

    expect(result.title).toBe("meeting notes");
    expect(result.html).toBe(
      "<p>First paragraph of plain text.</p><p>Second paragraph of text.</p>"
    );
  });

  it("should provide fallback title if file name is empty or extension-only", () => {
    const result = parseFileContent(".md", "Some notes");
    expect(result.title).toBe("Imported Document");
  });
});
