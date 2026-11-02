/**
 * The Dreamer IT Express — verified business identity and proposed retail taxonomy.
 * These are configuration values supplied by the owner in the build specification,
 * not claims about products, prices, stock, domains or third-party accounts.
 */

export const BUSINESS = {
  name: 'The Dreamer IT Express',
  nameBn: 'দ্য ড্রিমার আইটি এক্সপ্রেস',
  shopNumbers: '104, 105',
  addressBn: 'সুবাস্তু আর্কেড, আইসিটি ভবন, লেভেল ১, দোকান নং ১০৪ ও ১০৫, বাংলাদেশ।',
  addressEn: 'Shubastu Arcade, ICT Bhaban, Level 1, Shop 104 & 105, Bangladesh.',
  phone: '01610111688',
  email: 'thedreameritexpress@gmail.com',
  primaryLanguage: 'bn',
  secondaryLanguage: 'en',
  currency: 'BDT',
  timezone: 'Asia/Dhaka',
  proposedPrimaryDomain: 'thedreamerit.com',
  proposedAlternativeDomain: 'dreamerit.com.bd',
  domainVerification: {
    checkedAt: '2026-11-02',
    primary: 'A registrar WHOIS page reported the name as unregistered, but the lookup was partly behind a bot check; NOT a definitive registry verification.',
    alternative: 'The .com.bd zone is not supported by the WHOIS service tried; an authorized .bd registrar check is still required.',
    registrationStatus: 'not_registered_by_this_project',
  },
} as const;

export const MIN_MODELS_PER_CATEGORY = 15;

export type SpecTemplate =
  | 'laptop'
  | 'desktop'
  | 'component'
  | 'monitor'
  | 'storage'
  | 'printer'
  | 'network'
  | 'peripheral'
  | 'generic';

export type CategoryDefinition = {
  name: string;
  group: string;
  template: SpecTemplate;
  nameBn?: string;
};

const G = {
  computers: 'Computers and portable devices',
  components: 'Core computer components',
  displays: 'Displays and peripherals',
  networking: 'Networking and connectivity',
  office: 'Printing, power and office technology',
  accessories: 'Storage, cables and accessories',
  gaming: 'Gaming and creator equipment',
  additional: 'Additional technology products',
} as const;

type Raw = [string, typeof G[keyof typeof G], SpecTemplate?];

// The complete 105-item proposed taxonomy from the master specification.
// This is a taxonomy, not a claim that the shop stocks any of these categories.
const RAW: Raw[] = [
  ['Business laptops', G.computers, 'laptop'],
  ['Gaming laptops', G.computers, 'laptop'],
  ['Creator and workstation laptops', G.computers, 'laptop'],
  ['Student laptops', G.computers, 'laptop'],
  ['Ultrabooks and lightweight laptops', G.computers, 'laptop'],
  ['Desktop computers', G.computers, 'desktop'],
  ['All-in-one computers', G.computers, 'desktop'],
  ['Mini PCs', G.computers, 'desktop'],
  ['Workstations', G.computers, 'desktop'],
  ['Gaming desktop PCs', G.computers, 'desktop'],
  ['Prebuilt desktop bundles', G.computers, 'desktop'],
  ['Chromebooks', G.computers, 'laptop'],
  ['Tablets and compatible computing devices', G.computers, 'generic'],
  ['Refurbished computers', G.computers, 'desktop'],
  ['Computer bundles and packages', G.computers, 'generic'],

  ['Processors', G.components, 'component'],
  ['Motherboards', G.components, 'component'],
  ['Graphics cards', G.components, 'component'],
  ['Desktop RAM', G.components, 'component'],
  ['Laptop RAM', G.components, 'component'],
  ['SATA SSDs', G.components, 'storage'],
  ['NVMe SSDs', G.components, 'storage'],
  ['Hard disk drives', G.components, 'storage'],
  ['External storage', G.components, 'storage'],
  ['Power supplies', G.components, 'component'],
  ['Computer cases', G.components, 'component'],
  ['CPU coolers', G.components, 'component'],
  ['Liquid cooling systems', G.components, 'component'],
  ['Case fans', G.components, 'component'],
  ['Thermal compounds', G.components, 'generic'],
  ['Capture cards and expansion cards', G.components, 'component'],

  ['Office monitors', G.displays, 'monitor'],
  ['Gaming monitors', G.displays, 'monitor'],
  ['Professional and creator monitors', G.displays, 'monitor'],
  ['Portable monitors', G.displays, 'monitor'],
  ['Keyboards', G.displays, 'peripheral'],
  ['Gaming keyboards', G.displays, 'peripheral'],
  ['Mice', G.displays, 'peripheral'],
  ['Gaming mice', G.displays, 'peripheral'],
  ['Mousepads', G.displays, 'peripheral'],
  ['Headphones', G.displays, 'peripheral'],
  ['Gaming headsets', G.displays, 'peripheral'],
  ['Speakers', G.displays, 'peripheral'],
  ['Webcams', G.displays, 'peripheral'],
  ['Microphones', G.displays, 'peripheral'],
  ['Drawing tablets', G.displays, 'peripheral'],
  ['KVM switches', G.displays, 'peripheral'],
  ['Docking stations', G.displays, 'peripheral'],
  ['USB hubs', G.displays, 'peripheral'],
  ['Laptop stands', G.displays, 'peripheral'],

  ['Routers', G.networking, 'network'],
  ['Mesh Wi-Fi systems', G.networking, 'network'],
  ['Network switches', G.networking, 'network'],
  ['Wireless access points', G.networking, 'network'],
  ['Network adapters', G.networking, 'network'],
  ['Ethernet adapters', G.networking, 'network'],
  ['Network interface cards', G.networking, 'network'],
  ['Modems', G.networking, 'network'],
  ['Network cables', G.networking, 'generic'],
  ['Patch panels and networking accessories', G.networking, 'generic'],

  ['Inkjet printers', G.office, 'printer'],
  ['Laser printers', G.office, 'printer'],
  ['Multifunction printers', G.office, 'printer'],
  ['Scanners', G.office, 'printer'],
  ['Printer consumables', G.office, 'generic'],
  ['UPS devices', G.office, 'generic'],
  ['Voltage stabilizers', G.office, 'generic'],
  ['Surge protectors', G.office, 'generic'],
  ['Power banks for compatible devices', G.office, 'generic'],
  ['External optical drives', G.office, 'storage'],
  ['Projectors', G.office, 'monitor'],
  ['Presentation accessories', G.office, 'generic'],

  ['USB flash drives', G.accessories, 'storage'],
  ['Memory cards', G.accessories, 'storage'],
  ['Card readers', G.accessories, 'peripheral'],
  ['External SSDs', G.accessories, 'storage'],
  ['External hard drives', G.accessories, 'storage'],
  ['USB-C cables', G.accessories, 'generic'],
  ['HDMI cables', G.accessories, 'generic'],
  ['DisplayPort cables', G.accessories, 'generic'],
  ['Adapters and converters', G.accessories, 'generic'],
  ['Laptop chargers', G.accessories, 'generic'],
  ['Replacement batteries', G.accessories, 'generic'],
  ['Laptop bags', G.accessories, 'generic'],
  ['Backpacks', G.accessories, 'generic'],
  ['Cleaning kits', G.accessories, 'generic'],
  ['Security locks', G.accessories, 'generic'],

  ['Game controllers', G.gaming, 'peripheral'],
  ['Streaming accessories', G.gaming, 'peripheral'],
  ['Lighting equipment', G.gaming, 'generic'],
  ['Studio microphones', G.gaming, 'peripheral'],
  ['Audio interfaces', G.gaming, 'peripheral'],
  ['Video capture devices', G.gaming, 'component'],
  ['Gaming chairs', G.gaming, 'generic'],
  ['Gaming desks', G.gaming, 'generic'],
  ['VR equipment', G.gaming, 'generic'],
  ['Sim racing peripherals', G.gaming, 'generic'],

  ['Servers', G.additional, 'desktop'],
  ['Server memory and storage', G.additional, 'component'],
  ['Server networking equipment', G.additional, 'network'],
  ['NAS systems', G.additional, 'storage'],
  ['NAS storage drives', G.additional, 'storage'],
  ['Security cameras', G.additional, 'generic'],
  ['Smart office equipment', G.additional, 'generic'],
  ['Other verified computer and technology products', G.additional, 'generic'],
];

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export const CATEGORIES: CategoryDefinition[] = RAW.map(([name, group, template]) => ({
  name,
  group,
  template: template ?? 'generic',
}));

export const CATEGORY_GROUPS = Object.values(G);

export const SPEC_TEMPLATES: Record<SpecTemplate, string[]> = {
  laptop: ['Processor and generation', 'Core and thread count', 'RAM capacity and type', 'Storage capacity and type', 'Graphics processor', 'Display size and resolution', 'Refresh rate', 'Operating system', 'Battery information', 'Ports and connectivity', 'Dimensions and weight', 'Warranty and included accessories'],
  desktop: ['CPU', 'Motherboard', 'RAM', 'Storage', 'Graphics card', 'Power supply', 'Cooling', 'Case', 'Operating system', 'Upgrade options', 'Component compatibility'],
  component: ['Model and part number', 'Socket / interface', 'Capacity or clock', 'Compatibility', 'Power requirements', 'Dimensions', 'Warranty'],
  monitor: ['Panel size', 'Resolution', 'Refresh rate', 'Panel type', 'Brightness', 'Response time', 'Ports', 'Colour coverage', 'Warranty'],
  storage: ['Capacity', 'Interface', 'Form factor', 'Sequential read', 'Sequential write', 'Endurance', 'Warranty'],
  printer: ['Print technology', 'Functions', 'Print speed', 'Resolution', 'Connectivity', 'Paper handling', 'Consumables', 'Warranty'],
  network: ['Standards', 'Ports', 'Wireless bands', 'Throughput', 'Management', 'Power', 'Warranty'],
  peripheral: ['Connection type', 'Compatibility', 'Dimensions', 'Weight', 'Key features', 'Warranty'],
  generic: ['Model', 'Category-specific attributes', 'Compatibility', 'Included accessories', 'Warranty'],
};

export function moneyToBdt(amountInPoysha: number): string {
  return (amountInPoysha / 100).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
