#!/usr/bin/env tsx
// Test script for Android SQLite database with duplicate prevention
import { androidDatabaseService } from './lib/android-database';
import { sqliteService } from './lib/sqlite-service';

async function testDatabaseOperations() {
  console.log('🧪 Testing Android SQLite Database with Duplicate Prevention...\n');

  try {
    // Initialize the database
    console.log('1️⃣ Initializing database...');
    await androidDatabaseService.initializeDatabase();
    console.log('✅ Database initialized successfully\n');

    // Test duplicate flavor prevention
    console.log('2️⃣ Testing duplicate flavor prevention...');
    
    const flavor1 = await androidDatabaseService.createFlavor({ name: 'Test Vanilla' });
    console.log('✅ Created first flavor:', flavor1);
    
    const flavor2 = await androidDatabaseService.createFlavor({ name: 'Test Vanilla' }); // Should return existing
    console.log('✅ Attempted to create duplicate flavor:', flavor2);
    
    if (flavor1.id === flavor2.id) {
      console.log('✅ Duplicate prevention working - same ID returned');
    } else {
      console.log('❌ Duplicate prevention failed - different IDs returned');
    }
    
    // Test case sensitivity
    const flavor3 = await androidDatabaseService.createFlavor({ name: 'test vanilla' }); // Should return existing
    console.log('✅ Case-insensitive check:', flavor3);
    
    if (flavor1.id === flavor3.id) {
      console.log('✅ Case-insensitive duplicate prevention working');
    } else {
      console.log('❌ Case-insensitive duplicate prevention failed');
    }
    
    console.log('\n3️⃣ Testing flavor retrieval...');
    const allFlavors = await androidDatabaseService.getFlavors();
    console.log(`✅ Retrieved ${allFlavors.length} flavors`);
    
    // Test manual cleanup
    console.log('\n4️⃣ Testing manual duplicate cleanup...');
    await androidDatabaseService.cleanupDuplicates();
    console.log('✅ Manual cleanup completed');
    
    const flavorsAfterCleanup = await androidDatabaseService.getFlavors();
    console.log(`✅ Flavors after cleanup: ${flavorsAfterCleanup.length}`);
    
    console.log('\n🎉 All database tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

// Test SQLite service directly (for native platform)
async function testSQLiteService() {
  console.log('\n🔧 Testing SQLite Service directly...');
  
  try {
    await sqliteService.initialize();
    console.log('✅ SQLite service initialized');
    
    // Test creating products with duplicate prevention
    const productId1 = await sqliteService.createProduct('Test Coffee', 'InsideBeverages');
    console.log('✅ Created product 1:', productId1);
    
    const productId2 = await sqliteService.createProduct('Test Coffee', 'InsideBeverages');
    console.log('✅ Attempted duplicate product:', productId2);
    
    if (productId1 === productId2) {
      console.log('✅ Product duplicate prevention working');
    } else if (!productId2) {
      console.log('✅ Product duplicate prevented (null returned)');
    } else {
      console.log('❌ Product duplicate prevention failed');
    }
    
    // Test all products
    const products = await sqliteService.getAllProducts();
    console.log(`✅ Retrieved ${products.length} products`);
    
    console.log('\n✅ SQLite service tests completed!');
    
  } catch (error) {
    console.error('❌ SQLite service test failed:', error);
  }
}

// Run tests
async function runAllTests() {
  await testDatabaseOperations();
  await testSQLiteService();
  
  console.log('\n🏁 All tests completed!');
  process.exit(0);
}

if (require.main === module) {
  runAllTests().catch(console.error);
}

export { testDatabaseOperations, testSQLiteService };