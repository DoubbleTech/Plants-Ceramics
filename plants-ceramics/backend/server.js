/**
 * Plants & Ceramics - Full Stack API
 * Run this on your VPS using PM2: pm2 start server.js --name "plants-api"
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/plants_ceramics', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('🌿 Connected to MongoDB Database'))
  .catch(err => console.error('Database connection error:', err));

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Map, of: Number, default: {} },
  isBykeaEligible: { type: Boolean, default: true },
  imageUrls: [String],
  shortDesc: String,
  longDesc: String,
  createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  city: String,
  customer: { name: String, email: String, phone: String, address: String, paymentMethod: String },
  items: Array,
  totalAmount: Number,
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

const taxonomySchema = new mongoose.Schema({
  type: String, // 'category' or 'city'
  name: String
});
const Taxonomy = mongoose.model('Taxonomy', taxonomySchema);

// --- API ROUTES ---
app.get('/api/catalog', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    const categories = await Taxonomy.find({ type: 'category' }).sort({ name: 1 });
    const cities = await Taxonomy.find({ type: 'city' }).sort({ name: 1 });
    
    res.json({
      products,
      categories: ["All", ...categories.map(c => c.name)],
      cities: cities.map(c => c.name).length ? cities.map(c => c.name) : ["Islamabad", "Karachi", "Rawalpindi"]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load catalog' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    for (let item of req.body.items) {
      const product = await Product.findById(item._id || item.id);
      if (product) {
        let currentStock = product.stock.get(req.body.city) || 0;
        product.stock.set(req.body.city, Math.max(0, currentStock - item.qty));
        await product.save();
      }
    }
    res.status(201).json({ success: true });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed to load orders' }); }
});

app.post('/api/admin/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/admin/products/bulk', async (req, res) => {
  try {
    await Product.insertMany(req.body.products);
    res.status(201).json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Bulk import failed' }); }
});

app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CITIES & CATEGORIES (TAXONOMY) ---
app.post('/api/admin/cities', async (req, res) => {
  await new Taxonomy({ type: 'city', name: req.body.name }).save();
  res.json({ success: true });
});
app.delete('/api/admin/cities/:name', async (req, res) => {
  await Taxonomy.deleteOne({ type: 'city', name: req.params.name });
  res.json({ success: true });
});

app.post('/api/admin/categories', async (req, res) => {
  await new Taxonomy({ type: 'category', name: req.body.name }).save();
  res.json({ success: true });
});
app.delete('/api/admin/categories/:name', async (req, res) => {
  await Taxonomy.deleteOne({ type: 'category', name: req.params.name });
  res.json({ success: true });
});

app.post('/api/admin/login', (req, res) => {
  if (req.body.username === 'admin' && req.body.password === (process.env.ADMIN_PASSWORD || 'Umarali667@')) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌿 API running on port ${PORT}`);
});
