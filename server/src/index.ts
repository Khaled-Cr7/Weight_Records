
import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Repsy API is running"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Repsy API running at http://localhost:${PORT}`);
});
