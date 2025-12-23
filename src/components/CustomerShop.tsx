import { useEffect, useState, useMemo, useCallback } from 'react';
import { api, Product, Category, Promotion, Bundle, BundleItem, PromotionProduct } from '../lib/api';
import SEO from './SEO';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Package,
  Send,
  CheckCircle,
  Percent,
  Zap,
  Gift,
  Clock,
  X,
  ChevronRight,
  ShoppingBag
} from 'lucide-react';

// --- Types ---
type CartItemType = 'product' | 'bundle';

interface CartItem {
  id: string; // Product ID or Bundle ID
  type: CartItemType;
  quantity: number;
  data: Product | (Bundle & { items: BundleItem[] });
}

// --- Helper Functions ---
const isValidPromo = (p: Promotion) => {
  if (!p.active) return false;
  const now = new Date();
  if (p.start_at && new Date(p.start_at) > now) return false;
  if (p.end_at && new Date(p.end_at) < now) return false;
  return true;
};

interface CustomerShopProps {
  slug?: string | null;
}

export default function CustomerShop({ slug }: CustomerShopProps) {
  // --- State ---
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<(Promotion & { products: PromotionProduct[] })[]>([]);
  const [bundles, setBundles] = useState<(Bundle & { items: BundleItem[] })[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  // --- Derived State & Logic Helpers ---
  const productMap = useMemo(() => Object.fromEntries(products.map(p => [p.id, p])), [products]);

  // Calculate Product Price (considering promotions)
  const getProductPriceInfo = useCallback((product: Product) => {
    let finalPrice = product.selling_price;
    let hasDiscount = false;
    let discountLabel = '';
    let discountColor = 'bg-red-500';

    const activePromo = promotions.find(p =>
      isValidPromo(p) && p.products.some(pp => pp.product_id === product.id)
    );

    if (activePromo) {
      hasDiscount = true;
      if (activePromo.discount_type === 'percent') {
        const val = activePromo.discount_value;
        finalPrice = Math.round(product.selling_price * (1 - val / 100));
        discountLabel = `-${val}%`;
        discountColor = 'bg-pink-600';
      } else {
        const val = activePromo.discount_value;
        finalPrice = Math.max(0, product.selling_price - val);
        discountLabel = `-${val.toLocaleString()} so'm`;
        discountColor = 'bg-pink-600';
      }
    } else if (product.discount_percent > 0) {
      hasDiscount = true;
      finalPrice = Math.round(product.selling_price * (1 - product.discount_percent / 100));
      discountLabel = `-${product.discount_percent}%`;
    }

    return {
      originalPrice: product.selling_price,
      finalPrice,
      hasDiscount,
      discountLabel,
      discountColor,
      promoName: activePromo?.name
    };
  }, [promotions]);

  const getBundleInfo = useCallback((bundle: Bundle & { items: BundleItem[] }) => {
    const realValue = bundle.items.reduce((sum, item) => {
      const p = productMap[item.product_id];
      return sum + (p ? p.selling_price * item.quantity : 0);
    }, 0);

    const savings = realValue - bundle.price;
    const savingsPercent = realValue > 0 ? Math.round((savings / realValue) * 100) : 0;

    return { realValue, savings, savingsPercent };
  }, [productMap]);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => {
      if (item.type === 'product') {
        const p = item.data as Product;
        const { finalPrice } = getProductPriceInfo(p);
        return sum + (finalPrice * item.quantity);
      } else {
        const b = item.data as Bundle;
        return sum + (b.price * item.quantity);
      }
    }, 0);
  }, [cart, getProductPriceInfo]);

  // --- Telegram Web App Integration ---
  useEffect(() => {
    if (slug && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      try { tg.expand(); } catch (e) { console.warn("TG Expand error", e); }
      try { tg.setHeaderColor('#4f46e5'); } catch (e) { console.warn("TG Header Color error", e); }
    }
  }, [slug]);

  const handleMainButtonClick = useCallback(() => {
    if (showCart) {
      setShowCart(false);
      setShowCheckout(true);
    } else if (showCheckout) {
      // Trigger order submission from the form
      const form = document.getElementById('checkout-form') as HTMLFormElement;
      if (form) form.requestSubmit();
    } else {
      setShowCart(true);
    }
  }, [showCart, showCheckout]);

  const handleBackButtonClick = useCallback(() => {
    if (showCheckout) {
      setShowCheckout(false);
      setShowCart(true);
    } else if (showCart) {
      setShowCart(false);
    }
  }, [showCart, showCheckout]);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (slug && tg) {
      // Clear previous handlers
      try { tg.MainButton.offClick(handleMainButtonClick); } catch (e) { }
      try { tg.BackButton.offClick(handleBackButtonClick); } catch (e) { }

      if (showCheckout) {
        tg.MainButton.setText("Buyurtmani yuborish");
        tg.MainButton.show();
        try {
          tg.BackButton.show();
          tg.BackButton.onClick(handleBackButtonClick);
        } catch (e) { console.warn("TG BackButton not supported"); }

      } else if (showCart) {
        tg.MainButton.setText("Rasmiylashtirish");
        tg.MainButton.show();
        tg.MainButton.onClick(handleMainButtonClick);

        try {
          tg.BackButton.show();
          tg.BackButton.onClick(handleBackButtonClick);
        } catch (e) { console.warn("TG BackButton not supported"); }

      } else if (cart.length > 0) {
        tg.MainButton.setText(`Savatni ko'rish (${totalAmount.toLocaleString()} so'm)`);
        tg.MainButton.show();
        tg.MainButton.onClick(handleMainButtonClick);
        try { tg.BackButton.hide(); } catch (e) { }
      } else {
        tg.MainButton.hide();
        try { tg.BackButton.hide(); } catch (e) { }
      }
    }
    return () => {
      if (tg) {
        try { tg.MainButton.offClick(handleMainButtonClick); } catch (e) { }
        try { tg.BackButton.offClick(handleBackButtonClick); } catch (e) { }
      }
    };
  }, [cart, totalAmount, slug, showCart, showCheckout, handleMainButtonClick, handleBackButtonClick]);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (slug) {
          // Public Mode - Fetch all data for the public shop
          console.log('[Shop] Loading for slug:', slug);
          const store = await api.shop.getStore(slug);
          console.log('[Shop] Store loaded:', store.name);
          setStoreInfo(store);

          // Fetch other data in parallel but handle errors individually
          const [prodData, catData, promoData, bundleData] = await Promise.allSettled([
            api.shop.getProducts(slug),
            api.shop.getCategories(slug),
            api.shop.getPromotions(slug),
            api.shop.getBundles(slug)
          ]);

          if (prodData.status === 'fulfilled') {
            console.log('[Shop] Products loaded:', prodData.value?.length);
            setProducts(prodData.value || []);
          } else {
            console.error('[Shop] Products load failed', prodData.reason);
          }

          if (catData.status === 'fulfilled') {
            setCategories(catData.value || []);
          }

          if (promoData.status === 'fulfilled') {
            console.log('[Shop] Promotions loaded:', promoData.value?.length);
            setPromotions(promoData.value || []);
          } else {
            console.error('[Shop] Promotions load failed', promoData.reason);
          }

          if (bundleData.status === 'fulfilled') {
            console.log('[Shop] Bundles loaded:', bundleData.value?.length);
            setBundles(bundleData.value || []);
          } else {
            console.error('[Shop] Bundles load failed', bundleData.reason);
          }

        } else {
          // Admin Mode (Authenticated)
          const [prodData, catData] = await Promise.all([
            api.products.list({ inStock: true }),
            api.categories.list()
          ]);
          setProducts(prodData || []);
          setCategories(catData || []);

          // Try Fetch Premium Data
          try {
            const promoData = await api.promotions.list();
            setPromotions(promoData || []);
          } catch (e) { console.warn("Promotions unavailable"); }

          try {
            const bundleData = await api.bundles.list();
            setBundles(bundleData || []);
          } catch (e) { console.warn("Bundles unavailable"); }
        }
      } catch (e) {
        console.error("Failed to load shop data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [slug]);

  // Placeholder removed, everything moved up

  // --- Cart Actions ---
  const addToCart = (item: Product | (Bundle & { items: BundleItem[] }), type: CartItemType) => {
    const id = item.id;
    const existing = cart.find(c => c.id === id && c.type === type);

    // Stock Check Logic
    if (type === 'product') {
      const p = item as Product;
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + 1 > p.stock_quantity) {
        alert("Kechirasiz, ushbu mahsulotdan boshqa qolmadi.");
        return;
      }
    } else {
      // Bundle Stock Check (Complex: check all items)
      const b = item as Bundle & { items: BundleItem[] };
      const currentBundleQty = existing ? existing.quantity : 0;
      const newBundleQty = currentBundleQty + 1;

      for (const bundleItem of b.items) {
        const p = productMap[bundleItem.product_id];
        if (!p) continue; // Skip unknown products, or block?
        // We must also check if this product is in cart individually? 
        // For simplicity, let's just check bundle feasibility roughly
        if (p.stock_quantity < bundleItem.quantity * newBundleQty) {
          alert(`"${p.name}" mahsuloti yetarli emas (To'plam uchun)`);
          return;
        }
      }
    }

    if (existing) {
      setCart(cart.map(c => c.id === id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { id, type, quantity: 1, data: item }]);
    }
    // setShowCart(true); // Removed auto-open behavior
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        // Add basic stock check here if delta > 0
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotal = () => totalAmount;

  // --- Checkout Logic ---
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    try {
      const orderItems: { product_id: string; quantity: number; price: number; total: number }[] = [];
      let totalCalculated = 0;

      // Process Cart Items
      for (const item of cart) {
        if (item.type === 'product') {
          const p = item.data as Product;
          const { finalPrice } = getProductPriceInfo(p);
          orderItems.push({
            product_id: p.id,
            quantity: item.quantity,
            price: finalPrice,
            total: finalPrice * item.quantity
          });
          totalCalculated += finalPrice * item.quantity;
        } else {
          // Decompose Bundle
          const b = item.data as Bundle & { items: BundleItem[] };
          const bundleQty = item.quantity;
          const bundlePrice = b.price;

          // Calculate distribution weights based on selling_price
          const bundleItemsInfo = b.items.map(bi => {
            const p = productMap[bi.product_id];
            const basePrice = p ? p.selling_price : 0;
            const totalBase = basePrice * bi.quantity;
            return { ...bi, totalBase };
          });

          const totalRefValue = bundleItemsInfo.reduce((s, i) => s + i.totalBase, 0);

          // Normal case: Distribute bundlePrice proportional to totalBase
          bundleItemsInfo.forEach((bi) => {
            const ratio = totalRefValue > 0 ? bi.totalBase / totalRefValue : (1 / bundleItemsInfo.length);
            const itemTotalForOneBundle = bundlePrice * ratio;
            const unitPrice = itemTotalForOneBundle / bi.quantity;

            const totalForItem = unitPrice * bi.quantity * bundleQty;

            orderItems.push({
              product_id: bi.product_id,
              quantity: bi.quantity * bundleQty,
              price: Math.round(unitPrice),
              total: Math.round(totalForItem)
            });
          });

          totalCalculated += bundlePrice * bundleQty;
        }
      }

      if (slug) {
        await api.shop.createOrder(slug, {
          customer: {
            name: customerInfo.name,
            phone: customerInfo.phone,
            address: customerInfo.address
          },
          items: orderItems.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          notes: customerInfo.notes
        });
      } else {
        await api.orders.create({
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          total_amount: Math.round(calculateTotal()),
          items: orderItems,
          notes: customerInfo.notes,
          status: 'pending'
        });
      }

      setOrderSuccess(true);
      setCart([]);
      setCustomerInfo({ name: '', phone: '', address: '', notes: '' });
      setShowCheckout(false);
      setTimeout(() => setOrderSuccess(false), 5000);

    } catch (e: any) {
      alert("Buyurtma berishda xatolik: " + e.message);
    }
  };

  // --- Filtering ---
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;

    let matchesPromotion = true;
    if (selectedPromotionId) {
      const promo = promotions.find(pr => pr.id === selectedPromotionId);
      matchesPromotion = promo ? promo.products.some(pp => pp.product_id === p.id) : false;
    }

    return matchesSearch && matchesCategory && matchesPromotion;
  });

  const activePromotions = promotions.filter(isValidPromo);
  const activeBundles = bundles.filter(b => b.active);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <SEO
        title={storeInfo?.name || "Market"}
        description={storeInfo ? `${storeInfo.name} onlayn do'koni. Barcha mahsulotlar eng arzon narxda.` : "Onlayn Do'kon"}
        storeName={storeInfo?.name}
        url={window.location.href}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Store",
          "name": storeInfo?.name || "Dookon Store",
          "description": "Onlayn do'kon",
          "image": "https://dookon.uz/og-image.jpg"
        }}
      />

      {/* Sticky Modern Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none text-gray-900 tracking-tight">
                {storeInfo?.name || 'Dookon'}
              </h1>
              <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">
                {slug ? 'Online Market' : 'Market'}
              </p>
            </div>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-lg mx-8 text-sm">
            <div className="relative group">
              <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input
                className="w-full bg-gray-100 border-transparent rounded-xl py-2.5 pl-10 pr-4 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="Mahsulotlarni qidirish..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={() => setShowCart(true)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group"
          >
            <div className="relative">
              <ShoppingCart size={26} className="text-gray-600 group-hover:text-indigo-600 transition-colors" />
              {cart.reduce((s, i) => s + i.quantity, 0) > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Mobile Search Bar (only visible on mobile) */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              className="w-full bg-gray-100 border-transparent rounded-xl py-2 pl-10 pr-4 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* --- HERO SECTION (Promotions) --- */}
      {activePromotions.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="text-yellow-500 fill-current" />
            Qaynoq Aksiyalar
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
            {activePromotions.map(promo => (
              <div key={promo.id} className="snap-center shrink-0 w-80 md:w-96 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Percent size={120} />
                </div>
                <div className="relative z-10">
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold inline-block mb-3 border border-white/10">
                    {promo.discount_type === 'percent' ? 'Chegirma' : 'Super narx'}
                  </div>
                  <h3 className="text-2xl font-bold mb-1 leading-tight">{promo.name}</h3>
                  <p className="text-white/80 text-sm mb-4 line-clamp-2">{promo.description || "Shoshiling! Vaqt cheklangan."}</p>

                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-4xl font-black tracking-tighter">
                        {promo.discount_type === 'percent' ? `${promo.discount_value}%` : `${promo.discount_value.toLocaleString()}`}
                        <span className="text-lg font-normal opacity-80 ml-1">{promo.discount_type === 'percent' ? 'OFF' : "so'm"}</span>
                      </div>
                      <div className="text-xs opacity-75 mt-1 flex items-center gap-1">
                        <Clock size={12} />
                        {promo.end_at ? new Date(promo.end_at).toLocaleDateString() + " gacha" : "Doimiy"}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const pBox = document.getElementById('products-grid');
                        pBox?.scrollIntoView({ behavior: 'smooth' });
                        setSelectedPromotionId(promo.id);
                        setSelectedCategory('all');
                        setSearchTerm('');
                      }}
                      className="bg-white text-indigo-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg"
                    >
                      Ko'rish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- BUNDLES SECTION --- */}
      {activeBundles.length > 0 && (
        <div className="bg-white py-8 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                  <Gift className="text-pink-500" />
                  Maxsus To'plamlar
                </h2>
                <p className="text-gray-500 text-sm mt-1">To'plamda xarid qiling va tejang</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 border rounded-full hover:bg-gray-50"><ChevronRight size={20} /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeBundles.map(bundle => {
                const { realValue, savingsPercent } = getBundleInfo(bundle);

                return (
                  <div key={bundle.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-xl transition-shadow bg-gradient-to-b from-white to-gray-50/50 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{bundle.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">-{savingsPercent}% Tejaldi</span>
                          <span className="text-gray-400 text-xs line-through">{realValue.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-indigo-600">{bundle.price.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">so'm / to'plam</div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 mb-6">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Tarkibi:</div>
                      {bundle.items.slice(0, 3).map(item => (
                        <div key={item.id} className="flex items-center gap-3 text-sm text-gray-600 bg-white p-2 rounded border border-gray-100 shadow-sm">
                          <div className="bg-gray-100 h-8 w-8 rounded flex items-center justify-center text-gray-400 shrink-0">
                            <Package size={14} />
                          </div>
                          <div className="truncate flex-1 font-medium">{productMap[item.product_id]?.name}</div>
                          <div className="text-gray-400 text-xs font-bold">x{item.quantity}</div>
                        </div>
                      ))}
                      {bundle.items.length > 3 && (
                        <div className="text-xs text-center text-gray-400 italic">+ yana {bundle.items.length - 3} ta</div>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(bundle, 'bundle')}
                      className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                    >
                      <ShoppingCart size={18} />
                      To'plamni olish
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- PRODUCTS SECTION --- */}
      <div className="max-w-7xl mx-auto px-4 py-8" id="products-grid">
        {/* Categories Filter */}
        <div className="flex gap-2 overflow-x-auto pb-6 hide-scrollbar mb-2">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedPromotionId(null);
            }}
            className={`px-5 py-2.5 rounded-full font-semibold whitespace-nowrap transition-all text-sm border ${(selectedCategory === 'all' && !selectedPromotionId)
              ? 'bg-gray-900 text-white border-gray-900 shadow-lg'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
          >
            Barchasi
          </button>

          {selectedPromotionId && (
            <button
              onClick={() => setSelectedPromotionId(null)}
              className="px-5 py-2.5 rounded-full font-semibold whitespace-nowrap transition-all text-sm border bg-indigo-600 text-white border-indigo-600 shadow-lg flex items-center gap-2"
            >
              <Zap size={14} className="fill-current" />
              {promotions.find(p => p.id === selectedPromotionId)?.name}
              <X size={14} />
            </button>
          )}

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                // Maybe clear promo filter when category is picked? 
                // Or keep it? Let's clear promo if it's not in that category.
                // For better UX, let's just clear promo filter.
                setSelectedPromotionId(null);
              }}
              className={`px-5 py-2.5 rounded-full font-semibold whitespace-nowrap transition-all text-sm border ${selectedCategory === cat.id
                ? 'bg-gray-900 text-white border-gray-900 shadow-lg'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {filteredProducts.map(product => {
            const { finalPrice, originalPrice, hasDiscount, discountLabel, discountColor, promoName } = getProductPriceInfo(product);
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex flex-col relative">
                {/* Badges */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                  {hasDiscount && (
                    <span className={`${discountColor} text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm`}>{discountLabel}</span>
                  )}
                  {promoName && (
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                      <Zap size={10} className="fill-current" /> Aksiya
                    </span>
                  )}
                </div>

                <div className="aspect-square bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=' + encodeURIComponent(product.name);
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <Package size={48} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Rasm yo'q</span>
                    </div>
                  )}
                  {/* Quick Add Button Overlay */}
                  <button
                    onClick={() => addToCart(product, 'product')}
                    className="absolute bottom-3 right-3 bg-white p-3 rounded-full shadow-lg text-gray-800 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-indigo-600 hover:text-white"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-xs text-gray-400 mb-1">{categories.find(c => c.id === product.category_id)?.name || 'Mahsulot'}</div>
                  <h3 className="font-bold text-gray-800 leading-tight mb-2 line-clamp-2 flex-1" title={product.name}>{product.name}</h3>

                  <div className="mt-auto">
                    {hasDiscount && (
                      <div className="text-xs text-gray-400 line-through decoration-red-400">{originalPrice.toLocaleString()}</div>
                    )}
                    <div className="flex justify-between items-end">
                      <div className={`font-black text-lg ${hasDiscount ? 'text-red-600' : 'text-gray-900'}`}>
                        {finalPrice.toLocaleString()} <span className="text-[10px] font-bold text-gray-400 uppercase">so'm / {product.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-24 opacity-60">
            <Search size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-600">Hech narsa topilmadi</h3>
            <p className="text-gray-400">Qidiruv so'zini o'zgartirib ko'ring</p>
          </div>
        )}
      </div>

      {/* --- CART DRAWER --- */}
      {showCart && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowCart(false)}></div>
          <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="text-indigo-600" /> Savatcha
              </h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center space-y-4">
                  <ShoppingBag size={80} className="stroke-1 opacity-20" />
                  <p className="text-lg font-medium">Savatchangiz bo'sh</p>
                  <button onClick={() => setShowCart(false)} className="text-indigo-600 font-bold hover:underline">Xarid qilish</button>
                </div>
              ) : (
                cart.map(item => {
                  const isBundle = item.type === 'bundle';
                  const name = isBundle ? (item.data as Bundle).name : (item.data as Product).name;
                  const price = isBundle ? (item.data as Bundle).price : getProductPriceInfo(item.data as Product).finalPrice;
                  const img = !isBundle && (item.data as Product).image_url;

                  return (
                    <div key={`${item.type}_${item.id}`} className="flex gap-4 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 p-2 overflow-hidden">
                        {isBundle ? <Gift className="text-pink-500" /> : (
                          img ? <img src={img} className="w-full h-full object-contain" /> : <Package className="text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-gray-800 text-sm line-clamp-2">{name}</h4>
                            <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                          </div>
                          {isBundle && <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded font-bold uppercase">To'plam</span>}
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-md transition-colors"><Minus size={14} /></button>
                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-md transition-colors"><Plus size={14} /></button>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">{price.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-5 border-t bg-gray-50 space-y-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Jami:</span>
                <span>{totalAmount.toLocaleString()} so'm</span>
              </div>
              <button
                onClick={() => {
                  setShowCart(false);
                  setShowCheckout(true);
                }}
                disabled={cart.length === 0}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                Rasmiylashtirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CHECKOUT DRAWER --- */}
      {showCheckout && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowCheckout(false)}></div>
          <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="text-green-600" /> Rasmiylashtirish
              </h2>
              <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ismingiz *</label>
                  <input
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Ismingizni kiriting"
                    value={customerInfo.name}
                    onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Telefon raqamingiz *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-400 font-bold">+998</span>
                    <input
                      required
                      type="tel"
                      className="w-full p-3 pl-14 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                      placeholder="90 123 45 67"
                      value={customerInfo.phone}
                      onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Manzil (ixtiyoriy)</label>
                  <textarea
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-24"
                    placeholder="Yetkazib berish manzili..."
                    value={customerInfo.address}
                    onChange={e => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Izoh (ixtiyoriy)</label>
                  <textarea
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-20"
                    placeholder="Qo'shimcha izohlar..."
                    value={customerInfo.notes}
                    onChange={e => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                  />
                </div>
              </form>
            </div>

            <div className="p-5 border-t bg-gray-50 space-y-3">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Mahsulotlar:</span>
                <span>{cart.reduce((s, i) => s + i.quantity, 0)} ta</span>
              </div>
              <div className="flex justify-between items-center text-xl font-black text-gray-900">
                <span>Jami to'lov:</span>
                <span>{totalAmount.toLocaleString()} so'm</span>
              </div>
              <button
                type="submit"
                form="checkout-form"
                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Send size={20} />
                Buyurtma berish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100 animate-bounce-in">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Buyurtma Qabul Qilindi!</h2>
            <p className="text-gray-500 mb-6">Sizning buyurtmangiz muvaffaqiyatli yuborildi. Tez orada operatorlarimiz siz bilan bog'lanishadi.</p>
            <button
              onClick={() => setOrderSuccess(false)}
              className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Yopish
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
