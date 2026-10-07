<div align="center">

# ⚡ CellStart — Next-Gen GaN Charging & Tech Ecosystem

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![JavaScript](https://img.shields.io/badge/ES6+-Vanilla%20JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-Modern%20Design%20System-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](https://github.com/Anurag94507/cellstart-site/pulls)

<p align="center">
  <strong>High-performance, ultra-fast GaN chargers, MagSafe wireless docks, and braided silicon power cables designed for the modern multi-device workspace.</strong>
</p>

[Explore Store](http://localhost:3000/shop.html) • [View Features](http://localhost:3000/features.html) • [Track Order](http://localhost:3000/contact.html) • [API Docs](#-rest-api-reference)

---

</div>

## 🌟 Overview

**CellStart** is a full-featured e-commerce and brand platform built for high-wattage GaN charging hardware and premium mobile peripherals. Engineered with a lightning-fast Node.js/Express backend and an immersive, dark-mode cyber-aesthetic frontend featuring micro-animations, glassmorphism, dynamic cart & checkout with UPI simulation, real-time live order tracking, and promo code discounts.

---

## ✨ Key Features

### 🛒 E-Commerce & Product Showcase
- **Dynamic Catalog:** Real-time search, category filtering (GaN Chargers, MagSafe Wireless, Braided Cables, Hubs & Docks, Audio), price sliders, and sorting (price, rating, popularity).
- **Product Detail Engine:** Deep-dive specs matrix, power benchmark graphs (0–50% in 28 mins), stock counter, multi-item image views, and customer reviews.
- **Smart Cart & Checkout:** Persistent drawer cart, quantity management, interactive coupon discount engine with instant recalculation, and multi-option checkout (UPI, Cards, NetBanking, COD).
- **Payment & Order Processing:** Generates unique order IDs (`CS-XXXXX`), real-time tracking numbers (`TRK-IND-XXXXXXX`), dynamic UPI payment deep-links, and multi-stage delivery timelines.

### 📦 Order Tracking & Logistics
- **Live Tracker:** Real-time lookup by Order ID or Tracking Number with 4-stage automated timeline status (Payment Verified ➔ Warehouse Allocation ➔ In Transit ➔ Out for Delivery).

### 🛠️ Interactive Brand Experience
- **GaNFast™ & ThermalGuard 3.0 Matrix:** Visual breakdown of GaN III semiconductor efficiency, dual NTC thermal safety checks (3.2M checks/day), and PD 3.1 EPR (140W) protocol benchmarks.
- **Verified Reviews & Community:** Real customer testimonials with verified badges, rating statistics, and an interactive review submission portal.
- **Career Portal:** Interactive job application system (`/api/careers/apply`) with resume and portfolio submission.
- **24/7 Support Desk:** Automated customer ticket generation with instant ticket IDs and response estimation.
- **Newsletter Engine:** Instant promo bonus distribution (`WELCOME15`) upon email subscription.

---

## 🚀 Available Promo Codes

Test the checkout system using these built-in discount promo codes:

| Promo Code | Discount Type | Benefit |
| :--- | :--- | :--- |
| `CELLSTART20` | **20% OFF** | 20% discount on entire cart subtotal |
| `FASTCHARGE` | **15% OFF** | 15% instant markdown discount |
| `FREESHIP` | **Free Shipping** | 100% discount on standard express shipping |
| `POWER100` | **Flat ₹100** | ₹100 direct cash voucher reduction |
| `WELCOME15` | **15% OFF** | New subscriber 15% welcome discount |

---

## 📂 Project Structure

```text
cellstart-site/
├── assets/                  # High-definition SVG product graphics & brand icons
│   ├── charger-140w.svg     # VoltStation 140W GaN Desktop Charger
│   ├── charger-65w.svg      # NanoGaN 65W Ultra-Compact Dual Port
│   ├── magsafe-3in1.svg     # MagFlow 3-in-1 Foldable Charging Stand
│   ├── powerbank-27k.svg    # PowerCore Ultra 27,600mAh 140W Laptop Battery
│   └── ... (23+ vector visual assets)
├── css/
│   └── styles.css           # Modern design system with CSS custom properties & animations
├── data/
│   └── db.json              # Local JSON database (products, reviews, orders, tickets, careers)
├── js/
│   └── main.js              # Client-side routing, cart state management, and API integrations
├── .gitignore               # Git ignored patterns
├── about.html               # Company vision, engineering labs, and global footprint
├── blog.html                # Tech editorial on GaN vs Silicon and charging protocols
├── careers.html             # Job openings and career application form
├── contact.html             # Support ticket portal and live order tracker
├── features.html            # Deep dive into GaN III, PD 3.1 & ThermalGuard safety
├── index.html               # Main landing page with hero, flash deals & feature grid
├── package.json             # NPM dependencies and scripts
├── product.html             # Single product dynamic detail view
├── products.html            # Product catalog & filter grid
├── server.js                # Express backend server with REST API routes
├── shop.html                # Dedicated shop view
└── testimonials.html        # Customer reviews and submission portal
```

---

## 📡 REST API Reference

The server exposes clean, lightweight REST endpoints backed by local JSON storage:

### ⚡ General & Products
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck and server version status |
| `GET` | `/api/stats` | Global benchmark stats (satisfaction, warranty, products) |
| `GET` | `/api/products` | Retrieve all products (Supports `?category=`, `?search=`, `?sort=`, `?maxPrice=`) |
| `GET` | `/api/products/:id` | Get single product detail with related items and reviews |

### 💳 Cart, Checkout & Orders
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/cart/validate-coupon` | Validate promo code and calculate discount |
| `POST` | `/api/checkout` | Process order, generate tracking & order ID |
| `POST` | `/api/payment/verify` | Verify UPI / Card transaction reference |
| `GET` | `/api/orders/:id` | Lookup order details and live shipping timeline |

### 💬 Support, Community & Careers
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/reviews` | List all verified customer reviews |
| `POST` | `/api/reviews` | Submit a new verified product review |
| `POST` | `/api/contact` | Create a customer support help ticket |
| `POST` | `/api/careers/apply` | Submit job application and resume/portfolio |
| `POST` | `/api/newsletter` | Subscribe email and receive welcome discount code |

---

## 🛠️ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (bundled with Node.js)

### 1. Clone the Repository
```bash
git clone https://github.com/Anurag94507/cellstart-site.git
cd cellstart-site
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

The application will be live at:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 💻 Tech Stack

- **Frontend:** Vanilla HTML5, Modern CSS3 (Custom Properties, Flexbox/CSS Grid, Glassmorphism, Micro-Animations), ES6+ Vanilla JavaScript.
- **Backend:** Node.js, Express.js.
- **Data Store:** File-based JSON Database (`data/db.json`).
- **Assets:** Scalable Vector Graphics (SVG) crafted specifically for high-DPI displays.

---

## 📄 License

This project is licensed under the **ISC License**.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Anurag94507">Anurag</a> • Powered by CellStart GaN Hardware</sub>
</div>
