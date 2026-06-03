require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// SECURED: Credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

mongoose.connect('mongodb://127.0.0.1:27017/plants_ceramics')
  .then(() => console.log('🌿 Connected to MongoDB'))
  .catch(err => console.error('DB Error:', err));

// DYNAMIC SETTINGS SCHEMA
const settingsSchema = new mongoose.Schema({
  freeDeliveryThreshold: { type: Number, default: 9999 },
  promoBanner: {
    isActive: { type: Boolean, default: false },
    text: { type: String, default: '🎉 FLASH SALE: USE CODE BOTANICAL20 FOR 20% OFF!' }
  },
  payment: {
    cod: { type: Boolean, default: true },
    trf: { type: Boolean, default: true },
    card: { type: Boolean, default: false },
    bankDetails: { type: String, default: 'Meezan Bank | A/C 0123456789 | Doubble Tech' },
    gateway: { 
      provider: { type: String, default: 'Stripe' }, 
      apiKey: { type: String, default: '' }, 
      apiSecret: { type: String, default: '' } 
    }
  },
  updatedAt: { type: Date, default: Date.now }
});
const Settings = mongoose.model('Settings', settingsSchema);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true }, category: { type: String }, categories: { type: [String], default: [] }, 
  price: { type: Number, required: true }, stock: { type: Map, of: Number, default: {} }, 
  isBykeaEligible: { type: Boolean, default: true }, 
  shippingTier: { type: String, default: 'T1' }, 
  imageUrls: [String], 
  shortDesc: String, longDesc: String, 
  careWater: String, careSunlight: String, careClimate: String, careBenefits: String,
  createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true }, city: String, customer: { type: Object }, 
  items: Array, totalAmount: Number, discount: { type: Number, default: 0 }, 
  deliveryCharges: { type: Number, default: 0 }, 
  shippingTier: { type: String, default: 'T1' }, 
  distanceType: { type: String, default: 'short' }, 
  couponCode: { type: String, default: null }, status: { type: String, default: 'Pending' }, createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

const abandonedCartSchema = new mongoose.Schema({
  email: { type: String, unique: true }, phone: String, items: Array, lastUpdated: { type: Date, default: Date.now }
});
const AbandonedCart = mongoose.model('AbandonedCart', abandonedCartSchema);

const taxonomySchema = new mongoose.Schema({ type: String, name: String, order: { type: Number, default: 0 } });
const Taxonomy = mongoose.model('Taxonomy', taxonomySchema);

const couponSchema = new mongoose.Schema({
  code: { type: String, unique: true, uppercase: true, required: true },
  discountType: { type: String, required: true }, discountValue: { type: Number, required: true },
  scope: { type: String, default: 'all' }, target: { type: String, default: '' },
  startDate: { type: Date, required: true }, endDate: { type: Date, required: true },
  maxUses: { type: Number, default: 0 }, usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }, createdAt: { type: Date, default: Date.now }
});
const Coupon = mongoose.model('Coupon', couponSchema);

// JWT MIDDLEWARE
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { jwt.verify(token, process.env.JWT_SECRET); next(); } catch (e) { res.status(401).json({ error: 'Invalid Token' }); }
};

// PUBLIC ROUTES
app.get('/api/catalog', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    const categories = await Taxonomy.find({ type: 'category' }).sort({ order: 1, name: 1 });
    const cities = await Taxonomy.find({ type: 'city' }).sort({ order: 1, name: 1 });
    
    let settings = await Settings.findOne();
    if (!settings) { settings = await new Settings().save(); }

    // SECURITY: Strip Secret Keys from public storefront payload
    const safeSettings = JSON.parse(JSON.stringify(settings));
    if (safeSettings.payment && safeSettings.payment.gateway) {
        delete safeSettings.payment.gateway.apiKey;
        delete safeSettings.payment.gateway.apiSecret;
    }

    res.json({ 
      products, 
      categories: ["All", ...categories.map(c => c.name)], 
      cities: cities.map(c => c.name).length ? cities.map(c => c.name) : ["Islamabad", "Karachi"],
      settings: safeSettings 
    });
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/track-order/:orderNum', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNum.trim() });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ orderNumber: order.orderNumber, customerName: order.customer.name, status: order.status, date: order.createdAt });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post('/api/verify-coupon', async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ code: req.body.code.trim().toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ error: 'Invalid coupon code.' });
    const now = new Date();
    if (now < new Date(coupon.startDate)) return res.status(400).json({ error: 'This coupon is not active yet.' });
    if (now > new Date(coupon.endDate)) return res.status(400).json({ error: 'This coupon has expired.' });
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return res.status(400).json({ error: 'This coupon has reached its usage limit.' });
    res.json(coupon);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/cart/abandoned', async (req, res) => {
  const { email, phone, items } = req.body;
  if (!email) return res.status(400).end();
  try {
    await AbandonedCart.findOneAndUpdate({ email }, { phone, items, lastUpdated: new Date() }, { upsert: true });
    res.status(200).json({ success: true });
  } catch (e) { res.status(500).end(); }
});

app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body); await newOrder.save();
    if (req.body.couponCode) { await Coupon.findOneAndUpdate({ code: req.body.couponCode.toUpperCase() }, { $inc: { usedCount: 1 } }); }
    if (req.body.customer.email) { await AbandonedCart.deleteOne({ email: req.body.customer.email }); }
    for (let item of req.body.items) {
      const product = await Product.findById(item._id || item.id);
      if (product) { product.stock.set(req.body.city, Math.max(0, (product.stock.get(req.body.city) || 0) - item.qty)); await product.save(); }
    }
    res.status(201).json({ success: true, order: newOrder });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/admin/login', (req, res) => { 
  if (req.body.username === 'admin' && req.body.password === process.env.ADMIN_PASS) { 
    const token = jwt.sign({ user: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token }); 
  } else { 
    res.status(401).json({ error: "Invalid credentials" }); 
  } 
});

// PROTECTED ADMIN ROUTES

// Fetch full settings (including keys) for the admin dashboard
app.get('/api/admin/settings', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await new Settings().save();
    res.json(settings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/settings', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    if (req.body.freeDeliveryThreshold !== undefined) settings.freeDeliveryThreshold = req.body.freeDeliveryThreshold;
    if (req.body.promoBanner !== undefined) settings.promoBanner = req.body.promoBanner;
    
    // Deep merge for payment settings
    if (req.body.payment !== undefined) {
       settings.payment = {
          ...settings.payment,
          ...req.body.payment,
          gateway: {
             ...settings.payment?.gateway,
             ...req.body.payment?.gateway
          }
       };
    }
    
    await settings.save();
    res.json({ success: true, settings });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/upload', protect, async (req, res) => {
  try { const uploadResponse = await cloudinary.uploader.upload(req.body.image); res.json({ url: uploadResponse.secure_url }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/customers', protect, async (req, res) => {
  try {
    const orders = await Order.find({}, 'customer.email customer.phone');
    const abandoned = await AbandonedCart.find({}, 'email phone');
    const emails = new Set(); const phones = new Set();
    orders.forEach(o => { if(o.customer?.email) emails.add(o.customer.email); if(o.customer?.phone) phones.add(o.customer.phone); });
    abandoned.forEach(a => { if(a.email) emails.add(a.email); if(a.phone) phones.add(a.phone); });
    res.json({ emails: Array.from(emails), phones: Array.from(phones) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/coupons', protect, async (req, res) => { try { res.json(await Coupon.find().sort({createdAt: -1})); } catch(e){ res.status(500).json({error: e.message}); } });
app.post('/api/admin/coupons', protect, async (req, res) => { try { const c = new Coupon(req.body); await c.save(); res.json(c); } catch(e){ res.status(400).json({error: e.message}); } });
app.put('/api/admin/coupons/:id', protect, async (req, res) => { try { const updated = await Coupon.findByIdAndUpdate(req.params.id, req.body, {new: true}); res.json(updated); } catch(e) { res.status(400).json({error: e.message}); } });
app.delete('/api/admin/coupons/:id', protect, async (req, res) => { try { await Coupon.findByIdAndDelete(req.params.id); res.json({success: true}); } catch(e){ res.status(500).json({error: e.message}); } });

app.get('/api/admin/orders', protect, async (req, res) => { try { res.json(await Order.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ error: 'Failed' }); } });
app.put('/api/admin/orders/:id/status', protect, async (req, res) => { try { await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });
app.delete('/api/admin/orders/:id', protect, async (req, res) => { try { await Order.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });

app.post('/api/admin/products', protect, async (req, res) => { try { const product = new Product(req.body); await product.save(); res.status(201).json(product); } catch (err) { res.status(400).json({ error: err.message }); } });
app.put('/api/admin/products/:id', protect, async (req, res) => { try { const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(updated); } catch (err) { res.status(400).json({ error: err.message }); } });
app.post('/api/admin/products/bulk', protect, async (req, res) => { try { await Product.insertMany(req.body.products); res.status(201).json({ success: true }); } catch (error) { res.status(500).json({ error: 'Bulk failed' }); } });
app.post('/api/admin/products/bulk-delete', protect, async (req, res) => { try { await Product.deleteMany({ _id: { $in: req.body.ids } }); res.json({ success: true }); } catch (error) { res.status(500).json({ error: 'Delete failed' }); } });
app.delete('/api/admin/products/:id', protect, async (req, res) => { try { await Product.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });

app.post('/api/admin/categories/reorder', protect, async (req, res) => { try { const { categories } = req.body; for (let i = 0; i < categories.length; i++) { await Taxonomy.updateOne({ type: 'category', name: categories[i] }, { order: i }); } res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });
app.put('/api/admin/categories/:oldName', protect, async (req, res) => { 
  try { 
    await Taxonomy.updateOne({ type: 'category', name: req.params.oldName }, { name: req.body.newName });
    await Product.updateMany({ category: req.params.oldName }, { category: req.body.newName });
    await Product.updateMany({ categories: req.params.oldName }, { $push: { categories: req.body.newName } });
    await Product.updateMany({ categories: req.params.oldName }, { $pull: { categories: req.params.oldName } });
    res.json({ success: true }); 
  } catch (err) { res.status(500).json({ error: err.message }); } 
});
app.post('/api/admin/categories', protect, async (req, res) => { try { const count = await Taxonomy.countDocuments({ type: 'category' }); await new Taxonomy({ type: 'category', name: req.body.name, order: count }).save(); res.json({ success: true }); } catch(e){} });
app.delete('/api/admin/categories/:name', protect, async (req, res) => { await Taxonomy.deleteOne({ type: 'category', name: req.params.name }); res.json({ success: true }); });

app.post('/api/admin/cities', protect, async (req, res) => { try { const count = await Taxonomy.countDocuments({ type: 'city' }); await new Taxonomy({ type: 'city', name: req.body.name, order: count }).save(); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });
app.post('/api/admin/cities/reorder', protect, async (req, res) => { try { const { cities } = req.body; for (let i = 0; i < cities.length; i++) { await Taxonomy.updateOne({ type: 'city', name: cities[i] }, { order: i }); } res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });
app.delete('/api/admin/cities/:name', protect, async (req, res) => { try { await Taxonomy.deleteOne({ type: 'city', name: req.params.name }); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });

app.listen(5005, '127.0.0.1', () => console.log(`🌿 API running on 5005`));
