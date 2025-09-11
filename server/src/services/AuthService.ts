import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { UserAction } from '../entities/UserAction';

export interface RegisterDto {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role?: UserRole;
    city_id?: number;
    province_id?: number;
    region_id?: number;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
}

export class AuthService {
    private userRepository: Repository<User>;
    private userActionRepository: Repository<UserAction>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.userActionRepository = AppDataSource.getRepository(UserAction);
    }

    async register(userData: RegisterDto, ip?: string): Promise<AuthResponse> {
        // Check if user already exists
        const existingUser = await this.userRepository.findOne({
            where: { email: userData.email }
        });

        if (existingUser) {
            throw new Error('User already exists with this email');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            throw new Error('Invalid email format');
        }

        // Validate password strength
        if (userData.password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(userData.password, saltRounds);

        // Create user
        const user = this.userRepository.create({
            ...userData,
            password_hash: passwordHash,
            role: userData.role || UserRole.BUYER,
            email: userData.email.toLowerCase(),
            email_verified: false,
            phone_verified: false,
            is_active: true,
            last_login_ip: ip,
            login_count: 1,
            last_login_at: new Date()
        });

        const savedUser = await this.userRepository.save(user);

        // Log registration action
        await this.logUserAction(savedUser.id, 'register', 'system', null, ip);

        // Generate tokens
        const token = this.generateAccessToken(savedUser.id, savedUser.email, savedUser.role);
        const refreshToken = this.generateRefreshToken(savedUser.id);

        // Remove password hash from response
        delete (savedUser as any).password_hash;

        return {
            user: savedUser,
            token,
            refreshToken,
            expiresIn: 24 * 60 * 60 // 24 hours in seconds
        };
    }

    async login(loginData: LoginDto, ip?: string): Promise<AuthResponse> {
        const { email, password } = loginData;

        // Find user by email
        const user = await this.userRepository.findOne({
            where: { email: email.toLowerCase() },
            relations: ['city', 'province', 'region']
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check if user is banned
        if (user.is_banned) {
            if (user.ban_expires_at && user.ban_expires_at > new Date()) {
                throw new Error(`Account is banned until ${user.ban_expires_at.toLocaleDateString()}`);
            } else if (!user.ban_expires_at) {
                throw new Error('Account is permanently banned');
            }
        }

        // Check if user is active
        if (!user.is_active) {
            throw new Error('Account is deactivated');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        // Update login tracking
        await this.userRepository.update(user.id, {
            last_login_at: new Date(),
            last_login_ip: ip,
            login_count: user.login_count + 1
        });

        // Log login action
        await this.logUserAction(user.id, 'login', 'system', null, ip);

        // Generate tokens
        const token = this.generateAccessToken(user.id, user.email, user.role);
        const refreshToken = this.generateRefreshToken(user.id);

        // Remove password hash from response
        delete (user as any).password_hash;

        return {
            user,
            token,
            refreshToken,
            expiresIn: 24 * 60 * 60 // 24 hours in seconds
        };
    }

    async refreshToken(refreshToken: string): Promise<{ token: string; expiresIn: number }> {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
            
            const user = await this.userRepository.findOne({
                where: { id: decoded.userId }
            });

            if (!user || !user.is_active || user.is_banned) {
                throw new Error('Invalid refresh token');
            }

            const newToken = this.generateAccessToken(user.id, user.email, user.role);

            return {
                token: newToken,
                expiresIn: 24 * 60 * 60
            };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    async forgotPassword(email: string): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            // Don't reveal if email exists or not
            return;
        }

        // Generate reset token
        const resetToken = this.generatePasswordResetToken(user.id);
        
        // In production, send email with reset link
        console.log(`Password reset token for ${email}: ${resetToken}`);
        
        // Store reset token with expiry (implement password_reset_tokens table)
        // await this.storePasswordResetToken(user.id, resetToken);
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        try {
            const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET!) as any;
            
            const user = await this.userRepository.findOne({
                where: { id: decoded.userId }
            });

            if (!user) {
                throw new Error('Invalid reset token');
            }

            // Validate new password
            if (newPassword.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }

            // Hash new password
            const passwordHash = await bcrypt.hash(newPassword, 12);

            // Update password
            await this.userRepository.update(user.id, {
                password_hash: passwordHash
            });

            // Log password reset action
            await this.logUserAction(user.id, 'password_reset', 'system');

        } catch (error) {
            throw new Error('Invalid or expired reset token');
        }
    }

    async verifyEmail(token: string): Promise<void> {
        try {
            const decoded = jwt.verify(token, process.env.JWT_VERIFY_SECRET!) as any;
            
            await this.userRepository.update(decoded.userId, {
                email_verified: true
            });

        } catch (error) {
            throw new Error('Invalid verification token');
        }
    }

    async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        // Validate new password
        if (newPassword.length < 8) {
            throw new Error('New password must be at least 8 characters long');
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 12);

        // Update password
        await this.userRepository.update(userId, {
            password_hash: passwordHash
        });

        // Log password change action
        await this.logUserAction(userId, 'password_change', 'system');
    }

    private generateAccessToken(userId: number, email: string, role: UserRole): string {
        return jwt.sign(
            { 
                userId, 
                email, 
                role,
                type: 'access'
            },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );
    }

    private generateRefreshToken(userId: number): string {
        return jwt.sign(
            { 
                userId,
                type: 'refresh'
            },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: '7d' }
        );
    }

    private generatePasswordResetToken(userId: number): string {
        return jwt.sign(
            { 
                userId,
                type: 'reset'
            },
            process.env.JWT_RESET_SECRET!,
            { expiresIn: '1h' }
        );
    }

    private generateEmailVerificationToken(userId: number): string {
        return jwt.sign(
            { 
                userId,
                type: 'verify'
            },
            process.env.JWT_VERIFY_SECRET!,
            { expiresIn: '24h' }
        );
    }

    private async logUserAction(
        userId: number, 
        action: string, 
        targetType: string, 
        targetId?: number, 
        ip?: string
    ): Promise<void> {
        try {
            const userAction = this.userActionRepository.create({
                user_id: userId,
                action_type: action as any,
                target_type: targetType as any,
                target_id: targetId,
                ip_address: ip,
                metadata: {}
            });

            await this.userActionRepository.save(userAction);
        } catch (error) {
            console.error('Failed to log user action:', error);
        }
    }

    async validateToken(token: string): Promise<any> {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            
            if (decoded.type !== 'access') {
                throw new Error('Invalid token type');
            }

            const user = await this.userRepository.findOne({
                where: { id: decoded.userId }
            });

            if (!user || !user.is_active || user.is_banned) {
                throw new Error('Invalid token');
            }

            return decoded;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
}