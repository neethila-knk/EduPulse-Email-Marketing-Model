import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

interface StorageOptions {
  destination: string;
  allowedTypes: string[];
  maxSize?: number; 
}


export const createFileUpload = (options: StorageOptions) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "..", options.destination);
    
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
    
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    }
  });

  
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
      fileSize: options.maxSize || 5 * 1024 * 1024, 
    },
    fileFilter: fileFilter,
  });
};


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