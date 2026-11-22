import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
  }

  try {
    const owned = await prisma.document.findMany({
      where: { ownerId: userId },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const sharedEntries = await prisma.documentShare.findMany({
      where: { userId },
      include: {
        document: {
          include: {
            owner: { select: { id: true, name: true, email: true, avatar: true } },
            shares: {
              include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
              },
            },
          },
        },
      },
      orderBy: { document: { updatedAt: "desc" } },
    });

    const shared = sharedEntries.map((entry) => ({
      ...entry.document,
      currentUserRole: entry.role,
    }));

    return NextResponse.json({ owned, shared });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, ownerId } = body;

    if (!ownerId) {
      return NextResponse.json({ error: "ownerId is required" }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        title: title?.trim() || "Untitled Document",
        content: content || "<p></p>",
        ownerId,
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        shares: true,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
