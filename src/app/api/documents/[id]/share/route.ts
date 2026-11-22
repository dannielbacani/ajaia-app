import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { ownerId, targetEmail, role } = body;

    if (!ownerId || !targetEmail) {
      return NextResponse.json(
        { error: "ownerId and targetEmail are required" },
        { status: 400 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.ownerId !== ownerId) {
      return NextResponse.json(
        { error: "Only the document owner can manage collaborators" },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail.toLowerCase().trim() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: `User with email "${targetEmail}" was not found. Available personas: danniel@ajaia.io, bob@ajaia.io, charlie@ajaia.io` },
        { status: 404 }
      );
    }

    if (targetUser.id === document.ownerId) {
      return NextResponse.json(
        { error: "You are already the owner of this document." },
        { status: 400 }
      );
    }

    const shareRole = role === "VIEWER" ? "VIEWER" : "EDITOR";

    await prisma.documentShare.upsert({
      where: {
        documentId_userId: {
          documentId: id,
          userId: targetUser.id,
        },
      },
      create: {
        documentId: id,
        userId: targetUser.id,
        role: shareRole,
      },
      update: {
        role: shareRole,
      },
    });

    const updatedShares = await prisma.documentShare.findMany({
      where: { documentId: id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return NextResponse.json({ success: true, shares: updatedShares });
  } catch (error) {
    console.error("Error updating document shares:", error);
    return NextResponse.json({ error: "Failed to update sharing settings" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("ownerId");
  const targetUserId = searchParams.get("targetUserId");

  if (!ownerId || !targetUserId) {
    return NextResponse.json(
      { error: "ownerId and targetUserId parameters are required" },
      { status: 400 }
    );
  }

  try {
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.ownerId !== ownerId) {
      return NextResponse.json(
        { error: "Only the document owner can remove collaborators" },
        { status: 403 }
      );
    }

    await prisma.documentShare.deleteMany({
      where: {
        documentId: id,
        userId: targetUserId,
      },
    });

    const updatedShares = await prisma.documentShare.findMany({
      where: { documentId: id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return NextResponse.json({ success: true, shares: updatedShares });
  } catch (error) {
    console.error("Error removing collaborator:", error);
    return NextResponse.json({ error: "Failed to remove collaborator" }, { status: 500 });
  }
}
