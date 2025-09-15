import { AppDataSource } from "../../config/database";

// Subscription Plan Seeder
export const seedSubscriptionPlans = async () => {
    const planRepository = AppDataSource.getRepository('SubscriptionPlan');

    const plans = [
        {
            name: 'Free',
            description: 'Perfect for individual sellers getting started',
            monthly_price: 0.00,
            yearly_price: 0.00,
            currency: 'PHP',
            max_active_listings: 3,
            max_images_per_listing: 5,
            featured_listings_included: false,
            featured_listings_count: 0,
            premium_support: false,
            analytics_access: false,
            priority_approval: false,
            auto_repost: false,
            listing_duration_days: 30,
            boost_credits_monthly: 0,
            watermark_removal: false,
            contact_protection: false,
            sort_order: 1,
            is_active: true,
            is_popular: false,
            seo_slug: 'free-plan'
        },
        {
            name: 'Basic',
            description: 'Ideal for regular sellers who want more visibility',
            monthly_price: 299.00,
            yearly_price: 2999.00, // ~16% discount
            currency: 'PHP',
            max_active_listings: 10,
            max_images_per_listing: 10,
            featured_listings_included: true,
            featured_listings_count: 2,
            premium_support: false,
            analytics_access: true,
            priority_approval: false,
            auto_repost: true,
            listing_duration_days: 45,
            boost_credits_monthly: 2,
            watermark_removal: true,
            contact_protection: false,
            sort_order: 2,
            is_active: true,
            is_popular: true,
            seo_slug: 'basic-plan'
        },
        {
            name: 'Pro',
            description: 'Best for serious sellers and small dealers',
            monthly_price: 699.00,
            yearly_price: 6999.00, // ~16% discount
            currency: 'PHP',
            max_active_listings: 25,
            max_images_per_listing: 15,
            featured_listings_included: true,
            featured_listings_count: 5,
            premium_support: true,
            analytics_access: true,
            priority_approval: true,
            auto_repost: true,
            listing_duration_days: 60,
            boost_credits_monthly: 5,
            watermark_removal: true,
            contact_protection: true,
            sort_order: 3,
            is_active: true,
            is_popular: true,
            seo_slug: 'pro-plan'
        },
        {
            name: 'Business',
            description: 'Perfect for car dealers and business users',
            monthly_price: 1499.00,
            yearly_price: 14999.00, // ~16% discount
            currency: 'PHP',
            max_active_listings: 75,
            max_images_per_listing: 20,
            featured_listings_included: true,
            featured_listings_count: 15,
            premium_support: true,
            analytics_access: true,
            priority_approval: true,
            auto_repost: true,
            listing_duration_days: 90,
            boost_credits_monthly: 15,
            watermark_removal: true,
            contact_protection: true,
            sort_order: 4,
            is_active: true,
            is_popular: false,
            seo_slug: 'business-plan'
        },
        {
            name: 'Enterprise',
            description: 'For large dealers and automotive companies',
            monthly_price: 2999.00,
            yearly_price: 29999.00, // ~16% discount
            currency: 'PHP',
            max_active_listings: -1, // Unlimited
            max_images_per_listing: 25,
            featured_listings_included: true,
            featured_listings_count: -1, // Unlimited
            premium_support: true,
            analytics_access: true,
            priority_approval: true,
            auto_repost: true,
            listing_duration_days: 120,
            boost_credits_monthly: 50,
            watermark_removal: true,
            contact_protection: true,
            sort_order: 5,
            is_active: true,
            is_popular: false,
            seo_slug: 'enterprise-plan'
        }
    ];

    for (const plan of plans) {
        const existing = await planRepository.findOne({ where: { name: plan.name } });
        if (!existing) {
            await planRepository.save(plan);
        }
    }

    console.log('Subscription plans seeded successfully');
};