import { sqliteDataService } from './sqlite-data-service';

interface LocalStorageData {
  products: any[];
  flavors: any[];
  materials: any[];
  ingredients: any[];
  addons: any[];
  orders: any[];
  [key: string]: any;
}

export class DataMigration {
  private getLocalStorageData(): LocalStorageData {
    if (typeof window === 'undefined') {
      return { products: [], flavors: [], materials: [], ingredients: [], addons: [], orders: [] };
    }

    const data: LocalStorageData = {
      products: this.getStorageItem('products', []),
      flavors: this.getStorageItem('flavors', []),
      materials: this.getStorageItem('materials', []),
      ingredients: this.getStorageItem('ingredients', []),
      addons: this.getStorageItem('addons', []),
      orders: this.getStorageItem('orders', [])
    };

    console.log('Retrieved localStorage data:', {
      products: data.products.length,
      flavors: data.flavors.length,
      materials: data.materials.length,
      ingredients: data.ingredients.length,
      addons: data.addons.length,
      orders: data.orders.length
    });

    return data;
  }

  private getStorageItem<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(`papabear_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.warn(`Failed to parse localStorage key ${key}:`, error);
      return defaultValue;
    }
  }

  async migrateAllData(): Promise<{ success: boolean; summary: any; errors: string[] }> {
    const errors: string[] = [];
    const summary = {
      products: { migrated: 0, total: 0 },
      flavors: { migrated: 0, total: 0 },
      materials: { migrated: 0, total: 0 },
      ingredients: { migrated: 0, total: 0 },
      addons: { migrated: 0, total: 0 },
      orders: { migrated: 0, total: 0 }
    };

    try {
      console.log('Starting data migration from localStorage to SQLite...');
      const localData = this.getLocalStorageData();

      // Check if there's any data to migrate
      const hasData = Object.values(localData).some(arr => arr.length > 0);
      if (!hasData) {
        console.log('No localStorage data found to migrate');
        return { success: true, summary, errors: ['No data found in localStorage'] };
      }

      // Migrate flavors first (needed for products)
      summary.flavors.total = localData.flavors.length;
      for (const flavor of localData.flavors) {
        try {
          await sqliteDataService.createFlavor({
            name: flavor.name
          });
          summary.flavors.migrated++;
        } catch (error) {
          errors.push(`Failed to migrate flavor "${flavor.name}": ${error}`);
        }
      }

      // Migrate materials
      summary.materials.total = localData.materials.length;
      for (const material of localData.materials) {
        try {
          await sqliteDataService.createMaterial({
            name: material.name,
            pricePerPiece: material.pricePerPiece || 0,
            isPackage: material.isPackage || false,
            packagePrice: material.packagePrice,
            unitsPerPackage: material.unitsPerPackage,
            stockQuantity: material.stockQuantity || 0
          });
          summary.materials.migrated++;
        } catch (error) {
          errors.push(`Failed to migrate material "${material.name}": ${error}`);
        }
      }

      // Migrate ingredients
      summary.ingredients.total = localData.ingredients.length;
      for (const ingredient of localData.ingredients) {
        try {
          await sqliteDataService.createIngredient({
            name: ingredient.name,
            measurementUnit: ingredient.measurementUnit || 'piece',
            unitsPerPurchase: ingredient.unitsPerPurchase || 1,
            pricePerPurchase: ingredient.pricePerPurchase || 0,
            stockQuantity: ingredient.stockQuantity || 0
          });
          summary.ingredients.migrated++;
        } catch (error) {
          errors.push(`Failed to migrate ingredient "${ingredient.name}": ${error}`);
        }
      }

      // Migrate addons
      summary.addons.total = localData.addons.length;
      for (const addon of localData.addons) {
        try {
          await sqliteDataService.createAddon({
            name: addon.name,
            price: addon.price || 0,
            stockQuantity: addon.stockQuantity || 0
          });
          summary.addons.migrated++;
        } catch (error) {
          errors.push(`Failed to migrate addon "${addon.name}": ${error}`);
        }
      }

      // Migrate products (after flavors are migrated)
      summary.products.total = localData.products.length;
      for (const product of localData.products) {
        try {
          await sqliteDataService.createProduct({
            name: product.name,
            category: product.category || 'InsideMeals',
            imageUrl: product.imageUrl,
            flavors: product.flavors || [],
            sizes: product.sizes || []
          });
          summary.products.migrated++;
        } catch (error) {
          errors.push(`Failed to migrate product "${product.name}": ${error}`);
        }
      }

      // Migrate orders
      summary.orders.total = localData.orders.length;
      for (const order of localData.orders) {
        try {
          await sqliteDataService.createOrder({
            total: order.total || 0,
            paid: order.paid || 0,
            change: order.change || 0,
            orderType: order.orderType || 'DINE_IN',
            orderStatus: order.orderStatus || 'SERVED',
            items: order.items || []
          });
          summary.orders.migrated++;
        } catch (error) {
          errors.push(`Failed to migrate order "${order.id}": ${error}`);
        }
      }

      console.log('Migration completed:', summary);
      return { success: errors.length === 0, summary, errors };

    } catch (error) {
      console.error('Migration failed:', error);
      return { 
        success: false, 
        summary, 
        errors: [`Migration failed: ${error}`] 
      };
    }
  }

  async clearLocalStorageData(): Promise<void> {
    if (typeof window === 'undefined') return;

    const keys = ['products', 'flavors', 'materials', 'ingredients', 'addons', 'orders'];
    
    for (const key of keys) {
      localStorage.removeItem(`papabear_${key}`);
    }
    
    console.log('localStorage data cleared');
  }

  async checkDataExists(): Promise<{ localStorage: boolean; sqlite: boolean }> {
    const localData = this.getLocalStorageData();
    const hasLocalData = Object.values(localData).some(arr => arr.length > 0);

    try {
      const sqliteProducts = await sqliteDataService.getProducts();
      const hasSqliteData = sqliteProducts.length > 0;
      
      return {
        localStorage: hasLocalData,
        sqlite: hasSqliteData
      };
    } catch (error) {
      console.error('Error checking SQLite data:', error);
      return {
        localStorage: hasLocalData,
        sqlite: false
      };
    }
  }

  async getDataSummary(): Promise<any> {
    const localData = this.getLocalStorageData();
    
    try {
      const sqliteProducts = await sqliteDataService.getProducts();
      const sqliteFlavors = await sqliteDataService.getFlavors();
      const sqliteMaterials = await sqliteDataService.getMaterials();
      const sqliteIngredients = await sqliteDataService.getIngredients();
      const sqliteAddons = await sqliteDataService.getAddons();
      const sqliteOrders = await sqliteDataService.getOrders();

      return {
        localStorage: {
          products: localData.products.length,
          flavors: localData.flavors.length,
          materials: localData.materials.length,
          ingredients: localData.ingredients.length,
          addons: localData.addons.length,
          orders: localData.orders.length
        },
        sqlite: {
          products: sqliteProducts.length,
          flavors: sqliteFlavors.length,
          materials: sqliteMaterials.length,
          ingredients: sqliteIngredients.length,
          addons: sqliteAddons.length,
          orders: sqliteOrders.length
        }
      };
    } catch (error) {
      console.error('Error getting data summary:', error);
      return {
        localStorage: {
          products: localData.products.length,
          flavors: localData.flavors.length,
          materials: localData.materials.length,
          ingredients: localData.ingredients.length,
          addons: localData.addons.length,
          orders: localData.orders.length
        },
        sqlite: {
          products: 0,
          flavors: 0,
          materials: 0,
          ingredients: 0,
          addons: 0,
          orders: 0
        }
      };
    }
  }
}

export const dataMigration = new DataMigration();