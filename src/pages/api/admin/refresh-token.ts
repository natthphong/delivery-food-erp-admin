import type { NextApiRequest, NextApiResponse } from "next";
import { rotateRefreshToken, signAccessToken, verifyRefreshToken } from "@/utils/jwt";
import { logger } from "@/utils/logger";

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

type ErrorResponse = {
  error: string;
};

const handler = async (req: NextApiRequest, res: NextApiResponse<RefreshResponse | ErrorResponse>) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: `Method ${req.method ?? "UNKNOWN"} not allowed` });
    return;
  }

  const { refreshToken } = req.body as { refreshToken?: string };

  if (!refreshToken) {
    res.status(400).json({ error: "Refresh token is required" });
    return;
  }

  const session = verifyRefreshToken(refreshToken);
  if (!session) {
    logger.warn("Refresh token rejected", { refreshToken });
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }

  const rotated = rotateRefreshToken(refreshToken);
  if (!rotated) {
    res.status(401).json({ error: "Unable to rotate refresh token" });
    return;
  }

  const payload = { sub: rotated.sub, email: rotated.email, roles: rotated.roles };
  const accessToken = signAccessToken(payload);

  res.status(200).json({
    accessToken,
    refreshToken: rotated.token,
  });
};

export default handler;
