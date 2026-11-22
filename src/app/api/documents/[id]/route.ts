import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  try {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    let currentUserRole: "OWNER" | "EDITOR" | "VIEWER" | null = null;
    if (userId) {
      if (document.ownerId === userId) {
        currentUserRole = "OWNER";
      } else {
        const share = document.shares.find((s) => s.userId === userId);
        if (share) {
          currentUserRole = share.role as "EDITOR" | "VIEWER";
        }
      }
    }

    if (!currentUserRole) {
      return NextResponse.json(
        { error: "Access denied. You do not have permission to view this document." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ...document,
      currentUserRole,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { title, content, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required to edit document" }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: { shares: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const isOwner = document.ownerId === userId;
    const share = document.shares.find((s) => s.userId === userId);
    const canEdit = isOwner || share?.role === "EDITOR";

    if (!canEdit) {
      return NextResponse.json(
        { error: "Access denied. You do not have edit permission for this document." },
        { status: 403 }
      );
    }

    const updateData: { title?: string; content?: string } = {};
    if (typeof title === "string") updateData.title = title.trim() || "Untitled Document";
    if (typeof content === "string") updateData.content = content;

    const updated = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  try {
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only the document owner can delete this document." },
        { status: 403 }
      );
    }

    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Document deleted" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
