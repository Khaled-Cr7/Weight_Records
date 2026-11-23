import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signToken } from "../lib/token.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// What the app is allowed to see about a user (never the password hash)
const userSelect = {
  id: true,
  username: true,
  email: true,
  displayName: true,
  avatarKey: true,
  bio: true,
  createdAt: true,
  settings: {
    select: { weightUnit: true, defaultRestSeconds: true, notificationsEnabled: true },
  },
} satisfies Prisma.UserSelect;

const email = z.string().trim().toLowerCase().max(255).pipe(z.email());

const registerSchema = z.object({
  email,
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[A-Za-z0-9_]+$/, "Username can only contain letters, numbers and _"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

// Slows down password guessing: 20 failed attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});

// Used when the email doesn't exist, so a wrong email takes as long as a wrong password
const dummyHash = await hashPassword("not-a-real-password");

// POST /api/auth/register
router.post("/register", authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const { email, password } = parsed.data;
  const displayName = parsed.data.username;
  const username = displayName.toLowerCase(); // usernames are not case sensitive

  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { email: true },
    });
    if (existing) {
      res.status(409).json({
        error: existing.email === email ? "Email is already registered" : "Username is already taken",
      });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName,
        passwordHash: await hashPassword(password),
        settings: { create: {} }, // default settings row
      },
      select: userSelect,
    });

    res.status(201).json({ token: signToken(user.id), user });
  } catch (error) {
    // Two people registering the same email/username at the same moment
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ error: "Email or username is already in use" });
      return;
    }
    console.error("POST /api/auth/register failed:", error);
    res.status(500).json({ error: "Could not create the account" });
  }
});

// POST /api/auth/login
router.post("/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email and password" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    const passwordOk = await verifyPassword(user?.passwordHash ?? dummyHash, parsed.data.password);

    if (!user || !passwordOk) {
      res.status(401).json({ error: "Incorrect email or password" });
      return;
    }

    const safeUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: userSelect,
    });
    res.json({ token: signToken(user.id), user: safeUser });
  } catch (error) {
    console.error("POST /api/auth/login failed:", error);
    res.status(500).json({ error: "Could not sign in" });
  }
});

// GET /api/auth/me  -> the signed-in user (used when the app starts)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: userSelect,
    });

    if (!user) {
      res.status(401).json({ error: "Not signed in" }); // the account no longer exists
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("GET /api/auth/me failed:", error);
    res.status(500).json({ error: "Could not load the account" });
  }
});

export default router;