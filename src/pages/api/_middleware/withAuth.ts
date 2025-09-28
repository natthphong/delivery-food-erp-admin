import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { verifyAccessToken } from "@/utils/jwt";
import { verifyFirebaseIdToken } from "@/utils/firebaseVerify";

export type JsonResponse = { code: string; message: string; body: unknown };
export type AuthContext = {
  uid: string;
  userId: number | null;
  sub?: string;
  tokenType: "access" | "idToken";
  firebaseClaims?: Record<string, unknown>;
};

function extractHeaderIdToken(req: NextApiRequest): string | null {
  const header = req.headers["x-id-token"];
  if (Array.isArray(header)) {
    return header[0] ?? null;
  }
  if (typeof header === "string" && header.trim()) {
    return header.trim();
  }
  return null;
}

function extractBodyIdToken(req: NextApiRequest): string | null {
  if (!req.body || typeof req.body !== "object") {
    return null;
  }
  const token = (req.body as Record<string, unknown>).idToken;
  return typeof token === "string" && token.trim() ? token.trim() : null;
}

export async function resolveAuth(req: NextApiRequest): Promise<AuthContext | null> {
  const authHeader = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (bearerToken) {
    try {
      const payload = verifyAccessToken(bearerToken);
      if (payload?.sub) {
        return {
          uid: payload.uid ?? payload.sub,
          userId: typeof payload.userId === "number" ? payload.userId : null,
          tokenType: "access",
          sub: payload.sub,
        };
      }
    } catch {
      // fallthrough
    }
  }

  const idToken = extractHeaderIdToken(req) ?? extractBodyIdToken(req);
  if (!idToken) {
    return null;
  }

  try {
    const claims = await verifyFirebaseIdToken(idToken);
    const uid = (claims as { user_id?: string; uid?: string; sub?: string })?.user_id
      ?? (claims as { user_id?: string; uid?: string; sub?: string })?.uid
      ?? (claims as { user_id?: string; uid?: string; sub?: string })?.sub;
    if (!uid) {
      return null;
    }
    return {
      uid: String(uid),
      userId: null,
      tokenType: "idToken",
      firebaseClaims: claims as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse<JsonResponse>) => {
    try {
      const auth = await resolveAuth(req);
      if (!auth) {
        return res
          .status(401)
          .json({ code: "UNAUTHORIZED", message: "Missing or invalid token", body: null });
      }
      (req as NextApiRequest & { auth: AuthContext }).auth = auth;
      return handler(req, res);
    } catch {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing or invalid token", body: null });
    }
  };
}
