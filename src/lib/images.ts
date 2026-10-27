// Centralized image catalog - real product images fetched via Z.ai image search
// All URLs are stable OSS-hosted images that are guaranteed reachable

export const PRODUCT_IMAGES = {
  // Laptops
  asusVivobook: [
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/76cf3ba16228.jpg',
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/1e7aec5d250f.jpg',
  ],
  // Gaming Laptops
  gamingLaptop: [
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3842fdd50dac.jpg',
  ],
  // Mice
  logitechG102: [
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/8bbe21522447.jpg',
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/10ce28dfb283.jpeg',
  ],
  // RAM
  corsairVengeance: [
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/353a4deaf12f.jpg',
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/635cdc352683.png',
  ],
  // Storage
  samsung980Pro: [
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f39eaaae9874.jpg',
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/618461ae1aa5.png',
  ],
  // Keyboards
  logitechK380: [
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/e3a58d308fcd.jpg',
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/5c291b45b04e.jpg',
  ],
  // Monitors
  lg24Monitor: [
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d3bcbcd9099d.jpg',
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/0bb541e6a16e.jpg',
  ],
  // UPS
  apcUps: [
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/6c09a878a8a3.jpg',
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f4d6d023aff1.jpg',
  ],
  // Processors
  intelI5: [
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f2d71c111ef2.jpg',
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/59106a1abb2a.jpg',
  ],
  // Gaming PCs (for hero showcase)
  gamingPc: [
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/c2a29d8f7e07.jpg',
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/4ede090942a4.jpg',
    'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/6961b495e0c6.jpg',
  ],
  // Hero backgrounds
  heroTech: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/921c65ec628e.jpg',
  heroPortrait: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/00261492645b.jpg',
  // Showroom
  showroom: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/b457342025ab.jpg',
  // RGB keyboard setup
  rgbSetup: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a8da84b17ae7.jpg',
};

// Category hero images for promo banners
export const CATEGORY_HEROES = {
  laptops: PRODUCT_IMAGES.asusVivobook[0],
  gaming: PRODUCT_IMAGES.gamingPc[0],
  components: PRODUCT_IMAGES.intelI5[0],
  accessories: PRODUCT_IMAGES.logitechG102[0],
};

// Brand logo placeholder URLs (use text-based brands for now since we don't have logo images)
export const BRAND_INFO: Record<string, { color: string; tagline: string }> = {
  ASUS: { color: '#00539B', tagline: 'In Search of Incredible' },
  MSI: { color: '#FF0000', tagline: 'Gaming Redefined' },
  Intel: { color: '#0071C5', tagline: 'The Power Inside' },
  AMD: { color: '#ED1C24', tagline: 'Together We Advance' },
  Logitech: { color: '#00B8FC', tagline: 'Defy Logic' },
  Samsung: { color: '#1428A0', tagline: 'Inspire the World' },
  Corsair: { color: '#FFB200', tagline: 'Push The Limit' },
  LG: { color: '#A50034', tagline: 'Life\'s Good' },
  APC: { color: '#000000', tagline: 'Reliable Power' },
  NVIDIA: { color: '#76B900', tagline: 'The Way It\'s Meant To Be Played' },
};
