"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser, User } from "@/context/UserContext";
import {
  FileText,
  Plus,
  Upload,
  Users,
  Clock,
  Trash2,
  Share2,
  FileCode,
  Shield,
  Loader2,
  FolderOpen,
} from "lucide-react";

interface DocumentItem {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  ownerId: string;
  owner: User;
  shares: Array<{ id: string; role: string; user: User }>;
  currentUserRole?: "OWNER" | "EDITOR" | "VIEWER";
}

export function Dashboard() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<"owned" | "shared">("owned");
  const [ownedDocs, setOwnedDocs] = useState<DocumentItem[]>([]);
  const [sharedDocs, setSharedDocs] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setOwnedDocs(data.owned || []);
        setSharedDocs(data.shared || []);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [currentUser]);

  const handleCreateDocument = async () => {
    if (!currentUser || isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Document",
          content: "<p></p>",
          ownerId: currentUser.id,
        }),
      });

      if (res.ok) {
        const doc = await res.json();
        router.push(`/documents/${doc.id}`);
      }
    } catch (err) {
      console.error("Failed to create document:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("ownerId", currentUser.id);

    try {
      const res = await fetch("/api/documents/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      router.push(`/documents/${data.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setUploadError(err.message);
      } else {
        setUploadError("Error uploading file");
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const res = await fetch(`/api/documents/${id}?userId=${currentUser.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOwnedDocs((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>?/gm, "").slice(0, 140);
  };

  const currentList = activeTab === "owned" ? ownedDocs : sharedDocs;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Action Header */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Documents
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Workspace of {currentUser?.name}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Create, format, and share lightweight collaborative documents.
          </p>
          <p className="text-xs text-gray-400 mt-2 flex items-center space-x-1.5">
            <FileCode className="w-3.5 h-3.5 text-blue-500" />
            <span>Supported file imports: <strong>.md</strong> (Markdown) and <strong>.txt</strong> (Plain text)</span>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".md,.txt,.markdown"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <Upload className="w-4 h-4 text-gray-500" />
            )}
            <span>{isUploading ? "Importing..." : "Import File"}</span>
          </button>

          <button
            onClick={handleCreateDocument}
            disabled={isCreating}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>New Document</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {uploadError}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("owned")}
            className={`pb-4 px-1 text-sm font-semibold border-b-2 flex items-center space-x-2 transition cursor-pointer ${
              activeTab === "owned"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Owned by Me</span>
            <span
              className={`ml-1.5 px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === "owned"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {ownedDocs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("shared")}
            className={`pb-4 px-1 text-sm font-semibold border-b-2 flex items-center space-x-2 transition cursor-pointer ${
              activeTab === "shared"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Shared with Me</span>
            <span
              className={`ml-1.5 px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === "shared"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {sharedDocs.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Documents Grid / List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-500">Loading your workspace...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {activeTab === "owned" ? "No owned documents yet" : "No shared documents"}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
              {activeTab === "owned"
                ? "Get started by creating a new document or importing a Markdown (.md) or text (.txt) file."
                : "When colleagues share documents with you, they will appear here with your assigned permissions."}
            </p>
          </div>
          {activeTab === "owned" ? (
            <button
              onClick={handleCreateDocument}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Document</span>
            </button>
          ) : (
            <p className="text-xs text-blue-600 font-medium">
              Tip: Switch persona to Danniel or Bob in the top navigation to view shared documents.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentList.map((doc) => {
            const preview = stripHtml(doc.content);
            const isOwner = doc.ownerId === currentUser?.id;

            return (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="group bg-white rounded-2xl border border-gray-200/90 hover:border-blue-400 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition line-clamp-1">
                        {doc.title || "Untitled Document"}
                      </h2>
                    </div>

                    {isOwner ? (
                      <button
                        onClick={(e) => handleDeleteDocument(doc.id, e)}
                        className="text-gray-300 hover:text-red-600 p-1 rounded-md transition cursor-pointer"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {doc.currentUserRole === "EDITOR" ? "Can Edit" : "Viewer"}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-3 line-clamp-3 leading-relaxed">
                    {preview || "No content yet. Click to start writing..."}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {new Date(doc.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {isOwner ? (
                      <span className="text-[11px] text-gray-500 flex items-center space-x-1">
                        <Share2 className="w-3 h-3 text-gray-400" />
                        <span>
                          {doc.shares.length > 0
                            ? `Shared (${doc.shares.length})`
                            : "Private"}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-500 flex items-center space-x-1">
                        <Shield className="w-3 h-3 text-blue-500" />
                        <span>Owner: {doc.owner.name.split(" ")[0]}</span>
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
