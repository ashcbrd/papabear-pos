import { sqliteDataService } from "./sqlite-data-service";

// Papa Bear Initial Products and Flavors Data
export const PAPA_BEAR_INITIAL_DATA = {
  flavors: [
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
  ],

  products: [
    // Inside Beverages
    {
      name: "Hot Coffee",
      category: "InsideBeverages",
      flavors: ["Americano", "Mocha", "Spanish Latte", "Caramel Macchiato"],
      sizes: [
        { name: "8oz", price: 45 },
        { name: "12oz", price: 55 },
      ],
    },
    {
      name: "Iced Coffee",
      category: "InsideBeverages",
      flavors: ["Americano", "Mocha", "Spanish Latte", "Caramel Macchiato"],
      sizes: [
        { name: "Medium", price: 50 },
        { name: "Large", price: 65 },
      ],
    },
    {
      name: "Hot Chocolate",
      category: "InsideBeverages",
      flavors: ["Hot Choco", "Chocolate"],
      sizes: [
        { name: "8oz", price: 50 },
        { name: "12oz", price: 60 },
      ],
    },
    {
      name: "Matcha Drinks",
      category: "InsideBeverages",
      flavors: [
        "Matcha Latte",
        "Matcha Caramel",
        "Mango Matcha Latte",
        "Strawberry Matcha Latte",
        "Blueberry Matcha Latte",
        "Matcha Float",
      ],
      sizes: [
        { name: "Medium", price: 70 },
        { name: "Large", price: 85 },
      ],
    },
    {
      name: "Specialty Floats",
      category: "InsideBeverages",
      flavors: [
        "Coffee Float",
        "Strawberry Float",
        "Blueberry Float",
        "Sprite Float",
        "Coke Float",
        "Matcha Float",
      ],
      sizes: [
        { name: "Medium", price: 65 },
        { name: "Large", price: 80 },
      ],
    },
    {
      name: "Fruit Drinks",
      category: "InsideBeverages",
      flavors: [
        "Kiwi Will Rock You",
        "Blueberry Licious",
        "Tipsy Strawberry",
        "Edi Wow Grape",
        "Mango Tango",
      ],
      sizes: [
        { name: "Medium", price: 60 },
        { name: "Large", price: 75 },
      ],
    },
    {
      name: "Lemonades",
      category: "InsideBeverages",
      flavors: [
        "Lemonade",
        "Tropical Berry Lemon",
        "Kiwi Lemonade",
        "Honey Lemon",
      ],
      sizes: [
        { name: "Medium", price: 55 },
        { name: "Large", price: 70 },
      ],
    },

    // Inside Meals
    {
      name: "Pasta",
      category: "InsideMeals",
      flavors: ["Creamy Vanilla", "Red Velvet", "Chocolate"],
      sizes: [{ name: "Single", price: 120 }],
    },
    {
      name: "Rice Meals",
      category: "InsideMeals",
      flavors: ["Original"],
      sizes: [{ name: "Single", price: 110 }],
    },
    {
      name: "Sandwiches",
      category: "InsideMeals",
      flavors: ["Original"],
      sizes: [{ name: "Single", price: 85 }],
    },

    // Outside Snacks
    {
      name: "Milk Tea",
      category: "OutsideSnacks",
      flavors: [
        "Okinawa",
        "Taro",
        "Wintermelon",
        "Red Velvet",
        "Cookies and Cream",
      ],
      sizes: [
        { name: "Medium", price: 60 },
        { name: "Large", price: 75 },
      ],
    },
    {
      name: "Graham Shakes",
      category: "OutsideSnacks",
      flavors: [
        "Blueberry Graham",
        "Mango Graham",
        "Avocado Graham",
        "Cookies and Cream Graham",
      ],
      sizes: [
        { name: "Medium", price: 75 },
        { name: "Large", price: 90 },
      ],
    },
    {
      name: "S'mores Drinks",
      category: "OutsideSnacks",
      flavors: [
        "Dark Chocolate S'mores",
        "Matcha S'mores",
        "Red Velvet S'mores",
        "Caramel Macchiato S'mores",
        "Cookies and Cream S'mores",
      ],
      sizes: [
        { name: "Medium", price: 85 },
        { name: "Large", price: 100 },
      ],
    },
    {
      name: "Specialty Dessert Drinks",
      category: "OutsideSnacks",
      flavors: [
        "Mango Cheesecake",
        "Tiramisu",
        "Honeycomb Latte",
        "Minty Matcha",
        "Choco Mint",
      ],
      sizes: [
        { name: "Medium", price: 80 },
        { name: "Large", price: 95 },
      ],
    },
  ],

  materials: [
    // Coffee and Beverage Materials
    {
      name: "Coffee Beans",
      pricePerPiece: 2.5,
      isPackage: true,
      packagePrice: 500,
      unitsPerPackage: 200,
      stockQuantity: 1000,
    },
    {
      name: "Milk",
      pricePerPiece: 0.5,
      isPackage: true,
      packagePrice: 80,
      unitsPerPackage: 160,
      stockQuantity: 500,
    },
    {
      name: "Sugar",
      pricePerPiece: 0.1,
      isPackage: true,
      packagePrice: 45,
      unitsPerPackage: 450,
      stockQuantity: 800,
    },
    {
      name: "Whipped Cream",
      pricePerPiece: 1.0,
      isPackage: true,
      packagePrice: 120,
      unitsPerPackage: 120,
      stockQuantity: 200,
    },
    {
      name: "Chocolate Syrup",
      pricePerPiece: 0.8,
      isPackage: true,
      packagePrice: 150,
      unitsPerPackage: 188,
      stockQuantity: 150,
    },
    {
      name: "Matcha Powder",
      pricePerPiece: 3.0,
      isPackage: true,
      packagePrice: 300,
      unitsPerPackage: 100,
      stockQuantity: 200,
    },
    {
      name: "Ice",
      pricePerPiece: 0.05,
      isPackage: true,
      packagePrice: 25,
      unitsPerPackage: 500,
      stockQuantity: 2000,
    },

    // Meal Materials
    {
      name: "Pasta Noodles",
      pricePerPiece: 8.0,
      isPackage: true,
      packagePrice: 400,
      unitsPerPackage: 50,
      stockQuantity: 100,
    },
    {
      name: "Rice",
      pricePerPiece: 0.5,
      isPackage: true,
      packagePrice: 150,
      unitsPerPackage: 300,
      stockQuantity: 600,
    },
    {
      name: "Bread",
      pricePerPiece: 3.5,
      isPackage: true,
      packagePrice: 105,
      unitsPerPackage: 30,
      stockQuantity: 60,
    },
    {
      name: "Cheese",
      pricePerPiece: 2.0,
      isPackage: true,
      packagePrice: 200,
      unitsPerPackage: 100,
      stockQuantity: 150,
    },

    // Cups and Packaging
    {
      name: "8oz Cups",
      pricePerPiece: 2.0,
      isPackage: true,
      packagePrice: 200,
      unitsPerPackage: 100,
      stockQuantity: 300,
    },
    {
      name: "12oz Cups",
      pricePerPiece: 2.5,
      isPackage: true,
      packagePrice: 250,
      unitsPerPackage: 100,
      stockQuantity: 300,
    },
    {
      name: "Medium Cups",
      pricePerPiece: 2.2,
      isPackage: true,
      packagePrice: 220,
      unitsPerPackage: 100,
      stockQuantity: 400,
    },
    {
      name: "Large Cups",
      pricePerPiece: 3.0,
      isPackage: true,
      packagePrice: 300,
      unitsPerPackage: 100,
      stockQuantity: 400,
    },
    {
      name: "Lids",
      pricePerPiece: 0.5,
      isPackage: true,
      packagePrice: 100,
      unitsPerPackage: 200,
      stockQuantity: 800,
    },
    {
      name: "Straws",
      pricePerPiece: 0.2,
      isPackage: true,
      packagePrice: 50,
      unitsPerPackage: 250,
      stockQuantity: 1000,
    },
  ],

  ingredients: [
    // Flavor Syrups and Extracts
    {
      name: "Vanilla Extract",
      measurementUnit: "ml",
      unitsPerPurchase: 100,
      pricePerPurchase: 180,
      stockQuantity: 300,
    },
    {
      name: "Caramel Syrup",
      measurementUnit: "ml",
      unitsPerPurchase: 200,
      pricePerPurchase: 220,
      stockQuantity: 400,
    },
    {
      name: "Strawberry Syrup",
      measurementUnit: "ml",
      unitsPerPurchase: 200,
      pricePerPurchase: 200,
      stockQuantity: 300,
    },
    {
      name: "Blueberry Syrup",
      measurementUnit: "ml",
      unitsPerPurchase: 200,
      pricePerPurchase: 210,
      stockQuantity: 250,
    },
    {
      name: "Mango Syrup",
      measurementUnit: "ml",
      unitsPerPurchase: 200,
      pricePerPurchase: 200,
      stockQuantity: 300,
    },
    {
      name: "Chocolate Powder",
      measurementUnit: "g",
      unitsPerPurchase: 500,
      pricePerPurchase: 350,
      stockQuantity: 800,
    },
    {
      name: "Cinnamon Powder",
      measurementUnit: "g",
      unitsPerPurchase: 100,
      pricePerPurchase: 120,
      stockQuantity: 200,
    },

    // Protein and Meal Ingredients
    {
      name: "Chicken",
      measurementUnit: "kg",
      unitsPerPurchase: 1,
      pricePerPurchase: 180,
      stockQuantity: 5,
    },
    {
      name: "Ground Beef",
      measurementUnit: "kg",
      unitsPerPurchase: 1,
      pricePerPurchase: 320,
      stockQuantity: 3,
    },
    {
      name: "Eggs",
      measurementUnit: "piece",
      unitsPerPurchase: 30,
      pricePerPurchase: 180,
      stockQuantity: 60,
    },
    {
      name: "Onions",
      measurementUnit: "kg",
      unitsPerPurchase: 1,
      pricePerPurchase: 80,
      stockQuantity: 10,
    },
    {
      name: "Garlic",
      measurementUnit: "kg",
      unitsPerPurchase: 0.5,
      pricePerPurchase: 150,
      stockQuantity: 2,
    },

    // Toppings and Extras
    {
      name: "Whipped Cream Topping",
      measurementUnit: "g",
      unitsPerPurchase: 200,
      pricePerPurchase: 150,
      stockQuantity: 400,
    },
    {
      name: "Chocolate Chips",
      measurementUnit: "g",
      unitsPerPurchase: 250,
      pricePerPurchase: 200,
      stockQuantity: 500,
    },
    {
      name: "Marshmallows",
      measurementUnit: "piece",
      unitsPerPurchase: 100,
      pricePerPurchase: 120,
      stockQuantity: 300,
    },
    {
      name: "Graham Crackers",
      measurementUnit: "piece",
      unitsPerPurchase: 50,
      pricePerPurchase: 100,
      stockQuantity: 150,
    },
  ],

  addons: [
    { name: "Extra Shot", price: 15, stockQuantity: 1000 },
    { name: "Extra Whip", price: 10, stockQuantity: 500 },
    { name: "Extra Syrup", price: 8, stockQuantity: 800 },
    { name: "Oat Milk", price: 12, stockQuantity: 300 },
    { name: "Almond Milk", price: 15, stockQuantity: 200 },
    { name: "Extra Hot", price: 0, stockQuantity: 9999 },
    { name: "Extra Cold", price: 0, stockQuantity: 9999 },
    { name: "Less Sweet", price: 0, stockQuantity: 9999 },
    { name: "Extra Sweet", price: 5, stockQuantity: 500 },
  ],
};

export class InitialDataImporter {
  private static IMPORT_STATUS_KEY = "papabear_initial_import_completed";

  static isImportCompleted(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(this.IMPORT_STATUS_KEY) === "true";
  }

  static markImportCompleted(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.IMPORT_STATUS_KEY, "true");
  }

  static async importAllData(): Promise<{
    success: boolean;
    summary: any;
    errors: string[];
  }> {
    const errors: string[] = [];
    const summary = {
      flavors: { imported: 0, total: 0 },
      materials: { imported: 0, total: 0 },
      ingredients: { imported: 0, total: 0 },
      addons: { imported: 0, total: 0 },
      products: { imported: 0, total: 0 },
    };

    try {
      console.log("Starting Papa Bear initial data import...");

      // Import flavors first (required for products)
      console.log("Importing flavors...");
      summary.flavors.total = PAPA_BEAR_INITIAL_DATA.flavors.length;
      for (const flavorName of PAPA_BEAR_INITIAL_DATA.flavors) {
        try {
          await sqliteDataService.createFlavor({ name: flavorName });
          summary.flavors.imported++;
        } catch (error) {
          errors.push(`Failed to import flavor "${flavorName}": ${error}`);
        }
      }

      // Import materials
      console.log("Importing materials...");
      summary.materials.total = PAPA_BEAR_INITIAL_DATA.materials.length;
      for (const material of PAPA_BEAR_INITIAL_DATA.materials) {
        try {
          await sqliteDataService.createMaterial(material);
          summary.materials.imported++;
        } catch (error) {
          errors.push(`Failed to import material "${material.name}": ${error}`);
        }
      }

      // Import ingredients
      console.log("Importing ingredients...");
      summary.ingredients.total = PAPA_BEAR_INITIAL_DATA.ingredients.length;
      for (const ingredient of PAPA_BEAR_INITIAL_DATA.ingredients) {
        try {
          await sqliteDataService.createIngredient(ingredient);
          summary.ingredients.imported++;
        } catch (error) {
          errors.push(
            `Failed to import ingredient "${ingredient.name}": ${error}`
          );
        }
      }

      // Import addons
      console.log("Importing addons...");
      summary.addons.total = PAPA_BEAR_INITIAL_DATA.addons.length;
      for (const addon of PAPA_BEAR_INITIAL_DATA.addons) {
        try {
          await sqliteDataService.createAddon(addon);
          summary.addons.imported++;
        } catch (error) {
          errors.push(`Failed to import addon "${addon.name}": ${error}`);
        }
      }

      // Import products (after flavors are imported)
      console.log("Importing products...");
      summary.products.total = PAPA_BEAR_INITIAL_DATA.products.length;
      for (const product of PAPA_BEAR_INITIAL_DATA.products) {
        try {
          await sqliteDataService.createProduct(product);
          summary.products.imported++;
        } catch (error) {
          errors.push(`Failed to import product "${product.name}": ${error}`);
        }
      }

      // Mark import as completed
      this.markImportCompleted();

      console.log("Initial data import completed:", summary);
      return { success: errors.length === 0, summary, errors };
    } catch (error) {
      console.error("Initial data import failed:", error);
      return {
        success: false,
        summary,
        errors: [`Import failed: ${error}`],
      };
    }
  }
}
