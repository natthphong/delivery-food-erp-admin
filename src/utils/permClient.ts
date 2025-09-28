import { useAppSelector } from "@/store";

export function useCan() {
  const perms = useAppSelector((s) => s.auth.permissions) || [];
  return (objectCode: string, action: string) =>
    !!perms.find((p: any) => p.object_code === objectCode && p.action_code?.includes(action));
}

export function useGate(anyOf: { object: string; action: string }[]) {
  const can = useCan();
  return anyOf.some((x) => can(x.object, x.action));
}
