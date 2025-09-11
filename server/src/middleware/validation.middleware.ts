import { body, query, param } from 'express-validator';
import { UserRole } from '../entities/User';

// Authentication validations
export const validateRegistration = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('first_name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('last_name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('phone')
        .optional()
        .isMobilePhone('en-PH')
        .withMessage('Valid Philippine mobile number required'),
    body('role')
        .optional()
        .isIn(Object.values(UserRole))
        .withMessage('Invalid user role'),
    body('city_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Valid city ID required'),
    body('province_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Valid province ID required'),
    body('region_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Valid region ID required')
];

export const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

export const validatePasswordChange = [
    body('current_password')
        .notEmpty()
        .withMessage('Current password is required'),
    body('new_password')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Car validations
export const validateCarCreation = [
    body('title')
        .trim()
        .isLength({ min: 10, max: 255 })
        .withMessage('Title must be between 10 and 255 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Description cannot exceed 5000 characters'),
    body('year')
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
        .withMessage(`Year must be between 1900 and ${new Date().getFullYear() + 1}`),
    body('price')
        .isFloat({ min: 1000, max: 100000000 })
        .withMessage('Price must be between 1,000 and 100,000,000 PHP'),
    body('mileage')
        .isInt({ min: 0, max: 2000000 })
        .withMessage('Mileage must be between 0 and 2,000,000 km'),
    body('fuel_type')
        .isIn(['gasoline', 'diesel', 'hybrid', 'electric', 'cng', 'lpg', 'plugin-hybrid'])
        .withMessage('Invalid fuel type'),
    body('transmission')
        .isIn(['manual', 'automatic', 'semi-automatic', 'cvt'])
        .withMessage('Invalid transmission type'),
    body('condition_rating')
        .isIn(['excellent', 'very_good', 'good', 'fair', 'poor'])
        .withMessage('Invalid condition rating'),
    body('brand_id')
        .isInt({ min: 1 })
        .withMessage('Valid brand ID required'),
    body('model_id')
        .isInt({ min: 1 })
        .withMessage('Valid model ID required'),
    body('city_id')
        .isInt({ min: 1 })
        .withMessage('Valid city ID required'),
    body('province_id')
        .isInt({ min: 1 })
        .withMessage('Valid province ID required'),
    body('region_id')
        .isInt({ min: 1 })
        .withMessage('Valid region ID required'),
    body('latitude')
        .optional()
        .isFloat({ min: 4.0, max: 21.0 })
        .withMessage('Latitude must be within Philippines bounds (4.0 to 21.0)'),
    body('longitude')
        .optional()
        .isFloat({ min: 116.0, max: 127.0 })
        .withMessage('Longitude must be within Philippines bounds (116.0 to 127.0)'),
    body('engine_size')
        .optional()
        .matches(/^[\d.]+[L]?$/)
        .withMessage('Invalid engine size format'),
    body('horsepower')
        .optional()
        .isInt({ min: 50, max: 2000 })
        .withMessage('Horsepower must be between 50 and 2000'),
    body('number_of_owners')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Number of owners must be between 1 and 20'),
    body('vin')
        .optional()
        .isLength({ min: 17, max: 17 })
        .matches(/^[A-HJ-NPR-Z0-9]{17}$/)
        .withMessage('VIN must be exactly 17 characters (excluding I, O, Q)'),
    body('negotiable')
        .optional()
        .isBoolean()
        .withMessage('Negotiable must be a boolean'),
    body('financing_available')
        .optional()
        .isBoolean()
        .withMessage('Financing available must be a boolean'),
    body('trade_in_accepted')
        .optional()
        .isBoolean()
        .withMessage('Trade-in accepted must be a boolean')
];

export const validateCarUpdate = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 10, max: 255 })
        .withMessage('Title must be between 10 and 255 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Description cannot exceed 5000 characters'),
    body('price')
        .optional()
        .isFloat({ min: 1000, max: 100000000 })
        .withMessage('Price must be between 1,000 and 100,000,000 PHP'),
    body('mileage')
        .optional()
        .isInt({ min: 0, max: 2000000 })
        .withMessage('Mileage must be between 0 and 2,000,000 km'),
    body('condition_rating')
        .optional()
        .isIn(['excellent', 'very_good', 'good', 'fair', 'poor'])
        .withMessage('Invalid condition rating'),
    body('negotiable')
        .optional()
        .isBoolean()
        .withMessage('Negotiable must be a boolean'),
    body('financing_available')
        .optional()
        .isBoolean()
        .withMessage('Financing available must be a boolean')
];

// Subscription validations
export const validateSubscription = [
    body('plan_id')
        .isInt({ min: 1 })
        .withMessage('Valid plan ID required'),
    body('billing_cycle')
        .isIn(['monthly', 'yearly'])
        .withMessage('Billing cycle must be monthly or yearly'),
    body('payment_method_id')
        .notEmpty()
        .withMessage('Payment method ID is required')
];

// Search validations
export const validateSearch = [
    query('page')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Page must be between 1 and 1000'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    query('min_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum price must be positive'),
    query('max_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum price must be positive'),
    query('min_year')
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
        .withMessage('Invalid minimum year'),
    query('max_year')
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
        .withMessage('Invalid maximum year'),
    query('max_mileage')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Maximum mileage must be positive'),
    query('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Invalid latitude'),
    query('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Invalid longitude'),
    query('radius_km')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Radius must be between 1 and 1000 km'),
    query('sort_by')
        .optional()
        .isIn(['price', 'year', 'mileage', 'created_at', 'views', 'rating', 'distance'])
        .withMessage('Invalid sort field'),
    query('sort_order')
        .optional()
        .isIn(['ASC', 'DESC'])
        .withMessage('Sort order must be ASC or DESC')
];

// Admin validations
export const validateUserBan = [
    body('reason')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Ban reason must be between 10 and 500 characters'),
    body('duration')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Ban duration must be between 1 and 365 days')
];

export const validateCarRejection = [
    body('reason')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Rejection reason must be between 10 and 500 characters'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes cannot exceed 1000 characters')
];

// File upload validations
export const validateFileUpload = [
    body('file_type')
        .optional()
        .isIn(['image', 'document', 'video'])
        .withMessage('Invalid file type'),
    body('category')
        .optional()
        .isIn(['car_image', 'profile_image', 'document', 'verification'])
        .withMessage('Invalid file category')
];

// Inquiry validations
export const validateInquiry = [
    body('message')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Message must be between 10 and 2000 characters'),
    body('buyer_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Buyer name must be between 2 and 100 characters'),
    body('buyer_email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email required'),
    body('buyer_phone')
        .optional()
        .isMobilePhone('en-PH')
        .withMessage('Valid Philippine mobile number required'),
    body('inquiry_type')
        .optional()
        .isIn(['general', 'test_drive', 'price_negotiation', 'inspection', 'purchase_intent', 'financing', 'trade_in'])
        .withMessage('Invalid inquiry type'),
    body('offered_price')
        .optional()
        .isFloat({ min: 1000 })
        .withMessage('Offered price must be at least 1,000 PHP'),
    body('test_drive_requested')
        .optional()
        .isBoolean()
        .withMessage('Test drive requested must be a boolean'),
    body('inspection_requested')
        .optional()
        .isBoolean()
        .withMessage('Inspection requested must be a boolean'),
    body('financing_needed')
        .optional()
        .isBoolean()
        .withMessage('Financing needed must be a boolean')
];

// Common parameter validations
export const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Valid ID required')
];

export const validateUserId = [
    param('userId')
        .isInt({ min: 1 })
        .withMessage('Valid user ID required')
];

// Custom validation middleware
export const validatePaginationQueries = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt()
];

export const validateDateRange = [
    query('start_date')
        .optional()
        .isISO8601()
        .withMessage('Start date must be in ISO 8601 format'),
    query('end_date')
        .optional()
        .isISO8601()
        .withMessage('End date must be in ISO 8601 format')
];

// Location validation
export const validatePhilippinesCoordinates = [
    body('latitude')
        .isFloat({ min: 4.0, max: 21.0 })
        .withMessage('Latitude must be within Philippines bounds'),
    body('longitude')
        .isFloat({ min: 116.0, max: 127.0 })
        .withMessage('Longitude must be within Philippines bounds')
];

// Price validation with currency
export const validatePriceWithCurrency = [
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('currency')
        .optional()
        .isIn(['PHP', 'USD', 'EUR', 'JPY', 'AUD', 'SGD'])
        .withMessage('Invalid currency code')
];

// Rating validation
export const validateRating = [
    body('rating')
        .isFloat({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Comment cannot exceed 1000 characters')
];

// Notification validation
export const validateNotificationPreferences = [
    body('email_notifications')
        .optional()
        .isBoolean()
        .withMessage('Email notifications must be a boolean'),
    body('sms_notifications')
        .optional()
        .isBoolean()
        .withMessage('SMS notifications must be a boolean'),
    body('push_notifications')
        .optional()
        .isBoolean()
        .withMessage('Push notifications must be a boolean')
];

// Report validation
export const validateReport = [
    body('reason')
        .isIn(['spam', 'fraud', 'inappropriate', 'fake_listing', 'overpriced', 'other'])
        .withMessage('Invalid report reason'),
    body('description')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters')
];

// Webhook validation
export const validateWebhookSignature = [
    body()
        .custom((value, { req }) => {
            const signature = req.headers['stripe-signature'];
            if (!signature) {
                throw new Error('Webhook signature is required');
            }
            return true;
        })
];