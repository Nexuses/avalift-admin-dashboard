export const normalizeRoleName = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
};

const getRoleNameFromUnknown = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (value && typeof value === "object") {
    const roleObject = value as {
      name?: unknown;
      role?: unknown;
      display_name?: unknown;
      role_name?: unknown;
    };

    if (typeof roleObject.name === "string" && roleObject.name.trim()) {
      return roleObject.name.trim();
    }
    if (typeof roleObject.role === "string" && roleObject.role.trim()) {
      return roleObject.role.trim();
    }
    if (typeof roleObject.display_name === "string" && roleObject.display_name.trim()) {
      return roleObject.display_name.trim();
    }
    if (typeof roleObject.role_name === "string" && roleObject.role_name.trim()) {
      return roleObject.role_name.trim();
    }
  }

  return null;
};

export const parseStoredRoles = (raw: string | null): string[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as
      | unknown[]
      | {
          roles?: unknown;
          data?: { roles?: unknown };
          role?: unknown;
          name?: unknown;
          role_name?: unknown;
          display_name?: unknown;
        }
      | string;

    if (typeof parsed === "string") {
      return parsed
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean);
    }

    if (Array.isArray(parsed)) {
      const roleNames = parsed
        .map((value) => getRoleNameFromUnknown(value))
        .filter((value): value is string => Boolean(value));
      return Array.from(new Set(roleNames));
    }

    if (parsed && typeof parsed === "object") {
      const rolesCandidate = Array.isArray(parsed.roles)
        ? parsed.roles
        : Array.isArray(parsed.data?.roles)
          ? parsed.data.roles
          : null;

      if (rolesCandidate) {
        const roleNames = rolesCandidate
          .map((value) => getRoleNameFromUnknown(value))
          .filter((value): value is string => Boolean(value));
        return Array.from(new Set(roleNames));
      }

      const singleRoleName = getRoleNameFromUnknown(parsed);
      return singleRoleName ? [singleRoleName] : [];
    }
  } catch {
    return raw
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);
  }

  return [];
};

export const isSuperAdminRoleName = (name: string): boolean => {
  const normalized = normalizeRoleName(name);
  if (!normalized) {
    return false;
  }

  if (normalized === "super_admin" || normalized === "super") {
    return true;
  }

  if (normalized.includes("super_admin")) {
    return true;
  }

  const tokens = normalized.split("_").filter(Boolean);
  return tokens.includes("super") && tokens.includes("admin");
};

const parseRoleId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

export const extractStoredUserRoleId = (rawUserDetails: string | null): number | null => {
  if (!rawUserDetails) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawUserDetails) as
      | { role_id?: unknown; role?: unknown; data?: { role_id?: unknown; role?: unknown } }
      | null;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return (
      parseRoleId(parsed.data?.role_id) ??
      parseRoleId(parsed.data?.role) ??
      parseRoleId(parsed.role_id) ??
      parseRoleId(parsed.role)
    );
  } catch {
    return null;
  }
};

export const extractStoredUserRoleName = (rawUserDetails: string | null): string | null => {
  if (!rawUserDetails) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawUserDetails) as
      | {
          role?: unknown;
          role_name?: unknown;
          display_name?: unknown;
          data?: { role?: unknown; role_name?: unknown; display_name?: unknown };
        }
      | null;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return (
      getRoleNameFromUnknown(parsed.data?.role_name) ??
      getRoleNameFromUnknown(parsed.data?.display_name) ??
      getRoleNameFromUnknown(parsed.data?.role) ??
      getRoleNameFromUnknown(parsed.role_name) ??
      getRoleNameFromUnknown(parsed.display_name) ??
      getRoleNameFromUnknown(parsed.role)
    );
  } catch {
    return null;
  }
};
