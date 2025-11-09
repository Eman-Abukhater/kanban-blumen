import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../config/database";
import { AuthUser, AuthRequest, JWTPayload } from "../types";

// Simple in-memory cache for user data (in production, use Redis)
const userCache = new Map<string, { user: AuthUser; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is not defined in environment variables");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Check cache first
    const cacheKey = `user_${decoded.userId}`;
    const cached = userCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiry > now) {
      req.user = cached.user;
      return next();
    }

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        userPic: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid or inactive user" });
    }

    const userData: AuthUser = {
      ...user,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      userPic: user.userPic ?? undefined,
    };

    req.user = userData;

    // Cache the user data
    userCache.set(cacheKey, {
      user: userData,
      expiry: now + CACHE_TTL,
    });

    return next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: "Invalid token" });
    } else if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ error: "Token expired" });
    } else {
      return res.status(500).json({ error: "Authentication failed" });
    }
  }
};
// Optional auth - doesn't require token but sets user if present
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        try {
          const decoded = jwt.verify(token, secret) as JWTPayload;

          // Check cache first for optional auth too
          const cacheKey = `user_${decoded.userId}`;
          const cached = userCache.get(cacheKey);
          const now = Date.now();

          if (cached && cached.expiry > now) {
            req.user = cached.user;
            return next();
          }

          const user = await db.user.findUnique({
            where: { id: decoded.userId },
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
              userPic: true,
              isActive: true,
            },
          });

          if (user && user.isActive) {
            const userData: AuthUser = {
              ...user,
              firstName: user.firstName ?? undefined,
              lastName: user.lastName ?? undefined,
              userPic: user.userPic ?? undefined,
            };

            req.user = userData;

            // Cache the user data
            userCache.set(cacheKey, {
              user: userData,
              expiry: now + CACHE_TTL,
            });
          }

          return next();
        } catch (error) {
          // Silently fail for optional auth
          console.warn("Optional auth failed:", error);
        }
      }
    }
    next();
  } catch (error) {
    // Don't fail the request for optional auth
    console.warn("Optional auth error:", error);
    next();
  }
};

// Middleware to check if user is admin of a project
export const requireProjectAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const projectId = parseInt(req.params.projectId);
    if (!projectId) {
      return res.status(400).json({ error: "Project ID required" });
    }

    const membership = await db.projectMember.findFirst({
      where: {
        projectId,
        userId: req.user.id,
        role: "admin",
      },
    });

    if (!membership) {
      return res.status(403).json({ error: "Project admin access required" });
    }

    return next();
  } catch (error) {
    console.error("Project admin check error:", error);
    res.status(500).json({ error: "Authorization check failed" });
  }
};

// Middleware to check if user has access to a project (admin or member)
export const requireProjectAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const projectId = parseInt(
      req.params.projectId || (req.query.fkpoid as string)
    );
    if (!projectId) {
      return res.status(400).json({ error: "Project ID required" });
    }

    const membership = await db.projectMember.findFirst({
      where: {
        projectId,
        userId: req.user.id,
      },
    });

    if (!membership) {
      return res.status(403).json({ error: "Project access required" });
    }

    // Add project info to request for use in routes
    (req as any).projectMembership = membership;
    return next();
  } catch (error) {
    console.error("Project access check error:", error);
    res.status(500).json({ error: "Authorization check failed" });
  }
};
