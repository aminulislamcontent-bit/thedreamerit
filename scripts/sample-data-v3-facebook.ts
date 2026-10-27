// Sample data v3 - Add HP EliteBooks (Dreamer IT's actual products from Facebook)
import { PrismaClient } from '@prisma/client';
import { PRODUCT_IMAGES } from '../src/lib/images';
const db = new PrismaClient();

async function main() {
  console.log('🌱 Adding HP EliteBook products from Facebook page...');

  const branch = await db.branch.findUnique({ where: { code: 'SHOP-104' } });
  const warehouse = await db.warehouse.findFirst({ where: { branchId: branch!.id } });

  if (!branch || !warehouse) {
    throw new Error('Run main seed first.');
  }

  // Add HP brand if not exists
  const hpBrand = await db.brand.upsert({
    where: { slug: 'hp' },
    update: {},
    create: { name: 'HP', slug: 'hp', country: 'USA', isActive: true },
  });

  // Add Apple brand if not exists
  const appleBrand = await db.brand.upsert({
    where: { slug: 'apple' },
    update: {},
    create: { name: 'Apple', slug: 'apple', country: 'USA', isActive: true },
  });

  const samples = [
    {
      name: 'HP EliteBook 1040 G6 360 2-in-1 Laptop',
      sku: 'HP-EB-1040-G6-360',
      brandSlug: 'hp',
      categorySlug: 'laptops',
      model: 'EliteBook 1040 G6 360',
      shortDescription: 'Intel Core i5, 16GB DDR4, 256GB NVMe SSD, 14" FHD Touch, Bang & Olufsen Audio',
      fullDescription: `HP EliteBook 1040 G6 360 - প্রিমিয়াম ২-ইন-১ কনভার্টিবল ল্যাপটপ। অফিস, ফ্রিল্যান্সিং বা ব্যবসা - সব কাজের জন্য পারফেক্ট!

বৈশিষ্ট্য:
• Processor: Intel Core i5 (8th Gen)
• RAM: 16GB DDR4
• Storage: 256GB NVMe SSD
• Display: 14" Full HD (1920 x 1080) Touchscreen
• Graphics: Intel UHD Graphics 620
• Keyboard: US Backlit Keyboard
• Audio: Bang & Olufsen Premium Sound
• 2-in-1 Convertible (Laptop + Tablet mode)
• Fingerprint reader
• USB-C, Thunderbolt
• Windows 10 Pro

বিশেষত্ব:
✓ কাজের আগে টেস্টেড
✓ ১৫ দিনের রিপ্লেসমেন্ট ওয়ারেন্টি
✓ ৫ বছরের সার্ভিস সাপোর্ট
✓ ভিডিও কলে লাইভ দেখুন

অফিস, ফ্রিল্যান্সিং বা ব্যবসার জন্য একটি পারফেক্ট ল্যাপটপ। আজই অর্ডার করুন!`,
      sellingPrice: 38500,
      costPrice: 35000,
      compareAtPrice: 42000,
      minSellingPrice: 37000,
      warrantyMonths: 15,
      isFeatured: true,
      images: PRODUCT_IMAGES.hpEliteBook1040,
      attributes: [
        { code: 'processor', valueString: 'Intel Core i5 (8th Gen)' },
        { code: 'ram', valueString: '16GB DDR4' },
        { code: 'storage', valueString: '256GB NVMe SSD' },
        { code: 'screen_size', valueString: '14" Touch' },
        { code: 'gpu', valueString: 'Intel UHD Graphics 620' },
        { code: 'os', valueString: 'Windows 10 Pro' },
        { code: 'battery', valueString: '56Wh' },
        { code: 'weight', valueNumber: 1.4 },
      ],
      stock: 7,
    },
    {
      name: 'HP EliteBook 845 G10 AMD Ryzen 5 Pro Laptop',
      sku: 'HP-EB-845-G10-RYZEN5',
      brandSlug: 'hp',
      categorySlug: 'laptops',
      model: 'EliteBook 845 G10',
      shortDescription: 'AMD Ryzen 5 Pro, 16GB DDR5, 512GB NVMe SSD, 14" FHD, Premium Build',
      fullDescription: `HP EliteBook 845 G10 - AMD Ryzen 5 Pro প্রসেসর সহ প্রিমিয়াম বিজনেস ল্যাপটপ।

বৈশিষ্ট্য:
• Processor: AMD Ryzen 5 Pro (7000 Series)
• RAM: 16GB DDR5 (Latest Generation)
• Storage: 512GB NVMe SSD
• Display: 14" Full HD (1920 x 1080) IPS
• Graphics: AMD Radeon Graphics
• Premium aluminum chassis
• Backlit keyboard
• Fingerprint + IR camera
• Wi-Fi 6E, Bluetooth 5.3
• USB-C, HDMI 2.1
• Windows 11 Pro

কেন বেছে নিবেন:
✓ প্রিমিয়াম বিল্ড কোয়ালিটি
✓ দীর্ঘস্থায়ী ব্যাটারি (10+ ঘন্টা)
✓ ফাস্ট পারফরম্যান্স
✓ বিজনেস-ক্লাস সিকিউরিটি
✓ টেস্টেড এবং ভেরিফাইড

অফিস, প্রোগ্রামিং, গ্রাফিক ডিজাইন বা হেভি কাজের জন্য আদর্শ।`,
      sellingPrice: 72000,
      costPrice: 66000,
      compareAtPrice: 78000,
      minSellingPrice: 70000,
      warrantyMonths: 12,
      isFeatured: true,
      images: PRODUCT_IMAGES.hpEliteBook845,
      attributes: [
        { code: 'processor', valueString: 'AMD Ryzen 5 Pro' },
        { code: 'ram', valueString: '16GB DDR5' },
        { code: 'storage', valueString: '512GB NVMe SSD' },
        { code: 'screen_size', valueString: '14"' },
        { code: 'gpu', valueString: 'AMD Radeon Graphics' },
        { code: 'os', valueString: 'Windows 11 Pro' },
        { code: 'battery', valueString: '51Wh' },
        { code: 'weight', valueNumber: 1.36 },
      ],
      stock: 4,
    },
    {
      name: 'Apple MacBook Air M2 13.6"',
      sku: 'APPL-MBA-M2-13',
      brandSlug: 'apple',
      categorySlug: 'laptops',
      model: 'MacBook Air M2',
      shortDescription: 'Apple M2 Chip, 8GB Unified Memory, 256GB SSD, 13.6" Liquid Retina',
      fullDescription: `Apple MacBook Air M2 - সবচেয়ে পাতলা এবং শক্তিশালী ম্যাকবুক।

বৈশিষ্ট্য:
• Chip: Apple M2 (8-core CPU, 8-core GPU)
• Memory: 8GB Unified Memory
• Storage: 256GB SSD
• Display: 13.6" Liquid Retina (2560 x 1664)
• Camera: 1080p FaceTime HD
• Audio: 4-speaker sound system with Spatial Audio
• MagSafe 3 charging port
• 2x Thunderbolt / USB 4 ports
• 3.5mm headphone jack
• Wi-Fi 6, Bluetooth 5.3
• macOS
• Up to 18 hours battery life

কেন বেছে নিবেন:
✓ অসাধারণ পারফরম্যান্স
✓ সিলেন্ট অপারেশন (no fan)
✓ দীর্ঘস্থায়ী ব্যাটারি
✓ প্রিমিয়াম রেটিনা ডিসপ্লে
✓ অফিসিয়াল ওয়ারেন্টি

ভিডিও এডিটিং, গ্রাফিক ডিজাইন, প্রোগ্রামিং বা প্রতিদিনের কাজের জন্য পারফেক্ট।`,
      sellingPrice: 112000,
      costPrice: 105000,
      compareAtPrice: 120000,
      minSellingPrice: 110000,
      warrantyMonths: 12,
      isFeatured: true,
      images: PRODUCT_IMAGES.macbookAir,
      attributes: [
        { code: 'processor', valueString: 'Apple M2 (8-core)' },
        { code: 'ram', valueString: '8GB Unified' },
        { code: 'storage', valueString: '256GB SSD' },
        { code: 'screen_size', valueString: '13.6"' },
        { code: 'gpu', valueString: 'Apple M2 8-core GPU' },
        { code: 'os', valueString: 'macOS' },
        { code: 'battery', valueString: '52.6Wh' },
        { code: 'weight', valueNumber: 1.24 },
      ],
      stock: 3,
    },
  ];

  for (const sample of samples) {
    const existing = await db.product.findUnique({ where: { sku: sample.sku } });
    if (existing) {
      // Update images and price
      console.log(`  → Updating ${sample.name}...`);
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
      await db.product.update({
        where: { id: existing.id },
        data: {
          isFeatured: sample.isFeatured,
          shortDescription: sample.shortDescription,
          fullDescription: sample.fullDescription,
          compareAtPrice: sample.compareAtPrice,
        },
      });
      continue;
    }

    const brand = await db.brand.findUnique({ where: { slug: sample.brandSlug } });
    const category = await db.category.findUnique({ where: { slug: sample.categorySlug } });
    if (!category) continue;

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

    await db.inventory.create({
      data: {
        productId: product.id,
        branchId: branch!.id,
        warehouseId: warehouse!.id,
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
        branchId: branch!.id,
        warehouseId: warehouse!.id,
        quantity: sample.stock,
        movementType: 'PURCHASE_RECEIPT',
        referenceType: 'MANUAL_ADJUST',
        unitCost: sample.costPrice,
        reason: 'Initial stock for HP EliteBook from Facebook catalog',
      },
    });

    console.log(`  ✓ Created: ${sample.name} (Stock: ${sample.stock})`);
  }

  console.log('✅ Facebook products added!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
