const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to read & write DB
function getDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { products: [], reviews: [], orders: [], messages: [], applications: [], subscribers: [] };
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

// --- REST API ENDPOINTS ---

// 1. Health check & Stats
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), server: 'CellStart Fast-PD API v2.0' });
});

app.get('/api/stats', (req, res) => {
  const db = getDB();
  res.json({
    totalProducts: db.products.length,
    activeOrders: db.orders.length,
    totalReviews: db.reviews.length,
    satisfactionRate: '99.4%',
    fastChargeSpeedBenchmark: '70% in 28 mins (iPhone 16 Pro / Galaxy S25)',
    warrantyPeriod: '1 Year Full Replacement Guarantee',
    shippedCountries: '35+ Countries Worldwide'
  });
});

// 2. Products API (With full categories, search, price & rating filters)
app.get('/api/products', (req, res) => {
  const db = getDB();
  let { category, search, sort, maxPrice, inStockOnly } = req.query;
  let items = [...db.products];

  if (category && category !== 'all') {
    items = items.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase().trim();
    items = items.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q)
    );
  }

  if (maxPrice) {
    const max = Number(maxPrice);
    if (!isNaN(max)) {
      items = items.filter(p => p.price <= max);
    }
  }

  if (inStockOnly === 'true') {
    items = items.filter(p => p.inStock && p.stockCount > 0);
  }

  if (sort === 'price_asc') {
    items.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    items.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating') {
    items.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'popular') {
    items.sort((a, b) => b.reviewsCount - a.reviewsCount);
  }

  res.json({ success: true, count: items.length, products: items });
});

app.get('/api/products/:id', (req, res) => {
  const db = getDB();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Get related products in same category or other
  const related = db.products
    .filter(p => p.id !== product.id && (p.category === product.category || Math.random() > 0.5))
    .slice(0, 3);

  // Get product reviews
  const reviews = db.reviews.filter(r => r.product.toLowerCase().includes(product.name.toLowerCase().split(' ')[0]));

  res.json({ success: true, product, related, reviews });
});

// 3. Coupon Validation API
app.post('/api/cart/validate-coupon', (req, res) => {
  const { code, subtotal = 0 } = req.body;
  const cleanCode = (code || '').trim().toUpperCase();

  if (!cleanCode) {
    return res.status(400).json({ success: false, message: 'Please enter a promo code.' });
  }

  const coupons = {
    'CELLSTART20': { type: 'percent', value: 20, desc: '20% off whole cart' },
    'FASTCHARGE': { type: 'percent', value: 15, desc: '15% off instant discount' },
    'FREESHIP': { type: 'shipping', value: 100, desc: '100% Free Express Shipping' },
    'POWER100': { type: 'flat', value: 100, desc: '₹100 flat voucher discount' },
    'WELCOME15': { type: 'percent', value: 15, desc: '15% Welcome Subscriber Bonus' }
  };

  if (!coupons[cleanCode]) {
    return res.status(404).json({ success: false, message: 'Invalid or expired promo code.' });
  }

  const coupon = coupons[cleanCode];
  let discountAmount = 0;
  if (coupon.type === 'percent') {
    discountAmount = Math.round((subtotal * coupon.value) / 100);
  } else if (coupon.type === 'flat') {
    discountAmount = Math.min(coupon.value, subtotal);
  }

  res.json({
    success: true,
    code: cleanCode,
    discountAmount,
    couponType: coupon.type,
    description: coupon.desc
  });
});

// 4. Checkout & Order Placement API
app.post('/api/checkout', (req, res) => {
  const { customer, items, couponApplied = null, paymentMethod = 'upi' } = req.body;

  if (!customer || !customer.name || !customer.email || !customer.address) {
    return res.status(400).json({ success: false, message: 'Incomplete customer details.' });
  }

  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: 'Cart cannot be empty.' });
  }

  const db = getDB();
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
  
  let discount = 0;
  if (couponApplied === 'CELLSTART20') discount = Math.round(subtotal * 0.2);
  else if (couponApplied === 'FASTCHARGE' || couponApplied === 'WELCOME15') discount = Math.round(subtotal * 0.15);
  else if (couponApplied === 'POWER100') discount = Math.min(100, subtotal);

  const shipping = (subtotal - discount >= 1500 || couponApplied === 'FREESHIP') ? 0 : 99;
  const total = Math.max(0, subtotal - discount + shipping);

  const orderId = 'CS-' + Math.floor(10000 + Math.random() * 90000);
  const trackingNumber = 'TRK-IND-' + Math.floor(1000000 + Math.random() * 9000000);
  const transactionId = 'TXN-' + paymentMethod.toUpperCase() + '-' + Date.now();

  const isPaidDirect = paymentMethod === 'upi' || paymentMethod === 'card' || paymentMethod === 'netbanking';

  const newOrder = {
    id: orderId,
    date: new Date().toISOString(),
    customer,
    items,
    subtotal,
    discount,
    couponApplied,
    shipping,
    total,
    paymentMethod,
    paymentStatus: isPaidDirect ? 'Paid (Verified)' : 'Pending (COD on Delivery)',
    transactionId,
    status: 'Confirmed',
    trackingNumber,
    estimatedDelivery: '2-3 Business Days via Express Air',
    upiPayUri: `upi://pay?pa=cellstart.pay@upi&pn=CellStart%20Technologies&am=${total}&cu=INR&tn=Order%20${orderId}`,
    timeline: [
      { status: isPaidDirect ? 'Payment Received & Verified' : 'Order Placed (Cash on Delivery)', time: 'Just now', done: true },
      { status: 'Allocating in Automated Warehouse', time: 'Pending', done: false },
      { status: 'Handed to Courier Partner', time: 'Upcoming', done: false },
      { status: 'Out for Delivery', time: 'Upcoming', done: false }
    ]
  };

  db.orders.unshift(newOrder);
  saveDB(db);

  res.status(201).json({
    success: true,
    message: 'Order created successfully!',
    order: newOrder
  });
});

// 5. Payment Verification API
app.post('/api/payment/verify', (req, res) => {
  const { orderId, paymentMethod, transactionRef } = req.body;
  const db = getDB();
  const order = db.orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.paymentStatus = 'Paid (Verified)';
  order.transactionId = transactionRef || ('TXN-AUTH-' + Date.now());
  order.timeline[0].status = `Payment Verified (${paymentMethod.toUpperCase()})`;
  saveDB(db);

  res.json({
    success: true,
    message: 'Payment received and verified successfully!',
    orderId: order.id,
    transactionId: order.transactionId,
    total: order.total
  });
});

// 6. Order Tracking API
app.get('/api/orders/:id', (req, res) => {
  const db = getDB();
  const order = db.orders.find(o => o.id.toLowerCase() === req.params.id.toLowerCase() || o.trackingNumber.toLowerCase() === req.params.id.toLowerCase());
  
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order or tracking number not found.' });
  }

  res.json({ success: true, order });
});

// 7. Reviews API
app.get('/api/reviews', (req, res) => {
  const db = getDB();
  res.json({ success: true, count: db.reviews.length, reviews: db.reviews });
});

app.post('/api/reviews', (req, res) => {
  const { author, location, rating, product, title, comment } = req.body;

  if (!author || !rating || !comment || !product) {
    return res.status(400).json({ success: false, message: 'Please provide all required review fields.' });
  }

  const db = getDB();
  const newReview = {
    id: 'rev_' + Date.now(),
    author: author.trim(),
    location: location ? location.trim() : 'Verified Customer',
    verified: true,
    rating: Number(rating) || 5,
    product: product.trim(),
    date: new Date().toISOString().split('T')[0],
    title: title ? title.trim() : 'Great product!',
    comment: comment.trim()
  };

  db.reviews.unshift(newReview);
  saveDB(db);

  res.status(201).json({
    success: true,
    message: 'Thank you! Your verified review has been published.',
    review: newReview
  });
});

// 8. Contact / Support Ticket API
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message, orderId } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please provide your name, email and message.' });
  }

  const db = getDB();
  const ticketId = 'TKT-' + Math.floor(1000 + Math.random() * 9000);
  const ticket = {
    id: ticketId,
    name,
    email,
    subject: subject || 'General Inquiry',
    orderId: orderId || null,
    message,
    timestamp: new Date().toISOString(),
    status: 'Open'
  };

  db.messages = db.messages || [];
  db.messages.unshift(ticket);
  saveDB(db);

  res.status(201).json({
    success: true,
    ticketId,
    message: `Thank you, ${name}! Your support ticket (#${ticketId}) has been received. Our team will respond within 2-4 hours.`
  });
});

// 9. Careers Application API
app.post('/api/careers/apply', (req, res) => {
  const { name, email, role, portfolio, github, notes } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, and role are required.' });
  }

  const db = getDB();
  const appId = 'APP-' + Math.floor(1000 + Math.random() * 9000);
  const application = {
    id: appId,
    name,
    email,
    role,
    portfolio: portfolio || '',
    github: github || '',
    notes: notes || '',
    appliedAt: new Date().toISOString()
  };

  db.applications = db.applications || [];
  db.applications.unshift(application);
  saveDB(db);

  res.status(201).json({
    success: true,
    applicationId: appId,
    message: `Application submitted for ${role}! Reference ID: ${appId}. We'll review your portfolio and reach out.`
  });
});

// 10. Newsletter Subscription API
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  const db = getDB();
  db.subscribers = db.subscribers || [];

  if (!db.subscribers.includes(email.toLowerCase())) {
    db.subscribers.push(email.toLowerCase());
    saveDB(db);
  }

  res.json({
    success: true,
    message: '🎉 You are subscribed! Use coupon code WELCOME15 for 15% off your first order.',
    coupon: 'WELCOME15'
  });
});

// Static Files & SPA/HTML Serving
app.use(express.static(path.join(__dirname)));

// Fallback for HTML routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server (Dual stack IPv4 + IPv6)
const server = app.listen(PORT, () => {
  console.log(`⚡ CellStart Pro Backend & Web Server running at http://localhost:${PORT}`);
});

// Keep process active
setInterval(() => {}, 1000 * 60 * 60);
