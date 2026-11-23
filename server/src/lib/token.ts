import jwt from "jsonwebtoken";

const TOKEN_LIFETIME = "30d";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is missing or shorter than 32 characters in server/.env");
  }
  return secret;
}

// Call once at startup so a missing secret stops the server immediately
export function checkAuthConfig(): void {
  getSecret();
}

export function signToken(userId: string): string {
  return jwt.sign({}, getSecret(), { subject: userId, expiresIn: TOKEN_LIFETIME });
}

// Returns the user id inside a valid token, or null if the token is invalid or expired
export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, getSecret());
    return typeof payload === "object" && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}