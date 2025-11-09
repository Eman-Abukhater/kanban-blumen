"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Detect production environment
const isProduction = process.env.RENDER === "true" ||
    process.env.NODE_ENV === "production" ||
    process.env.PORT === "10000" ||
    process.env.PORT === "8080";
// Ensure upload directories exist (for development only)
const createUploadDirs = () => {
    if (isProduction)
        return; // Skip in production
    const dirs = [
        "uploads",
        "uploads/KanbanCard",
        "uploads/EmployeeUploads",
        "uploads/tasks",
    ];
    dirs.forEach((dir) => {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    });
};
createUploadDirs();
// Configure storage based on environment
const storage = isProduction
    ? multer_1.default.memoryStorage() // Use memory storage in production for Cloudinary
    : multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            let uploadPath = "uploads/";
            if (req.route?.path.includes("card")) {
                uploadPath = "uploads/KanbanCard/";
            }
            else if (req.route?.path.includes("task")) {
                uploadPath = "uploads/tasks/";
            }
            else if (req.route?.path.includes("user")) {
                uploadPath = "uploads/EmployeeUploads/";
            }
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            // Generate unique filename
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, file.fieldname + "-" + uniqueSuffix + path_1.default.extname(file.originalname));
        },
    });
// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb(new Error("Invalid file type"));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880"), // 5MB default
    },
    fileFilter,
});
//# sourceMappingURL=upload.js.map