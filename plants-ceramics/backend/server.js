/**
 * Plants & Ceramics - Backend API
 * Run this on your VPS using PM2: pm2 start server.js --name "plants-api"
 * Ensure you have a .env file with your MONGO_URI and PORT (e.g., PORT=5005)
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- 1. Middleware ---
// CORS allows your Next.js/React frontend to talk to this Node.js backend securely
app.use(cors());
app.use(express.json()); // Parses incoming JSON data from checkout forms

// --- 2. Database Connection ---
// Connect to MongoDB Atlas. If it fails, it won't crash your VPS.
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/plants_ceramics', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('🌿 Connected to MongoDB Atlas'))
  .catch(err => console.error('Database connection error:', err));

// --- 3. Database Schemas (The Blueprints) ---

// Product Schema (Includes city-wise stock)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: String,
  price: { type: Number, required: true },
  discount: Number,
  isSaleActive: { type: Boolean, default: false },
  stock: { type: Map, of: Number, default: {} }, // e.g., { "Karachi": 10, "Islamabad": 5 }
  isBykeaEligible: { type: Boolean, default: true },
  imageUrls: [String], // Array for multiple images (Cloudinary URLs)
  shortDesc: String,
  longDesc: String,
  createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  city: String,
  customer: {
    name: String,
    email: String,
    phone: String,
    address: String,
    locationLink: String,
    instructions: String,
    paymentMethod: String, // 'COD' or 'TRF'
    receiptUrl: String // Cloudinary link to the bank transfer receipt
  },
  items: Array,
  totalAmount: Number,
  requiresCarDelivery: Boolean,
  status: { type: String, default: 'Pending' }, // Pending, Confirmed, Dispatched, Delivered
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// Taxonomy Schema (To store dynamic Cities and Categories)
const taxonomySchema = new mongoose.Schema({
  type: String, // 'category' or 'city'
  name: String
});
const Taxonomy = mongoose.model('Taxonomy', taxonomySchema);

// --- 4. API Routes ---

// @route   GET /api/catalog
// @desc    Get all products, categories, and cities for the storefront
app.get('/api/catalog', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    const categories = await Taxonomy.find({ type: 'category' }).sort({ name: 1 });
    const cities = await Taxonomy.find({ type: 'city' }).sort({ name: 1 });
    
    res.json({
      products,
      categories: ["All", ...categories.map(c => c.name)],
      cities: cities.map(c => c.name)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load catalog' });
  }
});

// @route   POST /api/orders
// @desc    Submit a new customer order and deduct stock
app.post('/api/orders', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const orderData = req.body;
    orderData.orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // 1. Create the Order
    const newOrder = new Order(orderData);
    await newOrder.save({ session });

    // 2. Deduct City-Wise Stock for each item
    for (let item of orderData.items) {
      const product = await Product.findById(item._id).session(session);
      if (product && product.stock && product.stock.get(orderData.city) >= item.qty) {
        let currentStock = product.stock.get(orderData.city);
        product.stock.set(orderData.city, currentStock - item.qty);
        await product.save({ session });
      } else {
        throw new Error(`Insufficient stock for ${item.name} in ${orderData.city}`);
      }
    }

    await session.commitTransaction();
    res.status(201).json({ success: true, orderNumber: newOrder.orderNumber });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// --- Admin Routes (Protected in production via JWT tokens) ---

// @route   POST /api/admin/login
// @desc    Verify admin credentials
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  // In production, compare against hashed passwords in the DB and return a JWT token
  if (username === 'admin' && password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true, token: "mock_jwt_token_for_prototype" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// @route   POST /api/admin/products/bulk
// @desc    Handle CSV bulk uploads
app.post('/api/admin/products/bulk', async (req, res) => {
  try {
    const productsArray = req.body.products; // JSON array generated from CSV by the frontend
    await Product.insertMany(productsArray);
    res.status(201).json({ success: true, message: `${productsArray.length} items added.` });
  } catch (error) {
    res.status(500).json({ error: 'Bulk import failed' });
  }
});

// --- 5. Start Server safely on an isolated port ---
// Port 5005 is used here to avoid clashing with your existing VPS apps
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`🌿 Plants & Ceramics API running securely on port ${PORT}`);
});