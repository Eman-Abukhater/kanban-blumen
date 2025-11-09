export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + "...";
};

export const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-z0-9.-]/gi, "_").toLowerCase();
};

export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Simple in-memory cache utility for API responses
export class APICache {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > this.DEFAULT_TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  static set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Clean up expired items periodically
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  static clear(): void {
    this.cache.clear();
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.DEFAULT_TTL) {
        this.cache.delete(key);
      }
    }
  }

  static generateKey(req: any): string {
    const method = req.method;
    const path = req.path;
    const query = req.query ? JSON.stringify(req.query) : "";
    const userId = req.user?.id || "anonymous";
    return `${method}:${path}:${query}:${userId}`;
  }
}

// Utility function to cache API responses
export const cachedResponse = (ttl: number = 5 * 60 * 1000) => {
  return (req: any, res: any, next: any) => {
    if (req.method === "GET") {
      const cacheKey = APICache.generateKey(req);
      const cachedData = APICache.get(cacheKey);

      if (cachedData) {
        return res.json(cachedData);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function (data: any) {
        APICache.set(cacheKey, data, ttl);
        return originalJson.call(this, data);
      };
    }

    next();
  };
};
