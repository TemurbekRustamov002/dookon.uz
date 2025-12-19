import React, { useEffect, useMemo, useState } from 'react';
import { api, Product, Bundle, BundleItem } from '../lib/api';
import {
  Plus,
  Package,
  DollarSign,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Search,
  ShoppingBag,
  MinusCircle,
  PlusCircle,
  Save,
  AlertCircle
} from 'lucide-react';

export default function Bundles() {
  const [bundles, setBundles] = useState<(Bundle & { items: BundleItem[] })[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<Bundle>>({ name: '', price: 0, active: true });

  // Item management in modal
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const [isPremiumRestricted, setIsPremiumRestricted] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setIsPremiumRestricted(false);
    try {
      const p = await api.products.list();
      setProducts(p);

      try {
        const b = await api.bundles.list();
        setBundles(b);
      } catch (err: any) {
        if (err.message && (err.message.includes('403') || err.message.includes('Premium'))) {
          setIsPremiumRestricted(true);
        } else {
          console.error(err);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const productMap = useMemo(() => Object.fromEntries(products.map(p => [p.id, p])), [products]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ name: '', price: 0, active: true });
    setBundleItems([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bundle: Bundle & { items: BundleItem[] }) => {
    setEditingId(bundle.id);
    setForm({ name: bundle.name, price: bundle.price, active: bundle.active });
    setBundleItems(bundle.items);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.price == null) return;

    try {
      if (editingId) {
        await api.bundles.update(editingId, form);
      } else {
        await api.bundles.create(form);
      }
      setIsModalOpen(false);
      await loadAll();
    } catch (error) {
      alert("Xatolik yuz berdi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("To'plamni o'chirasizmi?")) return;
    await api.bundles.remove(id);
    await loadAll();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await api.bundles.update(id, { active: !currentStatus });
    await loadAll();
  };

  // Item Logic
  const handleAddItem = async (productId: string) => {
    if (!editingId) return; // Only in edit mode for simplicity for now
    await api.bundles.addItem(editingId, { product_id: productId, quantity: 1 });
    // Refresh local items
    const updatedBundle = await api.bundles.list(); // Ideally fetch single, but this works
    const current = updatedBundle.find(b => b.id === editingId);
    if (current) setBundleItems(current.items);
    loadAll();
  };

  const handleRemoveItem = async (productId: string) => {
    if (!editingId) return;
    await api.bundles.removeItem(editingId, productId);
    // Refresh local items
    const updatedBundle = await api.bundles.list();
    const current = updatedBundle.find(b => b.id === editingId);
    if (current) setBundleItems(current.items);
    loadAll();
  };

  const handleUpdateQuantity = async (productId: string, newQty: number) => {
    if (!editingId || newQty < 1) return;
    await api.bundles.updateItem(editingId, productId, { quantity: newQty });
    // Refresh local items
    const updatedBundle = await api.bundles.list();
    const current = updatedBundle.find(b => b.id === editingId);
    if (current) setBundleItems(current.items);
    loadAll();
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.barcode && p.barcode.includes(productSearch))
  );

  // Calculate real value of bundle
  const calculateRealValue = (items: BundleItem[]) => {
    return items.reduce((sum, item) => {
      const product = productMap[item.product_id];
      return sum + (product ? product.selling_price * item.quantity : 0);
    }, 0);
  };

  if (isPremiumRestricted) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[calc(100vh-100px)] text-center">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-full shadow-2xl mb-6 animate-bounce">
          <Package size={64} className="text-white" />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-2">Premium A'zolik Talab Qilinadi</h2>
        <p className="text-gray-500 max-w-md mb-8 text-lg">
          Mahsulot to'plamlarini yaratish va sotish uchun do'koningizni
          <span className="text-indigo-600 font-bold mx-1">PREMIUM</span>
          tarifiga o'tkazing.
        </p>
        <button className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-xl">
          Tarifni Yangilash
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">To'plamlar</h1>
          <p className="text-gray-500 mt-1">Mahsulotlarni to'plam qilib sotish</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-medium shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Yangi to'plam
        </button>
      </div>

      {loading && bundles.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Yuklanmoqda...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map(bundle => {
            const realValue = calculateRealValue(bundle.items);
            const savings = realValue - bundle.price;
            const savingsPercent = realValue > 0 ? Math.round((savings / realValue) * 100) : 0;

            return (
              <div key={bundle.id} className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl ${!bundle.active ? 'opacity-75 grayscale-[0.5] hover:grayscale-0' : 'border-gray-100 shadow-sm'}`}>
                {/* Card Header */}
                <div className="p-5 border-b border-gray-50 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1" title={bundle.name}>{bundle.name}</h3>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border mt-2 ${bundle.active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {bundle.active ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {bundle.active ? 'Sotuvda' : 'Arxivda'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-indigo-600">
                      {bundle.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                      So'm
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between text-sm bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <div className="flex flex-col">
                      <span className="text-xs text-indigo-400 font-semibold uppercase">Asl qiymati</span>
                      <span className="font-bold text-indigo-900 strike-through line-through opacity-60">{realValue.toLocaleString()} so'm</span>
                    </div>
                    {savings > 0 && (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full">Tejaldi: {savingsPercent}%</span>
                        <span className="font-bold text-green-600">-{savings.toLocaleString()} so'm</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1">
                      <Package size={14} />
                      Tarkibi ({bundle.items.length})
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {bundle.items.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Bo'sh</p>
                      ) : (
                        bundle.items.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 truncate flex-1">{productMap[item.product_id]?.name || 'Unknown'}</span>
                            <span className="text-gray-500 font-medium ml-2 bg-gray-100 px-2 py-0.5 rounded text-xs">x{item.quantity}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 bg-gray-50/50 rounded-b-2xl border-t border-gray-100 flex items-center justify-between">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={!!bundle.active} className="sr-only peer" onChange={() => handleToggleActive(bundle.id, !!bundle.active)} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ml-2 text-xs font-semibold text-gray-600">{bundle.active ? 'Faol' : 'Nofaol'}</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(bundle)}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                      title="Tahrirlash"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(bundle.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-red-100"
                      title="O'chirish"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? "To'plamni tahrirlash" : "Yangi to'plam yaratish"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition">
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="bundleForm" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To'plam nomi</label>
                  <input
                    required
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border"
                    placeholder="Masalan: Maktab to'plami (Ruchka + Daftar)"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maxsus narxi</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border"
                      placeholder="0"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                    />
                    <div className="absolute left-3 top-3 text-gray-500 pointer-events-none">
                      <DollarSign size={16} />
                    </div>
                  </div>
                </div>

                {/* Items Section - Only visible when editing */}
                {editingId && (
                  <div className="pt-4 border-t">
                    <label className="block text-sm font-bold text-gray-800 mb-3">To'plam tarkibi ({bundleItems.length})</label>

                    {/* Product Search & Add */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                      <input
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Mahsulot qo'shish uchun qidiring..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                      />
                      {productSearch && (
                        <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                          {filteredProducts.slice(0, 10).map(product => {
                            const isAttached = bundleItems.some(item => item.product_id === product.id);
                            return (
                              <div
                                key={product.id}
                                className={`p-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${isAttached ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => !isAttached && handleAddItem(product.id)}
                              >
                                <div>
                                  <div className="text-sm font-medium">{product.name}</div>
                                  <div className="text-xs text-gray-500">{product.selling_price.toLocaleString()} so'm</div>
                                </div>
                                {!isAttached && <PlusCircle size={18} className="text-green-600" />}
                              </div>
                            );
                          })}
                          {filteredProducts.length === 0 && (
                            <div className="p-3 text-sm text-gray-500 text-center">Natija topilmadi</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bundle Items List */}
                    <div className="space-y-2">
                      {bundleItems.length === 0 ? (
                        <div className="text-sm text-gray-400 italic text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                          <ShoppingBag className="mx-auto mb-2 text-gray-300" />
                          Hozircha mahsulotlar yo'q
                        </div>
                      ) : (
                        bundleItems.map(item => {
                          const pName = productMap[item.product_id]?.name || "Noma'lum mahsulot";
                          const pPrice = productMap[item.product_id]?.selling_price || 0;
                          return (
                            <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-800">{pName}</div>
                                <div className="text-xs text-gray-500">{pPrice.toLocaleString()} so'm / dona</div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center bg-white rounded border">
                                  <button
                                    type="button"
                                    className="p-1 hover:bg-gray-100 text-gray-600"
                                    onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                                  >
                                    <MinusCircle size={16} />
                                  </button>
                                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                  <button
                                    type="button"
                                    className="p-1 hover:bg-gray-100 text-gray-600"
                                    onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                                  >
                                    <PlusCircle size={16} />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.product_id)}
                                  className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded bg-white border border-gray-200"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {bundleItems.length > 0 && (
                      <div className="mt-4 p-3 bg-indigo-50 rounded-lg flex justify-between items-center text-sm">
                        <span className="text-indigo-800">Jami asl qiymati:</span>
                        <span className="font-bold text-indigo-900 line-through decoration-indigo-400/50">
                          {calculateRealValue(bundleItems).toLocaleString()} so'm
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                form="bundleForm"
                className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all flex items-center gap-2"
              >
                <Save size={18} />
                {editingId ? "Saqlash" : "Yaratish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
