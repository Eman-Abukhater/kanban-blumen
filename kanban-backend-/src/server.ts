const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import rateLimit from "express-rate-limit";
import path from "path";

// Import routes
import authRoutes from "./routes/auth";
import projectRoutes from "./routes/projects";
import boardRoutes from "./routes/boards";
import kanbanRoutes from "./routes/kanban";
import uploadRoutes from "./routes/upload";
import userRoutes from "./routes/users";

// Import middleware
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

// Import socket handlers
import { setupSocketHandlers } from "./socket/socketHandlers";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const app = express();
const httpServer = createServer(app);

// Socket.IO setup with multiple allowed origins
const socketAllowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_ALT,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://kanban-frontend-sand.vercel.app",
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        socketAllowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Setup socket handlers
setupSocketHandlers(io);

// Optimized rate limiting for better performance
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Reduced to 500 requests per 15 minutes for better performance
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.path === "/health" || req.path.startsWith("/UploadedFiles");
  },
});

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration with multiple allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_ALT, // Additional frontend URL if needed
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173", // Vite default
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://kanban-frontend-sand.vercel.app",
].filter(Boolean); // Remove undefined values

console.log("🔒 Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log(`✅ CORS allowed for origin: ${origin}`);
        callback(null, true);
      }
      // Also allow any localhost origin for development
      else if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        console.log(`✅ CORS allowed for localhost origin: ${origin}`);
        callback(null, true);
      } else {
        console.warn(`⚠️  CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(limiter);

// Static files for uploads
app.use(
  "/UploadedFiles",
  express.static(path.join(__dirname, "..", "uploads"))
);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/ProjKanbanBoards", kanbanRoutes); // Matching frontend endpoint
app.use("/api/upload", uploadRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Make io available to routes
app.set("io", io);

const PORT = process.env.PORT || 7260;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`📁 Static files served from: /UploadedFiles`);
});
