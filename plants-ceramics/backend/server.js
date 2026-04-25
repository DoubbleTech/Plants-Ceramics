/**
 * Plants & Ceramics - Full Stack API
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allows large receipt images

mongoose.connect('mongodb://127.0.0.1:27017/plants_ceramics')
  .then(() => console.log('🌿 Connected to MongoDB Database'))
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
  // Updated Customer Object to hold all new fields and receipt images
  customer: { type: Object }, 
  items: Array,
  totalAmount: Number,
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

const taxonomySchema = new mongoose.Schema({
  type: String, // 'category' or 'city'
  name: String,
  order: { type: Number, default: 0 } // Added for drag-and-drop sorting
});
const Taxonomy = mongoose.model('Taxonomy', taxonomySchema);

// --- API ROUTES ---

app.get('/api/catalog', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    const categories = await Taxonomy.find({ type: 'category' }).sort({ name: 1 });
    const cities = await Taxonomy.find({ type: 'city' }).sort({ order: 1, name: 1 });
    
    res.json({
      products,
      categories: ["All", ...categories.map(c => c.name)],
      cities: cities.map(c => c.name).length ? cities.map(c => c.name) : ["Islamabad", "Karachi"]
    });
  } catch (error) { res.status(500).json({ error: 'Failed to load catalog' }); }
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
  try { res.json(await Order.find().sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ error: 'Failed to load orders' }); }
});

// --- PRODUCT MANAGEMENT ---
app.post('/api/admin/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Update Individual Product
app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/admin/products/bulk', async (req, res) => {
  try {
    await Product.insertMany(req.body.products);
    res.status(201).json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Bulk import failed' }); }
});

// Bulk Delete Products
app.post('/api/admin/products/bulk-delete', async (req, res) => {
  try {
    await Product.deleteMany({ _id: { $in: req.body.ids } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Bulk delete failed' }); }
});

app.delete('/api/admin/products/:id', async (req, res) => {
  try { await Product.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CITIES & CATEGORIES ---
app.post('/api/admin/cities', async (req, res) => {
  try { 
    const count = await Taxonomy.countDocuments({ type: 'city' });
    await new Taxonomy({ type: 'city', name: req.body.name, order: count }).save(); 
    res.json({ success: true }); 
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Save Drag & Drop City Order
app.post('/api/admin/cities/reorder', async (req, res) => {
  try {
    const { cities } = req.body;
    for (let i = 0; i < cities.length; i++) {
      await Taxonomy.updateOne({ type: 'city', name: cities[i] }, { order: i });
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/cities/:name', async (req, res) => {
  try { await Taxonomy.deleteOne({ type: 'city', name: req.params.name }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
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
  if (req.body.username === 'admin' && req.body.password === 'Umarali667@') { res.json({ success: true }); }
  else { res.status(401).json({ error: "Invalid credentials" }); }
});

const PORT = 5005;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🌿 API running on port ${PORT}`);
});
