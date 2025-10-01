import type { PermissionItem } from "@/types/api";

type RawPermissionRow = {
  permission: {
    object_code: string;
    action_code: string;
  };
};

export function aggregatePermissions(rows: RawPermissionRow[]): PermissionItem[] {
  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    const { object_code, action_code } = row.permission;
    if (!map.has(object_code)) {
      map.set(object_code, new Set<string>());
    }
    map.get(object_code)!.add(action_code);
  }
  return Array.from(map.entries()).map(([objectCode, actions]) => ({
    object_code: objectCode,
    action_code: Array.from(actions).sort(),
  }));
}

export function hasPermission(perms: PermissionItem[] | undefined, objectCode: string, action: string): boolean {
  const matched = perms?.find((perm) => perm.object_code === objectCode);
  return !!matched && matched.action_code.includes(action);
}
