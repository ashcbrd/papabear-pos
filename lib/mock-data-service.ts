// Mock data service for development/testing
let ordersStorage: any[] = [];

export const mockDataService = {
  async getProducts() {
    return [
      {
        id: "1",
        name: "Signature Coffee",
        category: "InsideBeverages",
        imageUrl: "https://images.unsplash.com/photo-1545665261-c7545c0e2640?w=400",
        flavors: [
          { id: "f1", name: "Original" },
          { id: "f2", name: "Vanilla" },
          { id: "f3", name: "Caramel" },
          { id: "f10", name: "Hazelnut" },
          { id: "f11", name: "Mocha" },
          { id: "f12", name: "Irish Cream" }
        ],
        sizes: [
          { id: "s1", name: "Medium", price: 120.00 },
          { id: "s2", name: "Large", price: 150.00 }
        ]
      },
      {
        id: "2", 
        name: "Premium Milk Tea",
        category: "InsideBeverages",
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
        flavors: [
          { id: "f4", name: "Original" },
          { id: "f5", name: "Chocolate" },
          { id: "f6", name: "Strawberry" },
          { id: "f7", name: "Matcha" },
          { id: "f13", name: "Taro" },
          { id: "f14", name: "Honeydew" },
          { id: "f15", name: "Mango" },
          { id: "f16", name: "Coconut" }
        ],
        sizes: [
          { id: "s3", name: "Medium", price: 99.00 },
          { id: "s4", name: "Large", price: 125.00 }
        ]
      },
      {
        id: "3",
        name: "Papa Bear Burger", 
        category: "InsideMeals",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
        flavors: [
          { id: "f8", name: "Original" },
          { id: "f9", name: "Spicy" }
        ],
        sizes: [
          { id: "s5", name: "Medium", price: 180.00 },
          { id: "s6", name: "Large", price: 220.00 }
        ]
      }
    ];
  },

  async getAddons() {
    return [
      { id: "a1", name: "Extra Cheese", price: 25.00 },
      { id: "a2", name: "Extra Shot", price: 15.00 },
      { id: "a3", name: "Whipped Cream", price: 20.00 }
    ];
  },

  async getOrders() {
    return ordersStorage;
  },

  async createOrder(orderData: any) {
    console.log('Creating order:', orderData);
    const newOrder = { 
      id: Date.now().toString(), 
      orderStatus: 'QUEUING',
      createdAt: new Date().toISOString(),
      ...orderData 
    };
    ordersStorage.push(newOrder);
    return newOrder;
  },

  async updateOrder(id: string, updates: any) {
    console.log('Updating order:', id, updates);
    const orderIndex = ordersStorage.findIndex(order => order.id === id);
    if (orderIndex !== -1) {
      ordersStorage[orderIndex] = { ...ordersStorage[orderIndex], ...updates };
      return ordersStorage[orderIndex];
    }
    return { id, ...updates };
  },

  async createProduct(product: any) {
    console.log('Creating product:', product);
    return { id: Date.now().toString(), ...product };
  },

  async updateProduct(id: string, product: any) {
    console.log('Updating product:', id, product);
    return { id, ...product };
  },

  async deleteProduct(id: string) {
    console.log('Deleting product:', id);
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

  async deleteOrder(id: string) {
    console.log('Deleting order:', id);
    const orderIndex = ordersStorage.findIndex(order => order.id === id);
    if (orderIndex !== -1) {
      ordersStorage.splice(orderIndex, 1);
      return true;
    }
    return false;
  },

  // Placeholder methods for other entities
  async getIngredients() { return []; },
  async getMaterials() { return []; },
  async getStock() { return []; },
  async getDashboardStats() { return {}; },
  async createIngredient() { return {}; },
  async updateIngredient() { return {}; },
  async deleteIngredient() { return true; },
  async createMaterial() { return {}; },
  async updateMaterial() { return {}; },
  async deleteMaterial() { return true; },
  async updateStock() { return {}; }
};