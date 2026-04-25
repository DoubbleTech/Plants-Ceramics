import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Check, Lock, MoveRight, MapPin, Map, RefreshCw, X } from 'lucide-react';

const API_BASE = `/api`;
const formatPrice = (price) => `PKR ${Number(price).toLocaleString()}`;

const getInitialView = () => {
  if (window.location.pathname.toLowerCase().includes('admin')) return 'admin-login';
  if (localStorage.getItem('pc_selected_city')) return 'store';
  return 'city-select';
};

export default function App() {
  const [view, setView] = useState(getInitialView()); 
  const [selectedCity, setSelectedCity] = useState(localStorage.getItem('pc_selected_city') || null);
  
  const [cities, setCities] = useState(["Islamabad", "Karachi"]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All", "Indoor Plant", "Ceramic Pot"]);
  
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [visibleCount, setVisibleCount] = useState(6);

  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', email: '', phone: '', address: '', paymentMethod: 'COD' });

  // Admin State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminTab, setAdminTab] = useState('ledger'); 
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);
  
  // Modals & Forms
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newEntryForm, setNewEntryForm] = useState({
    name: '', category: 'Indoor Plant', price: '', stockCity: '', image: '🪴', desc: ''
  });

  // --- FETCH INITIAL DATA ---
  useEffect(() => {
    fetch(`${API_BASE}/catalog`)
      .then(res => {
        if (!res.ok) throw new Error("Backend offline");
        return res.json();
      })
      .then(data => {
        if(data.products && data.products.length > 0) setProducts(data.products);
        if(data.cities && data.cities.length > 0) setCities(data.cities);
        if(data.categories && data.categories.length > 0) setCategories(data.categories);
      })
      .catch(err => console.error("Database unavailable:", err));
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
      alert("⚠️ Error fetching data! The Nginx proxy might not be configured correctly yet.");
    }
    setTimeout(() => setIsFetchingOrders(false), 500); 
  };

  useEffect(() => {
    if (isAuthenticated && adminTab === 'orders') fetchOrders();
  }, [isAuthenticated, adminTab]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const filteredProducts = activeCategory === "All" ? products : products.filter(p => p.category === activeCategory);
  const getCityStock = (product, city = selectedCity) => product.stock?.[city] || 0;

  const handleCitySelect = (city) => { setSelectedCity(city); localStorage.setItem('pc_selected_city', city); setView('store'); setCart([]); };
  
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

  // --- SUBMIT ORDER & DEDUCT STOCK ---
  const submitOrder = async (e) => {
    e.preventDefault();
    const orderNum = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = { orderNumber: orderNum, date: new Date().toLocaleString(), items: [...cart], totalAmount: cartTotal, customer: checkoutForm, city: selectedCity };

    // Send to Database
    try { 
      const res = await fetch(`${API_BASE}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newOrder) });
      if (res.ok) {
        // Manually deduct local stock so UI updates without refreshing
        setProducts(prev => prev.map(p => {
          const cartItem = cart.find(ci => ci._id === p._id || ci.id === p.id);
          if (cartItem) {
            const updatedStock = { ...p.stock };
            updatedStock[selectedCity] = Math.max(0, (updatedStock[selectedCity] || 0) - cartItem.qty);
            return { ...p, stock: updatedStock };
          }
          return p;
        }));
      }
    } catch (err) { console.error("Order API failed", err); }
    
    setOrders(prev => [newOrder, ...prev]);

    // EMAIL JS CONFIGURATION
    const emailParams = {
      service_id: 'service_hyfp919', 
      template_id: 'template_nlst9qp',
      user_id: 'NHbYcpq7qYXu5mtf-', 
      template_params: {
        order_number: orderNum, customer_name: checkoutForm.name, customer_email: checkoutForm.email,
        phone: checkoutForm.phone, city: selectedCity, address: checkoutForm.address,
        total: formatPrice(cartTotal), items: cart.map(i => `${i.qty}x ${i.name}`).join(', ')
      }
    };
    fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(emailParams) }).catch(e=>e);

    // WHATSAPP CONFIGURATION
    const waText = encodeURIComponent(`🌿 *New P&C Order: ${orderNum}*\n\n*Client:* ${checkoutForm.name}\n*Phone:* ${checkoutForm.phone}\n*Address:* ${checkoutForm.address}, ${selectedCity}\n\n*Items:*\n${cart.map(item => `- ${item.qty}x ${item.name}`).join('\n')}\n\n*Total:* ${formatPrice(cartTotal)}\n*Payment:* ${checkoutForm.paymentMethod === 'TRF' ? 'Bank Transfer' : 'Cash on Delivery'}`);
    window.open(`https://wa.me/923122806668?text=${waText}`, '_blank'); 

    setCurrentOrder(newOrder); setCart([]); setView('order-success');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      if (res.ok) { setIsAuthenticated(true); setView('admin-dashboard'); }
    } catch (err) { if (username === 'admin' && password === 'Umarali667@') { setIsAuthenticated(true); setView('admin-dashboard'); } }
  };

  // --- ADD/DELETE CITIES ---
  const submitNewCity = async (e) => {
    e.preventDefault();
    const c = newCityName.trim();
    if (c && !cities.includes(c)) {
      setCities(prev => [...prev, c].sort());
      try {
        await fetch(`${API_BASE}/admin/cities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: c }) });
        alert(`✅ Success! Region "${c}" has been securely added to the database.`);
      } catch (err) { alert(`⚠️ Database error.`); }
    }
    setNewCityName('');
  };

  const deleteCity = async (cityName) => {
    setCities(prev => prev.filter(c => c !== cityName));
    try { await fetch(`${API_BASE}/admin/cities/${cityName}`, { method: 'DELETE' }); alert(`🗑️ Region "${cityName}" deleted.`); } catch (err) {}
  };

  // --- ADD/DELETE CATEGORIES ---
  const submitNewCategory = async (e) => {
    e.preventDefault();
    const c = newCategoryName.trim();
    if (c && !categories.includes(c)) {
      setCategories(prev => [...prev, c].sort());
      try {
        await fetch(`${API_BASE}/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: c }) });
        alert(`✅ Success! Category "${c}" added.`);
      } catch (err) { alert(`⚠️ Database error.`); }
    }
    setNewCategoryName('');
  };

  const deleteCategory = async (catName) => {
    setCategories(prev => prev.filter(c => c !== catName));
    try { await fetch(`${API_BASE}/admin/categories/${catName}`, { method: 'DELETE' }); alert(`🗑️ Category "${catName}" deleted.`); } catch (err) {}
  };

  // --- ADD/DELETE PRODUCTS ---
  const submitNewEntry = async (e) => {
    e.preventDefault();
    const initializedStock = {};
    cities.forEach(c => initializedStock[c] = Number(newEntryForm.stockCity) || 0);

    const newProduct = {
      name: newEntryForm.name, category: newEntryForm.category, price: Number(newEntryForm.price) || 0,
      stock: initializedStock, imageUrls: [newEntryForm.image || "🪴"], shortDesc: newEntryForm.desc
    };
    
    try {
      const res = await fetch(`${API_BASE}/admin/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProduct) });
      const savedProduct = await res.json();
      setProducts(prev => [savedProduct, ...prev]);
      alert(`✅ Product "${savedProduct.name}" added to database.`);
    } catch (err) { alert("Error saving product."); }
    setShowNewEntryModal(false);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target.result;
        const rows = text.split('\n').slice(1);
        const parsedProducts = rows.map(row => {
          const cols = row.split(',');
          if(cols.length < 5) return null;
          return { name: cols[0], imageUrls: [cols[1] || '🌿'], shortDesc: cols[4], price: Number(cols[6]) || 0, category: cols[10] || 'Indoor Plant', stock: { "Karachi": Number(cols[12]) || 0 } };
        }).filter(Boolean);
        setProducts(prev => [...parsedProducts, ...prev]);
        try {
          await fetch(`${API_BASE}/admin/products/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products: parsedProducts }) });
          alert(`✅ Bulk CSV Upload Successful!`);
        } catch(err) {}
        setShowCSVModal(false);
      };
      reader.readAsText(file);
    }
  };

  const deleteProduct = async (id) => {
    setProducts(prev => prev.filter(p => p.id !== id && p._id !== id));
    try { await fetch(`${API_BASE}/admin/products/${id}`, { method: 'DELETE' }); } catch(err) {}
  };

  // Image Logo Component
  const BrandLogo = () => (
    <img src="/logo.png" alt="Plants & Ceramics" className="h-12 md:h-16 object-contain" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
  );

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#1A1A1A]">
      
      {view === 'city-select' && (
        <div className="min-h-screen flex flex-col items-center justify-center animate-in fade-in duration-[1500ms] p-8">
          <div className="text-center max-w-xl w-full">
            <div className="flex justify-center mb-8"><BrandLogo /><div className="hidden items-center gap-2 text-4xl font-serif">🌿 P&C.</div></div>
            <h1 className="text-4xl md:text-6xl font-serif leading-[1.1] tracking-tight mb-6 mt-8">Select your region.</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-16 border-b border-[#E5E0D8] pb-8">We curate specific logistics and inventory for each territory.</p>
            <div className="flex flex-col gap-4">
              {cities.map(city => (
                <button key={city} onClick={() => handleCitySelect(city)} className="w-full border border-[#1A1A1A]/20 hover:border-[#1A1A1A] py-5 text-sm tracking-widest font-light transition-colors group relative overflow-hidden">
                  <span className="relative z-10">{city}</span><div className="absolute inset-0 bg-[#EBE6E0] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0"></div>
                </button>
              ))}
            </div>
            <button onClick={() => setView('admin-login')} className="mt-24 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A] flex items-center justify-center gap-1.5 w-full"><Lock size={10} /> Staff Portal</button>
          </div>
        </div>
      )}

      {view !== 'city-select' && (
        <>
          <nav className={`fixed w-full top-0 z-40 transition-all duration-700 ${isScrolled ? 'bg-[#F7F5F0]/90 backdrop-blur-md py-4 shadow-sm' : 'bg-transparent py-8'}`}>
            <div className="max-w-[90rem] mx-auto px-8 md:px-16 flex justify-between items-center">
              <div className="flex gap-8 items-center text-[10px] uppercase tracking-[0.2em] font-medium text-[#1A1A1A]/60">
                <button onClick={() => setView('store')} className="hover:text-[#1A1A1A]">Collection</button>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 cursor-pointer group" onClick={() => setView('store')}>
                <BrandLogo /><div className="hidden items-center gap-2 text-2xl font-serif group-hover:-rotate-12 transition-transform duration-500">🌿 P&C.</div>
              </div>
              <div className="flex items-center gap-8">
                {selectedCity && view !== 'admin-login' && view !== 'admin-dashboard' && (
                  <button onClick={() => setView('city-select')} className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A]"><MapPin size={10} /> {selectedCity}</button>
                )}
                <button onClick={() => setView('cart')} className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-medium hover:text-[#2C3D30]">
                  <span>Bag ({cart.reduce((sum, item) => sum + item.qty, 0)})</span>
                </button>
              </div>
            </div>
          </nav>

          <main className="pt-32 pb-24 min-h-[80vh]">
            
            {view === 'store' && (
              <div className="animate-in fade-in duration-[1000ms]">
                <div className="max-w-[90rem] mx-auto px-8 md:px-16 mb-24 pt-12"><h1 className="text-5xl md:text-8xl font-serif leading-[1.1] tracking-tight mb-8">Cultivated <br className="hidden md:block"/>for the modern sanctuary.</h1><div className="w-full h-[1px] bg-[#E5E0D8]"></div></div>
                <div className="max-w-[90rem] mx-auto px-8 md:px-16 flex flex-col lg:flex-row gap-16 xl:gap-32">
                  <aside className="w-full lg:w-48 shrink-0">
                    <div className="lg:sticky lg:top-32">
                      <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40 mb-8 border-b border-[#E5E0D8] pb-4">Index</h3>
                      <ul className="flex flex-wrap lg:flex-col gap-4 lg:gap-4 pb-4 lg:pb-0">
                        {categories.map(cat => (
                          <li key={cat}><button onClick={() => { setActiveCategory(cat); setVisibleCount(6); }} className={`text-xs uppercase tracking-[0.15em] whitespace-nowrap transition-all duration-500 ${activeCategory === cat ? 'text-[#1A1A1A] font-medium translate-x-2' : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]'}`}>{cat.replace("_", " ")}</button></li>
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
                        <div key={product.id || product._id} onClick={() => { setSelectedProduct(product); setView('product-detail'); }} className={`group flex flex-col cursor-pointer animate-in fade-in duration-700 ${!inStock && 'opacity-60 grayscale-[50%]'}`}>
                          <div className="w-full aspect-[4/5] bg-[#EBE6E0] mb-6 relative overflow-hidden flex items-center justify-center text-8xl transition-colors duration-700">
                            <span className="transform group-hover:scale-110 transition-transform duration-[1500ms]">{displayImage}</span>
                            {inStock && (
                              <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                                <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="w-full bg-[#1A1A1A]/90 backdrop-blur-sm text-[#F7F5F0] py-4 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-[#2C3D30] flex justify-center items-center gap-3">Add to Order <Plus size={12} strokeWidth={1} /></button>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col px-1">
                            <div className="flex justify-between items-baseline mb-1"><h3 className="font-serif text-2xl text-[#1A1A1A] group-hover:text-[#2C3D30] transition-colors">{product.name}</h3><span className="text-xs tracking-widest text-[#1A1A1A]/80">{formatPrice(product.price)}</span></div>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-[#1A1A1A]/40">{product.category.replace("_", " ")}</p>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === 'product-detail' && selectedProduct && (
              <div className="max-w-[90rem] mx-auto px-8 md:px-16 animate-in fade-in">
                <button onClick={() => setView('store')} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/60 hover:text-[#1A1A1A] mb-12 border-b border-transparent hover:border-[#1A1A1A] pb-1 w-fit"><ArrowLeft size={12} strokeWidth={1} /> Back</button>
                <div className="flex flex-col md:flex-row gap-16 lg:gap-32">
                  <div className={`w-full md:w-1/2 aspect-[4/5] bg-[#EBE6E0] flex items-center justify-center text-9xl ${getCityStock(selectedProduct) === 0 && 'grayscale-[50%] opacity-80'}`}>{(selectedProduct.imageUrls && selectedProduct.imageUrls[0]) || selectedProduct.image || "🪴"}</div>
                  <div className="w-full md:w-1/2 flex flex-col justify-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40 mb-6">{selectedProduct.category.replace("_", " ")}</p>
                    <h1 className="text-5xl lg:text-7xl font-serif leading-[1.1] tracking-tight mb-8">{selectedProduct.name}</h1>
                    <p className="text-2xl font-light tracking-widest text-[#1A1A1A] mb-12 border-b border-[#E5E0D8] pb-12">{formatPrice(selectedProduct.price)}</p>
                    <div className="space-y-6 text-[#1A1A1A]/70 font-light leading-relaxed mb-16 text-sm"><p>{selectedProduct.longDesc || selectedProduct.desc}</p></div>
                    {getCityStock(selectedProduct) > 0 ? (
                      <button onClick={() => { addToCart(selectedProduct); setView('cart'); }} className="w-full bg-[#1A1A1A] hover:bg-[#2C3D30] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-6 flex items-center justify-center gap-3">Add to Order <MoveRight size={14} strokeWidth={1} /></button>
                    ) : ( <button disabled className="w-full bg-[#E5E0D8] text-[#1A1A1A]/50 text-[10px] uppercase tracking-[0.3em] py-6 cursor-not-allowed">Unavailable in {selectedCity}</button>)}
                  </div>
                </div>
              </div>
            )}

            {view === 'cart' && (
              <div className="max-w-5xl mx-auto px-8 md:px-16 animate-in fade-in">
                <div className="mb-16 border-b border-[#1A1A1A] pb-8 flex justify-between items-end"><h2 className="text-5xl font-serif mb-4">Your Order</h2><button onClick={() => setView('store')} className="text-[10px] uppercase tracking-[0.2em] hover:opacity-50">Return</button></div>
                {cart.length === 0 ? (
                  <p className="text-2xl font-serif text-[#1A1A1A]/40 mb-8 text-center py-32">Your bag contains no items.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-7 space-y-8">
                      {cart.map(item => (
                        <div key={item.id || item._id} className="flex gap-8 group">
                          <div className="w-32 aspect-[3/4] bg-[#EBE6E0] flex items-center justify-center text-4xl shrink-0">{(item.imageUrls && item.imageUrls[0]) || item.image || "🪴"}</div>
                          <div className="flex-grow flex flex-col justify-center border-b border-[#E5E0D8] pb-4">
                            <h4 className="font-serif text-xl mb-2">{item.name}</h4><p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-4">Qty: {item.qty} | {formatPrice(item.price * item.qty)}</p>
                            <button onClick={() => removeFromCart(item.id || item._id)} className="text-[10px] uppercase tracking-[0.2em] text-red-900 mt-auto flex items-center gap-1">Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="lg:col-span-5">
                      <div className="bg-[#EBE6E0] p-10 h-fit">
                        <div className="flex justify-between items-end mb-12"><span className="text-[10px] uppercase tracking-[0.3em]">Total</span><span className="text-3xl font-serif">{formatPrice(cartTotal)}</span></div>
                        <button onClick={() => setView('checkout')} className="w-full bg-[#1A1A1A] hover:bg-[#2C3D30] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-5 flex justify-center items-center gap-3">Finalize Order <MoveRight size={14} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {view === 'checkout' && (
              <div className="max-w-5xl mx-auto px-8 md:px-16 animate-in fade-in">
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

            {view === 'order-success' && currentOrder && (
              <div className="max-w-2xl mx-auto px-8 py-32 text-center animate-in fade-in">
                <div className="flex justify-center mb-12"><BrandLogo /></div>
                <h2 className="text-6xl font-serif mb-8 text-[#2C3D30]">Acquired.</h2>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-6">Reference: <span className="bg-[#1A1A1A] text-white px-2 py-1 font-bold">{currentOrder.orderNumber || currentOrder.id}</span></p>
                <p className="text-lg text-[#1A1A1A]/60 font-light mb-16">Your selections have been reserved for dispatch in {selectedCity}.<br/><br/>Please prepare {formatPrice(cartTotal)} for Cash on Delivery.</p>
                <button onClick={() => setView('store')} className="text-[10px] uppercase tracking-[0.3em] border-b border-[#1A1A1A] pb-1 hover:text-[#2C3D30]">Return to Collection</button>
              </div>
            )}

            {view === 'admin-login' && (
              <div className="max-w-md mx-auto px-8 py-32">
                <h2 className="text-4xl font-serif mb-2">Staff Portal.</h2>
                <form onSubmit={handleLogin} className="space-y-8 mt-16">
                  <input type="text" placeholder="Identification" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-4 focus:outline-none" required />
                  <input type="password" placeholder="Passcode" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-4 focus:outline-none" required />
                  <button type="submit" className="w-full bg-[#1A1A1A] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-5 mt-8 hover:bg-[#2C3D30]">Authenticate</button>
                </form>
              </div>
            )}

            {view === 'admin-dashboard' && (
              <div className="max-w-[90rem] mx-auto px-8 md:px-16 animate-in fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-[#1A1A1A] pb-8 gap-6">
                  <div>
                    <h2 className="text-5xl font-serif mb-4">Master Ledger</h2>
                    <div className="flex flex-wrap gap-8 text-[10px] uppercase tracking-[0.3em] mt-4">
                      <button onClick={() => setAdminTab('ledger')} className={`pb-2 ${adminTab === 'ledger' ? 'border-b border-[#1A1A1A]' : 'opacity-40'}`}>Inventory</button>
                      <button onClick={() => setAdminTab('orders')} className={`pb-2 ${adminTab === 'orders' ? 'border-b border-[#1A1A1A]' : 'opacity-40'}`}>Orders</button>
                      <button onClick={() => setAdminTab('cities')} className={`pb-2 ${adminTab === 'cities' ? 'border-b border-[#1A1A1A]' : 'opacity-40'}`}>Regions</button>
                      <button onClick={() => setAdminTab('categories')} className={`pb-2 ${adminTab === 'categories' ? 'border-b border-[#1A1A1A]' : 'opacity-40'}`}>Categories</button>
                    </div>
                  </div>
                  {adminTab === 'ledger' && (
                    <div className="flex gap-4">
                      <button onClick={() => setShowNewEntryModal(true)} className="text-[10px] uppercase tracking-[0.2em] bg-[#1A1A1A] text-[#F7F5F0] px-6 py-3 hover:bg-[#2C3D30]">Add Product <Plus size={12} className="inline"/></button>
                      <button onClick={() => setShowCSVModal(true)} className="text-[10px] uppercase tracking-[0.2em] bg-[#EBE6E0] text-[#1A1A1A] px-6 py-3 hover:bg-[#1A1A1A] hover:text-[#F7F5F0] border border-[#1A1A1A]/10">Bulk CSV</button>
                    </div>
                  )}
                </div>

                {adminTab === 'categories' && (
                  <div className="max-w-3xl animate-in fade-in">
                    <form onSubmit={submitNewCategory} className="mb-12 flex gap-4">
                      <input type="text" placeholder="New Category Name..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none" required/>
                      <button type="submit" className="bg-[#1A1A1A] text-white px-8 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C3D30]">Create Category</button>
                    </form>
                    <div className="space-y-4">
                      {categories.map(cat => (
                        <div key={cat} className="flex justify-between items-center bg-white p-6 border border-[#E5E0D8]">
                          <span className="text-lg font-serif">{cat}</span>
                          <button onClick={() => deleteCategory(cat)} className="text-[10px] uppercase tracking-[0.2em] text-red-900 hover:text-red-700">Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminTab === 'cities' && (
                  <div className="max-w-3xl animate-in fade-in">
                    <form onSubmit={submitNewCity} className="mb-12 flex gap-4">
                      <input type="text" placeholder="New Region Name..." value={newCityName} onChange={e => setNewCityName(e.target.value)} className="flex-1 bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none" required/>
                      <button type="submit" className="bg-[#1A1A1A] text-white px-8 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C3D30]">Add Region</button>
                    </form>
                    <div className="space-y-4">
                      {cities.map(city => (
                        <div key={city} className="flex justify-between items-center bg-white p-6 border border-[#E5E0D8] shadow-sm">
                          <span className="text-lg font-serif">{city}</span>
                          <button onClick={() => deleteCity(city)} className="text-[10px] uppercase tracking-[0.2em] text-red-900 hover:text-red-700">Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminTab === 'orders' && (
                  <div className="space-y-12 animate-in fade-in">
                    <div className="flex justify-between items-center mb-8 border-b border-[#E5E0D8] pb-4">
                      <h3 className="text-2xl font-serif text-[#1A1A1A]/50">Recent Transactions</h3>
                      <button onClick={fetchOrders} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] bg-[#EBE6E0] hover:bg-[#1A1A1A] hover:text-[#F7F5F0] px-6 py-3 transition-colors">
                        <RefreshCw size={12} className={isFetchingOrders ? "animate-spin" : ""} /> {isFetchingOrders ? 'Syncing...' : 'Fetch Data'}
                      </button>
                    </div>
                    {orders.length === 0 ? ( <p className="text-[#1A1A1A]/40 text-sm tracking-widest text-center py-12">No orders found.</p> ) : (
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

                {adminTab === 'ledger' && (
                  <table className="w-full text-left text-sm animate-in fade-in">
                    <thead><tr className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 border-b border-[#E5E0D8]"><th className="pb-6">Designation</th><th className="pb-6">Valuation</th><th className="pb-6 text-right">Actions</th></tr></thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id || p._id} className="border-b border-[#E5E0D8] hover:bg-white transition-colors">
                          <td className="py-6 font-serif text-lg px-2">{p.name} <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40 ml-4 hidden md:inline">{p.category.replace("_", " ")}</span></td>
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

          <footer className="border-t border-[#E5E0D8] py-16 mt-auto">
            <div className="max-w-[90rem] mx-auto px-8 flex justify-between items-center">
              <div className="flex flex-col items-center md:items-start shrink-0"><BrandLogo /><span className="text-[8px] uppercase tracking-[0.4em] text-[#1A1A1A]/50 mt-1">Plants & Ceramics</span></div>
              <button onClick={() => setView('admin-login')} className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A]">Staff Portal</button>
            </div>
          </footer>

          {showNewEntryModal && (
            <div className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-[#F7F5F0] p-12 max-w-2xl w-full border border-[#E5E0D8] shadow-2xl relative">
                <button onClick={() => setShowNewEntryModal(false)} className="absolute top-6 right-6 text-[#1A1A1A]/40 hover:text-[#1A1A1A]"><X size={24} strokeWidth={1} /></button>
                <h2 className="text-4xl font-serif mb-8 border-b border-[#1A1A1A]/10 pb-4">New Product.</h2>
                <form onSubmit={submitNewEntry} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div><label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">Name</label><input type="text" required onChange={e=>setNewEntryForm({...newEntryForm, name: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none focus:border-[#1A1A1A]" /></div>
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">Category</label>
                      <select onChange={e=>setNewEntryForm({...newEntryForm, category: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none">
                        {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div><label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">Price (PKR)</label><input type="number" required onChange={e=>setNewEntryForm({...newEntryForm, price: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none" /></div>
                    <div><label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">Initial Stock Amount</label><input type="number" required onChange={e=>setNewEntryForm({...newEntryForm, stockCity: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none" /></div>
                    <div><label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">Image Emoji/URL</label><input type="text" defaultValue="🪴" onChange={e=>setNewEntryForm({...newEntryForm, image: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none" /></div>
                  </div>
                  <div><label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">Description</label><textarea required onChange={e=>setNewEntryForm({...newEntryForm, desc: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none h-24" /></div>
                  <button type="submit" className="w-full bg-[#1A1A1A] text-white py-4 text-[10px] uppercase tracking-[0.3em] hover:bg-[#2C3D30] transition-colors mt-8">Add to Ledger</button>
                </form>
              </div>
            </div>
          )}

          {showCSVModal && (
            <div className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-[#F7F5F0] p-12 max-w-xl w-full border border-[#E5E0D8] shadow-2xl relative text-center">
                 <button onClick={() => setShowCSVModal(false)} className="absolute top-6 right-6 text-[#1A1A1A]/40 hover:text-[#1A1A1A]"><X size={24} strokeWidth={1} /></button>
                 <h2 className="text-4xl font-serif mb-4">Bulk Import.</h2>
                 <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-8">Upload a CSV file to inject multiple products instantly.</p>
                 <div className="border-2 border-dashed border-[#1A1A1A]/20 p-12 hover:border-[#1A1A1A] transition-colors relative cursor-pointer">
                    <input type="file" accept=".csv" onChange={handleCSVUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <span className="text-sm font-medium">Click to Browse or Drag CSV Here</span>
                 </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
