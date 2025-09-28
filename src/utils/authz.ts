import type { PermissionItem } from “@/types/api”;

export function aggregatePermissions(rows: { permission: { object_code: string; action_code: string } }[]): PermissionItem[] {
const map = new Map<string, Set>();
for (const r of rows) {
const p = r.permission;
if (!map.has(p.object_code)) map.set(p.object_code, new Set());
map.get(p.object_code)!.add(p.action_code);
}
return Array.from(map.entries()).map(([object_code, set]) => ({ object_code, action_code: Array.from(set).sort() }));
}

export function hasPermission(perms: PermissionItem[] | undefined, objectCode: string, action: string) {
const p = perms?.find(x => x.object_code === objectCode);
return !!p && p.action_code.includes(action);
}
