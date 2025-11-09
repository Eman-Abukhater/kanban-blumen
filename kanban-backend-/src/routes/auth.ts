import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../config/database";
import { validateBody, validateParams } from "../middleware/validation";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Simple helper function - no complex typing needed
const generateToken = (userId: number): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  // Simple approach - use jwt.sign directly with three parameters
  return jwt.sign(
    { userId },
    secret,
    { expiresIn: "7d" } // Hardcode the expiry for simplicity
  );
};

// Register new user
router.post("/register", validateBody(registerSchema), async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        error:
          existingUser.email === email
            ? "Email already registered"
            : "Username already taken",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        userPic: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken(user.id);

    return res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

// Login user
router.post("/login", validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Return minimal user data for speed (just id and token)
    // Frontend can fetch full user data later if needed
    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: (req as any).user.id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        userPic: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ error: "Failed to get user info" });
  }
});

// Verify token (lightweight - no DB lookup for speed)
router.post("/verify-fast", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token required" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    // Only verify JWT signature and expiry - no DB lookup
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & {
      userId: number;
    };

    return res.json({
      success: true,
      data: {
        userId: decoded.userId,
        valid: true,
      },
    });
  } catch (error) {
    return res.status(401).json({ error: "Invalid token", success: false });
  }
});

// Verify token (full - with user data)
router.post("/verify", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token required" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & {
      userId: number;
    };

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
      return res.status(401).json({ error: "Invalid token" });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

// Change password
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.id;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new passwords required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    // Get user with password
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ error: "Failed to change password" });
  }
});

// Logout
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Logout failed" });
  }
});

export default router;
