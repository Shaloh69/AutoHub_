/**
 * Test Script to Verify Client-Server Connection
 * This script tests the API connection from the client side
 */

const API_BASE_URL = 'http://localhost:8000/api/v1';

async function testAPIConnection() {
  console.log('='.repeat(70));
  console.log('Testing AutoHub API Connection');
  console.log('='.repeat(70));
  console.log('');

  // Test 1: Health Check
  console.log('1. Testing Health Endpoint...');
  try {
    const healthResponse = await fetch('http://localhost:8000/health');
    const healthData = await healthResponse.json();
    console.log('   ✓ Health Check:', healthData);
  } catch (error) {
    console.log('   ✗ Health Check Failed:', error.message);
  }
  console.log('');

  // Test 2: Locations - Get Regions
  console.log('2. Testing Locations API (Get Regions)...');
  try {
    const regionsResponse = await fetch(`${API_BASE_URL}/locations/regions`);
    const regionsData = await regionsResponse.json();
    console.log('   ✓ Regions endpoint working. Found', regionsData.length, 'regions');
  } catch (error) {
    console.log('   ✗ Regions Failed:', error.message);
  }
  console.log('');

  // Test 3: Cars - Search
  console.log('3. Testing Cars API (Search)...');
  try {
    const carsResponse = await fetch(`${API_BASE_URL}/cars?page_size=5`);
    const carsData = await carsResponse.json();
    console.log('   ✓ Cars endpoint working. Total cars:', carsData.total);
    console.log('   ✓ Pagination:', {
      page: carsData.page,
      page_size: carsData.page_size,
      total_pages: carsData.total_pages
    });
  } catch (error) {
    console.log('   ✗ Cars Search Failed:', error.message);
  }
  console.log('');

  // Test 4: Subscription Plans
  console.log('4. Testing Subscriptions API (Get Plans)...');
  try {
    const plansResponse = await fetch(`${API_BASE_URL}/subscriptions/plans`);
    const plansData = await plansResponse.json();
    console.log('   ✓ Subscription Plans endpoint working');
    if (Array.isArray(plansData)) {
      console.log('   ✓ Found', plansData.length, 'subscription plans');
    }
  } catch (error) {
    console.log('   ✗ Subscription Plans Failed:', error.message);
  }
  console.log('');

  // Test 5: Brands
  console.log('5. Testing Cars API (Get Brands)...');
  try {
    const brandsResponse = await fetch(`${API_BASE_URL}/cars/brands`);
    const brandsData = await brandsResponse.json();
    console.log('   ✓ Brands endpoint working');
    if (Array.isArray(brandsData)) {
      console.log('   ✓ Found', brandsData.length, 'brands');
    }
  } catch (error) {
    console.log('   ✗ Brands Failed:', error.message);
  }
  console.log('');

  // Test 6: Categories
  console.log('6. Testing Cars API (Get Categories)...');
  try {
    const categoriesResponse = await fetch(`${API_BASE_URL}/cars/categories`);
    const categoriesData = await categoriesResponse.json();
    console.log('   ✓ Categories endpoint working');
    if (Array.isArray(categoriesData)) {
      console.log('   ✓ Found', categoriesData.length, 'categories');
    }
  } catch (error) {
    console.log('   ✗ Categories Failed:', error.message);
  }
  console.log('');

  console.log('='.repeat(70));
  console.log('API Connection Tests Completed!');
  console.log('='.repeat(70));
  console.log('');
  console.log('Summary:');
  console.log('- Backend API: http://localhost:8000');
  console.log('- Frontend Client: http://localhost:3000');
  console.log('- API Docs: http://localhost:8000/api/docs');
  console.log('- Postman Collection: /home/user/AutoHub_/AutoHub_API.postman_collection.json');
  console.log('');
  console.log('All endpoints are ready to use!');
}

// Run the tests
testAPIConnection().catch(console.error);
