export type Role = "OWNER" | "EDITOR" | "VIEWER" | null;

export interface DocumentPermissionInput {
  ownerId: string;
  shares: Array<{ userId: string; role: string }>;
}

export function evaluateUserPermission(
  userId: string,
  doc: DocumentPermissionInput
): { role: Role; canEdit: boolean; canDelete: boolean } {
  if (doc.ownerId === userId) {
    return { role: "OWNER", canEdit: true, canDelete: true };
  }

  const share = doc.shares.find((s) => s.userId === userId);
  if (!share) {
    return { role: null, canEdit: false, canDelete: false };
  }

  if (share.role === "EDITOR") {
    return { role: "EDITOR", canEdit: true, canDelete: false };
  }

  return { role: "VIEWER", canEdit: false, canDelete: false };
}
