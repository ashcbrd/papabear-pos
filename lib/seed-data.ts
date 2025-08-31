// Sample data to populate the mobile app on first run
export const sampleProducts = [
  {
    id: "prod-001",
    name: "Classic Burger",
    category: "InsideMeals" as const,
    imageUrl: "/uploads/burger.jpg",
    variants: [
      { id: "var-001", name: "Regular", price: 250.00 },
      { id: "var-002", name: "Large", price: 320.00 }
    ]
  },
  {
    id: "prod-002", 
    name: "Iced Coffee",
    category: "InsideBeverages" as const,
    imageUrl: "/uploads/coffee.jpg",
    variants: [
      { id: "var-003", name: "Small", price: 120.00 },
      { id: "var-004", name: "Large", price: 150.00 }
    ]
  },
  {
    id: "prod-003",
    name: "French Fries", 
    category: "OutsideSnacks" as const,
    imageUrl: "/uploads/fries.jpg",
    variants: [
      { id: "var-005", name: "Regular", price: 80.00 },
      { id: "var-006", name: "Large", price: 120.00 }
    ]
  },
  {
    id: "prod-004",
    name: "Chicken Sandwich",
    category: "InsideMeals" as const,
    imageUrl: "/uploads/sandwich.jpg", 
    variants: [
      { id: "var-007", name: "Regular", price: 280.00 },
      { id: "var-008", name: "Deluxe", price: 350.00 }
    ]
  },
  {
    id: "prod-005",
    name: "Fresh Orange Juice",
    category: "InsideBeverages" as const,
    imageUrl: "/uploads/orange.jpg",
    variants: [
      { id: "var-009", name: "Regular", price: 100.00 }
    ]
  }
];

export const sampleAddons = [
  { id: "addon-001", name: "Extra Cheese", price: 25.00 },
  { id: "addon-002", name: "Bacon", price: 40.00 },
  { id: "addon-003", name: "Avocado", price: 35.00 },
  { id: "addon-004", name: "Extra Shot", price: 20.00 },
  { id: "addon-005", name: "Whipped Cream", price: 15.00 }
];

export const sampleIngredients = [
  {
    id: "ing-001",
    name: "Ground Beef",
    measurementUnit: "kg",
    unitsPerPurchase: 5,
    pricePerPurchase: 1500.00,
    pricePerUnit: 300.00
  },
  {
    id: "ing-002", 
    name: "Coffee Beans",
    measurementUnit: "kg",
    unitsPerPurchase: 2,
    pricePerPurchase: 800.00,
    pricePerUnit: 400.00
  },
  {
    id: "ing-003",
    name: "Potatoes",
    measurementUnit: "kg", 
    unitsPerPurchase: 10,
    pricePerPurchase: 200.00,
    pricePerUnit: 20.00
  }
];

export const sampleMaterials = [
  {
    id: "mat-001",
    name: "Paper Cup",
    pricePerPiece: 5.00,
    isPackage: true,
    packagePrice: 250.00,
    unitsPerPackage: 50
  },
  {
    id: "mat-002",
    name: "Food Container",
    pricePerPiece: 8.00,
    isPackage: true, 
    packagePrice: 400.00,
    unitsPerPackage: 50
  },
  {
    id: "mat-003",
    name: "Napkins",
    pricePerPiece: 1.00,
    isPackage: true,
    packagePrice: 100.00,
    unitsPerPackage: 100
  }
];

export const sampleStock = [
  { id: "stock-001", quantity: 25, addonId: "addon-001" },
  { id: "stock-002", quantity: 15, addonId: "addon-002" },
  { id: "stock-003", quantity: 12, addonId: "addon-003" },
  { id: "stock-004", quantity: 30, ingredientId: "ing-001" },
  { id: "stock-005", quantity: 10, ingredientId: "ing-002" },
  { id: "stock-006", quantity: 50, ingredientId: "ing-003" },
  { id: "stock-007", quantity: 100, materialId: "mat-001" },
  { id: "stock-008", quantity: 75, materialId: "mat-002" },
  { id: "stock-009", quantity: 200, materialId: "mat-003" }
];

export async function initializeSampleData(databaseService: any) {
  try {
    // Check if data already exists
    const existingProducts = await databaseService.getProducts();
    if (existingProducts.length > 0) {
      console.log('Sample data already initialized');
      return;
    }

    console.log('Initializing sample data...');

    // Create sample products
    for (const product of sampleProducts) {
      await databaseService.createProduct(product);
    }

    // Create sample addons
    for (const addon of sampleAddons) {
      await databaseService.createAddon(addon);
    }

    // Create sample ingredients
    for (const ingredient of sampleIngredients) {
      await databaseService.createIngredient(ingredient);
    }

    // Create sample materials  
    for (const material of sampleMaterials) {
      await databaseService.createMaterial(material);
    }

    console.log('Sample data initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize sample data:', error);
  }
}