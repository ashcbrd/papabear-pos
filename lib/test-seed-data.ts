import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedTestData() {
  try {
    // Create some test products with flavors and sizes
    const coffeeProduct = await prisma.product.create({
      data: {
        name: "Signature Coffee",
        category: "InsideBeverages",
        imageUrl: "https://images.unsplash.com/photo-1545665261-c7545c0e2640",
        flavors: {
          create: [
            { name: "Original" },
            { name: "Vanilla" },
            { name: "Caramel" }
          ]
        },
        sizes: {
          create: [
            { name: "Medium", price: 120.00 },
            { name: "Large", price: 150.00 }
          ]
        }
      }
    });

    const milkteaProduct = await prisma.product.create({
      data: {
        name: "Premium Milk Tea",
        category: "InsideBeverages", 
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96",
        flavors: {
          create: [
            { name: "Original" },
            { name: "Chocolate" },
            { name: "Strawberry" },
            { name: "Matcha" }
          ]
        },
        sizes: {
          create: [
            { name: "Medium", price: 99.00 },
            { name: "Large", price: 125.00 }
          ]
        }
      }
    });

    const burgerProduct = await prisma.product.create({
      data: {
        name: "Papa Bear Burger",
        category: "InsideMeals",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
        flavors: {
          create: [
            { name: "Original" },
            { name: "Spicy" }
          ]
        },
        sizes: {
          create: [
            { name: "Medium", price: 180.00 },
            { name: "Large", price: 220.00 }
          ]
        }
      }
    });

    // Create some addons
    await prisma.addon.create({
      data: {
        name: "Extra Cheese",
        price: 25.00
      }
    });

    await prisma.addon.create({
      data: {
        name: "Extra Shot",
        price: 15.00
      }
    });

    await prisma.addon.create({
      data: {
        name: "Whipped Cream",
        price: 20.00
      }
    });

    console.log('Test data seeded successfully!');
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedTestData();
}