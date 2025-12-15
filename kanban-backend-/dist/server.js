"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const projects_1 = __importDefault(require("./routes/projects"));
const boards_1 = __importDefault(require("./routes/boards"));
const kanban_1 = __importDefault(require("./routes/kanban"));
const upload_1 = __importDefault(require("./routes/upload"));
const users_1 = __importDefault(require("./routes/users"));
// Import middleware
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
// Import socket handlers
const socketHandlers_1 = require("./socket/socketHandlers");
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), ".env") });
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
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
    "https://kanban-blumen-obw2.vercel.app", // ✅ NEW
].filter(Boolean);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (socketAllowedOrigins.includes(origin) ||
                origin.startsWith("http://localhost:") ||
                origin.startsWith("http://127.0.0.1:")) {
                callback(null, true);
            }
            else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST"],
        credentials: true,
    },
});
// Setup socket handlers
(0, socketHandlers_1.setupSocketHandlers)(io);
// Optimized rate limiting for better performance
const limiter = (0, express_rate_limit_1.default)({
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
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
// CORS configuration with multiple allowed origins
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_ALT,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://kanban-frontend-sand.vercel.app",
    "https://kanban-blumen-obw2.vercel.app", // ✅ NEW
].filter(Boolean);
console.log("🔒 Allowed CORS origins:", allowedOrigins);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            console.log(`✅ CORS allowed for origin: ${origin}`);
            callback(null, true);
        }
        // Also allow any localhost origin for development
        else if (origin.startsWith("http://localhost:") ||
            origin.startsWith("http://127.0.0.1:")) {
            console.log(`✅ CORS allowed for localhost origin: ${origin}`);
            callback(null, true);
        }
        else {
            console.warn(`⚠️  CORS blocked origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use((0, morgan_1.default)("combined"));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use(limiter);
// Static files for uploads
app.use("/UploadedFiles", express_1.default.static(path_1.default.join(__dirname, "..", "uploads")));
// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});
// API Routes
app.use("/api/auth", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api/projects", projects_1.default);
app.use("/api/boards", boards_1.default);
app.use("/api/ProjKanbanBoards", kanban_1.default); // Matching frontend endpoint
app.use("/api/upload", upload_1.default);
// Error handling middleware
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
// Make io available to routes
app.set("io", io);
const PORT = process.env.PORT || 7260;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`📁 Static files served from: /UploadedFiles`);
});
//# sourceMappingURL=server.js.map