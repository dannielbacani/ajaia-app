"use client";

import React, { useState } from "react";
import { User, useCurrentUser } from "@/context/UserContext";
import { X, Users, Copy, Check, Trash2, Shield, UserPlus, AlertCircle } from "lucide-react";

interface ShareItem {
  id: string;
  role: string;
  user: User;
}

interface ShareModalProps {
  documentId: string;
  documentTitle: string;
  owner: User;
  isOwner: boolean;
  shares: ShareItem[];
  isOpen: boolean;
  onClose: () => void;
  onShareUpdated: (shares: ShareItem[]) => void;
}

export function ShareModal({
  documentId,
  documentTitle,
  owner,
  isOwner,
  shares,
  isOpen,
  onClose,
  onShareUpdated,
}: ShareModalProps) {
  const { users, currentUser } = useCurrentUser();
  const [targetEmail, setTargetEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail || !currentUser) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: currentUser.id,
          targetEmail: targetEmail.trim(),
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add collaborator");
      }

      onShareUpdated(data.shares);
      setTargetEmail("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to share document");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCollaborator = async (targetUserId: string) => {
    if (!currentUser) return;
    setError(null);

    try {
      const res = await fetch(
        `/api/documents/${documentId}/share?ownerId=${currentUser.id}&targetUserId=${targetUserId}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove collaborator");
      }

      onShareUpdated(data.shares);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to remove collaborator");
      }
    }
  };

  // Filter out the owner and already shared users from quick selector
  const availableUsers = users.filter(
    (u) => u.id !== owner.id && !shares.some((s) => s.user.id === u.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 leading-tight">
                Share &quot;{documentTitle}&quot;
              </h3>
              <p className="text-xs text-gray-500">Manage who has access to this document</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Add collaborator form (only if owner) */}
          {isOwner ? (
            <form onSubmit={handleAddCollaborator} className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700">
                Grant Access to a Team Member
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="Enter email (e.g. bob@ajaia.io)"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EDITOR">Can Edit</option>
                  <option value="VIEWER">Can View</option>
                </select>
                <button
                  type="submit"
                  disabled={isSubmitting || !targetEmail}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmitting ? "Adding..." : "Share"}</span>
                </button>
              </div>

              {/* Quick Persona Picker */}
              {availableUsers.length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] text-gray-500">Quick select team member: </span>
                  <div className="inline-flex flex-wrap gap-1 mt-1">
                    {availableUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setTargetEmail(u.email)}
                        className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-md transition text-gray-700 cursor-pointer"
                      >
                        +{u.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              Only the document owner (<strong>{owner.name}</strong>) can grant or revoke collaborator access.
            </div>
          )}

          {/* Collaborators List */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2.5">
              People with access
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {/* Owner */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-200/80">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {owner.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 leading-tight">
                      {owner.name} {owner.id === currentUser?.id ? "(You)" : ""}
                    </p>
                    <p className="text-xs text-gray-500">{owner.email}</p>
                  </div>
                </div>
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  <Shield className="w-3 h-3" />
                  <span>Owner</span>
                </span>
              </div>

              {/* Shared users */}
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50/50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs uppercase">
                      {share.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 leading-tight">
                        {share.user.name} {share.user.id === currentUser?.id ? "(You)" : ""}
                      </p>
                      <p className="text-xs text-gray-500">{share.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                        share.role === "EDITOR"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {share.role === "EDITOR" ? "Can edit" : "Can view"}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveCollaborator(share.user.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded transition cursor-pointer"
                        title="Remove collaborator"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-2xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-700">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>Copy Document Link</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
