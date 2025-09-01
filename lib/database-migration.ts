// Database migration script for Android SQLite duplicate cleanup
import { sqliteService } from './sqlite-service';
import { androidDatabaseService } from './android-database';

export class DatabaseMigration {
  
  /**
   * Migrate from old database schema to new duplicate-prevention schema
   */
  static async migrateToV2(): Promise<void> {
    try {
      console.log('🔄 Starting database migration to v2 (duplicate prevention)...');
      
      // Initialize the new database service
      await androidDatabaseService.initializeDatabase();
      
      console.log('✅ Database initialized with new schema');
      console.log('✅ Duplicate cleanup completed during initialization');
      console.log('🎉 Migration to v2 completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Backup existing data before migration
   */
  static async backupData(): Promise<any> {
    try {
      console.log('📦 Creating database backup...');
      
      const backup = {
        products: [] as any[],
        materials: [] as any[],
        ingredients: [] as any[],
        addons: [] as any[],
        flavors: [] as any[],
        orders: [] as any[],
        timestamp: new Date().toISOString()
      };
      
      if (sqliteService.initialized) {
        backup.products = await sqliteService.getAllProducts();
        backup.materials = await sqliteService.getAllMaterials();
        backup.ingredients = await sqliteService.getAllIngredients();
        backup.addons = await sqliteService.getAllAddons();
        backup.flavors = await sqliteService.getAllFlavors();
      }
      
      console.log('✅ Database backup created');
      console.log(`📊 Backup stats:
        - Products: ${backup.products.length}
        - Materials: ${backup.materials.length}
        - Ingredients: ${backup.ingredients.length}
        - Addons: ${backup.addons.length}
        - Flavors: ${backup.flavors.length}
      `);
      
      return backup;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }
  
  /**
   * Verify data integrity after migration
   */
  static async verifyMigration(): Promise<boolean> {
    try {
      console.log('🔍 Verifying migration integrity...');
      
      const products = await sqliteService.getAllProducts();
      const materials = await sqliteService.getAllMaterials();
      const ingredients = await sqliteService.getAllIngredients();
      const addons = await sqliteService.getAllAddons();
      const flavors = await sqliteService.getAllFlavors();
      
      // Check for duplicates
      const productNames = new Set();
      const materialNames = new Set();
      const ingredientNames = new Set();
      const addonNames = new Set();
      const flavorNames = new Set();
      
      let duplicatesFound = false;
      
      for (const product of products) {
        const lowerName = product.name.toLowerCase();
        if (productNames.has(lowerName)) {
          console.warn(`⚠️ Duplicate product found: ${product.name}`);
          duplicatesFound = true;
        }
        productNames.add(lowerName);
      }
      
      for (const material of materials) {
        const lowerName = material.name.toLowerCase();
        if (materialNames.has(lowerName)) {
          console.warn(`⚠️ Duplicate material found: ${material.name}`);
          duplicatesFound = true;
        }
        materialNames.add(lowerName);
      }
      
      for (const ingredient of ingredients) {
        const lowerName = ingredient.name.toLowerCase();
        if (ingredientNames.has(lowerName)) {
          console.warn(`⚠️ Duplicate ingredient found: ${ingredient.name}`);
          duplicatesFound = true;
        }
        ingredientNames.add(lowerName);
      }
      
      for (const addon of addons) {
        const lowerName = addon.name.toLowerCase();
        if (addonNames.has(lowerName)) {
          console.warn(`⚠️ Duplicate addon found: ${addon.name}`);
          duplicatesFound = true;
        }
        addonNames.add(lowerName);
      }
      
      for (const flavor of flavors) {
        const lowerName = flavor.name.toLowerCase();
        if (flavorNames.has(lowerName)) {
          console.warn(`⚠️ Duplicate flavor found: ${flavor.name}`);
          duplicatesFound = true;
        }
        flavorNames.add(lowerName);
      }
      
      if (!duplicatesFound) {
        console.log('✅ Migration verification successful - no duplicates found');
        console.log(`📊 Final data counts:
          - Products: ${products.length}
          - Materials: ${materials.length}
          - Ingredients: ${ingredients.length}
          - Addons: ${addons.length}
          - Flavors: ${flavors.length}
        `);
        return true;
      } else {
        console.log('❌ Migration verification failed - duplicates still exist');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
      return false;
    }
  }
  
  /**
   * Full migration process with backup and verification
   */
  static async performFullMigration(): Promise<void> {
    try {
      console.log('🚀 Starting full database migration...\n');
      
      // Step 1: Backup
      const backup = await this.backupData();
      console.log('');
      
      // Step 2: Migrate
      await this.migrateToV2();
      console.log('');
      
      // Step 3: Verify
      const isValid = await this.verifyMigration();
      console.log('');
      
      if (isValid) {
        console.log('🎉 Full migration completed successfully!');
      } else {
        console.log('⚠️ Migration completed but verification failed');
        console.log('💾 Backup data available for recovery');
      }
      
    } catch (error) {
      console.error('❌ Full migration failed:', error);
      throw error;
    }
  }
}