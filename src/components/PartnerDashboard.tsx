import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Users, Store, TrendingUp, Plus, Shield, Settings, CheckCircle, XCircle, LogOut, X, Pencil } from 'lucide-react';

interface Store {
    id: string;
    name: string;
    phone: string;
    plan: string;
    isActive: boolean;
    salesCount: number;
    joinedAt: string;
}

export default function PartnerDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'stores' | 'settings'>('stores');

    // New Store Form
    const [newStoreName, setNewStoreName] = useState('');
    const [newStorePhone, setNewStorePhone] = useState('');
    const [newStoreOwner, setNewStoreOwner] = useState('');
    const [newStorePass, setNewStorePass] = useState('');

    // Edit Store Form
    const [editingStore, setEditingStore] = useState<Store | null>(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editPassword, setEditPassword] = useState(''); // Optional reset

    // Settings
    const [password, setPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await api.partner.getStats();
            setStats(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.partner.createStore({
                name: newStoreName,
                phone: newStorePhone,
                ownerName: newStoreOwner,
                password: newStorePass
            });
            alert('Do\'kon muvaffaqiyatli ochildi!');
            setShowAddModal(false);
            setNewStoreName(''); setNewStorePhone(''); setNewStoreOwner(''); setNewStorePass('');
            loadStats();
        } catch (e: any) {
            alert(e.message || 'Xatolik yuz berdi');
        }
    };

    const openEditModal = (store: Store) => {
        setEditingStore(store);
        setEditName(store.name);
        setEditPhone(store.phone);
        setEditPassword('');
    };

    const handleUpdateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStore) return;
        try {
            await api.partner.updateStore(editingStore.id, {
                name: editName,
                phone: editPhone,
                password: editPassword || undefined // Only send if not empty
            });
            alert('Do\'kon ma\'lumotlari yangilandi!');
            setEditingStore(null);
            loadStats();
        } catch (e: any) {
            alert(e.message || 'Xatolik');
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.partner.updateSettings({
                password,
                currentPassword
            });
            alert('Parol yangilandi');
            setPassword(''); setCurrentPassword('');
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Yuklanmoqda...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header Stats */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Hamkor Kabineti</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Jami Do'konlar</p>
                                <div className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalStores || 0}</div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Store size={24} /></div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Faol Do'konlar</p>
                                <div className="text-3xl font-bold text-green-600 mt-2">{stats?.activeStores || 0}</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl text-green-600"><CheckCircle size={24} /></div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Komissiya</p>
                                <div className="text-3xl font-bold text-purple-600 mt-2">{stats?.commissionPercent || 0}%</div>
                                <div className="text-xs text-gray-400 mt-1">Daromad: {stats?.totalEarnings?.toLocaleString()} UZS</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><TrendingUp size={24} /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('stores')}
                    className={`pb-3 px-1 font-semibold transition-colors ${activeTab === 'stores' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                    Mening Do'konlarim
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`pb-3 px-1 font-semibold transition-colors ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                    Sozlamalar
                </button>
            </div>

            {/* Stores List */}
            {activeTab === 'stores' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900">Ulanishlar Ro'yxati</h2>
                        <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200">
                            <Plus size={20} /> Yangi Do'kon
                        </button>
                    </div>

                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold text-sm">
                            <tr>
                                <th className="p-4 pl-6">Do'kon</th>
                                <th className="p-4">Egasi</th>
                                <th className="p-4">Tarif</th>
                                <th className="p-4">Sotuvlar</th>
                                <th className="p-4">Holati</th>
                                <th className="p-4">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats?.storesList?.map((store: Store) => (
                                <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 pl-6">
                                        <div className="font-bold text-gray-900">{store.name}</div>
                                        <div className="text-xs text-gray-500">{store.phone}</div>
                                    </td>
                                    <td className="p-4 text-gray-700 text-sm">{/* Owner details if available in global stats */} - </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${store.plan === 'PREMIUM' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {store.plan}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-sm text-gray-700">{store.salesCount || 0}</td>
                                    <td className="p-4">
                                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full w-fit ${store.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {store.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {store.isActive ? 'Faol' : 'Bloklangan'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button onClick={() => openEditModal(store)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-blue-600 transition-colors">
                                            <Pencil size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {stats?.storesList?.length === 0 && (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Hozircha do'konlar yo'q</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="max-w-xl">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><Shield size={20} /> Xavfsizlik</h2>
                        <form onSubmit={handleUpdateSettings} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Joriy Parol</label>
                                <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full border p-2 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Yangi Parol</label>
                                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded-lg" />
                            </div>
                            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition-all">
                                Parolni Yangilash
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Store Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Yangi Do'kon Qo'shish</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateStore} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Do'kon Nomi</label>
                                <input required value={newStoreName} onChange={e => setNewStoreName(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Masalan: Super Market" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon (Login)</label>
                                <input required value={newStorePhone} onChange={e => setNewStorePhone(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+998901234567" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Egasi (Ism)</label>
                                <input required value={newStoreOwner} onChange={e => setNewStoreOwner(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ism Familiya" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Boshlang'ich Parol</label>
                                <input required type="password" value={newStorePass} onChange={e => setNewStorePass(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="******" />
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                                    Yaratish
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Store Modal */}
            {editingStore && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Do'konni Tahrirlash</h2>
                            <button onClick={() => setEditingStore(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateStore} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Do'kon Nomi</label>
                                <input required value={editName} onChange={e => setEditName(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon</label>
                                <input required value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-2"><Shield size={16} /> Xavfsizlik</h3>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Do'kon Egasi Parolini Tiklash</label>
                                <input
                                    type="password"
                                    value={editPassword}
                                    onChange={e => setEditPassword(e.target.value)}
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-red-50/50 placeholder-gray-400"
                                    placeholder="Yangi parol (ixtiyoriy)"
                                />
                                <p className="text-xs text-gray-400 mt-1">* Agar parolni o'zgartirish kerak bo'lmasa, bo'sh qoldiring.</p>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setEditingStore(null)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">
                                    Bekor qilish
                                </button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
