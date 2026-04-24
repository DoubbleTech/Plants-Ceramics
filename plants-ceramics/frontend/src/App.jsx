import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, ShieldUser, Plus, Trash2, Edit, Leaf, ArrowLeft, Check, BookOpen, Search, Camera, Lock, Loader2, MoveRight, ArrowUpRight, MapPin, ChevronDown } from 'lucide-react';

// Mock initial database with CITY-WISE STOCK
const initialProducts = [
  { id: 1, name: "Chili Plant", category: "Vegetable Plant", price: 400, stock: { "Karachi": 15, "Islamabad": 10, "Rawalpindi": 0 }, isBykeaEligible: true, image: "🌶️", desc: "Spicy green chilies, ready to harvest.", longDesc: "A prolific producer of spicy green chilies. Perfect for sunny balconies and requires minimal maintenance once established. Keep the soil slightly moist and ensure it gets at least 6 hours of direct sunlight daily." },
  { id: 2, name: "Large Mango Tree", category: "Fruit Plant", price: 4500, stock: { "Karachi": 5, "Islamabad": 0, "Rawalpindi": 0 }, isBykeaEligible: false, image: "🌳", desc: "Grafted tree. Requires car delivery.", longDesc: "A beautiful, established grafted mango tree ready to be planted in your garden. This variety promises sweet, fiberless fruit in the coming seasons. Requires a large permanent spot in full sun." },
  { id: 3, name: "Jasmine Plant", category: "Flower Plant", price: 800, stock: { "Karachi": 10, "Islamabad": 5, "Rawalpindi": 5 }, isBykeaEligible: true, image: "🌸", desc: "Fragrant white blooms for your garden.", longDesc: "Known locally as Motia, this elegant plant produces intensely fragrant white flowers. Ideal for patios or near windows where the evening breeze can carry its scent indoors." },
  { id: 4, name: "Winter Petunia", category: "Seasonal Plant", price: 300, stock: { "Karachi": 20, "Islamabad": 30, "Rawalpindi": 30 }, isBykeaEligible: true, image: "🌺", desc: "Bright seasonal winter flowers.", longDesc: "Add a splash of vibrant color to your winter garden. Petunias are excellent for hanging baskets or border planting. Deadhead spent flowers to encourage continuous blooming." },
  { id: 5, name: "Terracotta Pot", category: "Ceramic Pot", price: 1200, stock: { "Karachi": 10, "Islamabad": 5, "Rawalpindi": 2 }, isBykeaEligible: false, image: "🏺", desc: "Heavy 12-inch clay pot. Fragile.", longDesc: "Hand-thrown by local artisans, this porous terracotta allows plant roots to breathe and prevents waterlogging. Natural variations in color make each piece unique." },
  { id: 6, name: "Glazed Blue Vase", category: "Ceramic Vase", price: 2500, stock: { "Karachi": 4, "Islamabad": 4, "Rawalpindi": 0 }, isBykeaEligible: false, image: "🏺", desc: "Tall decorative ceramic vase.", longDesc: "A striking centerpiece for any room. The deep ocean-blue glaze reflects light beautifully. Perfect for dried arrangements or standing elegantly on its own." },
  { id: 7, name: "Clay Water Cooler", category: "Ceramic Cooler", price: 1800, stock: { "Karachi": 8, "Islamabad": 2, "Rawalpindi": 0 }, isBykeaEligible: false, image: "🚰", desc: "Traditional cooling water dispenser.", longDesc: "A traditional Matka designed for modern homes. Naturally cools water through evaporation while adding an earthy alkalinity. Comes with a secure lid and sturdy base." },
  { id: 8, name: "Ceramic Figurine", category: "Ceramic Craft", price: 600, stock: { "Karachi": 10, "Islamabad": 10, "Rawalpindi": 10 }, isBykeaEligible: true, image: "🕊️", desc: "Hand-painted garden decor.", longDesc: "Add a touch of whimsy to your potted plants with this delicately hand-painted ceramic bird. Weather-resistant and perfectly sized to nestle among foliage." },
  { id: 9, name: "Nursery Pot", category: "Plastic Pot", price: 150, stock: { "Karachi": 50, "Islamabad": 50, "Rawalpindi": 50 }, isBykeaEligible: true, image: "🪣", desc: "Lightweight 8-inch durable pot.", longDesc: "High-quality, flexible nursery pots with excellent drainage. Ideal for repotting growing plants or starting larger seeds. Reusable and UV resistant." },
  { id: 10, name: "Organic Compost", category: "Fertilizer", price: 800, stock: { "Karachi": 20, "Islamabad": 10, "Rawalpindi": 10 }, isBykeaEligible: true, image: "🍂", desc: "5kg bag of nutrient-rich soil.", longDesc: "A premium blend of decomposed organic matter. Enhances soil structure, retains moisture, and provides a slow release of vital nutrients to keep your botanicals thriving." },
  { id: 11, name: "Neem Oil Spray", category: "Spray", price: 550, stock: { "Karachi": 15, "Islamabad": 15, "Rawalpindi": 0 }, isBykeaEligible: true, image: "🧴", desc: "500ml organic pest control.", longDesc: "A completely natural, cold-pressed neem oil solution. Safely eradicates aphids, spider mites, and whiteflies without harming beneficial insects or pets." },
  { id: 12, name: "Tomato Seeds", category: "Seed", price: 200, stock: { "Karachi": 100, "Islamabad": 100, "Rawalpindi": 100 }, isBykeaEligible: true, image: "🍅", desc: "Pack of 50 heirloom seeds.", longDesc: "High-germination heirloom cherry tomato seeds. Known for producing sweet, bite-sized tomatoes on vigorous, disease-resistant vines." },
  { id: 13, name: "Snake Plant", category: "Indoor Plant", price: 600, stock: { "Karachi": 20, "Islamabad": 10, "Rawalpindi": 10 }, isBykeaEligible: true, image: "🪴", desc: "Low-light tolerant air purifier.", longDesc: "The ultimate architectural plant. Not only is it nearly indestructible and tolerant of low light, but it also actively purifies your indoor air by removing toxins overnight." },
  { id: 14, name: "Bougainvillea", category: "Outdoor Plant", price: 900, stock: { "Karachi": 6, "Islamabad": 6, "Rawalpindi": 0 }, isBykeaEligible: true, image: "🌺", desc: "Vibrant sun-loving climbing plant.", longDesc: "A spectacular climber that thrives in our local heat. Produces papery, brilliant bracts of color. Requires full sun and infrequent watering for the best floral display." },
];

const initialGuides = [
  { id: 1, name: "Monstera Deliciosa", image: "🪴", sunlight: "Bright, indirect light", water: "Every 1-2 weeks, let topsoil dry", tips: "Wipe leaves with a damp cloth to remove dust. Toxic to pets." },
  { id: 2, name: "Aloe Vera", image: "🌵", sunlight: "Bright, direct or indirect light", water: "Every 2-3 weeks", tips: "Extremely drought tolerant. Overwatering is its biggest enemy." },
  { id: 3, name: "Cherry Tomato", image: "🍅", sunlight: "Full sun (6+ hours daily)", water: "Keep soil consistently moist", tips: "Requires a trellis or cage for support as it grows tall." }
];

const baseCategories = [
  "Indoor Plant", "Outdoor Plant", "Vegetable Plant", "Fruit Plant", "Flower Plant", "Seasonal Plant", 
  "Ceramic Pot", "Ceramic Vase", "Ceramic Cooler", "Ceramic Craft", "Plastic Pot", "Fertilizer", "Spray", "Seed"
].sort();

const initialCategories = ["All", ...baseCategories];
const initialCities = ["Islamabad", "Karachi", "Rawalpindi"].sort();

const formatPrice = (price) => `PKR ${price.toLocaleString()}`;

export default function App() {
  // --- Navigation & Core State ---
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hostname.startsWith('admin')) {
      return 'admin-login';
    }
    return 'city-select';
  });
  const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState(initialCities);
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  
  // --- Pagination / Show More State ---
  const [visibleCount, setVisibleCount] = useState(6);

  // --- Order & Checkout State ---
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '', email: '', phone: '', address: '', locationLink: '', instructions: '', paymentMethod: 'COD', receipt: null
  });

  // --- Admin & Bulk Upload State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [adminTab, setAdminTab] = useState('ledger'); 
  const [showAddMenu, setShowAddMenu] = useState(false); 
  
  // Modals
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCityModal, setShowCityModal] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [newEntryForm, setNewEntryForm] = useState({
    name: '', image1: '', image2: '', image3: '', shortDesc: '', longDesc: '',
    amount: '', discount: '', sale: false, shipping: 'Standard', category: 'Indoor Plant', subCategory: '', stock: {}
  });

  // --- Plant Guide State ---
  const [guideSearch, setGuideSearch] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  // --- Effects ---
  useEffect(() => {
    // 24-Hour City Persistence Logic
    const savedCity = localStorage.getItem('pc_selected_city');
    const lastActivity = localStorage.getItem('pc_last_activity');
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    if (savedCity && lastActivity) {
      const now = Date.now();
      if (now - parseInt(lastActivity, 10) < TWENTY_FOUR_HOURS) {
        setSelectedCity(savedCity);
        if (typeof window !== 'undefined' && !window.location.hostname.startsWith('admin')) {
          setView('store'); 
        }
        localStorage.setItem('pc_last_activity', now.toString()); 
      } else {
        localStorage.removeItem('pc_selected_city');
        localStorage.removeItem('pc_last_activity');
      }
    }

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    let lastWrite = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastWrite > 60000) { 
        if (localStorage.getItem('pc_selected_city')) {
          localStorage.setItem('pc_last_activity', now.toString());
        }
        lastWrite = now;
      }
    };

    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  const closeAddMenu = () => setShowAddMenu(false);

  // --- Derived State ---
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const requiresCarDelivery = cart.some(item => !item.isBykeaEligible);
  const filteredProducts = activeCategory === "All" ? products : products.filter(p => p.category === activeCategory);

  // Helper to check stock in current city
  const getCityStock = (product, city = selectedCity) => product.stock?.[city] || 0;

  // --- Logic Handlers ---
  const handleCitySelect = (city) => {
    setSelectedCity(city);
    localStorage.setItem('pc_selected_city', city);
    localStorage.setItem('pc_last_activity', Date.now().toString());
    setView('store');
    setCart([]); 
  };

  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setView('product-detail');
  };

  const addToCart = (product) => {
    const availableStock = getCityStock(product);
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= availableStock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      if (availableStock > 0) {
        return [...prev, { ...product, qty: 1 }];
      }
      return prev;
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setVisibleCount(6); 
  };

  const handleShowMore = () => setVisibleCount(prev => prev + 6);

  const handleCheckoutChange = (e) => {
    const { name, value } = e.target;
    setCheckoutForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setCheckoutForm(prev => ({ ...prev, receipt: e.target.files[0].name }));
    }
  };

  const submitOrder = (e) => {
    e.preventDefault();
    const orderNum = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = {
      id: orderNum,
      date: new Date().toLocaleString(),
      items: [...cart],
      total: cartTotal,
      customer: checkoutForm,
      requiresCarDelivery,
      city: selectedCity
    };
    setOrders(prev => [newOrder, ...prev]);
    setCurrentOrder(newOrder);

    setProducts(prevProducts => prevProducts.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) {
        return {
          ...p,
          stock: { ...p.stock, [selectedCity]: Math.max(0, p.stock[selectedCity] - cartItem.qty) }
        };
      }
      return p;
    }));

    setCart([]);
    setView('order-success');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'Umarali667@') {
      setIsAuthenticated(true); 
      setView('admin-dashboard'); 
      setLoginError('');
    } else {
      setLoginError('Invalid credentials.');
    }
  };

  const deleteProduct = (id) => setProducts(prev => prev.filter(p => p.id !== id));

  const downloadSampleCSV = () => {
    const headers = "Name,ImageURL_1,ImageURL_2,ImageURL_3,ShortDesc,LongDesc,Amount,Discount,Sale,Shipping,Category,SubCategory,Stock_Karachi,Stock_Islamabad,Stock_Rawalpindi\n";
    const sampleRow = "Golden Pothos,🪴,,,Easy care trailing plant.,A vigorous trailing plant perfect for beginners.,800,0,,Standard,Indoor Plant,Vine,20,10,0\n";
    const blob = new Blob([headers + sampleRow], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "catalog_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadingCSV(true);
      setTimeout(() => {
        setIsUploadingCSV(false);
        setShowCSVModal(false);
        const bulkProduct = { 
          id: Math.random(), 
          name: "Monstera Albo", 
          category: "Indoor Plant", 
          price: 12000, 
          stock: { "Karachi": 10, "Islamabad": 5, "Rawalpindi": 2 }, 
          isBykeaEligible: false, 
          image: "🌿", 
          desc: "Rare variegated indoor plant.",
          longDesc: "A stunning, highly sought-after plant featuring striking white variegation on its iconic split leaves."
        };
        setProducts(prev => [bulkProduct, ...prev]);
      }, 2500);
    }
  };

  const submitNewCategory = (e) => {
    e.preventDefault();
    const cat = newCategoryName.trim();
    if (cat && !categories.includes(cat)) {
      setCategories(prev => {
        const sortedCategories = [...prev.filter(c => c !== "All"), cat].sort();
        return ["All", ...sortedCategories];
      });
    }
    setNewCategoryName('');
    setShowCategoryModal(false);
  };

  const submitNewCity = (e) => {
    e.preventDefault();
    const c = newCityName.trim();
    if (c && !cities.includes(c)) {
      setCities(prev => [...prev, c].sort());
      setProducts(prev => prev.map(p => ({
        ...p,
        stock: { ...p.stock, [c]: 0 }
      })));
    }
    setNewCityName('');
    setShowCityModal(false);
  };

  const handleNewEntryChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('stock_')) {
      const city = name.replace('stock_', '');
      setNewEntryForm(prev => ({
        ...prev,
        stock: { ...prev.stock, [city]: Number(value) || 0 }
      }));
    } else {
      setNewEntryForm(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
  };

  const submitNewEntry = (e) => {
    e.preventDefault();
    
    const initializedStock = { ...newEntryForm.stock };
    cities.forEach(c => { if (initializedStock[c] === undefined) initializedStock[c] = 0; });

    const newProduct = {
      id: Math.random(),
      name: newEntryForm.name,
      category: newEntryForm.category,
      price: Number(newEntryForm.amount) || 0,
      stock: initializedStock,
      isBykeaEligible: newEntryForm.shipping === 'Standard',
      image: newEntryForm.image1 || "🪴", 
      desc: newEntryForm.shortDesc,
      longDesc: newEntryForm.longDesc || newEntryForm.shortDesc
    };
    setProducts(prev => [newProduct, ...prev]);
    setShowNewEntryModal(false);
    setNewEntryForm({
      name: '', image1: '', image2: '', image3: '', shortDesc: '', longDesc: '',
      amount: '', discount: '', sale: false, shipping: 'Standard', category: 'Indoor Plant', subCategory: '', stock: {}
    });
  };

  const handleImageUpload = (e) => {
    if (e.target.files[0]) {
      setIsAnalyzing(true);
      setTimeout(() => { 
        setIsAnalyzing(false); 
        setGuideSearch("Monstera"); 
      }, 2500);
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#1A1A1A] selection:bg-[#2C3D30] selection:text-[#F7F5F0]" onClick={closeAddMenu}>
      
      {/* REGIONAL GATEWAY */}
      {view === 'city-select' && (
        <div className="min-h-screen flex flex-col items-center justify-center animate-in fade-in duration-[1500ms] p-8">
          <div className="text-center max-w-xl w-full">
            <Leaf size={40} strokeWidth={0.5} className="mx-auto mb-12 text-[#2C3D30]" />
            <h1 className="text-4xl md:text-6xl font-serif leading-[1.1] tracking-tight mb-6">Select your region.</h1>
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

              <div 
                className="absolute left-1/2 -translate-x-1/2 text-2xl md:text-3xl font-serif tracking-tight cursor-pointer flex items-center gap-2"
                onClick={() => setView('store')}
              >
                Plants & Ceramics
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
                              onClick={() => handleCategoryChange(cat)}
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
                        return (
                        <div key={product.id} onClick={() => openProductDetail(product)} className={`group flex flex-col cursor-pointer animate-in fade-in slide-in-from-bottom-8 duration-[1500ms] ${!inStock && 'opacity-60 grayscale-[50%]'}`}>
                          
                          <div className="w-full aspect-[4/5] bg-[#EBE6E0] mb-6 relative overflow-hidden flex items-center justify-center text-7xl md:text-8xl transition-colors duration-700">
                            <span className="transform group-hover:scale-110 transition-transform duration-[1500ms] ease-out">{product.image}</span>
                            
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

                    {visibleCount < filteredProducts.length && (
                      <div className="mt-24 pt-12 border-t border-[#E5E0D8] flex justify-center animate-in fade-in duration-1000">
                        <button 
                          onClick={handleShowMore}
                          className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A] flex flex-col items-center gap-3 hover:opacity-50 transition-opacity"
                        >
                          <span>Reveal More Botanicals</span>
                          <div className="w-[1px] h-8 bg-[#1A1A1A]"></div>
                        </button>
                      </div>
                    )}
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
                    {selectedProduct.image}
                  </div>
                  
                  <div className="w-full md:w-1/2 flex flex-col justify-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40 mb-6">{selectedProduct.category.replace("_", " ")}</p>
                    <h1 className="text-5xl lg:text-7xl font-serif leading-[1.1] tracking-tight mb-8">{selectedProduct.name}</h1>
                    <p className="text-2xl font-light tracking-widest text-[#1A1A1A] mb-12 border-b border-[#E5E0D8] pb-12">{formatPrice(selectedProduct.price)}</p>
                    
                    <div className="space-y-6 text-[#1A1A1A]/70 font-light leading-relaxed mb-16 text-sm">
                      <p>{selectedProduct.longDesc || selectedProduct.desc}</p>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] font-bold mb-12">
                      <div className={`w-2 h-2 rounded-full ${selectedProduct.isBykeaEligible ? 'bg-[#2C3D30]' : 'bg-[#8B5A2B]'}`}></div>
                      <span>Logistics: {selectedProduct.isBykeaEligible ? 'Standard Courier Bike' : 'Specialized Fleet Vehicle Required'}</span>
                    </div>

                    {getCityStock(selectedProduct) > 0 ? (
                      <button 
                        onClick={() => { addToCart(selectedProduct); setView('cart'); }}
                        className="w-full bg-[#1A1A1A] hover:bg-[#2C3D30] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-6 transition-colors flex items-center justify-center gap-3"
                      >
                        Add to Order <MoveRight size={14} strokeWidth={1} />
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="w-full bg-[#E5E0D8] text-[#1A1A1A]/50 text-[10px] uppercase tracking-[0.3em] py-6 cursor-not-allowed"
                      >
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
                  <div>
                    <h2 className="text-5xl font-serif mb-4">Your Order</h2>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50">Invoice & Logistics Summary for {selectedCity}</p>
                  </div>
                  <button onClick={() => setView('store')} className="text-[10px] uppercase tracking-[0.2em] hover:opacity-50 transition-opacity">
                    Return to Collection
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="py-32 text-center">
                    <p className="text-2xl font-serif text-[#1A1A1A]/40 mb-8">Your bag contains no items.</p>
                    <button onClick={() => setView('store')} className="text-xs uppercase tracking-[0.2em] border-b border-[#1A1A1A] pb-1 hover:opacity-50 transition-opacity">
                      Explore Botanicals
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-7 space-y-8">
                      {cart.map(item => (
                        <div key={item.id} className="flex gap-8 group">
                          <div className="w-32 aspect-[3/4] bg-[#EBE6E0] flex items-center justify-center text-4xl shrink-0">
                            {item.image}
                          </div>
                          <div className="flex-grow flex flex-col justify-center border-b border-[#E5E0D8] pb-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-serif text-xl">{item.name}</h4>
                              <span className="text-sm tracking-widest">{formatPrice(item.price * item.qty)}</span>
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-4">Qty: {item.qty}</p>
                            <button onClick={() => removeFromCart(item.id)} className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-red-900 transition-colors self-start mt-auto flex items-center gap-1">
                              Remove <Trash2 size={10} strokeWidth={1} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="lg:col-span-5">
                      <div className="bg-[#EBE6E0] p-10 h-fit">
                        <h3 className="text-[10px] uppercase tracking-[0.3em] mb-12 border-b border-[#1A1A1A]/10 pb-4">Summary</h3>
                        
                        <div className="space-y-6 text-sm tracking-widest mb-12">
                          <div className="flex justify-between">
                            <span className="text-[#1A1A1A]/60">Subtotal</span>
                            <span>{formatPrice(cartTotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#1A1A1A]/60">Shipping</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] pt-1">Calculated Upon Delivery</span>
                          </div>
                        </div>
                        
                        {requiresCarDelivery && (
                          <div className="border-l border-[#8B5A2B] pl-4 mb-12">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#8B5A2B] block mb-2 font-bold">Logistics Notice</span>
                            <p className="text-xs leading-relaxed text-[#1A1A1A]/70">This order requires specialized vehicle transport due to item scale or fragility. Custom fleet rates will apply.</p>
                          </div>
                        )}

                        <div className="flex justify-between items-end mb-12 border-t border-[#1A1A1A]/10 pt-8">
                          <span className="text-[10px] uppercase tracking-[0.3em]">Total</span>
                          <span className="text-3xl font-serif">{formatPrice(cartTotal)}</span>
                        </div>

                        <button 
                          onClick={() => setView('checkout')}
                          className="w-full bg-[#1A1A1A] hover:bg-[#2C3D30] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-5 transition-colors flex justify-center items-center gap-3"
                        >
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
                <div className="mb-16 border-b border-[#1A1A1A] pb-8 flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-serif mb-4">Logistics</h2>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50">Delivery & Payment Details</p>
                  </div>
                  <button onClick={() => setView('cart')} className="text-[10px] uppercase tracking-[0.2em] hover:opacity-50 transition-opacity">
                    Return to Bag
                  </button>
                </div>

                <form onSubmit={submitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  <div className="lg:col-span-7 space-y-12">
                    
                    <div className="space-y-8">
                      <h3 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#E5E0D8] pb-4">Client Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <input type="text" name="name" required placeholder="Full Name *" value={checkoutForm.name} onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/30 transition-colors" />
                        <input type="email" name="email" required placeholder="Email Address *" value={checkoutForm.email} onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/30 transition-colors" />
                        <input type="tel" name="phone" required placeholder="Mobile Number *" value={checkoutForm.phone} onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/30 transition-colors md:col-span-2" />
                      </div>
                    </div>

                    <div className="space-y-8">
                      <h3 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#E5E0D8] pb-4">Delivery Coordinates in {selectedCity}</h3>
                      <div className="space-y-8">
                        <input type="text" name="address" required placeholder="Complete Delivery Address *" value={checkoutForm.address} onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/30 transition-colors" />
                        <input type="text" name="locationLink" placeholder="Google Maps Link (Optional)" value={checkoutForm.locationLink} onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/30 transition-colors" />
                        <input type="text" name="instructions" placeholder="Delivery Instructions or Gate Code (Optional)" value={checkoutForm.instructions} onChange={handleCheckoutChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/30 transition-colors" />
                      </div>
                    </div>

                    <div className="space-y-8">
                      <h3 className="text-[10px] uppercase tracking-[0.3em] border-b border-[#E5E0D8] pb-4">Remittance Method</h3>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <label className={`flex-1 border p-6 cursor-pointer transition-colors ${checkoutForm.paymentMethod === 'COD' ? 'border-[#1A1A1A] bg-[#EBE6E0]' : 'border-[#E5E0D8] hover:border-[#1A1A1A]/40'}`}>
                          <input type="radio" name="paymentMethod" value="COD" checked={checkoutForm.paymentMethod === 'COD'} onChange={handleCheckoutChange} className="hidden" />
                          <span className="block text-xs uppercase tracking-[0.2em] font-medium mb-2">Cash on Delivery</span>
                          <span className="block text-xs font-light text-[#1A1A1A]/60">Pay our logistics team upon receipt.</span>
                        </label>
                        <label className={`flex-1 border p-6 cursor-pointer transition-colors ${checkoutForm.paymentMethod === 'TRF' ? 'border-[#1A1A1A] bg-[#EBE6E0]' : 'border-[#E5E0D8] hover:border-[#1A1A1A]/40'}`}>
                          <input type="radio" name="paymentMethod" value="TRF" checked={checkoutForm.paymentMethod === 'TRF'} onChange={handleCheckoutChange} className="hidden" />
                          <span className="block text-xs uppercase tracking-[0.2em] font-medium mb-2">Bank Transfer</span>
                          <span className="block text-xs font-light text-[#1A1A1A]/60">Direct wire transfer before dispatch.</span>
                        </label>
                      </div>

                      {checkoutForm.paymentMethod === 'TRF' && (
                        <div className="p-8 border border-[#E5E0D8] bg-[#EBE6E0]/30 animate-in fade-in slide-in-from-top-4 duration-500">
                          <h4 className="text-[10px] uppercase tracking-[0.3em] mb-4 text-[#1A1A1A]">Payment Verification</h4>
                          <div className="text-sm font-light text-[#1A1A1A]/80 mb-6 leading-loose">
                            Please transfer <span className="font-medium text-[#1A1A1A] tracking-widest">{formatPrice(cartTotal)}</span> to the following account:<br/>
                            <div className="mt-4 bg-white p-6 border border-[#E5E0D8]">
                              <span className="block font-serif text-lg text-[#1A1A1A] mb-1">Bank Al Habib</span>
                              <span className="block">Account Title: Plants & Ceramics</span>
                              <span className="block">IBAN: PK12 BAHL 1234 5678 9012 34</span>
                            </div>
                          </div>
                          <div className="pt-6 border-t border-[#1A1A1A]/10">
                            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium mb-4 text-[#1A1A1A]/60">Upload Transaction Receipt *</label>
                            <div className="flex items-center gap-6">
                              <div className="relative">
                                <button type="button" className="bg-[#1A1A1A] text-[#F7F5F0] hover:bg-[#2C3D30] text-[10px] uppercase tracking-[0.2em] px-8 py-4 transition-colors flex items-center gap-3">
                                  <Camera size={14} strokeWidth={1} /> Choose File
                                </button>
                                <input 
                                  type="file" 
                                  accept="image/*,.pdf" 
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                  onChange={handleFileChange} 
                                  required={checkoutForm.paymentMethod === 'TRF'} 
                                />
                              </div>
                              <span className="text-xs text-[#1A1A1A]/60 italic tracking-wider">
                                {checkoutForm.receipt ? `📎 ${checkoutForm.receipt}` : 'No file selected'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="bg-[#EBE6E0] p-10 h-fit sticky top-32">
                      <h3 className="text-[10px] uppercase tracking-[0.3em] mb-8 border-b border-[#1A1A1A]/10 pb-4">Order Total</h3>
                      <div className="flex justify-between items-end mb-12">
                        <span className="text-[10px] uppercase tracking-[0.3em]">Total</span>
                        <span className="text-3xl font-serif">{formatPrice(cartTotal)}</span>
                      </div>
                      <button type="submit" className="w-full bg-[#1A1A1A] hover:bg-[#2C3D30] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-5 transition-colors flex justify-center items-center gap-3">
                        Authorize Order <MoveRight size={14} strokeWidth={1} />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* VIEW: ORDER SUCCESS */}
            {view === 'order-success' && currentOrder && (
              <div className="max-w-2xl mx-auto px-8 py-32 text-center animate-in fade-in duration-[1500ms]">
                <Check size={48} strokeWidth={0.5} className="mx-auto mb-12 text-[#2C3D30]" />
                <h2 className="text-6xl font-serif mb-8">Acquired.</h2>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-6 border-b border-[#E5E0D8] pb-4 max-w-xs mx-auto">
                  Reference: <span className="text-[#1A1A1A] font-bold">{currentOrder.id}</span>
                </p>
                <p className="text-lg text-[#1A1A1A]/60 font-light mb-16 leading-relaxed">
                  Your selections have been reserved for dispatch in <strong>{currentOrder.city}</strong>.
                  <br/><br/>
                  {currentOrder.customer.paymentMethod === 'COD' 
                    ? `Please prepare ${formatPrice(currentOrder.total)} for Cash on Delivery.`
                    : `Please transfer ${formatPrice(currentOrder.total)} to our provided bank account.`}
                  <br/><br/>A curator will contact you shortly to coordinate the delivery logistics.
                </p>
                
                <button 
                    onClick={() => { setCurrentOrder(null); setView('store'); }}
                    className="text-[10px] uppercase tracking-[0.3em] border-b border-[#1A1A1A] pb-1 hover:opacity-50 transition-opacity"
                >
                  Return to the Collection
                </button>
              </div>
            )}

            {/* VIEW: PLANT GUIDE */}
            {view === 'plant-guide' && (
              <div className="animate-in fade-in duration-[1500ms]">
                <div className="max-w-[90rem] mx-auto px-8 md:px-16 mb-24 md:mb-32 pt-12">
                  <h1 className="text-5xl md:text-8xl font-serif leading-[1.1] tracking-tight mb-8">
                    The Care <br className="hidden md:block"/>Archive.
                  </h1>
                  <div className="w-full h-[1px] bg-[#E5E0D8] mb-12"></div>
                  
                  <div className="max-w-2xl flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-0 top-3 text-[#1A1A1A]/40" size={18} strokeWidth={1} />
                      <input 
                        type="text" 
                        placeholder="Search the archive..." 
                        className="w-full pl-8 pb-3 bg-transparent border-b border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light rounded-none transition-colors"
                        value={guideSearch}
                        onChange={(e) => setGuideSearch(e.target.value)}
                      />
                    </div>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                    <button 
                      onClick={() => fileInputRef.current.click()}
                      className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] hover:text-[#2C3D30] transition-colors whitespace-nowrap pt-2 md:pt-0"
                    >
                      {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} strokeWidth={1} />}
                      {isAnalyzing ? "Analyzing Flora..." : "Visual Identification"}
                    </button>
                  </div>
                </div>

                <div className="max-w-[90rem] mx-auto px-8 md:px-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                  {initialGuides
                    .filter(g => g.name.toLowerCase().includes(guideSearch.toLowerCase()))
                    .map(guide => (
                    <div key={guide.id} className="group border-t border-[#1A1A1A] pt-6">
                      <div className="flex justify-between items-start mb-12">
                        <h3 className="font-serif text-3xl">{guide.name}</h3>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 mt-2">Vol. 0{guide.id}</span>
                      </div>
                      
                      <div className="w-full aspect-square bg-[#EBE6E0] flex items-center justify-center text-8xl mb-12">
                        {guide.image}
                      </div>
                      
                      <div className="space-y-8">
                        <div className="grid grid-cols-3 gap-4 border-b border-[#E5E0D8] pb-8">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40">Light</span>
                          <span className="col-span-2 text-sm leading-relaxed">{guide.sunlight}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 border-b border-[#E5E0D8] pb-8">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40">Water</span>
                          <span className="col-span-2 text-sm leading-relaxed">{guide.water}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40">Curator Note</span>
                          <span className="col-span-2 text-sm leading-relaxed italic text-[#2C3D30]">{guide.tips}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {initialGuides.filter(g => g.name.toLowerCase().includes(guideSearch.toLowerCase())).length === 0 && (
                    <div className="col-span-full text-center py-32">
                      <p className="text-2xl font-serif text-[#1A1A1A]/40">No records found in the archive.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW: ADMIN LOGIN */}
            {view === 'admin-login' && (
              <div className="max-w-md mx-auto px-8 py-32 animate-in fade-in duration-[1000ms]">
                <h2 className="text-4xl font-serif mb-2">Staff Portal.</h2>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40 mb-16 border-b border-[#E5E0D8] pb-8">Authorized Access Only</p>
                
                <form onSubmit={handleLogin} className="space-y-8">
                  <div>
                    <input 
                      type="text" 
                      placeholder="Identification"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-4 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider rounded-none transition-colors placeholder:text-[#1A1A1A]/30"
                      required
                    />
                  </div>
                  <div>
                    <input 
                      type="password" 
                      placeholder="Passcode"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-4 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider rounded-none transition-colors placeholder:text-[#1A1A1A]/30"
                      required
                    />
                  </div>
                  {loginError && <p className="text-red-900 text-[10px] uppercase tracking-[0.2em]">{loginError}</p>}
                  <button 
                    type="submit"
                    className="w-full bg-[#1A1A1A] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-5 mt-8 hover:bg-[#2C3D30] transition-colors"
                  >
                    Authenticate
                  </button>
                </form>
              </div>
            )}

            {/* VIEW: ADMIN PANEL */}
            {view === 'admin-dashboard' && (
              <div className="max-w-[90rem] mx-auto px-8 md:px-16 animate-in fade-in duration-[1000ms]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-[#1A1A1A] pb-8 gap-8">
                  <div>
                    <h2 className="text-5xl font-serif mb-4">Master Ledger</h2>
                    <div className="flex gap-8 text-[10px] uppercase tracking-[0.3em] mt-4">
                      <button onClick={() => setAdminTab('ledger')} className={`pb-2 transition-colors ${adminTab === 'ledger' ? 'text-[#1A1A1A] border-b border-[#1A1A1A]' : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]'}`}>Inventory</button>
                      <button onClick={() => setAdminTab('orders')} className={`pb-2 transition-colors flex items-center gap-2 ${adminTab === 'orders' ? 'text-[#1A1A1A] border-b border-[#1A1A1A]' : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]'}`}>
                        Order Manifest 
                        {orders && orders.length > 0 && <span className="bg-[#2C3D30] text-[#F7F5F0] px-1.5 py-0.5 rounded-sm">{orders.length}</span>}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-8 items-center">
                    {adminTab === 'ledger' && (
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }} 
                          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] bg-[#1A1A1A] text-[#F7F5F0] hover:bg-[#2C3D30] px-6 py-3 transition-colors font-medium shadow-sm"
                        >
                          <Plus size={12} strokeWidth={2} /> Add <ChevronDown size={12} strokeWidth={2} className={`transition-transform duration-300 ${showAddMenu ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {showAddMenu && (
                          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#E5E0D8] shadow-xl z-50 flex flex-col py-2 animate-in fade-in zoom-in-95 duration-200">
                            <button onClick={() => { setShowCityModal(true); setShowAddMenu(false); }} className="text-left px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#F7F5F0] transition-colors border-b border-[#E5E0D8]/50">
                              New City Region
                            </button>
                            <button onClick={() => { setShowCategoryModal(true); setShowAddMenu(false); }} className="text-left px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#F7F5F0] transition-colors border-b border-[#E5E0D8]/50">
                              New Category
                            </button>
                            <button onClick={() => { setShowNewEntryModal(true); setShowAddMenu(false); }} className="text-left px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#F7F5F0] transition-colors border-b border-[#E5E0D8]/50">
                              New Product Entry
                            </button>
                            <button onClick={() => { setShowCSVModal(true); setShowAddMenu(false); }} className="text-left px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-[#2C3D30] font-bold hover:bg-[#F7F5F0] transition-colors">
                              Bulk CSV Upload
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <button onClick={() => { setIsAuthenticated(false); setView(typeof window !== 'undefined' && window.location.hostname.startsWith('admin') ? 'admin-login' : 'city-select'); }} className="text-[10px] uppercase tracking-[0.2em] text-[#8B5A2B] hover:opacity-50 transition-opacity">
                      Terminate Session
                    </button>
                  </div>
                </div>

                {/* CSV UPLOAD MODAL */}
                {showCSVModal && (
                  <div className="fixed inset-0 bg-[#F7F5F0]/90 backdrop-blur-sm z-50 flex items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="bg-white border border-[#1A1A1A] max-w-xl w-full p-12 relative shadow-2xl">
                      <button onClick={() => setShowCSVModal(false)} className="absolute top-6 right-6 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A]">Close ✕</button>
                      
                      <h3 className="text-3xl font-serif mb-2">Bulk Integration</h3>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-10 border-b border-[#E5E0D8] pb-6">Upload .CSV catalog file</p>
                      
                      <div className="border-2 border-dashed border-[#1A1A1A]/20 bg-[#EBE6E0]/30 hover:bg-[#EBE6E0]/60 transition-colors p-12 text-center relative group">
                        {isUploadingCSV ? (
                          <div className="flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-[#2C3D30] mb-4" size={32} strokeWidth={1} />
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Parsing & Syncing Catalog...</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-[#1A1A1A] text-[#F7F5F0] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                              <Plus size={20} strokeWidth={1} />
                            </div>
                            <span className="block text-sm font-medium mb-2">Drag and drop your CSV file here</span>
                            <span className="block text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mb-6">or click to browse local files</span>
                            
                            <input type="file" accept=".csv" onChange={handleCSVUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            
                            <div className="text-left text-xs font-light text-[#1A1A1A]/60 bg-white p-4 border border-[#E5E0D8]">
                              <strong>Required CSV Headers:</strong><br/>
                              Name, ImageURL_1, ImageURL_2, ImageURL_3, ShortDesc, LongDesc, Amount, Discount, Sale, Shipping, Category, SubCategory, Stock_Karachi, Stock_Islamabad, Stock_Rawalpindi
                            </div>
                            <button onClick={downloadSampleCSV} className="mt-6 text-[10px] uppercase tracking-[0.2em] text-[#2C3D30] font-bold hover:opacity-50 transition-opacity underline underline-offset-4">
                              Download Sample File
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* NEW CITY MODAL */}
                {showCityModal && (
                  <div className="fixed inset-0 bg-[#F7F5F0]/90 backdrop-blur-sm z-50 flex items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="bg-white border border-[#1A1A1A] max-w-md w-full p-12 relative shadow-2xl">
                      <button onClick={() => setShowCityModal(false)} className="absolute top-6 right-6 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A]">Close ✕</button>
                      
                      <h3 className="text-3xl font-serif mb-2">New Region</h3>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-10 border-b border-[#E5E0D8] pb-6">Add a city to delivery logistics</p>
                      
                      <form onSubmit={submitNewCity}>
                        <input 
                          type="text" 
                          required 
                          placeholder="City Name (e.g., Lahore)" 
                          value={newCityName} 
                          onChange={(e) => setNewCityName(e.target.value)} 
                          className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-4 mb-8 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/40" 
                        />
                        <button type="submit" className="w-full bg-[#1A1A1A] hover:bg-[#2C3D30] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-4 transition-colors flex items-center justify-center gap-2">
                          Add Location <Plus size={12} strokeWidth={1} />
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* NEW CATEGORY MODAL */}
                {showCategoryModal && (
                  <div className="fixed inset-0 bg-[#F7F5F0]/90 backdrop-blur-sm z-50 flex items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="bg-white border border-[#1A1A1A] max-w-md w-full p-12 relative shadow-2xl">
                      <button onClick={() => setShowCategoryModal(false)} className="absolute top-6 right-6 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A]">Close ✕</button>
                      
                      <h3 className="text-3xl font-serif mb-2">New Category</h3>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-10 border-b border-[#E5E0D8] pb-6">Expand your catalog taxonomy</p>
                      
                      <form onSubmit={submitNewCategory}>
                        <input 
                          type="text" 
                          required 
                          placeholder="Category Name (e.g., Rare Succulents)" 
                          value={newCategoryName} 
                          onChange={(e) => setNewCategoryName(e.target.value)} 
                          className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-4 mb-8 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/40" 
                        />
                        <button type="submit" className="w-full bg-[#1A1A1A] hover:bg-[#2C3D30] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] py-4 transition-colors flex items-center justify-center gap-2">
                          Create Category <Plus size={12} strokeWidth={1} />
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* SINGLE NEW ENTRY MODAL */}
                {showNewEntryModal && (
                  <div className="fixed inset-0 bg-[#F7F5F0]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 overflow-y-auto animate-in fade-in duration-500">
                    <div className="bg-white border border-[#1A1A1A] max-w-4xl w-full p-8 md:p-12 relative shadow-2xl my-auto">
                      <button onClick={() => setShowNewEntryModal(false)} className="absolute top-6 right-6 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A]">Close ✕</button>
                      
                      <h3 className="text-3xl font-serif mb-2">New Botanical Entry</h3>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mb-8 border-b border-[#E5E0D8] pb-6">Individual Catalog Addition</p>
                      
                      <form onSubmit={submitNewEntry} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <input type="text" name="name" required placeholder="Product Name *" value={newEntryForm.name} onChange={handleNewEntryChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/40" />
                          
                          <div className="flex gap-4">
                            <select name="category" value={newEntryForm.category} onChange={handleNewEntryChange} className="w-1/2 bg-transparent border-b border-[#1A1A1A]/20 pb-3 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light text-[#1A1A1A]/60">
                              {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input type="text" name="subCategory" placeholder="Sub-Category" value={newEntryForm.subCategory} onChange={handleNewEntryChange} className="w-1/2 bg-transparent border-b border-[#1A1A1A]/20 pb-3 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/40" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                          <input type="number" name="amount" required placeholder="Amount (PKR) *" value={newEntryForm.amount} onChange={handleNewEntryChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/40" />
                          
                          <div className="flex items-center gap-8">
                            <input type="number" name="discount" placeholder="Discount %" value={newEntryForm.discount} onChange={handleNewEntryChange} className="w-1/2 bg-transparent border-b border-[#1A1A1A]/20 pb-3 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/40" />
                            <div className="flex items-center gap-3 border-b border-[#1A1A1A]/20 pb-3 w-1/2">
                              <input type="checkbox" name="sale" checked={newEntryForm.sale} onChange={handleNewEntryChange} id="sale-checkbox" className="w-4 h-4 accent-[#1A1A1A]" />
                              <label htmlFor="sale-checkbox" className="text-sm tracking-wider font-light text-[#1A1A1A]/60 cursor-pointer">Active Sale</label>
                            </div>
                          </div>
                        </div>

                        {/* Dynamic City Stock Inputs */}
                        <div className="space-y-4">
                          <label className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/60">Regional Inventory Configuration</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-[#EBE6E0]/50 p-6 border border-[#E5E0D8]">
                            {cities.map(city => (
                              <div key={city}>
                                <input 
                                  type="number" 
                                  name={`stock_${city}`} 
                                  placeholder={`${city} Qty *`} 
                                  required 
                                  value={newEntryForm.stock[city] !== undefined ? newEntryForm.stock[city] : ''} 
                                  onChange={handleNewEntryChange} 
                                  className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-2 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-medium placeholder:text-[#1A1A1A]/30" 
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <input type="text" name="image1" placeholder="Image URL 1 / Emoji *" required value={newEntryForm.image1} onChange={handleNewEntryChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/40" />
                          <input type="text" name="image2" placeholder="Image URL 2" value={newEntryForm.image2} onChange={handleNewEntryChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/40" />
                          <input type="text" name="image3" placeholder="Image URL 3" value={newEntryForm.image3} onChange={handleNewEntryChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/40" />
                        </div>

                        <div className="space-y-8">
                          <input type="text" name="shortDesc" required placeholder="Short Description *" value={newEntryForm.shortDesc} onChange={handleNewEntryChange} className="w-full bg-transparent border-b border-[#1A1A1A]/20 pb-3 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/40" />
                          <textarea name="longDesc" placeholder="Long Description / Care Notes..." rows="3" value={newEntryForm.longDesc} onChange={handleNewEntryChange} className="w-full bg-transparent border border-[#1A1A1A]/20 p-4 focus:outline-none focus:border-[#1A1A1A] text-sm tracking-wider font-light placeholder:text-[#1A1A1A]/40 resize-none"></textarea>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center gap-8 pt-6 border-t border-[#E5E0D8]">
                          <div className="flex gap-4 items-center">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/60">Logistics Flag:</span>
                            <select name="shipping" value={newEntryForm.shipping} onChange={handleNewEntryChange} className="bg-transparent border-b border-[#1A1A1A] pb-1 focus:outline-none text-sm tracking-wider font-medium">
                              <option value="Standard">Standard (Courier)</option>
                              <option value="Specialized">Specialized (Fleet)</option>
                            </select>
                          </div>
                          <button type="submit" className="w-full sm:w-auto bg-[#1A1A1A] hover:bg-[#2C3D30] text-[#F7F5F0] text-[10px] uppercase tracking-[0.3em] px-12 py-4 transition-colors flex items-center justify-center gap-2">
                            Append to Ledger <Plus size={12} strokeWidth={1} />
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* TAB: INVENTORY LEDGER */}
                {adminTab === 'ledger' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 border-b border-[#E5E0D8]">
                          <th className="font-normal pb-6 pr-8">Designation</th>
                          <th className="font-normal pb-6 pr-8">Classification</th>
                          <th className="font-normal pb-6 pr-8">Valuation</th>
                          <th className="font-normal pb-6 pr-8">Regional Stock Allocation</th>
                          <th className="font-normal pb-6 text-right">Directives</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {products.map(product => (
                          <tr key={product.id} className="border-b border-[#E5E0D8] group hover:bg-[#EBE6E0]/50 transition-colors">
                            <td className="py-6 pr-8 flex items-center gap-6">
                              <span className="text-2xl bg-[#EBE6E0] w-12 h-12 flex items-center justify-center shrink-0">{product.image}</span>
                              <span className="font-serif text-lg">{product.name}</span>
                            </td>
                            <td className="py-6 pr-8 text-[#1A1A1A]/60 tracking-wider">{product.category.replace("_", " ")}</td>
                            <td className="py-6 pr-8 tracking-widest">{formatPrice(product.price)}</td>
                            <td className="py-6 pr-8">
                              <div className="flex flex-col gap-1 text-xs">
                                {Object.entries(product.stock || {}).map(([city, qty]) => (
                                  <span key={city} className={qty === 0 ? 'text-[#8B5A2B]' : 'text-[#2C3D30]'}>
                                    <span className="text-[9px] uppercase tracking-widest opacity-50 mr-2">{city.substring(0,3)}:</span> 
                                    <strong className="font-medium">{qty}</strong>
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-6 text-right">
                              <div className="flex justify-end gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="text-[#1A1A1A]/40 hover:text-[#1A1A1A]"><Edit size={16} strokeWidth={1}/></button>
                                <button onClick={() => deleteProduct(product.id)} className="text-[#1A1A1A]/40 hover:text-red-900"><Trash2 size={16} strokeWidth={1}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB: ORDER MANIFEST */}
                {adminTab === 'orders' && (
                  <div className="space-y-12 pb-12">
                    {(!orders || orders.length === 0) ? (
                      <p className="text-center py-20 text-2xl font-serif text-[#1A1A1A]/40">No orders recorded in the manifest.</p>
                    ) : (
                      orders.map(order => (
                        <div key={order.id} className="border border-[#E5E0D8] bg-white/40 p-8 md:p-12">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-[#E5E0D8] pb-6 gap-4">
                            <div>
                              <h3 className="text-3xl font-serif">{order.id}</h3>
                              <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/50 mt-2">{order.date} • {order.city}</p>
                            </div>
                            <div className="text-left md:text-right">
                              <span className="block text-3xl font-serif mb-1">{formatPrice(order.total)}</span>
                              <span className={`text-[10px] uppercase tracking-[0.3em] font-bold ${order.customer.paymentMethod === 'TRF' ? 'text-[#8B5A2B]' : 'text-[#2C3D30]'}`}>
                                {order.customer.paymentMethod === 'TRF' ? 'Direct Bank Transfer' : 'Cash on Delivery'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                            <div className="space-y-6">
                              <h4 className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40 border-b border-[#E5E0D8] pb-3">Client Dossier</h4>
                              <div className="text-sm font-light leading-loose space-y-2 text-[#1A1A1A]/80">
                                <p><strong className="font-medium text-[#1A1A1A] uppercase text-[10px] tracking-[0.2em] mr-2">Name:</strong> {order.customer.name}</p>
                                <p><strong className="font-medium text-[#1A1A1A] uppercase text-[10px] tracking-[0.2em] mr-2">Contact:</strong> {order.customer.phone} <span className="mx-2">•</span> {order.customer.email}</p>
                                <p><strong className="font-medium text-[#1A1A1A] uppercase text-[10px] tracking-[0.2em] mr-2">Address:</strong> {order.customer.address}</p>
                                
                                {order.customer.locationLink && (
                                  <p><strong className="font-medium text-[#1A1A1A] uppercase text-[10px] tracking-[0.2em] mr-2">Maps:</strong> 
                                    <a href={order.customer.locationLink} target="_blank" rel="noreferrer" className="text-blue-700 hover:text-blue-900 underline underline-offset-4 decoration-1">
                                      View Pinned Location
                                    </a>
                                  </p>
                                )}
                                
                                {order.customer.instructions && (
                                  <div className="mt-4 bg-[#EBE6E0] p-4 text-xs italic text-[#1A1A1A]/80 border-l border-[#1A1A1A]">
                                    "{order.customer.instructions}"
                                  </div>
                                )}

                                {order.customer.paymentMethod === 'TRF' && (
                                  <p className="mt-4 pt-4 border-t border-[#E5E0D8]">
                                    <strong className="font-medium text-[#1A1A1A] uppercase text-[10px] tracking-[0.2em] mr-2">Attached Receipt:</strong> 
                                    <span className="text-[#8B5A2B] italic flex items-center gap-2 mt-2">
                                      📎 {order.customer.receipt || 'Document verified'}
                                    </span>
                                  </p>
                                )}
                              </div>
                              
                              {order.requiresCarDelivery && (
                                <div className="mt-6 border border-[#8B5A2B] text-[#8B5A2B] p-4 text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-3 bg-[#8B5A2B]/5">
                                  ⚠️ Requires Specialized Vehicle Fleet
                                </div>
                              )}
                            </div>

                            <div className="space-y-6">
                              <h4 className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40 border-b border-[#E5E0D8] pb-3">Procured Items</h4>
                              <ul className="space-y-4">
                                {order.items.map((item, i) => (
                                  <li key={i} className="flex justify-between items-center text-sm border-b border-[#E5E0D8]/50 pb-4 last:border-0">
                                    <span className="flex items-center gap-6">
                                      <span className="text-3xl bg-[#EBE6E0] w-12 h-12 flex items-center justify-center">{item.image}</span>
                                      <span>
                                        <span className="block font-serif text-lg">{item.name}</span>
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50">Qty: {item.qty}</span>
                                      </span>
                                    </span>
                                    <span className="tracking-widest">{formatPrice(item.price * item.qty)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

          </main>

          {/* MINIMALIST FOOTER */}
          {view !== 'admin-login' && view !== 'admin-dashboard' && (
            <footer className="border-t border-[#E5E0D8] py-16 mt-auto">
              <div className="max-w-[90rem] mx-auto px-8 md:px-16 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-2 text-2xl font-serif shrink-0">
                  <Leaf size={24} strokeWidth={0.5} /> P&C.
                </div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40 text-center flex flex-col gap-3">
                  <p>&copy; 2026 Plants & Ceramics. Curated in {selectedCity || 'Pakistan'}.</p>
                  <p className="text-[9px]">
                    Developed & Maintained by <a href="https://doubbletech.com" target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A] hover:text-[#2C3D30] hover:opacity-70 underline underline-offset-4 decoration-[0.5px] transition-all">Doubble Tech</a>
                  </p>
                </div>
              </div>
            </footer>
          )}
        </>
      )}
    </div>
  );
}
