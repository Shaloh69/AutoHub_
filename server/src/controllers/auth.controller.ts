import { Request, Response } from 'express';
import { AuthService, RegisterDto, LoginDto } from '../services/AuthService';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    register = async (req: Request, res: Response) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const registerData: RegisterDto = req.body;
            const ip = req.ip || req.connection.remoteAddress;

            const result = await this.authService.register(registerData, ip);

            res.status(201).json({
                message: 'User registered successfully',
                data: {
                    user: {
                        id: result.user.id,
                        email: result.user.email,
                        first_name: result.user.first_name,
                        last_name: result.user.last_name,
                        role: result.user.role,
                        email_verified: result.user.email_verified,
                        phone_verified: result.user.phone_verified
                    },
                    token: result.token,
                    refresh_token: result.refreshToken,
                    expires_in: result.expiresIn
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(400).json({
                error: error.message || 'Registration failed'
            });
        }
    };

    login = async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const loginData: LoginDto = req.body;
            const ip = req.ip || req.connection.remoteAddress;

            const result = await this.authService.login(loginData, ip);

            res.json({
                message: 'Login successful',
                data: {
                    user: {
                        id: result.user.id,
                        email: result.user.email,
                        first_name: result.user.first_name,
                        last_name: result.user.last_name,
                        role: result.user.role,
                        email_verified: result.user.email_verified,
                        phone_verified: result.user.phone_verified,
                        subscription_status: result.user.subscription_status,
                        subscription_expires_at: result.user.subscription_expires_at
                    },
                    token: result.token,
                    refresh_token: result.refreshToken,
                    expires_in: result.expiresIn
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(401).json({
                error: error.message || 'Login failed'
            });
        }
    };

    refreshToken = async (req: Request, res: Response) => {
        try {
            const { refresh_token } = req.body;

            if (!refresh_token) {
                return res.status(400).json({
                    error: 'Refresh token is required'
                });
            }

            const result = await this.authService.refreshToken(refresh_token);

            res.json({
                message: 'Token refreshed successfully',
                data: {
                    token: result.token,
                    expires_in: result.expiresIn
                }
            });
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(401).json({
                error: error.message || 'Token refresh failed'
            });
        }
    };

    forgotPassword = async (req: Request, res: Response) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    error: 'Email is required'
                });
            }

            await this.authService.forgotPassword(email);

            res.json({
                message: 'If an account with that email exists, a password reset link has been sent'
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                error: 'Failed to process password reset request'
            });
        }
    };

    resetPassword = async (req: Request, res: Response) => {
        try {
            const { token, new_password } = req.body;

            if (!token || !new_password) {
                return res.status(400).json({
                    error: 'Token and new password are required'
                });
            }

            await this.authService.resetPassword(token, new_password);

            res.json({
                message: 'Password reset successfully'
            });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(400).json({
                error: error.message || 'Password reset failed'
            });
        }
    };

    verifyEmail = async (req: Request, res: Response) => {
        try {
            const { token } = req.params;

            await this.authService.verifyEmail(token);

            res.json({
                message: 'Email verified successfully'
            });
        } catch (error) {
            console.error('Email verification error:', error);
            res.status(400).json({
                error: error.message || 'Email verification failed'
            });
        }
    };

    changePassword = async (req: AuthRequest, res: Response) => {
        try {
            const { current_password, new_password } = req.body;

            if (!current_password || !new_password) {
                return res.status(400).json({
                    error: 'Current password and new password are required'
                });
            }

            await this.authService.changePassword(
                req.userId!,
                current_password,
                new_password
            );

            res.json({
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(400).json({
                error: error.message || 'Password change failed'
            });
        }
    };

    profile = async (req: AuthRequest, res: Response) => {
        try {
            // The user information is already available from the auth middleware
            const userRepository = require('../config/database').AppDataSource.getRepository('User');
            const user = await userRepository.findOne({
                where: { id: req.userId },
                relations: ['city', 'province', 'region'],
                select: [
                    'id', 'email', 'first_name', 'last_name', 'phone', 'role',
                    'profile_image', 'address', 'city_id', 'province_id', 'region_id',
                    'postal_code', 'barangay', 'email_verified', 'phone_verified',
                    'identity_verified', 'business_verified', 'average_rating',
                    'total_ratings', 'total_sales', 'total_purchases',
                    'subscription_status', 'subscription_expires_at',
                    'preferred_currency', 'email_notifications', 'sms_notifications',
                    'push_notifications', 'created_at'
                ]
            });

            if (!user) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            res.json({
                message: 'Profile retrieved successfully',
                data: { user }
            });
        } catch (error) {
            console.error('Profile retrieval error:', error);
            res.status(500).json({
                error: 'Failed to retrieve profile'
            });
        }
    };

    updateProfile = async (req: AuthRequest, res: Response) => {
        try {
            const allowedUpdates = [
                'first_name', 'last_name', 'phone', 'address', 'city_id',
                'province_id', 'region_id', 'postal_code', 'barangay',
                'business_name', 'business_permit_number', 'tin_number',
                'dealer_license_number', 'preferred_currency', 'email_notifications',
                'sms_notifications', 'push_notifications'
            ];

            const updates = Object.keys(req.body)
                .filter(key => allowedUpdates.includes(key))
                .reduce((obj, key) => {
                    obj[key] = req.body[key];
                    return obj;
                }, {} as any);

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({
                    error: 'No valid fields to update'
                });
            }

            const userRepository = require('../config/database').AppDataSource.getRepository('User');
            await userRepository.update(req.userId, updates);

            const updatedUser = await userRepository.findOne({
                where: { id: req.userId },
                relations: ['city', 'province', 'region'],
                select: [
                    'id', 'email', 'first_name', 'last_name', 'phone', 'role',
                    'profile_image', 'address', 'city_id', 'province_id', 'region_id',
                    'postal_code', 'barangay', 'email_verified', 'phone_verified',
                    'identity_verified', 'business_verified', 'preferred_currency',
                    'email_notifications', 'sms_notifications', 'push_notifications'
                ]
            });

            res.json({
                message: 'Profile updated successfully',
                data: { user: updatedUser }
            });
        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({
                error: 'Failed to update profile'
            });
        }
    };

    logout = async (req: AuthRequest, res: Response) => {
        try {
            // In a production environment with Redis, you would:
            // 1. Add the token to a blacklist
            // 2. Clear any session data
            // 3. Log the logout action

            res.json({
                message: 'Logged out successfully'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                error: 'Logout failed'
            });
        }
    };

    validateToken = async (req: AuthRequest, res: Response) => {
        try {
            // If we reach here, the token is valid (middleware already validated it)
            res.json({
                message: 'Token is valid',
                data: {
                    user_id: req.userId,
                    email: req.user.email,
                    role: req.user.role
                }
            });
        } catch (error) {
            console.error('Token validation error:', error);
            res.status(500).json({
                error: 'Token validation failed'
            });
        }
    };
}