import { AppDataSource } from "../../config/database";

// System Configuration Seeder
export const seedSystemConfig = async () => {
    const systemConfigRepository = AppDataSource.getRepository('SystemConfig');

    const configs = [
        // General Settings
        {
            config_key: 'site_name',
            config_value: 'Car Marketplace Philippines',
            data_type: 'string',
            category: 'general',
            description: 'The name of the website',
            is_public: true,
            is_editable: true
        },
        {
            config_key: 'site_description',
            config_value: 'The largest online car marketplace in the Philippines. Buy and sell cars with confidence.',
            data_type: 'text',
            category: 'general',
            description: 'Website description for SEO',
            is_public: true,
            is_editable: true
        },
        {
            config_key: 'site_keywords',
            config_value: 'cars, philippines, buy car, sell car, used cars, new cars, automotive',
            data_type: 'text',
            category: 'general',
            description: 'SEO keywords for the website',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'maintenance_mode',
            config_value: 'false',
            data_type: 'boolean',
            category: 'general',
            description: 'Enable/disable maintenance mode',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'allow_registrations',
            config_value: 'true',
            data_type: 'boolean',
            category: 'general',
            description: 'Allow new user registrations',
            is_public: false,
            is_editable: true
        },

        // Email Settings
        {
            config_key: 'smtp_host',
            config_value: 'smtp.gmail.com',
            data_type: 'string',
            category: 'email',
            description: 'SMTP server hostname',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'smtp_port',
            config_value: '587',
            data_type: 'integer',
            category: 'email',
            description: 'SMTP server port',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'from_email',
            config_value: 'noreply@carmarketplace.ph',
            data_type: 'string',
            category: 'email',
            description: 'Default from email address',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'from_name',
            config_value: 'Car Marketplace Philippines',
            data_type: 'string',
            category: 'email',
            description: 'Default from name',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'admin_email',
            config_value: 'admin@carmarketplace.ph',
            data_type: 'string',
            category: 'email',
            description: 'Admin notification email',
            is_public: false,
            is_editable: true
        },

        // File Upload Settings
        {
            config_key: 'max_file_size_mb',
            config_value: '10',
            data_type: 'integer',
            category: 'uploads',
            description: 'Maximum file size in MB',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'max_images_per_listing',
            config_value: '20',
            data_type: 'integer',
            category: 'uploads',
            description: 'Maximum images per car listing',
            is_public: true,
            is_editable: true
        },
        {
            config_key: 'allowed_image_types',
            config_value: 'jpg,jpeg,png,webp',
            data_type: 'string',
            category: 'uploads',
            description: 'Allowed image file extensions',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'image_quality',
            config_value: '85',
            data_type: 'integer',
            category: 'uploads',
            description: 'Image compression quality (1-100)',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'generate_thumbnails',
            config_value: 'true',
            data_type: 'boolean',
            category: 'uploads',
            description: 'Generate image thumbnails',
            is_public: false,
            is_editable: true
        },

        // Listing Settings
        {
            config_key: 'free_listing_limit',
            config_value: '3',
            data_type: 'integer',
            category: 'listings',
            description: 'Number of free listings per user',
            is_public: true,
            is_editable: true
        },
        {
            config_key: 'listing_approval_required',
            config_value: 'true',
            data_type: 'boolean',
            category: 'listings',
            description: 'Require admin approval for listings',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'auto_expire_listings',
            config_value: 'true',
            data_type: 'boolean',
            category: 'listings',
            description: 'Automatically expire old listings',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'listing_duration_days',
            config_value: '30',
            data_type: 'integer',
            category: 'listings',
            description: 'Default listing duration in days',
            is_public: true,
            is_editable: true
        },
        {
            config_key: 'featured_listing_duration_days',
            config_value: '7',
            data_type: 'integer',
            category: 'listings',
            description: 'Featured listing duration in days',
            is_public: true,
            is_editable: true
        },

        // Payment Settings
        {
            config_key: 'payment_currency',
            config_value: 'PHP',
            data_type: 'string',
            category: 'payments',
            description: 'Default payment currency',
            is_public: true,
            is_editable: false
        },
        {
            config_key: 'stripe_enabled',
            config_value: 'true',
            data_type: 'boolean',
            category: 'payments',
            description: 'Enable Stripe payments',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'paypal_enabled',
            config_value: 'false',
            data_type: 'boolean',
            category: 'payments',
            description: 'Enable PayPal payments',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'gcash_enabled',
            config_value: 'false',
            data_type: 'boolean',
            category: 'payments',
            description: 'Enable GCash payments',
            is_public: false,
            is_editable: true
        },

        // Security Settings
        {
            config_key: 'enable_rate_limiting',
            config_value: 'true',
            data_type: 'boolean',
            category: 'security',
            description: 'Enable API rate limiting',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'max_login_attempts',
            config_value: '5',
            data_type: 'integer',
            category: 'security',
            description: 'Maximum login attempts before lockout',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'lockout_duration_minutes',
            config_value: '15',
            data_type: 'integer',
            category: 'security',
            description: 'Account lockout duration in minutes',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'require_email_verification',
            config_value: 'true',
            data_type: 'boolean',
            category: 'security',
            description: 'Require email verification for new accounts',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'session_timeout_hours',
            config_value: '24',
            data_type: 'integer',
            category: 'security',
            description: 'Session timeout in hours',
            is_public: false,
            is_editable: true
        },

        // Notification Settings
        {
            config_key: 'enable_email_notifications',
            config_value: 'true',
            data_type: 'boolean',
            category: 'notifications',
            description: 'Enable email notifications',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'enable_sms_notifications',
            config_value: 'false',
            data_type: 'boolean',
            category: 'notifications',
            description: 'Enable SMS notifications',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'enable_push_notifications',
            config_value: 'true',
            data_type: 'boolean',
            category: 'notifications',
            description: 'Enable push notifications',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'notification_batch_size',
            config_value: '100',
            data_type: 'integer',
            category: 'notifications',
            description: 'Notification batch processing size',
            is_public: false,
            is_editable: true
        },

        // Analytics Settings
        {
            config_key: 'google_analytics_id',
            config_value: '',
            data_type: 'string',
            category: 'analytics',
            description: 'Google Analytics tracking ID',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'facebook_pixel_id',
            config_value: '',
            data_type: 'string',
            category: 'analytics',
            description: 'Facebook Pixel ID',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'enable_user_tracking',
            config_value: 'true',
            data_type: 'boolean',
            category: 'analytics',
            description: 'Enable user behavior tracking',
            is_public: false,
            is_editable: true
        },

        // Search Settings
        {
            config_key: 'search_results_per_page',
            config_value: '20',
            data_type: 'integer',
            category: 'search',
            description: 'Number of search results per page',
            is_public: true,
            is_editable: true
        },
        {
            config_key: 'enable_search_suggestions',
            config_value: 'true',
            data_type: 'boolean',
            category: 'search',
            description: 'Enable search auto-suggestions',
            is_public: false,
            is_editable: true
        },
        {
            config_key: 'max_search_radius_km',
            config_value: '100',
            data_type: 'integer',
            category: 'search',
            description: 'Maximum search radius in kilometers',
            is_public: true,
            is_editable: true
        },

        // Social Media Links
        {
            config_key: 'facebook_url',
            config_value: 'https://facebook.com/carmarketplaceph',
            data_type: 'string',
            category: 'social',
            description: 'Facebook page URL',
            is_public: true,
            is_editable: true
        },
        {
            config_key: 'twitter_url',
            config_value: 'https://twitter.com/carmarketplaceph',
            data_type: 'string',
            category: 'social',
            description: 'Twitter profile URL',
            is_public: true,
            is_editable: true
        },
        {
            config_key: 'instagram_url',
            config_value: 'https://instagram.com/carmarketplaceph',
            data_type: 'string',
            category: 'social',
            description: 'Instagram profile URL',
            is_public: true,
            is_editable: true
        },

        // Contact Information
        {
            config_key: 'contact_phone',
            config_value: '+63 2 8123 4567',
            data_type: 'string',
            category: 'contact',
            description: 'Contact phone number',
            is_public: true,
            is_editable: true
        },
        {
            config_key: 'contact_email',
            config_value: 'support@carmarketplace.ph',
            data_type: 'string',
            category: 'contact',
            description: 'Contact email address',
            is_public: true,
            is_editable: true
        },
        {
            config_key: 'business_address',
            config_value: 'Makati City, Metro Manila, Philippines',
            data_type: 'text',
            category: 'contact',
            description: 'Business address',
            is_public: true,
            is_editable: true
        }
    ];

    for (const config of configs) {
        const existing = await systemConfigRepository.findOne({ where: { config_key: config.config_key } });
        if (!existing) {
            await systemConfigRepository.save(config);
        }
    }

    console.log('System configuration seeded successfully');
};