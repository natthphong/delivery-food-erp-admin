import { useAppSelector } from "@/store";

export function useCan() {
  const permissions = useAppSelector((state) => state.auth.permissions) || [];
  return (objectCode: string, action: string) =>
    permissions.some((item) => item.object_code === objectCode && item.action_code.includes(action));
}

export function useGate(requirements: { object: string; action: string }[]) {
  const can = useCan();
  return requirements.some((req) => can(req.object, req.action));
}
