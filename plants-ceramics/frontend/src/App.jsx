import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Lock, MoveRight, MapPin, RefreshCw, X, Download, GripVertical, CheckSquare, Edit, SlidersHorizontal, ChevronDown, Search, Truck, Home, Ticket, UploadCloud, ShoppingBag, Trash2 } from 'lucide-react';

const API_BASE = `/api`;
const formatPrice = (price) => `PKR ${Number(price).toLocaleString()}`;

// NEW: Logistics Delivery Tier Configuration
const DELIVERY_TIERS = {
  T1: { id: 'T1', name: 'Small Plant', base: 150, extended: 250, label: 'Standard Bike (Bag)' },
  T2: { id: 'T2', name: 'Medium Plant', base: 250, extended: 400, label: 'Standard Bike (Crate)' },
  T3: { id: 'T3', name: 'Large Plant', base: 450, extended: 700, label: 'Loaded Bike / Rickshaw' },
  T4: { id: 'T4', name: 'XL Tree', base: 800, extended: 1200, label: 'Rickshaw / Small Van' },
  T5: { id: 'T5', name: 'Bulk Landscaping', base: 1200, extended: 1800, label: 'Suzuki Pickup / Loader' }
};

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
  
  const [trackInput, setTrackInput] = useState("");
  const [trackResult, setTrackResult] = useState(null);

  const [checkoutForm, setCheckoutForm] = useState({ name: '', email: '', phone: '', address: '', mapLink: '', addressType: 'Home', secretCode: '', instructions: '', paymentMethod: 'COD', receipt: null });
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const [distanceType, setDistanceType] = useState('short'); // NEW: Logistics selection

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  
  const [promoBanner, setPromoBanner] = useState(() => {
    const savedBanner = localStorage.getItem('pc_promo_banner');
    return savedBanner ? JSON.parse(savedBanner) : { isActive: false, text: '🎉 FLASH SALE: USE CODE BOTANICAL20 FOR 20% OFF!' };
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminTab, setAdminTab] = useState('orders'); 
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);
  
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);

  const [newCityName, setNewCityName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [adminCoupons, setAdminCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ _id: null, code: '', type: 'percent', value: '', scope: 'all', target: '', startDate: '', endDate: '', maxUses: '' });

  // NEW: Added shippingTier to initialization
  const [entryForm, setEntryForm] = useState({ id: null, name: '', categories: [], price: '', stock: {}, shippingTier: 'T1', image1: '', image2: '', image3: '', shortDesc: '', longDesc: '', careWater: '', careSunlight: '', careClimate: '', careBenefits: '' });
  const [bulkEditForm, setBulkEditForm] = useState({ categories: [], city: '', stock: '' });

  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [draggedCityIdx, setDraggedCityIdx] = useState(null);
  const [draggedCatIdx, setDraggedCatIdx] = useState(null);
  const [showColFilter, setShowColFilter] = useState(false);
  const [visCols, setVisCols] = useState({ image: true, category: true, desc: true, stock: true, price: true });

  const [popup, setPopup] = useState(null);
  const [catSearch, setCatSearch] = useState('');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);

  const showPopup = (type, title, text, autoClose = 0, onConfirm = null) => {
     setPopup({ type, title, text, onConfirm });
     if (autoClose > 0) setTimeout(() => setPopup(null), autoClose);
  };
  const closePopup = () => setPopup(null);

  const navigateTo = (newView) => {
    let basePath = window.location.pathname;
    if (basePath.includes('admin') && newView !== 'admin-login' && newView !== 'admin-dashboard') {
      basePath = '/';
    }
    window.history.pushState({ view: newView }, '', basePath + `?page=${newView}`);
    setView(newView);
  };

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view) setView(event.state.view);
      else setView(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    window.history.replaceState({ view: view }, '', window.location.pathname + `?page=${view}`);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view]);

  const BrandLogo = ({ iconSize = "text-4xl", textSize = "text-3xl" }) => (
    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('store')}>
       <span className={`${iconSize} transition-transform duration-500 group-hover:-rotate-12 inline-block`}>🌿</span>
       <span className={`font-serif font-bold tracking-widest text-[#1A1A1A] ${textSize}`}>P&C.</span>
    </div>
  );

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
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/admin/orders`, { headers: { 'Authorization': `Bearer ${token}` } }); 
      const data = await res.json();
      if(res.ok && Array.isArray(data)) setOrders(data); 
      else setOrders([]);
      
      const cRes = await fetch(`${API_BASE}/admin/coupons`, { headers: { 'Authorization': `Bearer ${token}` } }); 
      if (cRes.ok) setAdminCoupons(await cRes.json());
    } catch (err) { setOrders([]); }
    setTimeout(() => setIsFetchingOrders(false), 500); 
  };

  useEffect(() => { if (isAuthenticated) fetchOrders(); }, [isAuthenticated]);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50); window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const exportMarketingCSV = () => {
     const uniqueEmails = Array.from(new Set(orders.map(o => o.customer?.email).filter(Boolean)));
     if (uniqueEmails.length === 0) return showPopup('warning', 'No Data', 'There are no client records to export.');
     
     let csv = "Sequence,Client Name,Email Address,Phone Number\n";
     uniqueEmails.forEach((email, idx) => {
        const client = orders.find(o => o.customer?.email === email)?.customer;
        if (client) {
           csv += `${idx + 1},"${client.name || ''}","${client.email || ''}","${client.phone || ''}"\n`;
        }
     });

     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
     const link = document.createElement("a");
     const url = URL.createObjectURL(blob);
     link.setAttribute("href", url);
     link.setAttribute("download", `Marketing_Directory_${new Date().toISOString().split('T')[0]}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  // NEW: Updated Cart Logic for Tiered Delivery
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const activeShippingTier = cart.reduce((highest, item) => {
    const currentTier = item.shippingTier || 'T1'; 
    const tierWeights = { T1: 1, T2: 2, T3: 3, T4: 4, T5: 5 };
    return tierWeights[currentTier] > tierWeights[highest] ? currentTier : highest;
  }, 'T1');

  const deliveryCharges = cart.length > 0 
    ? (distanceType === 'short' ? DELIVERY_TIERS[activeShippingTier].base : DELIVERY_TIERS[activeShippingTier].extended)
    : 0;

  let discountAmount = 0;
  if (appliedCoupon) {
     let eligibleTotal = 0;
     if (appliedCoupon.scope === 'category') {
        eligibleTotal = cart.filter(item => item.categories?.includes(appliedCoupon.target) || item.category === appliedCoupon.target).reduce((s, i) => s + (i.price * i.qty), 0);
     } else if (appliedCoupon.scope === 'product') {
        eligibleTotal = cart.filter(item => (item._id || item.id) === appliedCoupon.target).reduce((s, i) => s + (i.price * i.qty), 0);
     } else {
        eligibleTotal = cartTotal;
     }

     if (eligibleTotal > 0) {
        if (appliedCoupon.discountType === 'percent') { discountAmount = eligibleTotal * (appliedCoupon.discountValue / 100); } 
        else { discountAmount = Math.min(appliedCoupon.discountValue, eligibleTotal); }
     }
  }
  const finalTotal = Math.max(0, cartTotal - discountAmount + deliveryCharges);
  
  const filteredProducts = products.filter(p => {
    const pCats = p.categories?.length ? p.categories : [p.category];
    const matchesCategory = activeCategory === "All" || pCats.includes(activeCategory);
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.shortDesc && p.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCityStock = (product, city = selectedCity) => product.stock?.[city] || 0;
  const handleCitySelect = (city) => { setSelectedCity(city); localStorage.setItem('pc_selected_city', city); navigateTo('store'); setCart([]); };
  
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

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if ((item.id === id || item._id === id)) {
         const maxStock = getCityStock(item, selectedCity);
         const newQty = Math.max(1, Math.min(item.qty + delta, maxStock));
         return { ...item, qty: newQty };
      }
      return item;
    }));
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

  const handleImageUpload = async (e, fieldName) => {
     const file = e.target.files[0];
     if(!file) return;
     const reader = new FileReader();
     reader.onloadend = async () => {
        showPopup('loading', 'Uploading to Cloud...', 'Please wait while we secure your image.');
        try {
           const token = localStorage.getItem('adminToken');
           const res = await fetch(`${API_BASE}/admin/upload`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ image: reader.result })
           });
           const data = await res.json();
           if(res.ok) { setEntryForm(prev => ({ ...prev, [fieldName]: data.url })); closePopup(); } else throw new Error();
        } catch(err) { showPopup('error', 'Upload Failed', 'There was an issue reaching the cloud server.'); }
     };
     reader.readAsDataURL(file);
  };

  const applyCoupon = async () => {
     if(!couponCodeInput.trim()) return;
     showPopup('loading', 'Verifying Code...', '');
     try {
       const res = await fetch(`${API_BASE}/verify-coupon`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ code: couponCodeInput }) });
       const data = await res.json();
       
       if(res.ok) {
          let elig = 0;
          if (data.scope === 'category') elig = cart.filter(item => item.categories?.includes(data.target) || item.category === data.target).reduce((s, i) => s + (i.price * i.qty), 0);
          else if (data.scope === 'product') elig = cart.filter(item => (item._id || item.id) === data.target).reduce((s, i) => s + (i.price * i.qty), 0);
          else elig = cartTotal;

          if (elig === 0) {
             showPopup('error', 'Not Eligible', 'This coupon does not apply to the items currently in your cart.');
             setAppliedCoupon(null);
             return;
          }
          setAppliedCoupon(data);
          showPopup('success', 'Coupon Applied', `You received a discount on eligible items!`, 2000);
       } else {
          showPopup('error', 'Invalid Coupon', data.error || 'This code is invalid or expired.');
          setAppliedCoupon(null);
       }
     } catch(e) { showPopup('error', 'Error', 'Failed to verify coupon.'); }
  };

  // NEW: Updated Order Payload
  const submitOrder = async (e) => {
    e.preventDefault();
    if (checkoutForm.phone.replace(/\D/g, '').length < 10) return showPopup('warning', 'Invalid Phone', 'Please provide a valid phone number for shipping updates.');
    if (checkoutForm.paymentMethod === 'TRF' && !checkoutForm.receipt) return showPopup('warning', 'Receipt Required', 'Please upload your bank transfer screenshot.');
    
    const orderNum = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = { 
      orderNumber: orderNum, 
      date: new Date().toLocaleString(), 
      items: [...cart], 
      totalAmount: finalTotal, 
      discount: discountAmount, 
      deliveryCharges: deliveryCharges,      // <-- Applied
      shippingTier: activeShippingTier,      // <-- Applied
      distanceType: distanceType,            // <-- Applied
      couponCode: appliedCoupon?.code || null, 
      customer: checkoutForm, 
      city: selectedCity, 
      status: 'Pending' 
    };

    showPopup('loading', 'Finalizing Order...', 'Securing your botanicals.');
    
    try { 
      const res = await fetch(`${API_BASE}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newOrder) });
      
      if (!res.ok) {
         const errData = await res.json();
         showPopup('error', 'Order Failed', errData.error || 'The system could not secure this order.');
         return; 
      }

      setProducts(prev => prev.map(p => {
         const cartItem = cart.find(ci => ci._id === p._id || ci.id === p.id);
         if (cartItem) { const uStock = { ...p.stock }; uStock[selectedCity] = Math.max(0, (uStock[selectedCity] || 0) - cartItem.qty); return { ...p, stock: uStock }; }
         return p;
      }));
      
      setOrders(prev => [newOrder, ...prev]);

      const emailParams = {
         service_id: 'service_hyfp919', template_id: 'template_nlst9qp', user_id: 'NHbYcpq7qYXu5mtf-', 
         template_params: { 
           order_number: orderNum, customer_name: checkoutForm.name, customer_email: checkoutForm.email, 
           phone: checkoutForm.phone, city: selectedCity, address: checkoutForm.address, address_type: checkoutForm.addressType, 
           map_link: checkoutForm.mapLink, secret_code: checkoutForm.secretCode, total: formatPrice(finalTotal), 
           delivery_charges: formatPrice(deliveryCharges), // <-- Added to email payload
           items: cart.map(i => `${i.qty}x ${i.name}`).join(', ') 
         }
      };
      fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(emailParams) }).catch(e=>e);
      
      const adminEmailParams = {
         service_id: 'service_hyfp919', template_id: 'template_nlst9qp', user_id: 'NHbYcpq7qYXu5mtf-', 
         template_params: { ...emailParams.template_params, customer_email: 'umarali667@gmail.com' }
      };
      fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adminEmailParams) }).catch(e=>e);

      closePopup(); setCurrentOrder(newOrder); setCart([]); setAppliedCoupon(null); 
      setCheckoutForm({ name: '', email: '', phone: '', address: '', mapLink: '', addressType: 'Home', secretCode: '', instructions: '', paymentMethod: 'COD', receipt: null });
      setIsPaymentDropdownOpen(false); navigateTo('order-success');

    } catch (err) {
      showPopup('error', 'Network Error', 'Could not reach the master ledger to process your order.');
    }
  };

  const handleTrackOrder = async () => {
    if (!trackInput.trim()) return;
    showPopup('loading', 'Locating Order...', '');
    try {
      const res = await fetch(`${API_BASE}/track-order/${trackInput}`);
      if (res.ok) { setTrackResult(await res.json()); closePopup(); } else { showPopup('error', 'Not Found', 'Order number not recognized.'); setTrackResult(null); }
    } catch (err) { showPopup('error', 'Error', 'Tracking system offline.'); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (res.ok) { 
          localStorage.setItem('adminToken', data.token);
          setIsAuthenticated(true); 
          navigateTo('admin-dashboard'); 
      } else { 
          showPopup('error', 'Access Denied', 'Invalid credentials.'); 
      }
    } catch (err) { 
        showPopup('error', 'Network Error', 'Could not reach the authentication server.'); 
    }
  };

  const updateOrderStatus = async (id, newStatus) => {
    setOrders(prev => prev.map(o => (o._id === id || o.id === id) ? { ...o, status: newStatus } : o));
    try { await fetch(`${API_BASE}/admin/orders/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, body: JSON.stringify({ status: newStatus }) }); } catch(e){}
  };

  const deleteOrder = async (id) => {
     if (!id) return;
     showPopup('confirm', 'Delete Order?', 'This action cannot be undone.', 0, async () => {
        closePopup(); showPopup('loading', 'Deleting...', '');
        setOrders(prev => prev.filter(o => o._id !== id));
        try { 
           await fetch(`${API_BASE}/admin/orders/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }); 
           showPopup('success', 'Order Deleted', '', 1500); 
        } catch(e) { showPopup('error', 'Error', 'Could not delete order.'); }
     });
  };

  const calcOrderStats = () => {
    let stats = { netRevenue: 0, grossRevenue: 0, totalDiscounts: 0, counts: { Pending: 0, 'In Process': 0, Dispatched: 0, Completed: 0, Cancelled: 0 }, cities: {}, categories: {}, products: {} };
    orders.forEach(o => {
      stats.counts[o.status] = (stats.counts[o.status] || 0) + 1;
      if (o.status !== 'Cancelled') {
         stats.netRevenue += (o.totalAmount || 0);
         stats.totalDiscounts += (o.discount || 0);
         stats.cities[o.city] = (stats.cities[o.city] || 0) + (o.totalAmount || 0);

         o.items?.forEach(item => {
            const lineGross = (item.price || 0) * (item.qty || 1);
            stats.grossRevenue += lineGross;
            stats.products[item.name] = (stats.products[item.name] || 0) + lineGross;
            const cats = item.categories?.length ? item.categories : (item.category ? [item.category] : ['Uncategorized']);
            cats.forEach(c => { stats.categories[c] = (stats.categories[c] || 0) + lineGross; });
         });
      }
    });
    return stats;
  };

  const handleDropCity = async (dropIdx) => {
    if (draggedCityIdx === null || draggedCityIdx === dropIdx) return;
    const newCities = [...cities]; const [draggedItem] = newCities.splice(draggedCityIdx, 1);
    newCities.splice(dropIdx, 0, draggedItem); setCities(newCities); setDraggedCityIdx(null);
    try { await fetch(`${API_BASE}/admin/cities/reorder`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, body: JSON.stringify({ cities: newCities }) }); } catch(e){}
  };

  const handleDropCat = async (dropIdx) => {
    if (draggedCatIdx === null || draggedCatIdx === dropIdx) return;
    const editableCats = categories.filter(c => c !== "All");
    const [draggedItem] = editableCats.splice(draggedCatIdx, 1);
    editableCats.splice(dropIdx, 0, draggedItem); 
    setCategories(["All", ...editableCats]); setDraggedCatIdx(null);
    try { await fetch(`${API_BASE}/admin/categories/reorder`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, body: JSON.stringify({ categories: editableCats }) }); } catch(e){}
  };

  const submitNewCity = async (e) => {
    e.preventDefault(); const c = newCityName.trim();
    if (c && !cities.includes(c)) { setCities(prev => [...prev, c]); try { await fetch(`${API_BASE}/admin/cities`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, body: JSON.stringify({ name: c }) }); showPopup('success', 'Region Added', '', 1500); } catch (err) {} }
    setNewCityName('');
  };
  const deleteCity = async (cityName) => { setCities(prev => prev.filter(c => c !== cityName)); try { await fetch(`${API_BASE}/admin/cities/${cityName}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }); } catch (err) {} };

  const submitNewCategory = async (e) => {
    e.preventDefault(); const c = newCategoryName.trim();
    if (c && !categories.includes(c)) { setCategories(prev => [...prev, c]); try { await fetch(`${API_BASE}/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, body: JSON.stringify({ name: c }) }); showPopup('success', 'Category Added', '', 1500); } catch (err) {} }
    setNewCategoryName('');
  };
  
  const renameCategory = async (oldName) => {
     const newName = window.prompt("Rename Category:", oldName);
     if(newName && newName !== oldName) {
        setCategories(prev => prev.map(c => c === oldName ? newName : c));
        try { await fetch(`${API_BASE}/admin/categories/${oldName}`, { method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}`}, body: JSON.stringify({newName})}); } catch(e){}
     }
  };
  const deleteCategory = async (catName) => { setCategories(prev => prev.filter(c => c !== catName)); try { await fetch(`${API_BASE}/admin/categories/${catName}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }); } catch (err) {} };

  const submitNewCoupon = async (e) => {
     e.preventDefault();
     if (!newCoupon.startDate || !newCoupon.endDate) return showPopup('warning', 'Dates Required', 'Please set a valid start and end date for this coupon.');
     if (newCoupon.scope !== 'all' && !newCoupon.target) return showPopup('warning', 'Target Required', 'Please select a specific category or product.');
     
     showPopup('loading', 'Generating...', '');
     try {
        const payload = { 
           code: newCoupon.code, discountType: newCoupon.type, discountValue: Number(newCoupon.value), 
           scope: newCoupon.scope, target: newCoupon.target, startDate: newCoupon.startDate, endDate: newCoupon.endDate, maxUses: Number(newCoupon.maxUses) || 0 
        };
        const token = localStorage.getItem('adminToken');
        let res;
        if (newCoupon._id) { res = await fetch(`${API_BASE}/admin/coupons/${newCoupon._id}`, { method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(payload) }); } 
        else { res = await fetch(`${API_BASE}/admin/coupons`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(payload) }); }

        if(res.ok) { 
           const newC = await res.json();
           if (newCoupon._id) setAdminCoupons(prev => prev.map(c => c._id === newC._id ? newC : c));
           else setAdminCoupons(prev => [newC, ...prev]); 
           
           setNewCoupon({ _id: null, code: '', type: 'percent', value: '', scope: 'all', target: '', startDate: '', endDate: '', maxUses: '' }); 
           showPopup('success', 'Coupon Active', `The code has been securely injected.`, 2000); 
        }
     } catch(e){}
  };

  const loadCouponForEdit = (coupon) => {
     setNewCoupon({ _id: coupon._id, code: coupon.code, type: coupon.discountType, value: coupon.discountValue, scope: coupon.scope, target: coupon.target, startDate: new Date(coupon.startDate).toISOString().slice(0, 16), endDate: new Date(coupon.endDate).toISOString().slice(0, 16), maxUses: coupon.maxUses || '' });
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteCoupon = async (id) => { setAdminCoupons(prev => prev.filter(c => c._id !== id)); await fetch(`${API_BASE}/admin/coupons/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }); };

  // NEW: Added shippingTier to product mapping
  const openEditModal = (product) => {
    setEntryForm({ 
       id: product._id || product.id, name: product.name, 
       categories: product.categories?.length ? product.categories : [product.category].filter(Boolean), 
       price: product.price, stock: product.stock || {}, 
       shippingTier: product.shippingTier || 'T1',
       image1: product.imageUrls?.[0] || '', image2: product.imageUrls?.[1] || '', image3: product.imageUrls?.[2] || '', 
       shortDesc: product.shortDesc || '', longDesc: product.longDesc || '',
       careWater: product.careWater || '', careSunlight: product.careSunlight || '', careClimate: product.careClimate || '', careBenefits: product.careBenefits || ''
    });
    setCatSearch(''); setIsEditing(true); setShowEntryModal(true);
  };

  const submitEntry = async (e) => {
    e.preventDefault();
    if (entryForm.categories.length === 0) return showPopup('warning', 'Category Required', 'Please select at least one category.');
    
    showPopup('loading', 'Saving Data...', '');
    const imageUrls = [entryForm.image1, entryForm.image2, entryForm.image3].filter(Boolean);
    if(imageUrls.length === 0) imageUrls.push("🪴");
    
    // NEW: Added shippingTier to payload
    const payload = { 
       name: entryForm.name, category: entryForm.categories[0], categories: entryForm.categories, price: Number(entryForm.price) || 0, stock: entryForm.stock, imageUrls, 
       shippingTier: entryForm.shippingTier, shortDesc: entryForm.shortDesc, longDesc: entryForm.longDesc,
       careWater: entryForm.careWater, careSunlight: entryForm.careSunlight, careClimate: entryForm.careClimate, careBenefits: entryForm.careBenefits
    };
    
    try {
      const token = localStorage.getItem('adminToken');
      if (isEditing) {
        const res = await fetch(`${API_BASE}/admin/products/${entryForm.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
        const updated = await res.json(); setProducts(prev => prev.map(p => (p._id === updated._id || p.id === updated.id) ? updated : p));
        showPopup('success', 'Updated Successfully', '', 1500);
      } else {
        const res = await fetch(`${API_BASE}/admin/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
        const saved = await res.json(); setProducts(prev => [saved, ...prev]);
        showPopup('success', 'Added to Ledger', '', 1500);
      }
    } catch (err) { showPopup('error', 'Error', 'Failed to save product.'); }
    setShowEntryModal(false);
  };

  const submitBulkEdit = async (e) => {
     e.preventDefault();
     showPopup('loading', 'Processing Bulk Update...', 'Updating the master ledger.');
     const updatedProducts = [];
     const token = localStorage.getItem('adminToken');
     for (let id of selectedProductIds) {
        const product = products.find(p => (p._id === id || p.id === id));
        if (!product) continue;
        let updatedStock = { ...product.stock };
        if (bulkEditForm.city && bulkEditForm.stock !== '') updatedStock[bulkEditForm.city] = Number(bulkEditForm.stock);
        let updatedCategories = bulkEditForm.categories.length > 0 ? bulkEditForm.categories : (product.categories?.length ? product.categories : [product.category]);
        let primaryCategory = updatedCategories[0];

        const payload = { ...product, category: primaryCategory, categories: updatedCategories, stock: updatedStock };
        try {
           const res = await fetch(`${API_BASE}/admin/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
           const data = await res.json(); updatedProducts.push(data);
        } catch(err) {}
     }
     setProducts(prev => prev.map(p => {
        const updated = updatedProducts.find(up => (up._id === p._id || up.id === p.id));
        return updated ? updated : p;
     }));
     setSelectedProductIds([]); setShowBulkEditModal(false); setBulkEditForm({ categories: [], city: '', stock: '' });
     showPopup('success', 'Update Complete', 'All selected items have been synchronized.', 2000);
  };

  const handleBulkDelete = () => {
    if(!selectedProductIds.length) return;
    showPopup('confirm', 'Confirm Deletion', `You are about to permanently delete ${selectedProductIds.length} items from the ledger.`, 0, async () => {
      closePopup(); showPopup('loading', 'Deleting Records...', '');
      setProducts(prev => prev.filter(p => !selectedProductIds.includes(p._id || p.id)));
      try { 
         await fetch(`${API_BASE}/admin/products/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, body: JSON.stringify({ ids: selectedProductIds }) }); 
         showPopup('success', 'Items Purged', '', 1500);
      } catch(e) { showPopup('error', 'Error', 'Failed to delete items.'); }
      setSelectedProductIds([]);
    });
  };

  const toggleSelectProduct = (id) => { setSelectedProductIds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]); };
  const toggleSelectAll = () => { if (selectedProductIds.length === products.length) setSelectedProductIds([]); else setSelectedProductIds(products.map(p => p._id || p.id)); };

  // NEW: Appended ShippingTier to CSV headers and sample data
  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,ImageURL1,ImageURL2,ImageURL3,Category,Price,ShortDescription,LongDescription,StockKarachi,StockIslamabad,CareWater,CareSunlight,CareClimate,CareBenefits,ShippingTier\nMonstera,https://via.placeholder.com/400x500,,,Indoor Plant,1500,Beautiful green plant,\"A highly detailed description of the Monstera plant.\",10,5,Water weekly,Bright indirect,18-24C,Air purifying,T2";
    const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "Sample_Products.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // NEW: Parse shippingTier from col[14]
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        showPopup('loading', 'Importing Ledger...', 'Parsing CSV data.');
        const text = event.target.result; const rows = text.split('\n').slice(1).filter(r => r.trim());
        const parseRow = (str) => {
          let res = [], curr = '', inQ = false;
          for(let i=0; i<str.length; i++) {
            if(str[i]==='"') inQ = !inQ;
            else if(str[i]===',' && !inQ) { res.push(curr.trim()); curr = ''; }
            else curr += str[i];
          }
          res.push(curr.trim()); return res;
        };
        const parsedProducts = rows.map(row => {
          const cols = parseRow(row); if(cols.length < 10) return null;
          const imgs = [cols[1], cols[2], cols[3]].filter(Boolean);
          return { 
             name: cols[0], imageUrls: imgs.length ? imgs : ['🪴'], categories: [cols[4]], category: cols[4], 
             price: Number(cols[5]) || 0, shortDesc: cols[6], longDesc: cols[7], 
             stock: { "Karachi": Number(cols[8]) || 0, "Islamabad": Number(cols[9]) || 0 },
             careWater: cols[10] || '', careSunlight: cols[11] || '', careClimate: cols[12] || '', careBenefits: cols[13] || '',
             shippingTier: cols[14] || 'T1'
          };
        }).filter(Boolean);
        setProducts(prev => [...parsedProducts, ...prev]);
        try { 
           await fetch(`${API_BASE}/admin/products/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, body: JSON.stringify({ products: parsedProducts }) }); 
           setShowCSVModal(false); showPopup('success', 'Import Successful', `${parsedProducts.length} items added to the ledger.`, 2000);
        } catch(err) { showPopup('error', 'Import Failed', 'There was an error communicating with the database.'); }
      };
      reader.readAsText(file);
    }
  };

  const getCareGuide = (product) => {
     if (!product) return { water: '', sun: '', climate: '', benefits: '' };
     let water = product.careWater || ''; let sun = product.careSunlight || ''; let climate = product.careClimate || ''; let benefits = product.careBenefits || '';
     if (!water && !sun && !climate && !benefits) {
        const cats = product.categories?.length ? product.categories.join(' ').toLowerCase() : (product.category || '').toLowerCase();
        if (cats.includes('indoor')) { water = 'Water every 1-2 weeks. Allow top soil to dry.'; sun = 'Bright, indirect light. Avoid harsh direct sun.'; climate = 'Stable room temperatures (18°C - 24°C).'; benefits = 'Air purifying, reduces stress, enhances decor.'; } 
        else if (cats.includes('outdoor') || cats.includes('fruit') || cats.includes('vegetable')) { water = 'Deep watering 2-3 times a week.'; sun = 'Full, direct sunlight for 6-8 hours.'; climate = 'Adapts to seasonal outdoor changes.'; benefits = 'Yields produce, enhances landscape.'; } 
        else if (cats.includes('ceramic') || cats.includes('pot') || cats.includes('pebbles')) { water = 'Ensure proper drainage if planting.'; sun = 'Fade-resistant in normal light.'; climate = 'Protect from extreme freezing.'; benefits = 'Durable aesthetic enhancement.'; } 
        else { water = 'Monitor carefully. Adjust to humidity.'; sun = 'Highly adaptable placement.'; climate = 'Avoid extreme micro-climates.'; benefits = 'Brings natural beauty to your space.'; }
     }
     return { water, sun, climate, benefits };
  };

  const isClientView = !view.includes('admin');
  const aStats = calcOrderStats();
  const nowTime = new Date();
  const activeCoupons = adminCoupons.filter(c => new Date(c.endDate) >= nowTime && (c.maxUses === 0 || c.usedCount < c.maxUses));
  const expiredCoupons = adminCoupons.filter(c => new Date(c.endDate) < nowTime || (c.maxUses > 0 && c.usedCount >= c.maxUses));
  const filteredModalCats = categories.filter(c => c !== "All" && c.toLowerCase().includes(catSearch.toLowerCase()) && !entryForm.categories.includes(c));

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#1A1A1A]">
      
      {/* POPUP ENGINE */}
      {popup && (
        <div className="fixed inset-0 z-[100] bg-[#1A1A1A]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-[#F7F5F0] p-12 max-w-sm w-full border border-[#E5E0D8] shadow-2xl flex flex-col items-center text-center transform scale-100 animate-in zoom-in-95 duration-500">
              {popup.type === 'loading' ? ( <div className="text-6xl mb-8 animate-pulse">🌿</div> ) : ( <div className="text-5xl mb-8 opacity-50">🌿</div> )}
              <h3 className={`font-serif text-3xl mb-4 ${popup.type === 'error' ? 'text-red-900' : 'text-[#1A1A1A]'}`}>{popup.title}</h3>
              {popup.text && <p className="text-[10px] uppercase tracking-[0.2em] leading-loose text-[#1A1A1A]/60 mb-10">{popup.text}</p>}
              {popup.type === 'confirm' ? (
                 <div className="flex gap-4 w-full mt-2">
                    <button onClick={closePopup} className="flex-1 border border-[#1A1A1A] text-[#1A1A1A] py-4 text-[10px] uppercase tracking-[0.2em] hover:bg-[#EBE6E0] transition-colors">Cancel</button>
                    <button onClick={popup.onConfirm} className="flex-1 bg-red-900 text-white py-4 text-[10px] uppercase tracking-[0.2em] hover:bg-red-800 transition-colors">Confirm</button>
                 </div>
              ) : popup.type !== 'loading' ? (
                 <button onClick={closePopup} className="w-full bg-[#1A1A1A] text-white py-4 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C3D30] transition-colors mt-2">Acknowledge</button>
              ) : null}
           </div>
        </div>
      )}

      {/* ANNOUNCEMENT BANNER */}
      {isClientView && promoBanner.isActive && (
         <div className="fixed top-0 left-0 w-full z-[60] bg-[#1A1A1A] text-[#F7F5F0] text-[9px] uppercase tracking-[0.3em] text-center py-2.5 font-bold flex justify-center items-center gap-4">
            <span>{promoBanner.text}</span>
         </div>
      )}

      {/* FLOATING CART ICON */}
      {cart.length > 0 && isClientView && view !== 'cart' && view !== 'checkout' && view !== 'order-success' && (
        <button onClick={() => navigateTo('cart')} className="fixed bottom-8 right-8 z-50 bg-[#2C3D30] text-[#F7F5F0] p-4 rounded-full shadow-[0_10px_40px_rgba(44,61,48,0.4)] hover:scale-110 transition-transform duration-300 flex items-center justify-center group animate-in fade-in">
          <div className="relative">
            <ShoppingBag size={28} strokeWidth={1.5} />
            <span className="absolute -top-2 -right-3 bg-[#1A1A1A] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-[#F7F5F0]">
              {cart.reduce((sum, item) => sum + item.qty, 0)}
            </span>
          </div>
        </button>
      )}

      {view === 'city-select' && (
        <div className="min-h-screen flex flex-col items-center justify-center animate-in fade-in duration-[1500ms] p-8">
          <div className="text-center max-w-xl w-full">
            <div className="flex justify-center mb-8"><BrandLogo iconSize="text-5xl md:text-6xl" textSize="text-4xl md:text-5xl" /></div>
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
            <nav className={`fixed w-full z-40 transition-all duration-700 ${promoBanner.isActive ? 'top-9' : 'top-0'} ${isScrolled ? 'bg-[#F7F5F0]/90 backdrop-blur-md py-4 shadow-sm' : 'bg-transparent py-8'}`}>
              <div className="max-w-[90rem] mx-auto px-8 md:px-16 flex justify-between items-center">
                <div className="flex gap-8 items-center text-[10px] uppercase tracking-[0.2em] font-medium text-[#1A1A1A]/60">
                  <button onClick={() => navigateTo('store')} className="hover:text-[#1A1A1A] flex items-center gap-1"><Home size={14}/> <span className="hidden md:inline">Home</span></button>
                  {selectedCity && <button onClick={() => navigateTo('track-order')} className="hover:text-[#1A1A1A] flex items-center gap-1"><Truck size={14}/> Track</button>}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2"><BrandLogo iconSize="text-2xl md:text-3xl" textSize="text-xl md:text-2xl" /></div>
                <div className="flex items-center gap-8">
                  {selectedCity && <button onClick={() => navigateTo('city-select')} className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A]"><MapPin size={10} /> {selectedCity}</button>}
                  <button onClick={() => navigateTo('cart')} className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-medium hover:text-[#2C3D30]"><span>Bag ({cart.reduce((sum, item) => sum + item.qty, 0)})</span></button>
                </div>
              </div>
            </nav>
          )}

          <main className={isClientView ? `pb-24 min-h-[80vh] ${promoBanner.isActive ? 'pt-40' : 'pt-32'}` : "min-h-screen"}>
            
            {view === 'track-order' && (
              <div className="min-h-[60vh] flex flex-col items-center justify-center px-8 animate-in fade-in">
                 <div className="text-center max-w-xl w-full">
                    <h2 className="text-5xl font-serif mb-6">Track Your Order.</h2>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-12">Enter your ORD-XXXXXX reference number</p>
                    <div className="flex gap-4 w-full mb-12">
                       <input type="text" placeholder="e.g., ORD-123456" value={trackInput} onChange={e=>setTrackInput(e.target.value)} className="flex-1 bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none focus:border-[#1A1A1A] font-mono tracking-wider" />
                       <button onClick={handleTrackOrder} className="bg-[#1A1A1A] text-white px-8 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C3D30] transition-colors">Search</button>
                    </div>
                    {trackResult && (
                      <div className="bg-white p-10 border border-[#E5E0D8] shadow-sm text-left animate-in fade-in">
                         <div className="flex justify-between items-baseline border-b border-[#E5E0D8] pb-6 mb-6">
                            <h3 className="text-2xl font-serif text-[#1A1A1A]">Order Status</h3>
                            <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 ${trackResult.status === 'Completed' ? 'bg-green-100 text-green-800' : trackResult.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{trackResult.status}</span>
                         </div>
                         <div className="space-y-4 text-sm text-[#1A1A1A]/80">
                            <p><strong>Customer:</strong> {trackResult.customerName}</p>
                            <p><strong>Order Number:</strong> <span className="font-mono">{trackResult.orderNumber}</span></p>
                            <div className="bg-[#F7F5F0] p-4 mt-6">
                               <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-1">Estimated Delivery Time</p>
                               <p className="text-lg font-serif">
                                  {trackResult.status === 'Pending' || trackResult.status === 'In Process' ? '3 to 6 Working Days' :
                                   trackResult.status === 'Dispatched' ? '1 to 2 Working Days' :
                                   trackResult.status === 'Completed' ? 'Delivered' : 'N/A'}
                               </p>
                            </div>
                         </div>
                      </div>
                    )}
                 </div>
              </div>
            )}

            {view === 'store' && (
              <div className="animate-in fade-in duration-[1000ms]">
                <div className="max-w-[90rem] mx-auto px-8 md:px-16 mb-16 pt-12">
                  <h1 className="text-5xl md:text-8xl font-serif leading-[1.1] tracking-tight mb-12">Cultivated <br className="hidden md:block"/>for the modern sanctuary.</h1>
                  <div className="flex justify-center w-full mb-12">
                     <div className="relative max-w-2xl w-full">
                       <input type="text" placeholder="Search botanicals & ceramics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-4 pl-10 text-lg focus:outline-none focus:border-[#1A1A1A] font-serif" />
                       <Search size={20} className="absolute left-0 top-1 text-[#1A1A1A]/40" />
                     </div>
                  </div>
                  <div className="w-full h-[1px] bg-[#E5E0D8]"></div>
                </div>

                <div className="max-w-[90rem] mx-auto px-8 md:px-16 flex flex-col lg:flex-row gap-16 xl:gap-32">
                  <aside className="w-full lg:w-48 shrink-0">
                    <div className="lg:sticky lg:top-32">
                      <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40 mb-8 border-b border-[#E5E0D8] pb-4">Menu</h3>
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
                        <div key={product.id || product._id} onClick={() => { setSelectedProduct(product); setActiveImageIdx(0); navigateTo('product-detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`group flex flex-col cursor-pointer animate-in fade-in duration-700 ${!inStock && 'opacity-60 grayscale-[50%]'}`}>
                          <div className="w-full aspect-[4/5] bg-[#EBE6E0] mb-6 relative overflow-hidden flex items-center justify-center text-8xl transition-colors duration-700">
                            {displayImg.includes('http') ? <img src={displayImg} alt={product.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[1500ms]" /> : <span className="transform group-hover:scale-110 transition-transform duration-[1500ms]">{displayImg}</span>}
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
              <div className="max-w-[90rem] mx-auto px-8 md:px-16 animate-in fade-in pb-16">
                <button onClick={() => navigateTo('store')} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/60 hover:text-[#1A1A1A] mb-12 border-b border-transparent hover:border-[#1A1A1A] pb-1 w-fit"><ArrowLeft size={12} strokeWidth={1} /> Back</button>
                
                <div className="flex flex-col md:flex-row gap-16 lg:gap-32 mb-24">
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
                    <div className="flex flex-wrap gap-3 mb-6">
                      {(selectedProduct.categories?.length ? selectedProduct.categories : [selectedProduct.category]).map((c, i) => (
                         <button key={i} onClick={() => { setActiveCategory(c); navigateTo('store'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40 hover:text-[#1A1A1A] border-b border-transparent hover:border-[#1A1A1A] transition-colors pb-1">
                            {c}
                         </button>
                      ))}
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-serif leading-[1.1] tracking-tight mb-8">{selectedProduct.name}</h1>
                    <p className="text-2xl font-light tracking-widest text-[#1A1A1A] mb-12 border-b border-[#E5E0D8] pb-12">{formatPrice(selectedProduct.price)}</p>
                    
                    <div className="space-y-6 text-[#1A1A1A]/70 font-light leading-relaxed mb-16 text-sm">
                       {selectedProduct.shortDesc && <p className="font-bold">{selectedProduct.shortDesc}</p>}
                       {selectedProduct.longDesc && <p className="whitespace-pre-wrap">{selectedProduct.longDesc}</p>}
                    </div>

                    {getCityStock(selectedProduct) > 0 ? (
                      <button onClick={() => { addToCart(selectedProduct); navigateTo('cart'); }} className="w-full bg-[#1A1A1A] hover:bg-[#2C3D30] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-6 flex items-center justify-center gap-3 transition-colors">Add to Order <MoveRight size={14} strokeWidth={1} /></button>
                    ) : ( <button disabled className="w-full bg-[#E5E0D8] text-[#1A1A1A]/50 text-[10px] uppercase tracking-[0.3em] py-6 cursor-not-allowed">Unavailable in {selectedCity}</button>)}
                  </div>
                </div>

                <div className="w-full border-t border-[#1A1A1A] pt-16 animate-in slide-in-from-bottom-4 duration-700">
                   <h3 className="text-4xl font-serif mb-12 text-[#1A1A1A] text-center md:text-left">{selectedProduct.name} <span className="opacity-40 italic">— Botanical Intelligence</span></h3>
                   <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                         <thead>
                            <tr className="border-y border-[#1A1A1A]/20">
                               <th className="py-6 px-4 text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 w-1/4"><span className="text-lg mr-2 align-middle">💧</span> Water Protocol</th>
                               <th className="py-6 px-4 text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 w-1/4 border-l border-[#1A1A1A]/10"><span className="text-lg mr-2 align-middle">☀️</span> Sunlight Required</th>
                               <th className="py-6 px-4 text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 w-1/4 border-l border-[#1A1A1A]/10"><span className="text-lg mr-2 align-middle">🌡️</span> Climate</th>
                               <th className="py-6 px-4 text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 w-1/4 border-l border-[#1A1A1A]/10"><span className="text-lg mr-2 align-middle">✨</span> Benefits</th>
                            </tr>
                         </thead>
                         <tbody>
                            <tr>
                               <td className="py-8 px-4 text-sm leading-loose text-[#1A1A1A]/80 align-top pr-8">{getCareGuide(selectedProduct).water}</td>
                               <td className="py-8 px-4 text-sm leading-loose text-[#1A1A1A]/80 align-top border-l border-[#1A1A1A]/10 pr-8">{getCareGuide(selectedProduct).sun}</td>
                               <td className="py-8 px-4 text-sm leading-loose text-[#1A1A1A]/80 align-top border-l border-[#1A1A1A]/10 pr-8">{getCareGuide(selectedProduct).climate}</td>
                               <td className="py-8 px-4 text-sm leading-loose text-[#1A1A1A]/80 align-top border-l border-[#1A1A1A]/10 pr-8">{getCareGuide(selectedProduct).benefits}</td>
                            </tr>
                         </tbody>
                      </table>
                   </div>
                </div>
              </div>
            )}

            {view === 'cart' && (
              <div className="max-w-5xl mx-auto px-8 md:px-16 animate-in fade-in">
                <div className="mb-16 border-b border-[#1A1A1A] pb-8 flex justify-between items-end"><h2 className="text-5xl font-serif mb-4">Your Order</h2><button onClick={() => navigateTo('store')} className="text-[10px] uppercase tracking-[0.2em] hover:opacity-50">Return</button></div>
                {cart.length === 0 ? (
                  <p className="text-2xl font-serif text-[#1A1A1A]/40 mb-8 text-center py-32">Your bag contains no items.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-7 space-y-8">
                      {cart.map(item => (
                        <div key={item.id || item._id} className="flex gap-8 group">
                          <div className="w-32 aspect-[3/4] bg-[#EBE6E0] flex items-center justify-center text-4xl shrink-0 overflow-hidden cursor-pointer" onClick={() => { setSelectedProduct(item); setActiveImageIdx(0); navigateTo('product-detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                             {(item.imageUrls?.[0] || item.image || "").includes('http') ? <img src={item.imageUrls[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : (item.imageUrls?.[0] || item.image || "🪴")}
                          </div>
                          <div className="flex-grow flex flex-col justify-center border-b border-[#E5E0D8] pb-4">
                            <h4 className="font-serif text-xl mb-2 cursor-pointer hover:text-[#2C3D30] hover:underline w-fit" onClick={() => { setSelectedProduct(item); setActiveImageIdx(0); navigateTo('product-detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{item.name}</h4>
                            <div className="flex items-center gap-6 mb-4">
                               <div className="flex items-center border border-[#1A1A1A]/20 rounded-sm overflow-hidden">
                                  <button onClick={() => updateCartQty(item.id || item._id, -1)} className="px-3 py-1 bg-white hover:bg-[#EBE6E0] transition-colors text-[#1A1A1A]/60 hover:text-[#1A1A1A] font-bold">-</button>
                                  <span className="px-3 py-1 bg-white text-xs font-bold text-center w-8">{item.qty}</span>
                                  <button onClick={() => updateCartQty(item.id || item._id, 1)} className="px-3 py-1 bg-white hover:bg-[#EBE6E0] transition-colors text-[#1A1A1A]/60 hover:text-[#1A1A1A] font-bold">+</button>
                               </div>
                               <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50">{formatPrice(item.price * item.qty)}</p>
                            </div>
                            <button onClick={() => removeFromCart(item.id || item._id)} className="text-[10px] uppercase tracking-[0.2em] text-red-900 mt-auto flex items-center gap-1 w-fit">Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="lg:col-span-5">
                      <div className="bg-[#EBE6E0] p-10 h-fit">
                        
                        <div className="mb-8 pb-8 border-b border-[#1A1A1A]/10">
                           <p className="text-[10px] uppercase tracking-[0.3em] mb-4">Promo Code</p>
                           <div className="flex gap-2">
                             <input type="text" placeholder="Enter code" value={couponCodeInput} onChange={e=>setCouponCodeInput(e.target.value)} className="flex-1 bg-white border border-transparent focus:border-[#1A1A1A] px-4 py-2 text-sm outline-none uppercase font-mono" />
                             <button onClick={applyCoupon} className="bg-[#1A1A1A] text-white px-4 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C3D30]">Apply</button>
                           </div>
                        </div>

                        {/* NEW: Shipping Integration in Cart */}
                        <div className="space-y-4 mb-12">
                           <div className="flex justify-between items-end"><span className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60">Subtotal</span><span className="text-lg font-serif">{formatPrice(cartTotal)}</span></div>
                           
                           <div className="flex justify-between items-end text-[#1A1A1A]/80">
                              <span className="text-[10px] uppercase tracking-[0.3em] flex flex-col">
                                 <span>Delivery Fee</span>
                                 <span className="text-[8px] opacity-60 mt-0.5">Fleet: {DELIVERY_TIERS[activeShippingTier].name}</span>
                              </span>
                              <span className="text-sm font-serif">{deliveryCharges > 0 ? formatPrice(deliveryCharges) : 'Calculated'}</span>
                           </div>

                           {appliedCoupon && (
                             <div className="flex justify-between items-end text-green-800">
                               <span className="text-[10px] uppercase tracking-[0.3em] flex flex-col gap-1">
                                  <span className="flex items-center gap-1"><Ticket size={12}/> {appliedCoupon.code}</span>
                                  <span className="text-[9px] font-bold text-green-900 mt-1">
                                     {appliedCoupon.discountType === 'percent' ? `${appliedCoupon.discountValue}% OFF` : `FLAT ${formatPrice(appliedCoupon.discountValue)} OFF`}
                                  </span>
                               </span>
                               <span className="text-lg font-serif">- {formatPrice(discountAmount)}</span>
                             </div>
                           )}

                           <div className="flex justify-between items-end pt-4 border-t border-[#1A1A1A]/20"><span className="text-[10px] uppercase tracking-[0.3em]">Total</span><span className="text-3xl font-serif">{formatPrice(finalTotal)}</span></div>
                        </div>
                        <button onClick={() => navigateTo('checkout')} className="w-full bg-[#1A1A1A] hover:bg-[#2C3D30] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-5 flex justify-center items-center gap-3">Finalize Order <MoveRight size={14} /></button>
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
                        <input type="text" name="name" required placeholder="Full Name *" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                        <input type="email" name="email" required placeholder="Email *" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <input type="tel" name="phone" required placeholder="Phone *" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                        <input type="text" name="secretCode" placeholder="Secret Rider Code (Optional)" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                      </div>
                      
                      <h3 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#E5E0D8] pb-4 mt-12">Delivery Details</h3>
                      <div className="flex gap-8 mb-4">
                         <label className="text-sm flex items-center gap-2"><input type="radio" name="addressType" value="Home" defaultChecked onChange={handleCheckoutChange} className="accent-[#1A1A1A]" /> Home</label>
                         <label className="text-sm flex items-center gap-2"><input type="radio" name="addressType" value="Office" onChange={handleCheckoutChange} className="accent-[#1A1A1A]" /> Office</label>
                      </div>
                      <input type="text" name="address" required placeholder="Complete Delivery Address *" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                      <input type="text" name="mapLink" placeholder="Google Maps Link (Optional)" onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                      <textarea name="instructions" placeholder="Special Instructions for Delivery..." onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A] mt-4" rows="2"></textarea>
                      
                      {/* NEW: Logistics Distance Tracker UI */}
                      <h3 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#E5E0D8] pb-4 mt-12">Rider Logistics Zone</h3>
                      <p className="text-[11px] text-[#1A1A1A]/50 mb-4 font-sans uppercase tracking-wider">Select relative radius distance from our regional distribution hub:</p>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <button type="button" onClick={() => setDistanceType('short')} className={`p-4 border text-left transition-all flex flex-col justify-between ${distanceType === 'short' ? 'border-[#1A1A1A] bg-[#EBE6E0]' : 'border-[#1A1A1A]/10 bg-transparent opacity-60'}`}>
                          <span className="text-[10px] uppercase tracking-widest font-bold">Local Radius</span>
                          <span className="text-xs font-serif mt-2">Under 10 Kilometers</span>
                        </button>
                        <button type="button" onClick={() => setDistanceType('extended')} className={`p-4 border text-left transition-all flex flex-col justify-between ${distanceType === 'extended' ? 'border-[#1A1A1A] bg-[#EBE6E0]' : 'border-[#1A1A1A]/10 bg-transparent opacity-60'}`}>
                          <span className="text-[10px] uppercase tracking-widest font-bold">Extended Zone</span>
                          <span className="text-xs font-serif mt-2">Over 10 Kilometers</span>
                        </button>
                      </div>
                      <div className="bg-white p-4 border border-[#E5E0D8] text-xs text-[#1A1A1A]/70 leading-relaxed mb-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold uppercase text-[9px] tracking-wider text-[#2C3D30]">Assigned Logistics Fleet:</p>
                          <p className="font-serif text-sm mt-0.5 text-[#1A1A1A]">{DELIVERY_TIERS[activeShippingTier].label}</p>
                        </div>
                        <span className="font-mono bg-[#EBE6E0] px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider">{activeShippingTier} Category</span>
                      </div>

                      <h3 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#E5E0D8] pb-4 mt-12">Payment</h3>
                      <div className="relative w-full">
                         <div onClick={() => setIsPaymentDropdownOpen(!isPaymentDropdownOpen)} className="w-full bg-white border border-[#E5E0D8] p-4 text-sm font-serif flex justify-between items-center cursor-pointer hover:border-[#1A1A1A] transition-colors">
                           <span>{checkoutForm.paymentMethod === 'TRF' ? 'Bank Transfer' : 'Cash on Delivery'}</span>
                           <ChevronDown size={14} className={`transition-transform duration-300 ${isPaymentDropdownOpen ? 'rotate-180' : ''}`} />
                         </div>
                         {isPaymentDropdownOpen && (
                           <div className="absolute top-full left-0 w-full bg-white border border-[#E5E0D8] shadow-xl z-50 mt-1 flex flex-col overflow-hidden">
                              <div onClick={() => { handleCheckoutChange({target:{name:'paymentMethod', value:'COD'}}); setIsPaymentDropdownOpen(false); }} className={`p-4 text-sm font-serif cursor-pointer hover:bg-[#F7F5F0] transition-colors ${checkoutForm.paymentMethod === 'COD' ? 'bg-[#EBE6E0] font-bold' : ''}`}>Cash on Delivery</div>
                              <div onClick={() => { handleCheckoutChange({target:{name:'paymentMethod', value:'TRF'}}); setIsPaymentDropdownOpen(false); }} className={`p-4 text-sm font-serif cursor-pointer hover:bg-[#F7F5F0] transition-colors ${checkoutForm.paymentMethod === 'TRF' ? 'bg-[#EBE6E0] font-bold' : ''}`}>Bank Transfer</div>
                           </div>
                         )}
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
                      {/* NEW: Shipping Integration in Checkout Sidebar */}
                      <div className="space-y-4 mb-12">
                         <div className="flex justify-between items-end"><span className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60">Subtotal</span><span className="text-lg font-serif">{formatPrice(cartTotal)}</span></div>
                         
                         <div className="flex justify-between items-end text-[#1A1A1A]/80">
                            <span className="text-[10px] uppercase tracking-[0.3em] flex flex-col">
                               <span>Delivery Fee</span>
                               <span className="text-[8px] opacity-60 mt-0.5">Fleet: {DELIVERY_TIERS[activeShippingTier].name}</span>
                            </span>
                            <span className="text-sm font-serif">{deliveryCharges > 0 ? formatPrice(deliveryCharges) : 'Calculated'}</span>
                         </div>

                         {appliedCoupon && (
                           <div className="flex justify-between items-end text-green-800">
                             <span className="text-[10px] uppercase tracking-[0.3em] flex flex-col gap-1">
                                <span className="flex items-center gap-1"><Ticket size={12}/> {appliedCoupon.code}</span>
                                <span className="text-[9px] font-bold text-green-900 mt-1">
                                   {appliedCoupon.discountType === 'percent' ? `${appliedCoupon.discountValue}% OFF` : `FLAT ${formatPrice(appliedCoupon.discountValue)} OFF`}
                                </span>
                             </span>
                             <span className="text-lg font-serif">- {formatPrice(discountAmount)}</span>
                           </div>
                         )}

                         <div className="flex justify-between items-end pt-4 border-t border-[#1A1A1A]/20"><span className="text-[10px] uppercase tracking-[0.3em]">Total</span><span className="text-3xl font-serif">{formatPrice(finalTotal)}</span></div>
                      </div>
                      <button type="submit" className="w-full bg-[#1A1A1A] hover:bg-[#2C3D30] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-5">Authorize Order</button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {view === 'order-success' && currentOrder && (
              <div className="max-w-2xl mx-auto px-8 py-32 text-center animate-in fade-in">
                <div className="flex justify-center mb-12"><BrandLogo iconSize="text-5xl md:text-6xl" textSize="text-4xl md:text-5xl" /></div>
                <h2 className="text-6xl font-serif mb-6 text-[#2C3D30]">Acquired.</h2>
                <p className="text-2xl font-serif text-[#1A1A1A] mb-8 italic leading-relaxed">"We know you have many choices—<br/>thank you for picking us."</p>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-6">Reference: <span className="bg-[#1A1A1A] text-white px-2 py-1 font-bold">{currentOrder.orderNumber || currentOrder.id}</span></p>
                <p className="text-lg text-[#1A1A1A]/60 font-light mb-16">
                  Your selections have been reserved for dispatch in {selectedCity}.<br/><br/>
                  {currentOrder.customer?.paymentMethod === 'TRF' 
                     ? `We will verify your bank transfer of ${formatPrice(currentOrder.totalAmount)} shortly.`
                     : `Please prepare ${formatPrice(currentOrder.totalAmount)} for Cash on Delivery.`}
                </p>
                <button onClick={() => navigateTo('track-order')} className="text-[10px] uppercase tracking-[0.3em] border-b border-[#1A1A1A] pb-1 hover:text-[#2C3D30] mb-4 block mx-auto">Track this Order</button>
                <button onClick={() => navigateTo('store')} className="text-[10px] uppercase tracking-[0.3em] border-b border-[#1A1A1A] pb-1 hover:text-[#2C3D30]">Return to Collection</button>
              </div>
            )}

            {view === 'admin-login' && (
              <div className="max-w-md mx-auto px-8 py-32 flex flex-col justify-center h-screen animate-in fade-in">
                <h2 className="text-4xl font-serif mb-2">Staff Portal.</h2>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-8 border-b border-[#E5E0D8] pb-4">Authorized Personnel Only</p>
                <form onSubmit={handleLogin} className="space-y-8 mt-8">
                  <input type="text" placeholder="Identification" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none" required />
                  <input type="password" placeholder="Passcode" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none" required />
                  <button type="submit" className="w-full bg-[#1A1A1A] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-5 mt-8 hover:bg-[#2C3D30]">Authenticate</button>
                </form>
                <button onClick={() => { navigateTo('store'); }} className="mt-12 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A]">Return to Storefront</button>
              </div>
            )}

            {view === 'admin-dashboard' && (
              <div className="max-w-[90rem] mx-auto px-8 md:px-16 pt-16 pb-32 animate-in fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-[#1A1A1A] pb-8 gap-6">
                  <div>
                    <h2 className="text-5xl font-serif mb-4">Master Ledger</h2>
                    <div className="flex flex-wrap gap-8 text-[10px] uppercase tracking-[0.3em] mt-4">
                      <button onClick={() => setAdminTab('orders')} className={`pb-2 ${adminTab === 'orders' ? 'border-b border-[#1A1A1A]' : 'opacity-40'}`}>Orders</button>
                      <button onClick={() => setAdminTab('analytics')} className={`pb-2 ${adminTab === 'analytics' ? 'border-b border-[#1A1A1A]' : 'opacity-40'}`}>Analytics</button>
                      <button onClick={() => setAdminTab('ledger')} className={`pb-2 ${adminTab === 'ledger' ? 'border-b border-[#1A1A1A]' : 'opacity-40'}`}>Inventory</button>
                      <button onClick={() => setAdminTab('cities')} className={`pb-2 ${adminTab === 'cities' ? 'border-b border-[#1A1A1A]' : 'opacity-40'}`}>Regions</button>
                      <button onClick={() => setAdminTab('categories')} className={`pb-2 ${adminTab === 'categories' ? 'border-b border-[#1A1A1A]' : 'opacity-40'}`}>Categories</button>
                      <button onClick={() => setAdminTab('coupons')} className={`pb-2 ${adminTab === 'coupons' ? 'border-b border-[#1A1A1A]' : 'opacity-40'}`}>Coupons</button>
                      <button onClick={() => setAdminTab('promotions')} className={`pb-2 ${adminTab === 'promotions' ? 'border-b border-[#1A1A1A]' : 'opacity-40'}`}>Promotions</button>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    {adminTab === 'ledger' && (
                      <div className="flex gap-4 relative">
                        {selectedProductIds.length > 0 && (
                          <>
                             <button onClick={() => setShowBulkEditModal(true)} className="text-[10px] uppercase tracking-[0.2em] bg-[#1A1A1A] text-white px-6 py-3 hover:bg-[#2C3D30] transition-colors hidden md:block">Bulk Edit</button>
                             <button onClick={handleBulkDelete} className="text-[10px] uppercase tracking-[0.2em] bg-red-900 text-white px-6 py-3 hover:bg-red-700 transition-colors hidden md:block">Delete ({selectedProductIds.length})</button>
                          </>
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
                        <button onClick={() => { setIsEditing(false); setEntryForm({ id: null, name: '', categories: [], price: '', stock: {}, shippingTier: 'T1', image1: '', image2: '', image3: '', shortDesc: '', longDesc: '', careWater: '', careSunlight: '', careClimate: '', careBenefits: '' }); setCatSearch(''); setShowEntryModal(true); }} className="text-[10px] uppercase tracking-[0.2em] bg-[#1A1A1A] text-[#F7F5F0] px-4 md:px-6 py-3 hover:bg-[#2C3D30]">Add <Plus size={12} className="inline"/></button>
                        <button onClick={() => setShowCSVModal(true)} className="text-[10px] uppercase tracking-[0.2em] bg-[#EBE6E0] text-[#1A1A1A] px-4 md:px-6 py-3 hover:bg-[#1A1A1A] hover:text-[#F7F5F0] border border-[#1A1A1A]/10 hidden md:block">Bulk CSV</button>
                      </div>
                    )}
                    <button onClick={() => { setIsAuthenticated(false); navigateTo('store'); localStorage.removeItem('adminToken'); }} className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-red-800 ml-4 md:ml-8">Logout</button>
                  </div>
                </div>

                {/* --- ANALYTICS DASHBOARD --- */}
                {adminTab === 'analytics' && (
                  <div className="space-y-12 animate-in fade-in">
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-[#1A1A1A] text-white p-8 shadow-xl">
                           <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">Total Net Revenue</p>
                           <p className="text-4xl font-serif">{formatPrice(aStats.netRevenue)}</p>
                        </div>
                        <div className="bg-white p-8 border border-[#E5E0D8] shadow-sm">
                           <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-4">Gross Revenue</p>
                           <p className="text-3xl font-serif">{formatPrice(aStats.grossRevenue)}</p>
                        </div>
                        <div className="bg-white p-8 border border-[#E5E0D8] shadow-sm">
                           <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-4">Total Discounts Given</p>
                           <p className="text-3xl font-serif text-red-800">{formatPrice(aStats.totalDiscounts)}</p>
                        </div>
                        <div className="bg-white p-8 border border-[#E5E0D8] shadow-sm">
                           <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-4">Active Orders</p>
                           <p className="text-3xl font-serif">{aStats.counts['Pending'] + aStats.counts['In Process'] + aStats.counts['Dispatched']}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div>
                           <h3 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#1A1A1A]/10 pb-4 mb-6">Status Breakdown</h3>
                           <div className="space-y-4">
                              {Object.entries(aStats.counts).map(([status, count]) => (
                                 <div key={status} className="flex justify-between items-center bg-white p-4 border border-[#E5E0D8]">
                                    <span className="font-serif text-lg">{status}</span>
                                    <span className="font-mono bg-[#EBE6E0] px-3 py-1">{count}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                        <div>
                           <h3 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#1A1A1A]/10 pb-4 mb-6">Revenue By Region</h3>
                           <div className="space-y-4">
                              {Object.entries(aStats.cities).sort((a,b)=>b[1]-a[1]).map(([city, rev]) => (
                                 <div key={city} className="flex justify-between items-center bg-white p-4 border border-[#E5E0D8]">
                                    <span className="font-serif text-lg flex items-center gap-2"><MapPin size={14} className="text-[#1A1A1A]/40"/> {city}</span>
                                    <span className="tracking-widest">{formatPrice(rev)}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* --- ORDER MANAGEMENT TAB --- */}
                {adminTab === 'orders' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="flex justify-between items-center border-b border-[#E5E0D8] pb-4">
                      <h3 className="text-2xl font-serif text-[#1A1A1A]/50">Order Management</h3>
                      <button onClick={fetchOrders} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] bg-[#EBE6E0] hover:bg-[#1A1A1A] hover:text-[#F7F5F0] px-6 py-3 transition-colors">
                        <RefreshCw size={12} className={isFetchingOrders ? "animate-spin" : ""} /> {isFetchingOrders ? 'Syncing...' : 'Fetch Data'}
                      </button>
                    </div>

                    {orders.length === 0 ? ( 
                       <p className="text-[#1A1A1A]/40 text-sm tracking-widest text-center py-12">No orders found.</p> 
                    ) : (
                      orders.map((order, idx) => (
                        <div key={order._id || `order-${idx}`} className="bg-white p-8 border border-[#E5E0D8] shadow-sm flex flex-col md:flex-row gap-8 relative overflow-hidden">
                          <div className={`absolute top-0 left-0 w-1 h-full ${order.status === 'Completed' ? 'bg-green-700' : order.status === 'Cancelled' ? 'bg-red-700' : 'bg-[#1A1A1A]'}`}></div>
                          
                          <div className="flex-grow pl-4">
                             <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 border-b border-[#E5E0D8] pb-6 gap-4">
                               <div className="flex flex-col gap-1">
                                  <h3 className="text-3xl font-serif text-[#1A1A1A]">{order.orderNumber || 'Unknown Order'}</h3>
                                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50">{order.date || new Date(order.createdAt).toLocaleString()}</span>
                                  <span className="text-xl tracking-widest text-[#2C3D30] font-bold mt-2">{formatPrice(order.totalAmount || 0)}</span>
                               </div>
                               
                               <div className="flex items-center gap-4">
                                  <div className="relative w-48">
                                     <select value={order.status || 'Pending'} onChange={(e) => updateOrderStatus(order._id, e.target.value)} className={`appearance-none w-full bg-transparent border-b pb-2 text-xs uppercase tracking-[0.1em] font-bold focus:outline-none cursor-pointer ${order.status === 'Completed' ? 'text-green-700 border-green-700/30' : order.status === 'Cancelled' ? 'text-red-700 border-red-700/30' : 'text-[#1A1A1A] border-[#1A1A1A]/20'}`}>
                                       <option value="Pending">Pending</option>
                                       <option value="In Process">In Process</option>
                                       <option value="Dispatched">Dispatched</option>
                                       <option value="Completed">Completed</option>
                                       <option value="Cancelled">Cancelled</option>
                                     </select>
                                     <ChevronDown size={12} className="absolute right-0 top-1 text-[#1A1A1A]/50 pointer-events-none" />
                                  </div>
                                  <button onClick={() => deleteOrder(order._id)} className="text-red-900 hover:text-red-700 transition-colors p-3 bg-red-50 hover:bg-red-100 rounded-sm" title="Delete Order">
                                     <Trash2 size={16} />
                                  </button>
                               </div>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-[#1A1A1A]/80">
                                
                                <div className="bg-[#F7F5F0] p-6 border border-[#E5E0D8]">
                                   <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-4 border-b border-[#1A1A1A]/10 pb-2">Client Identity</p>
                                   <p className="mb-3"><strong>Name:</strong> {order.customer?.name || 'N/A'}</p>
                                   <p className="mb-3"><strong>Contact:</strong> {order.customer?.phone || 'N/A'} <br/><span className="text-xs text-[#1A1A1A]/50">{order.customer?.email || 'N/A'}</span></p>
                                   <p className="mb-3"><strong>Address:</strong> <span className="uppercase text-[10px] bg-white px-2 py-1 mr-2 border border-[#E5E0D8]">{order.customer?.addressType || 'Home'}</span>{order.customer?.address || 'N/A'}, {order.city || 'N/A'}</p>
                                   {order.customer?.mapLink && <p className="mb-3"><strong>Location:</strong> <a href={order.customer.mapLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Open in Maps →</a></p>}
                                   {order.customer?.instructions && <div className="mt-4 bg-orange-50 border border-orange-200 p-3 text-orange-900"><p className="text-[10px] uppercase tracking-widest font-bold mb-1">Client Note:</p><p>{order.customer.instructions}</p></div>}
                                </div>
                                
                                <div className="bg-[#F7F5F0] p-6 border border-[#E5E0D8]">
                                   <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-4 border-b border-[#1A1A1A]/10 pb-2">Fulfillment Data</p>
                                   <div className="flex justify-between mb-3">
                                      <span><strong>Payment:</strong> {order.customer?.paymentMethod === 'TRF' ? 'Bank Transfer' : 'Cash on Delivery'}</span>
                                      {order.discount > 0 && <span className="text-green-700 font-bold bg-green-50 px-2 py-1 text-xs border border-green-200">Discount: PKR {order.discount}</span>}
                                   </div>
                                   {order.customer?.secretCode && <p className="mb-4"><strong>Secret Code:</strong> <span className="font-mono bg-yellow-200 text-yellow-900 px-3 py-1 font-bold tracking-widest border border-yellow-300 ml-2">{order.customer.secretCode}</span></p>}
                                   
                                   {/* NEW: Logistics Admin Info Update */}
                                   <p className="mb-3">
                                      <strong>Logistics Routing: </strong> 
                                      <span className="text-xs uppercase font-mono tracking-wider bg-gray-100 border px-1.5 py-0.5">
                                        {order.shippingTier || 'T1'} ({order.distanceType === 'extended' ? 'Long > 10km' : 'Short < 10km'}) 
                                      </span> 
                                      <span className="ml-2 font-bold text-xs text-[#2C3D30]">+ {formatPrice(order.deliveryCharges || 0)}</span>
                                   </p>

                                   <div className="mt-6">
                                      <p className="font-bold mb-3 border-b border-[#1A1A1A]/10 pb-2">Requested Items:</p>
                                      <ul className="space-y-2">
                                         {order.items?.map((item, iIdx) => (
                                            <li key={iIdx} className="flex justify-between items-center bg-white p-2 border border-[#E5E0D8]">
                                               <span><span className="font-bold text-[#2C3D30] bg-[#EBE6E0] px-2 py-1 text-xs mr-2">{item.qty}x</span> {item.name}</span>
                                            </li>
                                         ))}
                                      </ul>
                                   </div>
                                   
                                   {order.customer?.receipt && (
                                      <div className="mt-6 pt-4 border-t border-[#1A1A1A]/10">
                                         <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2">Transfer Receipt Attachment</p>
                                         <a href={order.customer.receipt} target="_blank" rel="noreferrer" className="block w-32 h-32 overflow-hidden border-2 border-[#E5E0D8] hover:border-[#1A1A1A] transition-colors relative group">
                                            <img src={order.customer.receipt} alt="Receipt" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-[#1A1A1A]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] uppercase tracking-widest font-bold">View Full</div>
                                         </a>
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

                {/* --- PROMOTIONS & MARKETING TAB --- */}
                {adminTab === 'promotions' && (
                  <div className="max-w-5xl animate-in fade-in">
                    
                    {/* STOREFRONT BANNER SETTINGS */}
                    <div className="bg-white border border-[#E5E0D8] shadow-sm p-8 mb-12">
                       <h4 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#1A1A1A]/10 pb-4 mb-6 font-bold text-[#1A1A1A]">Announcement Banner</h4>
                       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                          <div className="md:col-span-3">
                             <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">Banner Text</label>
                             <input type="text" value={promoBanner.text} onChange={e => setPromoBanner({...promoBanner, text: e.target.value})} placeholder="e.g., FREE SHIPPING ON ALL ORDERS OVER PKR 5000" className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A]" />
                          </div>
                          <div className="flex items-center gap-4 pb-2">
                             <label className="text-sm flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={promoBanner.isActive} onChange={e => setPromoBanner({...promoBanner, isActive: e.target.checked})} className="accent-[#1A1A1A]" /> Active
                             </label>
                             <button onClick={() => {
                                localStorage.setItem('pc_promo_banner', JSON.stringify(promoBanner));
                                showPopup('success', 'Banner Updated', 'Storefront announcement is live.', 1500);
                             }} className="bg-[#1A1A1A] text-white px-6 py-2 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C3D30]">Publish</button>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-[#1A1A1A]/10 pb-4 mb-8 gap-4">
                       <div>
                         <h3 className="text-3xl font-serif">Marketing Directory</h3>
                         <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50">Unique Client Contacts</p>
                       </div>
                       <button onClick={exportMarketingCSV} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] bg-[#EBE6E0] hover:bg-[#1A1A1A] hover:text-[#F7F5F0] px-6 py-3 transition-colors">
                          <Download size={14} /> Download CSV
                       </button>
                    </div>
                    
                    <div className="bg-white border border-[#E5E0D8] shadow-sm p-8">
                      <p className="text-sm text-[#1A1A1A]/60 mb-6 italic">Ensure you have acquired consent before initiating marketing campaigns.</p>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[600px]">
                          <thead>
                            <tr className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 border-b border-[#E5E0D8]">
                              <th className="pb-4 w-16">Seq</th>
                              <th className="pb-4 w-1/3">Client Name</th>
                              <th className="pb-4 w-1/3">Email Address</th>
                              <th className="pb-4 w-1/3">Phone Number</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from(new Set(orders.map(o => o.customer?.email).filter(Boolean))).map((email, idx) => {
                              const client = orders.find(o => o.customer?.email === email)?.customer;
                              if (!client) return null;
                              return (
                                <tr key={email} className="border-b border-[#E5E0D8] hover:bg-[#F7F5F0] transition-colors">
                                  <td className="py-4 font-mono text-[#1A1A1A]/40">{idx + 1}</td>
                                  <td className="py-4 font-serif text-lg">{client.name || 'N/A'}</td>
                                  <td className="py-4 font-mono text-xs">{client.email || 'N/A'}</td>
                                  <td className="py-4 font-mono text-xs">{client.phone || 'N/A'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'coupons' && (
                  <div className="max-w-5xl animate-in fade-in">
                    <form onSubmit={submitNewCoupon} className="mb-12 grid grid-cols-1 md:grid-cols-5 gap-8 bg-transparent">
                      <div className="md:col-span-5 flex justify-between items-end border-b border-[#1A1A1A]/10 pb-4 mb-4">
                         <h3 className="text-3xl font-serif">{newCoupon._id ? 'Renew Campaign' : 'Launch Campaign'}</h3>
                         {newCoupon._id && <button type="button" onClick={() => setNewCoupon({_id: null, code: '', type: 'percent', value: '', scope: 'all', target: '', startDate: '', endDate: '', maxUses: ''})} className="text-[10px] uppercase tracking-widest hover:opacity-50">Cancel Edit</button>}
                      </div>
                      
                      <div className="md:col-span-2">
                         <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">Code</label>
                         <input type="text" placeholder="SALE20" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors uppercase font-mono" required/>
                      </div>
                      
                      <div>
                         <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">Type</label>
                         <select value={newCoupon.type} onChange={e => setNewCoupon({...newCoupon, type: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors cursor-pointer">
                            <option value="percent">Percentage (%)</option>
                            <option value="fixed">Flat Rate (PKR)</option>
                         </select>
                      </div>
                      
                      <div className="md:col-span-2">
                         <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">Discount Value</label>
                         <input type="number" placeholder="15" value={newCoupon.value} onChange={e => setNewCoupon({...newCoupon, value: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors" required/>
                      </div>

                      <div className="md:col-span-2">
                         <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">Start Date</label>
                         <input type="datetime-local" value={newCoupon.startDate} onChange={e => setNewCoupon({...newCoupon, startDate: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors font-mono" required/>
                      </div>
                      
                      <div className="md:col-span-2">
                         <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">Expiration Date</label>
                         <input type="datetime-local" value={newCoupon.endDate} onChange={e => setNewCoupon({...newCoupon, endDate: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors font-mono" required/>
                      </div>

                      <div>
                         <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">Max Uses</label>
                         <input type="number" placeholder="Unlimited (0)" value={newCoupon.maxUses} onChange={e => setNewCoupon({...newCoupon, maxUses: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors" />
                      </div>

                      <div className="md:col-span-2">
                         <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">Target Scope</label>
                         <select value={newCoupon.scope} onChange={e => setNewCoupon({...newCoupon, scope: e.target.value, target: ''})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors cursor-pointer">
                            <option value="all">All Products</option>
                            <option value="category">Specific Category</option>
                            <option value="product">Specific Product</option>
                         </select>
                      </div>

                      <div className="md:col-span-3">
                         <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">Target Identifier</label>
                         {newCoupon.scope === 'all' && <input type="text" disabled placeholder="Applies to everything" className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm opacity-50 cursor-not-allowed" />}
                         {newCoupon.scope === 'category' && (
                            <select value={newCoupon.target} onChange={e => setNewCoupon({...newCoupon, target: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors cursor-pointer" required>
                              <option value="">Select Category...</option>
                              {categories.filter(c=>c!=="All").map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                         )}
                         {newCoupon.scope === 'product' && (
                            <select value={newCoupon.target} onChange={e => setNewCoupon({...newCoupon, target: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors cursor-pointer" required>
                              <option value="">Select Product...</option>
                              {products.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
                            </select>
                         )}
                      </div>

                      <button type="submit" className="md:col-span-5 bg-[#1A1A1A] text-white py-4 text-[10px] uppercase tracking-[0.3em] hover:bg-[#2C3D30] mt-4">{newCoupon._id ? 'Update Campaign' : 'Initialize Campaign'}</button>
                    </form>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                       {/* ACTIVE COUPONS */}
                       <div>
                          <h3 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#1A1A1A]/10 pb-4 mb-6 text-[#2C3D30] font-bold">Active Campaigns</h3>
                          <div className="space-y-4">
                            {adminCoupons.filter(c => new Date(c.endDate) >= new Date() && (c.maxUses === 0 || c.usedCount < c.maxUses)).length === 0 ? <p className="text-sm text-[#1A1A1A]/50">No active coupons.</p> : adminCoupons.filter(c => new Date(c.endDate) >= new Date() && (c.maxUses === 0 || c.usedCount < c.maxUses)).map(c => {
                               const targetName = c.scope === 'product' ? products.find(p=>p._id===c.target)?.name || c.target : c.target;
                               return (
                              <div key={c._id} className="flex justify-between items-start bg-white p-6 border border-[#E5E0D8] shadow-sm">
                                <div className="flex flex-col gap-2">
                                   <div className="flex items-center gap-3">
                                      <span className="text-lg font-mono font-bold bg-[#EBE6E0]/50 text-[#1A1A1A] px-3 py-1 tracking-widest">{c.code}</span>
                                      {c.maxUses > 0 && <span className="text-[10px] tracking-widest font-bold text-[#1A1A1A]/60 bg-[#EBE6E0] px-2 py-1 rounded-none">{c.usedCount} / {c.maxUses} Used</span>}
                                   </div>
                                   <div className="flex flex-col text-xs text-[#1A1A1A]/70 mt-2">
                                      <span>Discount: {c.discountType === 'percent' ? c.discountValue + '%' : 'PKR ' + c.discountValue}</span>
                                      <span className="capitalize">Scope: {c.scope} {c.target && `(${targetName})`}</span>
                                   </div>
                                   <div className="flex flex-col text-[10px] text-[#1A1A1A]/40 font-mono mt-2">
                                      <span>START: {new Date(c.startDate).toLocaleString()}</span>
                                      <span>END: {new Date(c.endDate).toLocaleString()}</span>
                                   </div>
                                </div>
                                <div className="flex flex-col gap-4 items-end">
                                   <button onClick={() => loadCouponForEdit(c)} className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 hover:text-[#1A1A1A]">Edit</button>
                                   <button onClick={() => deleteCoupon(c._id)} className="text-[10px] uppercase tracking-[0.2em] text-red-900 hover:text-red-700">Delete</button>
                                </div>
                              </div>
                            )})}
                          </div>
                       </div>

                       {/* EXPIRED / EXHAUSTED COUPONS */}
                       <div>
                          <h3 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#1A1A1A]/10 pb-4 mb-6 text-[#1A1A1A]/40 font-bold">Expired / Exhausted</h3>
                          <div className="space-y-4">
                            {adminCoupons.filter(c => new Date(c.endDate) < new Date() || (c.maxUses > 0 && c.usedCount >= c.maxUses)).length === 0 ? <p className="text-sm text-[#1A1A1A]/50">No expired coupons.</p> : adminCoupons.filter(c => new Date(c.endDate) < new Date() || (c.maxUses > 0 && c.usedCount >= c.maxUses)).map(c => {
                               return (
                              <div key={c._id} className="flex justify-between items-start bg-transparent p-6 border border-[#E5E0D8] opacity-60 hover:opacity-100 transition-opacity">
                                <div className="flex flex-col gap-2">
                                   <div className="flex items-center gap-3">
                                      <span className="text-lg font-mono font-bold bg-[#E5E0D8] text-[#1A1A1A]/50 px-3 py-1 tracking-widest line-through decoration-2">{c.code}</span>
                                      {c.maxUses > 0 && <span className="text-[10px] tracking-widest font-bold text-red-800 bg-red-50 px-2 py-1 rounded-none">{c.usedCount} / {c.maxUses} Used</span>}
                                   </div>
                                   <div className="flex flex-col text-[10px] text-[#1A1A1A]/40 font-mono mt-2">
                                      <span>EXPIRED: {new Date(c.endDate).toLocaleString()}</span>
                                   </div>
                                </div>
                                <div className="flex flex-col gap-4 items-end">
                                   <button onClick={() => loadCouponForEdit(c)} className="text-[10px] uppercase tracking-[0.2em] bg-[#1A1A1A] text-white px-3 py-2 hover:bg-[#2C3D30]">Renew</button>
                                   <button onClick={() => deleteCoupon(c._id)} className="text-[10px] uppercase tracking-[0.2em] text-red-900 hover:text-red-700">Delete</button>
                                </div>
                              </div>
                            )})}
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {adminTab === 'categories' && (
                  <div className="max-w-3xl animate-in fade-in">
                    <form onSubmit={submitNewCategory} className="mb-12 flex gap-4">
                      <input type="text" placeholder="New Category Name..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 bg-transparent border-b border-[#1A1A1A]/20 pb-3 text-sm focus:outline-none" required/>
                      <button type="submit" className="bg-[#1A1A1A] text-white px-8 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C3D30]">Create Category</button>
                    </form>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-4">Drag and drop to reorder</p>
                    <div className="space-y-4">
                      {categories.filter(c => c !== "All").map((cat, idx) => (
                        <div key={cat} draggable onDragStart={() => setDraggedCatIdx(idx)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDropCat(idx)} className="flex justify-between items-center bg-white p-6 border border-[#E5E0D8] shadow-sm cursor-grab active:cursor-grabbing hover:border-[#1A1A1A]/30 transition-colors">
                          <span className="text-lg font-serif flex items-center gap-4"><GripVertical size={16} className="text-[#1A1A1A]/30" /> {cat}</span>
                          <div className="flex gap-6">
                             <button onClick={() => renameCategory(cat)} className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 hover:text-[#1A1A1A]">Rename</button>
                             <button onClick={() => deleteCategory(cat)} className="text-[10px] uppercase tracking-[0.2em] text-red-900 hover:text-red-700">Remove</button>
                          </div>
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
                               <td key={city} className="py-4 text-[#1A1A1A]/70">{p.stock?.[city] || 0}</td>
                             ))}

                             {visCols.price && (
                                <td className="py-4 tracking-widest">{formatPrice(p.price)}</td>
                             )}
                             <td className="py-4 text-right px-2 flex justify-end gap-6 items-center">
                                <button onClick={() => openEditModal(p)} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] flex items-center gap-1 text-[10px] uppercase tracking-[0.2em]"><Edit size={12}/> Edit</button>
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

          {/* FOOTER */}
          {isClientView && (
            <footer className="border-t border-[#E5E0D8] py-16 mt-auto">
              <div className="max-w-[90rem] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                
                <div className="flex flex-col items-center md:items-start shrink-0">
                  <BrandLogo iconSize="text-3xl md:text-4xl" textSize="text-2xl md:text-3xl" />
                  <span className="text-[8px] uppercase tracking-[0.4em] text-[#1A1A1A]/50 mt-2">Plants & Ceramics</span>
                </div>

                <div className="text-center md:text-right">
                   <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-1">Curated in Karachi, Pakistan.</p>
                   <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40">Developed & Maintained by <a href="https://doubbletech.com" target="_blank" rel="noreferrer" className="text-[#1A1A1A] font-bold hover:underline">DoubbleTech.com</a></p>
                </div>
              </div>
            </footer>
          )}

          {/* BULK EDIT MODAL */}
          {showBulkEditModal && (
            <div className="fixed inset-0 z-[60] bg-[#1A1A1A]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto py-12">
              <div className="bg-[#F7F5F0] p-8 md:p-12 max-w-xl w-full border border-[#E5E0D8] shadow-2xl relative my-auto">
                <button onClick={() => setShowBulkEditModal(false)} className="absolute top-6 right-6 text-[#1A1A1A]/40 hover:text-[#1A1A1A]"><X size={24} strokeWidth={1} /></button>
                <h2 className="text-4xl font-serif mb-2">Bulk Update.</h2>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-8 border-b border-[#1A1A1A]/10 pb-4">Editing {selectedProductIds.length} items</p>
                
                <form onSubmit={submitBulkEdit} className="space-y-8">
                  <div>
                     <label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-4 block border-b border-[#1A1A1A]/10 pb-2">Set Categories (Leave empty to keep existing)</label>
                     <div className="flex flex-wrap gap-4">
                       {categories.filter(c => c !== "All").map(c => (
                         <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                           <input type="checkbox" checked={bulkEditForm.categories.includes(c)} onChange={(e) => {
                             const newCats = e.target.checked ? [...bulkEditForm.categories, c] : bulkEditForm.categories.filter(cat => cat !== c);
                             setBulkEditForm({...bulkEditForm, categories: newCats});
                           }} className="accent-[#1A1A1A] w-4 h-4" /> {c}
                         </label>
                       ))}
                     </div>
                  </div>

                  <div>
                     <label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-4 block border-b border-[#1A1A1A]/10 pb-2">Set Stock for Specific City</label>
                     <div className="flex gap-4">
                       <select value={bulkEditForm.city} onChange={e => setBulkEditForm({...bulkEditForm, city: e.target.value})} className="flex-1 bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none focus:border-[#1A1A1A] cursor-pointer">
                          <option value="">Select City...</option>
                          {cities.map(city => <option key={city} value={city}>{city}</option>)}
                       </select>
                       <input type="number" min="0" placeholder="Stock Qty" value={bulkEditForm.stock} onChange={e => setBulkEditForm({...bulkEditForm, stock: e.target.value})} disabled={!bulkEditForm.city} className="w-32 bg-white border border-[#E5E0D8] p-3 text-sm focus:outline-none focus:border-[#1A1A1A] disabled:opacity-50" />
                     </div>
                  </div>

                  <button type="submit" className="w-full bg-[#1A1A1A] text-white py-4 text-[10px] uppercase tracking-[0.3em] hover:bg-[#2C3D30] transition-colors mt-8">Apply Updates</button>
                </form>
              </div>
            </div>
          )}

          {/* ADD PRODUCT MODAL */}
          {showEntryModal && (
            <div className="fixed inset-0 z-[60] bg-[#1A1A1A]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-[#F7F5F0] p-6 md:p-8 max-w-6xl w-[95%] border border-[#E5E0D8] shadow-2xl relative flex flex-col h-[90vh]">
                <button onClick={() => setShowEntryModal(false)} className="absolute top-6 right-6 text-[#1A1A1A]/40 hover:text-[#1A1A1A] z-10"><X size={24} strokeWidth={1} /></button>
                <h2 className="text-4xl font-serif mb-6 border-b border-[#1A1A1A]/10 pb-4">{isEditing ? 'Edit Product.' : 'New Product.'}</h2>
                
                <form onSubmit={submitEntry} className="flex-1 overflow-y-auto pr-4 grid grid-cols-1 lg:grid-cols-10 gap-x-8 gap-y-6">
                  
                  {/* ROW 1: NEW TIER DROPDOWN ADDED HERE */}
                  <div className="lg:col-span-3">
                     <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">Name</label>
                     <input type="text" required value={entryForm.name} onChange={e=>setEntryForm({...entryForm, name: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors rounded-none" />
                  </div>
                  
                  <div className="lg:col-span-2">
                     <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">Price (PKR)</label>
                     <input type="number" required value={entryForm.price} onChange={e=>setEntryForm({...entryForm, price: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors rounded-none" />
                  </div>

                  <div className="lg:col-span-2">
                     <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">Logistics Tier</label>
                     <select value={entryForm.shippingTier} onChange={e=>setEntryForm({...entryForm, shippingTier: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors cursor-pointer rounded-none">
                        <option value="T1">T1 (Up to 1.5 kg / Small)</option>
                        <option value="T2">T2 (1.6 - 5.0 kg / Medium)</option>
                        <option value="T3">T3 (5.1 - 15.0 kg / Large)</option>
                        <option value="T4">T4 (15.1 - 30.0 kg / XL)</option>
                        <option value="T5">T5 (Bulk / Landscaping)</option>
                     </select>
                  </div>

                  <div className="lg:col-span-3 relative">
                     <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">Categories</label>
                     <div className="flex flex-wrap gap-2 mb-2">
                       {entryForm.categories.map(c => (
                         <span key={c} className="bg-[#EBE6E0] text-[#1A1A1A] px-2 py-1 text-[10px] uppercase tracking-widest flex items-center gap-1">
                           {c} <X size={10} className="cursor-pointer hover:text-red-700" onClick={() => setEntryForm(prev => ({...prev, categories: prev.categories.filter(cat => cat !== c)}))} />
                         </span>
                       ))}
                     </div>
                     <div className="relative">
                        <input type="text" placeholder="Search & click to add category..." value={catSearch} onChange={e=>setCatSearch(e.target.value)} onFocus={()=>setIsCatDropdownOpen(true)} onBlur={()=>setTimeout(() => setIsCatDropdownOpen(false), 150)} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-xs focus:outline-none focus:border-[#1A1A1A] transition-colors rounded-none" />
                        {isCatDropdownOpen && (
                           <div className="absolute top-full left-0 w-full bg-white border border-[#E5E0D8] shadow-xl z-50 max-h-32 overflow-y-auto mt-1">
                              {filteredModalCats.length === 0 ? <div className="p-3 text-xs text-[#1A1A1A]/40">No categories found.</div> : filteredModalCats.map(c => (
                                 <div key={c} className="p-3 text-xs hover:bg-[#F7F5F0] cursor-pointer border-b border-[#E5E0D8] last:border-0" onMouseDown={(e) => { e.preventDefault(); setEntryForm(prev => ({...prev, categories: [...prev.categories, c]})); setCatSearch(''); }}>
                                    + Add "{c}"
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* ROW 2: BOTANICAL INTELLIGENCE FIELDS */}
                  <div className="lg:col-span-10 mt-2 border-t border-[#1A1A1A]/10 pt-4">
                     <h4 className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/70 mb-4 font-bold">Botanical Intelligence Data (Leave blank for AI auto-generation)</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                        <div>
                           <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">💧 Water Protocol</label>
                           <input type="text" value={entryForm.careWater} onChange={e=>setEntryForm({...entryForm, careWater: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-xs focus:outline-none focus:border-[#1A1A1A]" />
                        </div>
                        <div>
                           <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">☀️ Sunlight Required</label>
                           <input type="text" value={entryForm.careSunlight} onChange={e=>setEntryForm({...entryForm, careSunlight: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-xs focus:outline-none focus:border-[#1A1A1A]" />
                        </div>
                        <div>
                           <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">🌡️ Climate</label>
                           <input type="text" value={entryForm.careClimate} onChange={e=>setEntryForm({...entryForm, careClimate: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-xs focus:outline-none focus:border-[#1A1A1A]" />
                        </div>
                        <div>
                           <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">✨ Benefits</label>
                           <input type="text" value={entryForm.careBenefits} onChange={e=>setEntryForm({...entryForm, careBenefits: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-xs focus:outline-none focus:border-[#1A1A1A]" />
                        </div>
                     </div>
                  </div>

                  {/* ROW 3 */}
                  <div className="lg:col-span-4 mt-2">
                     <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-4">Location Stock</label>
                     <div className="flex gap-4">
                       {cities.map(city => (
                         <div key={city} className="flex-1">
                           <label className="text-[8px] uppercase tracking-widest text-[#1A1A1A]/70 block mb-1">{city}</label>
                           <input type="number" min="0" value={entryForm.stock[city] || 0} onChange={e => setEntryForm({...entryForm, stock: {...entryForm.stock, [city]: Number(e.target.value)}})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-1 text-sm focus:outline-none focus:border-[#1A1A1A] rounded-none" />
                         </div>
                       ))}
                     </div>
                  </div>

                  <div className="lg:col-span-6 mt-2">
                     <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-4">Image Gallery</label>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="flex border-b border-[#1A1A1A]/20 pb-1 items-center focus-within:border-[#1A1A1A] transition-colors">
                           <input type="text" placeholder="URL/Emoji 1" value={entryForm.image1} onChange={e=>setEntryForm({...entryForm, image1: e.target.value})} className="flex-1 bg-transparent text-sm focus:outline-none rounded-none" />
                           <input type="file" id="img1" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'image1')} />
                           <label htmlFor="img1" className="cursor-pointer text-[#1A1A1A]/40 hover:text-[#1A1A1A] ml-2"><UploadCloud size={14} /></label>
                        </div>
                        <div className="flex border-b border-[#1A1A1A]/20 pb-1 items-center focus-within:border-[#1A1A1A] transition-colors">
                           <input type="text" placeholder="URL/Emoji 2" value={entryForm.image2} onChange={e=>setEntryForm({...entryForm, image2: e.target.value})} className="flex-1 bg-transparent text-sm focus:outline-none rounded-none" />
                           <input type="file" id="img2" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'image2')} />
                           <label htmlFor="img2" className="cursor-pointer text-[#1A1A1A]/40 hover:text-[#1A1A1A] ml-2"><UploadCloud size={14} /></label>
                        </div>
                        <div className="flex border-b border-[#1A1A1A]/20 pb-1 items-center focus-within:border-[#1A1A1A] transition-colors">
                           <input type="text" placeholder="URL/Emoji 3" value={entryForm.image3} onChange={e=>setEntryForm({...entryForm, image3: e.target.value})} className="flex-1 bg-transparent text-sm focus:outline-none rounded-none" />
                           <input type="file" id="img3" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'image3')} />
                           <label htmlFor="img3" className="cursor-pointer text-[#1A1A1A]/40 hover:text-[#1A1A1A] ml-2"><UploadCloud size={14} /></label>
                        </div>
                     </div>
                  </div>

                  {/* ROW 4 */}
                  <div className="lg:col-span-4">
                     <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">Short Description</label>
                     <input type="text" required value={entryForm.shortDesc} onChange={e=>setEntryForm({...entryForm, shortDesc: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors rounded-none" placeholder="Brief summary for the grid..." />
                  </div>
                  
                  <div className="lg:col-span-6">
                     <label className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 block mb-2">Long Description (Optional)</label>
                     <textarea rows="2" value={entryForm.longDesc} onChange={e=>setEntryForm({...entryForm, longDesc: e.target.value})} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors resize-none rounded-none" placeholder="Detailed care instructions..." />
                  </div>

                  <div className="lg:col-span-10 mt-2">
                     <button type="submit" className="w-full bg-[#1A1A1A] text-white py-4 text-[10px] uppercase tracking-[0.3em] hover:bg-[#2C3D30] transition-colors">{isEditing ? 'Save Changes' : 'Add to Ledger'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showCSVModal && (
            <div className="fixed inset-0 z-[60] bg-[#1A1A1A]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
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
