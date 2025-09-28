export type ApiOk = { code: “OK”; message: “success”; body: T };
export type ApiErr = { code: string; message: string };

export type PermissionItem = { object_code: string; action_code: string[] };

export type AdminProfile = {
id: string;
email: string;
username: string;
is_active: boolean;
roles: { id: number; code: string; name: string }[];
permissions: PermissionItem[];
};
