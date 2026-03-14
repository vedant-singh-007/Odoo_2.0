import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create Users
  const managerHash = await bcrypt.hash("manager123", 12);
  const staffHash = await bcrypt.hash("staff123", 12);

  const manager = await prisma.user.upsert({
    where: { email: "manager@coreinventory.com" },
    update: {},
    create: {
      name: "Alice Manager",
      loginId: "manager1",
      email: "manager@coreinventory.com",
      passwordHash: managerHash,
      role: "MANAGER",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@coreinventory.com" },
    update: {},
    create: {
      name: "Bob Staff",
      loginId: "staff1",
      email: "staff@coreinventory.com",
      passwordHash: staffHash,
      role: "STAFF",
    },
  });

  // Create Locations
  const vendorLoc = await prisma.location.create({
    data: { name: "Suppliers / Vendors", type: "VENDOR" },
  });

  const mainWarehouse = await prisma.location.create({
    data: { name: "Main Warehouse", type: "INTERNAL" },
  });

  const productionRack = await prisma.location.create({
    data: { name: "Production Rack", type: "INTERNAL" },
  });

  const storageB = await prisma.location.create({
    data: { name: "Storage B", type: "INTERNAL" },
  });

  const customerLoc = await prisma.location.create({
    data: { name: "Customers", type: "CUSTOMER" },
  });

  const virtualLoss = await prisma.location.create({
    data: { name: "Inventory Loss / Adjustment", type: "VIRTUAL_LOSS" },
  });

  // Create Products
  const steel = await prisma.product.create({
    data: {
      name: "Steel Rods",
      skuCode: "STL-001",
      category: "Raw Materials",
      unitOfMeasure: "kg",
      reorderLevel: 50,
    },
  });

  const bolts = await prisma.product.create({
    data: {
      name: "Hex Bolts M10",
      skuCode: "BLT-002",
      category: "Fasteners",
      unitOfMeasure: "pcs",
      reorderLevel: 200,
    },
  });

  const paint = await prisma.product.create({
    data: {
      name: "Industrial Paint Blue",
      skuCode: "PNT-003",
      category: "Finishing",
      unitOfMeasure: "liters",
      reorderLevel: 20,
    },
  });

  const bearings = await prisma.product.create({
    data: {
      name: "Ball Bearings 6205",
      skuCode: "BRG-004",
      category: "Components",
      unitOfMeasure: "pcs",
      reorderLevel: 100,
    },
  });

  const copper = await prisma.product.create({
    data: {
      name: "Copper Wire 2.5mm",
      skuCode: "COP-005",
      category: "Raw Materials",
      unitOfMeasure: "meters",
      reorderLevel: 500,
    },
  });

  // Create a sample Receipt operation: Receive 100kg Steel
  const receipt = await prisma.stockOperation.create({
    data: {
      type: "RECEIPT",
      status: "DONE",
      reference: "REC-001",
      notes: "Initial steel stock from supplier",
      createdById: manager.id,
      moves: {
        create: [
          {
            productId: steel.id,
            sourceLocationId: vendorLoc.id,
            destLocationId: mainWarehouse.id,
            quantity: 100,
          },
        ],
      },
    },
  });

  // Receive bolts and bearings
  await prisma.stockOperation.create({
    data: {
      type: "RECEIPT",
      status: "DONE",
      reference: "REC-002",
      notes: "Fasteners and components received",
      createdById: manager.id,
      moves: {
        create: [
          {
            productId: bolts.id,
            sourceLocationId: vendorLoc.id,
            destLocationId: mainWarehouse.id,
            quantity: 500,
          },
          {
            productId: bearings.id,
            sourceLocationId: vendorLoc.id,
            destLocationId: mainWarehouse.id,
            quantity: 250,
          },
        ],
      },
    },
  });

  // Internal Transfer: Move 30kg steel to Production Rack
  await prisma.stockOperation.create({
    data: {
      type: "TRANSFER",
      status: "DONE",
      reference: "TRF-001",
      notes: "Steel moved to production",
      createdById: staff.id,
      moves: {
        create: [
          {
            productId: steel.id,
            sourceLocationId: mainWarehouse.id,
            destLocationId: productionRack.id,
            quantity: 30,
          },
        ],
      },
    },
  });

  // Delivery: Ship 20 steel to customer
  await prisma.stockOperation.create({
    data: {
      type: "DELIVERY",
      status: "DONE",
      reference: "DEL-001",
      notes: "Steel frames delivered to customer",
      createdById: manager.id,
      moves: {
        create: [
          {
            productId: steel.id,
            sourceLocationId: mainWarehouse.id,
            destLocationId: customerLoc.id,
            quantity: 20,
          },
        ],
      },
    },
  });

  // Adjustment: 3kg steel damaged
  await prisma.stockOperation.create({
    data: {
      type: "ADJUSTMENT",
      status: "DONE",
      reference: "ADJ-001",
      notes: "3kg steel damaged during handling",
      createdById: manager.id,
      moves: {
        create: [
          {
            productId: steel.id,
            sourceLocationId: mainWarehouse.id,
            destLocationId: virtualLoss.id,
            quantity: 3,
          },
        ],
      },
    },
  });

  // Pending receipt (DRAFT)
  await prisma.stockOperation.create({
    data: {
      type: "RECEIPT",
      status: "DRAFT",
      reference: "REC-003",
      notes: "Paint order pending delivery",
      createdById: manager.id,
      moves: {
        create: [
          {
            productId: paint.id,
            sourceLocationId: vendorLoc.id,
            destLocationId: mainWarehouse.id,
            quantity: 50,
          },
        ],
      },
    },
  });

  // Pending delivery (READY)
  await prisma.stockOperation.create({
    data: {
      type: "DELIVERY",
      status: "READY",
      reference: "DEL-002",
      notes: "Bolts delivery scheduled",
      createdById: staff.id,
      moves: {
        create: [
          {
            productId: bolts.id,
            sourceLocationId: mainWarehouse.id,
            destLocationId: customerLoc.id,
            quantity: 50,
          },
        ],
      },
    },
  });

  console.log("✅ Seed data created successfully!");
  console.log(`  Users: ${manager.name}, ${staff.name}`);
  console.log(`  Locations: 6 created`);
  console.log(`  Products: 5 created`);
  console.log(`  Operations: 7 created (including demo flows)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
