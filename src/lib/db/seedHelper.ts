import { AdminUser, StoreSettings, Category, Product } from "@/lib/models";
import { hashPassword } from "@/lib/auth/authUtils";
import { AdminRole, PaymentMethod } from "@/types";

export async function ensureInitialSeed(): Promise<void> {
  // 1. Initial Admin User
  const adminEmail = (process.env.ADMIN_INITIAL_EMAIL || "admin@allinonepremium.store").trim().toLowerCase();
  const adminUsername = (process.env.ADMIN_INITIAL_USERNAME || "admin").trim().toLowerCase();
  const existingAdmin = await AdminUser.findOne({ $or: [{ email: adminEmail }, { username: adminUsername }] });

  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  // A short, guessable password is tolerated for local development only.
  const weakForProduction = process.env.NODE_ENV === "production" && (adminPassword?.length ?? 0) < 12;
  if (!existingAdmin && !adminPassword) {
    console.warn("⚠️ ADMIN_INITIAL_PASSWORD is not set; skipping initial admin creation.");
  } else if (!existingAdmin && weakForProduction) {
    console.error("❌ ADMIN_INITIAL_PASSWORD must be at least 12 characters in production; admin not created.");
  } else if (!existingAdmin && adminPassword) {
    const hashedPassword = await hashPassword(adminPassword);
    await AdminUser.create({
      email: adminEmail,
      username: adminUsername,
      password: hashedPassword,
      name: "Store Administrator",
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    });
    console.log(`✅ Default admin created: ${adminUsername} (${adminEmail})`);
  }

  // 2. Store Settings
  const existingSettings = await StoreSettings.findOne();
  if (!existingSettings) {
    await StoreSettings.create({
      storeName: "allinonepermium.store",
      logoUrl: "/logo.png",
      tagline: "Premium Mobile Accessories & Electronics. Curated with Care.",
      contactEmail: "support@allinonepremium.store",
      contactPhone: "+92 300 1234567",
      address: "Tech Hub Plaza, Main Boulevard, Gulberg III, Lahore, Pakistan",
      deliveryCharge: 200,
      freeDeliveryThreshold: 3000,
      currency: "PKR",
      paymentMethods: [PaymentMethod.CASH_ON_DELIVERY],
      socialLinks: {
        facebook: "https://facebook.com/allinonepremium",
        instagram: "https://instagram.com/allinonepremium",
        whatsapp: "+923001234567",
      },
      policies: {
        returns: "7-Day hassle-free replacement warranty for all verified defective or unboxed items.",
        privacy: "We respect your privacy. Customer names, phones, and addresses are strictly protected.",
        shipping: "Cash on delivery nationwide across Pakistan. Delivered safely to your door within 2 to 4 business days.",
      },
      lowStockThreshold: 5,
      isMaintenanceMode: false,
    });
    console.log("✅ Store settings initialized");
  }

  // 3. Categories
  const categoryDefs = [
    {
      name: "Adapters & Chargers",
      slug: "adapters-and-chargers",
      description: "High-speed GaN fast wall chargers, multi-port hubs, and high-wattage travel adapters.",
      displayOrder: 1,
      image: {
        url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
        alt: "GaN Fast Chargers and Adapters",
      },
      isActive: true,
    },
    {
      name: "Power Banks",
      slug: "power-banks",
      description: "MagSafe magnetic power banks, high-capacity 20,000mAh packs, and ultra-slim portable batteries.",
      displayOrder: 2,
      image: {
        url: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80",
        alt: "High-Capacity Magnetic Power Banks",
      },
      isActive: true,
    },
    {
      name: "Audio & Earbuds",
      slug: "audio-and-earbuds",
      description: "Active Noise Cancelling (ANC) true wireless earbuds and high-fidelity studio headphones.",
      displayOrder: 3,
      image: {
        url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
        alt: "Premium Wireless Earbuds & Headphones",
      },
      isActive: true,
    },
    {
      name: "Smart Wearables",
      slug: "smart-wearables",
      description: "AMOLED smartwatches, fitness trackers, and durable titanium bands.",
      displayOrder: 4,
      image: {
        url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
        alt: "Smartwatches and Wearables",
      },
      isActive: true,
    },
    {
      name: "Cables & Protection",
      slug: "cables-and-protection",
      description: "Braided 100W PD cables, MagSafe clear cases, and tempered 9H screen guards.",
      displayOrder: 5,
      image: {
        url: "https://images.unsplash.com/photo-1601524909162-ae8725290836?auto=format&fit=crop&w=800&q=80",
        alt: "Braided Fast Charging Cables",
      },
      isActive: true,
    },
    {
      name: "Wireless Audio Speakers",
      slug: "wireless-speakers",
      description: "IP67 waterproof Bluetooth speakers with rich bass and multi-speaker pairing.",
      displayOrder: 6,
      image: {
        url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
        alt: "Portable Bluetooth Speakers",
      },
      isActive: true,
    },
  ];

  const categoryMap = new Map<string, string>();
  for (const c of categoryDefs) {
    let cat = await Category.findOne({ slug: c.slug });
    if (!cat) {
      cat = await Category.create(c);
      console.log(`✅ Category created: ${c.name}`);
    }
    categoryMap.set(c.slug, cat._id.toString());
  }

  // 4. Products
  const count = await Product.countDocuments();
  if (count === 0) {
    const productsData = [
      {
        name: "Studio One Hybrid ANC Headphones",
        slug: "studio-one-headphones",
        sku: "AOP-AUD-001",
        description:
          "Closed-back over-ear headphones with hybrid Active Noise Cancelling (ANC) and custom 40 mm drivers tuned flat enough for sound editing, warm enough for the daily commute. Features memory-foam cushions and 45-hour battery life with USB-C quick charge.",
        category: categoryMap.get("audio-and-earbuds"),
        images: [
          { url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80", alt: "Studio One Headphones Front" },
          { url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80", alt: "Studio One Headphones Detail" },
        ],
        price: 18500,
        originalPrice: 22000,
        costPrice: 12000,
        stock: 15,
        variants: [
          { name: "Color", value: "Graphite Black", stock: 10, priceModifier: 0 },
          { name: "Color", value: "Desert Sand", stock: 5, priceModifier: 0 },
        ],
        specifications: [
          { key: "Driver", value: "40 mm dynamic neodymium" },
          { key: "Battery Life", value: "45 h (ANC off), 35 h (ANC on)" },
          { key: "Charging", value: "USB-C, 10 min charge = 5 h playback" },
          { key: "Connectivity", value: "Bluetooth 5.3, Multipoint pairing" },
          { key: "Weight", value: "254 g" },
        ],
        tags: ["headphones", "anc", "audio", "wireless"],
        isFeatured: true,
        isNewArrival: false,
        isPublished: true,
        rating: 4.9,
        reviewCount: 38,
        salesCount: 142,
      },
      {
        name: "Pods Lite True Wireless Earbuds",
        slug: "pods-lite-wireless-earbuds",
        sku: "AOP-AUD-002",
        description:
          "Ultra-light stemmed earbuds with an ergonomic pocket-sized case. Experience crystal clear call quality with dual beamforming microphones and a 60ms ultra-low latency mode for mobile gaming.",
        category: categoryMap.get("audio-and-earbuds"),
        images: [
          { url: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1200&q=80", alt: "Pods Lite Earbuds White" },
          { url: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=1200&q=80", alt: "Pods Lite Earbuds Case" },
        ],
        price: 6999,
        originalPrice: 8500,
        costPrice: 4200,
        stock: 35,
        variants: [
          { name: "Color", value: "Arctic White", stock: 25, priceModifier: 0 },
          { name: "Color", value: "Midnight Black", stock: 10, priceModifier: 0 },
        ],
        specifications: [
          { key: "Battery", value: "6 h per charge + 24 h charging case" },
          { key: "Water Resistance", value: "IPX4 splash & sweat proof" },
          { key: "Latency", value: "60 ms dedicated gaming mode" },
          { key: "Bluetooth", value: "5.3 with instant pairing" },
        ],
        tags: ["earbuds", "tws", "audio", "bluetooth"],
        isFeatured: true,
        isNewArrival: true,
        isPublished: true,
        rating: 4.8,
        reviewCount: 64,
        salesCount: 280,
      },
      {
        name: "GaN 65W Multi-Port Fast Charger",
        slug: "gan-65w-fast-charger",
        sku: "AOP-PWR-001",
        description:
          "Gallium-nitride (GaN) fast charger that simultaneously powers a laptop, smartphone, and tablet while occupying less space than an ordinary 20W power brick. Supports universal fast charging protocols.",
        category: categoryMap.get("adapters-and-chargers"),
        images: [
          { url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80", alt: "GaN 65W Charger Front" },
          { url: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1200&q=80", alt: "GaN 65W Charger In Hand" },
        ],
        price: 4499,
        originalPrice: 5200,
        costPrice: 2600,
        stock: 45,
        variants: [
          { name: "Color", value: "Matte Black", stock: 25, priceModifier: 0 },
          { name: "Color", value: "Chalk White", stock: 20, priceModifier: 0 },
        ],
        specifications: [
          { key: "Total Output", value: "65 W Max" },
          { key: "Port Configuration", value: "2× USB-C Power Delivery, 1× USB-A" },
          { key: "Fast Protocols", value: "PD 3.0, PPS, QC 4+, AFC, FCP" },
          { key: "Protection", value: "Over-voltage, surge, and heat control" },
        ],
        tags: ["charger", "gan", "power", "fast-charging"],
        isFeatured: true,
        isNewArrival: true,
        isPublished: true,
        rating: 4.9,
        reviewCount: 52,
        salesCount: 310,
      },
      {
        name: "Field Watch AMOLED Smartwatch",
        slug: "field-watch-amoled",
        sku: "AOP-WRB-001",
        description:
          "A crisp 1.43-inch always-on AMOLED display encased in aircraft-grade aluminium. Comprehensive health tracking with continuous heart rate, blood oxygen (SpO2), advanced sleep tracking, 100+ sport modes, and direct Bluetooth phone calls.",
        category: categoryMap.get("smart-wearables"),
        images: [
          { url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80", alt: "Field Watch Black Dial" },
          { url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80", alt: "Field Watch Silver Strap" },
        ],
        price: 12999,
        originalPrice: 15499,
        costPrice: 8500,
        stock: 12,
        variants: [
          { name: "Color", value: "Space Black", stock: 7, priceModifier: 0 },
          { name: "Color", value: "Titanium Silver", stock: 5, priceModifier: 500 },
        ],
        specifications: [
          { key: "Display", value: "1.43\" Ultra HD AMOLED (466x466)" },
          { key: "Battery Life", value: "Up to 10 days normal use" },
          { key: "Water Resistance", value: "5 ATM (50 meters swim-proof)" },
          { key: "Sensors", value: "BioTracker Optical HR, SpO2, Compass" },
        ],
        tags: ["watch", "smartwatch", "wearables", "amoled"],
        isFeatured: true,
        isNewArrival: false,
        isPublished: true,
        rating: 4.7,
        reviewCount: 29,
        salesCount: 88,
      },
      {
        name: "Pocket 10K Magnetic MagSafe Power Bank",
        slug: "pocket-10k-magsafe-powerbank",
        sku: "AOP-PWR-002",
        description:
          "Ultra-compact 10,000mAh magnetic battery pack designed for MagSafe devices. Delivers 15W wireless charging and 22.5W two-way fast USB-C output. Recharges your phone twice on a single charge and is completely flight-safe.",
        category: categoryMap.get("power-banks"),
        images: [
          { url: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1200&q=80", alt: "Pocket 10K Power Bank" },
          { url: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=1200&q=80", alt: "Pocket 10K Charging Phone" },
        ],
        price: 5499,
        originalPrice: 6500,
        costPrice: 3200,
        stock: 18,
        variants: [
          { name: "Color", value: "Deep Black", stock: 12, priceModifier: 0 },
          { name: "Color", value: "Titanium Gray", stock: 6, priceModifier: 0 },
        ],
        specifications: [
          { key: "Capacity", value: "10,000 mAh (38.5Wh)" },
          { key: "Wireless Charging", value: "15W MagSafe magnetic alignment" },
          { key: "Wired Output", value: "22.5W USB-C PD Fast Charge" },
          { key: "Weight", value: "198 g" },
        ],
        tags: ["powerbank", "magsafe", "battery", "fast-charging"],
        isFeatured: true,
        isNewArrival: false,
        isPublished: true,
        rating: 4.8,
        reviewCount: 41,
        salesCount: 195,
      },
      {
        name: "Braided 100W USB-C to USB-C Fast Cable (2M)",
        slug: "braided-100w-type-c-cable",
        sku: "AOP-CBL-001",
        description:
          "Military-grade double-braided nylon charging cable engineered to withstand 30,000+ bends. Equipped with an E-marker smart chip supporting up to 100W PD charging for laptops, tablets, and flagship phones.",
        category: categoryMap.get("cables-and-protection"),
        images: [
          { url: "https://images.unsplash.com/photo-1601524909162-ae8725290836?auto=format&fit=crop&w=1200&q=80", alt: "Braided Cable Rolled" },
          { url: "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?auto=format&fit=crop&w=1200&q=80", alt: "Braided Cable Connectors" },
        ],
        price: 1499,
        originalPrice: 1999,
        costPrice: 650,
        stock: 80,
        variants: [
          { name: "Color", value: "Obsidian Black", stock: 50, priceModifier: 0 },
          { name: "Color", value: "Blaze Orange", stock: 30, priceModifier: 0 },
        ],
        specifications: [
          { key: "Power Rating", value: "100W (20V / 5A) with E-Marker" },
          { key: "Cable Length", value: "2.0 meters / 6.6 feet" },
          { key: "Material", value: "Ballistic nylon braid & zinc alloy" },
          { key: "Data Speed", value: "480 Mbps USB 2.0" },
        ],
        tags: ["cable", "usb-c", "100w", "charger"],
        isFeatured: false,
        isNewArrival: true,
        isPublished: true,
        rating: 4.9,
        reviewCount: 89,
        salesCount: 420,
      },
      {
        name: "Boom Mini IP67 Waterproof Bluetooth Speaker",
        slug: "boom-mini-waterproof-speaker",
        sku: "AOP-AUD-003",
        description:
          "Pocket-sized powerhouse with deep passive bass radiator and 360-degree acoustic dispersion. IP67 waterproof and dustproof with up to 12 hours of battery playtime. Pair two together for true wireless stereo.",
        category: categoryMap.get("wireless-speakers"),
        images: [
          { url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=80", alt: "Boom Mini Speaker Front" },
          { url: "https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=1200&q=80", alt: "Boom Mini Outdoors" },
        ],
        price: 7999,
        originalPrice: 9499,
        costPrice: 4800,
        stock: 22,
        variants: [
          { name: "Color", value: "Charcoal Black", stock: 14, priceModifier: 0 },
          { name: "Color", value: "Crimson Red", stock: 8, priceModifier: 0 },
        ],
        specifications: [
          { key: "Sound Output", value: "10W RMS with bass radiator" },
          { key: "Playtime", value: "12 Hours at 60% volume" },
          { key: "Water Rating", value: "IP67 Submersible up to 1 meter" },
          { key: "Bluetooth", value: "5.3 with TWS stereo pairing" },
        ],
        tags: ["speaker", "audio", "bluetooth", "waterproof"],
        isFeatured: false,
        isNewArrival: false,
        isPublished: true,
        rating: 4.8,
        reviewCount: 33,
        salesCount: 110,
      },
      {
        name: "Clear Armor Anti-Yellowing MagSafe Case",
        slug: "clear-armor-magsafe-case",
        sku: "AOP-CSE-001",
        description:
          "Crystal-clear protective case formulated with optical-grade anti-yellowing polymers. Features shock-absorbing corner airbags rated for 3-meter drops and a built-in neodymium magnetic ring for flawless MagSafe accessories.",
        category: categoryMap.get("cables-and-protection"),
        images: [
          { url: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1200&q=80", alt: "Clear Armor Case Clean" },
          { url: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1200&q=80", alt: "Clear Armor Case On Phone" },
        ],
        price: 1899,
        originalPrice: 2499,
        costPrice: 750,
        stock: 50,
        variants: [
          { name: "Finish", value: "Crystal Clear", stock: 35, priceModifier: 0 },
          { name: "Finish", value: "Smoked Matte", stock: 15, priceModifier: 100 },
        ],
        specifications: [
          { key: "Drop Protection", value: "3.0 meters (Military standard)" },
          { key: "Magnetism", value: "38× N52 strong neodymium magnets" },
          { key: "Material", value: "Bayer TPU + Polycarbonate" },
          { key: "Bezel", value: "1.2 mm raised screen & camera lip" },
        ],
        tags: ["case", "magsafe", "iphone", "protection"],
        isFeatured: false,
        isNewArrival: true,
        isPublished: true,
        rating: 4.9,
        reviewCount: 47,
        salesCount: 360,
      },
    ];

    for (const p of productsData) {
      await Product.create(p);
      console.log(`✅ Product created: ${p.name}`);
    }
  }
}
