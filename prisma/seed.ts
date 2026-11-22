import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data for reproducible seed
  await prisma.documentShare.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.user.deleteMany({});

  // Seed Personas
  const danniel = await prisma.user.create({
    data: {
      id: "user_danniel",
      name: "Danniel Bacani",
      email: "danniel@ajaia.io",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Danniel",
    },
  });

  const bob = await prisma.user.create({
    data: {
      id: "user_bob",
      name: "Bob Smith",
      email: "bob@ajaia.io",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    },
  });

  const charlie = await prisma.user.create({
    data: {
      id: "user_charlie",
      name: "Charlie Davis",
      email: "charlie@ajaia.io",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
    },
  });

  console.log("Created users:", { danniel: danniel.name, bob: bob.name, charlie: charlie.name });

  // Document 1: Danniel's Roadmap (Shared with Bob)
  await prisma.document.create({
    data: {
      id: "doc_roadmap",
      title: "Ajaia Product Roadmap Q1",
      content: `<h1>Ajaia Product Roadmap Q1</h1><p>Welcome to the <strong>internal collaborative document editor</strong> project. Authored by <strong>Danniel Bacani</strong>. Our primary mission is to empower internal teams to communicate and iterate quickly.</p><h2>Key Initiatives</h2><ul><li><strong>Rich-Text Editor:</strong> Lightweight ProseMirror/TipTap setup with full formatting control.</li><li><strong>Seamless Import:</strong> Drag-and-drop or upload <em>Markdown</em> and <em>plain text</em> files directly into drafts.</li><li><strong>Frictionless Sharing:</strong> Grant role-based access across team members without complex authentication hurdles.</li></ul><p>Please review and append any engineering considerations below.</p>`,
      ownerId: danniel.id,
      shares: {
        create: [
          {
            userId: bob.id,
            role: "EDITOR",
          },
        ],
      },
    },
  });

  // Document 2: Danniel's Private PRD
  await prisma.document.create({
    data: {
      id: "doc_prd",
      title: "Confidential: Q2 Product Strategy",
      content: `<h1>Q2 Product Strategy (Draft)</h1><p>This is a <u>private document</u> owned strictly by <strong>Danniel Bacani</strong> to demonstrate document privacy boundaries.</p><p>Collaborators without explicit permissions cannot see this document in their workspace.</p>`,
      ownerId: danniel.id,
    },
  });

  // Document 3: Bob's Engineering Architecture (Shared with Danniel)
  await prisma.document.create({
    data: {
      id: "doc_architecture",
      title: "Engineering Architecture & Tradeoffs",
      content: `<h1>Engineering Architecture & Tradeoffs</h1><p>Authored by <strong>Bob Smith</strong>.</p><h2>Design Principles</h2><ol><li><strong>Debounced Cloud Persistence:</strong> Ensures reliable state recovery after every edit without hammering the API.</li><li><strong>Relational Access Control:</strong> Explicit ownership and sharing relations managed in PostgreSQL.</li><li><strong>Component Modularity:</strong> Clean separation between editor state, toolbar actions, and file import parsers.</li></ol>`,
      ownerId: bob.id,
      shares: {
        create: [
          {
            userId: danniel.id,
            role: "VIEWER",
          },
        ],
      },
    },
  });

  console.log("Database seeded successfully with initial documents and shares.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
