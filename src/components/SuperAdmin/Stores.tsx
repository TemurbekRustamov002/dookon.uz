import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Store, Search, CheckCircle, XCircle, MoreVertical, Shield, Filter, ArrowUpDown } from 'lucide-react';

export default function AdminStores() {
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [sortExpiry, setSortExpiry] = useState<'ASC' | 'DESC' | null>(null);

    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        try {
            const data = await api.admin.getStores();
            setStores(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: string, updates: any) => {
        try {
            await api.admin.updateStore(id, updates);
            loadStores();
            // alert("Muvaffaqiyatli yangilandi"); // Removed annoying alert, auto-refresh is better UX
        } catch {
            alert("Xatolik");
        }
    };

    const filtered = stores
        .filter(s =>
            (s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search)) &&
            (filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? s.is_active : !s.is_active))
        )
        .sort((a, b) => {
            if (!sortExpiry) return 0;
            const dateA = a.subscription_ends_at ? new Date(a.subscription_ends_at).getTime() : 0;
            const dateB = b.subscription_ends_at ? new Date(b.subscription_ends_at).getTime() : 0;
            return sortExpiry === 'ASC' ? dateA - dateB : dateB - dateA;
        });

    if (loading) return <div className="p-8 text-center text-gray-500">Yuklanmoqda...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Store className="text-indigo-600" /> Do'konlar
                </h1>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Qidirish..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Filter Status */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <select
                            className="pl-10 pr-8 py-2 bg-white border rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                        >
                            <option value="ALL">Barchasi</option>
                            <option value="ACTIVE">Faol</option>
                            <option value="INACTIVE">Bloklangan</option>
                        </select>
                    </div>

                    {/* Sort Expiry */}
                    <button
                        onClick={() => setSortExpiry(curr => curr === 'ASC' ? 'DESC' : 'ASC')}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${sortExpiry ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <ArrowUpDown size={18} />
                        <span className="text-sm font-semibold">
                            Obuna: {sortExpiry === 'ASC' ? 'Eskilar' : sortExpiry === 'DESC' ? 'Yangilar' : 'Saralash'}
                        </span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-sm font-bold text-gray-500">Do'kon</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-500">Egasi / Telefon</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-500">Statistika</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-500">Tarif</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-500">Shop Config (Premium)</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.map(store => (
                            <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{store.name}</div>
                                    {store.slug && (
                                        <div className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded w-fit mt-1">
                                            /{store.slug}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="font-medium text-gray-900">{store.owner_name}</div>
                                    <div className="text-gray-500">{store.phone}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold">Obuna tugashi:</span>
                                        <input
                                            type="date"
                                            className={`border rounded px-2 py-1 text-xs outline-none focus:border-indigo-500 ${!store.subscription_ends_at ? 'text-gray-400' : ''}`}
                                            value={store.subscription_ends_at ? store.subscription_ends_at.split('T')[0] : ''}
                                            onChange={(e) => handleUpdate(store.id, { subscription_ends_at: e.target.value })}
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={store.plan}
                                        onChange={(e) => handleUpdate(store.id, { plan: e.target.value })}
                                        className={`px-2 py-1 rounded text-xs font-bold border outline-none cursor-pointer ${store.plan === 'PREMIUM' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                        <option value="STANDARD">STANDARD</option>
                                        <option value="PREMIUM">PREMIUM</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    {store.plan === 'PREMIUM' ? (
                                        <div className="flex flex-col gap-1">
                                            <input
                                                placeholder="Slug (mystore)"
                                                className="text-[10px] border rounded px-1 py-0.5 w-24 outline-none focus:border-indigo-500"
                                                defaultValue={store.slug || ''}
                                                onBlur={(e) => {
                                                    if (e.target.value !== store.slug) handleUpdate(store.id, { slug: e.target.value });
                                                }}
                                            />
                                            <input
                                                placeholder="Bot Token"
                                                className="text-[10px] border rounded px-1 py-0.5 w-24 outline-none focus:border-indigo-500"
                                                defaultValue={store.telegram_bot_token || ''}
                                                onBlur={(e) => {
                                                    if (e.target.value !== store.telegram_bot_token) handleUpdate(store.id, { telegram_bot_token: e.target.value });
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-gray-400 italic">Premium emas</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleUpdate(store.id, { is_active: !store.is_active })}
                                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${store.is_active ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'}`}
                                    >
                                        {store.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                        {store.is_active ? 'Faol' : 'Bloklangan'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={7} className="p-12 text-center text-gray-400">Natija topilmadi</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="text-right text-xs text-gray-400">
                Jami: {filtered.length} ta do'kon (Umumiy: {stores.length})
            </div>
        </div>
    );
}
