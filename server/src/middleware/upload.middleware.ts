import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from './error.middleware';

// Allowed file types
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
];

const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB

// Storage configuration
const storage = multer.memoryStorage();

// File filter function
const createFileFilter = (allowedTypes: string[], maxSize: number) => {
    return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        // Check file type
        if (!allowedTypes.includes(file.mimetype)) {
            const error = new AppError(
                `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
                400,
                'INVALID_FILE_TYPE'
            );
            return cb(error);
        }

        // Check file size (note: this is approximate since we're using memory storage)
        if (file.size && file.size > maxSize) {
            const error = new AppError(
                `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
                400,
                'FILE_TOO_LARGE'
            );
            return cb(error);
        }

        cb(null, true);
    };
};

// Image upload middleware
export const uploadMiddleware = multer({
    storage,
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE),
    limits: {
        fileSize: MAX_IMAGE_SIZE,
        files: 20 // Maximum number of files
    }
});

// Document upload middleware
export const documentUploadMiddleware = multer({
    storage,
    fileFilter: createFileFilter(ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE),
    limits: {
        fileSize: MAX_DOCUMENT_SIZE,
        files: 5
    }
});

// Profile image upload middleware (single file, smaller size)
export const profileUploadMiddleware = multer({
    storage,
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES, 2 * 1024 * 1024), // 2MB for profile images
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1
    }
});

// Validation helpers
export const validateImageDimensions = (file: Express.Multer.File): Promise<boolean> => {
    return new Promise((resolve) => {
        // This would typically use a library like 'sharp' to validate dimensions
        // For now, just resolve true
        resolve(true);
    });
};

export const validateImageQuality = (file: Express.Multer.File): boolean => {
    // Basic validation - check if file is not corrupted
    return file.buffer && file.buffer.length > 0;
};

// File type detection based on buffer (more secure than mime type)
export const detectFileType = (buffer: Buffer): string | null => {
    // JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'image/jpeg';
    }
    
    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'image/png';
    }
    
    // WebP
    if (buffer.slice(8, 12).toString() === 'WEBP') {
        return 'image/webp';
    }
    
    // GIF
    if (buffer.slice(0, 3).toString() === 'GIF') {
        return 'image/gif';
    }
    
    // PDF
    if (buffer.slice(0, 4).toString() === '%PDF') {
        return 'application/pdf';
    }
    
    return null;
};

// Advanced file validation middleware
export const advancedFileValidation = (req: Request, res: any, next: any) => {
    if (!req.files && !req.file) {
        return next();
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    
    for (const file of files) {
        if (!file) continue;
        
        // Detect actual file type from buffer
        const detectedType = detectFileType(file.buffer);
        
        if (!detectedType) {
            return next(new AppError('Could not determine file type', 400, 'INVALID_FILE'));
        }
        
        // Check if detected type matches declared mime type
        if (detectedType !== file.mimetype) {
            return next(new AppError('File type mismatch', 400, 'FILE_TYPE_MISMATCH'));
        }
        
        // Validate image quality
        if (detectedType.startsWith('image/') && !validateImageQuality(file)) {
            return next(new AppError('Corrupted image file', 400, 'CORRUPTED_FILE'));
        }
    }
    
    next();
};

// File sanitization
export const sanitizeFileName = (filename: string): string => {
    return filename
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
};

// Generate unique filename
export const generateUniqueFileName = (originalName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const sanitizedName = sanitizeFileName(name);
    
    return `${timestamp}-${random}-${sanitizedName}${ext}`;
};

// Image processing helpers (would typically use sharp or similar)
export const processImage = async (buffer: Buffer, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
}): Promise<Buffer> => {
    // This would typically use a library like 'sharp' for image processing
    // For now, just return the original buffer
    return buffer;
};

// Create thumbnail
export const createThumbnail = async (buffer: Buffer, size: number = 150): Promise<Buffer> => {
    // This would create a thumbnail using sharp or similar
    return buffer;
};

// Virus scanning (placeholder)
export const scanForVirus = async (buffer: Buffer): Promise<boolean> => {
    // This would integrate with a virus scanning service
    // For now, just return true (clean)
    return true;
};

// Cloud storage helpers (AWS S3, Cloudinary, etc.)
export interface CloudUploadResult {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    size: number;
}

export const uploadToCloud = async (
    buffer: Buffer, 
    filename: string,
    folder: string = 'uploads'
): Promise<CloudUploadResult> => {
    // This would upload to your cloud storage provider
    // For development, we'll simulate cloud upload
    
    const uniqueFilename = generateUniqueFileName(filename);
    const url = `/uploads/${folder}/${uniqueFilename}`;
    
    return {
        url,
        publicId: uniqueFilename,
        size: buffer.length
    };
};

// Delete from cloud storage
export const deleteFromCloud = async (publicId: string): Promise<void> => {
    // This would delete from your cloud storage provider
    console.log(`Deleting file with public ID: ${publicId}`);
};

// Comprehensive upload handler
export const handleFileUpload = async (
    file: Express.Multer.File,
    folder: string,
    options: {
        createThumbnail?: boolean;
        thumbnailSize?: number;
        processImage?: boolean;
        imageOptions?: {
            width?: number;
            height?: number;
            quality?: number;
        };
    } = {}
): Promise<{
    original: CloudUploadResult;
    thumbnail?: CloudUploadResult;
    processed?: CloudUploadResult;
}> => {
    const result: any = {};
    
    // Scan for viruses
    const isClean = await scanForVirus(file.buffer);
    if (!isClean) {
        throw new AppError('File failed security scan', 400, 'SECURITY_SCAN_FAILED');
    }
    
    // Upload original file
    result.original = await uploadToCloud(file.buffer, file.originalname, folder);
    
    // Create thumbnail if requested and file is an image
    if (options.createThumbnail && file.mimetype.startsWith('image/')) {
        const thumbnailBuffer = await createThumbnail(file.buffer, options.thumbnailSize);
        const thumbnailFilename = `thumb_${file.originalname}`;
        result.thumbnail = await uploadToCloud(thumbnailBuffer, thumbnailFilename, `${folder}/thumbnails`);
    }
    
    // Process image if requested
    if (options.processImage && file.mimetype.startsWith('image/') && options.imageOptions) {
        const processedBuffer = await processImage(file.buffer, options.imageOptions);
        const processedFilename = `processed_${file.originalname}`;
        result.processed = await uploadToCloud(processedBuffer, processedFilename, `${folder}/processed`);
    }
    
    return result;
};

// Export configured middlewares
export default {
    single: uploadMiddleware.single.bind(uploadMiddleware),
    array: uploadMiddleware.array.bind(uploadMiddleware),
    fields: uploadMiddleware.fields.bind(uploadMiddleware),
    document: documentUploadMiddleware,
    profile: profileUploadMiddleware,
    validation: advancedFileValidation,
    handler: handleFileUpload
};