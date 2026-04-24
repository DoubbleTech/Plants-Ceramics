import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, ShieldUser, Plus, Trash2, Edit, Leaf, ArrowLeft, Check, BookOpen, Search, Camera, Lock, Loader2, MoveRight, ArrowUpRight, MapPin, ChevronDown, Map, RefreshCw } from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:5005/api`;

const fallbackProducts = [
  { id: 1, name: "Chili Plant", category: "Vegetable Plant", price: 400, stock: { "Karachi": 15, "Islamabad": 10 }, isBykeaEligible: true, image: "🌶️", desc: "Spicy green chilies.", longDesc: "A prolific producer of spicy green chilies. Perfect for sunny balconies." },
  { id: 2, name: "Large Mango Tree", category: "Fruit Plant", price: 4500, stock: { "Karachi": 5 }, isBykeaEligible: false, image: "🌳", desc: "Grafted tree. Requires car delivery.", longDesc: "A beautiful, established grafted mango tree ready to be planted in your garden." },
  { id: 5, name: "Terracotta Pot", category: "Ceramic Pot", price: 1200, stock: { "Karachi": 10, "Islamabad": 5 }, isBykeaEligible: false, image: "🏺", desc: "Heavy 12-inch clay pot. Fragile.", longDesc: "Hand-thrown by local artisans, this porous terracotta allows plant roots to breathe." }
];

const fallbackGuides = [
  { id: 1, name: "Monstera Deliciosa", image: "🪴", sunlight: "Bright, indirect light", water: "Every 1-2 weeks", tips: "Wipe leaves with a damp cloth." },
];

const formatPrice = (price) => `PKR ${Number(price).toLocaleString()}`;

export default function App() {
  const [view, setView] = useState('city-select'); 
  const [selectedCity, setSelectedCity] = useState(null);
  
  const [cities, setCities] = useState(["Islamabad", "Karachi", "Rawalpindi"]);
  const [products, setProducts] = useState(fallbackProducts);
  const [categories, setCategories] = useState(["All", "Indoor Plant", "Outdoor Plant", "Ceramic Pot", "Fruit Plant", "Vegetable Plant"]);
  const [guides] = useState(fallbackGuides);
  
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [visibleCount, setVisibleCount] = useState(6);

  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '', email: '', phone: '', address: '', locationLink: '', instructions: '', paymentMethod: 'COD', receipt: null
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminTab, setAdminTab] = useState('ledger'); 
  const [showAddMenu, setShowAddMenu] = useState(false); 
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);
  
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  
  const [showCityModal, setShowCityModal] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [editingCity, setEditingCity] = useState(null);
  const [editCityName, setEditCityName] = useState('');

  const [newEntryForm, setNewEntryForm] = useState({
    name: '', image1: '', shortDesc: '', longDesc: '', amount: '', discount: '', sale: false, shipping: 'Standard', category: 'Indoor Plant', stock: {}
  });

  useEffect(() => {
    fetch(`${API_BASE}/catalog`)
      .then(res => res.json())
      .then(data => {
        if(data.products && data.products.length > 0) setProducts(data.products);
        if(data.cities && data.cities.length > 0) setCities(data.cities);
        if(data.categories && data.categories.length > 0) setCategories(data.categories);
      })
      .catch(err => console.error("Backend offline, using fallback memory.", err));
  }, []);

  const fetchOrders = async () => {
    setIsFetchingOrders(true);
    try {
      const res = await fetch(`${API_BASE}/admin/orders`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOrders(data);
      alert("✅ Latest orders fetched from the database!");
    } catch (err) {
      alert("⚠️ Error fetching data! Make sure Port 5005 is open on your firewall.");
      console.error("Failed to fetch orders", err);
    }
    setTimeout(() => setIsFetchingOrders(false), 500); 
  };

  useEffect(() => {
    if (isAuthenticated && adminTab === 'orders') {
      fetchOrders();
    }
  }, [isAuthenticated, adminTab]);

  useEffect(() => {
    const savedCity = localStorage.getItem('pc_selected_city');
    if (savedCity) {
      setSelectedCity(savedCity);
      setView('store'); 
    }
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeAddMenu = () => setShowAddMenu(false);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const requiresCarDelivery = cart.some(item => !item.isBykeaEligible);
  const filteredProducts = activeCategory === "All" ? products : products.filter(p => p.category === activeCategory);
  const getCityStock = (product, city = selectedCity) => product.stock?.[city] || 0;

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    localStorage.setItem('pc_selected_city', city);
    setView('store');
    setCart([]);
  };

  const addToCart = (product) => {
    const availableStock = getCityStock(product);
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id || item._id === product._id);
      if (existing) {
        if (existing.qty >= availableStock) return prev;
        return prev.map(item => (item.id === product.id || item._id === product._id) ? { ...item, qty: item.qty + 1 } : item);
      }
      if (availableStock > 0) return [...prev, { ...product, qty: 1 }];
      return prev;
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id && item._id !== id));
  const handleCheckoutChange = (e) => setCheckoutForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submitOrder = async (e) => {
    e.preventDefault();
    const orderNum = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = {
      orderNumber: orderNum,
      date: new Date().toLocaleString(),
      items: [...cart],
      totalAmount: cartTotal,
      customer: checkoutForm,
      requiresCarDelivery,
      city: selectedCity
    };

    try {
      const dbRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      if (!dbRes.ok) throw new Error("Database rejected order");
    } catch (err) {
      console.error("Order API failed, saving to local state only", err);
    }
    setOrders(prev => [newOrder, ...prev]);

    const emailParams = {
      service_id: 'service_hyfp919', 
      template_id: 'template_nlst9qp',
      user_id: 'YOUR_PUBLIC_KEY', 
      template_params: {
        order_number: orderNum,
        customer_name: checkoutForm.name,
        customer_email: checkoutForm.email,
        phone: checkoutForm.phone,
        city: selectedCity,
        address: checkoutForm.address,
        total: formatPrice(cartTotal),
        items: cart.map(i => `${i.qty}x ${i.name}`).join(', ')
      }
    };
    
    fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailParams)
    }).catch(err => console.log("EmailJS error", err));

    const waText = encodeURIComponent(
      `🌿 *New P&C Order: ${orderNum}*\n\n` +
      `*Client:* ${checkoutForm.name}\n` +
      `*Phone:* ${checkoutForm.phone}\n` +
      `*Address:* ${checkoutForm.address}, ${selectedCity}\n\n` +
      `*Items:*\n${cart.map(item => `- ${item.qty}x ${item.name}`).join('\n')}\n\n` +
      `*Total:* ${formatPrice(cartTotal)}\n` +
      `*Payment:* ${checkoutForm.paymentMethod === 'TRF' ? 'Bank Transfer' : 'Cash on Delivery'}`
    );
    
    window.open(`https://wa.me/923122806668?text=${waText}`, '_blank'); 

    setCurrentOrder(newOrder);
    setCart([]);
    setView('order-success');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        setIsAuthenticated(true); 
        setView('admin-dashboard'); 
      }
    } catch (err) {
      if (username === 'admin' && password === 'Umarali667@') {
        setIsAuthenticated(true); setView('admin-dashboard');
      }
    }
  };

  const submitNewCity = async (e) => {
    e.preventDefault();
    const c = newCityName.trim();
    if (c && !cities.includes(c)) {
      setCities(prev => [...prev, c].sort());
      try {
        const res = await fetch(`${API_BASE}/admin/cities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: c })
        });
        if (!res.ok) throw new Error("Server failed");
        alert(`✅ Success! Region "${c}" has been securely added to the database.`);
      } catch (err) {
        alert(`⚠️ Could not save to database! The firewall might be blocking Port 5005.`);
      }
    }
    setNewCityName('');
  };

  const saveEditedCity = async (oldName) => {
    if(editCityName.trim() === '') return;
    setCities(prev => prev.map(c => c === oldName ? editCityName : c));
    try {
      await fetch(`${API_BASE}/admin/cities/${oldName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: editCityName })
      });
      alert(`✅ Region renamed to "${editCityName}"`);
    } catch (err) {}
    setEditingCity(null);
  };

  const deleteCity = async (cityName) => {
    setCities(prev => prev.filter(c => c !== cityName));
    try {
      await fetch(`${API_BASE}/admin/cities/${cityName}`, { method: 'DELETE' });
      alert(`🗑️ Region "${cityName}" deleted from database.`);
    } catch (err) {}
  };

  const submitNewEntry = async (e) => {
    e.preventDefault();
    const initializedStock = { ...newEntryForm.stock };
    cities.forEach(c => { if (initializedStock[c] === undefined) initializedStock[c] = 0; });

    const newProduct = {
      name: newEntryForm.name,
      category: newEntryForm.category,
      price: Number(newEntryForm.amount) || 0,
      stock: initializedStock,
      isBykeaEligible: newEntryForm.shipping === 'Standard',
      imageUrls: [newEntryForm.image1 || "🪴"], 
      shortDesc: newEntryForm.shortDesc,
      longDesc: newEntryForm.longDesc || newEntryForm.shortDesc
    };

    setProducts(prev => [newProduct, ...prev]);
    try {
      await fetch(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      alert(`✅ Product "${newProduct.name}" added to ledger.`);
    } catch (err) {}
    setShowNewEntryModal(false);
  };

  const deleteProduct = async (id) => {
    setProducts(prev => prev.filter(p => p.id !== id && p._id !== id));
    try {
      await fetch(`${API_BASE}/admin/products/${id}`, { method: 'DELETE' });
      alert(`🗑️ Product deleted.`);
    } catch(err) {}
  };

  /* ---- LOGO COMPONENT (Matches Favicon perfectly) ---- */
  const BrandLogo = () => (
    <div className="flex items-center gap-2 text-3xl font-serif text-[#1A1A1A] font-medium tracking-tighter">
      <span className="text-3xl drop-shadow-sm text-green-700">🌿</span> P&C.
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#1A1A1A] selection:bg-[#2C3D30] selection:text-[#F7F5F0]" onClick={closeAddMenu}>
      
      {/* REGIONAL GATEWAY */}
      {view === 'city-select' && (
        <div className="min-h-screen flex flex-col items-center justify-center animate-in fade-in duration-[1500ms] p-8">
          <div className="text-center max-w-xl w-full">
            <BrandLogo />
            <h1 className="text-4xl md:text-6xl font-serif leading-[1.1] tracking-tight mb-6 mt-8">Select your region.</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-16 border-b border-[#E5E0D8] pb-8">We curate specific logistics and inventory for each territory.</p>
            
            <div className="flex flex-col gap-4">
              {cities.map(city => (
                <button 
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className="w-full border border-[#1A1A1A]/20 hover:border-[#1A1A1A] py-5 text-sm tracking-widest font-light transition-colors group relative overflow-hidden"
                >
                  <span className="relative z-10">{city}</span>
                  <div className="absolute inset-0 bg-[#EBE6E0] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0"></div>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setView('admin-login')} 
              className="mt-24 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors flex items-center justify-center gap-1.5 w-full"
            >
              <Lock size={10} /> Staff Portal
            </button>
          </div>
        </div>
      )}

      {/* MAIN APPLICATION */}
      {view !== 'city-select' && (
        <>
          <nav className={`fixed w-full top-0 z-40 transition-all duration-700 ${isScrolled ? 'bg-[#F7F5F0]/90 backdrop-blur-md py-4' : 'bg-transparent py-8'}`}>
            <div className="max-w-[90rem] mx-auto px-8 md:px-16 flex justify-between items-center">
              <div className="flex gap-8 items-center text-[10px] uppercase tracking-[0.2em] font-medium text-[#1A1A1A]/60">
                <button onClick={() => setView('store')} className={`hover:text-[#1A1A1A] transition-colors ${view === 'store' && 'text-[#1A1A1A]'}`}>Collection</button>
                <button onClick={() => setView('plant-guide')} className={`hover:text-[#1A1A1A] transition-colors ${view === 'plant-guide' && 'text-[#1A1A1A]'}`}>Guide</button>
              </div>

              {/* FAVICON MATCHING LOGO - NAVBAR */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 cursor-pointer flex flex-col items-center justify-center group"
                onClick={() => setView('store')}
              >
                <div className="group-hover:-translate-y-1 transition-transform duration-500">
                  <BrandLogo />
                </div>
                <span className="text-[8px] uppercase tracking-[0.4em] text-[#1A1A1A]/40 mt-1">Plants & Ceramics</span>
              </div>

              <div className="flex items-center gap-8">
                {selectedCity && view !== 'admin-login' && view !== 'admin-dashboard' && (
                  <button onClick={() => setView('city-select')} className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors border-b border-transparent hover:border-[#1A1A1A] pb-0.5">
                    <MapPin size={10} /> {selectedCity}
                  </button>
                )}
                <button 
                  onClick={() => setView('cart')}
                  className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-medium hover:text-[#2C3D30] transition-colors group"
                >
                  <span>Bag ({cart.reduce((sum, item) => sum + item.qty, 0)})</span>
                  <div className="hidden md:block w-8 h-[1px] bg-[#1A1A1A] group-hover:w-12 transition-all duration-500"></div>
                </button>
              </div>
            </div>
          </nav>

          <main className="pt-32 pb-24 min-h-[80vh]">
            
            {/* VIEW: STOREFRONT */}
            {view === 'store' && (
              <div className="animate-in fade-in duration-[1500ms]">
                <div className="max-w-[90rem] mx-auto px-8 md:px-16 mb-24 md:mb-32 pt-12">
                  <h1 className="text-5xl md:text-8xl font-serif leading-[1.1] tracking-tight mb-8">
                    Cultivated <br className="hidden md:block"/>for the modern sanctuary.
                  </h1>
                  <div className="w-full h-[1px] bg-[#E5E0D8]"></div>
                </div>

                <div className="max-w-[90rem] mx-auto px-8 md:px-16 flex flex-col lg:flex-row gap-16 xl:gap-32">
                  <aside className="w-full lg:w-48 shrink-0">
                    <div className="lg:sticky lg:top-32">
                      <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40 mb-8 border-b border-[#E5E0D8] pb-4">Index</h3>
                      <ul className="flex flex-wrap lg:flex-col gap-4 lg:gap-4 pb-4 lg:pb-0">
                        {categories.map(cat => (
                          <li key={cat}>
                            <button
                              onClick={() => { setActiveCategory(cat); setVisibleCount(6); }}
                              className={`text-xs uppercase tracking-[0.15em] whitespace-nowrap transition-all duration-500 ${
                                activeCategory === cat 
                                ? 'text-[#1A1A1A] font-medium translate-x-2' 
                                : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A] hover:translate-x-1'
                              }`}
                            >
                              {cat.replace("_", " ")}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </aside>

                  <div className="flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-16">
                      {filteredProducts.slice(0, visibleCount).map((product) => {
                        const inStock = getCityStock(product) > 0;
                        const displayImage = (product.imageUrls && product.imageUrls[0]) || product.image || "🪴";
                        return (
                        <div key={product.id || product._id} onClick={() => { setSelectedProduct(product); setView('product-detail'); }} className={`group flex flex-col cursor-pointer animate-in fade-in slide-in-from-bottom-8 duration-[1500ms] ${!inStock && 'opacity-60 grayscale-[50%]'}`}>
                          
                          <div className="w-full aspect-[4/5] bg-[#EBE6E0] mb-6 relative overflow-hidden flex items-center justify-center text-7xl md:text-8xl transition-colors duration-700">
                            <span className="transform group-hover:scale-110 transition-transform duration-[1500ms] ease-out">{displayImage}</span>
                            
                            {inStock ? (
                              <div className="absolute top-5 left-5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                <div className={`w-1.5 h-1.5 rounded-full ${product.isBykeaEligible ? 'bg-[#2C3D30]' : 'bg-[#8B5A2B]'}`}></div>
                                <span className="text-[9px] uppercase tracking-[0.2em] font-medium text-[#1A1A1A]/80 shadow-sm">
                                  {product.isBykeaEligible ? 'Standard' : 'Specialized'}
                                </span>
                              </div>
                            ) : (
                              <div className="absolute top-5 left-5 bg-white/90 backdrop-blur px-3 py-1.5 shadow-sm">
                                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]">Unavailable in {selectedCity}</span>
                              </div>
                            )}

                            {inStock && (
                              <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                  className="w-full bg-[#1A1A1A]/90 backdrop-blur-sm text-[#F7F5F0] py-4 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-[#2C3D30] transition-colors flex justify-center items-center gap-3"
                                >
                                  Add to Order <Plus size={12} strokeWidth={1} />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col px-1">
                            <div className="flex justify-between items-baseline mb-1">
                              <h3 className="font-serif text-2xl text-[#1A1A1A] group-hover:text-[#2C3D30] transition-colors">{product.name}</h3>
                              <span className="text-xs tracking-widest text-[#1A1A1A]/80">{formatPrice(product.price)}</span>
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-[#1A1A1A]/40">{product.category.replace("_", " ")}</p>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: PRODUCT DETAIL */}
            {view === 'product-detail' && selectedProduct && (
              <div className="max-w-[90rem] mx-auto px-8 md:px-16 animate-in fade-in duration-[1000ms]">
                <button onClick={() => setView('store')} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/60 hover:text-[#1A1A1A] mb-12 border-b border-transparent hover:border-[#1A1A1A] pb-1 w-fit transition-all">
                  <ArrowLeft size={12} strokeWidth={1} /> Back to Collection
                </button>
                <div className="flex flex-col md:flex-row gap-16 lg:gap-32">
                  <div className={`w-full md:w-1/2 aspect-[4/5] bg-[#EBE6E0] flex items-center justify-center text-9xl ${getCityStock(selectedProduct) === 0 && 'grayscale-[50%] opacity-80'}`}>
                    {(selectedProduct.imageUrls && selectedProduct.imageUrls[0]) || selectedProduct.image || "🪴"}
                  </div>
                  <div className="w-full md:w-1/2 flex flex-col justify-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40 mb-6">{selectedProduct.category.replace("_", " ")}</p>
                    <h1 className="text-5xl lg:text-7xl font-serif leading-[1.1] tracking-tight mb-8">{selectedProduct.name}</h1>
                    <p className="text-2xl font-light tracking-widest text-[#1A1A1A] mb-12 border-b border-[#E5E0D8] pb-12">{formatPrice(selectedProduct.price)}</p>
                    <div className="space-y-6 text-[#1A1A1A]/70 font-light leading-relaxed mb-16 text-sm">
                      <p>{selectedProduct.longDesc || selectedProduct.desc}</p>
                    </div>
                    {getCityStock(selectedProduct) > 0 ? (
                      <button onClick={() => { addToCart(selectedProduct); setView('cart'); }} className="w-full bg-[#1A1A1A] hover:bg-[#2C3D30] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-6 transition-colors flex items-center justify-center gap-3">
                        Add to Order <MoveRight size={14} strokeWidth={1} />
                      </button>
                    ) : (
                      <button disabled className="w-full bg-[#E5E0D8] text-[#1A1A1A]/50 text-[10px] uppercase tracking-[0.3em] py-6 cursor-not-allowed">
                        Currently Unavailable in {selectedCity}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: CART */}
            {view === 'cart' && (
              <div className="max-w-5xl mx-auto px-8 md:px-16 animate-in fade-in duration-[1000ms]">
                <div className="mb-16 border-b border-[#1A1A1A] pb-8 flex justify-between items-end">
                  <h2 className="text-5xl font-serif mb-4">Your Order</h2>
                  <button onClick={() => setView('store')} className="text-[10px] uppercase tracking-[0.2em] hover:opacity-50 transition-opacity">Return</button>
                </div>
                {cart.length === 0 ? (
                  <p className="text-2xl font-serif text-[#1A1A1A]/40 mb-8 text-center py-32">Your bag contains no items.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-7 space-y-8">
                      {cart.map(item => (
                        <div key={item.id || item._id} className="flex gap-8 group">
                          <div className="w-32 aspect-[3/4] bg-[#EBE6E0] flex items-center justify-center text-4xl shrink-0">
                            {(item.imageUrls && item.imageUrls[0]) || item.image || "🪴"}
                          </div>
                          <div className="flex-grow flex flex-col justify-center border-b border-[#E5E0D8] pb-4">
                            <h4 className="font-serif text-xl mb-2">{item.name}</h4>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-4">Qty: {item.qty} | {formatPrice(item.price * item.qty)}</p>
                            <button onClick={() => removeFromCart(item.id || item._id)} className="text-[10px] uppercase tracking-[0.2em] text-red-900 transition-colors mt-auto flex items-center gap-1">Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="lg:col-span-5">
                      <div className="bg-[#EBE6E0] p-10 h-fit">
                        <div className="flex justify-between items-end mb-12">
                          <span className="text-[10px] uppercase tracking-[0.3em]">Total</span>
                          <span className="text-3xl font-serif">{formatPrice(cartTotal)}</span>
                        </div>
                        <button onClick={() => setView('checkout')} className="w-full bg-[#1A1A1A] hover:bg-[#2C3D30] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-5 transition-colors flex justify-center items-center gap-3">
                          Finalize Order <MoveRight size={14} strokeWidth={1} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW: CHECKOUT */}
            {view === 'checkout' && (
              <div className="max-w-5xl mx-auto px-8 md:px-16 animate-in fade-in duration-[1000ms]">
                <h2 className="text-5xl font-serif mb-16 border-b border-[#1A1A1A] pb-8">Logistics</h2>
                <form onSubmit={submitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  <div className="lg:col-span-7 space-y-12">
                    <div className="space-y-8">
                      <h3 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#E5E0D8] pb-4">Client Info</h3>
                      <input type="text" name="name" required placeholder="Full Name *" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm tracking-wider focus:outline-none focus:border-[#1A1A1A]" />
                      <input type="email" name="email" required placeholder="Email *" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm tracking-wider focus:outline-none focus:border-[#1A1A1A]" />
                      <input type="tel" name="phone" required placeholder="Phone *" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm tracking-wider focus:outline-none focus:border-[#1A1A1A]" />
                      <input type="text" name="address" required placeholder="Address *" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm tracking-wider focus:outline-none focus:border-[#1A1A1A]" />
                    </div>
                  </div>
                  <div className="lg:col-span-5">
                    <div className="bg-[#EBE6E0] p-10 h-fit sticky top-32">
                      <h3 className="text-[10px] uppercase tracking-[0.3em] mb-8 border-b border-[#1A1A1A]/10 pb-4">Order Total: {formatPrice(cartTotal)}</h3>
                      <button type="submit" className="w-full bg-[#1A1A1A] hover:bg-[#2C3D30] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-5">Authorize Order</button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* VIEW: ORDER SUCCESS */}
            {view === 'order-success' && currentOrder && (
              <div className="max-w-2xl mx-auto px-8 py-32 text-center">
                <div className="flex justify-center mb-12">
                  <BrandLogo />
                </div>
                <h2 className="text-6xl font-serif mb-8 text-[#2C3D30]">Acquired.</h2>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-6">Reference: <span className="bg-[#1A1A1A] text-white px-2 py-1 font-bold">{currentOrder.orderNumber || currentOrder.id}</span></p>
                <p className="text-lg text-[#1A1A1A]/60 font-light mb-16">Your selections have been reserved for dispatch in {selectedCity}.<br/><br/>Please prepare {formatPrice(cartTotal)} for Cash on Delivery.</p>
                <button onClick={() => setView('store')} className="text-[10px] uppercase tracking-[0.3em] border-b border-[#1A1A1A] pb-1 hover:text-[#2C3D30] transition-colors">Return to Collection</button>
              </div>
            )}

            {/* VIEW: ADMIN LOGIN */}
            {view === 'admin-login' && (
              <div className="max-w-md mx-auto px-8 py-32">
                <h2 className="text-4xl font-serif mb-2">Staff Portal.</h2>
                <form onSubmit={handleLogin} className="space-y-8 mt-16">
                  <input type="text" placeholder="Identification" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-4 focus:outline-none" required />
                  <input type="password" placeholder="Passcode" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-4 focus:outline-none" required />
                  <button type="submit" className="w-full bg-[#1A1A1A] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-5 mt-8 hover:bg-[#2C3D30] transition-colors">Authenticate</button>
                </form>
              </div>
            )}

            {/* VIEW: ADMIN PANEL */}
            {view === 'admin-dashboard' && (
              <div className="max-w-[90rem] mx-auto px-8 md:px-16 animate-in fade-in duration-[1000ms]">
                <div className="flex justify-between items-end mb-16 border-b border-[#1A1A1A] pb-8">
                  <div>
                    <h2 className="text-5xl font-serif mb-4">Master Ledger</h2>
                    <div className="flex gap-8 text-[10px] uppercase tracking-[0.3em] mt-4">
                      <button onClick={() => setAdminTab('ledger')} className={`pb-2 ${adminTab === 'ledger' ? 'border-b border-[#1A1A1A]' : 'opacity-40'}`}>Inventory</button>
                      <button onClick={() => setAdminTab('orders')} className={`pb-2 ${adminTab === 'orders' ? 'border-b border-[#1A1A1A]' : 'opacity-40'}`}>Orders</button>
                      <button onClick={() => setAdminTab('cities')} className={`pb-2 flex items-center gap-2 ${adminTab === 'cities' ? 'border-b border-[#1A1A1A]' : 'opacity-40'}`}>Regions <Map size={12}/></button>
                    </div>
                  </div>
                  {adminTab === 'ledger' && (
                    <button onClick={() => setShowAddMenu(!showAddMenu)} className="text-[10px] uppercase tracking-[0.2em] bg-[#1A1A1A] text-[#F7F5F0] px-6 py-3 flex gap-2 hover:bg-[#2C3D30]">Add <Plus size={12}/></button>
                  )}
                </div>

                {showAddMenu && adminTab === 'ledger' && (
                  <div className="absolute right-16 top-64 w-56 bg-white border border-[#E5E0D8] shadow-xl z-50 flex flex-col py-2">
                    <button onClick={() => setShowNewEntryModal(true)} className="text-left px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-[#F7F5F0]">New Product</button>
                    <button onClick={() => setShowCSVModal(true)} className="text-left px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-[#F7F5F0]">CSV Upload</button>
                  </div>
                )}

                {/* TAB: CITIES MANAGEMENT */}
                {adminTab === 'cities' && (
                  <div className="max-w-3xl animate-in fade-in">
                    <div className="mb-12 flex gap-4">
                      <input type="text" placeholder="New Region Name..." value={newCityName} onChange={e => setNewCityName(e.target.value)} className="flex-1 bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none" />
                      <button onClick={submitNewCity} className="bg-[#1A1A1A] text-white px-8 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C3D30] transition-colors">Add Region</button>
                    </div>
                    <div className="space-y-4">
                      {cities.map(city => (
                        <div key={city} className="flex justify-between items-center bg-white p-6 border border-[#E5E0D8] shadow-sm">
                          {editingCity === city ? (
                             <input type="text" value={editCityName} onChange={e => setEditCityName(e.target.value)} className="border-b border-[#1A1A1A] focus:outline-none text-lg font-serif" />
                          ) : (
                             <span className="text-lg font-serif">{city}</span>
                          )}
                          <div className="flex gap-6 text-[10px] uppercase tracking-[0.2em]">
                             {editingCity === city ? (
                                <button onClick={() => saveEditedCity(city)} className="text-[#2C3D30] font-bold">Save</button>
                             ) : (
                                <button onClick={() => { setEditingCity(city); setEditCityName(city); }} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors">Edit</button>
                             )}
                             <button onClick={() => deleteCity(city)} className="text-red-900 hover:text-red-700 transition-colors">Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB: ORDERS WITH FETCH BUTTON */}
                {adminTab === 'orders' && (
                  <div className="space-y-12 animate-in fade-in">
                    <div className="flex justify-between items-center mb-8 border-b border-[#E5E0D8] pb-4">
                      <h3 className="text-2xl font-serif text-[#1A1A1A]/50">Recent Transactions</h3>
                      <button 
                        onClick={fetchOrders} 
                        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] bg-[#EBE6E0] hover:bg-[#1A1A1A] hover:text-[#F7F5F0] px-6 py-3 transition-colors"
                      >
                        <RefreshCw size={12} className={isFetchingOrders ? "animate-spin" : ""} /> 
                        {isFetchingOrders ? 'Syncing...' : 'Fetch Data'}
                      </button>
                    </div>

                    {orders.length === 0 ? (
                      <p className="text-[#1A1A1A]/40 text-sm tracking-widest text-center py-12">No orders found.</p>
                    ) : (
                      orders.map(order => (
                        <div key={order.orderNumber || order.id} className="bg-white p-8 border border-[#E5E0D8] shadow-sm">
                          <h3 className="text-2xl font-serif mb-4">{order.orderNumber || order.id} <span className="text-sm tracking-widest text-[#1A1A1A]/50 float-right">{formatPrice(order.totalAmount || order.total)}</span></h3>
                          <p className="text-sm text-[#1A1A1A]/70 mb-4"><strong>Client:</strong> {order.customer?.name} | {order.customer?.phone} | {order.city}</p>
                          <p className="text-sm text-[#1A1A1A]/70 mb-4"><strong>Items:</strong> {order.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB: LEDGER */}
                {adminTab === 'ledger' && (
                  <table className="w-full text-left text-sm animate-in fade-in">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 border-b border-[#E5E0D8]">
                        <th className="pb-6">Designation</th>
                        <th className="pb-6">Valuation</th>
                        <th className="pb-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id || p._id} className="border-b border-[#E5E0D8] hover:bg-white transition-colors">
                          <td className="py-6 font-serif text-lg px-2">{p.name}</td>
                          <td className="py-6 tracking-widest">{formatPrice(p.price)}</td>
                          <td className="py-6 text-right px-2"><button onClick={() => deleteProduct(p.id || p._id)} className="text-red-900 text-[10px] uppercase tracking-[0.2em] hover:text-red-700">Delete</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </main>

          {/* MINIMALIST FOOTER - FAVICON MATCHING LOGO */}
          {view !== 'admin-login' && view !== 'admin-dashboard' && (
            <footer className="border-t border-[#E5E0D8] py-16 mt-auto">
              <div className="max-w-[90rem] mx-auto px-8 flex justify-between items-center">
                <div className="flex flex-col items-center md:items-start gap-1 shrink-0">
                  <BrandLogo />
                  <span className="text-[8px] uppercase tracking-[0.4em] text-[#1A1A1A]/50 mt-1">Plants & Ceramics</span>
                </div>
                <button onClick={() => setView('admin-login')} className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors">Staff Portal</button>
              </div>
            </footer>
          )}
        </>
      )}
    </div>
  );
}
