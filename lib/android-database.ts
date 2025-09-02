// Android-compatible database service with improved Capacitor SQLite
import { Capacitor } from "@capacitor/core";
import { sqliteService } from "./sqlite-service";
import { DebugLogger } from "./debug-logger";

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
  updateFlavor: (id: string, flavor: { name: string }) => Promise<any>;
  deleteFlavor: (id: string) => Promise<boolean>;
  importPapaBearFlavors: () => Promise<number>;
}

class AndroidDatabaseService implements DatabaseService {
  private isInitialized = false;
  private db: any = null; // Add database reference

  async initializeDatabase(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔍 AndroidDatabaseService: Starting database initialization...');
      console.log('🔍 Platform check - isNativePlatform():', Capacitor.isNativePlatform());
      
      if (Capacitor.isNativePlatform()) {
        console.log('🔍 AndroidDatabaseService: Initializing SQLite service...');
        await sqliteService.initialize();
        this.db = sqliteService.getDB(); // Get the database connection
        console.log("✅ Android SQLite database initialized successfully");
        console.log('🔍 Database connection established:', this.db ? 'YES' : 'NO');
      } else {
        await this.initializeWebStorage();
        console.log("✅ Web storage fallback initialized");
      }
      this.isInitialized = true;
      console.log('✅ AndroidDatabaseService initialization complete');
    } catch (error) {
      console.error("❌ Database initialization error:", error);
      throw error;
    }
  }

  // Method to manually clean up duplicates
  async cleanupDuplicates(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await sqliteService.cleanupDuplicates();
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
        "flavors", // Added flavors table
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

  // Map admin category values to database category values
  private mapCategoryToDatabase(adminCategory: string): string {
    const categoryMapping: { [key: string]: string } = {
      'Meals': 'InsideMeals',
      'ColdBeverages': 'InsideBeverages', 
      'HotBeverages': 'InsideBeverages'
    };
    
    return categoryMapping[adminCategory] || 'InsideMeals'; // Default fallback
  }

  // Map database category values back to admin category values
  private mapCategoryFromDatabase(dbCategory: string): string {
    const categoryMapping: { [key: string]: string } = {
      'InsideMeals': 'Meals',
      'InsideBeverages': 'ColdBeverages', // Default to cold beverages
      'OutsideSnacks': 'Meals' // Map snacks to meals for now
    };
    
    return categoryMapping[dbCategory] || 'Meals'; // Default fallback
  }

  // PRODUCTS
  async getProducts(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    console.log('🔍 AndroidDatabaseService.getProducts() called');
    console.log('🔍 Platform:', Capacitor.isNativePlatform() ? 'Native' : 'Web');

    if (Capacitor.isNativePlatform()) {
      try {
        console.log('🔍 Getting products with variants from SQLite...');
        await sqliteService.initialize();
        const db = sqliteService.getDB();
        
        // Get products
        const productsResult = await db.query('SELECT * FROM products ORDER BY createdAt DESC');
        const products = productsResult.values || [];
        
        // Get variants/sizes for each product
        const productsWithSizes = [];
        for (const product of products) {
          const variantsResult = await db.query(
            'SELECT * FROM variants WHERE productId = ? ORDER BY createdAt',
            [product.id]
          );
          const sizes = (variantsResult.values || []).map((v: any) => ({
            id: v.id,
            name: v.name,
            price: v.price,
            materials: [], // For now, empty - can be expanded later
            ingredients: [] // For now, empty - can be expanded later
          }));
          
          productsWithSizes.push({
            id: product.id,
            name: product.name,
            category: this.mapCategoryFromDatabase(product.category),
            imageUrl: product.imageUrl,
            createdAt: product.createdAt,
            flavors: [], // For now, empty - can be expanded later
            sizes: sizes
          });
        }
        
        console.log('✅ Products with sizes loaded from SQLite:', productsWithSizes.length);
        return productsWithSizes;
      } catch (error) {
        console.error("❌ Error getting products from SQLite:", error);
        return [];
      }
    } else {
      // Fallback to localStorage
      console.log('🔍 Using localStorage fallback to get products...');
      const products = this.getFromWebStorage("papabear_products");
      console.log('✅ Products loaded from localStorage:', products.length);
      return products;
    }
  }

  async createProduct(product: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    return DebugLogger.logDatabaseOperation(
      'CREATE_PRODUCT',
      { name: product.name, category: product.category, platform: Capacitor.isNativePlatform() ? 'native' : 'web' },
      async () => {
        if (Capacitor.isNativePlatform()) {
          try {
            // Initialize SQLite service to ensure database is ready
            await sqliteService.initialize();
            const db = sqliteService.getDB();
            
            const id = this.generateId();
            const now = new Date().toISOString();

            // Map admin category to database category 
            const dbCategory = this.mapCategoryToDatabase(product.category);
            console.log('🔍 Category mapping:', product.category, '→', dbCategory);

            // Insert product with current schema (camelCase columns)
            await db.run(
              'INSERT INTO products (id, name, category, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?)',
              [id, product.name, dbCategory, product.imageUrl || null, now]
            );

            // Handle sizes (using variants table in current schema)
            if (product.sizes && product.sizes.length > 0) {
              for (const size of product.sizes) {
                const sizeId = this.generateId();
                await db.run(
                  'INSERT INTO variants (id, name, price, productId, createdAt) VALUES (?, ?, ?, ?, ?)',
                  [sizeId, size.name, size.price, id, now]
                );
              }
            }

            // Create return object with admin-expected structure
            const newProduct = {
              id,
              name: product.name,
              category: product.category,
              imageUrl: product.imageUrl || null,
              createdAt: now,
              flavors: product.flavors || [],
              sizes: product.sizes || []
            };

            DebugLogger.log('PRODUCT_CREATED_NEW', { id, name: product.name });
            return newProduct;
          } catch (error) {
            console.error('❌ Error creating product in SQLite:', error);
            throw error;
          }
        } else {
          // Fallback to localStorage
          const products = this.getFromWebStorage("papabear_products");
          const existing = products.find((p: any) => 
            p.name.toLowerCase() === product.name.toLowerCase()
          );
          
          if (existing) {
            DebugLogger.log('PRODUCT_FOUND_EXISTING_LOCALSTORAGE', { name: product.name });
            return existing;
          }

          const id = this.generateId();
          const now = new Date().toISOString();
          const newProduct = { id, ...product, createdAt: now };
          
          products.push(newProduct);
          this.setToWebStorage("papabear_products", products);

          DebugLogger.log('PRODUCT_CREATED_LOCALSTORAGE', { id, name: product.name });
          return newProduct;
        }
      }
    );
  }

  async updateProduct(id: string, product: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        await sqliteService.initialize();
        const db = sqliteService.getDB();
        
        // Map admin category to database category
        const dbCategory = this.mapCategoryToDatabase(product.category);
        console.log('🔍 Update category mapping:', product.category, '→', dbCategory);
        
        // Update product
        await db.run(
          'UPDATE products SET name = ?, category = ?, imageUrl = ? WHERE id = ?',
          [product.name, dbCategory, product.imageUrl || null, id]
        );

        // Delete existing variants and insert new ones
        await db.run('DELETE FROM variants WHERE productId = ?', [id]);
        
        if (product.sizes && product.sizes.length > 0) {
          for (const size of product.sizes) {
            const sizeId = this.generateId();
            await db.run(
              'INSERT INTO variants (id, name, price, productId, createdAt) VALUES (?, ?, ?, ?, ?)',
              [sizeId, size.name, size.price, id, new Date().toISOString()]
            );
          }
        }

        const updatedProduct = {
          id,
          name: product.name,
          category: product.category,
          imageUrl: product.imageUrl || null,
          flavors: product.flavors || [],
          sizes: product.sizes || []
        };
        
        console.log('✅ Product updated with sizes:', id);
        return updatedProduct;
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

    if (Capacitor.isNativePlatform()) {
      try {
        await sqliteService.initialize();
        const db = sqliteService.getDB();
        
        // Delete variants first (foreign key constraint)
        await db.run('DELETE FROM variants WHERE productId = ?', [id]);
        
        // Delete product
        const result = await db.run('DELETE FROM products WHERE id = ?', [id]);
        
        console.log('✅ Product deleted with all related data:', id);
        return (result.changes || 0) > 0;
      } catch (error) {
        console.error("Error deleting product:", error);
        return false;
      }
    } else {
      // Fallback to localStorage
      const products = this.getFromWebStorage("papabear_products");
      const filteredProducts = products.filter((p: any) => p.id !== id);
      this.setToWebStorage("papabear_products", filteredProducts);
      return filteredProducts.length < products.length;
    }
  }

  // ADDONS
  async getAddons(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    console.log('🔍 AndroidDatabaseService.getAddons() called');
    console.log('🔍 Platform:', Capacitor.isNativePlatform() ? 'Native' : 'Web');

    if (Capacitor.isNativePlatform()) {
      try {
        console.log('🔍 Using SQLiteService to get addons...');
        const addons = await sqliteService.getAllAddons();
        console.log('🔍 Retrieved addons from SQLite:', addons.length, 'items');
        
        // Transform stockQuantity to stock object for UI compatibility
        const transformedAddons = addons.map(addon => ({
          ...addon,
          stock: { quantity: addon.stockQuantity || 0 }
        }));
        
        console.log('✅ Addons loaded from SQLite with stock data');
        return transformedAddons;
      } catch (error) {
        console.error("❌ Error getting addons from SQLite:", error);
        return [];
      }
    } else {
      console.log('🔍 Using localStorage fallback to get addons...');
      const addons = this.getFromWebStorage("papabear_addons");
      console.log('🔍 Retrieved addons from localStorage:', addons.length, 'items');
      console.log('✅ Addons loaded from localStorage');
      return addons;
    }
  }

  async createAddon(addon: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        const id = await sqliteService.createAddon(addon.name, addon.price);
        
        if (id) {
          // Update stock if provided
          if (addon.stockQuantity !== undefined) {
            await sqliteService.updateStock('addon', id, addon.stockQuantity);
          }
          
          const newAddon = {
            id,
            name: addon.name,
            price: addon.price,
            createdAt: new Date().toISOString()
          };
          
          return newAddon;
        } else {
          // Addon already exists, get the existing one
          const addons = await sqliteService.getAllAddons();
          const existing = addons.find(a => 
            a.name.toLowerCase() === addon.name.toLowerCase()
          );
          return existing || null;
        }
      } catch (error) {
        console.error("Error creating addon:", error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      const addons = this.getFromWebStorage("papabear_addons");
      const existing = addons.find((a: any) => 
        a.name.toLowerCase() === addon.name.toLowerCase()
      );
      
      if (existing) {
        return existing;
      }

      const id = this.generateId();
      const now = new Date().toISOString();
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

        return { 
          id, 
          ...addon,
          stock: { quantity: addon.stockQuantity || 0 }
        };
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

    if (Capacitor.isNativePlatform()) {
      try {
        console.log('🔍 Deleting addon from SQLite:', id);
        const success = await sqliteService.deleteAddon(id);
        console.log('✅ Addon deletion result:', success);
        return success; // Return the result without throwing
      } catch (error) {
        console.error("❌ Error deleting addon:", error);
        return false; // Return false instead of throwing
      }
    } else {
      // Fallback to localStorage
      const addons = this.getFromWebStorage("papabear_addons");
      const filtered = addons.filter((a: any) => a.id !== id);
      this.setToWebStorage("papabear_addons", filtered);
      return filtered.length < addons.length; // Match working pattern
    }
  }

  // INGREDIENTS
  async getIngredients(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    console.log('🔍 AndroidDatabaseService.getIngredients() called');
    console.log('🔍 Platform:', Capacitor.isNativePlatform() ? 'Native' : 'Web');

    if (Capacitor.isNativePlatform()) {
      try {
        console.log('🔍 Using SQLiteService to get ingredients...');
        const ingredients = await sqliteService.getAllIngredients();
        console.log('🔍 Retrieved ingredients from SQLite:', ingredients.length, 'items');
        
        // Transform stockQuantity to stock object for UI compatibility
        const transformedIngredients = ingredients.map(ingredient => ({
          ...ingredient,
          stock: { quantity: ingredient.stockQuantity || 0 }
        }));
        
        console.log('✅ Ingredients loaded from SQLite with stock data');
        return transformedIngredients;
      } catch (error) {
        console.error("❌ Error getting ingredients from SQLite:", error);
        return [];
      }
    } else {
      console.log('🔍 Using localStorage fallback to get ingredients...');
      const ingredients = this.getFromWebStorage("papabear_ingredients");
      console.log('🔍 Retrieved ingredients from localStorage:', ingredients.length, 'items');
      console.log('✅ Ingredients loaded from localStorage');
      return ingredients;
    }
  }

  async createIngredient(ingredient: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    const id = this.generateId();
    const now = new Date().toISOString();
    const pricePerUnit =
      ingredient.pricePerUnit ||
      ingredient.pricePerPurchase / (ingredient.unitsPerPurchase || 1);

    if (Capacitor.isNativePlatform()) {
      try {
        const id = await sqliteService.createIngredient(
          ingredient.name,
          ingredient.measurementUnit,
          ingredient.pricePerPurchase,
          ingredient.unitsPerPurchase
        );
        
        if (id) {
          // Update stock if provided
          if (ingredient.stockQuantity !== undefined) {
            await sqliteService.updateStock('ingredient', id, ingredient.stockQuantity);
          }
          
          const newIngredient = {
            id,
            name: ingredient.name,
            measurementUnit: ingredient.measurementUnit,
            pricePerPurchase: ingredient.pricePerPurchase,
            unitsPerPurchase: ingredient.unitsPerPurchase,
            pricePerUnit: ingredient.pricePerPurchase / ingredient.unitsPerPurchase,
            createdAt: new Date().toISOString()
          };
          
          return newIngredient;
        } else {
          // Ingredient already exists, get the existing one
          const ingredients = await sqliteService.getAllIngredients();
          const existing = ingredients.find(i => 
            i.name.toLowerCase() === ingredient.name.toLowerCase()
          );
          return existing || null;
        }
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
            ingredient.measurementUnit || ingredient.unit,
            ingredient.pricePerPurchase,
            ingredient.unitsPerPurchase,
            pricePerUnit,
            id,
          ]
        );

        if (ingredient.stockQuantity !== undefined) {
          const stockResult = await this.db.query(
            "SELECT id FROM stock WHERE ingredientId = ?",
            [id]
          );
          if (stockResult.values && stockResult.values.length > 0) {
            await this.db.run(
              "UPDATE stock SET quantity = ? WHERE ingredientId = ?",
              [ingredient.stockQuantity, id]
            );
          } else {
            await this.db.run(
              "INSERT INTO stock (id, quantity, ingredientId) VALUES (?, ?, ?)",
              [this.generateId(), ingredient.stockQuantity, id]
            );
          }
        }

        return { 
          id, 
          ...ingredient, 
          pricePerUnit,
          stock: { quantity: ingredient.stockQuantity || 0 }
        };
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

    if (Capacitor.isNativePlatform()) {
      try {
        return await sqliteService.deleteIngredient(id);
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

    console.log('🔍 AndroidDatabaseService.getMaterials() called');
    console.log('🔍 Platform:', Capacitor.isNativePlatform() ? 'Native' : 'Web');

    if (Capacitor.isNativePlatform()) {
      try {
        console.log('🔍 Using SQLiteService to get materials...');
        const materials = await sqliteService.getAllMaterials();
        console.log('🔍 Retrieved materials from SQLite:', materials.length, 'items');
        
        // Transform stockQuantity to stock object for UI compatibility
        const transformedMaterials = materials.map(material => ({
          ...material,
          stock: { quantity: material.stockQuantity || 0 }
        }));
        
        console.log('✅ Materials loaded from SQLite with stock data');
        return transformedMaterials;
      } catch (error) {
        console.error("❌ Error getting materials from SQLite:", error);
        return [];
      }
    } else {
      console.log('🔍 Using localStorage fallback to get materials...');
      const materials = this.getFromWebStorage("papabear_materials");
      console.log('🔍 Retrieved materials from localStorage:', materials.length, 'items');
      console.log('✅ Materials loaded from localStorage');
      return materials;
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

    if (Capacitor.isNativePlatform()) {
      try {
        const id = await sqliteService.createMaterial(
          material.name,
          material.pricePerPiece || 0,
          material.isPackage || false,
          material.packagePrice,
          material.unitsPerPackage
        );
        
        if (id) {
          // Update stock if provided
          if (material.stockQuantity !== undefined) {
            await sqliteService.updateStock('material', id, material.stockQuantity);
          }
          
          const newMaterial = {
            id,
            name: material.name,
            isPackage: material.isPackage || false,
            packagePrice: material.packagePrice,
            unitsPerPackage: material.unitsPerPackage,
            pricePerPiece: material.pricePerPiece || 0,
            createdAt: new Date().toISOString()
          };
          
          return newMaterial;
        } else {
          // Material already exists, get the existing one
          const materials = await sqliteService.getAllMaterials();
          const existing = materials.find(m => 
            m.name.toLowerCase() === material.name.toLowerCase()
          );
          return existing || null;
        }
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

        if (material.stockQuantity !== undefined) {
          const stockResult = await this.db.query(
            "SELECT id FROM stock WHERE materialId = ?",
            [id]
          );
          if (stockResult.values && stockResult.values.length > 0) {
            await this.db.run(
              "UPDATE stock SET quantity = ? WHERE materialId = ?",
              [material.stockQuantity, id]
            );
          } else {
            await this.db.run(
              "INSERT INTO stock (id, quantity, materialId) VALUES (?, ?, ?)",
              [this.generateId(), material.stockQuantity, id]
            );
          }
        }

        return { 
          id, 
          ...material, 
          pricePerPiece,
          stock: { quantity: material.stockQuantity || 0 }
        };
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

    if (Capacitor.isNativePlatform()) {
      try {
        return await sqliteService.deleteMaterial(id);
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

    console.log('🔍 AndroidDatabaseService.getOrders() called');
    console.log('🔍 Platform:', Capacitor.isNativePlatform() ? 'Native' : 'Web');

    if (Capacitor.isNativePlatform()) {
      try {
        console.log('🔍 Using SQLiteService to get orders...');
        const orders = await sqliteService.getAllOrders();
        console.log('🔍 Retrieved orders from SQLite:', orders.length, 'items');
        
        // Apply filters if needed
        let filteredOrders = orders;
        if (filters?.filter === "today") {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          filteredOrders = orders.filter(
            (order: any) => new Date(order.createdAt) >= todayStart
          );
        }
        
        console.log('✅ Orders loaded from SQLite');
        return filteredOrders;
      } catch (error) {
        console.error("❌ Error getting orders from SQLite:", error);
        return [];
      }
    } else {
      // Fallback to localStorage
      console.log('🔍 Using localStorage fallback to get orders...');
      let orders = this.getFromWebStorage("papabear_orders");
      console.log('🔍 Retrieved orders from localStorage:', orders.length, 'items');

      if (filters?.filter === "today") {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        orders = orders.filter(
          (order: any) => new Date(order.createdAt) >= todayStart
        );
      }

      const result = orders.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      console.log('✅ Orders loaded from localStorage');
      return result;
    }
  }

  async createOrder(orderData: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    console.log('🔍 AndroidDatabaseService.createOrder() called');
    console.log('🔍 Platform:', Capacitor.isNativePlatform() ? 'Native' : 'Web');

    if (Capacitor.isNativePlatform()) {
      try {
        console.log('🔍 Using SQLiteService to create order...');
        const id = await sqliteService.createOrder(orderData);
        
        if (id) {
          const newOrder = {
            id,
            total: orderData.total,
            paid: orderData.paid,
            change: orderData.change,
            orderType: orderData.orderType,
            orderStatus: orderData.orderStatus || "QUEUING",
            items: orderData.items || [],
            createdAt: new Date().toISOString(),
          };
          console.log('✅ Order created in SQLite:', id);
          return newOrder;
        } else {
          throw new Error('Failed to create order in SQLite');
        }
      } catch (error) {
        console.error("❌ Error creating order in SQLite:", error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      console.log('🔍 Using localStorage fallback to create order...');
      const orders = this.getFromWebStorage("papabear_orders");
      const id = this.generateId();
      const now = new Date().toISOString();
      
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
      console.log('✅ Order created in localStorage:', id);
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

    if (Capacitor.isNativePlatform()) {
      try {
        return await sqliteService.deleteOrder(id);
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

  // FLAVORS - Updated to use improved SQLite service
  async getFlavors(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    console.log('🔍 AndroidDatabaseService.getFlavors() called');
    console.log('🔍 Platform:', Capacitor.isNativePlatform() ? 'Native' : 'Web');

    if (Capacitor.isNativePlatform()) {
      console.log('🔍 Using SQLiteService to get flavors...');
      try {
        const flavors = await sqliteService.getAllFlavors();
        console.log('🔍 Retrieved flavors from SQLite:', flavors.length, 'items');
        console.log('✅ Flavors loaded from SQLite');
        return flavors;
      } catch (error) {
        console.error('❌ Error getting flavors from SQLite:', error);
        return [];
      }
    } else {
      // Fallback to localStorage
      console.log('🔍 Using localStorage fallback to get flavors...');
      const flavors = this.getFromWebStorage("papabear_flavors");
      console.log('🔍 Retrieved flavors from localStorage:', flavors.length, 'items');
      console.log('✅ Flavors loaded from localStorage');
      return flavors;
    }
  }

  async createFlavor(flavor: { name: string }): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    return DebugLogger.logDatabaseOperation(
      'CREATE_FLAVOR',
      { name: flavor.name, platform: Capacitor.isNativePlatform() ? 'native' : 'web' },
      async () => {
        if (Capacitor.isNativePlatform()) {
          const id = await sqliteService.createFlavor(flavor.name);
          if (id) {
            const newFlavor = { id, name: flavor.name, createdAt: new Date().toISOString() };
            DebugLogger.log('FLAVOR_CREATED_NEW', { id, name: flavor.name });
            return newFlavor;
          } else {
            // Flavor already exists, get the existing one (same behavior as addons)
            const existingFlavors = await sqliteService.getAllFlavors();
            const existing = existingFlavors.find(f => f.name.toLowerCase() === flavor.name.toLowerCase());
            DebugLogger.log('FLAVOR_FOUND_EXISTING', { name: flavor.name, existing: !!existing });
            return existing || null;
          }
        } else {
          // Fallback to localStorage (same behavior as addons)
          const flavors = this.getFromWebStorage("papabear_flavors");
          const existing = flavors.find((f: any) => f.name.toLowerCase() === flavor.name.toLowerCase());
          
          if (existing) {
            DebugLogger.log('FLAVOR_FOUND_EXISTING_LOCALSTORAGE', { name: flavor.name });
            return existing;
          }

          const id = this.generateId();
          const now = new Date().toISOString();
          const newFlavor = { id, name: flavor.name, createdAt: now };
          
          flavors.push(newFlavor);
          this.setToWebStorage("papabear_flavors", flavors);
          
          DebugLogger.log('FLAVOR_CREATED_LOCALSTORAGE', { id, name: flavor.name });
          return newFlavor;
        }
      }
    );
  }

  async updateFlavor(id: string, flavor: { name: string }): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        console.log('🔄 AndroidDatabaseService.updateFlavor called:', { id, name: flavor.name });
        await sqliteService.updateFlavor(id, flavor.name);
        const result = { id, name: flavor.name, createdAt: new Date().toISOString() };
        console.log('✅ AndroidDatabaseService.updateFlavor returning:', result);
        return result;
      } catch (error) {
        console.error('❌ Error updating flavor:', error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      const flavors = this.getFromWebStorage("papabear_flavors");
      const index = flavors.findIndex((f: any) => f.id === id);
      if (index !== -1) {
        flavors[index] = { ...flavors[index], ...flavor };
        this.setToWebStorage("papabear_flavors", flavors);
        return flavors[index];
      }
      return null;
    }
  }

  async deleteFlavor(id: string): Promise<boolean> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        console.log('🔍 Deleting flavor from SQLite:', id);
        const success = await sqliteService.deleteFlavor(id);
        console.log('✅ Flavor deletion result:', success);
        return success; // Return the result without throwing
      } catch (error) {
        console.error('❌ Error deleting flavor:', error);
        return false; // Return false instead of throwing
      }
    } else {
      // Fallback to localStorage
      const flavors = this.getFromWebStorage("papabear_flavors");
      const filtered = flavors.filter((f: any) => f.id !== id);
      this.setToWebStorage("papabear_flavors", filtered);
      return filtered.length < flavors.length; // Match working pattern
    }
  }

  // Method to clear all flavors and seed Papa Bear flavors
  async importPapaBearFlavors(): Promise<number> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        // First, delete all existing flavors
        const existingFlavors = await sqliteService.getAllFlavors();
        for (const flavor of existingFlavors) {
          await sqliteService.deleteFlavor(flavor.id);
        }
        
        // Then seed Papa Bear flavors
        await sqliteService.seedPapaBearFlavors();
        
        // Return count of imported flavors
        const newFlavors = await sqliteService.getAllFlavors();
        return newFlavors.length;
      } catch (error) {
        console.error('Error importing Papa Bear flavors:', error);
        throw error;
      }
    } else {
      // Fallback to localStorage
      this.setToWebStorage("papabear_flavors", []);
      
      const PAPA_BEAR_FLAVORS = [
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

      const flavors = PAPA_BEAR_FLAVORS.map(name => ({
        id: this.generateId(),
        name,
        createdAt: new Date().toISOString()
      }));
      
      this.setToWebStorage("papabear_flavors", flavors);
      return flavors.length;
    }
  }

  // Cash Flow Methods - Now using persistent SQLite storage
  async getCashFlowTransactions(filters?: any): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();
    
    console.log('🔍 AndroidDatabaseService: Getting cash flow transactions:', filters);
    DebugLogger.log('GET_CASH_FLOW_TRANSACTIONS', { filters });

    try {
      if (Capacitor.isNativePlatform()) {
        console.log('🔍 Using SQLite for cash flow transactions...');
        const transactions = await sqliteService.getAllCashFlowTransactions();
        console.log('🔍 Retrieved cash flow transactions from SQLite:', transactions.length, 'items');
        
        // Ensure opening cash drawer transaction exists
        const hasOpeningTransaction = transactions.some(t => t.description === 'Opening cash drawer');
        if (!hasOpeningTransaction) {
          console.log('🔍 Creating opening cash drawer transaction...');
          await sqliteService.createCashFlowTransaction('INFLOW', 500, 'CASH_DEPOSIT', 'Opening cash drawer');
          // Re-fetch to include the opening transaction
          return await sqliteService.getAllCashFlowTransactions();
        }
        
        DebugLogger.log('GET_CASH_FLOW_TRANSACTIONS', { filters }, transactions);
        return transactions;
      } else {
        // Fallback to localStorage for web
        console.log('🔍 Using localStorage fallback for cash flow transactions...');
        const transactions = this.getFromWebStorage("papabear_cash_transactions") || [];
        
        // Initialize with default transaction if empty
        if (transactions.length === 0) {
          const openingTransaction = {
            id: '1',
            type: 'INFLOW' as const,
            amount: 500,
            category: 'CASH_DEPOSIT',
            description: 'Opening cash drawer',
            createdAt: new Date().toISOString(),
            createdBy: 'admin'
          };
          transactions.push(openingTransaction);
          this.setToWebStorage("papabear_cash_transactions", transactions);
        }

        DebugLogger.log('GET_CASH_FLOW_TRANSACTIONS', { filters }, transactions);
        return [...transactions].reverse(); // Most recent first
      }
    } catch (error) {
      console.error('❌ AndroidDatabaseService: Error getting cash flow transactions:', error);
      DebugLogger.log('GET_CASH_FLOW_TRANSACTIONS', { filters }, null, error);
      throw error;
    }
  }

  async getCashFlowSummary(period?: 'today' | 'week' | 'month'): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();
    
    console.log('🔍 AndroidDatabaseService: Getting cash flow summary for period:', period);
    DebugLogger.log('GET_CASH_FLOW_SUMMARY', { period });

    try {
      // Calculate real summary from transactions
      const transactions = await this.getCashFlowTransactions();
      const totalInflow = transactions
        .filter(t => t.type === 'INFLOW')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalOutflow = transactions
        .filter(t => t.type === 'OUTFLOW')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate balance from database if on native platform
      let currentBalance = totalInflow - totalOutflow;
      if (Capacitor.isNativePlatform()) {
        try {
          currentBalance = await sqliteService.getCashFlowBalance();
        } catch (error) {
          console.error('Error getting balance from SQLite, using calculated balance:', error);
        }
      }

      const summary = {
        period: period || 'today',
        totalInflow,
        totalOutflow,
        netFlow: totalInflow - totalOutflow,
        currentBalance,
        transactionCount: transactions.length,
        inflowByCategory: {
          'ORDER_PAYMENT': transactions.filter(t => t.type === 'INFLOW' && t.category === 'ORDER_PAYMENT').reduce((sum, t) => sum + t.amount, 0),
          'CASH_DEPOSIT': transactions.filter(t => t.type === 'INFLOW' && t.category === 'CASH_DEPOSIT').reduce((sum, t) => sum + t.amount, 0)
        },
        outflowByCategory: {
          'EXPENSE': transactions.filter(t => t.type === 'OUTFLOW' && t.category === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0),
          'STOCK_PURCHASE': transactions.filter(t => t.type === 'OUTFLOW' && t.category === 'STOCK_PURCHASE').reduce((sum, t) => sum + t.amount, 0)
        },
        recentTransactions: transactions.slice(0, 5)
      };

      DebugLogger.log('GET_CASH_FLOW_SUMMARY', { period }, summary);
      return summary;
    } catch (error) {
      console.error('❌ AndroidDatabaseService: Error getting cash flow summary:', error);
      DebugLogger.log('GET_CASH_FLOW_SUMMARY', { period }, null, error);
      throw error;
    }
  }

  async getCashDrawerBalance(): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();
    
    console.log('🔍 AndroidDatabaseService: Getting cash drawer balance');
    DebugLogger.log('GET_CASH_DRAWER_BALANCE', {});

    try {
      let currentBalance = 0;
      
      if (Capacitor.isNativePlatform()) {
        console.log('🔍 Getting balance from SQLite...');
        currentBalance = await sqliteService.getCashFlowBalance();
      } else {
        // Fallback to localStorage calculation
        const transactions = this.getFromWebStorage("papabear_cash_transactions") || [];
        const totalInflow = transactions.filter(t => t.type === 'INFLOW').reduce((sum, t) => sum + t.amount, 0);
        const totalOutflow = transactions.filter(t => t.type === 'OUTFLOW').reduce((sum, t) => sum + t.amount, 0);
        currentBalance = totalInflow - totalOutflow;
      }

      const balance = {
        currentBalance,
        lastUpdated: new Date().toISOString()
      };

      DebugLogger.log('GET_CASH_DRAWER_BALANCE', {}, balance);
      return balance;
    } catch (error) {
      console.error('❌ AndroidDatabaseService: Error getting cash drawer balance:', error);
      DebugLogger.log('GET_CASH_DRAWER_BALANCE', {}, null, error);
      throw error;
    }
  }

  async addCashDeposit(amount: number, description: string): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();
    
    console.log('🔍 AndroidDatabaseService: Adding cash deposit:', { amount, description });
    DebugLogger.log('ADD_CASH_DEPOSIT', { amount, description });

    try {
      let transactionId: string;
      
      if (Capacitor.isNativePlatform()) {
        console.log('🔍 Adding cash deposit to SQLite...');
        transactionId = await sqliteService.createCashFlowTransaction('INFLOW', amount, 'CASH_DEPOSIT', description) || Date.now().toString();
      } else {
        // Fallback to localStorage
        transactionId = Date.now().toString();
        const transactions = this.getFromWebStorage("papabear_cash_transactions") || [];
        const transaction = {
          id: transactionId,
          type: 'INFLOW' as const,
          amount,
          category: 'CASH_DEPOSIT',
          description,
          createdAt: new Date().toISOString(),
          createdBy: 'admin'
        };
        transactions.push(transaction);
        this.setToWebStorage("papabear_cash_transactions", transactions);
      }

      const newTransaction = {
        id: transactionId,
        type: 'INFLOW' as const,
        amount,
        category: 'CASH_DEPOSIT',
        description,
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      };

      DebugLogger.log('ADD_CASH_DEPOSIT', { amount, description }, newTransaction);
      return newTransaction;
    } catch (error) {
      console.error('❌ AndroidDatabaseService: Error adding cash deposit:', error);
      DebugLogger.log('ADD_CASH_DEPOSIT', { amount, description }, null, error);
      throw error;
    }
  }

  async recordExpense(amount: number, description: string, itemsPurchased?: string): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();
    
    console.log('🔍 AndroidDatabaseService: Recording expense:', { amount, description, itemsPurchased });
    DebugLogger.log('RECORD_EXPENSE', { amount, description, itemsPurchased });

    try {
      let transactionId: string;
      
      if (Capacitor.isNativePlatform()) {
        console.log('🔍 Adding expense to SQLite...');
        transactionId = await sqliteService.createCashFlowTransaction('OUTFLOW', amount, 'EXPENSE', description, itemsPurchased) || Date.now().toString();
      } else {
        // Fallback to localStorage
        transactionId = Date.now().toString();
        const transactions = this.getFromWebStorage("papabear_cash_transactions") || [];
        const transaction = {
          id: transactionId,
          type: 'OUTFLOW' as const,
          amount,
          category: 'EXPENSE',
          description,
          itemsPurchased,
          createdAt: new Date().toISOString(),
          createdBy: 'admin'
        };
        transactions.push(transaction);
        this.setToWebStorage("papabear_cash_transactions", transactions);
      }

      const newTransaction = {
        id: transactionId,
        type: 'OUTFLOW' as const,
        amount,
        category: 'EXPENSE',
        description,
        itemsPurchased,
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      };

      DebugLogger.log('RECORD_EXPENSE', { amount, description, itemsPurchased }, newTransaction);
      return newTransaction;
    } catch (error) {
      console.error('❌ AndroidDatabaseService: Error recording expense:', error);
      DebugLogger.log('RECORD_EXPENSE', { amount, description, itemsPurchased }, null, error);
      throw error;
    }
  }

  async setCashDrawerBalance(newBalance: number, reason: string): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();
    
    console.log('🔍 AndroidDatabaseService: Setting cash drawer balance:', { newBalance, reason });
    DebugLogger.log('SET_CASH_DRAWER_BALANCE', { newBalance, reason });

    try {
      // Get current balance from database or calculation
      let currentBalance = 0;
      if (Capacitor.isNativePlatform()) {
        currentBalance = await sqliteService.getCashFlowBalance();
      } else {
        const transactions = this.getFromWebStorage("papabear_cash_transactions") || [];
        const totalInflow = transactions.filter(t => t.type === 'INFLOW').reduce((sum, t) => sum + t.amount, 0);
        const totalOutflow = transactions.filter(t => t.type === 'OUTFLOW').reduce((sum, t) => sum + t.amount, 0);
        currentBalance = totalInflow - totalOutflow;
      }
      
      const difference = newBalance - currentBalance;
      
      if (difference !== 0) {
        let adjustmentId: string;
        
        if (Capacitor.isNativePlatform()) {
          console.log('🔍 Adding balance adjustment to SQLite...');
          adjustmentId = await sqliteService.createCashFlowTransaction(
            difference > 0 ? 'INFLOW' : 'OUTFLOW', 
            Math.abs(difference), 
            'CASH_ADJUSTMENT', 
            `Balance adjustment: ${reason}`
          ) || Date.now().toString();
        } else {
          // Fallback to localStorage
          adjustmentId = Date.now().toString();
          const transactions = this.getFromWebStorage("papabear_cash_transactions") || [];
          const adjustment = {
            id: adjustmentId,
            type: difference > 0 ? 'INFLOW' as const : 'OUTFLOW' as const,
            amount: Math.abs(difference),
            category: 'CASH_ADJUSTMENT',
            description: `Balance adjustment: ${reason}`,
            createdAt: new Date().toISOString(),
            createdBy: 'admin'
          };
          transactions.push(adjustment);
          this.setToWebStorage("papabear_cash_transactions", transactions);
        }

        const adjustmentTransaction = {
          id: adjustmentId,
          type: difference > 0 ? 'INFLOW' as const : 'OUTFLOW' as const,
          amount: Math.abs(difference),
          category: 'CASH_ADJUSTMENT',
          description: `Balance adjustment: ${reason}`,
          createdAt: new Date().toISOString(),
          createdBy: 'admin'
        };

        DebugLogger.log('SET_CASH_DRAWER_BALANCE', { newBalance, reason }, adjustmentTransaction);
        return adjustmentTransaction;
      }

      return null; // No change needed
    } catch (error) {
      console.error('❌ AndroidDatabaseService: Error setting cash drawer balance:', error);
      DebugLogger.log('SET_CASH_DRAWER_BALANCE', { newBalance, reason }, null, error);
      throw error;
    }
  }

  async recordCashInflow(inflowData: {
    amount: number;
    type: 'ORDER_PAYMENT' | 'CASH_DEPOSIT' | 'OTHER_INCOME' | 'SALE';
    orderId?: string;
    description: string;
    paymentMethod?: string;
  }) {
    if (!this.isInitialized) await this.initializeDatabase();

    console.log('🔄 AndroidDatabaseService: Recording cash inflow:', inflowData);

    try {
      const transaction = {
        id: this.generateId(),
        type: 'INFLOW',
        amount: inflowData.amount,
        category: inflowData.type,
        orderId: inflowData.orderId,
        description: inflowData.description,
        paymentMethod: inflowData.paymentMethod || 'CASH',
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      };

      if (Capacitor.isNativePlatform()) {
        await sqliteService.recordCashFlowTransaction(transaction);
        console.log('✅ Cash inflow recorded in SQLite');
      } else {
        // Fallback to localStorage
        const transactions = this.getFromWebStorage('papabear_cash_flow_transactions');
        transactions.push(transaction);
        this.setToWebStorage('papabear_cash_flow_transactions', transactions);
        
        // Update cash drawer balance for cash payments
        if (inflowData.paymentMethod === 'CASH' || !inflowData.paymentMethod) {
          const balanceData = this.getFromWebStorage('papabear_cash_drawer_balance');
          balanceData.currentBalance += inflowData.amount;
          this.setToWebStorage('papabear_cash_drawer_balance', balanceData);
        }
        console.log('✅ Cash inflow recorded in localStorage');
      }

      return transaction;
    } catch (error) {
      console.error('❌ AndroidDatabaseService: Error recording cash inflow:', error);
      throw error;
    }
  }

  async recordCashOutflow(outflowData: {
    amount: number;
    type: 'STOCK_PURCHASE' | 'EXPENSE' | 'WITHDRAWAL' | 'REFUND';
    description: string;
    itemsPurchased?: string;
    orderId?: string;
  }) {
    if (!this.isInitialized) await this.initializeDatabase();

    console.log('🔄 AndroidDatabaseService: Recording cash outflow:', outflowData);

    try {
      const transaction = {
        id: this.generateId(),
        type: 'OUTFLOW',
        amount: -Math.abs(outflowData.amount), // Ensure negative
        category: outflowData.type,
        orderId: outflowData.orderId,
        description: outflowData.description,
        itemsPurchased: outflowData.itemsPurchased,
        createdAt: new Date().toISOString(),
        createdBy: 'Admin'
      };

      if (Capacitor.isNativePlatform()) {
        await sqliteService.recordCashFlowTransaction(transaction);
        console.log('✅ Cash outflow recorded in SQLite');
      } else {
        // Fallback to localStorage
        const transactions = this.getFromWebStorage('papabear_cash_flow_transactions');
        transactions.push(transaction);
        this.setToWebStorage('papabear_cash_flow_transactions', transactions);
        
        // Update cash drawer balance
        const balanceData = this.getFromWebStorage('papabear_cash_drawer_balance');
        balanceData.currentBalance -= Math.abs(outflowData.amount);
        this.setToWebStorage('papabear_cash_drawer_balance', balanceData);
        console.log('✅ Cash outflow recorded in localStorage');
      }

      return transaction;
    } catch (error) {
      console.error('❌ AndroidDatabaseService: Error recording cash outflow:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const androidDatabaseService = new AndroidDatabaseService();
