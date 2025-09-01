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
}

class AndroidDatabaseService implements DatabaseService {
  private isInitialized = false;

  async initializeDatabase(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (Capacitor.isNativePlatform()) {
        await sqliteService.initialize();
        console.log("Android SQLite database initialized successfully");
      } else {
        await this.initializeWebStorage();
        console.log("Web storage fallback initialized");
      }
      this.isInitialized = true;
    } catch (error) {
      console.error("Database initialization error:", error);
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

    return DebugLogger.logDatabaseOperation(
      'CREATE_PRODUCT',
      { name: product.name, category: product.category, platform: Capacitor.isNativePlatform() ? 'native' : 'web' },
      async () => {
        if (Capacitor.isNativePlatform()) {
          const id = await sqliteService.createProduct(
            product.name, 
            product.category, 
            product.imageUrl
          );
          
          if (id) {
            const newProduct = {
              id,
              name: product.name,
              category: product.category,
              imageUrl: product.imageUrl || null,
              createdAt: new Date().toISOString(),
              variants: product.variants || []
            };
            
            DebugLogger.log('PRODUCT_CREATED_NEW', { id, name: product.name });
            return newProduct;
          } else {
            // Product already exists, get the existing one
            const products = await sqliteService.getAllProducts();
            const existing = products.find(p => 
              p.name.toLowerCase() === product.name.toLowerCase()
            );
            DebugLogger.log('PRODUCT_FOUND_EXISTING', { name: product.name, existing: !!existing });
            return existing || null;
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

  // FLAVORS - Updated to use improved SQLite service
  async getFlavors(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      return await sqliteService.getAllFlavors();
    } else {
      // Fallback to localStorage
      return this.getFromWebStorage("papabear_flavors");
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
            // Flavor already exists, get the existing one
            const existingFlavors = await sqliteService.getAllFlavors();
            const existing = existingFlavors.find(f => f.name.toLowerCase() === flavor.name.toLowerCase());
            DebugLogger.log('FLAVOR_FOUND_EXISTING', { name: flavor.name, existing: !!existing });
            return existing;
          }
        } else {
          // Fallback to localStorage
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

  // Cash flow data storage
  private cashFlowTransactions: any[] = [];
  private cashDrawerBalance: number = 5000;

  // Cash Flow Methods
  async getCashFlowTransactions(filters?: any): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();
    
    console.log('🔍 AndroidDatabaseService: Getting cash flow transactions:', filters);
    DebugLogger.log('GET_CASH_FLOW_TRANSACTIONS', { filters });

    try {
      // Initialize with default transaction if empty
      if (this.cashFlowTransactions.length === 0) {
        this.cashFlowTransactions = [
          {
            id: '1',
            type: 'INFLOW' as const,
            amount: 500,
            category: 'CASH_DEPOSIT',
            description: 'Opening cash drawer',
            createdAt: new Date().toISOString(),
            createdBy: 'admin'
          }
        ];
      }

      DebugLogger.log('GET_CASH_FLOW_TRANSACTIONS', { filters }, this.cashFlowTransactions);
      return [...this.cashFlowTransactions].reverse(); // Most recent first
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

      const summary = {
        period: period || 'today',
        totalInflow,
        totalOutflow,
        netFlow: totalInflow - totalOutflow,
        currentBalance: this.cashDrawerBalance,
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
      const balance = {
        currentBalance: this.cashDrawerBalance,
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
      const transaction = {
        id: Date.now().toString(),
        type: 'INFLOW' as const,
        amount,
        category: 'CASH_DEPOSIT',
        description,
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      };

      // Add to transactions list and update balance
      this.cashFlowTransactions.push(transaction);
      this.cashDrawerBalance += amount;

      DebugLogger.log('ADD_CASH_DEPOSIT', { amount, description }, transaction);
      return transaction;
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
      const transaction = {
        id: Date.now().toString(),
        type: 'OUTFLOW' as const,
        amount,
        category: 'EXPENSE',
        description,
        itemsPurchased,
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      };

      // Add to transactions list and update balance
      this.cashFlowTransactions.push(transaction);
      this.cashDrawerBalance -= amount;

      DebugLogger.log('RECORD_EXPENSE', { amount, description, itemsPurchased }, transaction);
      return transaction;
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
      const currentBalance = this.cashDrawerBalance;
      const difference = newBalance - currentBalance;
      
      if (difference !== 0) {
        const adjustment = {
          id: Date.now().toString(),
          type: difference > 0 ? 'INFLOW' as const : 'OUTFLOW' as const,
          amount: Math.abs(difference),
          category: 'CASH_ADJUSTMENT',
          description: `Balance adjustment: ${reason}`,
          createdAt: new Date().toISOString(),
          createdBy: 'admin'
        };

        // Add adjustment transaction and update balance
        this.cashFlowTransactions.push(adjustment);
        this.cashDrawerBalance = newBalance;

        DebugLogger.log('SET_CASH_DRAWER_BALANCE', { newBalance, reason }, adjustment);
        return adjustment;
      }

      return null; // No change needed
    } catch (error) {
      console.error('❌ AndroidDatabaseService: Error setting cash drawer balance:', error);
      DebugLogger.log('SET_CASH_DRAWER_BALANCE', { newBalance, reason }, null, error);
      throw error;
    }
  }
}

// Create singleton instance
export const androidDatabaseService = new AndroidDatabaseService();
