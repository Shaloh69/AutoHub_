import { Repository, SelectQueryBuilder, Between, MoreThan, LessThan, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Car, CarStatus, ApprovalStatus } from '../entities/Car';
import { User } from '../entities/User';
import { CarImage } from '../entities/CarImage';
import { PriceHistory } from '../entities/PriceHistory';
import { UserAction } from '../entities/UserAction';
import { SubscriptionService } from './SubscriptionService';
import { NotificationService } from './NotificationService';

export interface CreateCarDto {
    title: string;
    description?: string;
    year: number;
    price: number;
    currency?: string;
    mileage: number;
    fuel_type: string;
    transmission: string;
    brand_id: number;
    model_id: number;
    category_id?: number;
    condition_rating: string;
    city_id: number;
    province_id: number;
    region_id: number;
    negotiable?: boolean;
    financing_available?: boolean;
    trade_in_accepted?: boolean;
    engine_size?: string;
    horsepower?: number;
    drivetrain?: string;
    exterior_color_id?: number;
    interior_color_id?: number;
    accident_history?: boolean;
    flood_history?: boolean;
    number_of_owners?: number;
    warranty_remaining?: boolean;
    vin?: string;
    latitude?: number;
    longitude?: number;
    barangay?: string;
    detailed_address?: string;
}

export interface SearchFiltersDto {
    brand_id?: number;
    model_id?: number;
    category_id?: number;
    min_price?: number;
    max_price?: number;
    min_year?: number;
    max_year?: number;
    max_mileage?: number;
    fuel_type?: string[];
    transmission?: string[];
    condition_rating?: string[];
    city_id?: number;
    province_id?: number;
    region_id?: number;
    latitude?: number;
    longitude?: number;
    radius_km?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
    search_query?: string;
}

export interface CarWithDistance extends Car {
    distance_km?: number;
}

export class CarService {
    private carRepository: Repository<Car>;
    private userRepository: Repository<User>;
    private carImageRepository: Repository<CarImage>;
    private priceHistoryRepository: Repository<PriceHistory>;
    private userActionRepository: Repository<UserAction>;
    private subscriptionService: SubscriptionService;
    private notificationService: NotificationService;

    constructor() {
        this.carRepository = AppDataSource.getRepository(Car);
        this.userRepository = AppDataSource.getRepository(User);
        this.carImageRepository = AppDataSource.getRepository(CarImage);
        this.priceHistoryRepository = AppDataSource.getRepository(PriceHistory);
        this.userActionRepository = AppDataSource.getRepository(UserAction);
        this.subscriptionService = new SubscriptionService();
        this.notificationService = new NotificationService();
    }

    async createCar(carData: CreateCarDto, sellerId: number): Promise<Car> {
        // Check subscription limits
        const canCreate = await this.subscriptionService.canUserCreateListing(sellerId);
        if (!canCreate) {
            throw new Error('Listing limit reached. Please upgrade your subscription.');
        }

        // Validate year
        const currentYear = new Date().getFullYear();
        if (carData.year < 1900 || carData.year > currentYear + 1) {
            throw new Error('Invalid year');
        }

        // Validate price
        if (carData.price <= 0) {
            throw new Error('Price must be greater than 0');
        }

        // Generate SEO slug
        const seoSlug = await this.generateSeoSlug(carData.title, carData.year, carData.brand_id);

        // Calculate quality and completeness scores
        const qualityScore = this.calculateQualityScore(carData);
        const completenessScore = this.calculateCompletenessScore(carData);

        const car = this.carRepository.create({
            ...carData,
            seller_id: sellerId,
            status: CarStatus.PENDING,
            approval_status: ApprovalStatus.PENDING,
            seo_slug: seoSlug,
            quality_score: qualityScore,
            completeness_score: completenessScore,
            search_score: this.calculateSearchScore(qualityScore, completenessScore)
        });

        const savedCar = await this.carRepository.save(car);

        // Log car creation
        await this.logUserAction(sellerId, 'upload_car', 'car', savedCar.id);

        // Send notification to admin for approval
        await this.notificationService.notifyAdminNewCarSubmission(savedCar);

        return savedCar;
    }

    async searchCars(filters: SearchFiltersDto): Promise<{ cars: CarWithDistance[]; total: number; page: number; totalPages: number }> {
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 20, 50); // Max 50 per page
        const offset = (page - 1) * limit;

        let query = this.carRepository.createQueryBuilder('car')
            .leftJoinAndSelect('car.seller', 'seller')
            .leftJoinAndSelect('car.brand', 'brand')
            .leftJoinAndSelect('car.model', 'model')
            .leftJoinAndSelect('car.city', 'city')
            .leftJoinAndSelect('car.province', 'province')
            .leftJoinAndSelect('car.images', 'images', 'images.is_primary = true')
            .where('car.status = :status', { status: CarStatus.APPROVED })
            .andWhere('car.approval_status = :approvalStatus', { approvalStatus: ApprovalStatus.APPROVED });

        // Apply filters
        query = this.applySearchFilters(query, filters);

        // Apply location-based search if coordinates provided
        if (filters.latitude && filters.longitude && filters.radius_km) {
            query = this.applyLocationFilter(query, filters.latitude, filters.longitude, filters.radius_km);
        }

        // Apply text search
        if (filters.search_query) {
            query = this.applyTextSearch(query, filters.search_query);
        }

        // Apply sorting
        query = this.applySorting(query, filters.sort_by, filters.sort_order);

        // Get total count
        const total = await query.getCount();

        // Apply pagination
        query = query.limit(limit).offset(offset);

        const cars = await query.getMany();

        // Calculate distances if location provided
        const carsWithDistance = filters.latitude && filters.longitude 
            ? this.calculateDistances(cars, filters.latitude, filters.longitude)
            : cars;

        return {
            cars: carsWithDistance,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getCarById(id: number, userId?: number): Promise<Car> {
        const car = await this.carRepository.findOne({
            where: { id },
            relations: [
                'seller', 'brand', 'model', 'category',
                'city', 'province', 'region',
                'images', 'carFeatures', 'carFeatures.feature',
                'exterior_color', 'interior_color'
            ]
        });

        if (!car) {
            throw new Error('Car not found');
        }

        // Only show non-approved cars to the seller or admin
        if (car.approval_status !== ApprovalStatus.APPROVED) {
            if (!userId || (car.seller_id !== userId && !await this.isUserAdmin(userId))) {
                throw new Error('Car not found');
            }
        }

        // Increment view count
        await this.incrementViewCount(id, userId);

        return car;
    }

    async updateCar(id: number, updates: Partial<CreateCarDto>, userId: number): Promise<Car> {
        const car = await this.carRepository.findOne({
            where: { id },
            relations: ['seller']
        });

        if (!car) {
            throw new Error('Car not found');
        }

        // Check ownership or admin rights
        if (car.seller_id !== userId && !await this.isUserAdmin(userId)) {
            throw new Error('Unauthorized');
        }

        // Track price changes
        if (updates.price && updates.price !== car.price) {
            await this.recordPriceChange(id, car.price, updates.price, userId);
        }

        // Recalculate scores if content changed
        if (this.hasContentChanged(updates)) {
            updates.quality_score = this.calculateQualityScore({ ...car, ...updates } as any);
            updates.completeness_score = this.calculateCompletenessScore({ ...car, ...updates } as any);
            updates.search_score = this.calculateSearchScore(updates.quality_score, updates.completeness_score);
        }

        // If significant changes, reset approval status
        if (this.requiresReapproval(updates)) {
            updates.approval_status = ApprovalStatus.PENDING;
            updates.status = CarStatus.PENDING;
        }

        await this.carRepository.update(id, {
            ...updates,
            updated_at: new Date()
        });

        const updatedCar = await this.getCarById(id, userId);

        // Log update action
        await this.logUserAction(userId, 'edit_car', 'car', id);

        return updatedCar;
    }

    async deleteCar(id: number, userId: number): Promise<void> {
        const car = await this.carRepository.findOne({
            where: { id },
            relations: ['seller']
        });

        if (!car) {
            throw new Error('Car not found');
        }

        // Check ownership or admin rights
        if (car.seller_id !== userId && !await this.isUserAdmin(userId)) {
            throw new Error('Unauthorized');
        }

        // Soft delete by setting status
        await this.carRepository.update(id, {
            status: CarStatus.REMOVED,
            is_active: false
        });

        // Log delete action
        await this.logUserAction(userId, 'delete_car', 'car', id);
    }

    async getUserCars(userId: number, status?: CarStatus, page = 1, limit = 20): Promise<{ cars: Car[]; total: number; page: number; totalPages: number }> {
        const offset = (page - 1) * limit;

        let query = this.carRepository.createQueryBuilder('car')
            .leftJoinAndSelect('car.brand', 'brand')
            .leftJoinAndSelect('car.model', 'model')
            .leftJoinAndSelect('car.images', 'images', 'images.is_primary = true')
            .where('car.seller_id = :userId', { userId });

        if (status) {
            query = query.andWhere('car.status = :status', { status });
        }

        const total = await query.getCount();

        query = query
            .orderBy('car.created_at', 'DESC')
            .limit(limit)
            .offset(offset);

        const cars = await query.getMany();

        return {
            cars,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async approveCar(id: number, approvedBy: number): Promise<Car> {
        const car = await this.carRepository.findOne({
            where: { id },
            relations: ['seller']
        });

        if (!car) {
            throw new Error('Car not found');
        }

        await this.carRepository.update(id, {
            status: CarStatus.APPROVED,
            approval_status: ApprovalStatus.APPROVED,
            approved_by: approvedBy,
            approved_at: new Date()
        });

        // Notify seller
        await this.notificationService.notifyCarApproved(car.seller_id, id);

        // Log approval action
        await this.logUserAction(approvedBy, 'approve_car', 'car', id);

        return await this.getCarById(id);
    }

    async rejectCar(id: number, reason: string, rejectedBy: number): Promise<Car> {
        const car = await this.carRepository.findOne({
            where: { id },
            relations: ['seller']
        });

        if (!car) {
            throw new Error('Car not found');
        }

        await this.carRepository.update(id, {
            status: CarStatus.REJECTED,
            approval_status: ApprovalStatus.REJECTED,
            rejection_reason: reason,
            approved_by: rejectedBy,
            approved_at: new Date()
        });

        // Notify seller
        await this.notificationService.notifyCarRejected(car.seller_id, id, reason);

        // Log rejection action
        await this.logUserAction(rejectedBy, 'reject_car', 'car', id);

        return await this.getCarById(id);
    }

    private applySearchFilters(query: SelectQueryBuilder<Car>, filters: SearchFiltersDto): SelectQueryBuilder<Car> {
        if (filters.brand_id) {
            query = query.andWhere('car.brand_id = :brandId', { brandId: filters.brand_id });
        }

        if (filters.model_id) {
            query = query.andWhere('car.model_id = :modelId', { modelId: filters.model_id });
        }

        if (filters.category_id) {
            query = query.andWhere('car.category_id = :categoryId', { categoryId: filters.category_id });
        }

        if (filters.min_price) {
            query = query.andWhere('car.price >= :minPrice', { minPrice: filters.min_price });
        }

        if (filters.max_price) {
            query = query.andWhere('car.price <= :maxPrice', { maxPrice: filters.max_price });
        }

        if (filters.min_year) {
            query = query.andWhere('car.year >= :minYear', { minYear: filters.min_year });
        }

        if (filters.max_year) {
            query = query.andWhere('car.year <= :maxYear', { maxYear: filters.max_year });
        }

        if (filters.max_mileage) {
            query = query.andWhere('car.mileage <= :maxMileage', { maxMileage: filters.max_mileage });
        }

        if (filters.fuel_type && filters.fuel_type.length > 0) {
            query = query.andWhere('car.fuel_type IN (:...fuelTypes)', { fuelTypes: filters.fuel_type });
        }

        if (filters.transmission && filters.transmission.length > 0) {
            query = query.andWhere('car.transmission IN (:...transmissions)', { transmissions: filters.transmission });
        }

        if (filters.condition_rating && filters.condition_rating.length > 0) {
            query = query.andWhere('car.condition_rating IN (:...conditions)', { conditions: filters.condition_rating });
        }

        if (filters.city_id) {
            query = query.andWhere('car.city_id = :cityId', { cityId: filters.city_id });
        }

        if (filters.province_id) {
            query = query.andWhere('car.province_id = :provinceId', { provinceId: filters.province_id });
        }

        if (filters.region_id) {
            query = query.andWhere('car.region_id = :regionId', { regionId: filters.region_id });
        }

        return query;
    }

    private applyLocationFilter(query: SelectQueryBuilder<Car>, lat: number, lng: number, radiusKm: number): SelectQueryBuilder<Car> {
        // Use Haversine formula for distance calculation
        query = query.addSelect(
            `(6371 * acos(cos(radians(${lat})) * cos(radians(car.latitude)) * cos(radians(car.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(car.latitude))))`,
            'distance'
        );
        
        query = query.having('distance <= :radius', { radius: radiusKm });
        
        return query;
    }

    private applyTextSearch(query: SelectQueryBuilder<Car>, searchQuery: string): SelectQueryBuilder<Car> {
        const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 2);
        
        if (searchTerms.length > 0) {
            const conditions = searchTerms.map((term, index) => {
                return `(LOWER(car.title) LIKE :term${index} OR LOWER(car.description) LIKE :term${index} OR LOWER(brand.name) LIKE :term${index} OR LOWER(model.name) LIKE :term${index})`;
            }).join(' AND ');

            const parameters = searchTerms.reduce((params, term, index) => {
                params[`term${index}`] = `%${term}%`;
                return params;
            }, {} as any);

            query = query.andWhere(`(${conditions})`, parameters);
        }

        return query;
    }

    private applySorting(query: SelectQueryBuilder<Car>, sortBy?: string, sortOrder: 'ASC' | 'DESC' = 'DESC'): SelectQueryBuilder<Car> {
        switch (sortBy) {
            case 'price':
                query = query.orderBy('car.price', sortOrder);
                break;
            case 'year':
                query = query.orderBy('car.year', sortOrder);
                break;
            case 'mileage':
                query = query.orderBy('car.mileage', sortOrder === 'DESC' ? 'ASC' : 'DESC'); // Lower mileage is better
                break;
            case 'views':
                query = query.orderBy('car.views_count', sortOrder);
                break;
            case 'rating':
                query = query.orderBy('car.average_rating', sortOrder);
                break;
            case 'distance':
                // Only if distance was calculated
                query = query.orderBy('distance', 'ASC');
                break;
            default:
                // Default: featured first, then by creation date
                query = query
                    .orderBy('car.is_featured', 'DESC')
                    .addOrderBy('car.created_at', sortOrder);
        }

        return query;
    }

    private calculateDistances(cars: Car[], userLat: number, userLng: number): CarWithDistance[] {
        return cars.map(car => ({
            ...car,
            distance_km: this.calculateDistance(userLat, userLng, car.latitude, car.longitude)
        }));
    }

    private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 100) / 100; // Round to 2 decimal places
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    private async incrementViewCount(carId: number, userId?: number): Promise<void> {
        // Check if this is a unique view (user hasn't viewed this car in last 24 hours)
        const isUniqueView = userId ? await this.isUniqueView(carId, userId) : true;

        const updates: any = {
            views_count: () => 'views_count + 1'
        };

        if (isUniqueView) {
            updates.unique_views_count = () => 'unique_views_count + 1';
        }

        await this.carRepository.update(carId, updates);

        // Log view action
        if (userId) {
            await this.logUserAction(userId, 'view_car', 'car', carId);
        }
    }

    private async isUniqueView(carId: number, userId: number): Promise<boolean> {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const recentView = await this.userActionRepository.findOne({
            where: {
                user_id: userId,
                action_type: 'view_car' as any,
                target_id: carId,
                created_at: MoreThan(yesterday)
            }
        });

        return !recentView;
    }

    private async isUserAdmin(userId: number): Promise<boolean> {
        const user = await this.userRepository.findOne({
            where: { id: userId }
        });

        return user ? user.is_admin : false;
    }

    private calculateQualityScore(carData: any): number {
        let score = 0;

        // Title quality (20 points)
        if (carData.title && carData.title.length >= 20) score += 20;
        else if (carData.title && carData.title.length >= 10) score += 10;

        // Description quality (20 points)
        if (carData.description && carData.description.length >= 200) score += 20;
        else if (carData.description && carData.description.length >= 100) score += 10;

        // Technical details (30 points)
        if (carData.engine_size) score += 5;
        if (carData.horsepower) score += 5;
        if (carData.vin) score += 10;
        if (carData.drivetrain) score += 5;
        if (carData.warranty_remaining !== undefined) score += 5;

        // Condition details (20 points)
        if (carData.accident_history !== undefined) score += 5;
        if (carData.flood_history !== undefined) score += 5;
        if (carData.service_history !== undefined) score += 5;
        if (carData.number_of_owners) score += 5;

        // Location details (10 points)
        if (carData.detailed_address) score += 5;
        if (carData.barangay) score += 5;

        return Math.min(score, 100);
    }

    private calculateCompletenessScore(carData: any): number {
        const requiredFields = [
            'title', 'description', 'year', 'price', 'mileage',
            'fuel_type', 'transmission', 'condition_rating',
            'city_id', 'province_id', 'region_id'
        ];

        const optionalFields = [
            'engine_size', 'horsepower', 'drivetrain', 'exterior_color_id',
            'interior_color_id', 'vin', 'detailed_address', 'barangay'
        ];

        let filledRequired = 0;
        let filledOptional = 0;

        requiredFields.forEach(field => {
            if (carData[field] !== undefined && carData[field] !== null && carData[field] !== '') {
                filledRequired++;
            }
        });

        optionalFields.forEach(field => {
            if (carData[field] !== undefined && carData[field] !== null && carData[field] !== '') {
                filledOptional++;
            }
        });

        const requiredScore = (filledRequired / requiredFields.length) * 70;
        const optionalScore = (filledOptional / optionalFields.length) * 30;

        return Math.round(requiredScore + optionalScore);
    }

    private calculateSearchScore(qualityScore: number, completenessScore: number): number {
        return Math.round((qualityScore * 0.6 + completenessScore * 0.4) / 10);
    }

    private async generateSeoSlug(title: string, year: number, brandId: number): Promise<string> {
        const baseSlug = `${title}-${year}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        let slug = baseSlug;
        let counter = 1;

        while (await this.carRepository.findOne({ where: { seo_slug: slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    private hasContentChanged(updates: any): boolean {
        const contentFields = ['title', 'description', 'price', 'mileage', 'condition_rating'];
        return contentFields.some(field => updates[field] !== undefined);
    }

    private requiresReapproval(updates: any): boolean {
        const significantFields = ['title', 'description', 'price', 'brand_id', 'model_id', 'year'];
        return significantFields.some(field => updates[field] !== undefined);
    }

    private async recordPriceChange(carId: number, oldPrice: number, newPrice: number, userId: number): Promise<void> {
        const priceChange = this.priceHistoryRepository.create({
            car_id: carId,
            old_price: oldPrice,
            new_price: newPrice,
            price_change_percent: ((newPrice - oldPrice) / oldPrice) * 100,
            changed_by: userId,
            change_reason: 'manual'
        });

        await this.priceHistoryRepository.save(priceChange);
    }

    private async logUserAction(userId: number, action: string, targetType: string, targetId?: number): Promise<void> {
        try {
            const userAction = this.userActionRepository.create({
                user_id: userId,
                action_type: action as any,
                target_type: targetType as any,
                target_id: targetId,
                metadata: {}
            });

            await this.userActionRepository.save(userAction);
        } catch (error) {
            console.error('Failed to log user action:', error);
        }
    }
}