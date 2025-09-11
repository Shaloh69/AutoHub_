import { AppDataSource } from "../../config/database";
// Brand and Model Seeder
export const seedBrandsAndModels = async () => {
    const brandRepository = AppDataSource.getRepository('Brand');
    const modelRepository = AppDataSource.getRepository('Model');

    const brandsData = [
        {
            name: 'Toyota',
            country_origin: 'Japan',
            brand_type: 'mainstream',
            is_popular_in_ph: true,
            seo_slug: 'toyota',
            models: [
                { name: 'Vios', body_type: 'sedan', year_start: 2003, is_popular_in_ph: true },
                { name: 'Innova', body_type: 'mpv', year_start: 2004, is_popular_in_ph: true },
                { name: 'Fortuner', body_type: 'suv', year_start: 2005, is_popular_in_ph: true },
                { name: 'Camry', body_type: 'sedan', year_start: 1983, is_popular_in_ph: true },
                { name: 'Corolla', body_type: 'sedan', year_start: 1966, is_popular_in_ph: true }
            ]
        },
        {
            name: 'Honda',
            country_origin: 'Japan',
            brand_type: 'mainstream',
            is_popular_in_ph: true,
            seo_slug: 'honda',
            models: [
                { name: 'City', body_type: 'sedan', year_start: 1996, is_popular_in_ph: true },
                { name: 'Civic', body_type: 'sedan', year_start: 1972, is_popular_in_ph: true },
                { name: 'Accord', body_type: 'sedan', year_start: 1976, is_popular_in_ph: true },
                { name: 'CR-V', body_type: 'suv', year_start: 1995, is_popular_in_ph: true },
                { name: 'BR-V', body_type: 'suv', year_start: 2015, is_popular_in_ph: true }
            ]
        },
        {
            name: 'Mitsubishi',
            country_origin: 'Japan',
            brand_type: 'mainstream',
            is_popular_in_ph: true,
            seo_slug: 'mitsubishi',
            models: [
                { name: 'Montero Sport', body_type: 'suv', year_start: 1996, is_popular_in_ph: true },
                { name: 'Mirage', body_type: 'hatchback', year_start: 1978, is_popular_in_ph: true },
                { name: 'Strada', body_type: 'pickup', year_start: 2006, is_popular_in_ph: true },
                { name: 'Pajero', body_type: 'suv', year_start: 1982, is_popular_in_ph: true }
            ]
        },
        {
            name: 'Hyundai',
            country_origin: 'South Korea',
            brand_type: 'mainstream',
            is_popular_in_ph: true,
            seo_slug: 'hyundai',
            models: [
                { name: 'Accent', body_type: 'sedan', year_start: 1994, is_popular_in_ph: true },
                { name: 'Tucson', body_type: 'suv', year_start: 2004, is_popular_in_ph: true },
                { name: 'Santa Fe', body_type: 'suv', year_start: 2000, is_popular_in_ph: true },
                { name: 'Elantra', body_type: 'sedan', year_start: 1990, is_popular_in_ph: true }
            ]
        }
    ];

    for (const brandData of brandsData) {
        let brand = await brandRepository.findOne({ where: { name: brandData.name } });
        
        if (!brand) {
            const { models, ...brandInfo } = brandData;
            brand = await brandRepository.save(brandInfo);
        }

        // Seed models
        for (const modelData of brandData.models) {
            const existing = await modelRepository.findOne({ 
                where: { name: modelData.name, brand_id: brand.id } 
            });
            
            if (!existing) {
                await modelRepository.save({
                    ...modelData,
                    brand_id: brand.id,
                    seo_slug: `${brandData.seo_slug}-${modelData.name.toLowerCase().replace(/\s+/g, '-')}`
                });
            }
        }
    }
};
