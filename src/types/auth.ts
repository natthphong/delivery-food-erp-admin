export type BusinessCode =
  | "OK"
  | "USER_INACTIVE"
  | "NO_ROLE"
  | "INVALID_CREDENTIALS"
  | "UNAUTHORIZED"
  | "VALIDATION_FAILED"
  | "RBAC_FORBIDDEN"
  | "INTERNAL_ERROR";

export type ApiOk<T> = { code: "OK"; message: "success"; body: T };
export type ApiErr = { code: Exclude<BusinessCode, "OK"> | string; message: string };

export type PermissionItem = { object_code: string; action_code: string[] };

export type AdminRole = { id: number; code: string; name: string };

export type AdminProfile = {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  roles: AdminRole[];
  permissions: PermissionItem[];
};

export type LoginOkBody = {
  accessToken: string;
  refreshToken: string;
  admin: Pick<AdminProfile, "id" | "email" | "username" | "roles" | "permissions">;
};
