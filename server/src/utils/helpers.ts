import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

// Date utilities
export const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year.toString())
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
};

export const isValidDate = (date: any): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
};

export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const subtractDays = (date: Date, days: number): Date => {
    return addDays(date, -days);
};

export const getDaysBetween = (startDate: Date, endDate: Date): number => {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

// String utilities
export const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

export const capitalize = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const truncate = (text: string, length: number, suffix: string = '...'): string => {
    if (text.length <= length) return text;
    return text.substring(0, length - suffix.length) + suffix;
};

export const generateRandomString = (length: number = 32): string => {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

export const generateUUID = (): string => {
    return crypto.randomUUID();
};

// Number utilities
export const formatPrice = (amount: number, currency: string = 'PHP'): string => {
    const formatter = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'JPY' ? 0 : 2
    });
    return formatter.format(amount);
};

export const formatNumber = (num: number, locale: string = 'en-PH'): string => {
    return new Intl.NumberFormat(locale).format(num);
};

export const roundToDecimal = (num: number, decimals: number = 2): number => {
    return Math.round((num + Number.EPSILON) * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const getPercentage = (value: number, total: number): number => {
    if (total === 0) return 0;
    return roundToDecimal((value / total) * 100);
};

// Array utilities
export const chunk = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

export const unique = <T>(array: T[]): T[] => {
    return [...new Set(array)];
};

export const groupBy = <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
    return array.reduce((groups, item) => {
        const group = String(item[key]);
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
    }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
};

// Object utilities
export const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
};

export const omit = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => {
        delete result[key];
    });
    return result;
};

export const isEmpty = (value: any): boolean => {
    if (value == null) return true;
    if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

export const deepClone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string, countryCode: string = 'PH'): boolean => {
    // Basic Philippine mobile number validation
    if (countryCode === 'PH') {
        const phRegex = /^(\+63|0)9\d{9}$/;
        return phRegex.test(phone);
    }
    return true; // Basic validation for other countries
};

export const isValidURL = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const isValidVIN = (vin: string): boolean => {
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    return vinRegex.test(vin);
};

// Password utilities
export const generatePassword = (length: number = 12): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each required type
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

// Location utilities (Philippines specific)
export const isValidPhilippinesCoordinate = (lat: number, lng: number): boolean => {
    return lat >= 4.0 && lat <= 21.0 && lng >= 116.0 && lng <= 127.0;
};

export const calculateDistance = (
    lat1: number, lng1: number, 
    lat2: number, lng2: number
): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
};

// File utilities
export const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
};

export const getMimeTypeFromExtension = (extension: string): string => {
    const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return mimeTypes[extension] || 'application/octet-stream';
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Search utilities
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
};

export const sanitizeSearchQuery = (query: string): string => {
    return query
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
};

// Error utilities
export const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error?.message) return error.message;
    return 'An unexpected error occurred';
};

export const logError = (error: any, context?: string): void => {
    const timestamp = new Date().toISOString();
    const message = getErrorMessage(error);
    const stack = error?.stack || '';
    
    console.error(`[${timestamp}] ${context ? `[${context}] ` : ''}${message}`);
    if (stack && process.env.NODE_ENV === 'development') {
        console.error(stack);
    }
};

// Pagination utilities
export const calculatePagination = (page: number, limit: number, total: number) => {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    const offset = (page - 1) * limit;
    
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
        offset,
        from: total > 0 ? offset + 1 : 0,
        to: Math.min(offset + limit, total)
    };
};

// Cache utilities
export const generateCacheKey = (...parts: string[]): string => {
    return parts.join(':');
};

export const parseCacheKey = (key: string): string[] => {
    return key.split(':');
};

// Time utilities
export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const timeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Operation timed out')), ms)
        )
    ]);
};

// Type utilities
export const isString = (value: any): value is string => {
    return typeof value === 'string';
};

export const isNumber = (value: any): value is number => {
    return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: any): value is boolean => {
    return typeof value === 'boolean';
};

export const isObject = (value: any): value is object => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};

export const isArray = (value: any): value is any[] => {
    return Array.isArray(value);
};

// Philippines specific utilities
export const formatPhilippinePhone = (phone: string): string => {
    // Convert to standard format: +63XXXXXXXXXX
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('63')) {
        return `+${cleaned}`;
    }
    
    if (cleaned.startsWith('09')) {
        return `+63${cleaned.substring(1)}`;
    }
    
    if (cleaned.startsWith('9') && cleaned.length === 10) {
        return `+63${cleaned}`;
    }
    
    return phone; // Return as-is if can't format
};

export const maskSensitiveData = (value: string, type: 'email' | 'phone' | 'card'): string => {
    switch (type) {
        case 'email':
            const [local, domain] = value.split('@');
            return `${local.substring(0, 2)}${'*'.repeat(local.length - 2)}@${domain}`;
        
        case 'phone':
            return value.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
        
        case 'card':
            return `****-****-****-${value.slice(-4)}`;
        
        default:
            return value;
    }
};

// Export all utilities as a default object
export default {
    // Date
    formatDate,
    isValidDate,
    addDays,
    subtractDays,
    getDaysBetween,
    
    // String
    slugify,
    capitalize,
    truncate,
    generateRandomString,
    generateUUID,
    
    // Number
    formatPrice,
    formatNumber,
    roundToDecimal,
    getPercentage,
    
    // Array
    chunk,
    unique,
    groupBy,
    sortBy,
    
    // Object
    pick,
    omit,
    isEmpty,
    deepClone,
    
    // Validation
    isValidEmail,
    isValidPhoneNumber,
    isValidURL,
    isValidVIN,
    
    // Password
    generatePassword,
    hashPassword,
    comparePassword,
    
    // Location
    isValidPhilippinesCoordinate,
    calculateDistance,
    
    // File
    getFileExtension,
    getMimeTypeFromExtension,
    formatFileSize,
    
    // Search
    highlightSearchTerm,
    sanitizeSearchQuery,
    
    // Error
    getErrorMessage,
    logError,
    
    // Pagination
    calculatePagination,
    
    // Cache
    generateCacheKey,
    parseCacheKey,
    
    // Time
    sleep,
    timeout,
    
    // Type checking
    isString,
    isNumber,
    isBoolean,
    isObject,
    isArray,
    
    // Philippines specific
    formatPhilippinePhone,
    maskSensitiveData
};