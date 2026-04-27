/**
 * Plants & Ceramics - Full Stack API
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

mongoose.connect('mongodb://127.0.0.1:27017/plants_ceramics')
  .then(() => console.log('🌿 Connected to MongoDB'))
  .catch(err => console.error('DB Error:', err));

const productSchema = new mongoose.Schema({
  name: { type: String, required: true }, category: { type: String }, categories: { type: [String], default: [] }, 
  price: { type: Number, required: true }, stock: { type: Map, of: Number, default: {} }, 
  isBykeaEligible: { type: Boolean, default: true }, imageUrls: [String], 
  shortDesc: String, longDesc: String, createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true }, city: String, customer: { type: Object }, 
  items: Array, totalAmount: Number, status: { type: String, default: 'Pending' }, createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

const taxonomySchema = new mongoose.Schema({ type: String, name: String, order: { type: Number, default: 0 } });
const Taxonomy = mongoose.model('Taxonomy', taxonomySchema);

app.get('/api/catalog', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    const categories = await Taxonomy.find({ type: 'category' }).sort({ name: 1 });
    const cities = await Taxonomy.find({ type: 'city' }).sort({ order: 1, name: 1 });
    res.json({ products, categories: ["All", ...categories.map(c => c.name)], cities: cities.map(c => c.name).length ? cities.map(c => c.name) : ["Islamabad", "Karachi"] });
  } catch (error) { res.status(500).json({ error: 'Failed to load catalog' }); }
});

// --- NEW PUBLIC ORDER TRACKING ROUTE ---
app.get('/api/track-order/:orderNum', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNum.trim() });
    if (!order) return res.status(404).json({ error: "Order not found" });
    
    // Only send non-sensitive tracking info
    res.json({
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      status: order.status,
      date: order.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body); await newOrder.save();
    for (let item of req.body.items) {
      const product = await Product.findById(item._id || item.id);
      if (product) { product.stock.set(req.body.city, Math.max(0, (product.stock.get(req.body.city) || 0) - item.qty)); await product.save(); }
    }

    // --- AUTOMATED WHATSAPP NOTIFICATION ---
    // Note: You must get a free API key from https://www.callmebot.com/blog/free-api-whatsapp-messages/
    const waPhone = "+923122806668"; 
    const waApiKey = "YOUR_CALLMEBOT_API_KEY"; // <-- Get this free key and paste it here later
    const waMessage = `🌿 *New P&C Order:* ${newOrder.orderNumber}%0A*Client:* ${newOrder.customer.name}%0A*Total:* PKR ${newOrder.totalAmount}%0A*City:* ${newOrder.city}`;
    
    if (waApiKey !== "YOUR_CALLMEBOT_API_KEY") {
      fetch(`https://api.callmebot.com/whatsapp.php?phone=${waPhone}&text=${waMessage}&apikey=${waApiKey}`)
        .catch(e => console.error("WhatsApp notification failed:", e));
    }

    res.status(201).json({ success: true });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/admin/orders', async (req, res) => {
  try { res.json(await Order.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/admin/orders/:id/status', async (req, res) => {
  try { await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/products', async (req, res) => {
  try { const product = new Product(req.body); await product.save(); res.status(201).json(product); } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/admin/products/:id', async (req, res) => {
  try { const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(updated); } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/admin/products/bulk', async (req, res) => {
  try { await Product.insertMany(req.body.products); res.status(201).json({ success: true }); } catch (error) { res.status(500).json({ error: 'Bulk failed' }); }
});

app.post('/api/admin/products/bulk-delete', async (req, res) => {
  try { await Product.deleteMany({ _id: { $in: req.body.ids } }); res.json({ success: true }); } catch (error) { res.status(500).json({ error: 'Delete failed' }); }
});

app.delete('/api/admin/products/:id', async (req, res) => {
  try { await Product.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/cities', async (req, res) => {
  try { const count = await Taxonomy.countDocuments({ type: 'city' }); await new Taxonomy({ type: 'city', name: req.body.name, order: count }).save(); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/cities/reorder', async (req, res) => {
  try { const { cities } = req.body; for (let i = 0; i < cities.length; i++) { await Taxonomy.updateOne({ type: 'city', name: cities[i] }, { order: i }); } res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/cities/:name', async (req, res) => {
  try { await Taxonomy.deleteOne({ type: 'city', name: req.params.name }); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/categories', async (req, res) => { await new Taxonomy({ type: 'category', name: req.body.name }).save(); res.json({ success: true }); });
app.delete('/api/admin/categories/:name', async (req, res) => { await Taxonomy.deleteOne({ type: 'category', name: req.params.name }); res.json({ success: true }); });

app.post('/api/admin/login', (req, res) => {
  if (req.body.username === 'admin' && req.body.password === 'Umarali667@') { res.json({ success: true }); } else { res.status(401).json({ error: "Invalid credentials" }); }
});

app.listen(5005, '127.0.0.1', () => console.log(`🌿 API running`));
