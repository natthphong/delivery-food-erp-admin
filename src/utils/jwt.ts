import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { logger } from "@/utils/logger";

const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.NEXT_PUBLIC_ADMIN_JWT_EXPIRES_IN ?? 900);
const REFRESH_TOKEN_TTL_SECONDS = Number(process.env.NEXT_PUBLIC_ADMIN_REFRESH_EXPIRES_IN ?? 604800);
const JWT_SECRET = process.env.NEXT_PUBLIC_ADMIN_JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Missing NEXT_PUBLIC_ADMIN_JWT_SECRET environment variable");
}

export type JwtAdminPayload = {
  sub: string;
  email: string;
  username:string;
  roles: string[];
};

export type RefreshSession = JwtAdminPayload & {
  token: string;
  expiresAt: number;
};

const refreshRegistry = new Map<string, RefreshSession>();

export const signAccessToken = (payload: JwtAdminPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
};

export const verifyAccessToken = (token: string): JwtAdminPayload => {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }
  const { sub, email, roles } = decoded as JwtAdminPayload;
  return { sub, email, roles };
};

const createRefreshToken = (payload: JwtAdminPayload): RefreshSession => {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000;
  return { ...payload, token, expiresAt };
};

export const issueRefreshToken = (payload: JwtAdminPayload): string => {
  const session = createRefreshToken(payload);
  refreshRegistry.set(session.token, session);
  return session.token;
};

export const verifyRefreshToken = (token: string): RefreshSession | null => {
  const session = refreshRegistry.get(token);
  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    refreshRegistry.delete(token);
    logger.info("Refresh token expired", { token });
    return null;
  }

  return session;
};

export const rotateRefreshToken = (token: string): RefreshSession | null => {
  const session = verifyRefreshToken(token);
  if (!session) {
    return null;
  }

  refreshRegistry.delete(token);
  const { sub, email, roles } = session;
  const replacement = createRefreshToken({ sub, email, roles });
  refreshRegistry.set(replacement.token, replacement);
  return replacement;
};

export const revokeRefreshToken = (token: string): void => {
  refreshRegistry.delete(token);
};

export const purgeExpiredRefreshTokens = (): void => {
  const now = Date.now();
  refreshRegistry.forEach((session, token) => {
    if (session.expiresAt < now) {
      refreshRegistry.delete(token);
    }
  });
};
