import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

interface StorageOptions {
  destination: string;
  allowedTypes: string[];
  maxSize?: number; // in bytes
}

/**
 * Creates a multer instance configured for file uploads
 * @param options Configuration options for storage
 * @returns Configured multer instance
 */
export const createFileUpload = (options: StorageOptions) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "..", options.destination);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with original extension
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    }
  });

  // Set up file filter
  const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (options.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${options.allowedTypes.join(", ")}`));
    }
  };

  return multer({
    storage: storage,
    limits: {
      fileSize: options.maxSize || 5 * 1024 * 1024, // Default 5MB limit
    },
    fileFilter: fileFilter,
  });
};

/**
 * Deletes a file from the given path if it exists
 * @param filePath Path to the file to delete
 * @returns Promise that resolves when file is deleted or if it doesn't exist
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  if (fs.existsSync(filePath)) {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};