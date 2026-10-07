/**
 * CELLSTART PRO — CLIENT APPLICATION CORE & PAYMENT GATEWAY ENGINE
 * Connects frontend interactive UI with Express REST API, UPI & Card Gateways
 */

// Global State
const CellStart = {
  cart: JSON.parse(localStorage.getItem('cs_cart') || '[]'),
  appliedCoupon: JSON.parse(localStorage.getItem('cs_coupon') || 'null'),
  products: [],
  theme: localStorage.getItem('cs_theme') || 'dark',
  activeOrder: null,

  // Initialize
  init() {
    this.applyTheme(this.theme);
    this.updateCartUI();
    this.setupEventListeners();
    this.initSearchShortcut();
    this.initBenchmark();
  },

  // Theme Handling
  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cs_theme', theme);
    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeIcon) {
      themeIcon.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }
  },

  toggleTheme() {
    this.applyTheme(this.theme === 'dark' ? 'light' : 'dark');
    this.showToast(`Switched to ${this.theme} mode`, 'info');
  },

  // Toast System
  showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Cart Store Methods
  addToCart(product, qty = 1) {
    const existing = this.cart.find(item => item.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: qty
      });
    }
    this.saveCart();
    this.updateCartUI();
    this.openCart();
    this.showToast(`Added ${product.name} to bag!`, 'success');
  },

  updateQty(id, delta) {
    const item = this.cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      this.cart = this.cart.filter(i => i.id !== id);
    }
    this.saveCart();
    this.updateCartUI();
  },

  removeFromCart(id) {
    this.cart = this.cart.filter(i => i.id !== id);
    this.saveCart();
    this.updateCartUI();
    this.showToast('Item removed from cart', 'info');
  },

  saveCart() {
    localStorage.setItem('cs_cart', JSON.stringify(this.cart));
  },

  openCart() {
    document.getElementById('cart-drawer')?.classList.add('open');
    document.getElementById('cart-overlay')?.classList.add('open');
  },

  closeCart() {
    document.getElementById('cart-drawer')?.classList.remove('open');
    document.getElementById('cart-overlay')?.classList.remove('open');
  },

  // UI Updates
  updateCartUI() {
    const count = this.cart.reduce((acc, item) => acc + item.qty, 0);
    const badge = document.getElementById('cart-count-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }

    const body = document.getElementById('cart-items-body');
    if (!body) return;

    if (this.cart.length === 0) {
      body.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;color:var(--text-muted)">
          <div style="font-size:3rem;margin-bottom:1rem">🛍️</div>
          <h4 style="color:var(--text-primary);margin-bottom:0.5rem">Your Cart is Empty</h4>
          <p style="font-size:0.9rem">Explore our fast chargers, cables, and accessories!</p>
          <a href="products.html" class="btn btn-primary btn-sm" style="margin-top:1.25rem" onclick="CellStart.closeCart()">Shop Catalog</a>
        </div>
      `;
      document.getElementById('cart-subtotal').textContent = '₹0';
      document.getElementById('cart-discount').textContent = '-₹0';
      document.getElementById('cart-shipping').textContent = '₹0';
      document.getElementById('cart-total').textContent = '₹0';
      document.getElementById('checkout-btn')?.setAttribute('disabled', 'true');
      return;
    }

    document.getElementById('checkout-btn')?.removeAttribute('disabled');

    body.innerHTML = this.cart.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" />
        <div>
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">₹${item.price.toLocaleString()}</div>
          <div class="cart-qty-ctrl">
            <button class="qty-btn" onclick="CellStart.updateQty('${item.id}', -1)">-</button>
            <span style="font-size:0.85rem;font-weight:700;padding:0 0.4rem">${item.qty}</span>
            <button class="qty-btn" onclick="CellStart.updateQty('${item.id}', 1)">+</button>
          </div>
        </div>
        <button class="icon-btn" style="width:30px;height:30px" onclick="CellStart.removeFromCart('${item.id}')">✕</button>
      </div>
    `).join('');

    const subtotal = this.cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    
    let discount = 0;
    if (this.appliedCoupon) {
      if (this.appliedCoupon.couponType === 'percent') {
        discount = Math.round((subtotal * this.appliedCoupon.discountAmount) / 100);
      } else if (this.appliedCoupon.couponType === 'flat') {
        discount = Math.min(this.appliedCoupon.discountAmount, subtotal);
      }
    }

    const shipping = (subtotal - discount >= 1500 || this.appliedCoupon?.code === 'FREESHIP') ? 0 : 99;
    const total = Math.max(0, subtotal - discount + shipping);

    document.getElementById('cart-subtotal').textContent = `₹${subtotal.toLocaleString()}`;
    document.getElementById('cart-discount').textContent = `-₹${discount.toLocaleString()}`;
    document.getElementById('cart-shipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
    document.getElementById('cart-total').textContent = `₹${total.toLocaleString()}`;

    // Free Shipping Progress
    const freeShipProgress = document.getElementById('free-ship-progress');
    const freeShipText = document.getElementById('free-ship-text');
    if (freeShipProgress && freeShipText) {
      const remaining = Math.max(0, 1500 - subtotal);
      if (remaining === 0 || shipping === 0) {
        freeShipProgress.style.width = '100%';
        freeShipText.innerHTML = '🎉 You qualify for <strong>FREE Express Shipping!</strong>';
      } else {
        const pct = Math.min(100, (subtotal / 1500) * 100);
        freeShipProgress.style.width = `${pct}%`;
        freeShipText.innerHTML = `Add <strong>₹${remaining.toLocaleString()}</strong> more for FREE Shipping!`;
      }
    }
  },

  // Coupon Validator
  async applyCouponCode() {
    const input = document.getElementById('coupon-input');
    const code = input ? input.value.trim() : '';
    if (!code) {
      this.showToast('Please enter a coupon code', 'error');
      return;
    }

    const subtotal = this.cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    try {
      const res = await fetch('/api/cart/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal })
      });
      const data = await res.json();
      if (data.success) {
        this.appliedCoupon = data;
        localStorage.setItem('cs_coupon', JSON.stringify(data));
        this.updateCartUI();
        this.showToast(`Coupon "${data.code}" applied! (${data.description})`, 'success');
        if (input) input.value = '';
      } else {
        this.showToast(data.message || 'Invalid coupon code', 'error');
      }
    } catch (err) {
      this.showToast('Could not validate coupon', 'error');
    }
  },

  // Checkout Flow & Payment Gateway
  openCheckoutModal() {
    if (this.cart.length === 0) {
      this.showToast('Your cart is empty', 'error');
      return;
    }
    this.closeCart();
    const modal = document.getElementById('checkout-modal');
    if (modal) {
      modal.classList.add('open');
      this.renderCheckoutForm();
    }
  },

  closeCheckoutModal() {
    document.getElementById('checkout-modal')?.classList.remove('open');
  },

  renderCheckoutForm() {
    const subtotal = this.cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    let discount = 0;
    if (this.appliedCoupon) {
      if (this.appliedCoupon.couponType === 'percent') discount = Math.round(subtotal * 0.2);
      else if (this.appliedCoupon.couponType === 'flat') discount = Math.min(100, subtotal);
    }
    const shipping = (subtotal - discount >= 1500 || this.appliedCoupon?.code === 'FREESHIP') ? 0 : 99;
    const total = Math.max(0, subtotal - discount + shipping);

    const body = document.getElementById('checkout-modal-body');
    if (!body) return;

    body.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <div>
          <h2 style="font-family:var(--font-heading);font-size:1.6rem;margin-bottom:0.25rem">Secure Checkout & Payment</h2>
          <p style="color:var(--text-secondary);font-size:0.85rem">Direct encrypted checkout with 256-bit SSL protection.</p>
        </div>
        <div class="badge badge-emerald">🔒 100% Encrypted</div>
      </div>

      <div style="background:var(--bg-input);padding:1rem;border-radius:var(--radius-md);margin-bottom:1.5rem;border:1px solid var(--border-subtle)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
          <span style="font-weight:700;font-size:0.95rem">Order Total (${this.cart.length} item${this.cart.length > 1 ? 's' : ''}):</span>
          <span style="font-family:var(--font-heading);font-size:1.4rem;font-weight:900;color:var(--brand-cyan)">₹${total.toLocaleString()}</span>
        </div>
        <div style="font-size:0.8rem;color:var(--text-muted);display:flex;justify-content:space-between">
          <span>Subtotal: ₹${subtotal.toLocaleString()} | Discount: -₹${discount.toLocaleString()} | Shipping: ${shipping === 0 ? 'FREE' : '₹' + shipping}</span>
          ${this.appliedCoupon ? `<span style="color:var(--brand-emerald)">(${this.appliedCoupon.code} applied)</span>` : ''}
        </div>
      </div>

      <form onsubmit="CellStart.submitOrder(event)" id="checkout-main-form">
        <h4 style="font-family:var(--font-heading);font-size:1rem;margin-bottom:0.75rem;color:var(--text-primary)">1. Shipping & Contact Information</h4>
        <div class="form-row">
          <div class="form-group">
            <label>Full Name *</label>
            <input name="customerName" class="form-control" placeholder="e.g. Anurag Mishra" required />
          </div>
          <div class="form-group">
            <label>Email Address *</label>
            <input name="customerEmail" type="email" class="form-control" placeholder="anurag@example.com" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Phone Number (for Courier SMS) *</label>
            <input name="customerPhone" class="form-control" placeholder="+91 98765 43210" required />
          </div>
          <div class="form-group">
            <label>PIN / Postal Code *</label>
            <input name="customerPincode" class="form-control" placeholder="e.g. 560066" required />
          </div>
        </div>

        <div class="form-group">
          <label>Complete Street Address *</label>
          <textarea name="customerAddress" class="form-control" rows="2" placeholder="House / Flat No, Landmark, City, State" required></textarea>
        </div>

        <h4 style="font-family:var(--font-heading);font-size:1rem;margin:1.25rem 0 0.75rem;color:var(--text-primary)">2. Select Payment Method</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:0.75rem;margin-bottom:1.25rem">
          <label class="payment-pill-label">
            <input type="radio" name="paymentMethod" value="upi" checked onchange="CellStart.switchPaymentTab('upi')" />
            <div class="payment-pill-box">
              <span style="font-size:1.4rem">📱</span>
              <strong>Instant UPI / QR</strong>
              <small style="color:var(--brand-emerald)">Google Pay, PhonePe, Paytm</small>
            </div>
          </label>

          <label class="payment-pill-label">
            <input type="radio" name="paymentMethod" value="card" onchange="CellStart.switchPaymentTab('card')" />
            <div class="payment-pill-box">
              <span style="font-size:1.4rem">💳</span>
              <strong>Cards</strong>
              <small>Visa, Mastercard, RuPay</small>
            </div>
          </label>

          <label class="payment-pill-label">
            <input type="radio" name="paymentMethod" value="netbanking" onchange="CellStart.switchPaymentTab('netbanking')" />
            <div class="payment-pill-box">
              <span style="font-size:1.4rem">🏦</span>
              <strong>Net Banking</strong>
              <small>All Indian Banks</small>
            </div>
          </label>

          <label class="payment-pill-label">
            <input type="radio" name="paymentMethod" value="cod" onchange="CellStart.switchPaymentTab('cod')" />
            <div class="payment-pill-box">
              <span style="font-size:1.4rem">💵</span>
              <strong>Cash on Delivery</strong>
              <small>Pay at Doorstep</small>
            </div>
          </label>
        </div>

        <!-- Dynamic Payment Inputs Accordion -->
        <div id="payment-dynamic-container" style="background:var(--bg-input);padding:1.25rem;border-radius:var(--radius-md);margin-bottom:1.5rem;border:1px solid var(--border-subtle)">
          <!-- Loaded by switchPaymentTab -->
        </div>

        <button type="submit" class="btn btn-primary btn-block" id="pay-submit-btn" style="padding:1rem;font-size:1.05rem">
          Proceed to Pay ₹${total.toLocaleString()} 🔒
        </button>
      </form>
    `;

    this.switchPaymentTab('upi');
  },

  switchPaymentTab(method) {
    const container = document.getElementById('payment-dynamic-container');
    if (!container) return;

    const subtotal = this.cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    let discount = 0;
    if (this.appliedCoupon) {
      if (this.appliedCoupon.couponType === 'percent') discount = Math.round(subtotal * 0.2);
      else if (this.appliedCoupon.couponType === 'flat') discount = Math.min(100, subtotal);
    }
    const shipping = (subtotal - discount >= 1500 || this.appliedCoupon?.code === 'FREESHIP') ? 0 : 99;
    const total = Math.max(0, subtotal - discount + shipping);

    if (method === 'upi') {
      const upiId = `cellstart.pay@upi`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=CellStart%20Technologies&am=${total}&cu=INR&tn=CellStart%20Order`)}`;
      
      container.innerHTML = `
        <div style="display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap">
          <div style="background:#ffffff;padding:0.75rem;border-radius:var(--radius-sm);text-align:center">
            <img src="${qrUrl}" alt="UPI Dynamic QR" style="width:140px;height:140px;margin:0 auto" />
            <div style="color:#0f172a;font-size:0.7rem;font-weight:800;margin-top:0.25rem">SCAN TO PAY ₹${total.toLocaleString()}</div>
          </div>
          <div style="flex:1;min-width:220px">
            <div style="font-weight:700;margin-bottom:0.35rem">Scan with any UPI App:</div>
            <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;flex-wrap:wrap">
              <span class="badge badge-cyan">Google Pay</span>
              <span class="badge badge-emerald">PhonePe</span>
              <span class="badge badge-amber">Paytm</span>
              <span class="badge badge-cyan">BHIM UPI</span>
            </div>
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.75rem">
              Or enter your UPI VPA ID:
            </div>
            <input type="text" id="upi-vpa-input" class="form-control" placeholder="e.g. yourname@oksbi" style="margin-bottom:0.5rem" />
            <div style="font-size:0.75rem;color:var(--brand-emerald)">⚡ Instant Real-Time Verification Active</div>
          </div>
        </div>
      `;
    } else if (method === 'card') {
      container.innerHTML = `
        <div>
          <div class="form-group">
            <label>Card Number</label>
            <input type="text" class="form-control" placeholder="4532 •••• •••• 8921" maxlength="19" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Expiry (MM/YY)</label>
              <input type="text" class="form-control" placeholder="12/28" maxlength="5" required />
            </div>
            <div class="form-group">
              <label>CVV / CVC</label>
              <input type="password" class="form-control" placeholder="•••" maxlength="4" required />
            </div>
          </div>
          <div class="form-group">
            <label>Cardholder Name</label>
            <input type="text" class="form-control" placeholder="Name as on card" required />
          </div>
        </div>
      `;
    } else if (method === 'netbanking') {
      container.innerHTML = `
        <div class="form-group">
          <label>Select Your Bank</label>
          <select class="form-control">
            <option>HDFC Bank</option>
            <option>State Bank of India (SBI)</option>
            <option>ICICI Bank</option>
            <option>Axis Bank</option>
            <option>Kotak Mahindra Bank</option>
            <option>Punjab National Bank</option>
          </select>
        </div>
        <p style="font-size:0.85rem;color:var(--text-secondary)">You will be seamlessly redirected to your bank's 3D secure portal.</p>
      `;
    } else if (method === 'cod') {
      container.innerHTML = `
        <div style="display:flex;align-items:center;gap:1rem">
          <div style="font-size:2rem">💵</div>
          <div>
            <div style="font-weight:700">Cash on Delivery Available</div>
            <p style="font-size:0.85rem;color:var(--text-secondary)">Pay via Cash, UPI or Card at the time of doorstep courier delivery.</p>
          </div>
        </div>
      `;
    }
  },

  async submitOrder(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.customerName.value.trim();
    const email = form.customerEmail.value.trim();
    const phone = form.customerPhone.value.trim();
    const address = `${form.customerAddress.value.trim()}, PIN: ${form.customerPincode.value.trim()}`;
    const paymentMethod = form.paymentMethod.value;

    if (!name || !email || !form.customerAddress.value.trim()) {
      this.showToast('Please fill all required shipping details', 'error');
      return;
    }

    const submitBtn = document.getElementById('pay-submit-btn');
    if (submitBtn) {
      submitBtn.innerHTML = '⚡ Verifying Payment & Processing...';
      submitBtn.disabled = true;
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name, email, phone, address },
          items: this.cart,
          couponApplied: this.appliedCoupon ? this.appliedCoupon.code : null,
          paymentMethod
        })
      });

      const data = await res.json();
      if (data.success) {
        this.activeOrder = data.order;
        // Clear cart
        this.cart = [];
        this.appliedCoupon = null;
        this.saveCart();
        localStorage.removeItem('cs_coupon');
        this.updateCartUI();

        // Render Official Digital Tax Invoice & Receipt
        this.renderTaxInvoice(data.order);
        this.showToast('Payment verified & order placed successfully!', 'success', 5000);
      } else {
        this.showToast(data.message || 'Payment processing failed', 'error');
        if (submitBtn) {
          submitBtn.innerHTML = 'Proceed to Pay 🔒';
          submitBtn.disabled = false;
        }
      }
    } catch (err) {
      this.showToast('Network error during payment verification', 'error');
      if (submitBtn) {
        submitBtn.innerHTML = 'Proceed to Pay 🔒';
        submitBtn.disabled = false;
      }
    }
  },

  renderTaxInvoice(order) {
    const modalContent = document.getElementById('checkout-modal-body');
    if (!modalContent) return;

    modalContent.innerHTML = `
      <div id="printable-invoice" style="background:var(--bg-secondary);padding:1rem;border-radius:var(--radius-md)">
        <!-- Header Receipt -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid var(--brand-cyan);padding-bottom:1rem;margin-bottom:1.25rem">
          <div>
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem">
              <img src="assets/logo.svg" style="width:32px;height:32px" />
              <h2 style="font-family:var(--font-heading);font-size:1.4rem;font-weight:900">CellStart Inc.</h2>
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted)">GSTIN: 29AAACC1204M1Z2 • Official Tax Invoice</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">CellStart Labs, Tech Park 4, Bengaluru, India - 560066</div>
          </div>
          <div style="text-align:right">
            <div class="badge badge-emerald" style="font-size:0.75rem;margin-bottom:0.25rem">✓ ${order.paymentStatus}</div>
            <div style="font-family:var(--font-mono);font-size:1rem;font-weight:800;color:var(--brand-cyan)">${order.id}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${new Date(order.date).toLocaleString()}</div>
          </div>
        </div>

        <!-- Customer & Payment Details -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;background:var(--bg-input);padding:1rem;border-radius:var(--radius-sm);margin-bottom:1.25rem;font-size:0.85rem">
          <div>
            <div style="color:var(--text-muted);font-weight:700;margin-bottom:0.25rem">Billed & Shipped To:</div>
            <strong style="color:var(--text-primary)">${order.customer.name}</strong>
            <div>${order.customer.email}</div>
            <div>${order.customer.phone}</div>
            <div style="color:var(--text-secondary);margin-top:0.25rem">${order.customer.address}</div>
          </div>
          <div>
            <div style="color:var(--text-muted);font-weight:700;margin-bottom:0.25rem">Payment & Delivery Info:</div>
            <div>Method: <strong style="text-transform:uppercase">${order.paymentMethod}</strong></div>
            <div>Txn Ref: <span style="font-family:var(--font-mono);font-size:0.75rem">${order.transactionId}</span></div>
            <div>Tracking: <span style="font-family:var(--font-mono);color:var(--brand-cyan);font-weight:700">${order.trackingNumber}</span></div>
            <div style="color:var(--brand-emerald);font-weight:700;margin-top:0.25rem">Est Delivery: ${order.estimatedDelivery}</div>
          </div>
        </div>

        <!-- Itemized Table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:1rem;font-size:0.85rem">
          <thead>
            <tr style="border-bottom:1px solid var(--border-subtle);color:var(--text-muted);text-align:left">
              <th style="padding:0.5rem 0">Item Description</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Price</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(i => `
              <tr style="border-bottom:1px solid var(--border-subtle)">
                <td style="padding:0.6rem 0;font-weight:600">${i.name}</td>
                <td style="text-align:center">${i.qty}</td>
                <td style="text-align:right">₹${i.price.toLocaleString()}</td>
                <td style="text-align:right;font-weight:700">₹${(i.price * i.qty).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals & Tax -->
        <div style="display:flex;justify-content:flex-end;margin-bottom:1.5rem">
          <div style="width:240px;font-size:0.85rem;display:flex;flex-direction:column;gap:0.35rem">
            <div style="display:flex;justify-content:space-between;color:var(--text-secondary)">
              <span>Subtotal:</span>
              <span>₹${order.subtotal.toLocaleString()}</span>
            </div>
            ${order.discount > 0 ? `
              <div style="display:flex;justify-content:space-between;color:var(--brand-emerald)">
                <span>Coupon (${order.couponApplied}):</span>
                <span>-₹${order.discount.toLocaleString()}</span>
              </div>
            ` : ''}
            <div style="display:flex;justify-content:space-between;color:var(--text-secondary)">
              <span>Express Shipping:</span>
              <span>${order.shipping === 0 ? 'FREE' : '₹' + order.shipping}</span>
            </div>
            <div style="display:flex;justify-content:space-between;color:var(--text-muted);font-size:0.75rem">
              <span>(Includes 18% GST):</span>
              <span>₹${Math.round(order.total * 0.18).toLocaleString()}</span>
            </div>
            <div style="border-top:1px solid var(--border-subtle);padding-top:0.5rem;display:flex;justify-content:space-between;font-weight:900;font-size:1.15rem;color:var(--text-primary)">
              <span>Total Paid:</span>
              <span style="color:var(--brand-cyan)">₹${order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="window.print()">Print / Save PDF Receipt 🖨️</button>
          <button class="btn btn-secondary" onclick="CellStart.trackOrderModal('${order.id}')">Track Shipment 📦</button>
          <button class="btn btn-secondary" onclick="CellStart.closeCheckoutModal()">Done</button>
        </div>
      </div>
    `;
  },

  // Live Order Tracking Modal
  async trackOrderModal(orderId) {
    this.closeCheckoutModal();
    const modal = document.getElementById('tracking-modal');
    if (!modal) return;
    modal.classList.add('open');

    const trackBody = document.getElementById('tracking-modal-body');
    if (trackBody) {
      trackBody.innerHTML = '<div style="text-align:center;padding:2rem">Searching shipment status...</div>';
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success && trackBody) {
        const o = data.order;
        trackBody.innerHTML = `
          <div style="margin-bottom:1.5rem">
            <h3 style="font-family:var(--font-heading);font-size:1.4rem;margin-bottom:0.25rem">Shipment #${o.trackingNumber}</h3>
            <p style="color:var(--text-secondary);font-size:0.9rem">Order ID: ${o.id} • Status: <strong style="color:var(--brand-cyan)">${o.status}</strong></p>
          </div>

          <div style="background:var(--bg-input);padding:1.25rem;border-radius:var(--radius-md);margin-bottom:1.5rem">
            <div style="font-weight:700;margin-bottom:1rem;color:var(--text-primary)">Live Dispatch Timeline</div>
            <div style="display:flex;flex-direction:column;gap:1rem">
              ${o.timeline.map((step, idx) => `
                <div style="display:flex;gap:1rem;align-items:flex-start">
                  <div style="width:24px;height:24px;border-radius:50%;background:${step.done ? 'var(--brand-emerald)' : 'var(--bg-secondary)'};border:2px solid ${step.done ? 'var(--brand-emerald)' : 'var(--border-subtle)'};display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:#fff">${step.done ? '✓' : idx + 1}</div>
                  <div>
                    <div style="font-weight:${step.done ? '700' : '500'};color:${step.done ? 'var(--text-primary)' : 'var(--text-muted)'}">${step.status}</div>
                    <div style="font-size:0.8rem;color:var(--text-muted)">${step.time}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="text-align:right">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('tracking-modal').classList.remove('open')">Close</button>
          </div>
        `;
      }
    } catch (e) {
      if (trackBody) trackBody.innerHTML = '<div style="color:var(--brand-danger)">Unable to load tracking details.</div>';
    }
  },

  // Interactive Quick-View Modal
  async openQuickView(productId) {
    const modal = document.getElementById('quickview-modal');
    if (!modal) return;
    modal.classList.add('open');

    const content = document.getElementById('quickview-modal-body');
    if (content) content.innerHTML = '<div style="text-align:center;padding:3rem">Loading specifications...</div>';

    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      if (data.success && content) {
        const p = data.product;
        content.innerHTML = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:center">
            <div style="background:#090d16;padding:1.5rem;border-radius:var(--radius-md);text-align:center">
              <img src="${p.image}" alt="${p.name}" style="max-height:220px;margin:0 auto" />
            </div>
            <div>
              <div class="badge badge-cyan" style="margin-bottom:0.5rem">${p.categoryName}</div>
              <h2 style="font-family:var(--font-heading);font-size:1.4rem;margin-bottom:0.5rem">${p.name}</h2>
              <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">
                <span style="font-size:1.5rem;font-weight:800;color:var(--brand-cyan)">₹${p.price.toLocaleString()}</span>
                <span style="color:var(--text-muted);text-decoration:line-through">₹${p.originalPrice.toLocaleString()}</span>
                <span class="badge badge-emerald">In Stock (${p.stockCount})</span>
              </div>
              <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:1.25rem">${p.description}</p>
              
              <div style="background:var(--bg-input);padding:1rem;border-radius:var(--radius-sm);margin-bottom:1.5rem;font-size:0.85rem">
                <div style="font-weight:700;margin-bottom:0.5rem">Key Specs:</div>
                ${Object.entries(p.specs).slice(0, 3).map(([k, v]) => `
                  <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem"><span style="color:var(--text-muted)">${k}:</span><span>${v}</span></div>
                `).join('')}
              </div>

              <div style="display:flex;gap:0.75rem">
                <button class="btn btn-primary btn-block" onclick="CellStart.addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')}); document.getElementById('quickview-modal').classList.remove('open')">Add To Bag ⚡</button>
                <a href="product.html?id=${p.id}" class="btn btn-secondary">Full Page →</a>
              </div>
            </div>
          </div>
        `;
      }
    } catch (err) {
      if (content) content.innerHTML = '<div style="color:var(--brand-danger)">Failed to load product.</div>';
    }
  },

  // Interactive Charging Benchmark Simulator
  initBenchmark() {
    const devices = {
      'iphone': { name: 'iPhone 16 Pro Max', cellStartMin: 28, cellStartPct: 70, standardMin: 65, standardPct: 32, maxWatt: '35W Peak' },
      'galaxy': { name: 'Galaxy S25 Ultra', cellStartMin: 25, cellStartPct: 75, standardMin: 70, standardPct: 30, maxWatt: '45W Super Fast' },
      'macbook': { name: 'MacBook Air M3', cellStartMin: 32, cellStartPct: 55, standardMin: 90, standardPct: 18, maxWatt: '65W Full Throttle' }
    };

    window.switchBenchmarkDevice = (key) => {
      const dev = devices[key];
      if (!dev) return;

      document.querySelectorAll('.device-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.device === key);
      });

      const fastFill = document.getElementById('bench-fast-fill');
      const slowFill = document.getElementById('bench-slow-fill');
      const speedNote = document.getElementById('bench-speed-note');

      if (fastFill && slowFill) {
        fastFill.style.width = `${dev.cellStartPct}%`;
        fastFill.textContent = `${dev.cellStartPct}% in ${dev.cellStartMin} mins`;

        slowFill.style.width = `${dev.standardPct}%`;
        slowFill.textContent = `${dev.standardPct}% in ${dev.cellStartMin} mins`;
      }

      if (speedNote) {
        speedNote.textContent = `Tested with ${dev.name} (${dev.maxWatt} GaN Protocol)`;
      }
    };
  },

  // Search Modal & Ctrl+K
  initSearchShortcut() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openSearchModal();
      }
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  },

  openSearchModal() {
    const modal = document.getElementById('search-modal');
    if (modal) {
      modal.classList.add('open');
      const input = document.getElementById('search-modal-input');
      if (input) {
        input.focus();
        input.value = '';
        this.handleSearchInput('');
      }
    }
  },

  closeSearchModal() {
    document.getElementById('search-modal')?.classList.remove('open');
  },

  async handleSearchInput(query) {
    const resultsContainer = document.getElementById('search-modal-results');
    if (!resultsContainer) return;

    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.products.length === 0) {
        resultsContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted)">No matching items found.</div>';
        return;
      }

      resultsContainer.innerHTML = data.products.map(p => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;border-radius:var(--radius-sm);background:var(--bg-input);margin-bottom:0.5rem;cursor:pointer;transition:var(--transition)" onclick="CellStart.openQuickView('${p.id}'); CellStart.closeSearchModal()">
          <div style="display:flex;align-items:center;gap:1rem">
            <img src="${p.image}" style="width:40px;height:40px;border-radius:4px;object-fit:cover" />
            <div>
              <div style="font-weight:700;font-size:0.95rem">${p.name}</div>
              <div style="font-size:0.8rem;color:var(--text-muted)">${p.categoryName} • ${p.tagline}</div>
            </div>
          </div>
          <div style="font-weight:800;color:var(--brand-cyan)">₹${p.price.toLocaleString()}</div>
        </div>
      `).join('');
    } catch (err) {
      resultsContainer.innerHTML = '<div style="color:var(--brand-danger)">Error loading search results.</div>';
    }
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
    this.closeCart();
  },

  // Setup Event Listeners
  setupEventListeners() {
    const menuToggle = document.getElementById('mobile-menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        document.getElementById('nav-links')?.classList.toggle('open');
      });
    }

    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    document.getElementById('cart-overlay')?.addEventListener('click', () => this.closeCart());

    const newsForm = document.getElementById('newsletter-form');
    if (newsForm) {
      newsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = newsForm.querySelector('input[type="email"]').value;
        try {
          const res = await fetch('/api/newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          this.showToast(data.message, data.success ? 'success' : 'error');
          newsForm.reset();
        } catch (e) {
          this.showToast('Failed to subscribe', 'error');
        }
      });
    }
  }
};

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  CellStart.init();
});