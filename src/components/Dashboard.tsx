import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
  TrendingUp,
  Package,
  AlertCircle,
  Users,
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  Activity,
  Calendar,
  CreditCard,
  Plus,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Stats {
  sales: number;
  profit: number;
  totalDebts: number;
  lowStockCount: number;
  oldStockCount: number;
  pendingOrders: number;
  totalProducts: number;
  salesTrend: { date: string; amount: number }[];
  topProducts: { name: string; quantity: number }[];
}

interface DashboardProps {
  onNavigate: (page: any) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    sales: 0,
    profit: 0,
    totalDebts: 0,
    lowStockCount: 0,
    oldStockCount: 0,
    pendingOrders: 0,
    totalProducts: 0,
    salesTrend: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [period]);

  const loadStats = async () => {
    try {
      const s = await api.stats.get({ period });
      setStats(s);
    } catch (error) {
      console.error('Statistika yuklanmadi:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLabel = () => {
    switch (period) {
      case 'daily': return 'Bugungi';
      case 'weekly': return 'Haftalik';
      case 'monthly': return 'Oylik';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F3F4F6] min-h-screen font-sans text-gray-800">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-2 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Boshqaruv Paneli</h1>
            <p className="text-gray-500 font-medium">Do'koningiz faoliyati bir qarashda</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === p ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {p === 'daily' ? 'Kunlik' : p === 'weekly' ? 'Haftalik' : 'Oylik'}
                </button>
              ))}
            </div>

            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 text-sm font-bold text-gray-600 flex items-center gap-2">
              <Calendar size={16} />
              {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Main Stat: Sales - Wide Card */}
          <div
            onClick={() => onNavigate('orders')}
            className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <DollarSign size={140} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-100 font-medium mb-1">
                  <Activity size={18} /> {getLabel()} Savdo
                </div>
                <h2 className="text-5xl font-black tracking-tight">{stats.sales.toLocaleString()} <span className="text-2xl opacity-70 font-bold">so'm</span></h2>
              </div>
              <div className="mt-8 flex gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex-1 border border-white/10">
                  <p className="text-xs text-indigo-100 uppercase font-bold tracking-wider">Foyda</p>
                  <p className="text-xl font-bold flex items-center gap-1">
                    {stats.profit.toLocaleString()}
                    <ArrowUpRight size={14} className="text-green-300" />
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex-1 border border-white/10">
                  <p className="text-xs text-indigo-100 uppercase font-bold tracking-wider">Tranzaksiyalar</p>
                  <p className="text-xl font-bold">---</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stat: Total Debts */}
          <div
            onClick={() => onNavigate('debts')}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                <Users size={24} />
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded-lg text-gray-500">Jami</span>
            </div>
            <div>
              <p className="text-gray-500 font-medium text-sm mb-1">Mijozlar Qarzi</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalDebts.toLocaleString()}</p>
              <div className="mt-2 text-xs font-medium text-orange-600 bg-orange-50 inline-block px-2 py-1 rounded">
                Diqqat talab
              </div>
            </div>
          </div>

          {/* Stat: Orders */}
          <div
            onClick={() => onNavigate('orders')}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                <ShoppingCart size={24} />
              </div>
              {stats.pendingOrders > 0 && <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>}
            </div>
            <div>
              <p className="text-gray-500 font-medium text-sm mb-1">Yangi Buyurtmalar</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</p>
              <p className="text-xs text-blue-600 mt-1 font-semibold">Online do'kondan</p>
            </div>
          </div>

          {/* Chart: Sales Trend */}
          <div className="lg:col-span-3 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-600" /> {getLabel()} Dinamika
              </h3>
            </div>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={stats.salesTrend}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    dy={10}
                    interval={period === 'monthly' ? 2 : 0}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#4F46E5', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#4F46E5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sidebar: Top Products & Alerts */}
          <div className="lg:col-span-1 space-y-6">

            {/* Shortcuts */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate('cashier')}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="group-hover:scale-110 transition-transform bg-green-100 text-green-600 p-2 rounded-full"><Plus size={20} /></div>
                <span className="text-xs font-bold text-gray-600">Savdo</span>
              </button>
              <button
                onClick={() => onNavigate('debts')}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="group-hover:scale-110 transition-transform bg-orange-100 text-orange-600 p-2 rounded-full"><CreditCard size={20} /></div>
                <span className="text-xs font-bold text-gray-600">Qarz</span>
              </button>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Top Mahsulotlar</h3>
              <div className="space-y-4">
                {stats.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`font-black text-lg w-6 text-center ${i === 0 ? 'text-yellow-500' : 'text-gray-300'}`}>{i + 1}</span>
                    <div className="flex-1">
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${(p.quantity / (stats.topProducts[0]?.quantity || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="font-medium text-gray-700 truncate max-w-[120px]">{p.name}</span>
                        <span className="text-gray-500 font-bold">{p.quantity} ta</span>
                      </div>
                    </div>
                  </div>
                ))}
                {stats.topProducts.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Ma'lumot yo'q</p>}
              </div>
            </div>

            {/* Alerts - Low Stock */}
            {stats.lowStockCount > 0 && (
              <div className="bg-red-500 text-white rounded-3xl p-6 shadow-lg shadow-red-200 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <AlertCircle size={20} /> Kam Qolgan!
                  </div>
                  <p className="text-sm opacity-90 mb-3">{stats.lowStockCount} ta mahsulot tugamoqda.</p>
                  <button
                    onClick={() => onNavigate('warehouse')}
                    className="bg-white text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-100"
                  >
                    Tekshirish
                  </button>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white/20 p-6 rounded-full">
                  <Package size={60} className="text-red-900 opacity-20" />
                </div>
              </div>
            )}

            {/* Alerts - Old Stock */}
            {stats.oldStockCount > 0 && (
              <div className="bg-yellow-500 text-white rounded-3xl p-6 shadow-lg shadow-yellow-200 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <Clock size={20} /> Eski Mahsulotlar
                  </div>
                  <p className="text-sm opacity-90 mb-3">{stats.oldStockCount} ta mahsulot 20 kundan beri sotilmadi.</p>
                  <button
                    onClick={() => onNavigate('warehouse')}
                    className="bg-white text-yellow-600 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-100"
                  >
                    Ko'rish
                  </button>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white/20 p-6 rounded-full">
                  <AlertCircle size={60} className="text-yellow-900 opacity-20" />
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
