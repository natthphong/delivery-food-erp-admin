import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { supabaseErp } from "@/utils/supabaseErp";
import { issueRefreshToken, signAccessToken, type JwtAdminPayload } from "@/utils/jwt";
import { logger } from "@/utils/logger";



type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  admin: {
    id: string;
    email: string;
    roles: string[];
  };
};

type ErrorResponse = {
  error: string;
};

const handler = async (req: NextApiRequest, res: NextApiResponse<LoginResponse | ErrorResponse>) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: `Method ${req.method ?? "UNKNOWN"} not allowed` });
    return;
  }

  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const { data } = await supabaseErp
      .from("tbl_employee")
      .select("id,email,password_hash,username,is_active")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    const {roleData} = await supabaseErp
        .from("tbl_employee_role_history")
        .select("id,role_id")

    if (!data) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, data.password_hash);
    if (!passwordMatches) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const payload: JwtAdminPayload = {
      sub: data.id,
      email: data.email,
      username: data.username,
      roles: [],
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = issueRefreshToken(payload);

    res.status(200).json({
      accessToken,
      refreshToken,
      admin: {
        id: data.id,
        email: data.email,
        roles: payload.roles,
      },
    });
  } catch (err) {
    logger.error("Unexpected error during login", err);
    res.status(500).json({ error: "Unexpected error" });
  }
};

export default handler;
