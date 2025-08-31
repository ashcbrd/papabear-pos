// Test script for Android database functionality
import { androidDatabaseService } from './android-database';

export async function testDatabaseFunctionality() {
  try {
    console.log('Testing Android database service...');
    
    // Initialize database
    await androidDatabaseService.initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    // Test product CRUD
    const testProduct = {
      name: 'Test Coffee',
      category: 'Beverages',
      imageUrl: null,
      variants: [
        {
          name: 'Small',
          price: 50,
          materials: [],
          ingredients: []
        }
      ]
    };
    
    // Create product
    const createdProduct = await androidDatabaseService.createProduct(testProduct);
    console.log('✅ Product created:', createdProduct.name);
    
    // Get products
    const products = await androidDatabaseService.getProducts();
    console.log('✅ Products retrieved:', products.length, 'items');
    
    // Update product
    const updatedProduct = await androidDatabaseService.updateProduct(createdProduct.id, {
      name: 'Updated Test Coffee',
      category: 'Hot Beverages'
    });
    console.log('✅ Product updated:', updatedProduct?.name);
    
    // Test addon CRUD
    const testAddon = {
      name: 'Extra Shot',
      price: 15
    };
    
    const createdAddon = await androidDatabaseService.createAddon(testAddon);
    console.log('✅ Addon created:', createdAddon.name);
    
    const addons = await androidDatabaseService.getAddons();
    console.log('✅ Addons retrieved:', addons.length, 'items');
    
    // Test order creation
    const testOrder = {
      total: 65,
      paid: 70,
      change: 5,
      orderType: 'DINE_IN',
      items: [
        {
          productId: createdProduct.id,
          variantId: createdProduct.variants[0].id,
          quantity: 1,
          price: 50,
          addons: [{ addonId: createdAddon.id, price: 15 }]
        }
      ]
    };
    
    const createdOrder = await androidDatabaseService.createOrder(testOrder);
    console.log('✅ Order created:', createdOrder.id);
    
    const orders = await androidDatabaseService.getOrders();
    console.log('✅ Orders retrieved:', orders.length, 'items');
    
    // Cleanup - delete test data
    await androidDatabaseService.deleteProduct(createdProduct.id);
    await androidDatabaseService.deleteAddon(createdAddon.id);
    await androidDatabaseService.deleteOrder(createdOrder.id);
    console.log('✅ Test data cleaned up');
    
    console.log('🎉 All database tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
}

// Export for easy testing
export default testDatabaseFunctionality;