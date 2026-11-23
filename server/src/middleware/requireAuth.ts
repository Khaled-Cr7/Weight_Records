import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/token.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Protects a route: needs the header "Authorization: Bearer <token>"
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const userId = token ? verifyToken(token) : null;

  if (!userId) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  req.userId = userId;
  next();
}