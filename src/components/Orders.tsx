import { useEffect, useState } from 'react';
import { api, Order } from '../lib/api';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Search,
  ChevronRight,
  Calendar,
  MapPin,
  Phone,
  User,
  X
} from 'lucide-react';

interface OrderWithItems extends Order {
  order_items: any[];
}

export default function Orders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  const [isPremiumRestricted, setIsPremiumRestricted] = useState(false);

  useEffect(() => {
    loadOrders();
    // Auto refresh every 30 seconds for new orders could be nice, but let's stick to simple load for now
  }, [filter]);

  const loadOrders = async () => {
    setIsPremiumRestricted(false);
    try {
      const data = await api.orders.list(filter === 'all' ? undefined : filter);
      setOrders(data || [] as any);
    } catch (e: any) {
      if (e.message && (e.message.includes('403') || e.message.includes('Premium'))) {
        setIsPremiumRestricted(true);
      } else {
        console.error("Failed to load orders", e);
      }
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.orders.updateStatus(orderId, status);
      // Refresh local state without full reload
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
    } catch (e) {
      alert('Xatolik yuz berdi');
    }
  };

  const filteredOrders = orders.filter(order =>
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_phone.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} className="mr-1.5" />;
      case 'confirmed': return <CheckCircle size={14} className="mr-1.5" />;
      case 'delivered': return <Truck size={14} className="mr-1.5" />;
      case 'cancelled': return <XCircle size={14} className="mr-1.5" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Kutilmoqda';
      case 'confirmed': return 'Tasdiqlangan';
      case 'delivered': return 'Yetkazildi';
      case 'cancelled': return 'Bekor qilingan';
      default: return status;
    }
  };

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  if (isPremiumRestricted) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[calc(100vh-100px)] bg-gray-50 text-center">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-full shadow-2xl mb-6 animate-bounce">
          <Truck size={64} className="text-white" />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-2">Onlayn Do'kon (Premium)</h2>
        <p className="text-gray-500 max-w-md mb-8 text-lg">
          Mijozlaringizdan onlayn buyurtma qabul qilish va Telegram do'kon yaratish uchun
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
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Package className="text-indigo-600" /> Buyurtmalar
            </h1>
            <p className="text-gray-500 text-sm">Onlayn buyurtmalar va yetkazib berish holati</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-yellow-100 flex items-center gap-3 min-w-[160px]">
              <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Kutilmoqda</p>
                <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 flex items-center gap-3 min-w-[160px]">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Tasdiqlangan</p>
                <p className="text-xl font-bold text-gray-900">{stats.confirmed}</p>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm border border-green-100 flex items-center gap-3 min-w-[160px]">
              <div className="bg-green-100 p-2 rounded-lg text-green-600">
                <Truck size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Yetkazildi</p>
                <p className="text-xl font-bold text-gray-900">{stats.delivered}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-10">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all hover:bg-white"
              placeholder="Mijoz ismi yoki telefon..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
            {(['all', 'pending', 'confirmed', 'delivered', 'cancelled'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all whitespace-nowrap ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {f === 'all' ? 'Barchasi' : getStatusText(f)}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID / Sana</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mijoz</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Summa</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="px-6 py-3">
                    <div className="font-bold text-indigo-600 text-xs uppercase tracking-wide">#{order.id.slice(0, 8)}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <User size={14} className="text-gray-400" /> {order.customer_name}
                    </div>
                    <div className="text-xs text-gray-500 font-mono pl-6">{order.customer_phone}</div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="font-bold text-gray-900 text-sm">{order.total_amount.toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">so'm</span></span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-indigo-600 transition-colors">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <Package size={48} className="mx-auto mb-3 opacity-20" />
                    <p>Buyurtmalar topilmadi</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden space-y-3">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 active:scale-[0.99] transition-transform" onClick={() => setSelectedOrder(order)}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">#{order.id.slice(0, 6)}</span>
                  <span className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              <div className="mb-3">
                <div className="font-bold text-gray-900 text-sm">{order.customer_name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={10} /> {order.customer_phone}</div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <div className="text-xs text-gray-400">{order.order_items.length} ta mahsulot</div>
                <div className="font-bold text-indigo-600">{order.total_amount.toLocaleString()} so'm</div>
              </div>
            </div>
          ))}
        </div>

        {/* Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-auto animate-slide-up">

              {/* Header */}
              <div className="p-5 border-b bg-gray-50 flex justify-between items-center shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-gray-800">Buyurtma #{selectedOrder.id.slice(0, 8)}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-800 shadow-sm border hover:bg-gray-100 transition-all"><X size={18} /></button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Customer Info */}
                <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><User size={20} /></div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Mijoz</p>
                      <p className="font-bold text-gray-900">{selectedOrder.customer_name}</p>
                      <p className="text-gray-500 text-sm">{selectedOrder.customer_phone}</p>
                    </div>
                  </div>
                  {selectedOrder.customer_address && (
                    <div className="flex items-start gap-3 pt-2 border-t border-dashed">
                      <div className="bg-gray-50 p-2 rounded-lg text-gray-500"><MapPin size={20} /></div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Manzil</p>
                        <p className="text-gray-800 text-sm">{selectedOrder.customer_address}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Package size={16} className="text-indigo-600" /> Mahsulotlar
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{item.product.name}</div>
                          <div className="text-xs text-gray-500">{item.quantity} x {item.price.toLocaleString()} so'm</div>
                        </div>
                        <div className="font-bold text-gray-900 text-sm">{item.total.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t px-2">
                    <span className="font-bold text-gray-500">Jami Summa:</span>
                    <span className="font-black text-xl text-indigo-600">{selectedOrder.total_amount.toLocaleString()} <span className="text-sm font-normal text-gray-400">so'm</span></span>
                  </div>
                </div>

                {/* Actions Area */}
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                    {selectedOrder.status === 'pending' ? (
                      <>
                        <button onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')} className="py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors border border-red-100">
                          Bekor qilish
                        </button>
                        <button onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')} className="py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-transform active:scale-95">
                          Tasdiqlash
                        </button>
                      </>
                    ) : (
                      <button onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')} className="col-span-2 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 shadow-lg shadow-green-200 transition-transform active:scale-95 flex items-center justify-center gap-2">
                        <CheckCircle size={18} /> Yetkazildi deb belgilash
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
