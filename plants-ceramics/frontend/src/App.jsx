cat << 'EOF' > /var/www/Plants-Ceramics/plants-ceramics/frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Lock, MoveRight, MapPin, RefreshCw, X, Download, GripVertical, CheckSquare, Edit, SlidersHorizontal, ChevronDown, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [visibleCount, setVisibleCount] = useState(6);
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  
  const [checkoutForm, setCheckoutForm] = useState({ name: '', email: '', phone: '', address: '', mapLink: '', addressType: 'Home', secretCode: '', instructions: '', paymentMethod: 'COD', receipt: null });
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
  
  // UPGRADED ENTRY FORM STATE
  const [entryForm, setEntryForm] = useState({ 
    id: null, name: '', categories: [], price: '', stock: {}, 
    image1: '', image2: '', image3: '', desc: '' 
  });
  
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [draggedCityIdx, setDraggedCityIdx] = useState(null);
  const [showColFilter, setShowColFilter] = useState(false);
  const [visCols, setVisCols] = useState({ image: true, category: true, desc: true, stock: true, price: true });

  useEffect(() => {
    fetch(`${API_BASE}/catalog`).then(res => { if (!res.ok) throw new Error("Offline"); return res.json(); }).then(data => {
      if(data.products) setProducts(data.products);
      if(data.cities && data.cities.length > 0) setCities(data.cities);
      if(data.categories && data.categories.length > 0) setCategories(data.categories);
    }).catch(e => e);
  }, []);

  const fetchOrders = async () => {
    setIsFetchingOrders(true);
    try {
      const res = await fetch(`${API_BASE}/admin/orders`);
      setOrders(await res.json());
      Swal.fire({ icon: 'success', title: 'Synced', text: 'Latest orders fetched!', confirmButtonColor: '#1A1A1A' });
    } catch (err) { Swal.fire({ icon: 'error', title: 'Sync Failed', confirmButtonColor: '#1A1A1A' }); }
    setTimeout(() => setIsFetchingOrders(false), 500); 
  };

  useEffect(() => { if (isAuthenticated && adminTab === 'orders') fetchOrders(); }, [isAuthenticated, adminTab]);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50); window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  const filteredProducts = products.filter(p => {
    const pCats = p.categories?.length ? p.categories : [p.category];
    const matchesCategory = activeCategory === "All" || pCats.includes(activeCategory);
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.shortDesc && p.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

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
      if (availableStock > 0) return [...prev, { ...product, qty: 1 }]; return prev;
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
    if (checkoutForm.paymentMethod === 'TRF' && !checkoutForm.receipt) return Swal.fire({ icon: 'warning', title: 'Receipt Required', confirmButtonColor: '#1A1A1A' });
    const orderNum = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = { orderNumber: orderNum, date: new Date().toLocaleString(), items: [...cart], totalAmount: cartTotal, customer: checkoutForm, city: selectedCity, status: 'Pending' };

    try { 
      const res = await fetch(`${API_BASE}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newOrder) });
      if (res.ok) {
        setProducts(prev => prev.map(p => {
          const cartItem = cart.find(ci => ci._id === p._id || ci.id === p.id);
          if (cartItem) { const uStock = { ...p.stock }; uStock[selectedCity] = Math.max(0, (uStock[selectedCity] || 0) - cartItem.qty); return { ...p, stock: uStock }; }
          return p;
        }));
      }
    } catch (err) {}
    setOrders(prev => [newOrder, ...prev]);

    const emailParams = {
      service_id: 'service_hyfp919', template_id: 'template_nlst9qp', user_id: 'NHbYcpq7qYXu5mtf-', 
      template_params: {
        order_number: orderNum, customer_name: checkoutForm.name, customer_email: checkoutForm.email, phone: checkoutForm.phone, city: selectedCity, address: checkoutForm.address,
        address_type: checkoutForm.addressType, map_link: checkoutForm.mapLink, secret_code: checkoutForm.secretCode, total: formatPrice(cartTotal), items: cart.map(i => `${i.qty}x ${i.name}`).join(', ')
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
      else { Swal.fire({ icon: 'error', title: 'Access Denied', confirmButtonColor: '#1A1A1A' }); }
    } catch (err) { if (username === 'admin' && password === 'Umarali667@') { setIsAuthenticated(true); setView('admin-dashboard'); } }
  };

  const updateOrderStatus = async (id, newStatus) => {
    setOrders(prev => prev.map(o => (o._id === id || o.id === id) ? { ...o, status: newStatus } : o));
    try { await fetch(`${API_BASE}/admin/orders/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) }); } catch(e){}
  };

  const calcOrderStats = () => {
    let stats = { total: { c: 0, w: 0 }, process: { c: 0, w: 0 }, complete: { c: 0, w: 0 } };
    orders.forEach(o => {
      const w = o.totalAmount || 0;
      stats.total.c++; stats.total.w += w;
      if (o.status === 'In Process' || o.status === 'Dispatched') { stats.process.c++; stats.process.w += w; }
      if (o.status === 'Completed') { stats.complete.c++; stats.complete.w += w; }
    });
    return stats;
  };

  const handleDropCity = async (dropIdx) => {
    if (draggedCityIdx === null || draggedCityIdx === dropIdx) return;
    const newCities = [...cities]; const [draggedItem] = newCities.splice(draggedCityIdx, 1);
    newCities.splice(dropIdx, 0, draggedItem); setCities(newCities); setDraggedCityIdx(null);
    try { await fetch(`${API_BASE}/admin/cities/reorder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cities: newCities }) }); } catch(e){}
  };

  const submitNewCity = async (e) => {
    e.preventDefault(); const c = newCityName.trim();
    if (c && !cities.includes(c)) {
      setCities(prev => [...prev, c]);
      try { await fetch(`${API_BASE}/admin/cities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: c }) }); Swal.fire({ icon: 'success', title: 'Region Added', confirmButtonColor: '#1A1A1A' }); } catch (err) {}
    }
    setNewCityName('');
  };
  const deleteCity = async (cityName) => { setCities(prev => prev.filter(c => c !== cityName)); try { await fetch(`${API_BASE}/admin/cities/${cityName}`, { method: 'DELETE' }); } catch (err) {} };

  const submitNewCategory = async (e) => {
    e.preventDefault(); const c = newCategoryName.trim();
    if (c && !categories.includes(c)) {
      setCategories(prev => [...prev, c].sort());
      try { await fetch(`${API_BASE}/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: c }) }); } catch (err) {}
    }
    setNewCategoryName('');
  };
  const deleteCategory = async (catName) => { setCategories(prev => prev.filter(c => c !== catName)); try { await fetch(`${API_BASE}/admin/categories/${catName}`, { method: 'DELETE' }); } catch (err) {} };

  const openEditModal = (product) => {
    setEntryForm({ 
       id: product._id || product.id, name: product.name, 
       categories: product.categories?.length ? product.categories : [product.category].filter(Boolean), 
       price: product.price, stock: product.stock || {}, 
       image1: product.imageUrls?.[0] || '', image2: product.imageUrls?.[1] || '', image3: product.imageUrls?.[2] || '', 
       desc: product.shortDesc || '' 
    });
    setIsEditing(true); setShowEntryModal(true);
  };

  const submitEntry = async (e) => {
    e.preventDefault();
    if (entryForm.categories.length === 0) return Swal.fire({icon: 'warning', title: 'Required', text: 'Select at least one category.', confirmButtonColor: '#1A1A1A'});
    
    const imageUrls = [entryForm.image1, entryForm.image2, entryForm.image3].filter(Boolean);
    if(imageUrls.length === 0) imageUrls.push("🪴");

    const payload = { 
       name: entryForm.name, category: entryForm.categories[0], categories: entryForm.categories, 
       price: Number(entryForm.price) || 0, stock: entryForm.stock, imageUrls, shortDesc: entryForm.desc 
    };
    
    try {
      if (isEditing) {
        const res = await fetch(`${API_BASE}/admin/products/${entryForm.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const updated = await res.json(); setProducts(prev => prev.map(p => (p._id === updated._id || p.id === updated.id) ? updated : p));
        Swal.fire({ icon: 'success', title: 'Updated', confirmButtonColor: '#1A1A1A' });
      } else {
        const res = await fetch(`${API_BASE}/admin/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const saved = await res.json(); setProducts(prev => [saved, ...prev]);
        Swal.fire({ icon: 'success', title: 'Added', confirmButtonColor: '#1A1A1A' });
      }
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error saving' }); }
    setShowEntryModal(false);
  };

  const handleQuickUpdate = async (id, field, value, city=null) => {
    const numVal = Number(value); if (isNaN(numVal)) return;
    setProducts(prev => prev.map(p => {
      if (p._id === id || p.id === id) {
        let updated = { ...p };
        if (field === 'price') updated.price = numVal;
        if (field === 'stock') { updated.stock = { ...updated.stock }; updated.stock[city] = Math.max(0, numVal); }
        fetch(`${API_BASE}/admin/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }).catch(e=>e);
        return updated;
      }
      return p;
    }));
  };

  const deleteProduct = async (id) => { setProducts(prev => prev.filter(p => p.id !== id && p._id !== id)); try { await fetch(`${API_BASE}/admin/products/${id}`, { method: 'DELETE' }); } catch(err) {} };
  const toggleSelectProduct = (id) => { setSelectedProductIds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]); };
  const toggleSelectAll = () => { if (selectedProductIds.length === products.length) setSelectedProductIds([]); else setSelectedProductIds(products.map(p => p._id || p.id)); };
  
  const handleBulkDelete = async () => {
    if(!selectedProductIds.length) return;
    const result = await Swal.fire({ title: 'Are you sure?', text: `Delete ${selectedProductIds.length} items?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#1A1A1A', confirmButtonText: 'Delete' });
    if(result.isConfirmed) {
      setProducts(prev => prev.filter(p => !selectedProductIds.includes(p._id || p.id)));
      try { await fetch(`${API_BASE}/admin/products/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedProductIds }) }); Swal.fire('Deleted!', '', 'success'); } catch(e) {}
      setSelectedProductIds([]);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Image,Category,Price,Description,StockKarachi,StockIslamabad\nMonstera,🪴,Indoor Plant,1500,Beautiful green plant,10,5";
    const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "Sample_Products.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target.result; const rows = text.split('\n').slice(1);
        const parsedProducts = rows.map(row => {
          const cols = row.split(','); if(cols.length < 5) return null;
          return { name: cols[0], imageUrls: [cols[1] || '🪴'], categories: [cols[2]], category: cols[2], price: Number(cols[3]) || 0, shortDesc: cols[4], stock: { "Karachi": Number(cols[5]) || 0, "Islamabad": Number(cols[6]) || 0 } };
        }).filter(Boolean);
        setProducts(prev => [...parsedProducts, ...prev]);
        try { await fetch(`${API_BASE}/admin/products/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products: parsedProducts }) }); Swal.fire({ icon: 'success', title: 'Upload Successful!', confirmButtonColor: '#1A1A1A' }); } catch(err) {}
        setShowCSVModal(false);
      };
      reader.readAsText(file);
    }
  };

  const BrandLogo = () => <img src="/logo.png" alt="Plants & Ceramics" className="h-12 md:h-16 object-contain" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />;
  const isClientView = !view.includes('admin');
  const oStats = calcOrderStats();

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
                  <button onClick={() => setView('cart')} className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-medium hover:text-[#2C3D30]"><span>Bag ({cart.reduce((sum, item) => sum + item.qty, 0)})</span></button>
                </div>
              </div>
            </nav>
          )}

          <main className={isClientView ? "pt-32 pb-24 min-h-[80vh]" : "min-h-screen"}>
            
            {view === 'store' && (
              <div className="animate-in fade-in duration-[1000ms]">
                <div className="max-w-[90rem] mx-auto px-8 md:px-16 mb-16 pt-12">
                  <h1 className="text-5xl md:text-8xl font-serif leading-[1.1] tracking-tight mb-12">Cultivated <br className="hidden md:block"/>for the modern sanctuary.</h1>
                  <div className="relative max-w-md w-full mb-8">
                    <input type="text" placeholder="Search botanicals & ceramics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 pl-8 text-sm focus:outline-none focus:border-[#1A1A1A] font-serif" />
                    <Search size={16} className="absolute left-0 top-0.5 text-[#1A1A1A]/40" />
                  </div>
                  <div className="w-full h-[1px] bg-[#E5E0D8]"></div>
                </div>

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
                        const displayImg = product.imageUrls?.[0] || product.image || "🪴";
                        return (
                        <div key={product.id || product._id} onClick={() => { setSelectedProduct(product); setActiveImageIdx(0); setView('product-detail'); }} className={`group flex flex-col cursor-pointer animate-in fade-in duration-700 ${!inStock && 'opacity-60 grayscale-[50%]'}`}>
                          <div className="w-full aspect-[4/5] bg-[#EBE6E0] mb-6 relative overflow-hidden flex items-center justify-center text-8xl transition-colors duration-700">
                            {displayImg.includes('http') ? <img src={displayImg} alt={product.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[1500ms]" onError={(e) => e.target.src='https://via.placeholder.com/400x500?text=P%26C'} /> : <span className="transform group-hover:scale-110 transition-transform duration-[1500ms]">{displayImg}</span>}
                            {inStock && (
                              <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                                <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="w-full bg-[#1A1A1A]/90 backdrop-blur-sm text-[#F7F5F0] py-4 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-[#2C3D30] flex justify-center items-center gap-3">Add to Order <Plus size={12} strokeWidth={1} /></button>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col px-1">
                            <div className="flex justify-between items-baseline mb-1"><h3 className="font-serif text-2xl text-[#1A1A1A] group-hover:text-[#2C3D30] transition-colors">{product.name}</h3><span className="text-xs tracking-widest text-[#1A1A1A]/80">{formatPrice(product.price)}</span></div>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-[#1A1A1A]/40">{(product.categories?.length ? product.categories : [product.category]).join(', ')}</p>
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
                  
                  {/* MULTI-IMAGE GALLERY */}
                  <div className="w-full md:w-1/2 flex flex-col gap-4">
                     <div className={`w-full aspect-[4/5] bg-[#EBE6E0] flex items-center justify-center text-9xl overflow-hidden ${getCityStock(selectedProduct) === 0 && 'grayscale-[50%] opacity-80'}`}>
                       {(selectedProduct.imageUrls?.[activeImageIdx] || selectedProduct.imageUrls?.[0] || selectedProduct.image || "").includes('http') ? <img src={selectedProduct.imageUrls[activeImageIdx]} alt={selectedProduct.name} className="w-full h-full object-cover" /> : (selectedProduct.imageUrls?.[0] || selectedProduct.image || "🪴")}
                     </div>
                     {selectedProduct.imageUrls?.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto pb-2">
                           {selectedProduct.imageUrls.map((img, i) => (
                              <div key={i} onClick={() => setActiveImageIdx(i)} className={`w-20 h-20 shrink-0 cursor-pointer overflow-hidden border-2 ${activeImageIdx === i ? 'border-[#1A1A1A]' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                                 {img.includes('http') ? <img src={img} className="w-full h-full object-cover" alt="thumb" /> : <div className="w-full h-full bg-[#EBE6E0] flex items-center justify-center text-2xl">{img}</div>}
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  <div className="w-full md:w-1/2 flex flex-col justify-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40 mb-6">{(selectedProduct.categories?.length ? selectedProduct.categories : [selectedProduct.category]).join(', ')}</p>
                    <h1 className="text-5xl lg:text-7xl font-serif leading-[1.1] tracking-tight mb-8">{selectedProduct.name}</h1>
                    <p className="text-2xl font-light tracking-widest text-[#1A1A1A] mb-12 border-b border-[#E5E0D8] pb-12">{formatPrice(selectedProduct.price)}</p>
                    <div className="space-y-6 text-[#1A1A1A]/70 font-light leading-relaxed mb-16 text-sm"><p>{selectedProduct.longDesc || selectedProduct.shortDesc}</p></div>
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
                          <div className="w-32 aspect-[3/4] bg-[#EBE6E0] flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                             {(item.imageUrls?.[0] || item.image || "").includes('http') ? <img src={item.imageUrls[0]} alt={item.name} className="w-full h-full object-cover" /> : (item.imageUrls?.[0] || item.image || "🪴")}
                          </div>
                          <div className="flex-grow flex flex-col justify-center border-b border-[#E5E0D8] pb-4">
                            <h4 className="font-serif text-xl mb-2">{item.name}</h4><p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-4">Qty: {item.qty} | {formatPrice(item.price * item.qty)}</p>
                            <button onClick={() => removeFromCart(item.id || item._id)} className="text-[10px] uppercase tracking-[0.2em] text-red-900 mt-auto flex items-center gap-1 w-fit">Remove</button>
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
                      <input type="text" name="mapLink" placeholder="Google Maps Link (Optional)" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                      <textarea name="instructions" placeholder="Special Instructions for Delivery..." onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none focus:border-[#1A1A1A] mt-4" rows="2"></textarea>
                      
                      <h3 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#E5E0D8] pb-4 mt-12">Payment</h3>
                      <div className="relative w-full">
                         <select name="paymentMethod" onChange={handleCheckoutChange} className="appearance-none w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none focus:border-[#1A1A1A] font-serif rounded-none cursor-pointer">
                           <option value="COD">Cash on Delivery</option>
                           <option value="TRF">Bank Transfer</option>
                         </select>
                         <ChevronDown size={14} className="absolute right-0 top-1 text-[#1A1A1A]/50 pointer-events-none" />
                      </div>

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
                      <div className="flex gap-4 relative">
                        {selectedProductIds.length > 0 && (
                          <button onClick={handleBulkDelete} className="text-[10px] uppercase tracking-[0.2em] bg-red-900 text-white px-6 py-3 hover:bg-red-700 transition-colors hidden md:block">Delete ({selectedProductIds.length})</button>
                        )}
                        <button onClick={() => setShowColFilter(!showColFilter)} className="text-[10px] uppercase tracking-[0.2em] bg-[#EBE6E0] text-[#1A1A1A] px-4 py-3 hover:bg-[#1A1A1A] hover:text-[#F7F5F0] border border-[#1A1A1A]/10 flex items-center gap-2"><SlidersHorizontal size={14}/></button>
                        {showColFilter && (
                           <div className="absolute top-12 right-0 bg-white border border-[#E5E0D8] p-4 shadow-xl z-50 w-48 space-y-3">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 border-b border-[#E5E0D8] pb-2">Toggle Fields</p>
                              {Object.keys(visCols).map(col => (
                                 <label key={col} className="flex items-center gap-3 text-xs capitalize cursor-pointer">
                                    <input type="checkbox" checked={visCols[col]} onChange={() => setVisCols(prev => ({...prev, [col]: !prev[col]}))} className="accent-[#1A1A1A]" /> {col}
                                 </label>
                              ))}
                           </div>
                        )}
                        <button onClick={() => { setIsEditing(false); setEntryForm({ id: null, name: '', categories: [], price: '', stock: {}, image1: '', image2: '', image3: '', desc: '' }); setShowEntryModal(true); }} className="text-[10px] uppercase tracking-[0.2em] bg-[#1A1A1A] text-[#F7F5F0] px-4 md:px-6 py-3 hover:bg-[#2C3D30]">Add <Plus size={12} className="inline"/></button>
                        <button onClick={() => setShowCSVModal(true)} className="text-[10px] uppercase tracking-[0.2em] bg-[#EBE6E0] text-[#1A1A1A] px-4 md:px-6 py-3 hover:bg-[#1A1A1A] hover:text-[#F7F5F0] border border-[#1A1A1A]/10 hidden md:block">Bulk CSV</button>
                      </div>
                    )}
                    <button onClick={() => { setIsAuthenticated(false); setView('store'); }} className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-red-800 ml-4 md:ml-8">Logout</button>
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

                {adminTab === 'cities' && (
                  <div className="max-w-3xl animate-in fade-in">
                    <form onSubmit={submitNewCity} className="mb-12 flex gap-4">
                      <input type="text" placeholder="New Region Name..." value={newCityName} onChange={e => setNewCityName(e.target.value)} className="flex-1 bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none" required/>
                      <button type="submit" className="bg-[#1A1A1A] text-white px-8 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C3D30]">Add Region</button>
                    </form>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-4">Drag and drop to reorder</p>
                    <div className="space-y-4">
                      {cities.map((city, idx) => (
                        <div key={city} draggable onDragStart={() => setDraggedCityIdx(idx)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDropCity(idx)} className="flex justify-between items-center bg-white p-6 border border-[#E5E0D8] shadow-sm cursor-grab active:cursor-grabbing hover:border-[#1A1A1A]/30 transition-colors">
                          <span className="text-lg font-serif flex items-center gap-4"><GripVertical size={16} className="text-[#1A1A1A]/30" /> {city}</span>
                          <button onClick={() => deleteCity(city)} className="text-[10px] uppercase tracking-[0.2em] text-red-900 hover:text-red-700">Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminTab === 'orders' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                       <div className="bg-[#1A1A1A] text-white p-6 border border-[#1A1A1A]/20 shadow-sm">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">Total Orders</p>
                          <p className="text-3xl font-serif mb-1">{oStats.total.c}</p>
                          <p className="text-sm tracking-widest text-white/70">{formatPrice(oStats.total.w)}</p>
                       </div>
                       <div className="bg-white p-6 border border-[#E5E0D8] shadow-sm">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2">In Process</p>
                          <p className="text-3xl font-serif mb-1 text-[#2C3D30]">{oStats.process.c}</p>
                          <p className="text-sm tracking-widest text-[#1A1A1A]/70">{formatPrice(oStats.process.w)}</p>
                       </div>
                       <div className="bg-white p-6 border border-[#E5E0D8] shadow-sm">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2">Completed</p>
                          <p className="text-3xl font-serif mb-1 text-[#1A1A1A]">{oStats.complete.c}</p>
                          <p className="text-sm tracking-widest text-[#1A1A1A]/70">{formatPrice(oStats.complete.w)}</p>
                       </div>
                    </div>

                    <div className="flex justify-between items-center border-b border-[#E5E0D8] pb-4">
                      <h3 className="text-2xl font-serif text-[#1A1A1A]/50">Recent Transactions</h3>
                      <button onClick={fetchOrders} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] bg-[#EBE6E0] hover:bg-[#1A1A1A] hover:text-[#F7F5F0] px-6 py-3 transition-colors">
                        <RefreshCw size={12} className={isFetchingOrders ? "animate-spin" : ""} /> {isFetchingOrders ? 'Syncing...' : 'Fetch Data'}
                      </button>
                    </div>

                    {orders.length === 0 ? ( <p className="text-[#1A1A1A]/40 text-sm tracking-widest text-center py-12">No orders found.</p> ) : (
                      orders.map(order => (
                        <div key={order.orderNumber || order.id} className="bg-white p-8 border border-[#E5E0D8] shadow-sm flex flex-col md:flex-row gap-8">
                          <div className="flex-grow">
                             <div className="flex justify-between items-start mb-6">
                               <h3 className="text-2xl font-serif">{order.orderNumber || order.id} <span className="text-sm tracking-widest text-[#1A1A1A]/50 ml-4">{formatPrice(order.totalAmount || order.total)}</span></h3>
                               <div className="relative w-40">
                                  <select value={order.status || 'Pending'} onChange={(e) => updateOrderStatus(order._id || order.id, e.target.value)} className={`appearance-none w-full bg-transparent border-b pb-2 text-xs uppercase tracking-[0.1em] font-bold focus:outline-none cursor-pointer ${order.status === 'Completed' ? 'text-green-700 border-green-700/20' : order.status === 'Cancelled' ? 'text-red-700 border-red-700/20' : 'text-[#1A1A1A] border-[#1A1A1A]/20'}`}>
                                    <option value="Pending">Pending</option>
                                    <option value="In Process">In Process</option>
                                    <option value="Dispatched">Dispatched</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>
                                  <ChevronDown size={12} className="absolute right-0 top-1 text-[#1A1A1A]/50 pointer-events-none" />
                               </div>
                             </div>
                             
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
                        </div>
                      ))
                    )}
                  </div>
                )}

                {adminTab === 'ledger' && (
                  <div className="overflow-x-auto w-full">
                     <table className="w-full text-left text-sm animate-in fade-in min-w-[800px]">
                       <thead>
                         <tr className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 border-b border-[#E5E0D8]">
                           <th className="pb-6 w-12 text-center cursor-pointer" onClick={toggleSelectAll}><CheckSquare size={14} className={selectedProductIds.length === products.length && products.length > 0 ? "text-[#1A1A1A]" : ""} /></th>
                           {visCols.image && <th className="pb-6 w-16">Visual</th>}
                           <th className="pb-6">Designation</th>
                           {visCols.category && <th className="pb-6">Category</th>}
                           {visCols.desc && <th className="pb-6 w-48">Short Desc</th>}
                           {visCols.stock && cities.map(city => <th key={city} className="pb-6 w-16">{city} Stock</th>)}
                           {visCols.price && <th className="pb-6 w-24">Price (PKR)</th>}
                           <th className="pb-6 text-right">Actions</th>
                         </tr>
                       </thead>
                       <tbody>
                         {products.map(p => {
                            const imgUrl = p.imageUrls?.[0] || p.image || '🪴';
                            return (
                           <tr key={p.id || p._id} className={`border-b border-[#E5E0D8] hover:bg-white transition-colors ${selectedProductIds.includes(p.id || p._id) ? 'bg-gray-50' : ''}`}>
                             <td className="py-4 text-center cursor-pointer" onClick={() => toggleSelectProduct(p.id || p._id)}>
                                <input type="checkbox" checked={selectedProductIds.includes(p.id || p._id)} readOnly className="accent-[#1A1A1A]" />
                             </td>
                             {visCols.image && (
                                <td className="py-4">
                                   <div className="w-10 h-10 bg-[#EBE6E0] overflow-hidden flex items-center justify-center text-xl">
                                      {imgUrl.includes('http') ? <img src={imgUrl} className="w-full h-full object-cover" alt="img" /> : imgUrl}
                                   </div>
                                </td>
                             )}
                             <td className="py-4 font-serif text-lg px-2">{p.name}</td>
                             {visCols.category && <td className="py-4 text-[10px] uppercase tracking-widest text-[#1A1A1A]/50">{(p.categories?.length ? p.categories : [p.category]).join(', ')}</td>}
                             {visCols.desc && <td className="py-4 text-xs text-[#1A1A1A]/70 truncate max-w-[200px]">{p.shortDesc}</td>}
                             
                             {visCols.stock && cities.map(city => (
                               <td key={city} className="py-4">
                                  <input type="number" defaultValue={p.stock?.[city] || 0} onBlur={(e) => handleQuickUpdate(p.id || p._id, 'stock', e.target.value, city)} className="w-12 bg-transparent border-b border-transparent hover:border-[#1A1A1A]/20 focus:border-[#1A1A1A] focus:outline-none py-1" />
                               </td>
                             ))}

                             {visCols.price && (
                                <td className="py-4 tracking-widest">
                                   <input type="number" defaultValue={p.price} onBlur={(e) => handleQuickUpdate(p.id || p._id, 'price', e.target.value)} className="w-20 bg-transparent border-b border-transparent hover:border-[#1A1A1A]/20 focus:border-[#1A1A1A] focus:outline-none py-1" />
                                </td>
                             )}
                             <td className="py-4 text-right px-2 flex justify-end gap-6 items-center">
                                <button onClick={() => openEditModal(p)} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] flex items-center gap-1 text-[10px] uppercase tracking-[0.2em]"><Edit size={12}/> Edit</button>
                                <button onClick={() => deleteProduct(p.id || p._id)} className="text-red-900 text-[10px] uppercase tracking-[0.2em] hover:text-red-700 hidden md:block">Delete</button>
                             </td>
                           </tr>
                         )})}
                       </tbody>
                     </table>
                  </div>
                )}
              </div>
            )}
          </main>

          {isClientView && (
            <footer className="border-t border-[#E5E0D8] py-16 mt-auto">
              <div className="max-w-[90rem] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex flex-col items-center md:items-start shrink-0">
                  <BrandLogo />
                  <span className="text-[8px] uppercase tracking-[0.4em] text-[#1A1A1A]/50 mt-1">Plants & Ceramics</span>
                </div>
                <div className="text-center md:text-right">
                   <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-1">Curated in Karachi, Pakistan.</p>
                   <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40">Developed & Maintained by <a href="https://doubbletech.com" target="_blank" rel="noreferrer" className="text-[#1A1A1A] font-bold hover:underline">DoubbleTech.com</a></p>
                </div>
              </div>
            </footer>
          )}

          {/* MULTI-CATEGORY & LOCATION MODAL */}
          {showEntryModal && (
            <div className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto py-12">
              <div className="bg-[#F7F5F0] p-8 md:p-12 max-w-3xl w-full border border-[#E5E0D8] shadow-2xl relative my-auto">
                <button onClick={() => setShowEntryModal(false)} className="absolute top-6 right-6 text-[#1A1A1A]/40 hover:text-[#1A1A1A]"><X size={24} strokeWidth={1} /></button>
                <h2 className="text-4xl font-serif mb-8 border-b border-[#1A1A1A]/10 pb-4">{isEditing ? 'Edit Product.' : 'New Product.'}</h2>
                <form onSubmit={submitEntry} className="space-y-8">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">Name</label>
                       <input type="text" required value={entryForm.name} onChange={e=>setEntryForm({...entryForm, name: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                    </div>
                    <div>
                       <label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">Price (PKR)</label>
                       <input type="number" required value={entryForm.price} onChange={e=>setEntryForm({...entryForm, price: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none" />
                    </div>
                  </div>

                  <div>
                     <label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-4 block border-b border-[#1A1A1A]/10 pb-2">Categories (Select multiple)</label>
                     <div className="flex flex-wrap gap-4">
                       {categories.filter(c => c !== "All").map(c => (
                         <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                           <input type="checkbox" checked={entryForm.categories.includes(c)} onChange={(e) => {
                             const newCats = e.target.checked ? [...entryForm.categories, c] : entryForm.categories.filter(cat => cat !== c);
                             setEntryForm({...entryForm, categories: newCats});
                           }} className="accent-[#1A1A1A] w-4 h-4" /> {c}
                         </label>
                       ))}
                     </div>
                  </div>

                  <div>
                     <label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-4 block border-b border-[#1A1A1A]/10 pb-2">Location Availability & Stock</label>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       {cities.map(city => (
                         <div key={city}>
                           <label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/70 mb-2 block">{city}</label>
                           <input type="number" min="0" value={entryForm.stock[city] || 0} onChange={e => setEntryForm({...entryForm, stock: {...entryForm.stock, [city]: Number(e.target.value)}})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                         </div>
                       ))}
                     </div>
                     <p className="text-[10px] text-[#1A1A1A]/40 mt-2 italic">* Set stock to 0 to hide this product from a specific city.</p>
                  </div>

                  <div>
                     <label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-4 block border-b border-[#1A1A1A]/10 pb-2">Image Gallery (Links or Emojis)</label>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <input type="text" placeholder="Image URL 1" value={entryForm.image1} onChange={e=>setEntryForm({...entryForm, image1: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                        <input type="text" placeholder="Image URL 2 (Optional)" value={entryForm.image2} onChange={e=>setEntryForm({...entryForm, image2: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                        <input type="text" placeholder="Image URL 3 (Optional)" value={entryForm.image3} onChange={e=>setEntryForm({...entryForm, image3: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                     </div>
                  </div>

                  <div><label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-2 block">Short Description</label><textarea required value={entryForm.desc} onChange={e=>setEntryForm({...entryForm, desc: e.target.value})} className="w-full bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none h-24" /></div>
                  <button type="submit" className="w-full bg-[#1A1A1A] text-white py-4 text-[10px] uppercase tracking-[0.3em] hover:bg-[#2C3D30] transition-colors mt-8">{isEditing ? 'Save Changes' : 'Add to Ledger'}</button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
EOF
