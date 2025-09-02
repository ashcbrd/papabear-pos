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

      // Cash flow transactions table
      `CREATE TABLE IF NOT EXISTS cash_flow_transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('INFLOW', 'OUTFLOW')),
        amount REAL NOT NULL CHECK(amount > 0),
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        itemsPurchased TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        createdBy TEXT NOT NULL DEFAULT 'admin'
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
      `CREATE INDEX IF NOT EXISTS idx_stock_material ON stock(materialId);`,
      `CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON cash_flow_transactions(createdAt);`,
      `CREATE INDEX IF NOT EXISTS idx_cash_flow_type ON cash_flow_transactions(type);`
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
    
    // Run migrations to fix schema issues
    await this.runMigrations();
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      console.log('Running database migrations...');
      
      // Migration 1: Add createdAt column to flavors table if it doesn't exist
      try {
        const tableInfo = await this.db.query("PRAGMA table_info(flavors)");
        const hasCreatedAt = tableInfo.values?.some((col: any) => col.name === 'createdAt');
        
        if (!hasCreatedAt) {
          console.log('Adding createdAt column to flavors table...');
          await this.db.execute('ALTER TABLE flavors ADD COLUMN createdAt TEXT NOT NULL DEFAULT (datetime("now"))');
          console.log('✅ Added createdAt column to flavors table');
        }
      } catch (error) {
        console.log('⚠️ Migration 1 failed or not needed:', error);
      }
      
      console.log('✅ Database migrations completed');
    } catch (error) {
      console.error('❌ Database migrations failed:', error);
      // Don't throw - let app continue with existing schema
    }
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
      // NOTE: Removed automatic flavor seeding to prevent hardcoded flavors from reappearing
      // Flavors should only be created through the admin interface or manual import
      console.log('Database seeding completed (flavors not auto-seeded)');
    } catch (error) {
      console.error('Error seeding data:', error);
    }
  }

  // Manual method to seed Papa Bear flavors - only when explicitly requested
  async seedPapaBearFlavors(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
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
          console.warn(`Flavor "${flavor}" already exists, skipping`);
        }
      }
      console.log('Papa Bear flavors seeded manually');
    } catch (error) {
      console.error('Error seeding Papa Bear flavors:', error);
      throw error;
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
      const result = await this.db.query(`
        SELECT 
          m.*,
          COALESCE(s.quantity, 0) as stockQuantity
        FROM materials m 
        LEFT JOIN stock s ON s.materialId = m.id 
        ORDER BY m.name
      `);
      return result.values || [];
    } catch (error) {
      console.error('Error getting materials:', error);
      return [];
    }
  }

  async getAllIngredients(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.query(`
        SELECT 
          i.*,
          COALESCE(s.quantity, 0) as stockQuantity
        FROM ingredients i 
        LEFT JOIN stock s ON s.ingredientId = i.id 
        ORDER BY i.name
      `);
      return result.values || [];
    } catch (error) {
      console.error('Error getting ingredients:', error);
      return [];
    }
  }

  async getAllAddons(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.query(`
        SELECT 
          a.*,
          COALESCE(s.quantity, 0) as stockQuantity
        FROM addons a 
        LEFT JOIN stock s ON s.addonId = a.id 
        ORDER BY a.name
      `);
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
      if ((updateResult.changes ?? 0) === 0) {
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

  // Cash Flow Methods
  async createCashFlowTransaction(type: 'INFLOW' | 'OUTFLOW', amount: number, category: string, description: string, itemsPurchased?: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const id = this.generateUUID();
      await this.db.run(
        'INSERT INTO cash_flow_transactions (id, type, amount, category, description, itemsPurchased) VALUES (?, ?, ?, ?, ?, ?)',
        [id, type, amount, category, description, itemsPurchased || null]
      );
      return id;
    } catch (error) {
      console.error('Error creating cash flow transaction:', error);
      return null;
    }
  }

  async getAllCashFlowTransactions(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.query('SELECT * FROM cash_flow_transactions ORDER BY createdAt DESC');
      return result.values || [];
    } catch (error) {
      console.error('Error getting cash flow transactions:', error);
      return [];
    }
  }

  async getCashFlowBalance(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'INFLOW' THEN amount ELSE 0 END), 0) - 
          COALESCE(SUM(CASE WHEN type = 'OUTFLOW' THEN amount ELSE 0 END), 0) as balance
        FROM cash_flow_transactions
      `);
      return result.values?.[0]?.balance || 0;
    } catch (error) {
      console.error('Error getting cash flow balance:', error);
      return 0;
    }
  }

  // Order Methods
  async createOrder(orderData: any): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const id = this.generateUUID();
      await this.db.run(
        'INSERT INTO orders (id, total, paid, change, orderType, orderStatus, items) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, orderData.total, orderData.paid, orderData.change, orderData.orderType, orderData.orderStatus || 'QUEUING', JSON.stringify(orderData.items || [])]
      );
      return id;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  async getAllOrders(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.query('SELECT * FROM orders ORDER BY createdAt DESC');
      const orders = result.values || [];
      
      // Parse items JSON for each order
      return orders.map((order: any) => ({
        ...order,
        items: JSON.parse(order.items || '[]')
      }));
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  // Delete Methods
  async deleteFlavor(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.run('DELETE FROM flavors WHERE id = ?', [id]);
      const success = (result.changes ?? 0) > 0;
      console.log('🔍 SQLiteService deleteFlavor result:', { id, changes: result.changes, success });
      return success; // Return false if not found, don't throw
    } catch (error) {
      console.error('❌ Error deleting flavor from SQLite:', error);
      return false; // Return false instead of throwing
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      // Delete product and related variants (CASCADE will handle this)
      const result = await this.db.run('DELETE FROM products WHERE id = ?', [id]);
      return (result.changes ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }

  async deleteAddon(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.run('DELETE FROM addons WHERE id = ?', [id]);
      const success = (result.changes ?? 0) > 0;
      console.log('🔍 SQLiteService deleteAddon result:', { id, changes: result.changes, success });
      return success; // Return false if not found, don't throw
    } catch (error) {
      console.error('❌ Error deleting addon from SQLite:', error);
      return false; // Return false instead of throwing
    }
  }

  async deleteIngredient(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.run('DELETE FROM ingredients WHERE id = ?', [id]);
      return (result.changes ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      return false;
    }
  }

  async deleteMaterial(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.run('DELETE FROM materials WHERE id = ?', [id]);
      return (result.changes ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting material:', error);
      return false;
    }
  }

  async deleteOrder(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.run('DELETE FROM orders WHERE id = ?', [id]);
      return (result.changes ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }

  // Update Methods
  async updateFlavor(id: string, name: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.run(
        'UPDATE flavors SET name = ? WHERE id = ?',
        [name, id]
      );
      return (result.changes ?? 0) > 0;
    } catch (error) {
      console.error('Error updating flavor:', error);
      return false;
    }
  }

  async updateProduct(id: string, name: string, category: string, imageUrl?: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.run(
        'UPDATE products SET name = ?, category = ?, imageUrl = ? WHERE id = ?',
        [name, category, imageUrl || null, id]
      );
      return (result.changes ?? 0) > 0;
    } catch (error) {
      console.error('Error updating product:', error);
      return false;
    }
  }

  async updateAddon(id: string, name: string, price: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.run(
        'UPDATE addons SET name = ?, price = ? WHERE id = ?',
        [name, price, id]
      );
      return (result.changes ?? 0) > 0;
    } catch (error) {
      console.error('Error updating addon:', error);
      return false;
    }
  }

  async updateIngredient(id: string, name: string, unit: string, pricePerPurchase: number, unitsPerPurchase: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const pricePerUnit = pricePerPurchase / unitsPerPurchase;
      const result = await this.db.run(
        'UPDATE ingredients SET name = ?, unit = ?, pricePerPurchase = ?, unitsPerPurchase = ?, pricePerUnit = ? WHERE id = ?',
        [name, unit, pricePerPurchase, unitsPerPurchase, pricePerUnit, id]
      );
      return (result.changes ?? 0) > 0;
    } catch (error) {
      console.error('Error updating ingredient:', error);
      return false;
    }
  }

  async updateMaterial(id: string, name: string, pricePerPiece: number, isPackage: boolean = false, packagePrice?: number, unitsPerPackage?: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.run(
        'UPDATE materials SET name = ?, pricePerPiece = ?, isPackage = ?, packagePrice = ?, unitsPerPackage = ? WHERE id = ?',
        [name, pricePerPiece, isPackage ? 1 : 0, packagePrice || null, unitsPerPackage || null, id]
      );
      return (result.changes ?? 0) > 0;
    } catch (error) {
      console.error('Error updating material:', error);
      return false;
    }
  }

  async updateOrder(id: string, updates: any): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(updates), id];

      const result = await this.db.run(
        `UPDATE orders SET ${setClause} WHERE id = ?`,
        values
      );
      return (result.changes ?? 0) > 0;
    } catch (error) {
      console.error('Error updating order:', error);
      return false;
    }
  }

  async recordCashFlowTransaction(transaction: {
    id: string;
    type: string;
    amount: number;
    category: string;
    orderId?: string;
    description: string;
    paymentMethod?: string;
    itemsPurchased?: string;
    createdAt: string;
    createdBy: string;
  }): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.run(
        `INSERT INTO cash_flow_transactions 
         (id, type, amount, category, orderId, description, paymentMethod, itemsPurchased, createdAt, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.type,
          transaction.amount,
          transaction.category,
          transaction.orderId || null,
          transaction.description,
          transaction.paymentMethod || null,
          transaction.itemsPurchased || null,
          transaction.createdAt,
          transaction.createdBy
        ]
      );
      return true;
    } catch (error) {
      console.error('Error recording cash flow transaction:', error);
      return false;
    }
  }
}

export const sqliteService = new SQLiteService();