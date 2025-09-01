// Mock data service for development/testing with localStorage persistence

// Utility functions for localStorage
const getStorageKey = (key: string) => `papabear_${key}`;

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(getStorageKey(key));
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
};

// Default data
const defaultStockStorage = [
  // Sample stock data with realistic quantities
  { id: "stock1", type: "ingredient", itemId: "coffee_beans", quantity: 50.0, minThreshold: 10.0, unit: "kg" },
  { id: "stock2", type: "ingredient", itemId: "milk", quantity: 25.0, minThreshold: 5.0, unit: "liters" },
  { id: "stock3", type: "ingredient", itemId: "sugar", quantity: 15.0, minThreshold: 3.0, unit: "kg" },
  { id: "stock4", type: "material", itemId: "coffee_cups_medium", quantity: 200, minThreshold: 50, unit: "pieces" },
  { id: "stock5", type: "material", itemId: "coffee_cups_large", quantity: 150, minThreshold: 30, unit: "pieces" },
  { id: "stock6", type: "material", itemId: "lids", quantity: 300, minThreshold: 100, unit: "pieces" },
  { id: "stock7", type: "addon", itemId: "a1", quantity: 100, minThreshold: 20, unit: "pieces" }, // Extra Cheese
  { id: "stock8", type: "addon", itemId: "a2", quantity: 50, minThreshold: 10, unit: "pieces" }, // Extra Shot
  { id: "stock9", type: "addon", itemId: "a3", quantity: 75, minThreshold: 15, unit: "pieces" }  // Whipped Cream
];

const defaultFlavorsStorage = [
  { id: "f1", name: "Original", createdAt: new Date().toISOString() },
  { id: "f2", name: "Vanilla", createdAt: new Date().toISOString() },
  { id: "f3", name: "Chocolate", createdAt: new Date().toISOString() },
  { id: "f4", name: "Strawberry", createdAt: new Date().toISOString() },
  { id: "f5", name: "Caramel", createdAt: new Date().toISOString() },
  { id: "f6", name: "Matcha", createdAt: new Date().toISOString() },
  { id: "f7", name: "Hazelnut", createdAt: new Date().toISOString() },
  { id: "f8", name: "Mocha", createdAt: new Date().toISOString() },
  { id: "f9", name: "Irish Cream", createdAt: new Date().toISOString() },
  { id: "f10", name: "Taro", createdAt: new Date().toISOString() },
  { id: "f11", name: "Honeydew", createdAt: new Date().toISOString() },
  { id: "f12", name: "Mango", createdAt: new Date().toISOString() },
  { id: "f13", name: "Coconut", createdAt: new Date().toISOString() },
  { id: "f14", name: "Spicy", createdAt: new Date().toISOString() },
];

// Initialize storage with persistence
let ordersStorage: any[] = loadFromStorage('orders', []);
let stockStorage: any[] = loadFromStorage('stock', defaultStockStorage);
let lowStockAlerts: any[] = loadFromStorage('lowStockAlerts', []);
let cashFlowStorage: any[] = loadFromStorage('cashFlow', []);
let cashDrawerBalance = loadFromStorage('cashDrawerBalance', 5000.00);
let flavorsStorage: any[] = loadFromStorage('flavors', defaultFlavorsStorage);
let productsStorage: any[] = loadFromStorage('products', []);

export const mockDataService = {
  async getProducts() {
    // If no products in storage, return default products and save them
    if (productsStorage.length === 0) {
      productsStorage = [
      {
        id: "1",
        name: "Iced Coffee",
        category: "ColdBeverages",
        imageUrl: null,
        flavors: [
          { id: "f1", name: "Americano" },
          { id: "f2", name: "Cinnamon" },
          { id: "f3", name: "Salted Caramel" },
          { id: "f4", name: "Creamy Vanilla" },
          { id: "f5", name: "Mocha" },
          { id: "f6", name: "Honeycomb Latte" },
          { id: "f7", name: "Tiramisu" },
          { id: "f8", name: "Caramel Macchiato" },
          { id: "f9", name: "Spanish Latte" }
        ],
        sizes: [
          { id: "s1", name: "Medium", price: 95.00 },
          { id: "s2", name: "Large", price: 120.00 }
        ]
      },
      {
        id: "2",
        name: "Fusion Matcha",
        category: "ColdBeverages",
        imageUrl: null,
        flavors: [
          { id: "f10", name: "Matcha Latte" },
          { id: "f11", name: "Matcha Caramel" },
          { id: "f12", name: "Mango Matcha Latte" },
          { id: "f13", name: "Strawberry Matcha Latte" },
          { id: "f14", name: "Blueberry Matcha Latte" }
        ],
        sizes: [
          { id: "s3", name: "Medium", price: 110.00 },
          { id: "s4", name: "Large", price: 135.00 }
        ]
      },
      {
        id: "3",
        name: "Float Series",
        category: "ColdBeverages",
        imageUrl: null,
        flavors: [
          { id: "f15", name: "Coffee Float" },
          { id: "f16", name: "Strawberry Float" },
          { id: "f17", name: "Blueberry Float" },
          { id: "f18", name: "Sprite Float" },
          { id: "f19", name: "Coke Float" },
          { id: "f20", name: "Matcha Float" }
        ],
        sizes: [
          { id: "s5", name: "Medium", price: 85.00 },
          { id: "s6", name: "Large", price: 110.00 }
        ]
      },
      {
        id: "4",
        name: "Soda Series",
        category: "ColdBeverages",
        imageUrl: null,
        flavors: [
          { id: "f21", name: "Kiwi Will Rock You" },
          { id: "f22", name: "Blueberry Licious" },
          { id: "f23", name: "Tipsy Strawberry" },
          { id: "f24", name: "Edi Wow Grape" },
          { id: "f25", name: "Mango Tango" },
          { id: "f26", name: "Honey Orange Ginger" }
        ],
        sizes: [
          { id: "s7", name: "Medium", price: 90.00 },
          { id: "s8", name: "Large", price: 115.00 }
        ]
      },
      {
        id: "5",
        name: "Milktea Series",
        category: "ColdBeverages",
        imageUrl: null,
        flavors: [
          { id: "f27", name: "Okinawa" },
          { id: "f28", name: "Taro" },
          { id: "f29", name: "Wintermelon" },
          { id: "f30", name: "Red Velvet" },
          { id: "f31", name: "Cookies and Cream" },
          { id: "f32", name: "Chocolate" },
          { id: "f33", name: "Mango Cheesecake" },
          { id: "f34", name: "Matcha" }
        ],
        sizes: [
          { id: "s9", name: "Medium", price: 100.00 },
          { id: "s10", name: "Large", price: 125.00 }
        ]
      },
      {
        id: "6",
        name: "Mint Series",
        category: "ColdBeverages",
        imageUrl: null,
        flavors: [
          { id: "f35", name: "Minty Matcha" },
          { id: "f36", name: "Choco Mint" }
        ],
        sizes: [
          { id: "s11", name: "Medium", price: 105.00 },
          { id: "s12", name: "Large", price: 130.00 }
        ]
      },
      {
        id: "7",
        name: "Graham Series",
        category: "ColdBeverages",
        imageUrl: null,
        flavors: [
          { id: "f37", name: "Blueberry Graham" },
          { id: "f38", name: "Mango Graham" },
          { id: "f39", name: "Avocado Graham" },
          { id: "f40", name: "Cookies and Cream Graham" }
        ],
        sizes: [
          { id: "s13", name: "Medium", price: 115.00 },
          { id: "s14", name: "Large", price: 140.00 }
        ]
      },
      {
        id: "8",
        name: "Shake Series",
        category: "ColdBeverages",
        imageUrl: null,
        flavors: [
          { id: "f41", name: "Avocado Shake" },
          { id: "f42", name: "Caramel Shake" },
          { id: "f43", name: "Mango Shake" },
          { id: "f44", name: "Ube Shake" },
          { id: "f45", name: "Strawberry Shake" },
          { id: "f46", name: "Cookies and Cream Shake" },
          { id: "f47", name: "Choco Fudge Shake" }
        ],
        sizes: [
          { id: "s15", name: "Medium", price: 120.00 },
          { id: "s16", name: "Large", price: 145.00 }
        ]
      },
      {
        id: "9",
        name: "S'mores Series",
        category: "ColdBeverages",
        imageUrl: null,
        flavors: [
          { id: "f48", name: "Dark Chocolate S'mores" },
          { id: "f49", name: "Matcha S'mores" },
          { id: "f50", name: "Red Velvet S'mores" },
          { id: "f51", name: "Caramel Macchiato S'mores" },
          { id: "f52", name: "Cookies and Cream S'mores" }
        ],
        sizes: [
          { id: "s17", name: "Medium", price: 125.00 },
          { id: "s18", name: "Large", price: 150.00 }
        ]
      },
      {
        id: "10",
        name: "Lemonade Series",
        category: "ColdBeverages",
        imageUrl: null,
        flavors: [
          { id: "f53", name: "Lemonade" },
          { id: "f54", name: "Tropical Berry Lemon" },
          { id: "f55", name: "Kiwi Lemonade" },
          { id: "f56", name: "Honey Lemon" }
        ],
        sizes: [
          { id: "s19", name: "Medium", price: 80.00 },
          { id: "s20", name: "Large", price: 105.00 }
        ]
      },
      {
        id: "11",
        name: "Hot Coffee",
        category: "HotBeverages",
        imageUrl: null,
        flavors: [
          { id: "f57", name: "Americano" },
          { id: "f58", name: "Cinnamon" },
          { id: "f59", name: "Salted Caramel" },
          { id: "f60", name: "Mocha" },
          { id: "f61", name: "Hot Choco" },
          { id: "f62", name: "Caramel Macchiato" },
          { id: "f63", name: "Spanish Latte" }
        ],
        sizes: [
          { id: "s21", name: "8oz", price: 90.00 },
          { id: "s22", name: "12oz", price: 115.00 }
        ]
      },
      {
        id: "12",
        name: "Mocha Mousse",
        category: "ColdBeverages",
        imageUrl: null,
        flavors: [],
        sizes: [
          { id: "s23", name: "Medium", price: 130.00 },
          { id: "s24", name: "Large", price: 155.00 }
        ]
      },
      {
        id: "13",
        name: "Mac and Cheese",
        category: "Meals",
        imageUrl: null,
        flavors: [],
        sizes: [
          { id: "s25", name: "Single", price: 110.00 }
        ]
      },
      {
        id: "14",
        name: "Bear Cub Sandwich",
        category: "Meals",
        imageUrl: null,
        flavors: [],
        sizes: [
          { id: "s26", name: "Single", price: 89.00 }
        ]
      },
      {
        id: "15",
        name: "Pesto Pasta",
        category: "Meals",
        imageUrl: null,
        flavors: [],
        sizes: [
          { id: "s27", name: "Single", price: 120.00 }
        ]
      },
      {
        id: "16",
        name: "Bear Hug Burger",
        category: "Meals",
        imageUrl: null,
        flavors: [],
        sizes: [
          { id: "s28", name: "Single", price: 99.00 }
        ]
      },
      {
        id: "17",
        name: "Shibuya Honey Toast",
        category: "Meals",
        imageUrl: null,
        flavors: [],
        sizes: [
          { id: "s29", name: "Single", price: 70.00 }
        ]
      },
      {
        id: "18",
        name: "Cheesy Hotdog Overload",
        category: "Meals",
        imageUrl: null,
        flavors: [],
        sizes: [
          { id: "s30", name: "Single", price: 69.00 }
        ]
      }
      ];
      saveToStorage('products', productsStorage);
    }
    return productsStorage;
  },

  async getAddons() {
    return [
      { id: "a1", name: "Extra Shot", price: 15.00 },
      { id: "a2", name: "Whipped Cream", price: 20.00 },
      { id: "a3", name: "Vodka", price: 50.00 }
    ];
  },

  async getFlavors() {
    return flavorsStorage;
  },

  async getOrders() {
    return ordersStorage;
  },

  async createOrder(orderData: any) {
    console.log('Creating order:', orderData);
    
    // First, check stock availability and deduct stock for each ordered item
    const stockDeductions = [];
    
    for (const item of orderData.items || []) {
      const size = item.size;
      const quantity = item.quantity;
      
      // Get ingredients needed for this size
      if (size?.ingredients) {
        for (const sizeIngredient of size.ingredients) {
          const ingredientId = sizeIngredient.ingredient?.id || sizeIngredient.ingredientId;
          const quantityUsed = sizeIngredient.quantityUsed * quantity;
          
          stockDeductions.push({
            type: 'ingredient',
            id: ingredientId,
            quantityUsed
          });
        }
      }
      
      // Get materials needed for this size
      if (size?.materials) {
        for (const sizeMaterial of size.materials) {
          const materialId = sizeMaterial.material?.id || sizeMaterial.materialId;
          const quantityUsed = sizeMaterial.quantityUsed * quantity;
          
          stockDeductions.push({
            type: 'material', 
            id: materialId,
            quantityUsed
          });
        }
      }
      
      // Handle addons stock deduction
      if (item.addons) {
        for (const addon of item.addons) {
          const addonId = addon.addon?.id || addon.id;
          const addonQuantity = addon.quantity;
          
          stockDeductions.push({
            type: 'addon',
            id: addonId,
            quantityUsed: addonQuantity
          });
        }
      }
    }
    
    // Apply stock deductions
    await this.deductStock(stockDeductions);
    
    const newOrder = { 
      id: Date.now().toString(), 
      orderStatus: 'QUEUING',
      createdAt: new Date().toISOString(),
      ...orderData 
    };
    ordersStorage.push(newOrder);
    
    // Record cash inflow for the order
    if (orderData.paid && orderData.paid > 0) {
      await this.recordCashInflow({
        amount: orderData.paid,
        type: 'ORDER_PAYMENT',
        orderId: newOrder.id,
        description: `Payment for Order #${newOrder.id}`,
        paymentMethod: orderData.paymentMethod || 'CASH'
      });
    }
    
    console.log('Order created successfully with stock deductions applied');
    return newOrder;
  },

  async deductStock(stockDeductions: Array<{type: string, id: string, quantityUsed: number}>) {
    // Group deductions by item ID to handle multiple uses of same ingredient/material
    const deductionMap = new Map();
    
    for (const deduction of stockDeductions) {
      const key = `${deduction.type}-${deduction.id}`;
      const existing = deductionMap.get(key);
      if (existing) {
        existing.quantityUsed += deduction.quantityUsed;
      } else {
        deductionMap.set(key, { ...deduction });
      }
    }
    
    // Apply the deductions
    for (const [key, deduction] of deductionMap) {
      await this.updateStockQuantity(deduction.type, deduction.id, -deduction.quantityUsed);
    }
  },

  async updateStockQuantity(type: string, itemId: string, quantityChange: number) {
    console.log(`Stock Update: ${type} ID ${itemId} - Change: ${quantityChange}`);
    
    // Find the stock record for this item
    const stockRecord = stockStorage.find(stock => stock.type === type && stock.itemId === itemId);
    
    if (stockRecord) {
      // Update the quantity (subtract for usage, add for restocking)
      const newQuantity = Math.max(0, stockRecord.quantity + quantityChange);
      stockRecord.quantity = newQuantity;
      
      console.log(`Updated ${type} ${itemId}: ${stockRecord.quantity - quantityChange} -> ${newQuantity} ${stockRecord.unit}`);
      
      // Check if stock goes below minimum threshold and create alert
      if (newQuantity <= stockRecord.minThreshold) {
        await this.createLowStockAlert(type, itemId, newQuantity, stockRecord.minThreshold, stockRecord.unit);
      }
    } else {
      console.warn(`Stock record not found for ${type} ${itemId}`);
    }
  },

  async createLowStockAlert(type: string, itemId: string, currentQuantity: number, minThreshold: number, unit: string) {
    const alert = {
      id: Date.now().toString(),
      type,
      itemId,
      currentQuantity,
      minThreshold,
      unit,
      message: `Low stock alert: ${type} ${itemId} has ${currentQuantity} ${unit} remaining (minimum: ${minThreshold})`,
      createdAt: new Date().toISOString(),
      resolved: false
    };
    
    lowStockAlerts.push(alert);
    console.warn(alert.message);
    
    return alert;
  },

  async getLowStockAlerts() {
    return lowStockAlerts.filter(alert => !alert.resolved);
  },

  async getStockStatus() {
    return stockStorage.map(stock => ({
      ...stock,
      isLowStock: stock.quantity <= stock.minThreshold,
      stockLevel: stock.quantity <= stock.minThreshold ? 'LOW' : 
                 stock.quantity <= (stock.minThreshold * 2) ? 'WARNING' : 'GOOD'
    }));
  },

  async updateOrder(id: string, updates: any) {
    console.log('Updating order:', id, updates);
    const orderIndex = ordersStorage.findIndex(order => order.id === id);
    if (orderIndex !== -1) {
      ordersStorage[orderIndex] = { ...ordersStorage[orderIndex], ...updates };
      saveToStorage('orders', ordersStorage);
      return ordersStorage[orderIndex];
    }
    return { id, ...updates };
  },

  async createProduct(product: any) {
    console.log('Creating product:', product);
    const newProduct = {
      id: Date.now().toString(),
      name: product.name,
      category: product.category,
      imageUrl: product.imageUrl || null,
      flavors: (product.flavors || []).map((f: any, index: number) => ({
        id: f.id || `f${Date.now()}_${index}`,
        name: f.name
      })),
      sizes: (product.sizes || []).map((s: any, index: number) => ({
        id: s.id || `s${Date.now()}_${index}`,
        name: s.name,
        price: s.price || 0,
        materials: (s.materials || []).map((m: any, mIndex: number) => ({
          material: { id: m.id, name: `Material ${m.id}` },
          quantityUsed: m.quantity || 0
        })),
        ingredients: (s.ingredients || []).map((i: any, iIndex: number) => ({
          ingredient: { id: i.id, name: `Ingredient ${i.id}` },
          quantityUsed: i.quantity || 0
        }))
      })),
      createdAt: new Date().toISOString()
    };
    
    // Add to storage and save
    productsStorage.push(newProduct);
    saveToStorage('products', productsStorage);
    return newProduct;
  },

  async updateProduct(id: string, product: any) {
    console.log('Updating product:', id, product);
    
    // Transform the product data to match the expected structure
    const updatedProduct = {
      id,
      name: product.name,
      category: product.category,
      imageUrl: product.imageUrl || null,
      flavors: (product.flavors || []).map((f: any, index: number) => ({
        id: f.id || `f${Date.now()}_${index}`,
        name: f.name
      })),
      sizes: (product.sizes || []).map((s: any, index: number) => ({
        id: s.id || `s${Date.now()}_${index}`,
        name: s.name,
        price: s.price || 0,
        materials: (s.materials || []).map((m: any, mIndex: number) => ({
          material: { id: m.id, name: `Material ${m.id}` },
          quantityUsed: m.quantity || 0
        })),
        ingredients: (s.ingredients || []).map((i: any, iIndex: number) => ({
          ingredient: { id: i.id, name: `Ingredient ${i.id}` },
          quantityUsed: i.quantity || 0
        }))
      })),
      updatedAt: new Date().toISOString()
    };
    
    // Update in storage and save
    const index = productsStorage.findIndex(p => p.id === id);
    if (index !== -1) {
      productsStorage[index] = updatedProduct;
    }
    saveToStorage('products', productsStorage);
    return updatedProduct;
  },

  async deleteProduct(id: string) {
    console.log('Deleting product:', id);
    productsStorage = productsStorage.filter(p => p.id !== id);
    saveToStorage('products', productsStorage);
    return true;
  },

  async createAddon(addon: any) {
    console.log('Creating addon:', addon);
    return { id: Date.now().toString(), ...addon };
  },

  async updateAddon(id: string, addon: any) {
    console.log('Updating addon:', id, addon);
    return { id, ...addon };
  },

  async deleteAddon(id: string) {
    console.log('Deleting addon:', id);
    return true;
  },

  async createOrder(order: any) {
    console.log('Creating order:', order);
    const newOrder = {
      id: Date.now().toString(),
      ...order,
      createdAt: new Date().toISOString()
    };
    ordersStorage.push(newOrder);
    saveToStorage('orders', ordersStorage);
    return newOrder;
  },

  async deleteOrder(id: string) {
    console.log('Deleting order:', id);
    const orderIndex = ordersStorage.findIndex(order => order.id === id);
    if (orderIndex !== -1) {
      ordersStorage.splice(orderIndex, 1);
      saveToStorage('orders', ordersStorage);
      return true;
    }
    return false;
  },

  // Cash Flow Management Methods
  async recordCashInflow(inflowData: {
    amount: number;
    type: 'ORDER_PAYMENT' | 'CASH_DEPOSIT' | 'OTHER_INCOME';
    orderId?: string;
    description: string;
    paymentMethod?: string;
  }) {
    const transaction = {
      id: Date.now().toString(),
      type: 'INFLOW',
      amount: inflowData.amount,
      category: inflowData.type,
      orderId: inflowData.orderId,
      description: inflowData.description,
      paymentMethod: inflowData.paymentMethod,
      createdAt: new Date().toISOString(),
      createdBy: 'System' // In real app, this would be current user
    };

    cashFlowStorage.push(transaction);
    
    // Update cash drawer balance only for cash payments
    if (inflowData.paymentMethod === 'CASH' || !inflowData.paymentMethod) {
      cashDrawerBalance += inflowData.amount;
    }

    console.log(`Cash Inflow Recorded: +₱${inflowData.amount} - ${inflowData.description}`);
    return transaction;
  },

  async recordCashOutflow(outflowData: {
    amount: number;
    type: 'STOCK_PURCHASE' | 'EXPENSE' | 'WITHDRAWAL' | 'REFUND';
    description: string;
    itemsPurchased?: string;
    orderId?: string;
  }) {
    const transaction = {
      id: Date.now().toString(),
      type: 'OUTFLOW',
      amount: -Math.abs(outflowData.amount), // Ensure negative
      category: outflowData.type,
      orderId: outflowData.orderId,
      description: outflowData.description,
      itemsPurchased: outflowData.itemsPurchased,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin' // In real app, this would be current user
    };

    cashFlowStorage.push(transaction);
    cashDrawerBalance -= Math.abs(outflowData.amount);

    console.log(`Cash Outflow Recorded: -₱${Math.abs(outflowData.amount)} - ${outflowData.description}`);
    return transaction;
  },

  async getCashFlowTransactions(filters?: {
    type?: 'INFLOW' | 'OUTFLOW';
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }) {
    let transactions = [...cashFlowStorage];

    if (filters) {
      if (filters.type) {
        transactions = transactions.filter(t => t.type === filters.type);
      }
      if (filters.category) {
        transactions = transactions.filter(t => t.category === filters.category);
      }
      if (filters.dateFrom) {
        transactions = transactions.filter(t => t.createdAt >= filters.dateFrom);
      }
      if (filters.dateTo) {
        transactions = transactions.filter(t => t.createdAt <= filters.dateTo);
      }
      if (filters.limit) {
        transactions = transactions.slice(-filters.limit);
      }
    }

    return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getCashDrawerBalance() {
    return {
      currentBalance: cashDrawerBalance,
      lastUpdated: new Date().toISOString()
    };
  },

  async getCashFlowSummary(period?: 'today' | 'week' | 'month') {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const relevantTransactions = cashFlowStorage.filter(t => 
      new Date(t.createdAt) >= startDate
    );

    const totalInflow = relevantTransactions
      .filter(t => t.type === 'INFLOW')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOutflow = relevantTransactions
      .filter(t => t.type === 'OUTFLOW')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netFlow = totalInflow - totalOutflow;

    // Breakdown by categories
    const inflowByCategory = {};
    const outflowByCategory = {};

    relevantTransactions.forEach(t => {
      if (t.type === 'INFLOW') {
        inflowByCategory[t.category] = (inflowByCategory[t.category] || 0) + t.amount;
      } else {
        outflowByCategory[t.category] = (outflowByCategory[t.category] || 0) + Math.abs(t.amount);
      }
    });

    return {
      period: period || 'all_time',
      totalInflow,
      totalOutflow,
      netFlow,
      currentBalance: cashDrawerBalance,
      transactionCount: relevantTransactions.length,
      inflowByCategory,
      outflowByCategory,
      recentTransactions: relevantTransactions.slice(-10)
    };
  },

  async addCashDeposit(amount: number, description: string) {
    return await this.recordCashInflow({
      amount,
      type: 'CASH_DEPOSIT',
      description: description || `Cash deposit of ₱${amount}`,
      paymentMethod: 'CASH'
    });
  },

  async recordExpense(amount: number, description: string, itemsPurchased?: string) {
    return await this.recordCashOutflow({
      amount,
      type: itemsPurchased ? 'STOCK_PURCHASE' : 'EXPENSE',
      description,
      itemsPurchased
    });
  },

  async recordRefund(orderId: string, amount: number, reason: string) {
    return await this.recordCashOutflow({
      amount,
      type: 'REFUND',
      orderId,
      description: `Refund for Order #${orderId}: ${reason}`
    });
  },

  async setCashDrawerBalance(newBalance: number, reason: string) {
    const currentBalance = cashDrawerBalance;
    const difference = newBalance - currentBalance;
    
    // Record the adjustment as a transaction
    const transaction = {
      id: Date.now().toString(),
      type: difference >= 0 ? 'INFLOW' : 'OUTFLOW',
      amount: Math.abs(difference),
      category: 'CASH_ADJUSTMENT',
      description: `Cash drawer adjustment: ${reason}`,
      previousBalance: currentBalance,
      newBalance: newBalance,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin'
    };

    cashFlowStorage.push(transaction);
    cashDrawerBalance = newBalance;

    console.log(`Cash Drawer Adjustment: ${currentBalance} -> ${newBalance} (${difference >= 0 ? '+' : ''}${difference})`);
    return transaction;
  },

  async adjustCashDrawer(adjustment: number, reason: string) {
    const currentBalance = cashDrawerBalance;
    const newBalance = currentBalance + adjustment;
    
    const transaction = {
      id: Date.now().toString(),
      type: adjustment >= 0 ? 'INFLOW' : 'OUTFLOW',
      amount: Math.abs(adjustment),
      category: 'CASH_ADJUSTMENT',
      description: `Cash drawer adjustment: ${reason}`,
      previousBalance: currentBalance,
      newBalance: newBalance,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin'
    };

    cashFlowStorage.push(transaction);
    cashDrawerBalance = newBalance;

    console.log(`Cash Drawer Adjustment: ${adjustment >= 0 ? '+' : ''}${adjustment} - ${reason}`);
    return transaction;
  },

  // Stock and inventory methods
  async getStock() { 
    return await this.getStockStatus(); 
  },
  
  async getDashboardStats() { 
    const stockStatus = await this.getStockStatus();
    const lowStockCount = stockStatus.filter(s => s.isLowStock).length;
    const totalOrders = ordersStorage.length;
    const todayOrders = ordersStorage.filter(order => {
      const orderDate = new Date(order.createdAt).toDateString();
      const today = new Date().toDateString();
      return orderDate === today;
    }).length;
    
    const cashFlowSummary = await this.getCashFlowSummary('today');
    const drawerBalance = await this.getCashDrawerBalance();
    
    return {
      totalOrders,
      todayOrders,
      lowStockItems: lowStockCount,
      totalRevenue: ordersStorage.reduce((sum, order) => sum + (order.total || 0), 0),
      cashDrawerBalance: drawerBalance.currentBalance,
      todayInflow: cashFlowSummary.totalInflow,
      todayOutflow: cashFlowSummary.totalOutflow,
      todayNetFlow: cashFlowSummary.netFlow,
      recentTransactions: cashFlowSummary.recentTransactions
    };
  },
  
  // Flavor methods
  async getFlavors() {
    return [...flavorsStorage];
  },

  async createFlavor(flavor: any) {
    console.log('Creating flavor:', flavor);
    const newFlavor = {
      id: `f${Date.now()}`,
      ...flavor,
      createdAt: new Date().toISOString()
    };
    flavorsStorage.push(newFlavor);
    return newFlavor;
  },

  async updateFlavor(id: string, flavor: any) {
    console.log('Updating flavor:', id, flavor);
    const index = flavorsStorage.findIndex(f => f.id === id);
    if (index !== -1) {
      flavorsStorage[index] = { ...flavorsStorage[index], ...flavor };
      return flavorsStorage[index];
    }
    return { id, ...flavor };
  },

  async deleteFlavor(id: string) {
    console.log('Deleting flavor:', id);
    const index = flavorsStorage.findIndex(f => f.id === id);
    if (index !== -1) {
      flavorsStorage.splice(index, 1);
      return true;
    }
    return false;
  },

  // Dashboard stats with enhanced filtering
  async getDashboardStats(filters?: any) {
    console.log('Getting dashboard stats with filters:', filters);
    
    const filter = filters?.filter || 'all';
    const selectedMonth = filters?.selectedMonth;
    const startDate = filters?.startDate;
    const endDate = filters?.endDate;
    
    // Helper function to filter orders by date range
    const getFilteredOrders = () => {
      const now = new Date();
      
      switch (filter) {
        case 'today':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return ordersStorage.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= today && orderDate < tomorrow;
          });
          
        case 'week':
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          return ordersStorage.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= weekStart && orderDate < weekEnd;
          });
          
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          return ordersStorage.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= monthStart && orderDate < monthEnd;
          });
          
        case 'selected_month':
          if (!selectedMonth) return ordersStorage;
          const [year, month] = selectedMonth.split('-').map(Number);
          const selectedMonthStart = new Date(year, month - 1, 1);
          const selectedMonthEnd = new Date(year, month, 1);
          return ordersStorage.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= selectedMonthStart && orderDate < selectedMonthEnd;
          });
          
        case 'date_range':
          if (!startDate || !endDate) return ordersStorage;
          const rangeStart = new Date(startDate);
          rangeStart.setHours(0, 0, 0, 0);
          const rangeEnd = new Date(endDate);
          rangeEnd.setHours(23, 59, 59, 999);
          return ordersStorage.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= rangeStart && orderDate <= rangeEnd;
          });
          
        default: // 'all'
          return ordersStorage;
      }
    };
    
    const filteredOrders = getFilteredOrders();
    const filteredRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Get all-time data for comparison
    const totalOrders = ordersStorage.length;
    const totalRevenue = ordersStorage.reduce((sum, order) => sum + (order.total || 0), 0);
    const cashBalance = cashDrawerBalance;
    
    // Calculate today's data for specific metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = ordersStorage.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today;
    });
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Calculate trend (compare with previous period)
    let previousPeriodOrders = [];
    switch (filter) {
      case 'today':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const dayAfterYesterday = new Date(yesterday);
        dayAfterYesterday.setDate(dayAfterYesterday.getDate() + 1);
        previousPeriodOrders = ordersStorage.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= yesterday && orderDate < dayAfterYesterday;
        });
        break;
      case 'week':
        const prevWeekStart = new Date();
        prevWeekStart.setDate(prevWeekStart.getDate() - prevWeekStart.getDay() - 7);
        prevWeekStart.setHours(0, 0, 0, 0);
        const prevWeekEnd = new Date(prevWeekStart);
        prevWeekEnd.setDate(prevWeekEnd.getDate() + 7);
        previousPeriodOrders = ordersStorage.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= prevWeekStart && orderDate < prevWeekEnd;
        });
        break;
      case 'month':
        const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
        previousPeriodOrders = ordersStorage.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= prevMonthStart && orderDate < prevMonthEnd;
        });
        break;
      default:
        previousPeriodOrders = [];
    }
    
    const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const trendPercent = previousRevenue > 0 
      ? Math.round(((filteredRevenue - previousRevenue) / previousRevenue) * 100)
      : filteredRevenue > 0 ? 100 : 0;
    
    // Generate chart data based on filtered orders
    const getChartData = () => {
      if (filter === 'all') {
        // Monthly data for all-time
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthOrders = ordersStorage.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.getMonth() === month.getMonth() && 
                   orderDate.getFullYear() === month.getFullYear();
          });
          monthlyData.push({
            month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            total: monthOrders.reduce((sum, order) => sum + (order.total || 0), 0)
          });
        }
        return monthlyData;
      } else {
        // Daily breakdown for specific periods
        const dailyData = [];
        const startOfPeriod = filteredOrders.length > 0 
          ? new Date(Math.min(...filteredOrders.map(o => new Date(o.createdAt).getTime())))
          : new Date();
        const endOfPeriod = filteredOrders.length > 0
          ? new Date(Math.max(...filteredOrders.map(o => new Date(o.createdAt).getTime())))
          : new Date();
        
        for (let d = new Date(startOfPeriod); d <= endOfPeriod; d.setDate(d.getDate() + 1)) {
          const dayOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.toDateString() === d.toDateString();
          });
          dailyData.push({
            month: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            total: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
          });
        }
        return dailyData.slice(0, 10); // Limit to 10 data points for readability
      }
    };
    
    // Generate hourly data from filtered orders
    const formatHour = (hour: number) => {
      if (hour === 0) return '12:00 AM';
      if (hour === 12) return '12:00 PM';
      if (hour < 12) return `${hour}:00 AM`;
      return `${hour - 12}:00 PM`;
    };

    const hourlyData = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getHours() === hour;
      });
      hourlyData.push({
        hour: formatHour(hour),
        total: hourOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      });
    }
    
    return {
      stats: {
        all_time_earning: totalRevenue,
        all_time_products_sold: totalOrders,
        this_month_sales: filteredRevenue,
        last_month_sales: previousRevenue,
        trend: trendPercent >= 0 ? 'up' : 'down',
        trend_percent: Math.abs(trendPercent),
        best_product: 'Iced Coffee',
        worst_product: 'Mac and Cheese',
        busiest_hour: '2:00 PM - 3:00 PM',
        slowest_hour: '6:00 AM - 7:00 AM',
        cashDrawerBalance: cashBalance,
        todayInflow: todayRevenue,
        todayOutflow: 0,
        todayNetFlow: todayRevenue,
        totalOrders: totalOrders,
        todayOrders: todayOrders.length,
        lowStockItems: 0,
        totalRevenue: filter === 'all' ? totalRevenue : filteredRevenue,
        filteredOrders: filteredOrders.length,
        filteredRevenue: filteredRevenue
      },
      monthly: getChartData(),
      hours: hourlyData,
      products: [
        { product: 'Iced Coffee', quantity: Math.floor(filteredOrders.length * 0.3) },
        { product: 'Hot Coffee', quantity: Math.floor(filteredOrders.length * 0.2) },
        { product: 'Fusion Matcha', quantity: Math.floor(filteredOrders.length * 0.15) },
        { product: 'Float Series', quantity: Math.floor(filteredOrders.length * 0.1) }
      ],
      all_time_daily: filteredOrders.map(order => ({
        date: order.createdAt || new Date().toISOString(),
        total: order.total || 0
      }))
    };
  },

  // Placeholder methods for other entities
  async getIngredients() { return []; },
  async getMaterials() { return []; },
  async createIngredient() { return {}; },
  async updateIngredient() { return {}; },
  async deleteIngredient() { return true; },
  async createMaterial() { return {}; },
  async updateMaterial() { return {}; },
  async deleteMaterial() { return true; },
  async updateStock() { return {}; }
};