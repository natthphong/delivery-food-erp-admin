import type { PermissionItem } from "@/types/auth";

export function aggregatePermissions(rows: { permission: { object_code: string; action_code: string } | null }[]): PermissionItem[] {
  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    const permission = row.permission;
    if (!permission) continue;
    if (!map.has(permission.object_code)) {
      map.set(permission.object_code, new Set());
    }
    map.get(permission.object_code)!.add(permission.action_code);
  }

  return Array.from(map.entries()).map(([object_code, actions]) => ({
    object_code,
    action_code: Array.from(actions).sort(),
  }));
}

export function hasPermission(perms: PermissionItem[] | null | undefined, objectCode: string, action: string): boolean {
  if (!perms || perms.length === 0) {
    return false;
  }

  const found = perms.find((item) => item.object_code === objectCode);
  return !!found && found.action_code.includes(action);
}
