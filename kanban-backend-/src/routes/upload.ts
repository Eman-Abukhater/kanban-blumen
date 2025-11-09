import express from "express";
import { authenticateToken } from "../middleware/auth";
import { upload } from "../middleware/upload";
import cloudinary from "../config/cloudinary";
import path from "path";
import fs from "fs";

const router = express.Router();

// Detect production environment
const isProduction =
  process.env.RENDER === "true" ||
  process.env.NODE_ENV === "production" ||
  process.env.PORT === "10000" ||
  process.env.PORT === "8080";

// Upload image to Cloudinary
router.post("/image", upload.single("image"), async (req, res) => {
  try {
    console.log("Upload request received:", {
      file: req.file
        ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            hasBuffer: !!req.file.buffer,
            hasPath: !!req.file.path,
            path: req.file.path || "No path (memory storage)",
          }
        : "No file",
      environment: process.env.NODE_ENV,
      isProduction: isProduction,
      renderEnv: process.env.RENDER,
      port: process.env.PORT,
    });

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No image file provided",
      });
    }

    if (isProduction) {
      // For production - use buffer from memory storage
      console.log("Using production upload method with buffer");

      if (!req.file.buffer) {
        console.error("No buffer found in production mode");
        return res.status(500).json({
          status: "error",
          message: "File buffer not available in production mode",
        });
      }

      const uploadResult = cloudinary.uploader.upload_stream(
        {
          folder: "kanban-cards",
          transformation: [
            { width: 800, height: 800, crop: "limit" },
            { quality: "auto:good" },
          ],
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).json({
              status: "error",
              message: "Failed to upload image to Cloudinary",
              error: error.message,
            });
          }

          if (!result) {
            return res.status(500).json({
              status: "error",
              message: "Upload failed - no result returned",
            });
          }

          console.log("Upload successful:", result);
          return res.json({
            status: "success",
            message: "Image uploaded successfully",
            data: {
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
            },
          });
        }
      );

      // Pipe the buffer to Cloudinary
      uploadResult.end(req.file.buffer);
      // Response is handled in the callback above
      return;
    } else {
      // For development - use file path from disk storage
      console.log("Using development upload method with file path");

      if (!req.file.path) {
        console.error("No file path found in development mode");
        return res.status(500).json({
          status: "error",
          message: "File path not available in development mode",
        });
      }

      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "kanban-cards",
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto:good" },
        ],
      });

      // Delete local file after upload
      try {
        fs.unlinkSync(req.file.path);
        console.log("Local file deleted successfully");
      } catch (unlinkError) {
        console.error("Error deleting local file:", unlinkError);
      }

      return res.json({
        status: "success",
        message: "Image uploaded successfully",
        data: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
        },
      });
    }
  } catch (error: any) {
    console.error("Error uploading image:", error);

    // Clean up local file if it exists (development only)
    if (req.file && req.file.path && !isProduction) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting local file:", unlinkError);
      }
    }

    return res.status(500).json({
      status: "error",
      message: "Failed to upload image",
      error: error.message,
    });
  }
});

// Upload multiple files
router.post(
  "/multiple",
  authenticateToken,
  upload.array("files", 10),
  async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadPromises = files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "kanban-uploads",
          resource_type: "auto",
        });

        // Delete local file
        fs.unlinkSync(file.path);

        return {
          url: result.secure_url,
          publicId: result.public_id,
          originalName: file.originalname,
        };
      });

      const results = await Promise.all(uploadPromises);

      return res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error("Multiple upload error:", error);

      // Clean up local files
      const files = req.files as Express.Multer.File[];
      if (files) {
        files.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }

      return res.status(500).json({ error: "Failed to upload files" });
    }
  }
);

// Delete image from Cloudinary
router.delete("/image/:publicId", async (req, res) => {
  try {
    const { publicId } = req.params;

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      res.json({
        status: "success",
        message: "Image deleted successfully",
      });
    } else {
      res.status(400).json({
        status: "error",
        message: "Failed to delete image",
      });
    }
  } catch (error: any) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete image",
      error: error.message,
    });
  }
});

export default router;
