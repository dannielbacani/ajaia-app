"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useCurrentUser, User } from "@/context/UserContext";
import { EditorToolbar } from "./EditorToolbar";
import { ShareModal } from "./ShareModal";
import {
  ArrowLeft,
  Cloud,
  CloudCheck,
  Loader2,
  Users,
  Download,
  AlertTriangle,
  FileText,
  Lock,
} from "lucide-react";

interface ShareItem {
  id: string;
  role: string;
  user: User;
}

interface DocumentData {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  owner: User;
  shares: ShareItem[];
  currentUserRole: "OWNER" | "EDITOR" | "VIEWER";
  updatedAt: string;
}

type SaveState = "saved" | "saving" | "unsaved" | "error";

export function DocumentEditor({ documentId }: { documentId: string }) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [title, setTitle] = useState("Untitled Document");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestContentRef = useRef<string>("");

  // Determine permissions
  const isOwner = doc?.currentUserRole === "OWNER";
  const canEdit = doc?.currentUserRole === "OWNER" || doc?.currentUserRole === "EDITOR";

  // TipTap Editor instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Write your thoughts, notes, or documentation here...",
      }),
    ],
    content: "",
    editable: canEdit,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (!canEdit) return;
      const html = editor.getHTML();
      latestContentRef.current = html;
      triggerAutosave();
    },
  });

  // Fetch Document
  const fetchDoc = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingDoc(true);
    setAccessDenied(false);

    try {
      const res = await fetch(`/api/documents/${documentId}?userId=${currentUser.id}`);
      if (res.status === 403) {
        setAccessDenied(true);
        setIsLoadingDoc(false);
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load document");
      }

      const data: DocumentData = await res.json();
      setDoc(data);
      setTitle(data.title);
      latestContentRef.current = data.content;

      if (editor) {
        editor.commands.setContent(data.content);
        editor.setEditable(data.currentUserRole === "OWNER" || data.currentUserRole === "EDITOR");
      }
      setLastSavedTime(
        new Date(data.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch (err) {
      console.error("Error loading document:", err);
    } finally {
      setIsLoadingDoc(false);
    }
  }, [documentId, currentUser, editor]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  // Synchronize editor content if doc arrives after editor initialized
  useEffect(() => {
    if (editor && doc && editor.isEmpty && doc.content) {
      editor.commands.setContent(doc.content);
      editor.setEditable(canEdit);
    }
  }, [editor, doc, canEdit]);

  // Save function
  const saveDocument = async (overrideTitle?: string) => {
    if (!currentUser || !canEdit) return;

    setSaveState("saving");
    const currentTitle = overrideTitle !== undefined ? overrideTitle : title;

    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentTitle,
          content: latestContentRef.current,
          userId: currentUser.id,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      const updated = await res.json();
      setDoc((prev) => (prev ? { ...prev, ...updated } : prev));
      setSaveState("saved");
      setLastSavedTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch (err) {
      console.error("Autosave error:", err);
      setSaveState("error");
    }
  };

  const triggerAutosave = () => {
    setSaveState("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDocument();
    }, 800);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSaveState("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDocument(newTitle);
    }, 800);
  };

  // Export to Markdown / HTML
  const handleExport = (format: "md" | "html") => {
    if (!doc) return;
    const content = format === "html" ? latestContentRef.current : editor?.getText() || "";
    const blob = new Blob([content], {
      type: format === "html" ? "text/html" : "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoadingDoc) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-gray-500">Loading document...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-sm text-gray-600">
          You do not have permission to view or edit this document.
          Ask the document owner (<strong>{doc?.owner?.name || "the creator"}</strong>) to grant you access.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Editor Subheader */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Back & Title */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
            title="Back to All Documents"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              disabled={!canEdit}
              placeholder="Untitled Document"
              className="text-base sm:text-lg font-bold text-gray-900 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-md px-2 py-0.5 w-full max-w-md focus:bg-white focus:outline-hidden transition truncate disabled:hover:border-transparent"
            />
          </div>
        </div>

        {/* Right: Autosave status & Actions */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Autosave status indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-gray-500">
            {saveState === "saving" && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Saving to cloud...</span>
              </>
            )}
            {saveState === "saved" && (
              <>
                <CloudCheck className="w-4 h-4 text-emerald-600" />
                <span>Saved {lastSavedTime ? `at ${lastSavedTime}` : ""}</span>
              </>
            )}
            {saveState === "unsaved" && (
              <>
                <Cloud className="w-3.5 h-3.5 text-amber-500" />
                <span>Unsaved changes...</span>
              </>
            )}
            {saveState === "error" && (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-red-600">Save failed</span>
              </>
            )}
          </div>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              onClick={() => handleExport("md")}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 bg-white text-gray-700 text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
              title="Download Markdown copy"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>

          {/* Share Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs hover:shadow transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Share</span>
            {doc && doc.shares.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-blue-500 text-white text-[10px] rounded-full">
                {doc.shares.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <EditorToolbar editor={editor} readOnly={!canEdit} />

      {/* Google Docs-style Editor Paper Canvas */}
      <main className="flex-1 py-8 px-4 flex justify-center overflow-y-auto">
        <div
          className="w-full max-w-4xl bg-white rounded-sm shadow-md border border-gray-200/90 p-8 sm:p-14 min-h-[800px] cursor-text"
          onClick={() => {
            if (canEdit && editor && !editor.isFocused) {
              editor.commands.focus();
            }
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </main>

      {/* Share Modal */}
      {doc && (
        <ShareModal
          documentId={doc.id}
          documentTitle={doc.title}
          owner={doc.owner}
          isOwner={isOwner}
          shares={doc.shares}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onShareUpdated={(newShares) => {
            setDoc((prev) => (prev ? { ...prev, shares: newShares } : prev));
          }}
        />
      )}
    </div>
  );
}
