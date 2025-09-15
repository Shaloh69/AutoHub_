import { AppDataSource } from "../../config/database";

// Category Seeder
export const seedCategories = async () => {
    const categoryRepository = AppDataSource.getRepository('Category');

    const categories = [
        {
            name: 'Passenger Cars',
            description: 'Personal vehicles for everyday transportation',
            parent_id: null,
            icon_class: 'fas fa-car',
            is_featured: true,
            sort_order: 1,
            seo_slug: 'passenger-cars',
            meta_title: 'Passenger Cars for Sale in Philippines',
            meta_description: 'Browse our wide selection of passenger cars for sale in the Philippines. Find sedans, hatchbacks, and compact cars from trusted sellers.'
        },
        {
            name: 'SUVs',
            description: 'Sport Utility Vehicles for families and adventures',
            parent_id: null,
            icon_class: 'fas fa-truck-pickup',
            is_featured: true,
            sort_order: 2,
            seo_slug: 'suvs',
            meta_title: 'SUVs for Sale in Philippines',
            meta_description: 'Find the perfect SUV for your family. Browse compact, mid-size, and full-size SUVs from various brands in the Philippines.'
        },
        {
            name: 'MPVs',
            description: 'Multi-Purpose Vehicles for large families',
            parent_id: null,
            icon_class: 'fas fa-shuttle-van',
            is_featured: true,
            sort_order: 3,
            seo_slug: 'mpvs',
            meta_title: 'MPVs for Sale in Philippines',
            meta_description: 'Shop for Multi-Purpose Vehicles (MPVs) perfect for large families and group transportation in the Philippines.'
        },
        {
            name: 'Pickup Trucks',
            description: 'Trucks for work and recreation',
            parent_id: null,
            icon_class: 'fas fa-truck',
            is_featured: true,
            sort_order: 4,
            seo_slug: 'pickup-trucks',
            meta_title: 'Pickup Trucks for Sale in Philippines',
            meta_description: 'Browse pickup trucks for work and personal use. Find single cab, double cab, and 4x4 trucks in the Philippines.'
        },
        {
            name: 'Motorcycles',
            description: 'Two-wheeled vehicles for efficient transportation',
            parent_id: null,
            icon_class: 'fas fa-motorcycle',
            is_featured: true,
            sort_order: 5,
            seo_slug: 'motorcycles',
            meta_title: 'Motorcycles for Sale in Philippines',
            meta_description: 'Find motorcycles for sale in the Philippines. Browse scooters, sport bikes, cruisers, and touring motorcycles.'
        },
        {
            name: 'Commercial Vehicles',
            description: 'Vehicles for business and commercial use',
            parent_id: null,
            icon_class: 'fas fa-shipping-fast',
            is_featured: false,
            sort_order: 6,
            seo_slug: 'commercial-vehicles',
            meta_title: 'Commercial Vehicles for Sale in Philippines',
            meta_description: 'Browse commercial vehicles including delivery trucks, buses, and fleet vehicles for business use in the Philippines.'
        },
        {
            name: 'Luxury Cars',
            description: 'Premium and luxury vehicles',
            parent_id: null,
            icon_class: 'fas fa-gem',
            is_featured: true,
            sort_order: 7,
            seo_slug: 'luxury-cars',
            meta_title: 'Luxury Cars for Sale in Philippines',
            meta_description: 'Discover luxury cars for sale in the Philippines. Browse premium sedans, sports cars, and exotic vehicles.'
        },
        {
            name: 'Electric Vehicles',
            description: 'Eco-friendly electric and hybrid vehicles',
            parent_id: null,
            icon_class: 'fas fa-leaf',
            is_featured: true,
            sort_order: 8,
            seo_slug: 'electric-vehicles',
            meta_title: 'Electric Vehicles for Sale in Philippines',
            meta_description: 'Browse electric and hybrid vehicles for sale in the Philippines. Find eco-friendly cars with the latest technology.'
        }
    ];

    // Sub-categories for Passenger Cars
    const passengerCarsCategory = await categoryRepository.findOne({ where: { name: 'Passenger Cars' } });
    let passengerCarsId = passengerCarsCategory?.id;

    if (!passengerCarsCategory) {
        const savedCategory = await categoryRepository.save(categories[0]);
        passengerCarsId = savedCategory.id;
    }

    const passengerSubCategories = [
        {
            name: 'Sedans',
            description: 'Four-door passenger cars',
            parent_id: passengerCarsId,
            icon_class: 'fas fa-car-side',
            is_featured: false,
            sort_order: 1,
            seo_slug: 'sedans',
            meta_title: 'Sedans for Sale in Philippines',
            meta_description: 'Browse sedan cars for sale in the Philippines. Find compact, mid-size, and full-size sedans.'
        },
        {
            name: 'Hatchbacks',
            description: 'Compact cars with rear hatch door',
            parent_id: passengerCarsId,
            icon_class: 'fas fa-car',
            is_featured: false,
            sort_order: 2,
            seo_slug: 'hatchbacks',
            meta_title: 'Hatchbacks for Sale in Philippines',
            meta_description: 'Shop for hatchback cars in the Philippines. Perfect for city driving and parking.'
        },
        {
            name: 'Coupes',
            description: 'Two-door sporty cars',
            parent_id: passengerCarsId,
            icon_class: 'fas fa-car',
            is_featured: false,
            sort_order: 3,
            seo_slug: 'coupes',
            meta_title: 'Coupes for Sale in Philippines',
            meta_description: 'Find sporty coupe cars for sale in the Philippines. Browse two-door sports and luxury coupes.'
        },
        {
            name: 'Convertibles',
            description: 'Cars with retractable roofs',
            parent_id: passengerCarsId,
            icon_class: 'fas fa-car',
            is_featured: false,
            sort_order: 4,
            seo_slug: 'convertibles',
            meta_title: 'Convertibles for Sale in Philippines',
            meta_description: 'Browse convertible cars for sale in the Philippines. Enjoy open-top driving experience.'
        }
    ];

    // Save all main categories first
    for (const category of categories) {
        const existing = await categoryRepository.findOne({ where: { name: category.name } });
        if (!existing) {
            await categoryRepository.save(category);
        }
    }

    // Save sub-categories
    for (const subCategory of passengerSubCategories) {
        const existing = await categoryRepository.findOne({ 
            where: { name: subCategory.name, parent_id: subCategory.parent_id } 
        });
        if (!existing) {
            await categoryRepository.save(subCategory);
        }
    }

    // Sub-categories for Motorcycles
    const motorcyclesCategory = await categoryRepository.findOne({ where: { name: 'Motorcycles' } });
    if (motorcyclesCategory) {
        const motorcycleSubCategories = [
            {
                name: 'Scooters',
                description: 'Automatic motorcycles for city riding',
                parent_id: motorcyclesCategory.id,
                icon_class: 'fas fa-motorcycle',
                is_featured: false,
                sort_order: 1,
                seo_slug: 'scooters',
                meta_title: 'Scooters for Sale in Philippines',
                meta_description: 'Browse scooters for sale in the Philippines. Perfect for city commuting and daily transportation.'
            },
            {
                name: 'Sport Bikes',
                description: 'High-performance motorcycles',
                parent_id: motorcyclesCategory.id,
                icon_class: 'fas fa-motorcycle',
                is_featured: false,
                sort_order: 2,
                seo_slug: 'sport-bikes',
                meta_title: 'Sport Bikes for Sale in Philippines',
                meta_description: 'Find sport bikes and racing motorcycles for sale in the Philippines.'
            },
            {
                name: 'Cruisers',
                description: 'Comfortable long-distance motorcycles',
                parent_id: motorcyclesCategory.id,
                icon_class: 'fas fa-motorcycle',
                is_featured: false,
                sort_order: 3,
                seo_slug: 'cruisers',
                meta_title: 'Cruiser Motorcycles for Sale in Philippines',
                meta_description: 'Browse cruiser motorcycles perfect for long rides and touring in the Philippines.'
            },
            {
                name: 'Off-Road',
                description: 'Dirt bikes and adventure motorcycles',
                parent_id: motorcyclesCategory.id,
                icon_class: 'fas fa-motorcycle',
                is_featured: false,
                sort_order: 4,
                seo_slug: 'off-road-motorcycles',
                meta_title: 'Off-Road Motorcycles for Sale in Philippines',
                meta_description: 'Find dirt bikes and adventure motorcycles for off-road riding in the Philippines.'
            }
        ];

        for (const subCategory of motorcycleSubCategories) {
            const existing = await categoryRepository.findOne({ 
                where: { name: subCategory.name, parent_id: subCategory.parent_id } 
            });
            if (!existing) {
                await categoryRepository.save(subCategory);
            }
        }
    }
};