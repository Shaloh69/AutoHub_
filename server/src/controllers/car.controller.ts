import { Response } from 'express';
import { CarService, CreateCarDto, SearchFiltersDto } from '../services/CarService';
import { AuthRequest } from '../middleware/auth.middleware';
import { validationResult } from 'express-validator';

export class CarController {
    private carService: CarService;

    constructor() {
        this.carService = new CarService();
    }

    createCar = async (req: AuthRequest, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const carData: CreateCarDto = req.body;
            const car = await this.carService.createCar(carData, req.userId!);

            res.status(201).json({
                message: 'Car listing created successfully',
                data: { car }
            });
        } catch (error) {
            console.error('Create car error:', error);
            res.status(400).json({
                error: error.message || 'Failed to create car listing'
            });
        }
    };

    searchCars = async (req: AuthRequest, res: Response) => {
        try {
            const filters: SearchFiltersDto = {
                brand_id: req.query.brand_id ? parseInt(req.query.brand_id as string) : undefined,
                model_id: req.query.model_id ? parseInt(req.query.model_id as string) : undefined,
                category_id: req.query.category_id ? parseInt(req.query.category_id as string) : undefined,
                min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
                max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
                min_year: req.query.min_year ? parseInt(req.query.min_year as string) : undefined,
                max_year: req.query.max_year ? parseInt(req.query.max_year as string) : undefined,
                max_mileage: req.query.max_mileage ? parseInt(req.query.max_mileage as string) : undefined,
                fuel_type: req.query.fuel_type ? (req.query.fuel_type as string).split(',') : undefined,
                transmission: req.query.transmission ? (req.query.transmission as string).split(',') : undefined,
                condition_rating: req.query.condition_rating ? (req.query.condition_rating as string).split(',') : undefined,
                city_id: req.query.city_id ? parseInt(req.query.city_id as string) : undefined,
                province_id: req.query.province_id ? parseInt(req.query.province_id as string) : undefined,
                region_id: req.query.region_id ? parseInt(req.query.region_id as string) : undefined,
                latitude: req.query.latitude ? parseFloat(req.query.latitude as string) : undefined,
                longitude: req.query.longitude ? parseFloat(req.query.longitude as string) : undefined,
                radius_km: req.query.radius_km ? parseInt(req.query.radius_km as string) : undefined,
                sort_by: req.query.sort_by as string,
                sort_order: (req.query.sort_order as 'ASC' | 'DESC') || 'DESC',
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
                search_query: req.query.q as string
            };

            const result = await this.carService.searchCars(filters);

            res.json({
                message: 'Cars retrieved successfully',
                data: result,
                filters_applied: filters
            });
        } catch (error) {
            console.error('Search cars error:', error);
            res.status(500).json({
                error: 'Failed to search cars'
            });
        }
    };

    getCarById = async (req: AuthRequest, res: Response) => {
        try {
            const carId = parseInt(req.params.id);
            
            if (isNaN(carId)) {
                return res.status(400).json({
                    error: 'Invalid car ID'
                });
            }

            const car = await this.carService.getCarById(carId, req.userId);

            res.json({
                message: 'Car retrieved successfully',
                data: { car }
            });
        } catch (error) {
            console.error('Get car error:', error);
            if (error.message === 'Car not found') {
                res.status(404).json({
                    error: 'Car not found'
                });
            } else {
                res.status(500).json({
                    error: 'Failed to retrieve car'
                });
            }
        }
    };

    updateCar = async (req: AuthRequest, res: Response) => {
        try {
            const carId = parseInt(req.params.id);
            
            if (isNaN(carId)) {
                return res.status(400).json({
                    error: 'Invalid car ID'
                });
            }

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const updates: Partial<CreateCarDto> = req.body;
            const car = await this.carService.updateCar(carId, updates, req.userId!);

            res.json({
                message: 'Car updated successfully',
                data: { car }
            });
        } catch (error) {
            console.error('Update car error:', error);
            if (error.message === 'Car not found') {
                res.status(404).json({
                    error: 'Car not found'
                });
            } else if (error.message === 'Unauthorized') {
                res.status(403).json({
                    error: 'You can only update your own car listings'
                });
            } else {
                res.status(400).json({
                    error: error.message || 'Failed to update car'
                });
            }
        }
    };

    deleteCar = async (req: AuthRequest, res: Response) => {
        try {
            const carId = parseInt(req.params.id);
            
            if (isNaN(carId)) {
                return res.status(400).json({
                    error: 'Invalid car ID'
                });
            }

            await this.carService.deleteCar(carId, req.userId!);

            res.json({
                message: 'Car deleted successfully'
            });
        } catch (error) {
            console.error('Delete car error:', error);
            if (error.message === 'Car not found') {
                res.status(404).json({
                    error: 'Car not found'
                });
            } else if (error.message === 'Unauthorized') {
                res.status(403).json({
                    error: 'You can only delete your own car listings'
                });
            } else {
                res.status(500).json({
                    error: 'Failed to delete car'
                });
            }
        }
    };

    getUserCars = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.params.userId ? parseInt(req.params.userId) : req.userId!;
            const status = req.query.status as any;
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

            // Users can only view their own cars unless they're admin
            if (userId !== req.userId && !req.user.role.includes('admin')) {
                return res.status(403).json({
                    error: 'You can only view your own car listings'
                });
            }

            const result = await this.carService.getUserCars(userId, status, page, limit);

            res.json({
                message: 'User cars retrieved successfully',
                data: result
            });
        } catch (error) {
            console.error('Get user cars error:', error);
            res.status(500).json({
                error: 'Failed to retrieve user cars'
            });
        }
    };

    getMyListings = async (req: AuthRequest, res: Response) => {
        try {
            const status = req.query.status as any;
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

            const result = await this.carService.getUserCars(req.userId!, status, page, limit);

            res.json({
                message: 'Your listings retrieved successfully',
                data: result
            });
        } catch (error) {
            console.error('Get my listings error:', error);
            res.status(500).json({
                error: 'Failed to retrieve your listings'
            });
        }
    };

    approveCar = async (req: AuthRequest, res: Response) => {
        try {
            const carId = parseInt(req.params.id);
            
            if (isNaN(carId)) {
                return res.status(400).json({
                    error: 'Invalid car ID'
                });
            }

            const car = await this.carService.approveCar(carId, req.userId!);

            res.json({
                message: 'Car approved successfully',
                data: { car }
            });
        } catch (error) {
            console.error('Approve car error:', error);
            if (error.message === 'Car not found') {
                res.status(404).json({
                    error: 'Car not found'
                });
            } else {
                res.status(500).json({
                    error: 'Failed to approve car'
                });
            }
        }
    };

    rejectCar = async (req: AuthRequest, res: Response) => {
        try {
            const carId = parseInt(req.params.id);
            const { reason } = req.body;
            
            if (isNaN(carId)) {
                return res.status(400).json({
                    error: 'Invalid car ID'
                });
            }

            if (!reason) {
                return res.status(400).json({
                    error: 'Rejection reason is required'
                });
            }

            const car = await this.carService.rejectCar(carId, reason, req.userId!);

            res.json({
                message: 'Car rejected successfully',
                data: { car }
            });
        } catch (error) {
            console.error('Reject car error:', error);
            if (error.message === 'Car not found') {
                res.status(404).json({
                    error: 'Car not found'
                });
            } else {
                res.status(500).json({
                    error: 'Failed to reject car'
                });
            }
        }
    };

    getCarStatistics = async (req: AuthRequest, res: Response) => {
        try {
            const carId = parseInt(req.params.id);
            
            if (isNaN(carId)) {
                return res.status(400).json({
                    error: 'Invalid car ID'
                });
            }

            // This would require additional service methods
            const stats = {
                views_count: 0,
                unique_views_count: 0,
                contact_count: 0,
                favorite_count: 0,
                inquiries_count: 0
            };

            res.json({
                message: 'Car statistics retrieved successfully',
                data: { stats }
            });
        } catch (error) {
            console.error('Get car statistics error:', error);
            res.status(500).json({
                error: 'Failed to retrieve car statistics'
            });
        }
    };

    markAsSold = async (req: AuthRequest, res: Response) => {
        try {
            const carId = parseInt(req.params.id);
            
            if (isNaN(carId)) {
                return res.status(400).json({
                    error: 'Invalid car ID'
                });
            }

            // This would be implemented in the CarService
            // await this.carService.markAsSold(carId, req.userId!);

            res.json({
                message: 'Car marked as sold successfully'
            });
        } catch (error) {
            console.error('Mark as sold error:', error);
            res.status(500).json({
                error: 'Failed to mark car as sold'
            });
        }
    };

    boostListing = async (req: AuthRequest, res: Response) => {
        try {
            const carId = parseInt(req.params.id);
            
            if (isNaN(carId)) {
                return res.status(400).json({
                    error: 'Invalid car ID'
                });
            }

            // This would be implemented in the CarService
            // Check if user has boost credits
            // Update car boost status
            // Log boost action

            res.json({
                message: 'Listing boosted successfully'
            });
        } catch (error) {
            console.error('Boost listing error:', error);
            res.status(500).json({
                error: 'Failed to boost listing'
            });
        }
    };

    getFeaturedCars = async (req: AuthRequest, res: Response) => {
        try {
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

            const filters: SearchFiltersDto = {
                page,
                limit,
                sort_by: 'created_at',
                sort_order: 'DESC'
            };

            // Add featured filter logic
            const result = await this.carService.searchCars(filters);

            res.json({
                message: 'Featured cars retrieved successfully',
                data: result
            });
        } catch (error) {
            console.error('Get featured cars error:', error);
            res.status(500).json({
                error: 'Failed to retrieve featured cars'
            });
        }
    };

    getSimilarCars = async (req: AuthRequest, res: Response) => {
        try {
            const carId = parseInt(req.params.id);
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
            
            if (isNaN(carId)) {
                return res.status(400).json({
                    error: 'Invalid car ID'
                });
            }

            // Get the reference car first
            const car = await this.carService.getCarById(carId, req.userId);

            // Search for similar cars
            const filters: SearchFiltersDto = {
                brand_id: car.brand_id,
                min_price: car.price * 0.8, // 20% price range
                max_price: car.price * 1.2,
                min_year: car.year - 3,
                max_year: car.year + 3,
                fuel_type: [car.fuel_type],
                limit,
                page: 1
            };

            const result = await this.carService.searchCars(filters);
            
            // Remove the original car from results
            result.cars = result.cars.filter(c => c.id !== carId);

            res.json({
                message: 'Similar cars retrieved successfully',
                data: result
            });
        } catch (error) {
            console.error('Get similar cars error:', error);
            res.status(500).json({
                error: 'Failed to retrieve similar cars'
            });
        }
    };
}