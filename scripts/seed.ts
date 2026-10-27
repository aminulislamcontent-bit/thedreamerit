// Seed script - initializes The Dreamer IT Express platform
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/security';
import { BUSINESS, SYSTEM_ROLES, PERMISSIONS, ROLE_PERMISSIONS } from '../src/lib/config';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding The Dreamer IT Express platform...');

  // 1. Permissions
  console.log('  → Creating permissions...');
  const permissionByCode = new Map<string, string>();
  for (const [code, description] of Object.entries(PERMISSIONS)) {
    const permModule = code.split('.')[0];
    const p = await db.permission.upsert({
      where: { code },
      update: { description, module: permModule },
      create: { code, description, module: permModule },
    });
    permissionByCode.set(code, p.id);
  }

  // 2. Roles + role-permission mapping
  console.log('  → Creating roles and permissions...');
  for (const roleName of SYSTEM_ROLES) {
    const role = await db.role.upsert({
      where: { name: roleName },
      update: { isSystem: true },
      create: {
        name: roleName,
        isSystem: true,
        description: roleName.replace(/_/g, ' ').toLowerCase(),
      },
    });

    await db.rolePermission.deleteMany({ where: { roleId: role.id } });

    const perms = ROLE_PERMISSIONS[roleName] || [];
    for (const permCode of perms) {
      const permId = permissionByCode.get(permCode);
      if (!permId) continue;
      await db.rolePermission.create({
        data: { roleId: role.id, permissionId: permId },
      }).catch(() => {});
    }
  }

  // 3. Branches
  console.log('  → Creating branches (Shop 104 and 105)...');
  const branch104 = await db.branch.upsert({
    where: { code: 'SHOP-104' },
    update: {},
    create: {
      code: 'SHOP-104',
      name: 'The Dreamer IT Express - Shop 104',
      address: `${BUSINESS.address.line1}, ${BUSINESS.address.line2}, ${BUSINESS.address.country}`,
      phone: BUSINESS.phone,
      email: BUSINESS.email,
      isHeadOffice: true,
      isActive: true,
    },
  });

  const branch105 = await db.branch.upsert({
    where: { code: 'SHOP-105' },
    update: {},
    create: {
      code: 'SHOP-105',
      name: 'The Dreamer IT Express - Shop 105',
      address: `${BUSINESS.address.line1}, ${BUSINESS.address.line2}, ${BUSINESS.address.country}`,
      phone: BUSINESS.phone,
      email: BUSINESS.email,
      isActive: true,
    },
  });

  // 4. Warehouses
  console.log('  → Creating warehouses...');
  await db.warehouse.upsert({
    where: { code: 'WH-104-MAIN' },
    update: {},
    create: {
      code: 'WH-104-MAIN',
      name: 'Shop 104 Main Storage',
      branchId: branch104.id,
      address: BUSINESS.address.line1,
    },
  });
  await db.warehouse.upsert({
    where: { code: 'WH-105-MAIN' },
    update: {},
    create: {
      code: 'WH-105-MAIN',
      name: 'Shop 105 Main Storage',
      branchId: branch105.id,
      address: BUSINESS.address.line1,
    },
  });

  // 5. Default Super Admin user
  console.log('  → Creating super admin user...');
  const adminEmail = 'admin@thedreamerit.com';
  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const admin = await db.user.create({
      data: {
        email: adminEmail,
        name: 'System Administrator',
        phone: BUSINESS.phone,
        passwordHash: hashPassword('Dreamer@2026'),
        status: 'ACTIVE',
      },
    });
    const superAdminRole = await db.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
    if (superAdminRole) {
      await db.userRole.create({
        data: { userId: admin.id, roleId: superAdminRole.id },
      });
    }
    await db.employee.create({
      data: {
        userId: admin.id,
        employeeCode: 'EMP-001',
        fullName: 'System Administrator',
        designation: 'Super Admin',
        department: 'Management',
        branchId: branch104.id,
        joinDate: new Date(),
        basicSalary: 0,
        email: adminEmail,
        phone: BUSINESS.phone,
      },
    });
    console.log('  ✓ Super admin created: admin@thedreamerit.com / Dreamer@2026');
  } else {
    console.log('  → Super admin already exists, skipping.');
  }

  // 6. Categories with category-specific attributes
  console.log('  → Creating product categories...');
  const categoryData: Array<{ name: string; slug: string; attributes?: Array<any> }> = [
    {
      name: 'Laptops', slug: 'laptops',
      attributes: [
        { name: 'Processor', code: 'processor', type: 'STRING', required: true },
        { name: 'RAM Capacity', code: 'ram', type: 'STRING', unit: 'GB', required: true },
        { name: 'Storage', code: 'storage', type: 'STRING', required: true },
        { name: 'Screen Size', code: 'screen_size', type: 'STRING', unit: 'inch' },
        { name: 'GPU', code: 'gpu', type: 'STRING' },
        { name: 'Battery', code: 'battery', type: 'STRING', unit: 'Wh' },
        { name: 'Weight', code: 'weight', type: 'NUMBER', unit: 'kg' },
        { name: 'OS', code: 'os', type: 'STRING' },
      ],
    },
    {
      name: 'Desktop PCs', slug: 'desktop-pcs',
      attributes: [
        { name: 'Processor', code: 'processor', type: 'STRING', required: true },
        { name: 'RAM', code: 'ram', type: 'STRING', unit: 'GB', required: true },
        { name: 'Storage', code: 'storage', type: 'STRING', required: true },
        { name: 'GPU', code: 'gpu', type: 'STRING' },
        { name: 'Form Factor', code: 'form_factor', type: 'SELECT', options: ['Tower', 'Mini Tower', 'Micro', 'Mini PC'] },
      ],
    },
    {
      name: 'Gaming PCs', slug: 'gaming-pcs',
      attributes: [
        { name: 'Processor', code: 'processor', type: 'STRING', required: true },
        { name: 'RAM', code: 'ram', type: 'STRING', unit: 'GB', required: true },
        { name: 'GPU', code: 'gpu', type: 'STRING', required: true },
        { name: 'Storage', code: 'storage', type: 'STRING', required: true },
        { name: 'Cooling', code: 'cooling', type: 'STRING' },
        { name: 'PSU Wattage', code: 'psu_wattage', type: 'NUMBER', unit: 'W' },
      ],
    },
    {
      name: 'Processors', slug: 'processors',
      attributes: [
        { name: 'Socket', code: 'socket', type: 'STRING', required: true },
        { name: 'Cores', code: 'cores', type: 'NUMBER', required: true },
        { name: 'Threads', code: 'threads', type: 'NUMBER', required: true },
        { name: 'Base Clock', code: 'base_clock', type: 'NUMBER', unit: 'GHz', required: true },
        { name: 'Boost Clock', code: 'boost_clock', type: 'NUMBER', unit: 'GHz' },
        { name: 'TDP', code: 'tdp', type: 'NUMBER', unit: 'W' },
        { name: 'Cache', code: 'cache', type: 'STRING', unit: 'MB' },
      ],
    },
    {
      name: 'Motherboards', slug: 'motherboards',
      attributes: [
        { name: 'Socket', code: 'socket', type: 'STRING', required: true },
        { name: 'Chipset', code: 'chipset', type: 'STRING', required: true },
        { name: 'Form Factor', code: 'form_factor', type: 'SELECT', options: ['ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'], required: true },
        { name: 'RAM Type', code: 'ram_type', type: 'SELECT', options: ['DDR4', 'DDR5'], required: true },
        { name: 'RAM Slots', code: 'ram_slots', type: 'NUMBER' },
        { name: 'Max RAM', code: 'max_ram', type: 'STRING', unit: 'GB' },
        { name: 'M.2 Slots', code: 'm2_slots', type: 'NUMBER' },
      ],
    },
    {
      name: 'Graphics Cards', slug: 'graphics-cards',
      attributes: [
        { name: 'GPU Chip', code: 'gpu_chip', type: 'STRING', required: true },
        { name: 'VRAM', code: 'vram', type: 'STRING', unit: 'GB', required: true },
        { name: 'Memory Type', code: 'memory_type', type: 'SELECT', options: ['GDDR6', 'GDDR6X', 'GDDR5'] },
        { name: 'Length', code: 'length', type: 'NUMBER', unit: 'mm' },
        { name: 'TDP', code: 'tdp', type: 'NUMBER', unit: 'W' },
        { name: 'Power Connector', code: 'power_connector', type: 'STRING' },
      ],
    },
    {
      name: 'RAM', slug: 'ram',
      attributes: [
        { name: 'Type', code: 'type', type: 'SELECT', options: ['DDR4', 'DDR5', 'DDR3'], required: true },
        { name: 'Capacity', code: 'capacity', type: 'STRING', unit: 'GB', required: true },
        { name: 'Speed', code: 'speed', type: 'STRING', unit: 'MHz', required: true },
        { name: 'Modules', code: 'modules', type: 'NUMBER' },
        { name: 'CAS Latency', code: 'cas_latency', type: 'STRING' },
      ],
    },
    {
      name: 'Storage', slug: 'storage',
      attributes: [
        { name: 'Type', code: 'type', type: 'SELECT', options: ['SSD', 'HDD', 'NVMe SSD', 'M.2 SSD', 'External HDD'], required: true },
        { name: 'Capacity', code: 'capacity', type: 'STRING', required: true },
        { name: 'Interface', code: 'interface', type: 'STRING' },
        { name: 'Read Speed', code: 'read_speed', type: 'STRING', unit: 'MB/s' },
        { name: 'Form Factor', code: 'form_factor', type: 'SELECT', options: ['2.5"', '3.5"', 'M.2 2280', 'M.2 2242'] },
      ],
    },
    {
      name: 'Monitors', slug: 'monitors',
      attributes: [
        { name: 'Screen Size', code: 'screen_size', type: 'NUMBER', unit: 'inch', required: true },
        { name: 'Resolution', code: 'resolution', type: 'STRING', required: true },
        { name: 'Refresh Rate', code: 'refresh_rate', type: 'NUMBER', unit: 'Hz', required: true },
        { name: 'Panel Type', code: 'panel_type', type: 'SELECT', options: ['IPS', 'VA', 'TN', 'OLED', 'QLED'] },
        { name: 'Response Time', code: 'response_time', type: 'NUMBER', unit: 'ms' },
        { name: 'Aspect Ratio', code: 'aspect_ratio', type: 'STRING' },
      ],
    },
    { name: 'Keyboards', slug: 'keyboards', attributes: [
      { name: 'Type', code: 'type', type: 'SELECT', options: ['Mechanical', 'Membrane', 'Hybrid'], required: true },
      { name: 'Layout', code: 'layout', type: 'STRING' },
      { name: 'Backlit', code: 'backlit', type: 'SELECT', options: ['None', 'Single Color', 'RGB'] },
      { name: 'Connection', code: 'connection', type: 'SELECT', options: ['Wired USB', 'Wireless', 'Bluetooth', 'Wireless+Bluetooth'] },
    ]},
    { name: 'Mice', slug: 'mice', attributes: [
      { name: 'DPI', code: 'dpi', type: 'NUMBER', required: true },
      { name: 'Buttons', code: 'buttons', type: 'NUMBER' },
      { name: 'Connection', code: 'connection', type: 'SELECT', options: ['Wired USB', 'Wireless 2.4GHz', 'Bluetooth'] },
      { name: 'Sensor Type', code: 'sensor_type', type: 'STRING' },
    ]},
    { name: 'Headphones', slug: 'headphones', attributes: [
      { name: 'Type', code: 'type', type: 'SELECT', options: ['Over-ear', 'On-ear', 'In-ear', 'Earbud'] },
      { name: 'Connection', code: 'connection', type: 'SELECT', options: ['Wired 3.5mm', 'USB', 'Wireless', 'Bluetooth'] },
      { name: 'Microphone', code: 'microphone', type: 'BOOLEAN' },
      { name: 'RGB', code: 'rgb', type: 'BOOLEAN' },
    ]},
    { name: 'Speakers', slug: 'speakers', attributes: [
      { name: 'Configuration', code: 'configuration', type: 'STRING' },
      { name: 'Total Power', code: 'total_power', type: 'NUMBER', unit: 'W' },
      { name: 'Connection', code: 'connection', type: 'STRING' },
    ]},
    { name: 'Printers', slug: 'printers', attributes: [
      { name: 'Type', code: 'type', type: 'SELECT', options: ['Inkjet', 'Laser', 'Ink Tank', 'Thermal'], required: true },
      { name: 'Function', code: 'function', type: 'SELECT', options: ['Print Only', 'Print+Scan', 'Print+Scan+Copy', 'All-in-One'] },
      { name: 'Print Speed', code: 'print_speed', type: 'STRING', unit: 'ppm' },
      { name: 'Connectivity', code: 'connectivity', type: 'STRING' },
      { name: 'Duplex', code: 'duplex', type: 'BOOLEAN' },
    ]},
    { name: 'Routers', slug: 'routers', attributes: [
      { name: 'Type', code: 'type', type: 'SELECT', options: ['Wired', 'Wireless', 'Mesh'] },
      { name: 'Wi-Fi Standard', code: 'wifi_standard', type: 'STRING' },
      { name: 'Speed', code: 'speed', type: 'STRING', unit: 'Mbps' },
      { name: 'Ports', code: 'ports', type: 'NUMBER' },
      { name: 'Bands', code: 'bands', type: 'SELECT', options: ['Single', 'Dual', 'Tri'] },
    ]},
    { name: 'Networking', slug: 'networking', attributes: [
      { name: 'Type', code: 'type', type: 'STRING', required: true },
      { name: 'Ports', code: 'ports', type: 'NUMBER' },
      { name: 'Speed', code: 'speed', type: 'STRING' },
    ]},
    { name: 'UPS', slug: 'ups', attributes: [
      { name: 'Capacity', code: 'capacity', type: 'STRING', unit: 'VA', required: true },
      { name: 'Outlets', code: 'outlets', type: 'NUMBER' },
      { name: 'Backup Time', code: 'backup_time', type: 'STRING', unit: 'min' },
      { name: 'Type', code: 'type', type: 'SELECT', options: ['Line-Interactive', 'Online', 'Offline'] },
    ]},
    { name: 'Power Supplies', slug: 'power-supplies', attributes: [
      { name: 'Wattage', code: 'wattage', type: 'NUMBER', unit: 'W', required: true },
      { name: 'Efficiency', code: 'efficiency', type: 'SELECT', options: ['80+ White', '80+ Bronze', '80+ Gold', '80+ Platinum', '80+ Titanium'] },
      { name: 'Modular', code: 'modular', type: 'SELECT', options: ['Non-Modular', 'Semi-Modular', 'Fully Modular'] },
      { name: 'Form Factor', code: 'form_factor', type: 'SELECT', options: ['ATX', 'SFX', 'TFX'] },
    ]},
    { name: 'Cases', slug: 'cases', attributes: [
      { name: 'Form Factor', code: 'form_factor', type: 'SELECT', options: ['ATX Mid Tower', 'ATX Full Tower', 'Micro-ATX', 'Mini-ITX', 'E-ATX'] },
      { name: 'Side Panel', code: 'side_panel', type: 'SELECT', options: ['Tempered Glass', 'Acrylic', 'Metal'] },
      { name: 'Max GPU Length', code: 'max_gpu_length', type: 'NUMBER', unit: 'mm' },
      { name: 'Max CPU Cooler Height', code: 'max_cooler_height', type: 'NUMBER', unit: 'mm' },
      { name: 'Fan Slots', code: 'fan_slots', type: 'NUMBER' },
    ]},
    { name: 'Cooling', slug: 'cooling', attributes: [
      { name: 'Type', code: 'type', type: 'SELECT', options: ['Air Cooler', 'AIO Liquid', 'Custom Liquid', 'Case Fan'], required: true },
      { name: 'Socket Compatibility', code: 'socket_compat', type: 'STRING' },
      { name: 'Fan Size', code: 'fan_size', type: 'NUMBER', unit: 'mm' },
      { name: 'Height', code: 'height', type: 'NUMBER', unit: 'mm' },
      { name: 'TDP Support', code: 'tdp_support', type: 'NUMBER', unit: 'W' },
    ]},
    { name: 'Cables & Adapters', slug: 'cables-adapters', attributes: [
      { name: 'Type', code: 'type', type: 'STRING', required: true },
      { name: 'Length', code: 'length', type: 'NUMBER', unit: 'm' },
      { name: 'Connector A', code: 'connector_a', type: 'STRING' },
      { name: 'Connector B', code: 'connector_b', type: 'STRING' },
    ]},
    { name: 'Accessories', slug: 'accessories', attributes: [
      { name: 'Type', code: 'type', type: 'STRING', required: true },
    ]},
    { name: 'All-in-One', slug: 'all-in-one', attributes: [
      { name: 'Processor', code: 'processor', type: 'STRING', required: true },
      { name: 'RAM', code: 'ram', type: 'STRING', unit: 'GB', required: true },
      { name: 'Storage', code: 'storage', type: 'STRING', required: true },
      { name: 'Screen Size', code: 'screen_size', type: 'NUMBER', unit: 'inch' },
    ]},
  ];

  for (const cat of categoryData) {
    const created = await db.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, isActive: true },
      create: { name: cat.name, slug: cat.slug, isActive: true },
    });

    if (cat.attributes) {
      for (let i = 0; i < cat.attributes.length; i++) {
        const attr = cat.attributes[i];
        const existing = await db.categoryAttribute.findFirst({
          where: { categoryId: created.id, code: attr.code },
        });
        if (existing) continue;
        await db.categoryAttribute.create({
          data: {
            categoryId: created.id,
            name: attr.name,
            code: attr.code,
            type: attr.type,
            unit: attr.unit || null,
            isRequired: attr.required || false,
            isFilterable: true,
            options: attr.options ? JSON.stringify(attr.options) : null,
            displayOrder: i,
          },
        });
      }
    }
  }

  // 7. Sample brands
  console.log('  → Creating brands...');
  const brands = [
    'ASUS', 'MSI', 'Gigabyte', 'ASRock', 'Intel', 'AMD', 'NVIDIA',
    'Corsair', 'Kingston', 'Western Digital', 'Seagate', 'Samsung', 'Crucial',
    'Logitech', 'Razer', 'SteelSeries', 'HyperX', 'Dell', 'HP', 'Lenovo',
    'Acer', 'Apple', 'Microsoft', 'Canon', 'Epson', 'Brother', 'TP-Link',
    'Netgear', 'Cisco', 'APC', 'Cooler Master', 'NZXT', 'Fractal Design',
    'Thermaltake', 'Lian Li', 'DeepCool', 'Antec',
  ];
  for (const name of brands) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    await db.brand.upsert({
      where: { slug },
      update: {},
      create: { name, slug, isActive: true },
    });
  }

  // 8. System settings
  console.log('  → Creating system settings...');
  const settings = [
    { key: 'business.name', value: BUSINESS.name, description: 'Business name' },
    { key: 'business.phone', value: BUSINESS.phone, description: 'Business phone' },
    { key: 'business.email', value: BUSINESS.email, description: 'Business email' },
    { key: 'business.address', value: `${BUSINESS.address.line1}, ${BUSINESS.address.line2}`, description: 'Business address' },
    { key: 'business.currency', value: BUSINESS.currency, description: 'Default currency' },
    { key: 'business.timezone', value: BUSINESS.timezone, description: 'Business timezone' },
    { key: 'business.defaultLanguage', value: BUSINESS.defaultLanguage, description: 'Default language' },
    { key: 'platform.version', value: '1.0.0', description: 'Platform version' },
    { key: 'platform.lastBackupAt', value: '', description: 'Last successful backup timestamp' },
    { key: 'seo.bingVerification', value: '', description: 'Bing Webmaster verification token' },
    { key: 'seo.googleVerification', value: '', description: 'Google Search Console verification' },
  ];
  for (const s of settings) {
    await db.systemSetting.upsert({
      where: { key: s.key },
      update: { description: s.description },
      create: s,
    });
  }

  console.log('✅ Seed complete!');
  console.log('   Super Admin: admin@thedreamerit.com / Dreamer@2026');
  console.log('   Branches: SHOP-104 (head office), SHOP-105');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
