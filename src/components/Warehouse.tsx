import { useEffect, useState, useMemo } from 'react';
import { api, Product, Category } from '../lib/api';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Filter,
  MoreVertical,
  X,
  CheckCircle,
  Smartphone,
  ChevronDown,
  LayoutGrid,
  List,
  Scan,
  History
} from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';

export default function Warehouse() {
  // --- State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState<'search' | 'form'>('search');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); // mostly for desktop preference, mobile is card list always
  const [loading, setLoading] = useState(true);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category_id: '',
    purchase_price: '',
    profit_percent: '',
    selling_price: '', // Allow manual override or auto-calc display
    stock_quantity: '',
    min_stock_alert: '10',
    discount_percent: '0',
    image_url: '',
    unit: 'dona',
  });

  const [pricingType, setPricingType] = useState<'percent' | 'fixed'>('percent');

  // --- Init ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        api.products.list(),
        api.categories.list()
      ]);
      setProducts(prodData || []);
      setCategories(catData || []);
    } catch (e) {
      console.error(e);
      alert("Ma'lumotlarni yuklashda xatolik bo'ldi");
    } finally {
      setLoading(false);
    }
  };

  // --- Logic ---
  const calculateSelling = (purchase: number, profit: number) => {
    return purchase + (purchase * profit / 100);
  };

  const calculateProfitPercent = (purchase: number, selling: number) => {
    if (purchase <= 0) return 0;
    return ((selling - purchase) / purchase) * 100;
  };

  // Pricing Logic Handlers
  const handlePurchasePriceChange = (val: string) => {
    const p = parseFloat(val) || 0;
    setFormData(prev => {
      let newSelling = prev.selling_price;
      let newProfit = prev.profit_percent;

      if (pricingType === 'percent') {
        const m = parseFloat(prev.profit_percent) || 0;
        newSelling = calculateSelling(p, m).toString();
      } else {
        const s = parseFloat(prev.selling_price) || 0;
        newProfit = calculateProfitPercent(p, s).toFixed(1);
      }
      return { ...prev, purchase_price: val, selling_price: newSelling, profit_percent: newProfit };
    });
  };

  const handleProfitValueChange = (val: string) => {
    setFormData(prev => {
      const p = parseFloat(prev.purchase_price) || 0;
      let newSelling = prev.selling_price;
      let newProfit = prev.profit_percent;

      if (pricingType === 'percent') {
        newProfit = val;
        const m = parseFloat(val) || 0;
        newSelling = calculateSelling(p, m).toString();
      } else {
        newSelling = val;
        const s = parseFloat(val) || 0;
        newProfit = calculateProfitPercent(p, s).toFixed(1);
      }
      return { ...prev, profit_percent: newProfit, selling_price: newSelling };
    });
  };

  const togglePricingType = (type: 'percent' | 'fixed') => {
    setPricingType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const purchasePrice = parseFloat(formData.purchase_price);
      const sellingPrice = parseFloat(formData.selling_price);
      const profitPercent = parseFloat(formData.profit_percent);

      const productData = {
        name: formData.name,
        barcode: formData.barcode || null,
        category_id: formData.category_id || null,
        purchase_price: purchasePrice,
        profit_percent: profitPercent,
        selling_price: sellingPrice,
        discount_percent: parseFloat(formData.discount_percent) || 0,
        image_url: formData.image_url || null,
        unit: formData.unit,
        stock_quantity: parseFloat(formData.stock_quantity),
        min_stock_alert: parseFloat(formData.min_stock_alert),
      };

      if (editingProduct) {
        await api.products.update(editingProduct.id, productData);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productData, id: p.id, created_at: p.created_at } : p));
      } else {
        await api.products.create(productData);
        loadData();
      }

      closeForm();
    } catch (e: any) {
      alert("Xatolik: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("O'chirmoqchimisiz?")) return;
    try {
      await api.products.remove(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      alert("Xatolik: " + e.message);
    }
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      barcode: p.barcode || '',
      category_id: p.category_id || '',
      purchase_price: p.purchase_price.toString(),
      profit_percent: p.profit_percent.toString(),
      selling_price: p.selling_price.toString(),
      stock_quantity: p.stock_quantity.toString(),
      min_stock_alert: p.min_stock_alert.toString(),
      discount_percent: (p.discount_percent ?? 0).toString(),
      image_url: p.image_url || '',
      unit: p.unit || 'dona',
    });
    setPricingType('fixed'); // Prefer fixed mode when editing existing
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setPricingType('percent');
    setFormData({
      name: '', barcode: '', category_id: '',
      purchase_price: '', profit_percent: '', selling_price: '',
      stock_quantity: '', min_stock_alert: '10',
      discount_percent: '0', image_url: '', unit: 'dona',
    });
  };

  const handleBarcodeDetected = (code: string) => {
    if (scannerMode === 'search') {
      setSearchTerm(code);
      // Play beep
    } else {
      setFormData(prev => ({ ...prev, barcode: code }));
    }
    setShowScanner(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode?.includes(searchTerm));
      const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
      const matchesStock = !showLowStock || p.stock_quantity <= p.min_stock_alert;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, selectedCategory, showLowStock]);

  const stats = useMemo(() => ({
    total: products.length,
    lowStock: products.filter(p => p.stock_quantity <= p.min_stock_alert).length,
    value: products.reduce((sum, p) => sum + (p.purchase_price * p.stock_quantity), 0)
  }), [products]);

  // Placeholder for history view
  const viewHistory = (p: Product) => {
    alert("Tez kunda: Mahsulot tarixi (ID: " + p.id + ")");
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="text-indigo-600" /> Ombor
              </h1>
              <div className="flex gap-4 text-xs mt-1 text-gray-500 font-medium">
                <span>Jami: {stats.total} xil</span>
                <span className="text-red-500">Kam qolgan: {stats.lowStock}</span>
                <span>Qiymat: {stats.value.toLocaleString()} so'm</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  className="w-full bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-xl py-2 pl-10 pr-10 outline-none transition-all"
                  placeholder="Qidiruv..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <button
                  onClick={() => { setScannerMode('search'); setShowScanner(true); }}
                  className="absolute right-2 top-1.5 p-1 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
                >
                  <Scan size={20} />
                </button>
              </div>
              <button
                onClick={() => { closeForm(); setShowForm(true); }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 whitespace-nowrap"
              >
                <Plus size={20} /> <span className="hidden sm:inline">Qo'shish</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 mt-4 overflow-x-auto pb-2 hide-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedCategory === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              Barchasi
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${selectedCategory === c.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {c.name}
              </button>
            ))}

            <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>

            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showLowStock ? 'bg-red-100 text-red-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              <AlertCircle size={14} /> Kam qolganlar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Yuklanmoqda...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Package size={64} className="mx-auto mb-4 text-gray-300" />
            <h3>Mahsulotlar topilmadi</h3>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Nomi</th>
                    <th className="px-6 py-4">Kategoriya</th>
                    <th className="px-6 py-4 text-right">Kelish narxi</th>
                    <th className="px-6 py-4 text-right">Sotish narxi</th>
                    <th className="px-6 py-4 text-right">Foyda</th>
                    <th className="px-6 py-4 text-center">Qoldiq</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 group transition-colors">
                      <td className="px-6 py-3">
                        <div className="font-bold text-gray-800">{p.name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{p.barcode || '---'}</div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                          {categories.find(c => c.id === p.category_id)?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-gray-600">{p.purchase_price.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right font-bold text-gray-900">{p.selling_price.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-green-600 text-sm">
                        +{(p.selling_price - p.purchase_price).toLocaleString()} <span className="text-xs opacity-70">({p.profit_percent}%)</span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className={`inline-flex flex-col items-center px-2.5 py-1 rounded-lg ${p.stock_quantity <= p.min_stock_alert ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                          <span className="font-bold">{p.stock_quantity}</span>
                          <span className="text-[10px] uppercase font-medium opacity-70">{p.unit}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => viewHistory(p)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg" title="Tarix"><History size={16} /></button>
                          <button onClick={() => handleEdit(p)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Grid/Card View */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              {filteredProducts.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4 active:scale-[0.99] transition-transform" onClick={() => handleEdit(p)}>
                  <div className={`w-2 h-full absolute left-0 top-0 rounded-l-xl ${p.stock_quantity <= p.min_stock_alert ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">{p.name}</h3>
                        <div className="text-xs text-gray-400 font-mono mt-1">{p.barcode || 'No Barcode'}</div>
                      </div>
                      <div className={`text-center px-2 py-1 rounded-lg ${p.stock_quantity <= p.min_stock_alert ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        <div className="text-sm font-bold">{p.stock_quantity}</div>
                        <div className="text-[10px] uppercase font-medium opacity-70">{p.unit}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-end">
                      <div className="text-sm">
                        <div className="text-gray-400 text-xs">Sotish:</div>
                        <div className="font-bold text-indigo-700">{p.selling_price.toLocaleString()} </div>
                      </div>
                    </div>
                    <div className="flex gap-2 text-sm z-10">
                      <button onClick={(e) => { e.stopPropagation(); viewHistory(p); }} className="p-1 text-blue-600 bg-blue-50 rounded"><History size={16} /></button>
                      <div className="text-right">
                        <div className="text-gray-400 text-xs">Foyda:</div>
                        <div className="font-medium text-green-600">{(p.selling_price - p.purchase_price).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Form Modal */}
      {
        showForm && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">{editingProduct ? "Tahrirlash" : "Yangi Mahsulot"}</h2>
                <button onClick={closeForm} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <form id="product-form" onSubmit={handleSubmit} className="space-y-5">
                  {/* Name & Barcode */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Nomi *</label>
                      <input required className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Masalan: Non 600g"
                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Barcode</label>
                      <div className="flex gap-2">
                        <input className="flex-1 border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" placeholder="47800..."
                          value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                        />
                        <button type="button" onClick={() => { setScannerMode('form'); setShowScanner(true); }} className="bg-gray-100 p-2.5 rounded-lg hover:bg-gray-200">
                          <Scan size={20} className="text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Category & Image */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Kategoriya</label>
                      <div className="flex gap-2">
                        <select className="flex-1 border rounded-lg p-2.5 outline-none bg-white"
                          value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                        >
                          <option value="">Tanlanmagan</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button type="button" onClick={async () => {
                          const n = prompt("Kategoriya nomi:");
                          if (n) {
                            const created = await api.categories.create({ name: n });
                            loadData(); // lazy reload
                            setFormData(prev => ({ ...prev, category_id: created.id }));
                          }
                        }} className="bg-indigo-50 text-indigo-600 px-4 rounded-lg font-bold hover:bg-indigo-100">+</button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Rasm URL (Mijozlar uchun)</label>
                      <input className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="https://example.com/image.jpg"
                        value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Narx Siyosati</h3>
                      <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                        <button
                          type="button"
                          onClick={() => togglePricingType('percent')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${pricingType === 'percent' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          FOIZ (%)
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePricingType('fixed')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${pricingType === 'fixed' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          NARX (SM)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Keltirilgan narx</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          className="w-full border rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="0"
                          value={formData.purchase_price}
                          onChange={e => handlePurchasePriceChange(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">
                          {pricingType === 'percent' ? 'Foyda foizi (%)' : 'Sotish narxi (so\'m)'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          className="w-full border-2 border-indigo-100 rounded-lg p-2.5 font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="0"
                          value={pricingType === 'percent' ? formData.profit_percent : formData.selling_price}
                          onChange={e => handleProfitValueChange(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200 mt-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sotish narxi (Natija):</span>
                          <div className="text-2xl font-black text-gray-900 mt-1">
                            {parseFloat(formData.selling_price || '0').toLocaleString()}
                            <span className="text-sm font-medium ml-1 text-gray-400">so'm</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Foyda:</span>
                          <div className="text-sm font-bold text-green-600">
                            {pricingType === 'percent' ?
                              `+${((parseFloat(formData.selling_price) || 0) - (parseFloat(formData.purchase_price) || 0)).toLocaleString()} sum` :
                              `${formData.profit_percent}%`
                            }
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 italic text-center bg-white py-1 rounded border border-dashed border-gray-200">
                        * Bu yerda ko'rsatilgan narx mijozlar ko'radigan asosiy narx hisoblanadi (tahrirlab bo'lmaydi).
                      </p>
                    </div>
                  </div>

                  {/* Stock & Unit */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">O'lchov birligi</label>
                      <select className="w-full border rounded-lg p-2.5 mt-1 outline-none bg-white"
                        value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      >
                        <option value="dona">dona</option>
                        <option value="kg">kg</option>
                        <option value="litr">litr</option>
                        <option value="metr">metr</option>
                        <option value="gram">gram</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Qoldiq</label>
                      <input type="number" step="0.001" required className="w-full border rounded-lg p-2.5 mt-1" placeholder="0"
                        value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Min. Alert</label>
                      <input type="number" step="0.001" className="w-full border rounded-lg p-2.5 mt-1" placeholder="10"
                        value={formData.min_stock_alert} onChange={e => setFormData({ ...formData, min_stock_alert: e.target.value })}
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-5 border-t bg-gray-50 flex gap-4">
                <button onClick={closeForm} type="button" className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Bekor qilish</button>
                <button form="product-form" type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors">
                  {editingProduct ? "Saqlash" : "Qo'shish"}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onBarcodeDetected={handleBarcodeDetected}
      />

    </div >
  );
}
