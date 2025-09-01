// Database service with Capacitor SQLite support for Android
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";

export interface DatabaseService {
  initializeDatabase: () => Promise<void>;
  getProducts: () => Promise<any[]>;
  createProduct: (product: any) => Promise<any>;
  updateProduct: (id: string, product: any) => Promise<any>;
  deleteProduct: (id: string) => Promise<boolean>;
  getAddons: () => Promise<any[]>;
  createAddon: (addon: any) => Promise<any>;
  updateAddon: (id: string, addon: any) => Promise<any>;
  deleteAddon: (id: string) => Promise<boolean>;
  getIngredients: () => Promise<any[]>;
  createIngredient: (ingredient: any) => Promise<any>;
  updateIngredient: (id: string, ingredient: any) => Promise<any>;
  deleteIngredient: (id: string) => Promise<boolean>;
  getMaterials: () => Promise<any[]>;
  createMaterial: (material: any) => Promise<any>;
  updateMaterial: (id: string, material: any) => Promise<any>;
  deleteMaterial: (id: string) => Promise<boolean>;
  getOrders: (filters?: any) => Promise<any[]>;
  createOrder: (order: any) => Promise<any>;
  updateOrder: (id: string, updates: any) => Promise<any>;
  deleteOrder: (id: string) => Promise<boolean>;
  getStock: () => Promise<any[]>;
  updateStock: (id: string, quantity: number) => Promise<any>;
  getDashboardStats: (filters?: any) => Promise<any>;
}

class AndroidDatabaseService implements DatabaseService {
  private sqliteConnection: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;
  private readonly DB_NAME = "papabear_pos.db";
  private readonly DB_VERSION = 1;

  constructor() {
    this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
  }

  async initializeDatabase(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (Capacitor.isNativePlatform()) {
        await this.initializeSQLiteDatabase();
      } else {
        await this.initializeWebStorage();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error("Database initialization error:", error);
      throw error;
    }
  }

  private async initializeSQLiteDatabase(): Promise<void> {
    try {
      this.db = await this.sqliteConnection.createConnection(
        this.DB_NAME,
        false,
        "no-encryption",
        this.DB_VERSION,
        false
      );

      await this.db.open();
      await this.createTables();
    } catch (error) {
      console.error("SQLite initialization error:", error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const statements = [
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        imageUrl TEXT,
        createdAt TEXT NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS variants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        productId TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
      );`,

      `CREATE TABLE IF NOT EXISTS variant_materials (
        id TEXT PRIMARY KEY,
        variantId TEXT NOT NULL,
        materialId TEXT NOT NULL,
        quantity REAL NOT NULL,
        FOREIGN KEY (variantId) REFERENCES variants (id) ON DELETE CASCADE
      );`,

      `CREATE TABLE IF NOT EXISTS variant_ingredients (
        id TEXT PRIMARY KEY,
        variantId TEXT NOT NULL,
        ingredientId TEXT NOT NULL,
        quantity REAL NOT NULL,
        FOREIGN KEY (variantId) REFERENCES variants (id) ON DELETE CASCADE
      );`,

      `CREATE TABLE IF NOT EXISTS addons (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        createdAt TEXT NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS ingredients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        pricePerPurchase REAL NOT NULL,
        unitsPerPurchase REAL NOT NULL,
        pricePerUnit REAL NOT NULL,
        createdAt TEXT NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        isPackage INTEGER NOT NULL DEFAULT 0,
        packagePrice REAL,
        unitsPerPackage REAL,
        pricePerPiece REAL NOT NULL,
        createdAt TEXT NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        total REAL NOT NULL,
        paid REAL NOT NULL,
        change REAL NOT NULL,
        orderType TEXT NOT NULL,
        orderStatus TEXT NOT NULL,
        items TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS stock (
        id TEXT PRIMARY KEY,
        quantity REAL NOT NULL,
        addonId TEXT,
        ingredientId TEXT,
        materialId TEXT,
        FOREIGN KEY (addonId) REFERENCES addons (id) ON DELETE CASCADE,
        FOREIGN KEY (ingredientId) REFERENCES ingredients (id) ON DELETE CASCADE,
        FOREIGN KEY (materialId) REFERENCES materials (id) ON DELETE CASCADE
      );`,
    ];

    for (const statement of statements) {
      await this.db.execute(statement);
    }
  }

  private async initializeWebStorage(): Promise<void> {
    // Fallback for web
    if (typeof window !== "undefined" && window.localStorage) {
      if (!localStorage.getItem("papabear_products")) {
        localStorage.setItem("papabear_products", JSON.stringify([]));
      }
      if (!localStorage.getItem("papabear_variants")) {
        localStorage.setItem("papabear_variants", JSON.stringify([]));
      }
      if (!localStorage.getItem("papabear_addons")) {
        localStorage.setItem("papabear_addons", JSON.stringify([]));
      }
      if (!localStorage.getItem("papabear_ingredients")) {
        localStorage.setItem("papabear_ingredients", JSON.stringify([]));
      }
      if (!localStorage.getItem("papabear_materials")) {
        localStorage.setItem("papabear_materials", JSON.stringify([]));
      }
      if (!localStorage.getItem("papabear_orders")) {
        localStorage.setItem("papabear_orders", JSON.stringify([]));
      }
      if (!localStorage.getItem("papabear_stock")) {
        localStorage.setItem("papabear_stock", JSON.stringify([]));
      }
    }
  }

  private getFromWebStorage(key: string): any[] {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return JSON.parse(localStorage.getItem(key) || "[]");
      }
      return [];
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return [];
    }
  }

  private setToWebStorage(key: string, data: any[]): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
    }
  }

  // Products
  async getProducts(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        const productsResult = await this.db.query(
          "SELECT * FROM products ORDER BY createdAt DESC"
        );
        const products = productsResult.values || [];

        for (const product of products) {
          const variantsResult = await this.db.query(
            "SELECT * FROM variants WHERE productId = ? ORDER BY name",
            [product.id]
          );
          const variants = variantsResult.values || [];

          for (const variant of variants) {
            // Get materials
            const materialsResult = await this.db.query(
              `
              SELECT m.*, vm.quantity as quantityUsed 
              FROM materials m 
              JOIN variant_materials vm ON m.id = vm.materialId 
              WHERE vm.variantId = ?
            `,
              [variant.id]
            );

            // Get ingredients
            const ingredientsResult = await this.db.query(
              `
              SELECT i.*, vi.quantity as quantityUsed 
              FROM ingredients i 
              JOIN variant_ingredients vi ON i.id = vi.ingredientId 
              WHERE vi.variantId = ?
            `,
              [variant.id]
            );

            variant.materials = (materialsResult.values || []).map(
              (m: any) => ({
                material: m,
                quantityUsed: m.quantityUsed,
              })
            );

            variant.ingredients = (ingredientsResult.values || []).map(
              (i: any) => ({
                ingredient: i,
                quantityUsed: i.quantityUsed,
              })
            );
          }

          product.variants = variants;
        }

        return products;
      } catch (error) {
        console.error("Error getting products from SQLite:", error);
        return [];
      }
    } else {
      // Fallback to localStorage
      const products = this.getFromWebStorage("papabear_products");
      const variants = this.getFromWebStorage("papabear_variants");
      const materials = this.getFromWebStorage("papabear_materials");
      const ingredients = this.getFromWebStorage("papabear_ingredients");

      return products.map((product) => ({
        ...product,
        variants: variants
          .filter((v: any) => v.productId === product.id)
          .map((variant: any) => ({
            ...variant,
            materials: (variant.materials || [])
              .map((m: any) => ({
                material: materials.find((mat: any) => mat.id === m.id),
                quantityUsed: m.quantity,
              }))
              .filter((m: any) => m.material),
            ingredients: (variant.ingredients || [])
              .map((i: any) => ({
                ingredient: ingredients.find((ing: any) => ing.id === i.id),
                quantityUsed: i.quantity,
              }))
              .filter((i: any) => i.ingredient),
          })),
      }));
    }
  }

  async createProduct(product: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    const id = this.generateId();
    const now = new Date().toISOString();

    const newProduct = {
      id,
      name: product.name,
      category: product.category,
      imageUrl: product.imageUrl || null,
      createdAt: now,
    };

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        // Insert product
        await this.db.run(
          "INSERT INTO products (id, name, category, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?)",
          [id, product.name, product.category, product.imageUrl || null, now]
        );

        // Insert variants
        if (product.variants) {
          const newVariants = [];
          for (const v of product.variants) {
            const variantId = this.generateId();
            await this.db.run(
              "INSERT INTO variants (id, name, price, productId) VALUES (?, ?, ?, ?)",
              [variantId, v.name, v.price, id]
            );

            // Insert variant materials
            if (v.materials) {
              for (const material of v.materials) {
                await this.db.run(
                  "INSERT INTO variant_materials (id, variantId, materialId, quantity) VALUES (?, ?, ?, ?)",
                  [this.generateId(), variantId, material.id, material.quantity]
                );
              }
            }

            // Insert variant ingredients
            if (v.ingredients) {
              for (const ingredient of v.ingredients) {
                await this.db.run(
                  "INSERT INTO variant_ingredients (id, variantId, ingredientId, quantity) VALUES (?, ?, ?, ?)",
                  [
                    this.generateId(),
                    variantId,
                    ingredient.id,
                    ingredient.quantity,
                  ]
                );
              }
            }

            newVariants.push({
              id: variantId,
              name: v.name,
              price: v.price,
              productId: id,
              materials: v.materials || [],
              ingredients: v.ingredients || [],
            });
          }
          (newProduct as any).variants = newVariants;
        }

        return newProduct;
      } catch (error) {
        console.error("Error creating product in SQLite:", error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      const products = this.getFromWebStorage("papabear_products");
      const variants = this.getFromWebStorage("papabear_variants");

      products.push(newProduct);
      this.setToWebStorage("papabear_products", products);

      if (product.variants) {
        const newVariants = product.variants.map((v: any) => {
          const variantId = this.generateId();
          return {
            id: variantId,
            name: v.name,
            price: v.price,
            productId: id,
            materials: v.materials || [],
            ingredients: v.ingredients || [],
          };
        });
        variants.push(...newVariants);
        this.setToWebStorage("papabear_variants", variants);
        (newProduct as any).variants = newVariants;
      }

      return newProduct;
    }
  }

  async updateProduct(id: string, product: any): Promise<any> {
    const products = this.getFromWebStorage("papabear_products");
    const variants = this.getFromWebStorage("papabear_variants");
    const productIndex = products.findIndex((p: any) => p.id === id);

    if (productIndex !== -1) {
      products[productIndex] = { ...products[productIndex], ...product, id };
      this.setToWebStorage("papabear_products", products);

      if (product.variants) {
        const filteredVariants = variants.filter(
          (v: any) => v.productId !== id
        );
        const newVariants = product.variants.map((v: any) => ({
          id: v.id || this.generateId(),
          name: v.name,
          price: v.price,
          productId: id,
          materials: v.materials || [],
          ingredients: v.ingredients || [],
        }));
        this.setToWebStorage("papabear_variants", [
          ...filteredVariants,
          ...newVariants,
        ]);
        products[productIndex].variants = newVariants;
      }

      return products[productIndex];
    }
    return null;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const products = this.getFromWebStorage("papabear_products");
    const variants = this.getFromWebStorage("papabear_variants");
    const filtered = products.filter((p: any) => p.id !== id);
    const filteredVariants = variants.filter((v: any) => v.productId !== id);
    this.setToWebStorage("papabear_products", filtered);
    this.setToWebStorage("papabear_variants", filteredVariants);
    return filtered.length < products.length;
  }

  // Addons
  async getAddons(): Promise<any[]> {
    const addons = this.getFromWebStorage("papabear_addons");
    const stock = this.getFromWebStorage("papabear_stock");

    return addons.map((addon) => ({
      ...addon,
      stock: stock.find((s: any) => s.addonId === addon.id),
    }));
  }

  async createAddon(addon: any): Promise<any> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const addons = this.getFromWebStorage("papabear_addons");
    const stock = this.getFromWebStorage("papabear_stock");

    const newAddon = { id, ...addon, createdAt: now };
    addons.push(newAddon);
    this.setToWebStorage("papabear_addons", addons);

    // Create stock entry
    if (addon.stockQuantity !== undefined) {
      const stockEntry = {
        id: this.generateId(),
        quantity: addon.stockQuantity,
        addonId: id,
        ingredientId: null,
        materialId: null,
      };
      stock.push(stockEntry);
      this.setToWebStorage("papabear_stock", stock);
      newAddon.stock = stockEntry;
    }

    return newAddon;
  }

  async updateAddon(id: string, addon: any): Promise<any> {
    const addons = this.getFromWebStorage("papabear_addons");
    const stock = this.getFromWebStorage("papabear_stock");
    const addonIndex = addons.findIndex((a: any) => a.id === id);

    if (addonIndex !== -1) {
      addons[addonIndex] = { ...addons[addonIndex], ...addon };
      this.setToWebStorage("papabear_addons", addons);

      // Update stock if provided
      if (addon.stockQuantity !== undefined) {
        const stockIndex = stock.findIndex((s: any) => s.addonId === id);
        if (stockIndex !== -1) {
          stock[stockIndex].quantity = addon.stockQuantity;
        } else {
          const stockEntry = {
            id: this.generateId(),
            quantity: addon.stockQuantity,
            addonId: id,
            ingredientId: null,
            materialId: null,
          };
          stock.push(stockEntry);
        }
        this.setToWebStorage("papabear_stock", stock);
      }

      return addons[addonIndex];
    }
    return null;
  }

  async deleteAddon(id: string): Promise<boolean> {
    const addons = this.getFromWebStorage("papabear_addons");
    const stock = this.getFromWebStorage("papabear_stock");
    const filtered = addons.filter((a: any) => a.id !== id);
    const filteredStock = stock.filter((s: any) => s.addonId !== id);
    this.setToWebStorage("papabear_addons", filtered);
    this.setToWebStorage("papabear_stock", filteredStock);
    return filtered.length < addons.length;
  }

  // Ingredients
  async getIngredients(): Promise<any[]> {
    const ingredients = this.getFromWebStorage("papabear_ingredients");
    const stock = this.getFromWebStorage("papabear_stock");

    return ingredients.map((ingredient) => ({
      ...ingredient,
      stock: stock.find((s: any) => s.ingredientId === ingredient.id),
    }));
  }

  async createIngredient(ingredient: any): Promise<any> {
    const id = this.generateId();
    const now = new Date().toISOString();

    // Calculate pricePerUnit if not provided
    const pricePerUnit =
      ingredient.pricePerUnit ||
      ingredient.pricePerPurchase / (ingredient.unitsPerPurchase || 1);

    const ingredients = this.getFromWebStorage("papabear_ingredients");
    const stock = this.getFromWebStorage("papabear_stock");

    const newIngredient = { id, ...ingredient, pricePerUnit, createdAt: now };
    ingredients.push(newIngredient);
    this.setToWebStorage("papabear_ingredients", ingredients);

    // Create stock entry
    if (ingredient.stockQuantity !== undefined) {
      const stockEntry = {
        id: this.generateId(),
        quantity: ingredient.stockQuantity,
        addonId: null,
        ingredientId: id,
        materialId: null,
      };
      stock.push(stockEntry);
      this.setToWebStorage("papabear_stock", stock);
      newIngredient.stock = stockEntry;
    }

    return newIngredient;
  }

  async updateIngredient(id: string, ingredient: any): Promise<any> {
    const ingredients = this.getFromWebStorage("papabear_ingredients");
    const stock = this.getFromWebStorage("papabear_stock");
    const ingredientIndex = ingredients.findIndex((i: any) => i.id === id);

    if (ingredientIndex !== -1) {
      // Calculate pricePerUnit
      const pricePerUnit =
        ingredient.pricePerPurchase && ingredient.unitsPerPurchase
          ? ingredient.pricePerPurchase / ingredient.unitsPerPurchase
          : ingredient.pricePerUnit ||
            ingredients[ingredientIndex].pricePerUnit;

      ingredients[ingredientIndex] = {
        ...ingredients[ingredientIndex],
        ...ingredient,
        pricePerUnit,
      };
      this.setToWebStorage("papabear_ingredients", ingredients);

      // Update stock if provided
      if (ingredient.stockQuantity !== undefined) {
        const stockIndex = stock.findIndex((s: any) => s.ingredientId === id);
        if (stockIndex !== -1) {
          stock[stockIndex].quantity = ingredient.stockQuantity;
        } else {
          const stockEntry = {
            id: this.generateId(),
            quantity: ingredient.stockQuantity,
            addonId: null,
            ingredientId: id,
            materialId: null,
          };
          stock.push(stockEntry);
        }
        this.setToWebStorage("papabear_stock", stock);
      }

      return ingredients[ingredientIndex];
    }
    return null;
  }

  async deleteIngredient(id: string): Promise<boolean> {
    const ingredients = this.getFromWebStorage("papabear_ingredients");
    const stock = this.getFromWebStorage("papabear_stock");
    const filtered = ingredients.filter((i: any) => i.id !== id);
    const filteredStock = stock.filter((s: any) => s.ingredientId !== id);
    this.setToWebStorage("papabear_ingredients", filtered);
    this.setToWebStorage("papabear_stock", filteredStock);
    return filtered.length < ingredients.length;
  }

  // Materials
  async getMaterials(): Promise<any[]> {
    const materials = this.getFromWebStorage("papabear_materials");
    const stock = this.getFromWebStorage("papabear_stock");

    return materials.map((material) => ({
      ...material,
      stock: stock.find((s: any) => s.materialId === material.id),
    }));
  }

  async createMaterial(material: any): Promise<any> {
    const id = this.generateId();
    const now = new Date().toISOString();

    // Calculate pricePerPiece if package
    const pricePerPiece =
      material.isPackage && material.packagePrice && material.unitsPerPackage
        ? material.packagePrice / material.unitsPerPackage
        : material.pricePerPiece || 0;

    const materials = this.getFromWebStorage("papabear_materials");
    const stock = this.getFromWebStorage("papabear_stock");

    const newMaterial = { id, ...material, pricePerPiece, createdAt: now };
    materials.push(newMaterial);
    this.setToWebStorage("papabear_materials", materials);

    // Create stock entry
    if (material.stockQuantity !== undefined) {
      const stockEntry = {
        id: this.generateId(),
        quantity: material.stockQuantity,
        addonId: null,
        ingredientId: null,
        materialId: id,
      };
      stock.push(stockEntry);
      this.setToWebStorage("papabear_stock", stock);
      newMaterial.stock = stockEntry;
    }

    return newMaterial;
  }

  async updateMaterial(id: string, material: any): Promise<any> {
    const materials = this.getFromWebStorage("papabear_materials");
    const stock = this.getFromWebStorage("papabear_stock");
    const materialIndex = materials.findIndex((m: any) => m.id === id);

    if (materialIndex !== -1) {
      // Calculate pricePerPiece if package
      const pricePerPiece =
        material.isPackage && material.packagePrice && material.unitsPerPackage
          ? material.packagePrice / material.unitsPerPackage
          : material.pricePerPiece || materials[materialIndex].pricePerPiece;

      materials[materialIndex] = {
        ...materials[materialIndex],
        ...material,
        pricePerPiece,
      };
      this.setToWebStorage("papabear_materials", materials);

      // Update stock if provided
      if (material.stockQuantity !== undefined) {
        const stockIndex = stock.findIndex((s: any) => s.materialId === id);
        if (stockIndex !== -1) {
          stock[stockIndex].quantity = material.stockQuantity;
        } else {
          const stockEntry = {
            id: this.generateId(),
            quantity: material.stockQuantity,
            addonId: null,
            ingredientId: null,
            materialId: id,
          };
          stock.push(stockEntry);
        }
        this.setToWebStorage("papabear_stock", stock);
      }

      return materials[materialIndex];
    }
    return null;
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const materials = this.getFromWebStorage("papabear_materials");
    const stock = this.getFromWebStorage("papabear_stock");
    const filtered = materials.filter((m: any) => m.id !== id);
    const filteredStock = stock.filter((s: any) => s.materialId !== id);
    this.setToWebStorage("papabear_materials", filtered);
    this.setToWebStorage("papabear_stock", filteredStock);
    return filtered.length < materials.length;
  }

  // Orders
  async getOrders(filters?: any): Promise<any[]> {
    let orders = this.getFromWebStorage("papabear_orders");

    // Apply filters if provided
    if (filters?.filter) {
      const now = new Date();
      if (filters.filter === "today") {
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        orders = orders.filter(
          (order: any) => new Date(order.createdAt) >= todayStart
        );
      }
    }

    return orders.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createOrder(orderData: any): Promise<any> {
    const id = this.generateId();
    const now = new Date().toISOString();
    const orders = this.getFromWebStorage("papabear_orders");

    const newOrder = {
      id,
      total: orderData.total,
      paid: orderData.paid,
      change: orderData.change,
      orderType: orderData.orderType,
      orderStatus: orderData.orderStatus || "QUEUING",
      createdAt: now,
      items: orderData.items || [],
    };

    orders.push(newOrder);
    this.setToWebStorage("papabear_orders", orders);
    return newOrder;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const orders = this.getFromWebStorage("papabear_orders");
    const filtered = orders.filter((o: any) => o.id !== id);
    this.setToWebStorage("papabear_orders", filtered);
    return filtered.length < orders.length;
  }

  async updateOrder(id: string, updates: any): Promise<any> {
    const orders = this.getFromWebStorage("papabear_orders");
    const orderIndex = orders.findIndex((order: any) => order.id === id);

    if (orderIndex !== -1) {
      orders[orderIndex] = { ...orders[orderIndex], ...updates };
      this.setToWebStorage("papabear_orders", orders);
      return orders[orderIndex];
    }
    return null;
  }

  // Stock
  async getStock(): Promise<any[]> {
    return this.getFromWebStorage("papabear_stock");
  }

  async updateStock(id: string, quantity: number): Promise<any> {
    const stock = this.getFromWebStorage("papabear_stock");
    const stockIndex = stock.findIndex((item: any) => item.id === id);

    if (stockIndex !== -1) {
      stock[stockIndex].quantity = quantity;
      this.setToWebStorage("papabear_stock", stock);
      return stock[stockIndex];
    }
    return null;
  }

  // Dashboard
  async getDashboardStats(filters?: any): Promise<any> {
    // Simplified dashboard stats
    const mockStats = {
      all_time_earning: 50000,
      all_time_products_sold: 1200,
      this_month_sales: 15000,
      last_month_sales: 12000,
      trend: "up" as const,
      trend_percent: 25,
      best_product: "Coffee",
      least_product: "Sandwich",
      busiest_hour: "2:00 PM",
      least_hour: "6:00 AM",
    };

    return {
      stats: mockStats,
      monthly: [],
      products: [],
      hours: [],
      all_time_daily: [],
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

class WebDatabaseService extends AndroidDatabaseService {
  // Web-specific overrides can be added here if needed
}

// Create singleton instance
export const databaseService = new WebDatabaseService();
