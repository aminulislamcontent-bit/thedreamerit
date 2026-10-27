// Sample data script v2 - with REAL product images from Z.ai image search
import { PrismaClient } from '@prisma/client';
import { PRODUCT_IMAGES } from '../src/lib/images';
const db = new PrismaClient();

async function main() {
  console.log('🌱 Adding sample products with real images...');
  const branch104 = await db.branch.findUnique({ where: { code: 'SHOP-104' } });
  const warehouse104 = await db.warehouse.findFirst({ where: { branchId: branch104!.id } });

  if (!branch104 || !warehouse104) {
    throw new Error('Run main seed first: bun run scripts/seed.ts');
  }

  const samples = [
    {
      name: 'ASUS VivoBook 15 X515EA',
      sku: 'ASUS-VB15-X515EA',
      brandSlug: 'asus',
      categorySlug: 'laptops',
      model: 'X515EA',
      shortDescription: '15.6" FHD, Intel Core i3-1115G4, 4GB RAM, 256GB SSD',
      fullDescription: 'ASUS VivoBook 15 X515EA একটি বাজেট-ফ্রেন্ডলি ল্যাপটপ যা দৈনন্দিন কাজের জন্য আদর্শ। ইন্টেল 11তম জেন প্রসেসর এবং ফাস্ট SSD স্টোরেজ দিয়ে সাজানো এই ল্যাপটপ স্টুডেন্ট এবং প্রফেশনালদের জন্য পারফেক্ট।\n\nবৈশিষ্ট্য:\n• 15.6" FHD anti-glare display\n• Intel Core i3-1115G4 (6MB Cache, up to 4.1GHz)\n• 4GB DDR4 RAM (expandable up to 20GB)\n• 256GB PCIe NVMe SSD\n• Intel UHD Graphics\n• Windows 11 Home\n• 1.8 kg lightweight design\n• Backlit chiclet keyboard\n• Fingerprint sensor\n• 3-cell 37WHrs battery',
      sellingPrice: 48000,
      costPrice: 44000,
      compareAtPrice: 52000,
      minSellingPrice: 46000,
      warrantyMonths: 12,
      isFeatured: true,
      images: PRODUCT_IMAGES.asusVivobot || PRODUCT_IMAGES.asusVivobook,
      attributes: [
        { code: 'processor', valueString: 'Intel Core i3-1115G4' },
        { code: 'ram', valueString: '4GB DDR4' },
        { code: 'storage', valueString: '256GB SSD' },
        { code: 'screen_size', valueString: '15.6"' },
        { code: 'os', valueString: 'Windows 11 Home' },
        { code: 'battery', valueString: '37WHrs' },
        { code: 'weight', valueNumber: 1.8 },
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
      fullDescription: 'Logitech G102 Lightsync একটি জনপ্রিয় গেমিং মাউস যা 8000 DPI সেন্সর এবং RGB লাইটিং অফার করে।\n\nবৈশিষ্ট্য:\n• 8000 DPI sensor (200-8000 adjustable)\n• Lightsync RGB lighting\n• 6 programmable buttons\n• Mechanical button tensioning\n• 5 on-board memory profiles\n• USB wired connection\n• Lightweight design (85g)\n• 2-year warranty',
      sellingPrice: 2200,
      costPrice: 1800,
      compareAtPrice: 2500,
      minSellingPrice: 2000,
      warrantyMonths: 24,
      isFeatured: true,
      images: PRODUCT_IMAGES.logitechG102,
      attributes: [
        { code: 'dpi', valueNumber: 8000 },
        { code: 'buttons', valueNumber: 6 },
        { code: 'connection', valueString: 'Wired USB' },
        { code: 'sensor_type', valueString: 'Optical' },
      ],
      stock: 25,
    },
    {
      name: 'Corsair Vengeance LPX 16GB DDR4 3200MHz',
      sku: 'COR-VENG-16-3200',
      brandSlug: 'corsair',
      categorySlug: 'ram',
      model: 'CMK16GX4M1A3200C16',
      shortDescription: '16GB DDR4 3200MHz Desktop RAM, CL16, 1.35V',
      fullDescription: 'Corsair Vengeance LPX হাই-পারফরম্যান্স DDR4 মেমোরি মডিউল। গেমিং এবং কনটেন্ট ক্রিয়েশনের জন্য আদর্শ।\n\nবৈশিষ্ট্য:\n• 16GB capacity (1 x 16GB)\n• DDR4 3200MHz speed\n• CAS Latency: 16-18-18-36\n• Voltage: 1.35V\n• Aluminum heat spreader\n• XMP 2.0 support\n• Lifetime warranty\n• Compatible with Intel & AMD platforms',
      sellingPrice: 4500,
      costPrice: 3900,
      compareAtPrice: 5000,
      minSellingPrice: 4200,
      warrantyMonths: 60,
      isFeatured: true,
      images: PRODUCT_IMAGES.corsairVengeance,
      attributes: [
        { code: 'type', valueString: 'DDR4' },
        { code: 'capacity', valueString: '16GB' },
        { code: 'speed', valueString: '3200MHz' },
        { code: 'cas_latency', valueString: 'CL16' },
        { code: 'modules', valueNumber: 1 },
      ],
      stock: 12,
    },
    {
      name: 'Samsung 980 Pro 1TB NVMe SSD',
      sku: 'SAM-980PRO-1TB',
      brandSlug: 'samsung',
      categorySlug: 'storage',
      model: 'MZ-V8P1T0',
      shortDescription: '1TB NVMe M.2 PCIe 4.0 SSD, Read 7000 MB/s, Write 5000 MB/s',
      fullDescription: 'Samsung 980 Pro PCIe 4.0 NVMe SSD - অসাধারণ স্পিড এবং রিলায়েবিলিটি।\n\nবৈশিষ্ট্য:\n• Capacity: 1TB\n• Form Factor: M.2 2280\n• Interface: PCIe Gen 4.0 x4\n• Sequential Read: up to 7,000 MB/s\n• Sequential Write: up to 5,000 MB/s\n• Random Read: up to 1,000K IOPS\n• Random Write: up to 1,000K IOPS\n• Endurance: 600 TBW\n• 5-year limited warranty\n• V-NAND TLC memory\n• AES 256-bit encryption',
      sellingPrice: 12500,
      costPrice: 11200,
      compareAtPrice: 14000,
      minSellingPrice: 12000,
      warrantyMonths: 36,
      isFeatured: true,
      images: PRODUCT_IMAGES.samsung980Pro,
      attributes: [
        { code: 'type', valueString: 'NVMe SSD' },
        { code: 'capacity', valueString: '1TB' },
        { code: 'interface', valueString: 'PCIe 4.0' },
        { code: 'read_speed', valueString: '7000' },
        { code: 'form_factor', valueString: 'M.2 2280' },
      ],
      stock: 8,
    },
    {
      name: 'Logitech K380 Bluetooth Keyboard',
      sku: 'LOGI-K380-BT',
      brandSlug: 'logitech',
      categorySlug: 'keyboards',
      model: 'K380',
      shortDescription: 'Compact Bluetooth Multi-Device Keyboard - 2 Year Warranty',
      fullDescription: 'Logitech K380 একটি কম্প্যাক্ট Bluetooth কীবোর্ড যা একসাথে ৩টি ডিভাইসে কানেক্ট করা যায়।\n\nবৈশিষ্ট্য:\n• Bluetooth wireless connectivity\n• Multi-device pairing (up to 3 devices)\n• Easy-switch keys\n• Compact, portable design\n• 2-year battery life (2x AAA)\n• Compatible with Windows, Mac, Android, iOS\n• Scissor-type keys for quiet typing\n• Available in multiple colors',
      sellingPrice: 3800,
      costPrice: 3300,
      compareAtPrice: 4200,
      minSellingPrice: 3600,
      warrantyMonths: 12,
      isFeatured: false,
      images: PRODUCT_IMAGES.logitechK380,
      attributes: [
        { code: 'type', valueString: 'Membrane' },
        { code: 'connection', valueString: 'Bluetooth' },
        { code: 'layout', valueString: 'QWERTY' },
      ],
      stock: 15,
    },
    {
      name: 'LG 24MK600M-B 24" IPS Monitor',
      sku: 'LG-24MK600M',
      brandSlug: 'lg',
      categorySlug: 'monitors',
      model: '24MK600M-B',
      shortDescription: '24" Full HD IPS Monitor, 75Hz, 5ms, HDMI x2',
      fullDescription: 'LG 24MK600M-B 24" IPS মনিটর অফিস এবং হোম ইউজের জন্য চমৎকার।\n\nবৈশিষ্ট্য:\n• 23.8" IPS panel\n• Full HD 1920x1080 resolution\n• 75Hz refresh rate\n• 5ms response time (GTG)\n• 178°/178° viewing angles\n• 250 nits brightness\n• AMD FreeSync support\n• 2x HDMI + VGA inputs\n• Flicker Safe, Reader Mode\n• OnScreen Control software\n• 3-year warranty',
      sellingPrice: 15500,
      costPrice: 14000,
      compareAtPrice: 17000,
      minSellingPrice: 14800,
      warrantyMonths: 36,
      isFeatured: true,
      images: PRODUCT_IMAGES.lg24Monitor,
      attributes: [
        { code: 'screen_size', valueNumber: 24 },
        { code: 'resolution', valueString: '1920x1080' },
        { code: 'refresh_rate', valueNumber: 75 },
        { code: 'panel_type', valueString: 'IPS' },
        { code: 'response_time', valueNumber: 5 },
        { code: 'aspect_ratio', valueString: '16:9' },
      ],
      stock: 6,
    },
    {
      name: 'APC BR1500GI 1500VA UPS',
      sku: 'APC-BR1500GI',
      brandSlug: 'apc',
      categorySlug: 'ups',
      model: 'BR1500GI',
      shortDescription: '1500VA/865W Line-Interactive UPS with LCD Display',
      fullDescription: 'APC Back-UPS Pro 1500VA - পাওয়ার কাট এবং সার্জ থেকে কম্পিউটার সুরক্ষিত রাখুন।\n\nবৈশিষ্ট্য:\n• 1500VA / 865W capacity\n• 8 outlets (4 surge + 4 battery backup)\n• LCD status display\n• Automatic Voltage Regulation (AVR)\n• USB connectivity\n• Energy saving certified\n• Audible alarms\n• Cold-start capable\n• 2-year warranty (electronics)\n• Battery replacement: APCRBC154',
      sellingPrice: 18500,
      costPrice: 17000,
      compareAtPrice: 20000,
      minSellingPrice: 18000,
      warrantyMonths: 24,
      isFeatured: false,
      images: PRODUCT_IMAGES.apcUps,
      attributes: [
        { code: 'capacity', valueString: '1500VA' },
        { code: 'outlets', valueNumber: 8 },
        { code: 'type', valueString: 'Line-Interactive' },
        { code: 'backup_time', valueString: '15-30 min' },
      ],
      stock: 4,
    },
    {
      name: 'Intel Core i5-12400F 12th Gen Processor',
      sku: 'INTEL-I5-12400F',
      brandSlug: 'intel',
      categorySlug: 'processors',
      model: 'BX8071512400F',
      shortDescription: '6 Cores, 12 Threads, Up to 4.4GHz, LGA1700, No iGPU',
      fullDescription: 'Intel Core i5-12400F 12th জেন প্রসেসর - গেমিং এবং প্রোডাক্টিভিটির জন্য পারফেক্ট।\n\nবৈশিষ্ট্য:\n• 6 Cores (6P + 0E) / 12 Threads\n• Base Clock: 2.5 GHz\n• Boost Clock: up to 4.4 GHz\n• Cache: 18MB Intel Smart Cache\n• TDP: 65W (max 117W)\n• Socket: LGA 1700\n• PCIe 5.0 and 4.0 support\n• DDR5 and DDR4 support\n• No integrated graphics (F-sku)\n• 3-year warranty',
      sellingPrice: 18500,
      costPrice: 17000,
      compareAtPrice: 19500,
      minSellingPrice: 18000,
      warrantyMonths: 36,
      isFeatured: true,
      images: PRODUCT_IMAGES.intelI5,
      attributes: [
        { code: 'socket', valueString: 'LGA1700' },
        { code: 'cores', valueNumber: 6 },
        { code: 'threads', valueNumber: 12 },
        { code: 'base_clock', valueNumber: 2.5 },
        { code: 'boost_clock', valueNumber: 4.4 },
        { code: 'tdp', valueNumber: 65 },
        { code: 'cache', valueString: '18MB' },
      ],
      stock: 10,
    },
  ];

  for (const sample of samples) {
    const existing = await db.product.findUnique({ where: { sku: sample.sku } });
    if (existing) {
      // Update existing product with images
      console.log(`  → Updating ${sample.name}...`);

      // Delete existing images and re-add
      await db.productImage.deleteMany({ where: { productId: existing.id } });

      for (let i = 0; i < sample.images.length; i++) {
        await db.productImage.create({
          data: {
            productId: existing.id,
            url: sample.images[i],
            altText: sample.name,
            isPrimary: i === 0,
            displayOrder: i,
          },
        });
      }

      // Mark as featured if needed
      await db.product.update({
        where: { id: existing.id },
        data: { isFeatured: sample.isFeatured },
      });

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
        status: 'PUBLISHED',
        sellingPrice: sample.sellingPrice,
        costPrice: sample.costPrice,
        compareAtPrice: sample.compareAtPrice || null,
        minSellingPrice: sample.minSellingPrice,
        trackInventory: true,
        reorderThreshold: 5,
        isFeatured: sample.isFeatured,
      },
    });

    // Add images
    for (let i = 0; i < sample.images.length; i++) {
      await db.productImage.create({
        data: {
          productId: product.id,
          url: sample.images[i],
          altText: sample.name,
          isPrimary: i === 0,
          displayOrder: i,
        },
      });
    }

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

    console.log(`  ✓ Created: ${sample.name} (Stock: ${sample.stock}, ${sample.images.length} images)`);
  }

  console.log('✅ Sample data with real images added!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
