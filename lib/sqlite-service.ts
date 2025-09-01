import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

// Enhanced logging for debugging
const log = (message: string, data?: any) => {
  console.log(`🔍 SQLiteService: ${message}`, data || '');
};

const logError = (message: string, error: any) => {
  console.error(`❌ SQLiteService: ${message}`, error);
};

// Database configuration
const DB_NAME = 'papabear_pos.db';
const DB_VERSION = 2; // Increased version for schema updates

class SQLiteService {
  private sqliteConnection: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      if (!Capacitor.isNativePlatform()) {
        log('Not on native platform, skipping SQLite initialization');
        return;
      }

      log('Starting SQLite initialization...');

      // Initialize the SQLite connection
      this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
      log('SQLiteConnection created');

      // Check if platform is supported
      const ret = await this.sqliteConnection.checkConnectionsConsistency();
      log('SQLite connection consistency check', ret);

      // Check if connection already exists
      const isConnectionExists = await this.sqliteConnection.isConnection(DB_NAME, false);
      log('Connection exists check', isConnectionExists);
      
      if (isConnectionExists.result) {
        // Retrieve existing connection
        this.db = await this.sqliteConnection.retrieveConnection(DB_NAME, false);
        log('Retrieved existing connection');
      } else {
        // Create new connection
        this.db = await this.sqliteConnection.createConnection(
          DB_NAME,
          false,
          'no-encryption',
          DB_VERSION,
          false
        );
        log('Created new connection');
      }

      // Open the database
      const isDBOpen = await this.db.isDBOpen();
      log('Database open check', isDBOpen);
      
      if (!isDBOpen.result) {
        await this.db.open();
        log('Database opened');
      }

      // Create tables with proper constraints
      log('Creating tables...');
      await this.createTables();
      log('Tables created successfully');
      
      // Clean up duplicates if any exist
      log('Cleaning up duplicates...');
      await this.removeDuplicates();
      log('Duplicates cleaned up');
      
      // Insert default data if tables are empty
      log('Seeding default data...');
      await this.seedData();
      log('Default data seeded');

      this.isInitialized = true;
      log('SQLite database initialized successfully ✅');
    } catch (error) {
      logError('Failed to initialize SQLite', error);
      this.initializationPromise = null;
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const statements = [
      // Drop existing tables if we need to recreate them with proper constraints
      // Products table with unique name constraint
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL CHECK(category IN ('InsideMeals', 'OutsideSnacks', 'InsideBeverages')),
        imageUrl TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Variants/Sizes table with unique constraint per product
      `CREATE TABLE IF NOT EXISTS variants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL CHECK(price >= 0),
        productId TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
        UNIQUE(productId, name)
      );`,

      // Materials table with unique name constraint
      `CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        isPackage INTEGER NOT NULL DEFAULT 0,
        packagePrice REAL,
        unitsPerPackage REAL,
        pricePerPiece REAL NOT NULL CHECK(pricePerPiece >= 0),
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Ingredients table with unique name constraint
      `CREATE TABLE IF NOT EXISTS ingredients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        unit TEXT NOT NULL,
        pricePerPurchase REAL NOT NULL CHECK(pricePerPurchase >= 0),
        unitsPerPurchase REAL NOT NULL CHECK(unitsPerPurchase > 0),
        pricePerUnit REAL NOT NULL CHECK(pricePerUnit >= 0),
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Addons table with unique name constraint
      `CREATE TABLE IF NOT EXISTS addons (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        price REAL NOT NULL CHECK(price >= 0),
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Flavors table with unique name constraint
      `CREATE TABLE IF NOT EXISTS flavors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Variant materials junction table with unique constraint
      `CREATE TABLE IF NOT EXISTS variant_materials (
        id TEXT PRIMARY KEY,
        variantId TEXT NOT NULL,
        materialId TEXT NOT NULL,
        quantity REAL NOT NULL CHECK(quantity > 0),
        FOREIGN KEY (variantId) REFERENCES variants (id) ON DELETE CASCADE,
        FOREIGN KEY (materialId) REFERENCES materials (id) ON DELETE CASCADE,
        UNIQUE(variantId, materialId)
      );`,

      // Variant ingredients junction table with unique constraint
      `CREATE TABLE IF NOT EXISTS variant_ingredients (
        id TEXT PRIMARY KEY,
        variantId TEXT NOT NULL,
        ingredientId TEXT NOT NULL,
        quantity REAL NOT NULL CHECK(quantity > 0),
        FOREIGN KEY (variantId) REFERENCES variants (id) ON DELETE CASCADE,
        FOREIGN KEY (ingredientId) REFERENCES ingredients (id) ON DELETE CASCADE,
        UNIQUE(variantId, ingredientId)
      );`,

      // Stock table - simplified without COALESCE in UNIQUE constraint
      `CREATE TABLE IF NOT EXISTS stock (
        id TEXT PRIMARY KEY,
        quantity REAL NOT NULL DEFAULT 0 CHECK(quantity >= 0),
        addonId TEXT,
        ingredientId TEXT,
        materialId TEXT,
        updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (addonId) REFERENCES addons (id) ON DELETE CASCADE,
        FOREIGN KEY (ingredientId) REFERENCES ingredients (id) ON DELETE CASCADE,
        FOREIGN KEY (materialId) REFERENCES materials (id) ON DELETE CASCADE,
        CHECK(
          (addonId IS NOT NULL AND ingredientId IS NULL AND materialId IS NULL) OR
          (addonId IS NULL AND ingredientId IS NOT NULL AND materialId IS NULL) OR
          (addonId IS NULL AND ingredientId IS NULL AND materialId IS NOT NULL)
        )
      );`,
      
      // Separate unique indexes for each stock type (Android SQLite compatible)
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_addon ON stock(addonId) WHERE addonId IS NOT NULL;`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_ingredient ON stock(ingredientId) WHERE ingredientId IS NOT NULL;`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_material ON stock(materialId) WHERE materialId IS NOT NULL;`,

      // Orders table
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        total REAL NOT NULL CHECK(total >= 0),
        paid REAL NOT NULL CHECK(paid >= 0),
        change REAL NOT NULL DEFAULT 0,
        orderType TEXT NOT NULL DEFAULT 'DINE_IN' CHECK(orderType IN ('DINE_IN', 'TAKE_OUT')),
        orderStatus TEXT NOT NULL DEFAULT 'QUEUING' CHECK(orderStatus IN ('QUEUING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED')),
        items TEXT NOT NULL DEFAULT '[]',
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Create indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);`,
      `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);`,
      `CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(productId);`,
      `CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name);`,
      `CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);`,
      `CREATE INDEX IF NOT EXISTS idx_addons_name ON addons(name);`,
      `CREATE INDEX IF NOT EXISTS idx_flavors_name ON flavors(name);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(orderStatus);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(createdAt);`,
      `CREATE INDEX IF NOT EXISTS idx_stock_addon ON stock(addonId);`,
      `CREATE INDEX IF NOT EXISTS idx_stock_ingredient ON stock(ingredientId);`,
      `CREATE INDEX IF NOT EXISTS idx_stock_material ON stock(materialId);`
    ];

    for (const statement of statements) {
      try {
        await this.db.execute(statement);
      } catch (error) {
        console.error('Error executing SQL statement:', statement, error);
        throw error;
      }
    }
    
    console.log('SQLite tables created successfully with duplicate prevention');
  }

  private async removeDuplicates(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Remove duplicate products (keep the first one based on createdAt)
      await this.db.execute(`
        DELETE FROM products 
        WHERE id NOT IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY createdAt ASC) as rn
            FROM products
          ) WHERE rn = 1
        );
      `);

      // Remove duplicate materials
      await this.db.execute(`
        DELETE FROM materials 
        WHERE id NOT IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY createdAt ASC) as rn
            FROM materials
          ) WHERE rn = 1
        );
      `);

      // Remove duplicate ingredients
      await this.db.execute(`
        DELETE FROM ingredients 
        WHERE id NOT IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY createdAt ASC) as rn
            FROM ingredients
          ) WHERE rn = 1
        );
      `);

      // Remove duplicate addons
      await this.db.execute(`
        DELETE FROM addons 
        WHERE id NOT IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY createdAt ASC) as rn
            FROM addons
          ) WHERE rn = 1
        );
      `);

      // Remove duplicate flavors
      await this.db.execute(`
        DELETE FROM flavors 
        WHERE id NOT IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY createdAt ASC) as rn
            FROM flavors
          ) WHERE rn = 1
        );
      `);

      // Remove duplicate variants (per product)
      await this.db.execute(`
        DELETE FROM variants 
        WHERE id NOT IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY productId, LOWER(name) ORDER BY createdAt ASC) as rn
            FROM variants
          ) WHERE rn = 1
        );
      `);

      console.log('Removed duplicate entries from database');
    } catch (error) {
      console.error('Error removing duplicates:', error);
      // Don't throw here as this is cleanup, we want the app to continue
    }
  }

  private async seedData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Check if flavors table has data
      const flavorCheck = await this.db.query('SELECT COUNT(*) as count FROM flavors');
      if (flavorCheck.values && flavorCheck.values[0].count === 0) {
        // Insert Papa Bear flavors with IGNORE to prevent duplicates
        const flavors = [
          "Americano", "Cinnamon", "Salted Caramel", "Creamy Vanilla", "Mocha", "Honeycomb Latte", 
          "Tiramisu", "Caramel Macchiato", "Spanish Latte", "Matcha Latte", "Matcha Caramel", 
          "Mango Matcha Latte", "Strawberry Matcha Latte", "Blueberry Matcha Latte", "Coffee Float", 
          "Strawberry Float", "Blueberry Float", "Sprite Float", "Coke Float", "Matcha Float", 
          "Kiwi Will Rock You", "Blueberry Licious", "Tipsy Strawberry", "Edi Wow Grape", 
          "Mango Tango", "Honey Orange Ginger", "Okinawa", "Taro", "Wintermelon", "Red Velvet", 
          "Cookies and Cream", "Chocolate", "Mango Cheesecake", "Matcha", "Minty Matcha", 
          "Choco Mint", "Blueberry Graham", "Mango Graham", "Avocado Graham", "Cookies and Cream Graham", 
          "Dark Chocolate S'mores", "Matcha S'mores", "Red Velvet S'mores", "Caramel Macchiato S'mores", 
          "Cookies and Cream S'mores", "Lemonade", "Tropical Berry Lemon", "Kiwi Lemonade", 
          "Honey Lemon", "Hot Choco"
        ];

        for (const flavor of flavors) {
          const id = this.generateUUID();
          try {
            await this.db.run(
              'INSERT OR IGNORE INTO flavors (id, name) VALUES (?, ?)',
              [id, flavor]
            );
          } catch (error) {
            // Skip duplicates silently
            console.warn(`Flavor "${flavor}" already exists, skipping`);
          }
        }
        console.log('Seeded flavors data');
      }
    } catch (error) {
      console.error('Error seeding data:', error);
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async close(): Promise<void> {
    if (this.db && this.sqliteConnection) {
      await this.sqliteConnection.closeConnection(DB_NAME, false);
      this.isInitialized = false;
    }
  }

  // Helper method to get database connection
  getDB(): SQLiteDBConnection {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // Helper method to check if initialized
  get initialized(): boolean {
    return this.isInitialized;
  }

  // CRUD Operations with duplicate prevention

  // Create methods with duplicate checking
  async createProduct(name: string, category: string, imageUrl?: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const id = this.generateUUID();
      await this.db.run(
        'INSERT OR IGNORE INTO products (id, name, category, imageUrl) VALUES (?, ?, ?, ?)',
        [id, name, category, imageUrl || null]
      );
      
      // Check if the insert was successful (row was actually created)
      const result = await this.db.query('SELECT id FROM products WHERE name = ?', [name]);
      return result.values?.[0]?.id || null;
    } catch (error) {
      console.error('Error creating product:', error);
      return null;
    }
  }

  async createMaterial(name: string, pricePerPiece: number, isPackage: boolean = false, packagePrice?: number, unitsPerPackage?: number): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const id = this.generateUUID();
      await this.db.run(
        'INSERT OR IGNORE INTO materials (id, name, pricePerPiece, isPackage, packagePrice, unitsPerPackage) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name, pricePerPiece, isPackage ? 1 : 0, packagePrice || null, unitsPerPackage || null]
      );
      
      const result = await this.db.query('SELECT id FROM materials WHERE name = ?', [name]);
      return result.values?.[0]?.id || null;
    } catch (error) {
      console.error('Error creating material:', error);
      return null;
    }
  }

  async createIngredient(name: string, unit: string, pricePerPurchase: number, unitsPerPurchase: number): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const id = this.generateUUID();
      const pricePerUnit = pricePerPurchase / unitsPerPurchase;
      
      await this.db.run(
        'INSERT OR IGNORE INTO ingredients (id, name, unit, pricePerPurchase, unitsPerPurchase, pricePerUnit) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name, unit, pricePerPurchase, unitsPerPurchase, pricePerUnit]
      );
      
      const result = await this.db.query('SELECT id FROM ingredients WHERE name = ?', [name]);
      return result.values?.[0]?.id || null;
    } catch (error) {
      console.error('Error creating ingredient:', error);
      return null;
    }
  }

  async createAddon(name: string, price: number): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const id = this.generateUUID();
      await this.db.run(
        'INSERT OR IGNORE INTO addons (id, name, price) VALUES (?, ?, ?)',
        [id, name, price]
      );
      
      const result = await this.db.query('SELECT id FROM addons WHERE name = ?', [name]);
      return result.values?.[0]?.id || null;
    } catch (error) {
      console.error('Error creating addon:', error);
      return null;
    }
  }

  async createFlavor(name: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const id = this.generateUUID();
      await this.db.run(
        'INSERT OR IGNORE INTO flavors (id, name) VALUES (?, ?)',
        [id, name]
      );
      
      const result = await this.db.query('SELECT id FROM flavors WHERE name = ?', [name]);
      return result.values?.[0]?.id || null;
    } catch (error) {
      console.error('Error creating flavor:', error);
      return null;
    }
  }

  // Query methods
  async getAllProducts(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.query('SELECT * FROM products ORDER BY name');
      return result.values || [];
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  async getAllMaterials(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.query('SELECT * FROM materials ORDER BY name');
      return result.values || [];
    } catch (error) {
      console.error('Error getting materials:', error);
      return [];
    }
  }

  async getAllIngredients(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.query('SELECT * FROM ingredients ORDER BY name');
      return result.values || [];
    } catch (error) {
      console.error('Error getting ingredients:', error);
      return [];
    }
  }

  async getAllAddons(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.query('SELECT * FROM addons ORDER BY name');
      return result.values || [];
    } catch (error) {
      console.error('Error getting addons:', error);
      return [];
    }
  }

  async getAllFlavors(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.query('SELECT * FROM flavors ORDER BY name');
      return result.values || [];
    } catch (error) {
      console.error('Error getting flavors:', error);
      return [];
    }
  }

  // Update stock with upsert pattern - Android SQLite compatible
  async updateStock(itemType: 'addon' | 'ingredient' | 'material', itemId: string, quantity: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const columnName = `${itemType}Id`;
      
      // First try to update existing record
      const updateResult = await this.db.run(
        `UPDATE stock SET quantity = ?, updatedAt = datetime('now') WHERE ${columnName} = ?`,
        [quantity, itemId]
      );
      
      // If no rows were affected, insert new record
      if (updateResult.changes === 0) {
        const id = this.generateUUID();
        const insertData = {
          id,
          quantity,
          addonId: itemType === 'addon' ? itemId : null,
          ingredientId: itemType === 'ingredient' ? itemId : null,
          materialId: itemType === 'material' ? itemId : null,
          updatedAt: 'datetime("now")'
        };
        
        await this.db.run(
          `INSERT INTO stock (id, addonId, ingredientId, materialId, quantity, updatedAt) 
           VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          [insertData.id, insertData.addonId, insertData.ingredientId, insertData.materialId, insertData.quantity]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error updating stock:', error);
      return false;
    }
  }

  // Get stock for specific item
  async getStock(itemType: 'addon' | 'ingredient' | 'material', itemId: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const columnName = `${itemType}Id`;
      const result = await this.db.query(`SELECT quantity FROM stock WHERE ${columnName} = ?`, [itemId]);
      return result.values?.[0]?.quantity || 0;
    } catch (error) {
      console.error('Error getting stock:', error);
      return 0;
    }
  }

  // Manual duplicate cleanup method for external use
  async cleanupDuplicates(): Promise<void> {
    await this.removeDuplicates();
  }
}

export const sqliteService = new SQLiteService();