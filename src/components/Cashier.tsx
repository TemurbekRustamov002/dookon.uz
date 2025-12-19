import { useEffect, useState } from 'react';
import { api, Product, Bundle, BundleItem, Promotion, PromotionProduct, Category, Customer, Debt } from '../lib/api';
import {
  ShoppingCart,
  Trash2,
  CreditCard,
  Banknote,
  UserX,
  Printer,
  Smartphone,
  Search,
  Menu,
  Plus,
  Minus,
  LayoutGrid,
  List,
  Filter,
  User,
  CheckCircle
} from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import ToastContainer, { useToast } from './Toast';

interface CartItem {
  product: Product;
  quantity: number | string; // Allow string to support "1." or empty input
}

export default function Cashier() {
  const { toasts, addToast, removeToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<(Promotion & { products: PromotionProduct[] })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeDebts, setActiveDebts] = useState<Debt[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcode, setBarcode] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [cashierName, setCashierName] = useState('');
  const [paymentType, setPaymentType] = useState<'naqd' | 'karta' | 'qarz'>('naqd');
  const [storeSettings, setStoreSettings] = useState<any>(null); // Store settings for receipt

  // Debt/Customer State
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [cashReceived, setCashReceived] = useState<string>('');

  const [showPayment, setShowPayment] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products'); // For mobile view

  useEffect(() => {
    loadData();
    const savedCashier = localStorage.getItem('cashier_name');
    if (savedCashier) setCashierName(savedCashier);
  }, []);

  useEffect(() => {
    if (barcode.length > 2) searchByBarcode(barcode);
  }, [barcode]);

  const loadData = async () => {
    try {
      // Promotions might fail if plan is STANDARD (403 Forbidden)
      // We handle it gracefully
      let promo: (Promotion & { products: PromotionProduct[] })[] = [];
      try {
        promo = await api.promotions.list();
      } catch (e) {
        console.warn("Promotions restricted or failed, skipping:", e);
      }

      const [prod, cats, custs, debts, settings] = await Promise.all([
        api.products.list({ inStock: true }),
        api.categories.list(),
        api.customers.list(),
        api.debts.list('active'),
        api.settings.get().catch(() => null) // Handle error/missing settings gracefully
      ]);
      setProducts(prod || []);
      setPromotions(promo || []);
      setCategories(cats || []);
      setCustomers(custs || []);
      setActiveDebts(debts || []);
      setStoreSettings(settings);
    } catch (e) {
      console.error(e);
      addToast('Ma\'lumotlarni yuklashda xatolik yuz berdi', 'error');
    }
  };

  const searchByBarcode = async (code: string) => {
    const product = products.find(p => p.barcode === code);
    if (product) {
      addToCart(product);
      setBarcode('');
      // Play beep sound?
    } else {
      addToast(`Bunday shtrix-kodli mahsulot topilmadi: ${code} `, 'warning');
    }
  };

  const getEffectivePrice = (p: Product) => {
    let price = p.selling_price;
    // Apply discount from product itself
    if (p.discount_percent) {
      price = Math.round(price * (1 - p.discount_percent / 100));
    }

    // Apply active promotions
    const now = new Date();
    const activePromos = promotions.filter(promo => {
      if (!promo.active) return false;
      if (promo.start_at && new Date(promo.start_at) > now) return false;
      if (promo.end_at && new Date(promo.end_at) < now) return false;
      return promo.products.some(pp => pp.product_id === p.id);
    });

    for (const promo of activePromos) {
      const pp = promo.products.find(x => x.product_id === p.id)!;
      const type = pp.override_discount_type ?? promo.discount_type;
      const val = pp.override_discount_value ?? promo.discount_value;

      const promoPrice = type === 'percent'
        ? Math.round(p.selling_price * (1 - val / 100))
        : Math.max(0, p.selling_price - val);

      price = Math.min(price, promoPrice);
    }
    return Math.max(0, price);
  };

  const addToCart = (product: Product) => {
    // Stock Validation
    if (product.stock_quantity <= 0) {
      addToast(`"${product.name}" omborda qolmagan!`, 'error');
      return;
    }

    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      // Just add 1. If it was string/float, parse it -> add 1 -> store as number
      const currentQty = parseFloat(existing.quantity.toString()) || 0;
      const newQty = currentQty + 1;

      // Use a small epsilon or just direct comparison since JS numbers usually handle simple int/small floats okay
      if (newQty > product.stock_quantity) {
        addToast(`Diqqat! "${product.name}"dan bor - yo'g'i ${product.stock_quantity} dona qolgan.`, 'warning');
        return;
      }

      updateQuantity(product.id, newQty);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
      addToast(`${product.name} savatga qo'shildi`, 'success');
    }
    // setActiveTab('cart'); // Optional
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.product.id !== id));
  };

  const updateQuantity = (id: string, qty: number | string) => {
    const item = cart.find(i => i.product.id === id);
    if (!item) return;

    // Check checks if qty is a number
    const proposedQty = parseFloat(qty.toString());

    // Only validate if it's a valid positive number
    // We allow intermediate "1." or "0" for typing, but real check happens on submit or button click usually.
    // However, to prevent user from typing 1000 when stock is 10, we can check.

    if (!isNaN(proposedQty) && proposedQty > item.product.stock_quantity) {
      addToast(`Omborda yetarli emas! Jami: ${item.product.stock_quantity} ${item.product.unit}`, 'error');
      // Do not update state if exceeds
      return;
    }

    setCart(prev => prev.map(item => item.product.id === id ? { ...item, quantity: qty } : item));
  };

  const getQtyNumber = (q: number | string) => {
    const parsed = parseFloat(q.toString());
    return isNaN(parsed) ? 0 : parsed;
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (getEffectivePrice(item.product) * getQtyNumber(item.quantity)), 0);
  };

  const handleCheckout = async () => {
    if (!cashierName) {
      addToast("Iltimos, avval kassir ismini kiriting!", 'warning');
      return;
    }
    if (cart.length === 0) {
      addToast("Savat bo'sh!", 'warning');
      return;
    }

    // Validate debt customer
    if (paymentType === 'qarz') {
      if (!customerName || !customerPhone) {
        addToast("Qarzga savdo qilish uchun mijoz ismi va telefon raqami shart!", 'error');
        return;
      }
      if (!customerName.trim() || !customerPhone.trim()) {
        addToast("Mijoz ma'lumotlari to'liq emas!", 'error');
        return;
      }
    }

    try {
      const totalAmount = calculateTotal();
      const saleNumber = `S${Date.now()}`;

      await api.sales.create({
        sale_number: saleNumber,
        total_amount: totalAmount,
        payment_type: paymentType,
        cashier_name: cashierName,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: getQtyNumber(item.quantity),
          price: getEffectivePrice(item.product),
          total: getEffectivePrice(item.product) * getQtyNumber(item.quantity)
        })),
        debt: paymentType === 'qarz' ? { customer_name: customerName, customer_phone: customerPhone } : undefined
      });

      localStorage.setItem('cashier_name', cashierName);
      addToast("Savdo muvaffaqiyatli amalga oshirildi!", 'success');
      printReceipt(saleNumber, totalAmount);

      setCart([]);
      setShowPayment(false);
      setCustomerName(''); setCustomerPhone(''); setCashReceived(''); setSelectedCustomer(null); setCustomerSearch('');
      loadData();
    } catch (e: any) {
      // Backend returns well-formatted error message now
      const msg = e.response?.data?.message || e.message;
      addToast(`Xatolik: ${msg}`, 'error');
    }
  };

  const printReceipt = (saleNumber: string, total: number) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const content = `
      <html><head><style>
        body { font-family: monospace; max-width: 300px; margin: 0 auto; padding: 10px; }
        .center { text-align: center; }
        .row { display: flex; justify-content: space-between; margin: 5px 0; }
        .divider { border-top: 1px dashed black; margin: 10px 0; }
        .bold { font-weight: bold; }
      </style></head><body>
        <div class="center">
            <h2 style="margin-bottom: 5px;">${storeSettings?.name || 'DOOKON'}</h2>
            ${storeSettings?.address ? `<p style="font-size: 10px;">${storeSettings.address}</p>` : ''}
            ${storeSettings?.receipt_header ? `<p style="font-size: 10px; margin-bottom: 10px;">${storeSettings.receipt_header}</p>` : ''}
            <p>Chek: ${saleNumber}</p>
            <p>${new Date().toLocaleString('uz-UZ')}</p>
            <p>Kassir: ${cashierName}</p>
        </div>
        <div class="divider"></div>
        ${cart.map(i => `
            <div class="row">
                <span>${i.product.name}</span>
            </div>
            <div class="row">
                <span>${getQtyNumber(i.quantity)} x ${getEffectivePrice(i.product).toLocaleString()}</span>
                <span class="bold">${(getQtyNumber(i.quantity) * getEffectivePrice(i.product)).toLocaleString()}</span>
            </div>
        `).join('')}
        <div class="divider"></div>
        <div class="row bold">
            <span>JAMI:</span>
            <span>${total.toLocaleString()} so'm</span>
        </div>
        ${storeSettings?.receipt_footer ? `<div class="center" style="margin-top: 15px; font-size: 10px;"><p>${storeSettings.receipt_footer}</p></div>` : ''}
        <div class="center" style="margin-top: 20px; font-size: 12px;">
            <p>${storeSettings?.receipt_footer || 'Xaridingiz uchun rahmat!'}</p>
        </div>
        <script>window.print(); setTimeout(() => window.close(), 500);</script>
      </body></html>
    `;
    w.document.write(content);
    w.document.close();
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const total = calculateTotal();

  // Filter customers for debt search
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  ).slice(0, 5); // Limit to 5 results

  const getCustomerDebt = (phone: string) => {
    // Find debt by customer phone, assuming customer phone is unique identifier for debt merging
    const debt = activeDebts.find(d => d.customer_phone === phone);
    return debt ? debt.remaining_amount : 0;
  };

  const handleCustomerSelect = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setCustomerSearch(''); // Clear search to hide list
  };

  return (
    <div className="h-[calc(100vh-64px)] md:h-screen flex flex-col md:flex-row bg-slate-100 overflow-hidden font-sans relative">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* LEFT: PRODUCTS GRID */}
      <div className={`flex-1 flex flex-col h-full bg-slate-50 ${activeTab === 'cart' ? 'hidden md:flex' : 'flex'}`}>
        {/* Top Bar Check */}
        <div className="bg-white border-b shadow-sm z-10 sticky top-0">
          <div className="p-4 flex gap-3 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Qidiruv (Nomi yoki Barcode)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowBarcodeScanner(true)}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
            >
              <Smartphone size={20} />
            </button>
          </div>

          {/* Category Filter - Scrollable */}
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${selectedCategory === 'all' ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              Barchasi
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${selectedCategory === c.id ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 content-start grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-24 md:pb-4">
          {filteredProducts.map(product => {
            const price = getEffectivePrice(product);
            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all text-left flex flex-col h-full group active:scale-[0.98] duration-100"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-800 line-clamp-2">{product.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">{product.barcode || '---'}</div>
                  </div>
                  <div className={`text-center px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm ${product.stock_quantity <= product.min_stock_alert ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {product.stock_quantity} {product.unit}
                  </div>
                </div>
                <div className="mt-auto">
                  {product.discount_percent ? (
                    <div className="text-xs text-gray-400 line-through">{product.selling_price.toLocaleString()}</div>
                  ) : null}
                  <div className="text-indigo-600 font-bold text-lg">{price.toLocaleString()}</div>
                </div>
              </button>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-400 flex flex-col items-center">
              <Search size={48} className="opacity-20 mb-2" />
              <p>Mahsulotlar topilmadi</p>
            </div>
          )}
        </div>

        {/* Mobile Bottom Float for Cart View Toggle */}
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
          <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center backdrop-blur-md bg-opacity-90 active:scale-[0.99] transition-transform" onClick={() => setActiveTab('cart')}>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Savatda {cart.length} mahsulot</span>
              <span className="font-bold text-xl">{total.toLocaleString()} so'm</span>
            </div>
            <div className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
              O'tish <ShoppingCart size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: CART AND CHECKOUT */}
      <div className={`w-full md:w-96 bg-white border-l shadow-xl flex flex-col z-20 absolute md:relative inset-0 ${activeTab === 'products' ? 'hidden md:flex' : 'flex'}`}>
        {/* Mobile Cart Header */}
        <div className="md:hidden p-4 border-b flex items-center justify-between bg-white sticky top-0 z-30">
          <button onClick={() => setActiveTab('products')} className="text-gray-600 font-medium flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded-lg">
            ← Mahsulotlar
          </button>
          <h2 className="font-bold text-lg">Savat</h2>
          <button className="text-red-500 p-2 hover:bg-red-50 rounded-lg" onClick={() => setCart([])}><Trash2 size={20} /></button>
        </div>

        {/* Desktop Cart Header */}
        <div className="hidden md:flex p-4 border-b bg-slate-50 justify-between items-center">
          <h2 className="font-bold text-lg flex items-center gap-2"> <ShoppingCart size={20} /> Savat </h2>
          <button onClick={() => setCart([])} title="Tozalash" className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
        </div>

        <div className="p-4 bg-slate-50 border-b space-y-2">
          <input
            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Kassir Ismi (majburiy)..."
            value={cashierName}
            onChange={e => setCashierName(e.target.value)}
          />
        </div>

        {/* Cart List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white pb-24 md:pb-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
              <div className="bg-gray-50 p-6 rounded-full rotate-12">
                <ShoppingCart size={48} className="opacity-20" />
              </div>
              <p className="font-medium">Savat bo'sh</p>
              <p className="text-xs max-w-[200px] text-center opacity-70">Mahsulotlarni qo'shish uchun ro'yxatdan tanlang yoki skanerlang</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow relative group">
                <button onClick={() => removeFromCart(item.product.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800 truncate">{item.product.name}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">{item.product.unit}</span>
                    <span className="text-indigo-600 font-semibold">{getEffectivePrice(item.product).toLocaleString()} so'm</span>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                    <button
                      onClick={() => {
                        const newQ = getQtyNumber(item.quantity) - 1;
                        if (newQ <= 0) removeFromCart(item.product.id);
                        else updateQuantity(item.product.id, newQ);
                      }}
                      className="p-2 hover:bg-white text-gray-500 transition-colors active:bg-gray-200"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      className="w-16 text-center bg-transparent border-none p-1 text-sm font-bold focus:ring-0 appearance-none"
                      value={item.quantity}
                      step="any"
                      onChange={e => updateQuantity(item.product.id, e.target.value)}
                    />
                    <button
                      onClick={() => updateQuantity(item.product.id, getQtyNumber(item.quantity) + 1)}
                      className="p-2 hover:bg-white text-green-600 transition-colors active:bg-green-50"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Narx</div>
                    <div className="font-bold text-gray-900 text-lg leading-none">{(getEffectivePrice(item.product) * getQtyNumber(item.quantity)).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        <div className="p-4 bg-white border-t space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 sticky bottom-0">
          <div className="flex justify-between items-end">
            <span className="text-gray-500 font-medium">Jami summa:</span>
            <span className="text-3xl font-black text-gray-900 tracking-tight">{total.toLocaleString()}</span>
          </div>
          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-200 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <CreditCard size={20} />
            To'lov (Checkout)
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden animate-slide-up h-[80vh] md:h-auto flex flex-col">
            <div className="p-5 border-b bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-xl text-gray-800">To'lovni tasdiqlash</h3>
              <div className="text-green-600 font-bold text-xl">{total.toLocaleString()}</div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                {([['naqd', 'Naqd', Banknote], ['karta', 'Karta', CreditCard], ['qarz', 'Qarz', UserX]] as const).map(([type, label, Icon]) => (
                  <button
                    key={type}
                    onClick={() => setPaymentType(type)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${paymentType === type ? 'border-green-500 bg-green-50 text-green-700 shadow-sm transform scale-105' : 'border-gray-100 bg-white hover:border-gray-200 text-gray-600'}`}
                  >
                    <Icon className={`mb-2 ${paymentType === type ? 'text-green-600' : 'text-gray-400'}`} size={24} />
                    <span className="text-sm font-bold">{label}</span>
                  </button>
                ))}
              </div>

              {paymentType === 'naqd' && (
                <div className="space-y-2 bg-yellow-50 p-4 rounded-xl border border-yellow-200 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Qabul qilingan summa</label>
                  <input
                    type="number"
                    autoFocus
                    className="w-full p-3 border border-yellow-300 rounded-lg text-2xl font-bold bg-white focus:ring-2 focus:ring-yellow-400 outline-none"
                    placeholder="0"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                  />
                  <div className="flex justify-between text-sm font-medium pt-2">
                    <span className="text-yellow-800">Qaytim:</span>
                    <span className={`text-lg font-bold ${(parseFloat(cashReceived || '0') - total) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {Math.max(0, parseFloat(cashReceived || '0') - total).toLocaleString()} <span className="text-xs">so'm</span>
                    </span>
                  </div>
                </div>
              )}

              {paymentType === 'qarz' && (
                <div className="space-y-3 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-red-800 uppercase tracking-wide flex items-center gap-2">
                    <User size={14} /> Mijozni Tanlash
                  </label>

                  {/* Customer Search */}
                  {!selectedCustomer ? (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          className="w-full pl-10 p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-200 outline-none"
                          placeholder="Ism yoki telefon orqali qidirish..."
                          value={customerSearch}
                          onChange={e => setCustomerSearch(e.target.value)}
                        />
                      </div>
                      {/* Search Results */}
                      {customerSearch && (
                        <div className="absolute top-full left-0 right-0 bg-white border mt-1 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map(c => (
                              <button
                                key={c.id}
                                onClick={() => handleCustomerSelect(c)}
                                className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-0 flex justify-between items-center"
                              >
                                <div>
                                  <div className="font-bold text-gray-800">{c.name}</div>
                                  <div className="text-xs text-gray-500">{c.phone}</div>
                                </div>
                                {(getCustomerDebt(c.phone) > 0) && (
                                  <div className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">
                                    Qarz: {getCustomerDebt(c.phone).toLocaleString()}
                                  </div>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-center text-gray-500 text-sm">
                              Mijoz topilmadi. <br />
                              <span className="text-xs opacity-70">Ma'lumotlarni pastga qo'lda kiriting.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-200 shadow-sm">
                      <div>
                        <div className="font-bold text-gray-800 flex items-center gap-2">
                          {selectedCustomer.name}
                          <CheckCircle size={14} className="text-green-500" />
                        </div>
                        <div className="text-xs text-gray-500">{selectedCustomer.phone}</div>
                      </div>
                      <button onClick={() => { setSelectedCustomer(null); setCustomerName(''); setCustomerPhone(''); }} className="text-xs text-red-500 hover:underline">
                        O'zgartirish
                      </button>
                    </div>
                  )}

                  {/* Manual Inputs / Display */}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-200 outline-none text-sm"
                      placeholder="Mijoz ismi *"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      readOnly={!!selectedCustomer} // Read only if selected from list
                    />
                    <input
                      className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-200 outline-none text-sm"
                      type="tel"
                      placeholder="Telefon *"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      readOnly={!!selectedCustomer}
                    />
                  </div>

                  {/* Debt Calculation Visualization */}
                  {customerPhone && (
                    <div className="bg-white p-3 rounded-lg border border-dashed border-gray-300 space-y-1 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Eski qarz:</span>
                        <span>{getCustomerDebt(customerPhone).toLocaleString()} so'm</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Yangi xarid:</span>
                        <span>+ {total.toLocaleString()} so'm</span>
                      </div>
                      <div className="border-t pt-1 flex justify-between font-bold text-red-600">
                        <span>Jami qarz bo'ladi:</span>
                        <span>{(getCustomerDebt(customerPhone) + total).toLocaleString()} so'm</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 shrink-0">
              <div className="flex gap-3">
                <button onClick={() => setShowPayment(false)} className="flex-1 py-3.5 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors">Bekor qilish</button>
                <button
                  onClick={handleCheckout}
                  className="flex-1 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-xl shadow-green-200 transition-transform active:scale-[0.98]"
                >
                  Tasdiqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onBarcodeDetected={code => { searchByBarcode(code); setShowBarcodeScanner(false); }}
      />
    </div>
  );
}
