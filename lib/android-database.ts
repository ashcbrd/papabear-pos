// android-database.ts
// Android-compatible database service with improved Capacitor SQLite + product↔flavor join handling

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

  // Cash flow
  getCashFlowTransactions: (filters?: any) => Promise<any[]>;
  getCashFlowSummary: (period?: "today" | "week" | "month") => Promise<any>;
  getCashDrawerBalance: () => Promise<any>;
  addCashDeposit: (amount: number, description: string) => Promise<any>;
  recordExpense: (
    amount: number,
    description: string,
    itemsPurchased?: string
  ) => Promise<any>;
  setCashDrawerBalance: (newBalance: number, reason: string) => Promise<any>;
  recordCashInflow: (inflowData: {
    amount: number;
    type: "ORDER_PAYMENT" | "CASH_DEPOSIT" | "OTHER_INCOME" | "SALE";
    orderId?: string;
    description: string;
    paymentMethod?: string;
  }) => Promise<any>;
  recordCashOutflow: (outflowData: {
    amount: number;
    type: "STOCK_PURCHASE" | "EXPENSE" | "WITHDRAWAL" | "REFUND";
    description: string;
    itemsPurchased?: string;
    orderId?: string;
  }) => Promise<any>;
}

class AndroidDatabaseService implements DatabaseService {
  private isInitialized = false;
  private db: any = null;

  // single sources of truth for web storage cash flow
  private CASH_TX_KEY = "papabear_cash_flow_transactions";
  private DRAWER_KEY = "papabear_cash_drawer_balance";

  // ---------- Lifecycle ----------

  async initializeDatabase(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("🔍 AndroidDatabaseService: init...");
      if (Capacitor.isNativePlatform()) {
        await sqliteService.initialize();
        this.db = sqliteService.getDB();
        console.log("✅ SQLite ready:", !!this.db);
        await this.ensureJoinTables(); // ensure product_flavors exists
      } else {
        await this.initializeWebStorage();
        console.log("✅ Web storage fallback ready");
      }
      this.isInitialized = true;
      console.log("✅ AndroidDatabaseService initialized");
    } catch (error) {
      console.error("❌ Database initialization error:", error);
      throw error;
    }
  }

  // Clean duplicates helper passthrough
  async cleanupDuplicates(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await sqliteService.cleanupDuplicates();
    }
  }

  private async ensureJoinTables() {
    if (!Capacitor.isNativePlatform() || !this.db) return;
    // Create join table for product↔flavor mapping (if not present)
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS product_flavors (
        productId TEXT NOT NULL,
        flavorId  TEXT NOT NULL,
        PRIMARY KEY (productId, flavorId)
      );
    `);
  }

  // ---------- Web fallback storage ----------

  private async initializeWebStorage(): Promise<void> {
    if (typeof window === "undefined" || !window.localStorage) return;

    const arrayKeys = [
      "papabear_products",
      "papabear_variants",
      "papabear_addons",
      "papabear_ingredients",
      "papabear_materials",
      "papabear_orders",
      "papabear_stock",
      "papabear_flavors",
      "papabear_product_flavors",
      this.CASH_TX_KEY, // unified cash tx list
    ];
    for (const k of arrayKeys) {
      if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify([]));
    }

    if (!localStorage.getItem(this.DRAWER_KEY)) {
      localStorage.setItem(
        this.DRAWER_KEY,
        JSON.stringify({
          currentBalance: 0,
          lastUpdated: new Date().toISOString(),
        })
      );
    }
  }

  private getFromWebStorage<T = any>(key: string): T {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return JSON.parse(localStorage.getItem(key) || "[]");
      }
      return [] as unknown as T;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return [] as unknown as T;
    }
  }

  private setToWebStorage(key: string, data: any): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (error) {
      console.error(`Error writing ${key}:`, error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  // ---------- Category mapping ----------

  private mapCategoryToDatabase(adminCategory: string): string {
    const m: Record<string, string> = {
      Meals: "InsideMeals",
      ColdBeverages: "InsideBeverages",
      HotBeverages: "InsideBeverages",
    };
    return m[adminCategory] ?? "InsideMeals";
  }

  private mapCategoryFromDatabase(dbCategory: string): string {
    const m: Record<string, string> = {
      InsideMeals: "Meals",
      InsideBeverages: "ColdBeverages", // default to cold
      OutsideSnacks: "Meals",
    };
    return m[dbCategory] ?? "Meals";
  }

  // =========================================================
  // PRODUCTS (with flavors)
  // =========================================================

  async getProducts(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        await sqliteService.initialize();
        const db = sqliteService.getDB();

        // Base products
        const productsRes = await db.query(
          "SELECT * FROM products ORDER BY createdAt DESC"
        );
        const products = productsRes.values || [];

        const result: any[] = [];
        for (const p of products) {
          // Sizes (variants)
          const variantsRes = await db.query(
            "SELECT * FROM variants WHERE productId = ? ORDER BY createdAt",
            [p.id]
          );
          const sizes = (variantsRes.values || []).map((v: any) => ({
            id: v.id,
            name: v.name,
            price: v.price,
            materials: [],
            ingredients: [],
          }));

          // Flavors (JOIN)
          const flavorRows = await db.query(
            `
            SELECT f.id, f.name
            FROM flavors f
            INNER JOIN product_flavors pf ON pf.flavorId = f.id
            WHERE pf.productId = ?
            ORDER BY f.name
          `,
            [p.id]
          );

          result.push({
            id: p.id,
            name: p.name,
            category: this.mapCategoryFromDatabase(p.category),
            imageUrl: p.imageUrl,
            createdAt: p.createdAt,
            flavors: flavorRows.values || [],
            sizes,
          });
        }

        return result;
      } catch (error) {
        console.error("❌ getProducts (native):", error);
        return [];
      }
    } else {
      // Web fallback
      const products = this.getFromWebStorage<any[]>("papabear_products");
      const variants = this.getFromWebStorage<any[]>("papabear_variants");
      const flavors = this.getFromWebStorage<any[]>("papabear_flavors");
      const map = this.getFromWebStorage<any[]>("papabear_product_flavors");

      return (products || []).map((p) => {
        const sizes =
          (variants || [])
            .filter((v: any) => v.productId === p.id)
            .map((v: any) => ({
              id: v.id,
              name: v.name,
              price: v.price,
              materials: [],
              ingredients: [],
            })) || [];

        const fl =
          (map || [])
            .filter((m: any) => m.productId === p.id)
            .map((m: any) =>
              (flavors || []).find((f: any) => f.id === m.flavorId)
            )
            .filter(Boolean) || [];

        return {
          id: p.id,
          name: p.name,
          category: this.mapCategoryFromDatabase(p.category),
          imageUrl: p.imageUrl,
          createdAt: p.createdAt,
          flavors: fl,
          sizes,
        };
      });
    }
  }

  async createProduct(product: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    return DebugLogger.logDatabaseOperation(
      "CREATE_PRODUCT",
      {
        name: product.name,
        category: product.category,
        platform: Capacitor.isNativePlatform() ? "native" : "web",
      },
      async () => {
        if (Capacitor.isNativePlatform()) {
          try {
            await sqliteService.initialize();
            const db = sqliteService.getDB();

            const id = this.generateId();
            const now = new Date().toISOString();
            const dbCategory = this.mapCategoryToDatabase(product.category);

            await db.run(
              "INSERT INTO products (id, name, category, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?)",
              [id, product.name, dbCategory, product.imageUrl || null, now]
            );

            // Sizes (variants)
            if (product.sizes?.length) {
              for (const s of product.sizes) {
                const varId = this.generateId();
                await db.run(
                  "INSERT INTO variants (id, name, price, productId, createdAt) VALUES (?, ?, ?, ?, ?)",
                  [varId, s.name, s.price, id, now]
                );
              }
            }

            // Flavors (resolve by name → id, connect in join table)
            if (product.flavors?.length) {
              for (const f of product.flavors) {
                let flavorId: string | undefined;
                const found = await db.query(
                  "SELECT id FROM flavors WHERE LOWER(name) = LOWER(?)",
                  [f.name]
                );
                if (found.values?.length) {
                  flavorId = found.values[0].id;
                } else {
                  flavorId = await sqliteService.createFlavor(f.name);
                }
                if (flavorId) {
                  await db.run(
                    "INSERT OR IGNORE INTO product_flavors (productId, flavorId) VALUES (?, ?)",
                    [id, flavorId]
                  );
                }
              }
            }

            return {
              id,
              name: product.name,
              category: product.category,
              imageUrl: product.imageUrl || null,
              createdAt: now,
              flavors: product.flavors || [],
              sizes: product.sizes || [],
            };
          } catch (error) {
            console.error("❌ createProduct (native):", error);
            throw error;
          }
        } else {
          // Web fallback
          const products = this.getFromWebStorage<any[]>("papabear_products");
          const variants = this.getFromWebStorage<any[]>("papabear_variants");
          const allFlavors = this.getFromWebStorage<any[]>("papabear_flavors");
          const map = this.getFromWebStorage<any[]>("papabear_product_flavors");

          // Prevent duplicate by name
          const exists = products.find(
            (p) => p.name.toLowerCase() === product.name.toLowerCase()
          );
          if (exists) return exists;

          const id = this.generateId();
          const now = new Date().toISOString();
          const newProduct = {
            id,
            name: product.name,
            category: this.mapCategoryToDatabase(product.category), // keep db shape
            imageUrl: product.imageUrl || null,
            createdAt: now,
          };

          products.push(newProduct);
          this.setToWebStorage("papabear_products", products);

          // sizes
          if (product.sizes?.length) {
            const newVariants = product.sizes.map((s: any) => ({
              id: this.generateId(),
              name: s.name,
              price: s.price,
              productId: id,
              createdAt: now,
            }));
            variants.push(...newVariants);
            this.setToWebStorage("papabear_variants", variants);
          }

          // flavors mapping
          if (product.flavors?.length) {
            for (const f of product.flavors) {
              const match = allFlavors.find(
                (x: any) => x.name.toLowerCase() === f.name.toLowerCase()
              );
              if (match) {
                map.push({ productId: id, flavorId: match.id });
              }
            }
            this.setToWebStorage("papabear_product_flavors", map);
          }

          return {
            ...newProduct,
            category: product.category, // admin-facing
            flavors: product.flavors || [],
            sizes: product.sizes || [],
          };
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

        const dbCategory = this.mapCategoryToDatabase(product.category);
        await db.run(
          "UPDATE products SET name = ?, category = ?, imageUrl = ? WHERE id = ?",
          [product.name, dbCategory, product.imageUrl || null, id]
        );

        // Rebuild sizes
        await db.run("DELETE FROM variants WHERE productId = ?", [id]);
        if (product.sizes?.length) {
          for (const s of product.sizes) {
            await db.run(
              "INSERT INTO variants (id, name, price, productId, createdAt) VALUES (?, ?, ?, ?, ?)",
              [this.generateId(), s.name, s.price, id, new Date().toISOString()]
            );
          }
        }

        // Rebuild flavor connections
        await db.run("DELETE FROM product_flavors WHERE productId = ?", [id]);
        if (product.flavors?.length) {
          for (const f of product.flavors) {
            let flavorId: string | undefined;
            const found = await db.query(
              "SELECT id FROM flavors WHERE LOWER(name) = LOWER(?)",
              [f.name]
            );
            if (found.values?.length) {
              flavorId = found.values[0].id;
            } else {
              flavorId = await sqliteService.createFlavor(f.name);
            }
            if (flavorId) {
              await db.run(
                "INSERT OR IGNORE INTO product_flavors (productId, flavorId) VALUES (?, ?)",
                [id, flavorId]
              );
            }
          }
        }

        return {
          id,
          name: product.name,
          category: product.category,
          imageUrl: product.imageUrl || null,
          flavors: product.flavors || [],
          sizes: product.sizes || [],
        };
      } catch (error) {
        console.error("❌ updateProduct (native):", error);
        throw error;
      }
    } else {
      // Web fallback
      const products = this.getFromWebStorage<any[]>("papabear_products");
      const variants = this.getFromWebStorage<any[]>("papabear_variants");
      let map = this.getFromWebStorage<any[]>("papabear_product_flavors");
      const allFlavors = this.getFromWebStorage<any[]>("papabear_flavors");

      const i = products.findIndex((p: any) => p.id === id);
      if (i === -1) return null;

      products[i] = {
        ...products[i],
        name: product.name,
        category: this.mapCategoryToDatabase(product.category),
        imageUrl: product.imageUrl || null,
      };
      this.setToWebStorage("papabear_products", products);

      // rebuild sizes
      const without = variants.filter((v: any) => v.productId !== id);
      const newVs =
        product.sizes?.map((s: any) => ({
          id: this.generateId(),
          name: s.name,
          price: s.price,
          productId: id,
          createdAt: new Date().toISOString(),
        })) || [];
      this.setToWebStorage("papabear_variants", [...without, ...newVs]);

      // rebuild flavor map
      map = (map || []).filter((m: any) => m.productId !== id);
      for (const f of product.flavors || []) {
        const match = allFlavors.find(
          (x: any) => x.name.toLowerCase() === f.name.toLowerCase()
        );
        if (match) map.push({ productId: id, flavorId: match.id });
      }
      this.setToWebStorage("papabear_product_flavors", map);

      return {
        id,
        name: product.name,
        category: product.category,
        imageUrl: product.imageUrl || null,
        flavors: product.flavors || [],
        sizes: product.sizes || [],
      };
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        await sqliteService.initialize();
        const db = sqliteService.getDB();
        await db.run("DELETE FROM variants WHERE productId = ?", [id]);
        await db.run("DELETE FROM product_flavors WHERE productId = ?", [id]);
        const res = await db.run("DELETE FROM products WHERE id = ?", [id]);
        return (res.changes || 0) > 0;
      } catch (error) {
        console.error("❌ deleteProduct (native):", error);
        return false;
      }
    } else {
      const products = this.getFromWebStorage<any[]>("papabear_products");
      const variants = this.getFromWebStorage<any[]>("papabear_variants");
      const map = this.getFromWebStorage<any[]>("papabear_product_flavors");

      this.setToWebStorage(
        "papabear_products",
        products.filter((p: any) => p.id !== id)
      );
      this.setToWebStorage(
        "papabear_variants",
        variants.filter((v: any) => v.productId !== id)
      );
      this.setToWebStorage(
        "papabear_product_flavors",
        map.filter((m: any) => m.productId !== id)
      );

      return (
        products.length > this.getFromWebStorage("papabear_products").length
      );
    }
  }

  // =========================================================
  // ADDONS
  // =========================================================

  async getAddons(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        const addons = await sqliteService.getAllAddons();
        return addons.map((a: any) => ({
          ...a,
          stock: { quantity: a.stockQuantity || 0 },
        }));
      } catch (e) {
        console.error("❌ getAddons:", e);
        return [];
      }
    } else {
      const addons = this.getFromWebStorage<any[]>("papabear_addons");
      return addons;
    }
  }

  async createAddon(addon: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        const id = await sqliteService.createAddon(addon.name, addon.price);
        if (id) {
          console.log("🔍 Creating addon stock:", { 
            id, 
            stockQuantity: addon.stockQuantity,
            hasStock: addon.stockQuantity !== undefined
          });
          
          if (addon.stockQuantity !== undefined && addon.stockQuantity !== null) {
            try {
              // Use direct database approach like materials/ingredients
              const stockQuantity = Number(addon.stockQuantity);
              await this.db.run(
                "INSERT INTO stock (id, quantity, addonId, updatedAt) VALUES (?, ?, ?, datetime('now'))",
                [this.generateId(), stockQuantity, id]
              );
              console.log("💾 Addon stock creation result: success");
            } catch (stockError) {
              console.error("⚠️ Addon stock creation failed, but addon was created:", stockError);
              // Don't throw - addon creation succeeded
            }
          }
          
          // Fetch the complete item with stock information
          try {
            const all = await sqliteService.getAllAddons();
            const createdItem = all.find(
              (x: any) => x.id === id
            );
            
            if (createdItem) {
              return {
                ...createdItem,
                stock: { quantity: createdItem.stockQuantity || 0 },
              };
            }
          } catch (refetchError) {
            console.error("⚠️ Addon refetch failed, returning basic data:", refetchError);
            // Return basic data if refetch fails
            return {
              id,
              name: addon.name,
              price: addon.price,
              createdAt: new Date().toISOString(),
              stock: { quantity: Number(addon.stockQuantity) || 0 },
            };
          }
          
          // Fallback return (shouldn't happen)
          return {
            id,
            name: addon.name,
            price: addon.price,
            createdAt: new Date().toISOString(),
            stock: { quantity: addon.stockQuantity || 0 },
          };
        }
        const all = await sqliteService.getAllAddons();
        return (
          all.find(
            (a: any) => a.name.toLowerCase() === addon.name.toLowerCase()
          ) || null
        );
      } catch (e) {
        console.error("❌ createAddon:", e);
        throw e;
      }
    } else {
      const id = this.generateId();
      const now = new Date().toISOString();
      const addons = this.getFromWebStorage<any[]>("papabear_addons");
      addons.push({ id, ...addon, createdAt: now });
      this.setToWebStorage("papabear_addons", addons);
      return { id, ...addon, createdAt: now };
    }
  }

  async updateAddon(id: string, addon: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      await this.db.run("UPDATE addons SET name = ?, price = ? WHERE id = ?", [
        addon.name,
        addon.price,
        id,
      ]);

      if (addon.stockQuantity !== undefined) {
        const s = await this.db.query(
          "SELECT id FROM stock WHERE addonId = ?",
          [id]
        );
        if (s.values?.length) {
          await this.db.run("UPDATE stock SET quantity = ? WHERE addonId = ?", [
            addon.stockQuantity,
            id,
          ]);
        } else {
          await this.db.run(
            "INSERT INTO stock (id, quantity, addonId) VALUES (?, ?, ?)",
            [this.generateId(), addon.stockQuantity, id]
          );
        }
      }

      return { id, ...addon, stock: { quantity: addon.stockQuantity || 0 } };
    } else {
      const addons = this.getFromWebStorage<any[]>("papabear_addons");
      const i = addons.findIndex((a: any) => a.id === id);
      if (i !== -1) {
        addons[i] = { ...addons[i], ...addon };
        this.setToWebStorage("papabear_addons", addons);
        return addons[i];
      }
      return null;
    }
  }

  async deleteAddon(id: string): Promise<boolean> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        return await sqliteService.deleteAddon(id);
      } catch (e) {
        console.error("❌ deleteAddon:", e);
        return false;
      }
    } else {
      const addons = this.getFromWebStorage<any[]>("papabear_addons");
      const filtered = addons.filter((a: any) => a.id !== id);
      this.setToWebStorage("papabear_addons", filtered);
      return filtered.length < addons.length;
    }
  }

  // =========================================================
  // INGREDIENTS
  // =========================================================

  async getIngredients(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        const ingredients = await sqliteService.getAllIngredients();
        return ingredients.map((i: any) => ({
          ...i,
          stock: { quantity: i.stockQuantity || 0 },
        }));
      } catch (e) {
        console.error("❌ getIngredients:", e);
        return [];
      }
    } else {
      return this.getFromWebStorage<any[]>("papabear_ingredients");
    }
  }

  async createIngredient(ingredient: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        if (!this.db) {
          throw new Error("Database not initialized in createIngredient!");
        }
        
        // Use same direct approach as updateIngredient (which works)
        const id = this.generateId();
        const now = new Date().toISOString();
        const safeUnit = ingredient.measurementUnit || "kg";
        const pricePerUnit = ingredient.pricePerPurchase / (ingredient.unitsPerPurchase || 1);
        
        
        // Direct database insert - same pattern as update function
        await this.db.run(
          "INSERT INTO ingredients (id, name, measurementUnit, pricePerPurchase, unitsPerPurchase, pricePerUnit, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [id, ingredient.name, safeUnit, ingredient.pricePerPurchase, ingredient.unitsPerPurchase, pricePerUnit, now]
        );
        
        
        if (id) {
          
          if (ingredient.stockQuantity !== undefined && ingredient.stockQuantity !== null) {
            try {
              // Use same proven logic as updateIngredient method
              const stockQuantity = Number(ingredient.stockQuantity);
              await this.db.run(
                "INSERT INTO stock (id, quantity, ingredientId, updatedAt) VALUES (?, ?, ?, datetime('now'))",
                [this.generateId(), stockQuantity, id]
              );
              console.log("💾 Ingredient stock creation result: success");
            } catch (stockError) {
              console.error("⚠️ Stock creation failed, but ingredient was created:", stockError);
              // Don't throw - ingredient creation succeeded
            }
          }
          
          // Refetch the created ingredient with proper stock data from database
          try {
            const ingredients = await sqliteService.getAllIngredients();
            const createdIngredient = ingredients.find((i: any) => i.id === id);
            
            if (createdIngredient) {
              return {
                ...createdIngredient,
                stock: { quantity: createdIngredient.stockQuantity || 0 },
              };
            }
          } catch (refetchError) {
            console.error("⚠️ Refetch failed, returning basic ingredient data:", refetchError);
            // Return basic data if refetch fails
            return {
              id,
              name: ingredient.name,
              measurementUnit: safeUnit,
              pricePerPurchase: ingredient.pricePerPurchase,
              unitsPerPurchase: ingredient.unitsPerPurchase,
              pricePerUnit,
              createdAt: now,
              stock: { quantity: Number(ingredient.stockQuantity) || 0 },
            };
          }
        }
        
        // Fallback - shouldn't happen
        return null;
      } catch (e) {
        console.error("❌ createIngredient:", e);
        throw e;
      }
    } else {
      const id = this.generateId();
      const now = new Date().toISOString();
      const pricePerUnit =
        ingredient.pricePerUnit ||
        ingredient.pricePerPurchase / (ingredient.unitsPerPurchase || 1);
      const ingredients = this.getFromWebStorage<any[]>("papabear_ingredients");
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
      const updateUnit = ingredient.measurementUnit || ingredient.unit;
      
      await this.db.run(
        "UPDATE ingredients SET name = ?, measurementUnit = ?, pricePerPurchase = ?, unitsPerPurchase = ?, pricePerUnit = ? WHERE id = ?",
        [
          ingredient.name,
          updateUnit,
          ingredient.pricePerPurchase,
          ingredient.unitsPerPurchase,
          pricePerUnit,
          id,
        ]
      );

      if (ingredient.stockQuantity !== undefined) {
        const s = await this.db.query(
          "SELECT id FROM stock WHERE ingredientId = ?",
          [id]
        );
        if (s.values?.length) {
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
        stock: { quantity: ingredient.stockQuantity || 0 },
      };
    } else {
      const ingredients = this.getFromWebStorage<any[]>("papabear_ingredients");
      const idx = ingredients.findIndex((x: any) => x.id === id);
      if (idx !== -1) {
        ingredients[idx] = { ...ingredients[idx], ...ingredient, pricePerUnit };
        this.setToWebStorage("papabear_ingredients", ingredients);
        return ingredients[idx];
      }
      return null;
    }
  }

  async deleteIngredient(id: string): Promise<boolean> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        return await sqliteService.deleteIngredient(id);
      } catch (e) {
        console.error("❌ deleteIngredient:", e);
        return false;
      }
    } else {
      const ingredients = this.getFromWebStorage<any[]>("papabear_ingredients");
      const filtered = ingredients.filter((i: any) => i.id !== id);
      this.setToWebStorage("papabear_ingredients", filtered);
      return filtered.length < ingredients.length;
    }
  }

  // =========================================================
  // MATERIALS
  // =========================================================

  async getMaterials(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        const materials = await sqliteService.getAllMaterials();
        return materials.map((m: any) => ({
          ...m,
          stock: { quantity: m.stockQuantity || 0 },
        }));
      } catch (e) {
        console.error("❌ getMaterials:", e);
        return [];
      }
    } else {
      return this.getFromWebStorage<any[]>("papabear_materials");
    }
  }

  async createMaterial(material: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

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
          console.log("🔍 Creating material stock:", { 
            id, 
            stockQuantity: material.stockQuantity,
            hasStock: material.stockQuantity !== undefined
          });
          
          if (material.stockQuantity !== undefined && material.stockQuantity !== null) {
            try {
              // Use same proven logic as updateMaterial method
              const stockQuantity = Number(material.stockQuantity);
              await this.db.run(
                "INSERT INTO stock (id, quantity, materialId, updatedAt) VALUES (?, ?, ?, datetime('now'))",
                [this.generateId(), stockQuantity, id]
              );
              console.log("💾 Material stock creation result: success");
            } catch (stockError) {
              console.error("⚠️ Material stock creation failed, but material was created:", stockError);
              // Don't throw - material creation succeeded
            }
          }
          
          // Fetch the complete item with stock information
          try {
            const all = await sqliteService.getAllMaterials();
            const createdItem = all.find(
              (x: any) => x.id === id
            );
            
            if (createdItem) {
              return {
                ...createdItem,
                stock: { quantity: createdItem.stockQuantity || 0 },
              };
            }
          } catch (refetchError) {
            console.error("⚠️ Material refetch failed, returning basic data:", refetchError);
            // Return basic data if refetch fails
            return {
              id,
              name: material.name,
              pricePerPiece: material.pricePerPiece,
              isPackage: material.isPackage || false,
              packagePrice: material.packagePrice,
              unitsPerPackage: material.unitsPerPackage,
              createdAt: new Date().toISOString(),
              stock: { quantity: Number(material.stockQuantity) || 0 },
            };
          }
          
          // Fallback return (shouldn't happen)
          return {
            id,
            name: material.name,
            isPackage: material.isPackage || false,
            packagePrice: material.packagePrice,
            unitsPerPackage: material.unitsPerPackage,
            pricePerPiece: material.pricePerPiece || 0,
            createdAt: new Date().toISOString(),
            stock: { quantity: material.stockQuantity || 0 },
          };
        }
        const all = await sqliteService.getAllMaterials();
        return (
          all.find(
            (x: any) => x.name.toLowerCase() === material.name.toLowerCase()
          ) || null
        );
      } catch (e) {
        console.error("❌ createMaterial:", e);
        throw e;
      }
    } else {
      const id = this.generateId();
      const now = new Date().toISOString();
      const pricePerPiece =
        material.isPackage && material.packagePrice && material.unitsPerPackage
          ? material.packagePrice / material.unitsPerPackage
          : material.pricePerPiece || 0;
      const materials = this.getFromWebStorage<any[]>("papabear_materials");
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
        const s = await this.db.query(
          "SELECT id FROM stock WHERE materialId = ?",
          [id]
        );
        if (s.values?.length) {
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
        stock: { quantity: material.stockQuantity || 0 },
      };
    } else {
      const materials = this.getFromWebStorage<any[]>("papabear_materials");
      const i = materials.findIndex((m: any) => m.id === id);
      if (i !== -1) {
        materials[i] = { ...materials[i], ...material, pricePerPiece };
        this.setToWebStorage("papabear_materials", materials);
        return materials[i];
      }
      return null;
    }
  }

  async deleteMaterial(id: string): Promise<boolean> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        return await sqliteService.deleteMaterial(id);
      } catch (e) {
        console.error("❌ deleteMaterial:", e);
        return false;
      }
    } else {
      const materials = this.getFromWebStorage<any[]>("papabear_materials");
      const filtered = materials.filter((m: any) => m.id !== id);
      this.setToWebStorage("papabear_materials", filtered);
      return filtered.length < materials.length;
    }
  }

  // =========================================================
  // ORDERS
  // =========================================================

  async getOrders(filters?: any): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        const orders = await sqliteService.getAllOrders();
        if (filters?.filter === "today") {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          return orders.filter((o: any) => new Date(o.createdAt) >= start);
        }
        return orders;
      } catch (e) {
        console.error("❌ getOrders:", e);
        return [];
      }
    } else {
      let orders = this.getFromWebStorage<any[]>("papabear_orders");
      if (filters?.filter === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        orders = orders.filter((o: any) => new Date(o.createdAt) >= start);
      }
      return orders.sort(
        (a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt)
      );
    }
  }

  async createOrder(orderData: any): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      const id = await sqliteService.createOrder(orderData);
      if (!id) throw new Error("Failed to create order");
      return {
        id,
        total: orderData.total,
        paid: orderData.paid,
        change: orderData.change,
        orderType: orderData.orderType,
        orderStatus: orderData.orderStatus || "QUEUING",
        items: orderData.items || [],
        createdAt: new Date().toISOString(),
      };
    } else {
      const id = this.generateId();
      const now = new Date().toISOString();
      const orders = this.getFromWebStorage<any[]>("papabear_orders");
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
      const set = Object.keys(updates)
        .map((k) => `${k} = ?`)
        .join(", ");
      await this.db.run(`UPDATE orders SET ${set} WHERE id = ?`, [
        ...Object.values(updates),
        id,
      ]);
      return { id, ...updates };
    } else {
      const orders = this.getFromWebStorage<any[]>("papabear_orders");
      const i = orders.findIndex((o: any) => o.id === id);
      if (i !== -1) {
        orders[i] = { ...orders[i], ...updates };
        this.setToWebStorage("papabear_orders", orders);
        return orders[i];
      }
      return null;
    }
  }

  async deleteOrder(id: string): Promise<boolean> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        return await sqliteService.deleteOrder(id);
      } catch {
        return false;
      }
    } else {
      const orders = this.getFromWebStorage<any[]>("papabear_orders");
      const filtered = orders.filter((o: any) => o.id !== id);
      this.setToWebStorage("papabear_orders", filtered);
      return filtered.length < orders.length;
    }
  }

  // =========================================================
  // STOCK
  // =========================================================

  async getStock(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      try {
        const res = await this.db.query("SELECT * FROM stock");
        return res.values || [];
      } catch (e) {
        console.error("❌ getStock:", e);
        return [];
      }
    } else {
      return this.getFromWebStorage<any[]>("papabear_stock");
    }
  }

  async updateStock(id: string, quantity: number): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform() && this.db) {
      await this.db.run("UPDATE stock SET quantity = ? WHERE id = ?", [
        quantity,
        id,
      ]);
      return { id, quantity };
    } else {
      const stock = this.getFromWebStorage<any[]>("papabear_stock");
      const i = stock.findIndex((s: any) => s.id === id);
      if (i !== -1) {
        stock[i].quantity = quantity;
        this.setToWebStorage("papabear_stock", stock);
        return stock[i];
      }
      return null;
    }
  }

  // =========================================================
  // DASHBOARD (simplified)
  // =========================================================

  async getDashboardStats(): Promise<any> {
    if (Capacitor.isNativePlatform() && this.db) {
      try {
        const totalRes = await this.db.query(
          "SELECT COUNT(*) as totalOrders, SUM(total) as totalRevenue FROM orders"
        );
        const monthRes = await this.db.query(
          `SELECT COUNT(*) as monthlyOrders, SUM(total) as monthlyRevenue 
           FROM orders 
           WHERE strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now')`
        );
        const stats = totalRes.values?.[0] || {};
        const monthly = monthRes.values?.[0] || {};
        return {
          stats: {
            all_time_earning: stats.totalRevenue || 0,
            all_time_products_sold: stats.totalOrders || 0,
            this_month_sales: monthly.monthlyRevenue || 0,
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
      } catch (e) {
        console.error("❌ getDashboardStats:", e);
      }
    }
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

  // =========================================================
  // FLAVORS
  // =========================================================

  async getFlavors(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        return await sqliteService.getAllFlavors();
      } catch (e) {
        console.error("❌ getFlavors:", e);
        return [];
      }
    } else {
      return this.getFromWebStorage<any[]>("papabear_flavors");
    }
  }

  async createFlavor(flavor: { name: string }): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    return DebugLogger.logDatabaseOperation(
      "CREATE_FLAVOR",
      {
        name: flavor.name,
        platform: Capacitor.isNativePlatform() ? "native" : "web",
      },
      async () => {
        if (Capacitor.isNativePlatform()) {
          const id = await sqliteService.createFlavor(flavor.name);
          if (id) {
            return {
              id,
              name: flavor.name,
              createdAt: new Date().toISOString(),
            };
          }
          const all = await sqliteService.getAllFlavors();
          return (
            all.find(
              (f: any) => f.name.toLowerCase() === flavor.name.toLowerCase()
            ) || null
          );
        } else {
          const flavors = this.getFromWebStorage<any[]>("papabear_flavors");
          const existing = flavors.find(
            (f) => f.name.toLowerCase() === flavor.name.toLowerCase()
          );
          if (existing) return existing;
          const id = this.generateId();
          const now = new Date().toISOString();
          flavors.push({ id, name: flavor.name, createdAt: now });
          this.setToWebStorage("papabear_flavors", flavors);
          return { id, name: flavor.name, createdAt: now };
        }
      }
    );
  }

  async updateFlavor(id: string, flavor: { name: string }): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      await sqliteService.updateFlavor(id, flavor.name);
      return { id, name: flavor.name, createdAt: new Date().toISOString() };
    } else {
      const flavors = this.getFromWebStorage<any[]>("papabear_flavors");
      const i = flavors.findIndex((f: any) => f.id === id);
      if (i !== -1) {
        flavors[i] = { ...flavors[i], name: flavor.name };
        this.setToWebStorage("papabear_flavors", flavors);
        return flavors[i];
      }
      return null;
    }
  }

  async deleteFlavor(id: string): Promise<boolean> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        return await sqliteService.deleteFlavor(id);
      } catch {
        return false;
      }
    } else {
      const flavors = this.getFromWebStorage<any[]>("papabear_flavors");
      const filtered = flavors.filter((f: any) => f.id !== id);
      this.setToWebStorage("papabear_flavors", filtered);

      // also remove from product_flavors map
      const map = this.getFromWebStorage<any[]>(
        "papabear_product_flavors"
      ).filter((m: any) => m.flavorId !== id);
      this.setToWebStorage("papabear_product_flavors", map);

      return filtered.length < flavors.length;
    }
  }

  async importPapaBearFlavors(): Promise<number> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      try {
        const existing = await sqliteService.getAllFlavors();
        for (const f of existing) await sqliteService.deleteFlavor(f.id);
        await sqliteService.seedPapaBearFlavors();
        const now = await sqliteService.getAllFlavors();
        return now.length;
      } catch (e) {
        console.error("❌ importPapaBearFlavors:", e);
        throw e;
      }
    } else {
      this.setToWebStorage("papabear_flavors", []);
      const NAMES = [
        "Americano",
        "Cinnamon",
        "Salted Caramel",
        "Creamy Vanilla",
        "Mocha",
        "Honeycomb Latte",
        "Tiramisu",
        "Caramel Macchiato",
        "Spanish Latte",
        "Matcha Latte",
        "Matcha Caramel",
        "Mango Matcha Latte",
        "Strawberry Matcha Latte",
        "Blueberry Matcha Latte",
        "Coffee Float",
        "Strawberry Float",
        "Blueberry Float",
        "Sprite Float",
        "Coke Float",
        "Matcha Float",
        "Kiwi Will Rock You",
        "Blueberry Licious",
        "Tipsy Strawberry",
        "Edi Wow Grape",
        "Mango Tango",
        "Honey Orange Ginger",
        "Okinawa",
        "Taro",
        "Wintermelon",
        "Red Velvet",
        "Cookies and Cream",
        "Chocolate",
        "Mango Cheesecake",
        "Matcha",
        "Minty Matcha",
        "Choco Mint",
        "Blueberry Graham",
        "Mango Graham",
        "Avocado Graham",
        "Cookies and Cream Graham",
        "Dark Chocolate S'mores",
        "Matcha S'mores",
        "Red Velvet S'mores",
        "Caramel Macchiato S'mores",
        "Cookies and Cream S'mores",
        "Lemonade",
        "Tropical Berry Lemon",
        "Kiwi Lemonade",
        "Honey Lemon",
        "Hot Choco",
      ];
      const flavors = NAMES.map((name) => ({
        id: this.generateId(),
        name,
        createdAt: new Date().toISOString(),
      }));
      this.setToWebStorage("papabear_flavors", flavors);
      return flavors.length;
    }
  }

  // =========================================================
  // CASH FLOW (unified keys, outflows positive)
  // =========================================================

  async getCashFlowTransactions(): Promise<any[]> {
    if (!this.isInitialized) await this.initializeDatabase();

    try {
      if (Capacitor.isNativePlatform()) {
        const tx = await sqliteService.getAllCashFlowTransactions();
        // Ensure opening balance exists
        if (!tx.some((t: any) => t.description === "Opening cash drawer")) {
          await sqliteService.createCashFlowTransaction(
            "INFLOW",
            500,
            "CASH_DEPOSIT",
            "Opening cash drawer"
          );
          return await sqliteService.getAllCashFlowTransactions();
        }
        return tx.sort(
          (a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt)
        );
      } else {
        let tx = this.getFromWebStorage<any[]>(this.CASH_TX_KEY);
        // seed opening cash once
        if (!tx.some((t) => t.description === "Opening cash drawer")) {
          tx.push({
            id: this.generateId(),
            type: "INFLOW",
            amount: 500,
            category: "CASH_DEPOSIT",
            description: "Opening cash drawer",
            createdAt: new Date().toISOString(),
            createdBy: "admin",
          });

          const drawer = this.getFromWebStorage<any>(this.DRAWER_KEY) || {
            currentBalance: 0,
            lastUpdated: new Date().toISOString(),
          };
          drawer.currentBalance = Number(drawer.currentBalance || 0) + 500;
          drawer.lastUpdated = new Date().toISOString();

          this.setToWebStorage(this.DRAWER_KEY, drawer);
          this.setToWebStorage(this.CASH_TX_KEY, tx);
        }
        return [...tx].sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
        );
      }
    } catch (e) {
      console.error("❌ getCashFlowTransactions:", e);
      throw e;
    }
  }

  async getCashFlowSummary(period?: "today" | "week" | "month"): Promise<any> {
    const tx = await this.getCashFlowTransactions();
    const inflow = tx
      .filter((t) => t.type === "INFLOW")
      .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
    const outflow = tx
      .filter((t) => t.type === "OUTFLOW")
      .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);

    let currentBalance = inflow - outflow;
    if (Capacitor.isNativePlatform()) {
      try {
        currentBalance = await sqliteService.getCashFlowBalance();
      } catch (e) {
        console.warn("⚠️ Using calculated balance:", e);
      }
    }

    return {
      period: period || "today",
      totalInflow: inflow,
      totalOutflow: outflow,
      netFlow: inflow - outflow,
      currentBalance,
      transactionCount: tx.length,
      inflowByCategory: {
        ORDER_PAYMENT: tx
          .filter((t) => t.type === "INFLOW" && t.category === "ORDER_PAYMENT")
          .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0),
        CASH_DEPOSIT: tx
          .filter((t) => t.type === "INFLOW" && t.category === "CASH_DEPOSIT")
          .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0),
      },
      outflowByCategory: {
        EXPENSE: tx
          .filter((t) => t.type === "OUTFLOW" && t.category === "EXPENSE")
          .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0),
        STOCK_PURCHASE: tx
          .filter(
            (t) => t.type === "OUTFLOW" && t.category === "STOCK_PURCHASE"
          )
          .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0),
      },
      recentTransactions: tx.slice(0, 5),
    };
  }

  async getCashDrawerBalance(): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    if (Capacitor.isNativePlatform()) {
      const currentBalance = await sqliteService.getCashFlowBalance();
      console.log("💰 Native cash balance calculated:", currentBalance);
      return { currentBalance, lastUpdated: new Date().toISOString() };
    } else {
      const tx = this.getFromWebStorage<any[]>(this.CASH_TX_KEY);
      const inflow = tx
        .filter((t) => t.type === "INFLOW")
        .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
      const outflow = tx
        .filter((t) => t.type === "OUTFLOW")
        .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
      const currentBalance = inflow - outflow;
      const drawer = this.getFromWebStorage<any>(this.DRAWER_KEY) || {
        currentBalance: 0,
      };
      if (drawer.currentBalance !== currentBalance) {
        this.setToWebStorage(this.DRAWER_KEY, {
          currentBalance,
          lastUpdated: new Date().toISOString(),
        });
      }
      return { currentBalance, lastUpdated: new Date().toISOString() };
    }
  }

  async addCashDeposit(amount: number, description: string): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    let id: string;
    if (Capacitor.isNativePlatform()) {
      id = (await sqliteService.createCashFlowTransaction(
        "INFLOW",
        amount,
        "CASH_DEPOSIT",
        description
      )) as string;
    } else {
      id = this.generateId();
      const tx = this.getFromWebStorage<any[]>(this.CASH_TX_KEY);
      tx.push({
        id,
        type: "INFLOW",
        amount: Math.abs(amount),
        category: "CASH_DEPOSIT",
        description,
        createdAt: new Date().toISOString(),
        createdBy: "admin",
      });
      this.setToWebStorage(this.CASH_TX_KEY, tx);

      const drawer = this.getFromWebStorage<any>(this.DRAWER_KEY);
      drawer.currentBalance =
        Number(drawer.currentBalance || 0) + Math.abs(amount);
      drawer.lastUpdated = new Date().toISOString();
      this.setToWebStorage(this.DRAWER_KEY, drawer);
    }

    return {
      id,
      type: "INFLOW",
      amount: Math.abs(amount),
      category: "CASH_DEPOSIT",
      description,
      createdAt: new Date().toISOString(),
      createdBy: "admin",
    };
  }

  async recordExpense(
    amount: number,
    description: string,
    itemsPurchased?: string
  ) {
    if (!this.isInitialized) await this.initializeDatabase();

    let id: string;
    if (Capacitor.isNativePlatform()) {
      id = (await sqliteService.createCashFlowTransaction(
        "OUTFLOW",
        Math.abs(amount),
        "EXPENSE",
        description,
        itemsPurchased
      )) as string;
    } else {
      id = this.generateId();
      const tx = this.getFromWebStorage<any[]>(this.CASH_TX_KEY);
      tx.push({
        id,
        type: "OUTFLOW",
        amount: Math.abs(amount),
        category: "EXPENSE",
        description,
        itemsPurchased,
        createdAt: new Date().toISOString(),
        createdBy: "admin",
      });
      this.setToWebStorage(this.CASH_TX_KEY, tx);

      const drawer = this.getFromWebStorage<any>(this.DRAWER_KEY);
      drawer.currentBalance =
        Number(drawer.currentBalance || 0) - Math.abs(amount);
      drawer.lastUpdated = new Date().toISOString();
      this.setToWebStorage(this.DRAWER_KEY, drawer);
    }

    return {
      id,
      type: "OUTFLOW",
      amount: Math.abs(amount),
      category: "EXPENSE",
      description,
      itemsPurchased,
      createdAt: new Date().toISOString(),
      createdBy: "admin",
    };
  }

  async setCashDrawerBalance(newBalance: number, reason: string): Promise<any> {
    if (!this.isInitialized) await this.initializeDatabase();

    let currentBalance = 0;
    if (Capacitor.isNativePlatform()) {
      currentBalance = await sqliteService.getCashFlowBalance();
    } else {
      const tx = this.getFromWebStorage<any[]>(this.CASH_TX_KEY);
      const inflow = tx
        .filter((t) => t.type === "INFLOW")
        .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
      const outflow = tx
        .filter((t) => t.type === "OUTFLOW")
        .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
      currentBalance = inflow - outflow;
    }

    const diff = newBalance - currentBalance;
    if (diff === 0) return null;

    let id: string;
    if (Capacitor.isNativePlatform()) {
      id = (await sqliteService.createCashFlowTransaction(
        diff > 0 ? "INFLOW" : "OUTFLOW",
        Math.abs(diff),
        "CASH_ADJUSTMENT",
        `Balance adjustment: ${reason}`
      )) as string;
    } else {
      id = this.generateId();
      const tx = this.getFromWebStorage<any[]>(this.CASH_TX_KEY);
      tx.push({
        id,
        type: diff > 0 ? "INFLOW" : "OUTFLOW",
        amount: Math.abs(diff),
        category: "CASH_ADJUSTMENT",
        description: `Balance adjustment: ${reason}`,
        createdAt: new Date().toISOString(),
        createdBy: "admin",
      });
      this.setToWebStorage(this.CASH_TX_KEY, tx);

      const drawer = this.getFromWebStorage<any>(this.DRAWER_KEY);
      drawer.currentBalance =
        Number(drawer.currentBalance || 0) +
        (diff > 0 ? Math.abs(diff) : -Math.abs(diff));
      drawer.lastUpdated = new Date().toISOString();
      this.setToWebStorage(this.DRAWER_KEY, drawer);
    }

    return {
      id,
      type: diff > 0 ? "INFLOW" : "OUTFLOW",
      amount: Math.abs(diff),
      category: "CASH_ADJUSTMENT",
      description: `Balance adjustment: ${reason}`,
      createdAt: new Date().toISOString(),
      createdBy: "admin",
    };
  }

  async recordCashInflow(inflowData: {
    amount: number;
    type: "ORDER_PAYMENT" | "CASH_DEPOSIT" | "OTHER_INCOME" | "SALE";
    orderId?: string;
    description: string;
    paymentMethod?: string;
  }) {
    if (!this.isInitialized) await this.initializeDatabase();

    const transaction = {
      id: this.generateId(),
      type: "INFLOW",
      amount: Math.abs(inflowData.amount),
      category: inflowData.type,
      orderId: inflowData.orderId,
      description: inflowData.description,
      paymentMethod: inflowData.paymentMethod || "CASH",
      createdAt: new Date().toISOString(),
      createdBy: "System",
    };

    if (Capacitor.isNativePlatform()) {
      console.log("🔍 Recording cash flow transaction (native):", transaction);
      const success = await sqliteService.recordCashFlowTransaction(transaction);
      console.log("💾 SQLite transaction result:", success);
      
      if (!success) {
        throw new Error("Failed to record cash flow transaction in SQLite database");
      }
    } else {
      console.log("🔍 Recording cash flow transaction (web):", transaction);
      const tx = this.getFromWebStorage<any[]>(this.CASH_TX_KEY);
      tx.push(transaction);
      this.setToWebStorage(this.CASH_TX_KEY, tx);

      if (inflowData.paymentMethod === "CASH" || !inflowData.paymentMethod) {
        const bal = this.getFromWebStorage<any>(this.DRAWER_KEY);
        const oldBalance = Number(bal.currentBalance || 0);
        bal.currentBalance = oldBalance + Math.abs(inflowData.amount);
        bal.lastUpdated = new Date().toISOString();
        this.setToWebStorage(this.DRAWER_KEY, bal);
        console.log(`💰 Web balance updated: ${oldBalance} → ${bal.currentBalance}`);
      }
    }

    return transaction;
  }

  async recordCashOutflow(outflowData: {
    amount: number;
    type: "STOCK_PURCHASE" | "EXPENSE" | "WITHDRAWAL" | "REFUND";
    description: string;
    itemsPurchased?: string;
    orderId?: string;
  }) {
    if (!this.isInitialized) await this.initializeDatabase();

    const transaction = {
      id: this.generateId(),
      type: "OUTFLOW",
      amount: Math.abs(outflowData.amount), // store positive
      category: outflowData.type,
      orderId: outflowData.orderId,
      description: outflowData.description,
      itemsPurchased: outflowData.itemsPurchased,
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
    };

    if (Capacitor.isNativePlatform()) {
      await sqliteService.recordCashFlowTransaction(transaction);
    } else {
      const tx = this.getFromWebStorage<any[]>(this.CASH_TX_KEY);
      tx.push(transaction);
      this.setToWebStorage(this.CASH_TX_KEY, tx);

      const bal = this.getFromWebStorage<any>(this.DRAWER_KEY);
      bal.currentBalance =
        Number(bal.currentBalance || 0) - Math.abs(outflowData.amount);
      bal.lastUpdated = new Date().toISOString();
      this.setToWebStorage(this.DRAWER_KEY, bal);
    }

    return transaction;
  }
}

// Create singleton instance
export const androidDatabaseService = new AndroidDatabaseService();
