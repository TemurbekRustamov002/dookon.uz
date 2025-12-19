import React, { useEffect, useMemo, useState } from 'react';
import { api, Product, Promotion, PromotionProduct } from '../lib/api';
import {
  Plus,
  Calendar,
  Tag,
  Percent,
  DollarSign,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Search,
  MoreVertical,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function Promotions() {
  const [promotions, setPromotions] = useState<(Promotion & { products: PromotionProduct[] })[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<Promotion>>({
    name: '',
    discount_type: 'percent',
    discount_value: 0,
    active: true,
    start_at: '',
    end_at: ''
  });

  // Product attachment state for the modal
  const [attachedProducts, setAttachedProducts] = useState<PromotionProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const [isPremiumRestricted, setIsPremiumRestricted] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setIsPremiumRestricted(false);
    try {
      // First try to fetch products only
      const prods = await api.products.list();
      setProducts(prods);

      // Then try promotions
      try {
        const promos = await api.promotions.list();
        setPromotions(promos);
      } catch (err: any) {
        if (err.message && err.message.includes('403') || err.message.includes('Premium')) {
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
    setForm({ name: '', discount_type: 'percent', discount_value: 0, active: true, start_at: '', end_at: '' });
    setAttachedProducts([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (id: string) => {
    try {
      const promo = await api.promotions.get(id);
      setEditingId(id);
      setForm({
        name: promo.name,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        active: promo.active,
        start_at: promo.start_at ? promo.start_at.slice(0, 16) : '',
        end_at: promo.end_at ? promo.end_at.slice(0, 16) : ''
      });
      setAttachedProducts(promo.products || []);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to load promotion details", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.discount_value == null) return;

    try {
      if (editingId) {
        await api.promotions.update(editingId, form);
      } else {
        await api.promotions.create(form);
      }
      setIsModalOpen(false);
      await loadAll();
    } catch (error) {
      alert("Xatolik yuz berdi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;
    await api.promotions.remove(id);
    await loadAll();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await api.promotions.setActive(id, !currentStatus);
    await loadAll();
  };

  // Product attachment logic inside modal
  const handleAttachProduct = async (productId: string) => {
    if (!editingId) return; // Only work in edit mode for now or allow save after create
    // Note: Creating a new promotion with products immediately is complex with current API 
    // because we need the promotion ID first. 
    // This UI assumes we mostly manage products in 'Edit' mode or after creation.

    try {
      await api.promotions.attachProduct(editingId, { product_id: productId });
      // Refresh local state
      const updated = await api.promotions.get(editingId);
      setAttachedProducts(updated.products);
      // Also refresh main list
      loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDetachProduct = async (promoId: string, productId: string) => {
    try {
      await api.promotions.detachProduct(promoId, productId);
      if (editingId === promoId) {
        const updated = await api.promotions.get(editingId);
        setAttachedProducts(updated.products);
      }
      loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const scheduleStatus = (p: Promotion) => {
    const now = new Date();
    const startOk = !p.start_at || new Date(p.start_at) <= now;
    const endOk = !p.end_at || new Date(p.end_at) >= now;
    if (startOk && endOk) return { label: 'Faol', color: 'bg-green-100 text-green-700 border-green-200' };
    if (!startOk) return { label: 'Kutilmoqda', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    return { label: 'Tugagan', color: 'bg-gray-100 text-gray-500 border-gray-200' };
  };

  const fmtDate = (d?: string | null) => {
    if (!d) return 'Cheklovsiz';
    return new Date(d).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.barcode && p.barcode.includes(productSearch))
  );

  if (isPremiumRestricted) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[calc(100vh-100px)] text-center">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-full shadow-2xl mb-6 animate-bounce">
          <DollarSign size={64} className="text-white" />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-2">Premium A'zolik Talab Qilinadi</h2>
        <p className="text-gray-500 max-w-md mb-8 text-lg">
          Aksiyalar va chegirmalarni boshqarish uchun do'koningizni
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
          <h1 className="text-3xl font-bold text-gray-900">Aksiyalar</h1>
          <p className="text-gray-500 mt-1">Do'koningiz savdosini oshirish uchun chegirmalar</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-medium shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Yangi aksiya
        </button>
      </div>

      {loading && promotions.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Yuklanmoqda...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map(promo => {
            const status = scheduleStatus(promo);
            return (
              <div key={promo.id} className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl ${!promo.active ? 'opacity-75 grayscale-[0.5] hover:grayscale-0' : 'border-gray-100 shadow-sm'}`}>
                {/* Card Header */}
                <div className="p-5 border-b border-gray-50 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1" title={promo.name}>{promo.name}</h3>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border mt-2 ${status.color}`}>
                      {status.label === 'Faol' && <CheckCircle size={12} />}
                      {status.label === 'Kutilmoqda' && <Clock size={12} />}
                      {status.label === 'Tugagan' && <AlertCircle size={12} />}
                      {status.label}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-2xl font-black ${promo.discount_type === 'percent' ? 'text-indigo-600' : 'text-green-600'}`}>
                      {promo.discount_type === 'percent' ? `${promo.discount_value}%` : promo.discount_value.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                      {promo.discount_type === 'percent' ? 'Chegirma' : "So'm"}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      <Calendar size={16} className="text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">Amal qilish muddati</span>
                      <span className="font-medium">{fmtDate(promo.start_at)} — {fmtDate(promo.end_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      <Tag size={16} className="text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">Biriktirilgan mahsulotlar</span>
                      <span className="font-medium">{promo.products.length} ta mahsulot</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 bg-gray-50/50 rounded-b-2xl border-t border-gray-100 flex items-center justify-between">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={promo.active} className="sr-only peer" onChange={() => handleToggleActive(promo.id, promo.active)} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                    <span className="ml-2 text-xs font-semibold text-gray-600">{promo.active ? 'Faol' : 'Nofaol'}</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(promo.id)}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                      title="Tahrirlash"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
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
                {editingId ? "Aksiyani tahrirlash" : "Yangi aksiya yaratish"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition">
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="promoForm" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aksiya nomi</label>
                  <input
                    required
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border"
                    placeholder="Masalan: Yangi yil chegirmasi"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chegirma turi</label>
                    <div className="relative">
                      <select
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border appearance-none"
                        value={form.discount_type as any}
                        onChange={e => setForm({ ...form, discount_type: e.target.value as any })}
                      >
                        <option value="percent">Foiz (%)</option>
                        <option value="fixed">Summa (so'm)</option>
                      </select>
                      <div className="absolute right-3 top-3 text-gray-500 pointer-events-none">
                        {form.discount_type === 'percent' ? <Percent size={16} /> : <DollarSign size={16} />}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chegirma miqdori</label>
                    <input
                      type="number"
                      required
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border"
                      placeholder="0"
                      value={form.discount_value}
                      onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Boshlanish vaqti</label>
                    <input
                      type="datetime-local"
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border"
                      value={form.start_at || ''}
                      onChange={e => setForm({ ...form, start_at: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tugash vaqti</label>
                    <input
                      type="datetime-local"
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border"
                      value={form.end_at || ''}
                      onChange={e => setForm({ ...form, end_at: e.target.value })}
                    />
                  </div>
                </div>

                {/* Products Section - Only visible when editing for now to simplify flow */}
                {editingId && (
                  <div className="pt-4 border-t">
                    <label className="block text-sm font-bold text-gray-800 mb-3">Biriktirilgan mahsulotlar ({attachedProducts.length})</label>

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
                            const isAttached = attachedProducts.some(ap => ap.product_id === product.id);
                            return (
                              <div
                                key={product.id}
                                className={`p-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${isAttached ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => !isAttached && handleAttachProduct(product.id)}
                              >
                                <span className="text-sm font-medium">{product.name}</span>
                                <span className="text-xs text-gray-500">{product.selling_price.toLocaleString()} so'm</span>
                              </div>
                            );
                          })}
                          {filteredProducts.length === 0 && (
                            <div className="p-3 text-sm text-gray-500 text-center">Natija topilmadi</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Attached Products List */}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {attachedProducts.length === 0 ? (
                        <div className="text-sm text-gray-400 italic text-center py-2">Hozircha mahsulotlar yo'q</div>
                      ) : (
                        attachedProducts.map(ap => {
                          const pName = productMap[ap.product_id]?.name || "Noma'lum mahsulot";
                          return (
                            <div key={ap.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md border border-gray-200">
                              <span className="text-sm text-gray-700">{pName}</span>
                              <button
                                type="button"
                                onClick={() => handleDetachProduct(editingId, ap.product_id)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
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
                form="promoForm"
                className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all"
              >
                {editingId ? "Saqlash" : "Yaratish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
