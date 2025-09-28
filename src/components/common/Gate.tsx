import React from "react";
import { useGate } from "@/utils/permClient";

type Props = {
  anyOf: { object: string; action: string }[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function Gate({ anyOf, children, fallback }: Props) {
  const allowed = useGate(anyOf);
  if (!allowed) return <>{fallback ?? "Permission denied"}</>;
  return <>{children}</>;
}
