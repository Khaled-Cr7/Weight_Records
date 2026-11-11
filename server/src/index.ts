
import express from "express";
import cors from "cors";
import "dotenv/config";
import { prisma } from "./lib/prisma.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Repsy API is running",
  });
});

// Database health check
app.get("/api/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      database: "connected",
      message: "Repsy PostgreSQL connection successful",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      status: "error",
      database: "disconnected",
      message: "Unable to connect to PostgreSQL",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Repsy API running at http://localhost:${PORT}`);
});
