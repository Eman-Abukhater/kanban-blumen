"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cachedResponse = exports.APICache = exports.formatFileSize = exports.getFileExtension = exports.sanitizeFilename = exports.isValidUrl = exports.truncateText = exports.slugify = exports.validateEmail = exports.formatDate = exports.generateId = void 0;
const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
};
exports.generateId = generateId;
const formatDate = (date) => {
    return date.toISOString().split("T")[0];
};
exports.formatDate = formatDate;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const slugify = (text) => {
    return text
        .toLowerCase()
        .replace(/[^\w ]+/g, "")
        .replace(/ +/g, "-");
};
exports.slugify = slugify;
const truncateText = (text, maxLength) => {
    if (text.length <= maxLength)
        return text;
    return text.substr(0, maxLength) + "...";
};
exports.truncateText = truncateText;
const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    }
    catch (_) {
        return false;
    }
};
exports.isValidUrl = isValidUrl;
const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-z0-9.-]/gi, "_").toLowerCase();
};
exports.sanitizeFilename = sanitizeFilename;
const getFileExtension = (filename) => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};
exports.getFileExtension = getFileExtension;
const formatFileSize = (bytes) => {
    if (bytes === 0)
        return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
exports.formatFileSize = formatFileSize;
// Simple in-memory cache utility for API responses
class APICache {
    static get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        const now = Date.now();
        if (now - item.timestamp > this.DEFAULT_TTL) {
            this.cache.delete(key);
            return null;
        }
        return item.data;
    }
    static set(key, data, ttl = this.DEFAULT_TTL) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
        // Clean up expired items periodically
        if (this.cache.size > 1000) {
            this.cleanup();
        }
    }
    static clear() {
        this.cache.clear();
    }
    static cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.DEFAULT_TTL) {
                this.cache.delete(key);
            }
        }
    }
    static generateKey(req) {
        const method = req.method;
        const path = req.path;
        const query = req.query ? JSON.stringify(req.query) : "";
        const userId = req.user?.id || "anonymous";
        return `${method}:${path}:${query}:${userId}`;
    }
}
exports.APICache = APICache;
APICache.cache = new Map();
APICache.DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
// Utility function to cache API responses
const cachedResponse = (ttl = 5 * 60 * 1000) => {
    return (req, res, next) => {
        if (req.method === "GET") {
            const cacheKey = APICache.generateKey(req);
            const cachedData = APICache.get(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }
            // Override res.json to cache the response
            const originalJson = res.json;
            res.json = function (data) {
                APICache.set(cacheKey, data, ttl);
                return originalJson.call(this, data);
            };
        }
        next();
    };
};
exports.cachedResponse = cachedResponse;
//# sourceMappingURL=helpers.js.map