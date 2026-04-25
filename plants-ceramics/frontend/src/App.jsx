import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Lock, MoveRight, MapPin, RefreshCw, X, Download, GripVertical, CheckSquare, Edit } from 'lucide-react';
import Swal from 'sweetalert2';

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
  
  // Updated Checkout State
  const [checkoutForm, setCheckoutForm] = useState({ 
    name: '', email: '', phone: '', address: '', 
    mapLink: '', addressType: 'Home', secretCode: '', 
    instructions: '', paymentMethod: 'COD', receipt: null 
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminTab, setAdminTab] = useState('ledger'); 
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);
  
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [entryForm, setEntryForm] = useState({ id: null, name: '', category: 'Indoor Plant', price: '', stockCity: '', image: '🪴', desc: '' });

  // Bulk Edit State
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  // Drag & Drop State
  const [draggedCityIdx, setDraggedCityIdx] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/catalog`)
      .then(res => { if (!res.ok) throw new Error("Offline"); return res.json(); })
      .then(data => {
        if(data.products) setProducts(data.products);
        if(data.cities && data.cities.length > 0) setCities(data.cities);
        if(data.categories && data.categories.length > 0) setCategories(data.categories);
      }).catch(err => console.error(err));
  }, []);

  const fetchOrders = async () => {
    setIsFetchingOrders(true);
    try {
      const res = await fetch(`${API_BASE}/admin/orders`);
      const data = await res.json();
      setOrders(data);
      Swal.fire({ icon: 'success', title: 'Synced', text: 'Latest orders fetched!', confirmButtonColor: '#1A1A1A' });
    } catch (err) { Swal.fire({ icon: 'error', title: 'Sync Failed', text: 'Server unreachable.', confirmButtonColor: '#1A1A1A' }); }
    setTimeout(() => setIsFetchingOrders(false), 500); 
  };

  useEffect(() => { if (isAuthenticated && adminTab === 'orders') fetchOrders(); }, [isAuthenticated, adminTab]);
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
  
  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCheckoutForm(prev => ({ ...prev, receipt: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (checkoutForm.paymentMethod === 'TRF' && !checkoutForm.receipt) {
      return Swal.fire({ icon: 'warning', title: 'Receipt Required', text: 'Please attach your bank transfer screenshot.', confirmButtonColor: '#1A1A1A' });
    }

    const orderNum = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = { orderNumber: orderNum, date: new Date().toLocaleString(), items: [...cart], totalAmount: cartTotal, customer: checkoutForm, city: selectedCity };

    try { 
      const res = await fetch(`${API_BASE}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newOrder) });
      if (res.ok) {
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
      user_id: 'YOUR_PUBLIC_KEY', // <--- PASTE YOUR EMAILJS PUBLIC KEY RIGHT HERE
      template_params: {
        order_number: orderNum, customer_name: checkoutForm.name, customer_email: checkoutForm.email,
        phone: checkoutForm.phone, city: selectedCity, address: checkoutForm.address,
        address_type: checkoutForm.addressType, map_link: checkoutForm.mapLink, secret_code: checkoutForm.secretCode,
        total: formatPrice(cartTotal), items: cart.map(i => `${i.qty}x ${i.name}`).join(', ')
      }
    };
    fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(emailParams) }).catch(e=>e);

    const waText = encodeURIComponent(`🌿 *New P&C Order: ${orderNum}*\n\n*Client:* ${checkoutForm.name}\n*Phone:* ${checkoutForm.phone}\n*Type:* ${checkoutForm.addressType}\n*Address:* ${checkoutForm.address}, ${selectedCity}\n*Map Link:* ${checkoutForm.mapLink || 'N/A'}\n*Secret Code:* ${checkoutForm.secretCode || 'N/A'}\n*Instructions:* ${checkoutForm.instructions || 'None'}\n\n*Items:*\n${cart.map(item => `- ${item.qty}x ${item.name}`).join('\n')}\n\n*Total:* ${formatPrice(cartTotal)}\n*Payment:* ${checkoutForm.paymentMethod === 'TRF' ? 'Bank Transfer' : 'Cash on Delivery'}`);
    window.open(`https://wa.me/923122806668?text=${waText}`, '_blank'); 

    setCurrentOrder(newOrder); setCart([]); setView('order-success');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      if (res.ok) { setIsAuthenticated(true); setView('admin-dashboard'); }
      else { Swal.fire({ icon: 'error', title: 'Access Denied', text: 'Incorrect Credentials.', confirmButtonColor: '#1A1A1A' }); }
    } catch (err) { 
      if (username === 'admin' && password === 'Umarali667@') { setIsAuthenticated(true); setView('admin-dashboard'); } 
    }
  };

  // --- DRAG AND DROP CITIES ---
  const handleDropCity = async (dropIdx) => {
    if (draggedCityIdx === null || draggedCityIdx === dropIdx) return;
    const newCities = [...cities];
    const [draggedItem] = newCities.splice(draggedCityIdx, 1);
    newCities.splice(dropIdx, 0, draggedItem);
    setCities(newCities);
    setDraggedCityIdx(null);
    try { await fetch(`${API_BASE}/admin/cities/reorder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cities: newCities }) }); } catch(e){}
  };

  const submitNewCity = async (e) => {
    e.preventDefault();
    const c = newCityName.trim();
    if (c && !cities.includes(c)) {
      setCities(prev => [...prev, c]);
      try {
        await fetch(`${API_BASE}/admin/cities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: c }) });
        Swal.fire({ icon: 'success', title: 'Region Added', confirmButtonColor: '#1A1A1A' });
      } catch (err) {}
    }
    setNewCityName('');
  };

  const deleteCity = async (cityName) => {
    setCities(prev => prev.filter(c => c !== cityName));
    try { await fetch(`${API_BASE}/admin/cities/${cityName}`, { method: 'DELETE' }); } catch (err) {}
  };

  const submitNewCategory = async (e) => {
    e.preventDefault();
    const c = newCategoryName.trim();
    if (c && !categories.includes(c)) {
      setCategories(prev => [...prev, c].sort());
      try { await fetch(`${API_BASE}/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: c }) }); } catch (err) {}
    }
    setNewCategoryName('');
  };
  const deleteCategory = async (catName) => {
    setCategories(prev => prev.filter(c => c !== catName));
    try { await fetch(`${API_BASE}/admin/categories/${catName}`, { method: 'DELETE' }); } catch (err) {}
  };

  // --- ADD / EDIT PRODUCTS ---
  const openEditModal = (product) => {
    setEntryForm({ id: product._id || product.id, name: product.name, category: product.category, price: product.price, stockCity: product.stock?.[cities[0]] || 0, image: product.imageUrls[0], desc: product.shortDesc || '' });
    setIsEditing(true);
    setShowEntryModal(true);
  };

  const submitEntry = async (e) => {
    e.preventDefault();
    const initializedStock = {};
    cities.forEach(c => initializedStock[c] = Number(entryForm.stockCity) || 0);

    const payload = { name: entryForm.name, category: entryForm.category, price: Number(entryForm.price) || 0, stock: initializedStock, imageUrls: [entryForm.image || "🪴"], shortDesc: entryForm.desc };
    
    try {
      if (isEditing) {
        const res = await fetch(`${API_BASE}/admin/products/${entryForm.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const updated = await res.json();
        setProducts(prev => prev.map(p => (p._id === updated._id || p.id === updated.id) ? updated : p));
        Swal.fire({ icon: 'success', title: 'Product Updated', confirmButtonColor: '#1A1A1A' });
      } else {
        const res = await fetch(`${API_BASE}/admin/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const saved = await res.json();
        setProducts(prev => [saved, ...prev]);
        Swal.fire({ icon: 'success', title: 'Product Added', confirmButtonColor: '#1A1A1A' });
      }
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error saving product' }); }
    setShowEntryModal(false);
  };

  const deleteProduct = async (id) => {
    setProducts(prev => prev.filter(p => p.id !== id && p._id !== id));
    try { await fetch(`${API_BASE}/admin/products/${id}`, { method: 'DELETE' }); } catch(err) {}
  };

  // --- BULK SELECTION ---
  const toggleSelectProduct = (id) => {
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    if (selectedProductIds.length === products.length) setSelectedProductIds([]);
    else setSelectedProductIds(products.map(p => p._id || p.id));
  };
  const handleBulkDelete = async () => {
    if(!selectedProductIds.length) return;
    const result = await Swal.fire({ title: 'Are you sure?', text: `Delete ${selectedProductIds.length} items?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#1A1A1A', confirmButtonText: 'Yes, delete them!' });
    if(result.isConfirmed) {
      setProducts(prev => prev.filter(p => !selectedProductIds.includes(p._id || p.id)));
      try {
        await fetch(`${API_BASE}/admin/products/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedProductIds }) });
        Swal.fire('Deleted!', 'Items removed.', 'success');
      } catch(e) {}
      setSelectedProductIds([]);
    }
  };

  // --- CSV UPLOAD & SAMPLE ---
  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Image,Category,Price,Description,StockKarachi,StockIslamabad\nMonstera,🪴,Indoor Plant,1500,Beautiful green plant,10,5\nTerracotta Pot,🏺,Ceramic Pot,500,Clay pot,20,0";
    window.open(encodeURI(csvContent));
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
          return { name: cols[0], imageUrls: [cols[1] || '🪴'], category: cols[2], price: Number(cols[3]) || 0, shortDesc: cols[4], stock: { "Karachi": Number(cols[5]) || 0, "Islamabad": Number(cols[6]) || 0 } };
        }).filter(Boolean);
        setProducts(prev => [...parsedProducts, ...prev]);
        try {
          await fetch(`${API_BASE}/admin/products/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products: parsedProducts }) });
          Swal.fire({ icon: 'success', title: 'Bulk Upload Successful!', confirmButtonColor: '#1A1A1A' });
        } catch(err) {}
        setShowCSVModal(false);
      };
      reader.readAsText(file);
    }
  };

  const BrandLogo = () => <img src="/logo.png" alt="Plants & Ceramics" className="h-12 md:h-16 object-contain" />;
  const isClientView = !view.includes('admin');

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#1A1A1A]">
      
      {view === 'city-select' && (
        <div className="min-h-screen flex flex-col items-center justify-center animate-in fade-in duration-[1500ms] p-8">
          <div className="text-center max-w-xl w-full">
            <div className="flex justify-center mb-8"><BrandLogo /></div>
            <h1 className="text-4xl md:text-6xl font-serif leading-[1.1] tracking-tight mb-6 mt-8">Select your region.</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-16 border-b border-[#E5E0D8] pb-8">We curate specific logistics and inventory for each territory.</p>
            <div className="flex flex-col gap-4">
              {cities.map(city => (
                <button key={city} onClick={() => handleCitySelect(city)} className="w-full border border-[#1A1A1A]/20 hover:border-[#1A1A1A] py-5 text-sm tracking-widest font-light transition-colors group relative overflow-hidden">
                  <span className="relative z-10">{city}</span><div className="absolute inset-0 bg-[#EBE6E0] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0"></div>
                </button>
              ))}
            </div>
            {/* FEATURE: Staff Portal Link Removed from here! */}
          </div>
        </div>
      )}

      {view !== 'city-select' && (
        <>
          {isClientView && (
            <nav className={`fixed w-full top-0 z-40 transition-all duration-700 ${isScrolled ? 'bg-[#F7F5F0]/90 backdrop-blur-md py-4 shadow-sm' : 'bg-transparent py-8'}`}>
              <div className="max-w-[90rem] mx-auto px-8 md:px-16 flex justify-between items-center">
                <div className="flex gap-8 items-center text-[10px] uppercase tracking-[0.2em] font-medium text-[#1A1A1A]/60">
                  <button onClick={() => setView('store')} className="hover:text-[#1A1A1A]">Collection</button>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 cursor-pointer group" onClick={() => setView('store')}>
                  <BrandLogo />
                </div>
                <div className="flex items-center gap-8">
                  {selectedCity && <button onClick={() => setView('city-select')} className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A]"><MapPin size={10} /> {selectedCity}</button>}
                  <button onClick={() => setView('cart')} className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-medium hover:text-[#2C3D30]">
                    <span>Bag ({cart.reduce((sum, item) => sum + item.qty, 0)})</span>
                  </button>
                </div>
              </div>
            </nav>
          )}

          <main className={isClientView ? "pt-32 pb-24 min-h-[80vh]" : "min-h-screen"}>
            
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

            {/* FEATURE: Expanded Checkout Form */}
            {view === 'checkout' && (
              <div className="max-w-5xl mx-auto px-8 md:px-16 animate-in fade-in">
                <h2 className="text-5xl font-serif mb-16 border-b border-[#1A1A1A] pb-8">Logistics</h2>
                <form onSubmit={submitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  <div className="lg:col-span-7 space-y-12">
                    <div className="space-y-8">
                      <h3 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#E5E0D8] pb-4">Client Info</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <input type="text" name="name" required placeholder="Full Name *" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                        <input type="email" name="email" required placeholder="Email *" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <input type="tel" name="phone" required placeholder="Phone *" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                        <input type="text" name="secretCode" placeholder="Secret Rider Code (Optional)" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                      </div>
                      
                      <h3 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#E5E0D8] pb-4 mt-12">Delivery Details</h3>
                      <div className="flex gap-8 mb-4">
                         <label className="text-sm flex items-center gap-2"><input type="radio" name="addressType" value="Home" defaultChecked onChange={handleCheckoutChange} className="accent-[#1A1A1A]" /> Home</label>
                         <label className="text-sm flex items-center gap-2"><input type="radio" name="addressType" value="Office" onChange={handleCheckoutChange} className="accent-[#1A1A1A]" /> Office</label>
                      </div>
                      <input type="text" name="address" required placeholder="Complete Delivery Address *" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                      <input type="text" name="mapLink" placeholder="Google Maps Link (Recommended)" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                      <textarea name="instructions" placeholder="Special Instructions for Delivery..." onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none focus:border-[#1A1A1A] mt-4" rows="2"></textarea>
                      
                      <h3 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#E5E0D8] pb-4 mt-12">Payment</h3>
                      <select name="paymentMethod" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none focus:border-[#1A1A1A]">
                        <option value="COD">Cash on Delivery</option>
                        <option value="TRF">Bank Transfer</option>
                      </select>

                      {checkoutForm.paymentMethod === 'TRF' && (
                         <div className="bg-[#EBE6E0] p-6 border border-[#1A1A1A]/20 mt-4 animate-in fade-in">
                            <p className="text-sm mb-4">Transfer to: <strong>Meezan Bank | A/C 0123456789 | Doubble Tech</strong></p>
                            <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-2">Upload Transfer Screenshot *</label>
                            <input type="file" accept="image/*" required onChange={handleReceiptUpload} className="text-sm w-full" />
                         </div>
                      )}
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
                <p className="text-lg text-[#1A1A1A]/60 font-light mb-16">Your selections have been reserved for dispatch in {selectedCity}.<br/><br/>Please prepare {formatPrice(cartTotal)}.</p>
                <button onClick={() => setView('store')} className="text-[10px] uppercase tracking-[0.3em] border-b border-[#1A1A1A] pb-1 hover:text-[#2C3D30]">Return to Collection</button>
              </div>
            )}

            {view === 'admin-login' && (
              <div className="max-w-md mx-auto px-8 py-32 flex flex-col justify-center h-screen animate-in fade-in">
                <h2 className="text-4xl font-serif mb-2">Staff Portal.</h2>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-8 border-b border-[#E5E0D8] pb-4">Authorized Personnel Only</p>
                <form onSubmit={handleLogin} className="space-y-8 mt-8">
                  <input type="text" placeholder="Identification" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-4 focus:outline-none" required />
                  <input type="password" placeholder="Passcode" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-4 focus:outline-none" required />
                  <button type="submit" className="w-full bg-[#1A1A1A] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-5 mt-8 hover:bg-[#2C3D30]">Authenticate</button>
                </form>
                <button onClick={() => { window.history.pushState({}, '', '/'); setView('store'); }} className="mt-12 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A]">Return to Storefront</button>
              </div>
            )}

            {view === 'admin-dashboard' && (
              <div className="max-w-[90rem] mx-auto px-8 md:px-16 pt-16 pb-32 animate-in fade-in">
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
                  <div className="flex gap-4 items-center">
                    {adminTab === 'ledger' && (
                      <div className="flex gap-4">
                        {selectedProductIds.length > 0 && (
                          <button onClick={handleBulkDelete} className="text-[10px] uppercase tracking-[0.2em] bg-red-900 text-white px-6 py-3 hover:bg-red-700 transition-colors">Delete Selected ({selectedProductIds.length})</button>
                        )}
                        <button onClick={() => { setIsEditing(false); setEntryForm({ id: null, name: '', category: categories[1], price: '', stockCity: '', image: '🪴', desc: '' }); setShowEntryModal(true); }} className="text-[10px] uppercase tracking-[0.2em] bg-[#1A1A1A] text-[#F7F5F0] px-6 py-3 hover:bg-[#2C3D30]">Add Product <Plus size={12} className="inline"/></button>
                        <button onClick={() => setShowCSVModal(true)} className="text-[10px] uppercase tracking-[0.2em] bg-[#EBE6E0] text-[#1A1A1A] px-6 py-3 hover:bg-[#1A1A1A] hover:text-[#F7F5F0] border border-[#1A1A1A]/10">Bulk CSV</button>
                      </div>
                    )}
                    <button onClick={() => { setIsAuthenticated(false); setView('store'); }} className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-red-800 ml-8">Logout</button>
                  </div>
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

                {/* FEATURE: DRAG AND DROP CITIES */}
                {adminTab === 'cities' && (
                  <div className="max-w-3xl animate-in fade-in">
                    <form onSubmit={submitNewCity} className="mb-12 flex gap-4">
                      <input type="text" placeholder="New Region Name..." value={newCityName} onChange={e => setNewCityName(e.target.value)} className="flex-1 bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none" required/>
                      <button type="submit" className="bg-[#1A1A1A] text-white px-8 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C3D30]">Add Region</button>
                    </form>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-4">Drag and drop to reorder</p>
                    <div className="space-y-4">
                      {cities.map((city, idx) => (
                        <div 
                          key={city} 
                          draggable 
                          onDragStart={() => setDraggedCityIdx(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDropCity(idx)}
                          className="flex justify-between items-center bg-white p-6 border border-[#E5E0D8] shadow-sm cursor-grab active:cursor-grabbing hover:border-[#1A1A1A]/30 transition-colors"
                        >
                          <span className="text-lg font-serif flex items-center gap-4"><GripVertical size={16} className="text-[#1A1A1A]/30" /> {city}</span>
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-[#1A1A1A]/80">
                             <div>
                                <p className="mb-2"><strong>Client:</strong> {order.customer?.name}</p>
                                <p className="mb-2"><strong>Contact:</strong> {order.customer?.phone} | {order.customer?.email}</p>
                                <p className="mb-2"><strong>Address:</strong> {order.customer?.addressType} - {order.customer?.address}, {order.city}</p>
                                {order.customer?.mapLink && <p className="mb-2"><strong>Map:</strong> <a href={order.customer.mapLink} target="_blank" rel="noreferrer" className="text-blue-600 underline">View Location</a></p>}
                                {order.customer?.instructions && <p className="mb-2"><strong>Note:</strong> {order.customer.instructions}</p>}
                             </div>
                             <div>
                                <p className="mb-2"><strong>Payment:</strong> {order.customer?.paymentMethod === 'TRF' ? 'Bank Transfer' : 'Cash on Delivery'}</p>
                                {order.customer?.secretCode && <p className="mb-2"><strong>Secret Code:</strong> <span className="font-mono bg-yellow-100 px-2 font-bold">{order.customer.secretCode}</span></p>}
                                <p className="mb-2"><strong>Items:</strong> {order.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}</p>
                                {order.customer?.receipt && (
                                   <div className="mt-4">
                                      <p className="font-bold mb-2">Transfer Receipt:</p>
                                      <img src={order.customer.receipt} alt="Receipt" className="max-w-[200px] border border-[#E5E0D8] cursor-pointer" onClick={() => window.open(order.customer.receipt)} />
                                   </div>
                                )}
                             </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* FEATURE: INDIVIDUAL EDIT AND BULK CHECKBOXES */}
                {adminTab === 'ledger' && (
                  <table className="w-full text-left text-sm animate-in fade-in">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 border-b border-[#E5E0D8]">
                        <th className="pb-6 w-12 text-center cursor-pointer" onClick={toggleSelectAll}><CheckSquare size={14} className={selectedProductIds.length === products.length && products.length > 0 ? "text-[#1A1A1A]" : ""} /></th>
                        <th className="pb-6">Designation</th>
                        <th className="pb-6">Valuation</th>
                        <th className="pb-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id || p._id} className={`border-b border-[#E5E0D8] hover:bg-white transition-colors ${selectedProductIds.includes(p.id || p._id) ? 'bg-gray-50' : ''}`}>
                          <td className="py-6 text-center cursor-pointer" onClick={() => toggleSelectProduct(p.id || p._id)}>
                             <input type="checkbox" checked={selectedProductIds.includes(p.id || p._id)} readOnly className="accent-[#1A1A1A]" />
                          </td>
                          <td className="py-6 font-serif text-lg px-2">{p.name} <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40 ml-4 hidden md:inline">{p.category.replace("_", " ")}</span></td>
                          <td className="py-6 tracking-widest">{formatPrice(p.price)}</td>
                          <td className="py-6 text-right px-2 flex justify-end gap-6 items-center">
                             <button onClick={() => openEditModal(p)} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] flex items-center gap-1 text-[10px] uppercase tracking-[0.2em]"><Edit size={12}/> Edit</button>
                             <button onClick={() => deleteProduct(p.id || p._id)} className="text-red-900 text-[10px] uppercase tracking-[0.2em] hover:text-red-700">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </main>

          {isClientView && (
            <footer className="border-t border-[#E5E0D8] py-16 mt-auto">
              <div className="max-w-[90rem] mx-auto px-8 flex justify-between items-center">
                <div className="flex flex-col items-center md:items-start shrink-0"><BrandLogo /><span className="text-[8px] uppercase tracking-[0.4em] text-[#1A1A1A]/50 mt-1">Plants & Ceramics</span></div>
                <button onClick={() => setView('admin-login')} className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A]">Staff Portal</button>
              </div>
            </footer>
          )}

          {/* EDIT / ADD MODAL */}
          {showEntryModal && (
            <div className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-[#F7F5F0] p-12 max-w-2xl w-full border border-[#E5E0D8] shadow-2xl relative">
                <button onClick={() => setShowEntryModal(false)} className="absolute top-6 right-6 text-[#1A1A1A]/40 hover:text-[#1A1A1A]"><X size={24} strokeWidth={1} /></button>
                <h2 className="text-4xl font-serif mb-8 border-b border-[#1A1A1A]/10 pb-4">{isEditing ? 'Edit Product.' : 'New Product.'}</h2>
                <form onSubmit={submitEntry} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div><label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">Name</label><input type="text" required value={entryForm.name} onChange={e=>setEntryForm({...entryForm, name: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none focus:border-[#1A1A1A]" /></div>
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">Category</label>
                      <select value={entryForm.category} onChange={e=>setEntryForm({...entryForm, category: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none">
                        {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div><label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">Price (PKR)</label><input type="number" required value={entryForm.price} onChange={e=>setEntryForm({...entryForm, price: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none" /></div>
                    <div><label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">Initial Stock Amount</label><input type="number" required value={entryForm.stockCity} onChange={e=>setEntryForm({...entryForm, stockCity: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none" /></div>
                    <div><label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">Image Emoji/URL</label><input type="text" value={entryForm.image} onChange={e=>setEntryForm({...entryForm, image: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none" /></div>
                  </div>
                  <div><label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">Description</label><textarea required value={entryForm.desc} onChange={e=>setEntryForm({...entryForm, desc: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none h-24" /></div>
                  <button type="submit" className="w-full bg-[#1A1A1A] text-white py-4 text-[10px] uppercase tracking-[0.3em] hover:bg-[#2C3D30] transition-colors mt-8">{isEditing ? 'Save Changes' : 'Add to Ledger'}</button>
                </form>
              </div>
            </div>
          )}

          {/* FEATURE: CSV SAMPLE DOWNLOADER */}
          {showCSVModal && (
            <div className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-[#F7F5F0] p-12 max-w-xl w-full border border-[#E5E0D8] shadow-2xl relative text-center">
                 <button onClick={() => setShowCSVModal(false)} className="absolute top-6 right-6 text-[#1A1A1A]/40 hover:text-[#1A1A1A]"><X size={24} strokeWidth={1} /></button>
                 <h2 className="text-4xl font-serif mb-4">Bulk Import.</h2>
                 <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-8">Upload a CSV file to inject multiple products instantly.</p>
                 
                 <button onClick={downloadSampleCSV} className="flex items-center justify-center gap-2 mx-auto mb-8 text-sm border-b border-[#1A1A1A] pb-1 hover:text-[#2C3D30] transition-colors">
                    <Download size={14} /> Download Sample Format
                 </button>

                 <div className="border-2 border-dashed border-[#1A1A1A]/20 p-12 hover:border-[#1A1A1A] transition-colors relative cursor-pointer bg-white">
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
