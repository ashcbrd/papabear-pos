import { sqliteService } from './sqlite-service';
import { formatDateTime } from './date-utils';

export class SQLiteDataService {
  private async ensureInitialized() {
    if (!sqliteService.initialized) {
      await sqliteService.initialize();
    }
  }

  // Products CRUD
  async getProducts(): Promise<any[]> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    
    // First get products with flavors and sizes
    const result = await db.query(`
      SELECT 
        p.*,
        json_group_array(
          DISTINCT CASE WHEN f.id IS NOT NULL THEN json_object(
            'id', f.id,
            'name', f.name
          ) END
        ) as flavors_json
      FROM products p
      LEFT JOIN product_flavors pf ON p.id = pf.product_id
      LEFT JOIN flavors f ON pf.flavor_id = f.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    const products = [];
    
    for (const row of (result.values || [])) {
      // Get sizes with materials and ingredients for each product
      const sizesResult = await db.query(`
        SELECT 
          s.*,
          json_group_array(
            DISTINCT CASE WHEN sm.material_id IS NOT NULL THEN json_object(
              'id', sm.material_id,
              'quantity', sm.quantity_used
            ) END
          ) as materials_json,
          json_group_array(
            DISTINCT CASE WHEN si.ingredient_id IS NOT NULL THEN json_object(
              'id', si.ingredient_id,
              'quantity', si.quantity_used
            ) END
          ) as ingredients_json
        FROM sizes s
        LEFT JOIN size_materials sm ON s.id = sm.size_id
        LEFT JOIN size_ingredients si ON s.id = si.size_id
        WHERE s.product_id = ?
        GROUP BY s.id
        ORDER BY s.created_at
      `, [row.id]);

      const sizes = (sizesResult.values || []).map((sizeRow: any) => ({
        id: sizeRow.id,
        name: sizeRow.name,
        price: sizeRow.price,
        materials: sizeRow.materials_json ? JSON.parse(sizeRow.materials_json).filter((m: any) => m && m.id) : [],
        ingredients: sizeRow.ingredients_json ? JSON.parse(sizeRow.ingredients_json).filter((i: any) => i && i.id) : []
      }));

      products.push({
        id: row.id,
        name: row.name,
        category: row.category,
        imageUrl: row.image_url,
        createdAt: row.created_at,
        flavors: row.flavors_json ? JSON.parse(row.flavors_json).filter((f: any) => f && f.id) : [],
        sizes
      });
    }

    return products;
  }

  async createProduct(product: any): Promise<any> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    
    const id = this.generateUUID();
    const now = new Date().toISOString();

    // Insert product
    await db.run(
      'INSERT INTO products (id, name, category, image_url, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, product.name, product.category, product.imageUrl || null, now]
    );

    // Insert flavors relationships
    if (product.flavors && product.flavors.length > 0) {
      for (const flavor of product.flavors) {
        // Find flavor by name
        const flavorResult = await db.query('SELECT id FROM flavors WHERE name = ?', [flavor.name]);
        if (flavorResult.values && flavorResult.values.length > 0) {
          const flavorId = flavorResult.values[0].id;
          await db.run(
            'INSERT INTO product_flavors (id, product_id, flavor_id) VALUES (?, ?, ?)',
            [this.generateUUID(), id, flavorId]
          );
        }
      }
    }

    // Insert sizes
    if (product.sizes && product.sizes.length > 0) {
      for (const size of product.sizes) {
        const sizeId = this.generateUUID();
        await db.run(
          'INSERT INTO sizes (id, product_id, name, price, created_at) VALUES (?, ?, ?, ?, ?)',
          [sizeId, id, size.name, size.price, now]
        );

        // Insert materials for this size
        if (size.materials && size.materials.length > 0) {
          for (const material of size.materials) {
            await db.run(
              'INSERT INTO size_materials (id, size_id, material_id, quantity_used) VALUES (?, ?, ?, ?)',
              [this.generateUUID(), sizeId, material.id, material.quantity]
            );
          }
        }

        // Insert ingredients for this size
        if (size.ingredients && size.ingredients.length > 0) {
          for (const ingredient of size.ingredients) {
            await db.run(
              'INSERT INTO size_ingredients (id, size_id, ingredient_id, quantity_used) VALUES (?, ?, ?, ?)',
              [this.generateUUID(), sizeId, ingredient.id, ingredient.quantity]
            );
          }
        }
      }
    }

    return { id, ...product, createdAt: now };
  }

  async updateProduct(id: string, product: any): Promise<any> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();

    // Update product
    await db.run(
      'UPDATE products SET name = ?, category = ?, image_url = ? WHERE id = ?',
      [product.name, product.category, product.imageUrl || null, id]
    );

    // Delete existing relationships
    await db.run('DELETE FROM product_flavors WHERE product_id = ?', [id]);
    await db.run('DELETE FROM sizes WHERE product_id = ?', [id]); // This will cascade delete size_materials and size_ingredients

    // Re-insert flavors and sizes
    const updatedProduct = { ...product, id };
    await this.createProductRelationships(updatedProduct);

    return updatedProduct;
  }

  private async createProductRelationships(product: any) {
    const db = sqliteService.getDB();

    // Insert flavors relationships
    if (product.flavors && product.flavors.length > 0) {
      for (const flavor of product.flavors) {
        const flavorResult = await db.query('SELECT id FROM flavors WHERE name = ?', [flavor.name]);
        if (flavorResult.values && flavorResult.values.length > 0) {
          const flavorId = flavorResult.values[0].id;
          await db.run(
            'INSERT INTO product_flavors (id, product_id, flavor_id) VALUES (?, ?, ?)',
            [this.generateUUID(), product.id, flavorId]
          );
        }
      }
    }

    // Insert sizes
    if (product.sizes && product.sizes.length > 0) {
      for (const size of product.sizes) {
        const sizeId = this.generateUUID();
        const now = new Date().toISOString();
        await db.run(
          'INSERT INTO sizes (id, product_id, name, price, created_at) VALUES (?, ?, ?, ?, ?)',
          [sizeId, product.id, size.name, size.price, now]
        );
      }
    }
  }

  async deleteProduct(id: string): Promise<void> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    await db.run('DELETE FROM products WHERE id = ?', [id]);
  }

  // Flavors CRUD
  async getFlavors(): Promise<any[]> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    const result = await db.query('SELECT * FROM flavors ORDER BY name ASC');
    return result.values || [];
  }

  async createFlavor(flavor: { name: string }): Promise<any> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    
    const id = this.generateUUID();
    const now = new Date().toISOString();
    
    await db.run(
      'INSERT INTO flavors (id, name, created_at) VALUES (?, ?, ?)',
      [id, flavor.name, now]
    );

    return { id, ...flavor, createdAt: now };
  }

  async updateFlavor(id: string, flavor: { name: string }): Promise<any> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    
    await db.run('UPDATE flavors SET name = ? WHERE id = ?', [flavor.name, id]);
    return { id, ...flavor };
  }

  async deleteFlavor(id: string): Promise<void> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    await db.run('DELETE FROM flavors WHERE id = ?', [id]);
  }

  // Materials CRUD
  async getMaterials(): Promise<any[]> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    const result = await db.query('SELECT * FROM materials ORDER BY created_at DESC');
    
    return (result.values || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      pricePerPiece: row.price_per_piece,
      isPackage: Boolean(row.is_package),
      packagePrice: row.package_price,
      unitsPerPackage: row.units_per_package,
      stockQuantity: row.stock_quantity,
      createdAt: row.created_at
    }));
  }

  async createMaterial(material: any): Promise<any> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    
    const id = this.generateUUID();
    const now = new Date().toISOString();
    
    await db.run(
      `INSERT INTO materials (
        id, name, price_per_piece, is_package, package_price, 
        units_per_package, stock_quantity, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        material.name, 
        material.pricePerPiece || 0,
        material.isPackage ? 1 : 0,
        material.packagePrice || null,
        material.unitsPerPackage || null,
        material.stockQuantity || 0,
        now
      ]
    );

    return { id, ...material, createdAt: now };
  }

  async updateMaterial(id: string, material: any): Promise<any> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    
    await db.run(
      `UPDATE materials SET 
        name = ?, price_per_piece = ?, is_package = ?, 
        package_price = ?, units_per_package = ?, stock_quantity = ?
      WHERE id = ?`,
      [
        material.name,
        material.pricePerPiece || 0,
        material.isPackage ? 1 : 0,
        material.packagePrice || null,
        material.unitsPerPackage || null,
        material.stockQuantity || 0,
        id
      ]
    );

    return { id, ...material };
  }

  async deleteMaterial(id: string): Promise<void> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    await db.run('DELETE FROM materials WHERE id = ?', [id]);
  }

  // Ingredients CRUD
  async getIngredients(): Promise<any[]> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    const result = await db.query('SELECT * FROM ingredients ORDER BY created_at DESC');
    
    return (result.values || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      measurementUnit: row.measurement_unit,
      unitsPerPurchase: row.units_per_purchase,
      pricePerPurchase: row.price_per_purchase,
      pricePerUnit: row.price_per_unit,
      stockQuantity: row.stock_quantity,
      createdAt: row.created_at
    }));
  }

  async createIngredient(ingredient: any): Promise<any> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    
    const id = this.generateUUID();
    const now = new Date().toISOString();
    
    await db.run(
      `INSERT INTO ingredients (
        id, name, measurement_unit, units_per_purchase, 
        price_per_purchase, price_per_unit, stock_quantity, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ingredient.name,
        ingredient.measurementUnit,
        ingredient.unitsPerPurchase || 0,
        ingredient.pricePerPurchase,
        ingredient.pricePerPurchase / (ingredient.unitsPerPurchase || 1),
        ingredient.stockQuantity || 0,
        now
      ]
    );

    return { id, ...ingredient, createdAt: now };
  }

  async updateIngredient(id: string, ingredient: any): Promise<any> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    
    await db.run(
      `UPDATE ingredients SET 
        name = ?, measurement_unit = ?, units_per_purchase = ?,
        price_per_purchase = ?, price_per_unit = ?, stock_quantity = ?
      WHERE id = ?`,
      [
        ingredient.name,
        ingredient.measurementUnit,
        ingredient.unitsPerPurchase || 0,
        ingredient.pricePerPurchase,
        ingredient.pricePerPurchase / (ingredient.unitsPerPurchase || 1),
        ingredient.stockQuantity || 0,
        id
      ]
    );

    return { id, ...ingredient };
  }

  async deleteIngredient(id: string): Promise<void> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    await db.run('DELETE FROM ingredients WHERE id = ?', [id]);
  }

  // Addons CRUD
  async getAddons(): Promise<any[]> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    const result = await db.query('SELECT * FROM addons ORDER BY created_at DESC');
    
    return (result.values || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      stockQuantity: row.stock_quantity,
      createdAt: row.created_at
    }));
  }

  async createAddon(addon: any): Promise<any> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    
    const id = this.generateUUID();
    const now = new Date().toISOString();
    
    await db.run(
      'INSERT INTO addons (id, name, price, stock_quantity, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, addon.name, addon.price, addon.stockQuantity || 0, now]
    );

    return { id, ...addon, createdAt: now };
  }

  async updateAddon(id: string, addon: any): Promise<any> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    
    await db.run(
      'UPDATE addons SET name = ?, price = ?, stock_quantity = ? WHERE id = ?',
      [addon.name, addon.price, addon.stockQuantity || 0, id]
    );

    return { id, ...addon };
  }

  async deleteAddon(id: string): Promise<void> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    await db.run('DELETE FROM addons WHERE id = ?', [id]);
  }

  // Orders CRUD
  async getOrders(filters?: any): Promise<any[]> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    
    let whereClause = '';
    const params: any[] = [];

    if (filters?.startDate && filters?.endDate) {
      whereClause = 'WHERE DATE(o.created_at) BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    const result = await db.query(`
      SELECT 
        o.*,
        json_group_array(
          json_object(
            'id', oi.id,
            'productId', oi.product_id,
            'flavorId', oi.flavor_id,
            'sizeId', oi.size_id,
            'quantity', oi.quantity,
            'price', oi.price,
            'productName', p.name,
            'flavorName', f.name,
            'sizeName', s.name
          )
        ) as items_json
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN flavors f ON oi.flavor_id = f.id
      LEFT JOIN sizes s ON oi.size_id = s.id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, params);

    return (result.values || []).map((row: any) => ({
      id: row.id,
      total: row.total,
      paid: row.paid,
      change: row.change_amount,
      orderType: row.order_type,
      orderStatus: row.order_status,
      createdAt: formatDateTime(row.created_at),
      items: row.items_json ? JSON.parse(row.items_json).filter((item: any) => item.id) : []
    }));
  }

  async createOrder(order: any): Promise<any> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    
    const orderId = this.generateUUID();
    const now = new Date().toISOString();

    // Create order
    await db.run(
      `INSERT INTO orders (
        id, total, paid, change_amount, order_type, order_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        order.total,
        order.paid,
        order.change,
        order.orderType || 'DINE_IN',
        order.orderStatus || 'QUEUING',
        now
      ]
    );

    // Create order items
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        const itemId = this.generateUUID();
        await db.run(
          `INSERT INTO order_items (
            id, order_id, product_id, flavor_id, size_id, quantity, price
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            orderId,
            item.productId,
            item.flavorId,
            item.sizeId,
            item.quantity,
            item.price
          ]
        );

        // Create order item addons
        if (item.addons && item.addons.length > 0) {
          for (const addon of item.addons) {
            await db.run(
              'INSERT INTO order_item_addons (id, order_item_id, addon_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
              [this.generateUUID(), itemId, addon.id, addon.quantity, addon.price]
            );
          }
        }
      }
    }

    // Create cash flow entry
    await db.run(
      `INSERT INTO cash_flow_transactions (
        id, type, category, amount, description, order_id, payment_method, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        this.generateUUID(),
        'INFLOW',
        'ORDER_PAYMENT',
        order.total,
        `Order payment for ${order.items?.length || 0} items`,
        orderId,
        'CASH',
        now
      ]
    );

    // Deduct stock for materials and ingredients
    await this.deductInventoryStock(order.items);

    return { id: orderId, ...order, createdAt: now };
  }

  private async deductInventoryStock(orderItems: any[]): Promise<void> {
    if (!orderItems || orderItems.length === 0) return;

    const db = sqliteService.getDB();

    for (const item of orderItems) {
      // Get the size details with materials and ingredients
      const sizeResult = await db.query(`
        SELECT 
          sm.material_id,
          sm.quantity_used as material_quantity,
          si.ingredient_id,
          si.quantity_used as ingredient_quantity
        FROM sizes s
        LEFT JOIN size_materials sm ON s.id = sm.size_id
        LEFT JOIN size_ingredients si ON s.id = si.size_id
        WHERE s.id = ?
      `, [item.sizeId]);

      if (sizeResult.values && sizeResult.values.length > 0) {
        for (const row of sizeResult.values) {
          const orderQuantity = item.quantity || 1;

          // Deduct materials stock
          if (row.material_id) {
            const materialDeduction = (row.material_quantity || 0) * orderQuantity;
            await db.run(
              'UPDATE materials SET stock_quantity = CASE WHEN stock_quantity - ? >= 0 THEN stock_quantity - ? ELSE 0 END WHERE id = ?',
              [materialDeduction, materialDeduction, row.material_id]
            );
          }

          // Deduct ingredients stock
          if (row.ingredient_id) {
            const ingredientDeduction = (row.ingredient_quantity || 0) * orderQuantity;
            await db.run(
              'UPDATE ingredients SET stock_quantity = CASE WHEN stock_quantity - ? >= 0 THEN stock_quantity - ? ELSE 0 END WHERE id = ?',
              [ingredientDeduction, ingredientDeduction, row.ingredient_id]
            );
          }
        }
      }
    }

    console.log('Inventory stock deducted for order');
  }

  async updateOrder(id: string, updates: any): Promise<any> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    
    await db.run(
      'UPDATE orders SET order_status = ? WHERE id = ?',
      [updates.orderStatus, id]
    );

    return { id, ...updates };
  }

  async deleteOrder(id: string): Promise<void> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    await db.run('DELETE FROM orders WHERE id = ?', [id]);
  }

  // Dashboard stats
  async getDashboardStats(filters?: any): Promise<any> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    
    // Get basic stats
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(total), 0) as totalRevenue,
        COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now') THEN 1 ELSE 0 END), 0) as todayOrders,
        COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now') THEN total ELSE 0 END), 0) as todayInflow
      FROM orders
    `);

    const stats = statsResult.values?.[0] || {};

    // Get cash drawer balance (simplified)
    const cashResult = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'INFLOW' THEN amount ELSE -amount END), 0) as balance
      FROM cash_flow_transactions
    `);

    const cashBalance = cashResult.values?.[0]?.balance || 0;

    return {
      stats: {
        totalOrders: stats.totalOrders || 0,
        totalRevenue: stats.totalRevenue || 0,
        todayOrders: stats.todayOrders || 0,
        todayInflow: stats.todayInflow || 0,
        cashDrawerBalance: cashBalance,
        trend: 'up',
        trend_percent: 15,
        best_product: 'Coffee Float',
        worst_product: 'Hot Choco',
        busiest_hour: '2:00 PM - 3:00 PM',
        slowest_hour: '10:00 AM - 11:00 AM'
      }
    };
  }

  // Cash flow
  async getCashFlowTransactions(): Promise<any[]> {
    await this.ensureInitialized();
    const db = sqliteService.getDB();
    const result = await db.query(`
      SELECT * FROM cash_flow_transactions 
      ORDER BY created_at DESC
    `);
    
    return (result.values || []).map((row: any) => ({
      id: row.id,
      type: row.type,
      category: row.category,
      amount: row.amount,
      description: row.description,
      orderId: row.order_id,
      itemsPurchased: row.items_purchased,
      paymentMethod: row.payment_method,
      createdBy: row.created_by,
      createdAt: row.created_at
    }));
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

export const sqliteDataService = new SQLiteDataService();