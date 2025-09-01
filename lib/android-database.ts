// Android-compatible database service with Capacitor SQLite
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
  getFlavors: () => Promise<any[]>;
  createFlavor: (flavor: { name: string }) => Promise<any>;
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
      // Create connection
      this.db = await this.sqliteConnection.createConnection(
        this.DB_NAME,
        false,
        "no-encryption",
        this.DB_VERSION,
        false
      );

      await this.db.open();
      await this.createTables();
      console.log("SQLite database initialized successfully");
    } catch (error) {
      console.error("SQLite initialization error:", error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const statements = [
      // Products table
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        imageUrl TEXT,
        createdAt TEXT NOT NULL
      );`,

      // Variants table
      `CREATE TABLE IF NOT EXISTS variants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        productId TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
      );`,

      // Variant materials junction table
      `CREATE TABLE IF NOT EXISTS variant_materials (
        id TEXT PRIMARY KEY,
        variantId TEXT NOT NULL,
        materialId TEXT NOT NULL,
        quantity REAL NOT NULL,
        FOREIGN KEY (variantId) REFERENCES variants (id) ON DELETE CASCADE
      );`,

      // Variant ingredients junction table
      `CREATE TABLE IF NOT EXISTS variant_ingredients (
        id TEXT PRIMARY KEY,
        variantId TEXT NOT NULL,
        ingredientId TEXT NOT NULL,
        quantity REAL NOT NULL,
        FOREIGN KEY (variantId) REFERENCES variants (id) ON DELETE CASCADE
      );`,

      // Addons table
      `CREATE TABLE IF NOT EXISTS addons (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        createdAt TEXT NOT NULL
      );`,

      // Ingredients table
      `CREATE TABLE IF NOT EXISTS ingredients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        pricePerPurchase REAL NOT NULL,
        unitsPerPurchase REAL NOT NULL,
        pricePerUnit REAL NOT NULL,
        createdAt TEXT NOT NULL
      );`,

      // Materials table
      `CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        isPackage INTEGER NOT NULL DEFAULT 0,
        packagePrice REAL,
        unitsPerPackage REAL,
        pricePerPiece REAL NOT NULL,
        createdAt TEXT NOT NULL
      );`,

      // Orders table
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

      // Stock table
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
      const tables = [
        "products",
        "variants",
        "addons",
        "ingredients",
        "materials",
        "orders",
        "stock",
      ];
      tables.forEach((table) => {
        if (!localStorage.getItem(`papabear_${table}`)) {
          localStorage.setItem(`papabear_${table}`, JSON.stringify([]));
        }
      });
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

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // PRODUCTS
  async getProducts(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        const result = await this.db.query(
          "SELECT * FROM products ORDER BY createdAt DESC"
        );
        const products = result.values || [];

        // Get variants for each product
        for (const product of products) {
          const variantsResult = await this.db.query(
            "SELECT * FROM variants WHERE productId = ? ORDER BY name",
            [product.id]
          );
          product.variants = variantsResult.values || [];
        }

        return products;
      } catch (error) {
        console.error("Error getting products:", error);
        return [];
      }
    } else {
      // Fallback to localStorage
      const products = this.getFromWebStorage("papabear_products");
      const variants = this.getFromWebStorage("papabear_variants");
      return products.map((product) => ({
        ...product,
        variants: variants.filter((v: any) => v.productId === product.id),
      }));
    }
  }

  async createProduct(product: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    const id = this.generateId();
    const now = new Date().toISOString();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        await this.db.run(
          "INSERT INTO products (id, name, category, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?)",
          [id, product.name, product.category, product.imageUrl || null, now]
        );

        const newProduct = { id, ...product, createdAt: now };

        if (product.variants) {
          const variants = [];
          for (const variant of product.variants) {
            const variantId = this.generateId();
            await this.db.run(
              "INSERT INTO variants (id, name, price, productId) VALUES (?, ?, ?, ?)",
              [variantId, variant.name, variant.price, id]
            );
            variants.push({ id: variantId, ...variant, productId: id });
          }
          newProduct.variants = variants;
        }

        return newProduct;
      } catch (error) {
        console.error("Error creating product:", error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      const products = this.getFromWebStorage("papabear_products");
      const variants = this.getFromWebStorage("papabear_variants");

      const newProduct = { id, ...product, createdAt: now };
      products.push(newProduct);
      this.setToWebStorage("papabear_products", products);

      if (product.variants) {
        const newVariants = product.variants.map((v: any) => ({
          id: this.generateId(),
          ...v,
          productId: id,
        }));
        variants.push(...newVariants);
        this.setToWebStorage("papabear_variants", variants);
        newProduct.variants = newVariants;
      }

      return newProduct;
    }
  }

  async updateProduct(id: string, product: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        await this.db.run(
          "UPDATE products SET name = ?, category = ?, imageUrl = ? WHERE id = ?",
          [product.name, product.category, product.imageUrl || null, id]
        );

        if (product.variants) {
          // Delete existing variants
          await this.db.run("DELETE FROM variants WHERE productId = ?", [id]);

          // Insert new variants
          const variants = [];
          for (const variant of product.variants) {
            const variantId = this.generateId();
            await this.db.run(
              "INSERT INTO variants (id, name, price, productId) VALUES (?, ?, ?, ?)",
              [variantId, variant.name, variant.price, id]
            );
            variants.push({ id: variantId, ...variant, productId: id });
          }
          product.variants = variants;
        }

        return { id, ...product };
      } catch (error) {
        console.error("Error updating product:", error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      const products = this.getFromWebStorage("papabear_products");
      const variants = this.getFromWebStorage("papabear_variants");

      const index = products.findIndex((p: any) => p.id === id);
      if (index !== -1) {
        products[index] = { ...products[index], ...product };
        this.setToWebStorage("papabear_products", products);

        if (product.variants) {
          const filteredVariants = variants.filter(
            (v: any) => v.productId !== id
          );
          const newVariants = product.variants.map((v: any) => ({
            id: v.id || this.generateId(),
            ...v,
            productId: id,
          }));
          this.setToWebStorage("papabear_variants", [
            ...filteredVariants,
            ...newVariants,
          ]);
        }

        return products[index];
      }
      return null;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        await this.db.run("DELETE FROM products WHERE id = ?", [id]);
        return true;
      } catch (error) {
        console.error("Error deleting product:", error);
        return false;
      }
    } else {
      // Fallback to localStorage
      const products = this.getFromWebStorage("papabear_products");
      const variants = this.getFromWebStorage("papabear_variants");

      const filteredProducts = products.filter((p: any) => p.id !== id);
      const filteredVariants = variants.filter((v: any) => v.productId !== id);

      this.setToWebStorage("papabear_products", filteredProducts);
      this.setToWebStorage("papabear_variants", filteredVariants);

      return filteredProducts.length < products.length;
    }
  }

  // ADDONS
  async getAddons(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        const result = await this.db.query(
          "SELECT * FROM addons ORDER BY createdAt DESC"
        );
        return result.values || [];
      } catch (error) {
        console.error("Error getting addons:", error);
        return [];
      }
    } else {
      return this.getFromWebStorage("papabear_addons");
    }
  }

  async createAddon(addon: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    const id = this.generateId();
    const now = new Date().toISOString();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        await this.db.run(
          "INSERT INTO addons (id, name, price, createdAt) VALUES (?, ?, ?, ?)",
          [id, addon.name, addon.price, now]
        );

        // Create stock entry if provided
        if (addon.stockQuantity !== undefined) {
          await this.db.run(
            "INSERT INTO stock (id, quantity, addonId) VALUES (?, ?, ?)",
            [this.generateId(), addon.stockQuantity, id]
          );
        }

        return { id, ...addon, createdAt: now };
      } catch (error) {
        console.error("Error creating addon:", error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      const addons = this.getFromWebStorage("papabear_addons");
      const newAddon = { id, ...addon, createdAt: now };
      addons.push(newAddon);
      this.setToWebStorage("papabear_addons", addons);

      if (addon.stockQuantity !== undefined) {
        const stock = this.getFromWebStorage("papabear_stock");
        stock.push({
          id: this.generateId(),
          quantity: addon.stockQuantity,
          addonId: id,
          ingredientId: null,
          materialId: null,
        });
        this.setToWebStorage("papabear_stock", stock);
      }

      return newAddon;
    }
  }

  async updateAddon(id: string, addon: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        await this.db.run(
          "UPDATE addons SET name = ?, price = ? WHERE id = ?",
          [addon.name, addon.price, id]
        );

        if (addon.stockQuantity !== undefined) {
          const stockResult = await this.db.query(
            "SELECT id FROM stock WHERE addonId = ?",
            [id]
          );
          if (stockResult.values && stockResult.values.length > 0) {
            await this.db.run(
              "UPDATE stock SET quantity = ? WHERE addonId = ?",
              [addon.stockQuantity, id]
            );
          } else {
            await this.db.run(
              "INSERT INTO stock (id, quantity, addonId) VALUES (?, ?, ?)",
              [this.generateId(), addon.stockQuantity, id]
            );
          }
        }

        return { id, ...addon };
      } catch (error) {
        console.error("Error updating addon:", error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      const addons = this.getFromWebStorage("papabear_addons");
      const index = addons.findIndex((a: any) => a.id === id);
      if (index !== -1) {
        addons[index] = { ...addons[index], ...addon };
        this.setToWebStorage("papabear_addons", addons);
        return addons[index];
      }
      return null;
    }
  }

  async deleteAddon(id: string): Promise<boolean> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        await this.db.run("DELETE FROM addons WHERE id = ?", [id]);
        return true;
      } catch (error) {
        console.error("Error deleting addon:", error);
        return false;
      }
    } else {
      // Fallback to localStorage
      const addons = this.getFromWebStorage("papabear_addons");
      const filtered = addons.filter((a: any) => a.id !== id);
      this.setToWebStorage("papabear_addons", filtered);
      return filtered.length < addons.length;
    }
  }

  // INGREDIENTS
  async getIngredients(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        const result = await this.db.query(
          "SELECT * FROM ingredients ORDER BY createdAt DESC"
        );
        return result.values || [];
      } catch (error) {
        console.error("Error getting ingredients:", error);
        return [];
      }
    } else {
      return this.getFromWebStorage("papabear_ingredients");
    }
  }

  async createIngredient(ingredient: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    const id = this.generateId();
    const now = new Date().toISOString();
    const pricePerUnit =
      ingredient.pricePerUnit ||
      ingredient.pricePerPurchase / (ingredient.unitsPerPurchase || 1);

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        await this.db.run(
          "INSERT INTO ingredients (id, name, unit, pricePerPurchase, unitsPerPurchase, pricePerUnit, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            id,
            ingredient.name,
            ingredient.unit,
            ingredient.pricePerPurchase,
            ingredient.unitsPerPurchase,
            pricePerUnit,
            now,
          ]
        );

        if (ingredient.stockQuantity !== undefined) {
          await this.db.run(
            "INSERT INTO stock (id, quantity, ingredientId) VALUES (?, ?, ?)",
            [this.generateId(), ingredient.stockQuantity, id]
          );
        }

        return { id, ...ingredient, pricePerUnit, createdAt: now };
      } catch (error) {
        console.error("Error creating ingredient:", error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      const ingredients = this.getFromWebStorage("papabear_ingredients");
      const newIngredient = { id, ...ingredient, pricePerUnit, createdAt: now };
      ingredients.push(newIngredient);
      this.setToWebStorage("papabear_ingredients", ingredients);
      return newIngredient;
    }
  }

  async updateIngredient(id: string, ingredient: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    const pricePerUnit =
      ingredient.pricePerPurchase && ingredient.unitsPerPurchase
        ? ingredient.pricePerPurchase / ingredient.unitsPerPurchase
        : ingredient.pricePerUnit;

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        await this.db.run(
          "UPDATE ingredients SET name = ?, unit = ?, pricePerPurchase = ?, unitsPerPurchase = ?, pricePerUnit = ? WHERE id = ?",
          [
            ingredient.name,
            ingredient.unit,
            ingredient.pricePerPurchase,
            ingredient.unitsPerPurchase,
            pricePerUnit,
            id,
          ]
        );

        return { id, ...ingredient, pricePerUnit };
      } catch (error) {
        console.error("Error updating ingredient:", error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      const ingredients = this.getFromWebStorage("papabear_ingredients");
      const index = ingredients.findIndex((i: any) => i.id === id);
      if (index !== -1) {
        ingredients[index] = {
          ...ingredients[index],
          ...ingredient,
          pricePerUnit,
        };
        this.setToWebStorage("papabear_ingredients", ingredients);
        return ingredients[index];
      }
      return null;
    }
  }

  async deleteIngredient(id: string): Promise<boolean> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        await this.db.run("DELETE FROM ingredients WHERE id = ?", [id]);
        return true;
      } catch (error) {
        console.error("Error deleting ingredient:", error);
        return false;
      }
    } else {
      // Fallback to localStorage
      const ingredients = this.getFromWebStorage("papabear_ingredients");
      const filtered = ingredients.filter((i: any) => i.id !== id);
      this.setToWebStorage("papabear_ingredients", filtered);
      return filtered.length < ingredients.length;
    }
  }

  // MATERIALS
  async getMaterials(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        const result = await this.db.query(
          "SELECT * FROM materials ORDER BY createdAt DESC"
        );
        return result.values || [];
      } catch (error) {
        console.error("Error getting materials:", error);
        return [];
      }
    } else {
      return this.getFromWebStorage("papabear_materials");
    }
  }

  async createMaterial(material: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    const id = this.generateId();
    const now = new Date().toISOString();
    const pricePerPiece =
      material.isPackage && material.packagePrice && material.unitsPerPackage
        ? material.packagePrice / material.unitsPerPackage
        : material.pricePerPiece || 0;

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        await this.db.run(
          "INSERT INTO materials (id, name, isPackage, packagePrice, unitsPerPackage, pricePerPiece, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            id,
            material.name,
            material.isPackage ? 1 : 0,
            material.packagePrice,
            material.unitsPerPackage,
            pricePerPiece,
            now,
          ]
        );

        if (material.stockQuantity !== undefined) {
          await this.db.run(
            "INSERT INTO stock (id, quantity, materialId) VALUES (?, ?, ?)",
            [this.generateId(), material.stockQuantity, id]
          );
        }

        return { id, ...material, pricePerPiece, createdAt: now };
      } catch (error) {
        console.error("Error creating material:", error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      const materials = this.getFromWebStorage("papabear_materials");
      const newMaterial = { id, ...material, pricePerPiece, createdAt: now };
      materials.push(newMaterial);
      this.setToWebStorage("papabear_materials", materials);
      return newMaterial;
    }
  }

  async updateMaterial(id: string, material: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    const pricePerPiece =
      material.isPackage && material.packagePrice && material.unitsPerPackage
        ? material.packagePrice / material.unitsPerPackage
        : material.pricePerPiece;

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        await this.db.run(
          "UPDATE materials SET name = ?, isPackage = ?, packagePrice = ?, unitsPerPackage = ?, pricePerPiece = ? WHERE id = ?",
          [
            material.name,
            material.isPackage ? 1 : 0,
            material.packagePrice,
            material.unitsPerPackage,
            pricePerPiece,
            id,
          ]
        );

        return { id, ...material, pricePerPiece };
      } catch (error) {
        console.error("Error updating material:", error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      const materials = this.getFromWebStorage("papabear_materials");
      const index = materials.findIndex((m: any) => m.id === id);
      if (index !== -1) {
        materials[index] = { ...materials[index], ...material, pricePerPiece };
        this.setToWebStorage("papabear_materials", materials);
        return materials[index];
      }
      return null;
    }
  }

  async deleteMaterial(id: string): Promise<boolean> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        await this.db.run("DELETE FROM materials WHERE id = ?", [id]);
        return true;
      } catch (error) {
        console.error("Error deleting material:", error);
        return false;
      }
    } else {
      // Fallback to localStorage
      const materials = this.getFromWebStorage("papabear_materials");
      const filtered = materials.filter((m: any) => m.id !== id);
      this.setToWebStorage("papabear_materials", filtered);
      return filtered.length < materials.length;
    }
  }

  // ORDERS
  async getOrders(filters?: any): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        let query = "SELECT * FROM orders";
        const params: any[] = [];

        if (filters?.filter === "today") {
          const today = new Date().toISOString().split("T")[0];
          query += " WHERE DATE(createdAt) = ?";
          params.push(today);
        }

        query += " ORDER BY createdAt DESC";

        const result = await this.db.query(query, params);
        const orders = result.values || [];

        // Parse items JSON
        return orders.map((order) => ({
          ...order,
          items: JSON.parse(order.items || "[]"),
        }));
      } catch (error) {
        console.error("Error getting orders:", error);
        return [];
      }
    } else {
      // Fallback to localStorage
      let orders = this.getFromWebStorage("papabear_orders");

      if (filters?.filter === "today") {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        orders = orders.filter(
          (order: any) => new Date(order.createdAt) >= todayStart
        );
      }

      return orders.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  }

  async createOrder(orderData: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    const id = this.generateId();
    const now = new Date().toISOString();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        await this.db.run(
          "INSERT INTO orders (id, total, paid, change, orderType, orderStatus, items, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            id,
            orderData.total,
            orderData.paid,
            orderData.change,
            orderData.orderType,
            orderData.orderStatus || "QUEUING",
            JSON.stringify(orderData.items || []),
            now,
          ]
        );

        return {
          id,
          total: orderData.total,
          paid: orderData.paid,
          change: orderData.change,
          orderType: orderData.orderType,
          orderStatus: orderData.orderStatus || "QUEUING",
          items: orderData.items || [],
          createdAt: now,
        };
      } catch (error) {
        console.error("Error creating order:", error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      const orders = this.getFromWebStorage("papabear_orders");
      const newOrder = {
        id,
        total: orderData.total,
        paid: orderData.paid,
        change: orderData.change,
        orderType: orderData.orderType,
        orderStatus: orderData.orderStatus || "QUEUING",
        items: orderData.items || [],
        createdAt: now,
      };
      orders.push(newOrder);
      this.setToWebStorage("papabear_orders", orders);
      return newOrder;
    }
  }

  async updateOrder(id: string, updates: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        const setClause = Object.keys(updates)
          .map((key) => `${key} = ?`)
          .join(", ");
        const values = [...Object.values(updates), id];

        await this.db.run(
          `UPDATE orders SET ${setClause} WHERE id = ?`,
          values
        );
        return { id, ...updates };
      } catch (error) {
        console.error("Error updating order:", error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      const orders = this.getFromWebStorage("papabear_orders");
      const index = orders.findIndex((o: any) => o.id === id);
      if (index !== -1) {
        orders[index] = { ...orders[index], ...updates };
        this.setToWebStorage("papabear_orders", orders);
        return orders[index];
      }
      return null;
    }
  }

  async deleteOrder(id: string): Promise<boolean> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        await this.db.run("DELETE FROM orders WHERE id = ?", [id]);
        return true;
      } catch (error) {
        console.error("Error deleting order:", error);
        return false;
      }
    } else {
      // Fallback to localStorage
      const orders = this.getFromWebStorage("papabear_orders");
      const filtered = orders.filter((o: any) => o.id !== id);
      this.setToWebStorage("papabear_orders", filtered);
      return filtered.length < orders.length;
    }
  }

  // STOCK
  async getStock(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        const result = await this.db.query("SELECT * FROM stock");
        return result.values || [];
      } catch (error) {
        console.error("Error getting stock:", error);
        return [];
      }
    } else {
      return this.getFromWebStorage("papabear_stock");
    }
  }

  async updateStock(id: string, quantity: number): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        await this.db.run("UPDATE stock SET quantity = ? WHERE id = ?", [
          quantity,
          id,
        ]);
        return { id, quantity };
      } catch (error) {
        console.error("Error updating stock:", error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      const stock = this.getFromWebStorage("papabear_stock");
      const index = stock.findIndex((s: any) => s.id === id);
      if (index !== -1) {
        stock[index].quantity = quantity;
        this.setToWebStorage("papabear_stock", stock);
        return stock[index];
      }
      return null;
    }
  }

  // DASHBOARD
  async getDashboardStats(filters?: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        // Get basic stats from orders
        const totalResult = await this.db.query(
          "SELECT COUNT(*) as totalOrders, SUM(total) as totalRevenue FROM orders"
        );
        const thisMonthResult = await this.db.query(
          `SELECT COUNT(*) as monthlyOrders, SUM(total) as monthlyRevenue 
           FROM orders 
           WHERE strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now')`
        );

        const stats = totalResult.values?.[0] || {};
        const monthlyStats = thisMonthResult.values?.[0] || {};

        return {
          stats: {
            all_time_earning: stats.totalRevenue || 0,
            all_time_products_sold: stats.totalOrders || 0,
            this_month_sales: monthlyStats.monthlyRevenue || 0,
            last_month_sales: 0,
            trend: "up" as const,
            trend_percent: 0,
            best_product: "N/A",
            least_product: "N/A",
            busiest_hour: "N/A",
            least_hour: "N/A",
          },
          monthly: [],
          products: [],
          hours: [],
          all_time_daily: [],
        };
      } catch (error) {
        console.error("Error getting dashboard stats:", error);
        return this.getDefaultStats();
      }
    } else {
      return this.getDefaultStats();
    }
  }

  private getDefaultStats() {
    return {
      stats: {
        all_time_earning: 0,
        all_time_products_sold: 0,
        this_month_sales: 0,
        last_month_sales: 0,
        trend: "up" as const,
        trend_percent: 0,
        best_product: "N/A",
        least_product: "N/A",
        busiest_hour: "N/A",
        least_hour: "N/A",
      },
      monthly: [],
      products: [],
      hours: [],
      all_time_daily: [],
    };
  }
}

// Create singleton instance
export const androidDatabaseService = new AndroidDatabaseService();
