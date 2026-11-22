import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFileContent } from "@/lib/fileParser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const ownerId = formData.get("ownerId") as string | null;

    if (!file || !ownerId) {
      return NextResponse.json(
        { error: "Both 'file' and 'ownerId' are required." },
        { status: 400 }
      );
    }

    const fileName = file.name || "Imported Document.txt";
    const allowedExtensions = [".md", ".markdown", ".txt"];
    const hasValidExtension = allowedExtensions.some((ext) =>
      fileName.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      return NextResponse.json(
        { error: "Unsupported file type. Only .md and .txt files are supported for import." },
        { status: 400 }
      );
    }

    const rawContent = await file.text();
    const { title, html } = parseFileContent(fileName, rawContent);

    const document = await prisma.document.create({
      data: {
        title,
        content: html,
        ownerId,
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        shares: true,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error importing file:", error);
    return NextResponse.json({ error: "Failed to process and import file" }, { status: 500 });
  }
}
