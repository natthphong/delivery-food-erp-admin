import type { NextApiRequest, NextApiResponse } from “next”;
import { signAccessToken, issueRefreshToken } from “@/utils/jwt”;

type R = { code: string; message: string; body?: any } | { code: string; message: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
if (req.method !== “POST”) return res.status(405).json({ code: “METHOD_NOT_ALLOWED”, message: “Method not allowed” });
const { refreshToken } = (req.body ?? {}) as { refreshToken?: string };
if (!refreshToken) return res.status(400).json({ code: “BAD_REQUEST”, message: “refreshToken required” });

// mock accept any refreshToken; in real app, verify it.
const payload = { sub: “mock-employee”, email: “mock@baan.com”, username: “mock”, roles: [1] } as any;
const accessToken = signAccessToken(payload);
const newRefresh = issueRefreshToken(payload);
return res.status(200).json({ code: “OK”, message: “success”, body: { accessToken, refreshToken: newRefresh } });
}
