// src/services/ImageService.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { CarImage } from '../entities/CarImage';
import { Car } from '../entities/Car';
import { User } from '../entities/User';
import * as path from 'path';
import * as fs from 'fs/promises';

export class ImageService {
    private carImageRepository: Repository<CarImage>;
    private carRepository: Repository<Car>;
    private userRepository: Repository<User>;

    constructor() {
        this.carImageRepository = AppDataSource.getRepository(CarImage);
        this.carRepository = AppDataSource.getRepository(Car);
        this.userRepository = AppDataSource.getRepository(User);
    }

    async uploadCarImages(carId: number, files: Express.Multer.File[], userId: number): Promise<CarImage[]> {
        // Verify car ownership
        const car = await this.carRepository.findOne({
            where: { id: carId, seller_id: userId }
        });

        if (!car) {
            throw new Error('Car not found or unauthorized');
        }

        // Check existing images count
        const existingImagesCount = await this.carImageRepository.count({
            where: { car_id: carId }
        });

        const maxImages = 20; // or get from subscription limits
        if (existingImagesCount + files.length > maxImages) {
            throw new Error(`Maximum ${maxImages} images allowed per car`);
        }

        const uploadedImages: CarImage[] = [];

        for (const file of files) {
            const imageUrl = await this.saveImageFile(file, 'car-images');
            
            const carImage = this.carImageRepository.create({
                car_id: carId,
                image_url: imageUrl,
                file_size: file.size,
                image_type: 'exterior',
                processing_status: 'ready',
                is_primary: existingImagesCount === 0 && uploadedImages.length === 0
            });

            const savedImage = await this.carImageRepository.save(carImage);
            uploadedImages.push(savedImage);
        }

        return uploadedImages;
    }

    async uploadProfileImage(file: Express.Multer.File, userId: number): Promise<string> {
        const imageUrl = await this.saveImageFile(file, 'profile-images');

        // Update user profile image
        await this.userRepository.update(userId, {
            profile_image: imageUrl
        });

        return imageUrl;
    }

    async uploadDocuments(files: Express.Multer.File[], documentType: string, userId: number): Promise<string[]> {
        const uploadedUrls: string[] = [];

        for (const file of files) {
            const documentUrl = await this.saveImageFile(file, 'documents');
            uploadedUrls.push(documentUrl);
        }

        return uploadedUrls;
    }

    async deleteImage(imageId: number, userId: number): Promise<void> {
        const image = await this.carImageRepository.findOne({
            where: { id: imageId },
            relations: ['car']
        });

        if (!image) {
            throw new Error('Image not found');
        }

        // Check ownership
        if (image.car.seller_id !== userId) {
            throw new Error('Unauthorized');
        }

        // Delete file from storage
        await this.deleteImageFile(image.image_url);

        // Delete from database
        await this.carImageRepository.delete(imageId);
    }

    async setPrimaryImage(imageId: number, userId: number): Promise<void> {
        const image = await this.carImageRepository.findOne({
            where: { id: imageId },
            relations: ['car']
        });

        if (!image) {
            throw new Error('Image not found');
        }

        // Check ownership
        if (image.car.seller_id !== userId) {
            throw new Error('Unauthorized');
        }

        // Unset current primary image
        await this.carImageRepository.update(
            { car_id: image.car_id, is_primary: true },
            { is_primary: false }
        );

        // Set new primary image
        await this.carImageRepository.update(imageId, { is_primary: true });
    }

    private async saveImageFile(file: Express.Multer.File, folder: string): Promise<string> {
        // In production, this would upload to AWS S3, Cloudinary, etc.
        // For now, save locally
        const uploadDir = path.join(process.cwd(), 'uploads', folder);
        await fs.mkdir(uploadDir, { recursive: true });

        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
        const filepath = path.join(uploadDir, filename);

        await fs.writeFile(filepath, file.buffer);

        // Return URL that would be accessible publicly
        return `/uploads/${folder}/${filename}`;
    }

    private async deleteImageFile(imageUrl: string): Promise<void> {
        try {
            const filepath = path.join(process.cwd(), imageUrl);
            await fs.unlink(filepath);
        } catch (error) {
            console.error('Failed to delete image file:', error);
        }
    }
}