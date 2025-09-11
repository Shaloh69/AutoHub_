// src/controllers/upload.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ImageService } from '../services/ImageService';

export class UploadController {
    private imageService: ImageService;

    constructor() {
        this.imageService = new ImageService();
    }

    uploadCarImages = async (req: AuthRequest, res: Response) => {
        try {
            const files = req.files as Express.Multer.File[];
            const carId = parseInt(req.body.car_id);

            if (!files || files.length === 0) {
                return res.status(400).json({
                    error: 'No images provided'
                });
            }

            if (isNaN(carId)) {
                return res.status(400).json({
                    error: 'Valid car ID required'
                });
            }

            const uploadedImages = await this.imageService.uploadCarImages(
                carId,
                files,
                req.userId!
            );

            res.status(201).json({
                message: 'Images uploaded successfully',
                data: { images: uploadedImages }
            });
        } catch (error) {
            console.error('Upload car images error:', error);
            res.status(400).json({
                error: error.message || 'Failed to upload images'
            });
        }
    };

    uploadProfileImage = async (req: AuthRequest, res: Response) => {
        try {
            const file = req.file as Express.Multer.File;

            if (!file) {
                return res.status(400).json({
                    error: 'No image provided'
                });
            }

            const imageUrl = await this.imageService.uploadProfileImage(file, req.userId!);

            res.status(201).json({
                message: 'Profile image uploaded successfully',
                data: { image_url: imageUrl }
            });
        } catch (error) {
            console.error('Upload profile image error:', error);
            res.status(400).json({
                error: error.message || 'Failed to upload profile image'
            });
        }
    };

    uploadDocuments = async (req: AuthRequest, res: Response) => {
        try {
            const files = req.files as Express.Multer.File[];
            const documentType = req.body.document_type;

            if (!files || files.length === 0) {
                return res.status(400).json({
                    error: 'No documents provided'
                });
            }

            const uploadedDocuments = await this.imageService.uploadDocuments(
                files,
                documentType,
                req.userId!
            );

            res.status(201).json({
                message: 'Documents uploaded successfully',
                data: { documents: uploadedDocuments }
            });
        } catch (error) {
            console.error('Upload documents error:', error);
            res.status(400).json({
                error: error.message || 'Failed to upload documents'
            });
        }
    };

    deleteImage = async (req: AuthRequest, res: Response) => {
        try {
            const imageId = parseInt(req.params.id);

            if (isNaN(imageId)) {
                return res.status(400).json({
                    error: 'Invalid image ID'
                });
            }

            await this.imageService.deleteImage(imageId, req.userId!);

            res.json({
                message: 'Image deleted successfully'
            });
        } catch (error) {
            console.error('Delete image error:', error);
            if (error.message === 'Image not found') {
                res.status(404).json({
                    error: 'Image not found'
                });
            } else {
                res.status(500).json({
                    error: 'Failed to delete image'
                });
            }
        }
    };

    setPrimaryImage = async (req: AuthRequest, res: Response) => {
        try {
            const imageId = parseInt(req.params.id);

            if (isNaN(imageId)) {
                return res.status(400).json({
                    error: 'Invalid image ID'
                });
            }

            await this.imageService.setPrimaryImage(imageId, req.userId!);

            res.json({
                message: 'Primary image set successfully'
            });
        } catch (error) {
            console.error('Set primary image error:', error);
            if (error.message === 'Image not found') {
                res.status(404).json({
                    error: 'Image not found'
                });
            } else {
                res.status(500).json({
                    error: 'Failed to set primary image'
                });
            }
        }
    };
}