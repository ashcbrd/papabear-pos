"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { androidDatabaseService } from './android-database';
import { mockDataService } from './mock-data-service';
import { sqliteDataService } from './sqlite-data-service';
import { dataMigration } from './data-migration';
import { initializeSampleData } from './seed-data';
import LoadingScreen from '@/components/loading-screen';

// Use Android database service for better performance and data integrity
const currentDataService = androidDatabaseService;

interface DataContextType {
  isInitialized: boolean;
  products: any[];
  addons: any[];
  ingredients: any[];
  materials: any[];
  orders: any[];
  stock: any[];
  flavors: any[];
  
  // Products
  loadProducts: () => Promise<void>;
  createProduct: (product: any) => Promise<void>;
  updateProduct: (id: string, product: any) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Addons
  loadAddons: () => Promise<void>;
  createAddon: (addon: any) => Promise<void>;
  updateAddon: (id: string, addon: any) => Promise<void>;
  deleteAddon: (id: string) => Promise<void>;
  
  // Ingredients
  loadIngredients: () => Promise<void>;
  createIngredient: (ingredient: any) => Promise<void>;
  updateIngredient: (id: string, ingredient: any) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
  
  // Materials
  loadMaterials: () => Promise<void>;
  createMaterial: (material: any) => Promise<void>;
  updateMaterial: (id: string, material: any) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  
  // Orders
  loadOrders: (filters?: any) => Promise<void>;
  createOrder: (order: any) => Promise<any>;
  updateOrder: (id: string, updates: any) => Promise<any>;
  deleteOrder: (id: string) => Promise<void>;
  
  // Stock
  loadStock: () => Promise<void>;
  updateStock: (id: string, quantity: number) => Promise<void>;
  
  // Flavors
  loadFlavors: () => Promise<void>;
  createFlavor: (flavor: any) => Promise<void>;
  updateFlavor: (id: string, flavor: any) => Promise<void>;
  deleteFlavor: (id: string) => Promise<void>;
  importPapaBearFlavors: () => Promise<number>;
  
  // Dashboard
  getDashboardStats: (filters?: any) => Promise<any>;
  
  // Cash Flow
  getCashFlowTransactions: (filters?: any) => Promise<any>;
  getCashFlowSummary: (period?: 'today' | 'week' | 'month') => Promise<any>;
  getCashDrawerBalance: () => Promise<any>;
  recordCashInflow: (data: any) => Promise<any>;
  recordCashOutflow: (data: any) => Promise<any>;
  addCashDeposit: (amount: number, description: string) => Promise<any>;
  recordExpense: (amount: number, description: string, itemsPurchased?: string) => Promise<any>;
  recordRefund: (orderId: string, amount: number, reason: string) => Promise<any>;
  setCashDrawerBalance: (newBalance: number, reason: string) => Promise<any>;
  adjustCashDrawer: (adjustment: number, reason: string) => Promise<any>;
  
  // Direct access to current data service
  currentDataService: any;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [flavors, setFlavors] = useState<any[]>([]);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      console.log('Starting data initialization...');
      
      // Check if migration is needed
      const dataExists = await dataMigration.checkDataExists();
      console.log('Data existence check:', dataExists);
      
      if (dataExists.localStorage && !dataExists.sqlite) {
        console.log('Migrating data from localStorage to SQLite...');
        const migrationResult = await dataMigration.migrateAllData();
        console.log('Migration result:', migrationResult);
        
        if (migrationResult.success) {
          console.log('Migration successful, clearing localStorage...');
          await dataMigration.clearLocalStorageData();
        }
      }
      
      // Load all data for admin functionality
      await loadProducts();
      await loadAddons();
      await loadOrders();
      await loadFlavors();
      await loadIngredients();
      await loadMaterials();
      
      // Set empty arrays for stock (will be managed internally)
      setStock([]);
      
      console.log('Data initialization complete');
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize data:', error);
      setIsInitialized(true);
    }
  };

  const loadProducts = async () => {
    try {
      console.log('Loading products from currentDataService...');
      const data = await currentDataService.getProducts();
      console.log('Products loaded from service:', data);
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const createProduct = async (product: any) => {
    try {
      const newProduct = await currentDataService.createProduct(product);
      setProducts(prev => [newProduct, ...prev]);
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, product: any) => {
    try {
      const updatedProduct = await currentDataService.updateProduct(id, product);
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await currentDataService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  };

  const loadAddons = async () => {
    try {
      const data = await currentDataService.getAddons();
      setAddons(data);
    } catch (error) {
      console.error('Failed to load addons:', error);
    }
  };

  const createAddon = async (addon: any) => {
    try {
      const newAddon = await currentDataService.createAddon(addon);
      setAddons(prev => [newAddon, ...prev]);
    } catch (error) {
      console.error('Failed to create addon:', error);
      throw error;
    }
  };

  const updateAddon = async (id: string, addon: any) => {
    try {
      const updatedAddon = await currentDataService.updateAddon(id, addon);
      setAddons(prev => prev.map(a => a.id === id ? updatedAddon : a));
    } catch (error) {
      console.error('Failed to update addon:', error);
      throw error;
    }
  };

  const deleteAddon = async (id: string) => {
    try {
      await currentDataService.deleteAddon(id);
      setAddons(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to delete addon:', error);
      throw error;
    }
  };

  const loadIngredients = async () => {
    try {
      const data = await currentDataService.getIngredients();
      setIngredients(data);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    }
  };

  const createIngredient = async (ingredient: any) => {
    try {
      const newIngredient = await currentDataService.createIngredient(ingredient);
      setIngredients(prev => [newIngredient, ...prev]);
    } catch (error) {
      console.error('Failed to create ingredient:', error);
      throw error;
    }
  };

  const updateIngredient = async (id: string, ingredient: any) => {
    try {
      const updatedIngredient = await currentDataService.updateIngredient(id, ingredient);
      setIngredients(prev => prev.map(i => i.id === id ? updatedIngredient : i));
    } catch (error) {
      console.error('Failed to update ingredient:', error);
      throw error;
    }
  };

  const deleteIngredient = async (id: string) => {
    try {
      await currentDataService.deleteIngredient(id);
      setIngredients(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      throw error;
    }
  };

  const loadMaterials = async () => {
    try {
      const data = await currentDataService.getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error('Failed to load materials:', error);
    }
  };

  const createMaterial = async (material: any) => {
    try {
      const newMaterial = await currentDataService.createMaterial(material);
      setMaterials(prev => [newMaterial, ...prev]);
    } catch (error) {
      console.error('Failed to create material:', error);
      throw error;
    }
  };

  const updateMaterial = async (id: string, material: any) => {
    try {
      const updatedMaterial = await currentDataService.updateMaterial(id, material);
      setMaterials(prev => prev.map(m => m.id === id ? updatedMaterial : m));
    } catch (error) {
      console.error('Failed to update material:', error);
      throw error;
    }
  };

  const deleteMaterial = async (id: string) => {
    try {
      await currentDataService.deleteMaterial(id);
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete material:', error);
      throw error;
    }
  };

  const loadStock = async () => {
    try {
      const data = await currentDataService.getStock();
      setStock(data);
    } catch (error) {
      console.error('Failed to load stock:', error);
    }
  };

  const updateStock = async (id: string, quantity: number) => {
    try {
      const updatedStock = await currentDataService.updateStock(id, quantity);
      setStock(prev => prev.map(item => item.id === id ? updatedStock : item));
    } catch (error) {
      console.error('Failed to update stock:', error);
      throw error;
    }
  };

  // Flavors CRUD operations
  const loadFlavors = async () => {
    try {
      console.log('🔄 Loading flavors...');
      // Ensure database is initialized before loading
      await currentDataService.initializeDatabase();
      const data = await currentDataService.getFlavors();
      console.log('✅ Loaded flavors:', data.length, 'items');
      setFlavors(data);
    } catch (error) {
      console.error('❌ Failed to load flavors:', error);
      // Fallback to empty array
      setFlavors([]);
    }
  };

  const createFlavor = async (flavor: any) => {
    try {
      console.log('🔄 Creating flavor:', flavor.name);
      // Ensure database is initialized before creating
      await currentDataService.initializeDatabase();
      const newFlavor = await currentDataService.createFlavor(flavor);
      if (newFlavor) {
        // Check if flavor already exists in local state to avoid duplicates
        const existsInState = flavors.some(f => f.id === newFlavor.id);
        if (!existsInState) {
          setFlavors(prev => [newFlavor, ...prev]);
          console.log('✅ Flavor created and added to state:', newFlavor.name);
        } else {
          console.log('✅ Flavor already exists in state:', newFlavor.name);
        }
      } else {
        throw new Error('Failed to create flavor - no data returned');
      }
    } catch (error) {
      console.error('❌ Failed to create flavor:', error);
      throw error;
    }
  };

  const updateFlavor = async (id: string, flavor: any) => {
    try {
      const updatedFlavor = await currentDataService.updateFlavor(id, flavor);
      if (updatedFlavor) {
        setFlavors(prev => prev.map(f => f.id === id ? updatedFlavor : f));
      } else {
        throw new Error('Failed to update flavor - no data returned');
      }
    } catch (error) {
      console.error('Failed to update flavor:', error);
      throw error;
    }
  };

  const deleteFlavor = async (id: string) => {
    try {
      console.log('🔄 Deleting flavor:', id);
      // Ensure database is initialized before deleting
      await currentDataService.initializeDatabase();
      const success = await currentDataService.deleteFlavor(id);
      
      // Always update state, regardless of database result (match deleteAddon pattern)
      setFlavors(prev => prev.filter(f => f.id !== id));
      
      if (success) {
        console.log('✅ Flavor deleted from database and state:', id);
      } else {
        console.log('⚠️ Flavor not found in database but removed from state:', id);
      }
    } catch (error) {
      console.error('❌ Failed to delete flavor:', error);
      throw error;
    }
  };

  // Order management functions
  const loadOrders = async (filters?: any) => {
    try {
      console.log('Loading orders...');
      const data = await currentDataService.getOrders(filters);
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    }
  };

  const createOrder = async (order: any) => {
    try {
      console.log('Creating order:', order);
      const newOrder = await currentDataService.createOrder(order);
      setOrders(prev => [newOrder, ...prev]);
      return newOrder;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  };

  const updateOrder = async (id: string, updates: any) => {
    try {
      console.log('Updating order:', id, updates);
      const updatedOrder = await currentDataService.updateOrder(id, updates);
      setOrders(prev => prev.map(o => o.id === id ? updatedOrder : o));
      return updatedOrder;
    } catch (error) {
      console.error('Failed to update order:', error);
      throw error;
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      console.log('Deleting order:', id);
      await currentDataService.deleteOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      console.error('Failed to delete order:', error);
      throw error;
    }
  };

  const getDashboardStats = async (filters?: any) => {
    try {
      console.log('Getting dashboard stats with filters:', filters);
      return await currentDataService.getDashboardStats(filters);
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      return null;
    }
  };

  const contextValue: DataContextType = {
    isInitialized,
    products,
    addons,
    ingredients,
    materials,
    orders,
    stock,
    flavors,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    loadAddons,
    createAddon,
    updateAddon,
    deleteAddon,
    loadIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    loadMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    loadOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    loadStock,
    updateStock,
    loadFlavors,
    createFlavor,
    updateFlavor,
    deleteFlavor,
    importPapaBearFlavors: currentDataService.importPapaBearFlavors,
    getDashboardStats,
    
    // Cash Flow methods
    getCashFlowTransactions: currentDataService.getCashFlowTransactions,
    getCashFlowSummary: currentDataService.getCashFlowSummary,
    getCashDrawerBalance: currentDataService.getCashDrawerBalance,
    recordCashInflow: currentDataService.recordCashInflow,
    recordCashOutflow: currentDataService.recordCashOutflow,
    addCashDeposit: currentDataService.addCashDeposit,
    recordExpense: currentDataService.recordExpense,
    recordRefund: currentDataService.recordRefund,
    setCashDrawerBalance: currentDataService.setCashDrawerBalance,
    adjustCashDrawer: currentDataService.adjustCashDrawer,
    
    // Direct access to current data service
    currentDataService
  };

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}