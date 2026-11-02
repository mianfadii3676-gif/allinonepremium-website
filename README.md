# Allinonepremium.store — Premium Mobile Accessories & Electronics Platform

A modern, high-performance, full-featured ecommerce platform for **Allinonepremium.store**, built with Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion, and MongoDB Atlas (via Mongoose).

---

## 🚀 Key Features

### 1. Brand Identity & Visual Design
- **Sophisticated Palette:** Dark-and-light neutral background (`#0B0F19`, `#111827`) with restrained electric-blue accents (`#0066FF`, `#00D2FF`).
- **Branded Startup Animation:** Smooth loader animation featuring the glowing electric-blue wordmark and seamless entry transition.
- **Glassmorphic Elements & Micro-interactions:** Refined borders, subtle glows, and responsive feedback across desktop and mobile.

### 2. Interactive Product Presentation
- **Two-Image Hover Effect:** Product cards smoothly crossfade between primary and secondary product photography on desktop hover. Touch-friendly image indicators on mobile devices.
- **Quick View Modal:** Instant product previews with interactive image gallery, variant selection, and direct add-to-cart.
- **Dedicated Product Pages (`/products/[slug]`):** Multi-angle gallery with thumbnail navigation, detailed technical specifications table, variant selectors, stock badges, delivery information, and related product recommendations.

### 3. Shopping & Checkout Flow
- **Persistent Shopping Cart:** Zustand-powered cart persisted in `localStorage` with a responsive slide-out Cart Drawer and free delivery progress tracker.
- **Search & Filtering (`/shop`):** Real MongoDB querying by keyword, category, price range, stock availability, and sorting (Featured, Newest, Price Low to High, Price High to Low, Most Popular).
- **Cash on Delivery (COD) Checkout (`/checkout`):** Seamless checkout capturing customer details, city, delivery address, and order notes.
- **Concurrency-Safe Order Processing (`/api/orders`):** Atomic inventory validation and deduction (`$inc: { stock: -qty }`), customer lifetime spend aggregation, and unique order number generation (`AOP-YYYYMMDD-XXXX`).
- **Order Tracking & Confirmation (`/order-success/[id]`):** Complete receipt with order breakdown, live delivery status timeline, and direct WhatsApp customer support link.

### 4. Admin Management Dashboard (`/admin`)
- **Secure Authentication:** Protected admin portal using NextAuth with bcrypt password hashing and server-side authorization.
- **Live Metrics Overview:** Total revenue, order status breakdown (Pending, Confirmed, Processing, Shipped, Delivered, Cancelled), low-stock warning banners, and recent customer purchases.
- **Product Management (`/admin/products`):** Full CRUD, multi-image upload (Cloudinary integration + local persistent fallback), variant management, technical specifications, stock updates, and publishing toggles.
- **Category Management (`/admin/categories`):** Add and organize categories with display order, image banners, and item counts.
- **Order Management (`/admin/orders`):** Filter by status, search by order number or customer, update order statuses with status history audit logs, cancellation reason tracking, and automated inventory restock upon cancellation.
- **Customer CRM (`/admin/customers`):** Customer profiles derived from verified orders, lifetime spending, and purchase history.
- **In-App Notification Center (`/admin/notifications`):** Real-time alerts for new orders, low stock, out-of-stock items, and order cancellations with unread counter badges.
- **Store Settings (`/admin/settings`):** Customizable store contact information, delivery charges, free shipping thresholds, low-stock alerts, and store policies.

---

## 🛠️ Technology Stack

- **Framework:** Next.js (App Router, Turbopack)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS
- **Database:** MongoDB Atlas (with Mongoose models & indexes)
- **Local Fallback:** `mongodb-memory-server` (automatic in-memory fallback for zero-configuration local dev/testing)
- **State Management:** Zustand
- **Authentication:** NextAuth (Credentials provider + JWT session strategy)
- **Image Storage:** Cloudinary (with local disk `/uploads` fallback)
- **Icons:** Lucide React

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection (Atlas URI or leave empty for auto-started local MongoDB)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/allinonepremium?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secure-random-secret-key-change-this
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cloudinary Image Storage (Optional - falls back to local /uploads if not set)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Initial Super Admin Account (created automatically on first seed)
ADMIN_INITIAL_EMAIL=admin@allinonepremium.store
ADMIN_INITIAL_PASSWORD=Admin123456!
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed the Database
Populate the 6 featured categories, initial admin user, store settings, and 8 premium mobile accessories with multiple images:
```bash
npm run seed
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Admin Portal Access
- **URL:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Email:** `admin@allinonepremium.store`
- **Password:** `Admin123456!`

### 5. Production Build & Verification
```bash
npm run typecheck
npm run build
npm run start
```

---

## 📂 Project Architecture

```
├── scripts/
│   ├── seed.ts                    # Database seeder (admin, categories, settings, products)
│   └── test-e2e.ts                # End-to-end purchasing & inventory test script
├── src/
│   ├── app/
│   │   ├── (storefront)/
│   │   │   ├── page.tsx           # Homepage (Hero, Categories, Best Sellers, Trust)
│   │   │   ├── shop/              # Product catalogue with live search & filters
│   │   │   ├── products/[slug]/   # Product details page with image gallery & specs
│   │   │   ├── checkout/          # Cash on Delivery checkout flow
│   │   │   ├── order-success/     # Order receipt & delivery status tracking
│   │   │   ├── contact/           # Customer support page
│   │   │   └── policies/          # Return, shipping & privacy policies
│   │   ├── admin/
│   │   │   ├── page.tsx           # Admin Overview Dashboard
│   │   │   ├── login/             # Admin sign-in portal
│   │   │   ├── products/          # Product catalogue management & image upload
│   │   │   ├── categories/        # Category management
│   │   │   ├── orders/            # Order fulfillment & status transition workflow
│   │   │   ├── customers/         # Customer directory & order history
│   │   │   ├── notifications/     # System event notification center
│   │   │   └── settings/          # Store identity & delivery settings
│   │   ├── api/                   # Server API route handlers
│   │   │   ├── products/          # Public product search & details APIs
│   │   │   ├── categories/        # Public category listings
│   │   │   ├── orders/            # Order placement & retrieval APIs
│   │   │   ├── upload/            # Image upload handler (Cloudinary / local)
│   │   │   └── admin/             # Protected admin API routes
│   │   ├── layout.tsx             # Root layout with CartDrawer & AppLoader
│   │   ├── globals.css            # Tailwind styling & dark mode design tokens
│   │   ├── robots.ts              # SEO robots configuration
│   │   └── sitemap.ts             # Dynamic XML sitemap
│   ├── components/
│   │   ├── cart/                  # CartDrawer & shopping cart components
│   │   ├── home/                  # Hero, FeaturedCategories, ProductSection, Trust
│   │   ├── layout/                # Header, Footer, AppLoader
│   │   ├── product/               # ProductCard (Two-Image Hover), QuickViewModal
│   │   └── ui/                    # Animated Toast notifications
│   ├── hooks/                     # Custom React hooks
│   ├── lib/
│   │   ├── auth/                  # NextAuth credentials authentication & helpers
│   │   ├── db/                    # Mongoose connection & MongoMemoryServer fallback
│   │   ├── models/                # Mongoose schemas (Product, Order, Category, etc.)
│   │   ├── store/                 # Zustand Cart & Toast stores
│   │   └── utils/                 # Formatting, slugify, and order number utilities
│   ├── proxy.ts                   # Next.js 16 route proxy & protection
│   └── types/                     # Shared TypeScript interfaces & enums
```
