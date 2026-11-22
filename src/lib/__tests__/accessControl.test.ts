import { describe, it, expect } from "vitest";
import { evaluateUserPermission } from "../accessControl";

describe("evaluateUserPermission", () => {
  const mockDoc = {
    ownerId: "user_danniel",
    shares: [
      { userId: "user_bob", role: "EDITOR" },
      { userId: "user_charlie", role: "VIEWER" },
    ],
  };

  it("grants owner full edit and delete permissions", () => {
    const perm = evaluateUserPermission("user_danniel", mockDoc);
    expect(perm.role).toBe("OWNER");
    expect(perm.canEdit).toBe(true);
    expect(perm.canDelete).toBe(true);
  });

  it("grants editor edit permissions but denies deletion", () => {
    const perm = evaluateUserPermission("user_bob", mockDoc);
    expect(perm.role).toBe("EDITOR");
    expect(perm.canEdit).toBe(true);
    expect(perm.canDelete).toBe(false);
  });

  it("restricts viewer to read-only access", () => {
    const perm = evaluateUserPermission("user_charlie", mockDoc);
    expect(perm.role).toBe("VIEWER");
    expect(perm.canEdit).toBe(false);
    expect(perm.canDelete).toBe(false);
  });

  it("completely denies access to uninvited users", () => {
    const perm = evaluateUserPermission("user_stranger", mockDoc);
    expect(perm.role).toBeNull();
    expect(perm.canEdit).toBe(false);
    expect(perm.canDelete).toBe(false);
  });
});
