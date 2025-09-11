import { AppDataSource } from "../../config/database";


// Location Seeder (Philippines specific)
export const seedPhilippinesLocations = async () => {
    const regionRepository = AppDataSource.getRepository('PhRegion');
    const provinceRepository = AppDataSource.getRepository('PhProvince');
    const cityRepository = AppDataSource.getRepository('PhCity');

    // Seed regions
    const regions = [
        { region_code: 'NCR', name: 'Metro Manila', long_name: 'National Capital Region' },
        { region_code: 'CAR', name: 'Cordillera', long_name: 'Cordillera Administrative Region' },
        { region_code: 'I', name: 'Ilocos', long_name: 'Ilocos Region' },
        { region_code: 'II', name: 'Cagayan Valley', long_name: 'Cagayan Valley' },
        { region_code: 'III', name: 'Central Luzon', long_name: 'Central Luzon' },
        { region_code: 'IV-A', name: 'CALABARZON', long_name: 'CALABARZON' },
        { region_code: 'IV-B', name: 'MIMAROPA', long_name: 'MIMAROPA' },
        { region_code: 'V', name: 'Bicol', long_name: 'Bicol Region' },
        { region_code: 'VI', name: 'Western Visayas', long_name: 'Western Visayas' },
        { region_code: 'VII', name: 'Central Visayas', long_name: 'Central Visayas' },
        { region_code: 'VIII', name: 'Eastern Visayas', long_name: 'Eastern Visayas' },
        { region_code: 'IX', name: 'Zamboanga Peninsula', long_name: 'Zamboanga Peninsula' },
        { region_code: 'X', name: 'Northern Mindanao', long_name: 'Northern Mindanao' },
        { region_code: 'XI', name: 'Davao', long_name: 'Davao Region' },
        { region_code: 'XII', name: 'SOCCSKSARGEN', long_name: 'SOCCSKSARGEN' },
        { region_code: 'XIII', name: 'Caraga', long_name: 'Caraga' },
        { region_code: 'BARMM', name: 'BARMM', long_name: 'Bangsamoro Autonomous Region in Muslim Mindanao' }
    ];

    for (const region of regions) {
        const existing = await regionRepository.findOne({ where: { region_code: region.region_code } });
        if (!existing) {
            await regionRepository.save(region);
        }
    }

    // Seed key provinces
    const ncrRegion = await regionRepository.findOne({ where: { region_code: 'NCR' } });
    const centralLuzonRegion = await regionRepository.findOne({ where: { region_code: 'III' } });
    const calabarzonRegion = await regionRepository.findOne({ where: { region_code: 'IV-A' } });
    const centralVisayasRegion = await regionRepository.findOne({ where: { region_code: 'VII' } });
    const davaoRegion = await regionRepository.findOne({ where: { region_code: 'XI' } });

    const provinces = [
        { region_id: ncrRegion.id, province_code: 'NCR', name: 'Metro Manila', capital: 'Manila' },
        { region_id: centralLuzonRegion.id, province_code: 'BUL', name: 'Bulacan', capital: 'Malolos' },
        { region_id: centralLuzonRegion.id, province_code: 'PAM', name: 'Pampanga', capital: 'San Fernando' },
        { region_id: calabarzonRegion.id, province_code: 'CAV', name: 'Cavite', capital: 'Trece Martires' },
        { region_id: calabarzonRegion.id, province_code: 'LAG', name: 'Laguna', capital: 'Santa Cruz' },
        { region_id: calabarzonRegion.id, province_code: 'RIZ', name: 'Rizal', capital: 'Antipolo' },
        { region_id: centralVisayasRegion.id, province_code: 'CEB', name: 'Cebu', capital: 'Cebu City' },
        { region_id: davaoRegion.id, province_code: 'DAV', name: 'Davao del Sur', capital: 'Digos' }
    ];

    for (const province of provinces) {
        const existing = await provinceRepository.findOne({ where: { province_code: province.province_code } });
        if (!existing) {
            await provinceRepository.save(province);
        }
    }

    // Seed key cities
    const ncrProvince = await provinceRepository.findOne({ where: { province_code: 'NCR' } });
    const bulacanProvince = await provinceRepository.findOne({ where: { province_code: 'BUL' } });
    const caviteProvince = await provinceRepository.findOne({ where: { province_code: 'CAV' } });
    const cebuProvince = await provinceRepository.findOne({ where: { province_code: 'CEB' } });
    const davaoProvince = await provinceRepository.findOne({ where: { province_code: 'DAV' } });

    const cities = [
        { province_id: ncrProvince.id, name: 'Manila', city_type: 'city', is_highly_urbanized: true, latitude: 14.5995, longitude: 120.9842 },
        { province_id: ncrProvince.id, name: 'Quezon City', city_type: 'city', is_highly_urbanized: true, latitude: 14.6760, longitude: 121.0437 },
        { province_id: ncrProvince.id, name: 'Makati', city_type: 'city', is_highly_urbanized: true, latitude: 14.5547, longitude: 121.0244 },
        { province_id: ncrProvince.id, name: 'Pasig', city_type: 'city', is_highly_urbanized: true, latitude: 14.5764, longitude: 121.0851 },
        { province_id: ncrProvince.id, name: 'Taguig', city_type: 'city', is_highly_urbanized: true, latitude: 14.5176, longitude: 121.0509 },
        { province_id: ncrProvince.id, name: 'Mandaluyong', city_type: 'city', is_highly_urbanized: true, latitude: 14.5794, longitude: 121.0359 },
        { province_id: bulacanProvince.id, name: 'Malolos', city_type: 'city', is_highly_urbanized: false, latitude: 14.8437, longitude: 120.8110 },
        { province_id: caviteProvince.id, name: 'Bacoor', city_type: 'city', is_highly_urbanized: false, latitude: 14.4590, longitude: 120.9373 },
        { province_id: cebuProvince.id, name: 'Cebu City', city_type: 'city', is_highly_urbanized: true, latitude: 10.3157, longitude: 123.8854 },
        { province_id: davaoProvince.id, name: 'Davao City', city_type: 'city', is_highly_urbanized: true, latitude: 7.0731, longitude: 125.6128 }
    ];

    for (const city of cities) {
        const existing = await cityRepository.findOne({ where: { name: city.name, province_id: city.province_id } });
        if (!existing) {
            await cityRepository.save(city);
        }
    }
};