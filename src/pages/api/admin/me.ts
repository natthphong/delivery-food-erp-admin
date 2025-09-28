import type { NextApiRequest, NextApiResponse } from "next";
import { verifyAccessToken } from "@/utils/jwt";

type MeResponse = {
  admin: {
    id: string;
    email: string;
    roles: string[];
  };
};

type ErrorResponse = {
  error: string;
};

const handler = (req: NextApiRequest, res: NextApiResponse<MeResponse | ErrorResponse>) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ error: `Method ${req.method ?? "UNKNOWN"} not allowed` });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Invalid authorization header" });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    res.status(200).json({
      admin: {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles,
      },
    });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default handler;
