import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

// Database configuration
const DB_NAME = 'papabear_pos.db';
const DB_VERSION = 1;

class SQLiteService {
  private sqliteConnection: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize the SQLite connection
      this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);

      // Check if platform is supported
      const ret = await this.sqliteConnection.checkConnectionsConsistency();
      console.log('SQLite connection consistency:', ret);

      // Create connection
      this.db = await this.sqliteConnection.createConnection(
        DB_NAME,
        false,
        'no-encryption',
        DB_VERSION,
        false
      );

      // Open the database
      await this.db.open();

      // Create tables
      await this.createTables();
      
      // Insert default data if tables are empty
      await this.seedData();

      this.isInitialized = true;
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Products table
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('InsideMeals', 'OutsideSnacks', 'InsideBeverages')),
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Flavors table (standalone, not linked to products for flexibility)
      CREATE TABLE IF NOT EXISTS flavors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Product flavors junction table
      CREATE TABLE IF NOT EXISTS product_flavors (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        flavor_id TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        FOREIGN KEY (flavor_id) REFERENCES flavors (id) ON DELETE CASCADE,
        UNIQUE(product_id, flavor_id)
      );

      -- Sizes table
      CREATE TABLE IF NOT EXISTS sizes (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        UNIQUE(product_id, name)
      );

      -- Materials table
      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price_per_piece REAL NOT NULL,
        is_package BOOLEAN DEFAULT FALSE,
        package_price REAL,
        units_per_package INTEGER,
        stock_quantity REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Ingredients table
      CREATE TABLE IF NOT EXISTS ingredients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        measurement_unit TEXT NOT NULL,
        units_per_purchase REAL,
        price_per_purchase REAL NOT NULL,
        price_per_unit REAL NOT NULL,
        stock_quantity REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Addons table
      CREATE TABLE IF NOT EXISTS addons (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock_quantity REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Size materials junction table
      CREATE TABLE IF NOT EXISTS size_materials (
        id TEXT PRIMARY KEY,
        size_id TEXT NOT NULL,
        material_id TEXT NOT NULL,
        quantity_used REAL NOT NULL,
        FOREIGN KEY (size_id) REFERENCES sizes (id) ON DELETE CASCADE,
        FOREIGN KEY (material_id) REFERENCES materials (id) ON DELETE CASCADE
      );

      -- Size ingredients junction table
      CREATE TABLE IF NOT EXISTS size_ingredients (
        id TEXT PRIMARY KEY,
        size_id TEXT NOT NULL,
        ingredient_id TEXT NOT NULL,
        quantity_used REAL NOT NULL,
        FOREIGN KEY (size_id) REFERENCES sizes (id) ON DELETE CASCADE,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients (id) ON DELETE CASCADE
      );

      -- Orders table
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        total REAL NOT NULL,
        paid REAL NOT NULL,
        change_amount REAL NOT NULL,
        order_type TEXT DEFAULT 'DINE_IN' CHECK(order_type IN ('DINE_IN', 'TAKE_OUT')),
        order_status TEXT DEFAULT 'QUEUING' CHECK(order_status IN ('QUEUING', 'SERVED', 'CANCELLED')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Order items table
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        flavor_id TEXT NOT NULL,
        size_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id),
        FOREIGN KEY (flavor_id) REFERENCES flavors (id),
        FOREIGN KEY (size_id) REFERENCES sizes (id)
      );

      -- Order item addons junction table
      CREATE TABLE IF NOT EXISTS order_item_addons (
        id TEXT PRIMARY KEY,
        order_item_id TEXT NOT NULL,
        addon_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE CASCADE,
        FOREIGN KEY (addon_id) REFERENCES addons (id)
      );

      -- Cash flow transactions table
      CREATE TABLE IF NOT EXISTS cash_flow_transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('INFLOW', 'OUTFLOW')),
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        order_id TEXT,
        items_purchased TEXT,
        payment_method TEXT,
        created_by TEXT DEFAULT 'system',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (id)
      );
    `;

    await this.db.execute(tables);
    console.log('SQLite tables created successfully');
  }

  private async seedData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if flavors table has data
    const flavorCheck = await this.db.query('SELECT COUNT(*) as count FROM flavors');
    if (flavorCheck.values && flavorCheck.values[0].count === 0) {
      // Insert Papa Bear flavors
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
        await this.db.run(
          'INSERT INTO flavors (id, name) VALUES (?, ?)',
          [id, flavor]
        );
      }
      console.log('Seeded flavors data');
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
}

export const sqliteService = new SQLiteService();