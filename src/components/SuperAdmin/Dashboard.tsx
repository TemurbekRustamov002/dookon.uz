import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Store, Users, DollarSign, TrendingUp, ShoppingBag, Shield } from 'lucide-react';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await api.admin.getStats();
            setStats(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Yuklanmoqda...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Shield className="text-indigo-600" /> Tizim Administratori
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                        <Store size={32} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Jami Do'konlar</p>
                        <p className="text-3xl font-bold text-gray-900">{stats?.totalStores}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                        <Users size={32} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Hamkorlar</p>
                        <p className="text-3xl font-bold text-gray-900">{stats?.totalPartners}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-xl text-green-600">
                        <DollarSign size={32} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Active Tariflar</p>
                        <div className="flex gap-2">
                            {stats?.breakdown?.map((b: any) => (
                                <span key={b.plan} className="text-xs font-bold px-2 py-1 bg-gray-100 rounded">
                                    {b.plan}: {b._count.plan}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 text-white text-center shadow-xl">
                <h2 className="text-2xl font-bold mb-2">SaaS Platformasini Rivojlantirish</h2>
                <p className="opacity-80 max-w-2xl mx-auto mb-6">
                    Yangi funksiyalar va tarif rejalari orqali platformani kengaytiring.
                    Hamkorlar bilan ishlash tizimini yaxshilang.
                </p>
                <button className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
                    Reklama Kampaniyasi (Tez kunda)
                </button>
            </div>
        </div>
    );
}
