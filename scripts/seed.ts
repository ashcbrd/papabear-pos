// scripts/seed.ts
import { prisma } from "@/lib/prisma";

const run = async () => {
  // Step 1: Clean database
  await prisma.receipt.deleteMany();
  await prisma.orderItemAddon.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.variantIngredient.deleteMany();
  await prisma.variantMaterial.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.addon.deleteMany();
  await prisma.material.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.stock.deleteMany();

  // Step 2: Seed data
  const materialNames = [
    "Plastic Cup",
    "Paper Wrapper",
    "Toothpick",
    "Plastic Straw",
    "Sauce Container",
    "Wooden Stick",
    "Paper Plate",
    "Napkin",
    "Foil Wrap",
    "Plastic Bag",
  ];
  const ingredientNames = [
    "Egg",
    "Powdered Milk",
    "Tomato",
    "Coffee Beans",
    "Tapioca Pearls",
    "Hotdog Sausage",
    "Soy Sauce",
    "Ground Pork",
    "Chicken Leg",
    "Iced Tea Mix",
  ];
  const productList = [
    { name: "Burger", category: "OutsideSnacks" },
    { name: "Kwek-Kwek", category: "OutsideSnacks" },
    { name: "Fishball", category: "OutsideSnacks" },
    { name: "Coffee", category: "InsideBeverages" },
    { name: "Milk Tea", category: "InsideBeverages" },
    { name: "Hotdog", category: "OutsideSnacks" },
    { name: "Adobo Meal", category: "InsideMeals" },
    { name: "Spaghetti", category: "InsideMeals" },
    { name: "Fried Chicken", category: "InsideMeals" },
    { name: "Iced Tea", category: "InsideBeverages" },
  ];

  for (let i = 0; i < 10; i++) {
    // Create Addon
    await prisma.addon.create({
      data: {
        name: `Addon ${i + 1}`,
        price: 5 + i,
        stock: { create: { quantity: 100 } },
      },
    });

    // Create Material
    const isPackage = i % 2 === 0;
    const unitsPerPackage = 10 + i;
    const packagePrice = 50 + i;
    const pricePerPiece = isPackage ? packagePrice / unitsPerPackage : 5 + i;
    const material = await prisma.material.create({
      data: {
        name: materialNames[i],
        isPackage,
        unitsPerPackage: isPackage ? unitsPerPackage : null,
        packagePrice: isPackage ? packagePrice : null,
        pricePerPiece,
        stock: { create: { quantity: 100 } },
      },
    });

    // Create Ingredient
    const unitsPerPurchase = 4 + i;
    const pricePerPurchase = 20 + i;
    const pricePerUnit = pricePerPurchase / unitsPerPurchase;
    const ingredient = await prisma.ingredient.create({
      data: {
        name: ingredientNames[i],
        purchaseUnit: "pack",
        measurementUnit: "unit",
        unitsPerPurchase,
        pricePerPurchase,
        pricePerUnit,
        stock: { create: { quantity: 100 } },
      },
    });

    // Create Product and Variants
    const product = await prisma.product.create({
      data: {
        name: productList[i].name,
        category: productList[i].category as any,
        imageUrl: `/uploads/test${i + 1}.jpg`,
      },
    });

    const variantData = [
      { name: "general", price: 10 + i },
      { name: "small", price: 8 + i },
      { name: "large", price: 12 + i },
    ];

    for (const v of variantData) {
      const variant = await prisma.variant.create({
        data: {
          name: v.name,
          price: v.price,
          productId: product.id,
        },
      });

      // Attach variant-specific ingredients & materials
      await prisma.variantIngredient.create({
        data: {
          variantId: variant.id,
          ingredientId: ingredient.id,
          quantityUsed: 1 + (i % 3),
        },
      });
      await prisma.variantMaterial.create({
        data: {
          variantId: variant.id,
          materialId: material.id,
          quantityUsed: 2 + (i % 2),
        },
      });
    }
  }

  console.log("✅ Seeded products, variants, materials, and ingredients");

  // Step 3: Dummy Orders
  const allProducts = await prisma.product.findMany({
    include: { variants: true },
  });
  const allAddons = await prisma.addon.findMany();

  for (let i = 0; i < 5; i++) {
    const items = [];
    let total = 0;

    const numItems = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < numItems; j++) {
      const product =
        allProducts[Math.floor(Math.random() * allProducts.length)];
      const variant =
        product.variants[Math.floor(Math.random() * product.variants.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;

      let itemTotal = variant.price * quantity;
      const addons = [];

      for (let k = 0; k < Math.floor(Math.random() * 3); k++) {
        const addon = allAddons[Math.floor(Math.random() * allAddons.length)];
        const addonQty = Math.floor(Math.random() * 3) + 1;
        itemTotal += addon.price * addonQty;
        addons.push({ addonId: addon.id, quantity: addonQty });
      }

      total += itemTotal;

      items.push({
        productId: product.id,
        variantId: variant.id,
        quantity,
        addons: { create: addons },
      });
    }

    const order = await prisma.order.create({
      data: {
        total,
        paid: total + 10,
        change: 10,
        items: { create: items },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
            addons: { include: { addon: true } },
          },
        },
      },
    });

    await prisma.receipt.create({
      data: {
        orderId: order.id,
        content: {
          id: order.id,
          total: order.total,
          paid: order.paid,
          change: order.change,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            product: item.product.name,
            variant: item.variant.name,
            quantity: item.quantity,
            addons: item.addons.map((a) => ({
              name: a.addon.name,
              quantity: a.quantity,
            })),
          })),
        },
      },
    });
  }

  console.log("✅ Dummy orders and receipts created");
};

run().catch((e) => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
});
