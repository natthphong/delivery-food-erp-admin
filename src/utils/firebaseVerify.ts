import jwt from "jsonwebtoken";

const emulatorSecret = process.env.FIREBASE_EMULATOR_JWT_SECRET;

export async function verifyFirebaseIdToken(token: string) {
  if (!token) {
    throw new Error("Missing token");
  }

  if (emulatorSecret) {
    const decoded = jwt.verify(token, emulatorSecret);
    if (typeof decoded === "string") {
      throw new Error("Invalid firebase token payload");
    }
    return decoded as Record<string, unknown>;
  }

  throw new Error("Firebase verification not configured");
}
