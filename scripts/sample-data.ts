// Sample data script - adds sample products, stock, and a test customer to demonstrate the platform
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  console.log('🌱 Adding sample products...');
  const branch104 = await db.branch.findUnique({ where: { code: 'SHOP-104' } });
  const warehouse104 = await db.warehouse.findFirst({ where: { branchId: branch104!.id } });

  if (!branch104 || !warehouse104) {
    throw new Error('Run main seed first: bun run scripts/seed.ts');
  }

  // Sample products with realistic data
  const samples = [
    {
      name: 'ASUS VivoBook 15 X515EA',
      sku: 'ASUS-VB15-X515EA',
      brandSlug: 'asus',
      categorySlug: 'laptops',
      model: 'X515EA',
      shortDescription: '15.6" FHD, Intel Core i3-1115G4, 4GB RAM, 256GB SSD',
      fullDescription: 'ASUS VivoBook 15 X515EA একটি বাজেট-ফ্রেন্ডলি ল্যাপটপ যা দৈনন্দিন কাজের জন্য আদর্শ। ইন্টেল 11তম জেন প্রসেসর এবং ফাস্ট SSD স্টোরেজ দিয়ে সাজানো এই ল্যাপটপ স্টুডেন্ট এবং প্রফেশনালদের জন্য পারফেক্ট।',
      sellingPrice: 48000,
      costPrice: 44000,
      minSellingPrice: 46000,
      warrantyMonths: 12,
      attributes: [
        { code: 'processor', valueString: 'Intel Core i3-1115G4' },
        { code: 'ram', valueString: '4GB DDR4' },
        { code: 'storage', valueString: '256GB SSD' },
        { code: 'screen_size', valueString: '15.6"' },
        { code: 'os', valueString: 'Windows 11 Home' },
      ],
      stock: 5,
    },
    {
      name: 'Logitech G102 Lightsync Gaming Mouse',
      sku: 'LOGI-G102-LIGHTSYNC',
      brandSlug: 'logitech',
      categorySlug: 'mice',
      model: 'G102',
      shortDescription: '8000 DPI, RGB Lightsync, 6 Programmable Buttons',
      fullDescription: 'Logitech G102 Lightsync একটি জনপ্রিয় গেমিং মাউস যা 8000 DPI সেন্সর এবং RGB লাইটিং অফার করে।',
      sellingPrice: 2200,
      costPrice: 1800,
      minSellingPrice: 2000,
      warrantyMonths: 24,
      attributes: [
        { code: 'dpi', valueNumber: 8000 },
        { code: 'buttons', valueNumber: 6 },
        { code: 'connection', valueString: 'Wired USB' },
      ],
      stock: 25,
    },
    {
      name: 'Corsair Vengeance LPX 16GB DDR4 3200MHz',
      sku: 'COR-VENG-16-3200',
      brandSlug: 'corsair',
      categorySlug: 'ram',
      model: 'CMK16GX4M1A3200C16',
      shortDescription: '16GB DDR4 3200MHz Desktop RAM',
      fullDescription: 'Corsair Vengeance LPX হাই-পারফরম্যান্স DDR4 মেমোরি মডিউল। গেমিং এবং কনটেন্ট ক্রিয়েশনের জন্য আদর্শ।',
      sellingPrice: 4500,
      costPrice: 3900,
      minSellingPrice: 4200,
      warrantyMonths: 60,
      attributes: [
        { code: 'type', valueString: 'DDR4' },
        { code: 'capacity', valueString: '16GB' },
        { code: 'speed', valueString: '3200MHz' },
      ],
      stock: 12,
    },
    {
      name: 'Samsung 980 Pro 1TB NVMe SSD',
      sku: 'SAM-980PRO-1TB',
      brandSlug: 'samsung',
      categorySlug: 'storage',
      model: 'MZ-V8P1T0',
      shortDescription: '1TB NVMe M.2 PCIe 4.0 SSD, Read 7000 MB/s',
      fullDescription: 'Samsung 980 Pro PCIe 4.0 NVMe SSD - অসাধারণ স্পিড এবং রিলায়েবিলিটি।',
      sellingPrice: 12500,
      costPrice: 11200,
      minSellingPrice: 12000,
      warrantyMonths: 36,
      attributes: [
        { code: 'type', valueString: 'NVMe SSD' },
        { code: 'capacity', valueString: '1TB' },
        { code: 'interface', valueString: 'PCIe 4.0' },
        { code: 'read_speed', valueString: '7000' },
      ],
      stock: 8,
    },
    {
      name: 'Logitech K380 Bluetooth Keyboard',
      sku: 'LOGI-K380-BT',
      brandSlug: 'logitech',
      categorySlug: 'keyboards',
      model: 'K380',
      shortDescription: 'Compact Bluetooth Multi-Device Keyboard',
      fullDescription: 'Logitech K380 একটি কম্প্যাক্ট Bluetooth কীবোর্ড যা একসাথে ৩টি ডিভাইসে কানেক্ট করা যায়।',
      sellingPrice: 3800,
      costPrice: 3300,
      minSellingPrice: 3600,
      warrantyMonths: 12,
      attributes: [
        { code: 'type', valueString: 'Membrane' },
        { code: 'connection', valueString: 'Bluetooth' },
      ],
      stock: 15,
    },
    {
      name: 'LG 24MK600M-B 24" IPS Monitor',
      sku: 'LG-24MK600M',
      brandSlug: 'lg',
      categorySlug: 'monitors',
      model: '24MK600M-B',
      shortDescription: '24" Full HD IPS Monitor, 75Hz, 5ms',
      fullDescription: 'LG 24MK600M-B 24" IPS মনিটর অফিস এবং হোম ইউজের জন্য চমৎকার।',
      sellingPrice: 15500,
      costPrice: 14000,
      minSellingPrice: 14800,
      warrantyMonths: 36,
      attributes: [
        { code: 'screen_size', valueNumber: 24 },
        { code: 'resolution', valueString: '1920x1080' },
        { code: 'refresh_rate', valueNumber: 75 },
        { code: 'panel_type', valueString: 'IPS' },
        { code: 'response_time', valueNumber: 5 },
      ],
      stock: 6,
    },
    {
      name: 'APC BR1500GI 1500VA UPS',
      sku: 'APC-BR1500GI',
      brandSlug: 'apc',
      categorySlug: 'ups',
      model: 'BR1500GI',
      shortDescription: '1500VA/865W Line-Interactive UPS with LCD',
      fullDescription: 'APC Back-UPS Pro 1500VA - পাওয়ার কাট এবং সার্জ থেকে কম্পিউটার সুরক্ষিত রাখুন।',
      sellingPrice: 18500,
      costPrice: 17000,
      minSellingPrice: 18000,
      warrantyMonths: 24,
      attributes: [
        { code: 'capacity', valueString: '1500VA' },
        { code: 'outlets', valueNumber: 8 },
        { code: 'type', valueString: 'Line-Interactive' },
      ],
      stock: 4,
    },
    {
      name: 'Intel Core i5-12400F 12th Gen Processor',
      sku: 'INTEL-I5-12400F',
      brandSlug: 'intel',
      categorySlug: 'processors',
      model: 'BX8071512400F',
      shortDescription: '6 Cores, 12 Threads, Up to 4.4GHz, LGA1700',
      fullDescription: 'Intel Core i5-12400F 12th জেন প্রসেসর - গেমিং এবং প্রোডাক্টিভিটির জন্য পারফেক্ট।',
      sellingPrice: 18500,
      costPrice: 17000,
      minSellingPrice: 18000,
      warrantyMonths: 36,
      attributes: [
        { code: 'socket', valueString: 'LGA1700' },
        { code: 'cores', valueNumber: 6 },
        { code: 'threads', valueNumber: 12 },
        { code: 'base_clock', valueNumber: 2.5 },
        { code: 'boost_clock', valueNumber: 4.4 },
        { code: 'tdp', valueNumber: 65 },
      ],
      stock: 10,
    },
  ];

  for (const sample of samples) {
    const existing = await db.product.findUnique({ where: { sku: sample.sku } });
    if (existing) {
      console.log(`  → ${sample.name} already exists, skipping`);
      continue;
    }

    const brand = await db.brand.findUnique({ where: { slug: sample.brandSlug } });
    const category = await db.category.findUnique({ where: { slug: sample.categorySlug } });
    if (!category) {
      console.log(`  ! Category ${sample.categorySlug} not found`);
      continue;
    }

    const slug = `${sample.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sample.sku.toLowerCase()}`;

    const product = await db.product.create({
      data: {
        name: sample.name,
        sku: sample.sku,
        slug,
        brandId: brand?.id || null,
        categoryId: category.id,
        model: sample.model,
        shortDescription: sample.shortDescription,
        fullDescription: sample.fullDescription,
        warrantyMonths: sample.warrantyMonths,
        status: 'PUBLISHED', // Auto-publish for demo
        sellingPrice: sample.sellingPrice,
        costPrice: sample.costPrice,
        minSellingPrice: sample.minSellingPrice,
        trackInventory: true,
        reorderThreshold: 5,
        isFeatured: true,
      },
    });

    // Add attribute values
    for (const attr of sample.attributes) {
      const catAttr = await db.categoryAttribute.findFirst({
        where: { categoryId: category.id, code: attr.code },
      });
      if (catAttr) {
        await db.productAttributeValue.create({
          data: {
            productId: product.id,
            categoryAttributeId: catAttr.id,
            valueString: (attr as any).valueString || null,
            valueNumber: (attr as any).valueNumber || null,
          },
        }).catch(() => {});
      }
    }

    // Add stock at branch 104 warehouse
    await db.inventory.create({
      data: {
        productId: product.id,
        branchId: branch104!.id,
        warehouseId: warehouse104!.id,
        quantityOnHand: sample.stock,
        quantityReserved: 0,
        quantityAvailable: sample.stock,
        valuationUnit: sample.costPrice,
        reorderThreshold: 5,
      },
    });

    // Record stock movement
    await db.stockMovement.create({
      data: {
        productId: product.id,
        branchId: branch104!.id,
        warehouseId: warehouse104!.id,
        quantity: sample.stock,
        movementType: 'PURCHASE_RECEIPT',
        referenceType: 'MANUAL_ADJUST',
        unitCost: sample.costPrice,
        reason: 'Initial stock for sample product',
      },
    });

    console.log(`  ✓ Created: ${sample.name} (Stock: ${sample.stock})`);
  }

  // Create a sample customer
  console.log('  → Creating sample customer...');
  const { hashPassword } = await import('../src/lib/security');
  const existingCustomer = await db.user.findUnique({ where: { email: 'customer@example.com' } });
  if (!existingCustomer) {
    const custUser = await db.user.create({
      data: {
        email: 'customer@example.com',
        name: 'Rahim Ahmed',
        phone: '01712345678',
        passwordHash: hashPassword('Customer@2026'),
        status: 'ACTIVE',
      },
    });
    const customerRole = await db.role.findUnique({ where: { name: 'CUSTOMER' } });
    if (customerRole) {
      await db.userRole.create({ data: { userId: custUser.id, roleId: customerRole.id } }).catch(() => {});
    }
    await db.customer.create({
      data: {
        userId: custUser.id,
        name: 'Rahim Ahmed',
        email: 'customer@example.com',
        phone: '01712345678',
        address: 'House 12, Road 5, Dhanmondi',
        city: 'Dhaka',
        district: 'Dhaka',
        marketingConsent: true,
        isVerified: true,
      },
    });
    console.log('  ✓ Customer: customer@example.com / Customer@2026');
  }

  console.log('✅ Sample data added!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
