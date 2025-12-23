import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Settings as SettingsIcon, Store, Shield, Lock, Save, User as UserIcon } from 'lucide-react';
import { getSession } from '../lib/auth';

export default function Settings() {
    const [activeTab, setActiveTab] = useState<'store' | 'security'>('store');
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

    // Store Settings
    const [storeName, setStoreName] = useState('');
    const [storePhone, setStorePhone] = useState('');
    const [storeAddress, setStoreAddress] = useState('');
    const [receiptHeader, setReceiptHeader] = useState('');
    const [receiptFooter, setReceiptFooter] = useState('');
    const [storeSlug, setStoreSlug] = useState('');
    const [botToken, setBotToken] = useState('');

    // Full settings object for status display
    const [storeSettings, setStoreSettings] = useState<any>({});

    // Security Settings
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const session = getSession();
        if (session) {
            setUserRole(session.role);
            setUsername(session.name);
            if (session.role === 'OWNER' || session.role === 'ADMIN') {
                loadStoreSettings();
            } else {
                setActiveTab('security');
                setLoading(false);
            }
        }
    }, []);

    const loadStoreSettings = async () => {
        try {
            const data = await api.settings.get();
            if (data) {
                setStoreName(data.name || '');
                setStorePhone(data.phone || '');
                setStoreSlug(data.slug || '');
                setStoreAddress(data.address || '');
                setReceiptHeader(data.receipt_header || '');
                setReceiptFooter(data.receipt_footer || '');
                setReceiptFooter(data.receipt_footer || '');
                setBotToken(data.telegram_bot_token || '');
                setStoreSettings(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveStore = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.settings.update({
                name: storeName,
                slug: storeSlug,
                address: storeAddress,
                receipt_header: receiptHeader,
                receipt_footer: receiptFooter,
                telegram_bot_token: botToken
            });
            alert('Sozlamalar saqlandi!');
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
            alert('Parollar mos kelmadi');
            return;
        }

        try {
            const userId = getSession()?.userId;
            if (!userId) {
                alert('Foydalanuvchi aniqlanmadi');
                return;
            }
            await api.users.update(userId, {
                username: username,
                password: password || undefined
            });
            alert('Profil yangilandi! Qaytadan kirishingiz kerak bo\'lishi mumkin.');
            setPassword('');
            setConfirmPassword('');
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Yuklanmoqda...</div>;

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <SettingsIcon className="text-gray-700" /> Sozlamalar
            </h1>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    {(userRole === 'OWNER' || userRole === 'ADMIN') && (
                        <button
                            onClick={() => setActiveTab('store')}
                            className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'store' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Store size={20} /> Do'kon Sozlamalari
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Shield size={20} /> Xavfsizlik va Profil
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'store' && (
                        <div className="space-y-6">
                            {/* Subscription Status Card */}
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold opacity-90">Obuna Holati</h3>
                                        <div className="text-3xl font-bold mt-1 max-w-md truncate">{storeName}</div>
                                        <div className="mt-4 flex gap-3">
                                            <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">
                                                Tarif: {storeSettings.plan || 'STANDARD'}
                                            </span>
                                            <span className={`px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm ${new Date(storeSettings.subscription_ends_at) > new Date() ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'}`}>
                                                {storeSettings.subscription_ends_at ? `Tugash vaqti: ${new Date(storeSettings.subscription_ends_at).toLocaleDateString()}` : 'Cheksiz (Beta)'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-full">
                                        <Shield size={32} />
                                    </div>
                                </div>
                            </div>
                            <form onSubmit={handleSaveStore} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Do'kon Nomi</label>
                                        <div className="relative">
                                            <Store className="absolute left-3 top-3 text-gray-400" size={18} />
                                            <input required value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full pl-10 border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Do'koningiz nomi" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon (Login)</label>
                                        <input disabled value={storePhone} className="w-full border p-2 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" title="Telefon raqamni o'zgartirish uchun Admin bilan bog'laning" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Manzil</label>
                                        <input value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Do'kon manzili" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Online Do'kon Linki (Slug)</label>
                                        <div className="flex">
                                            <span className="bg-gray-100 border border-r-0 rounded-l-lg px-3 py-2 text-gray-500 text-sm flex items-center">dookon.uz/shop/</span>
                                            <input value={storeSlug} onChange={e => setStoreSlug(e.target.value)} className="w-full border p-2 rounded-r-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="my-shop" />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-gray-100" />
                                <h3 className="font-bold text-gray-800">Chek Sozlamalari (Receipt)</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Chek Yuqorisi (Header)</label>
                                        <textarea rows={2} value={receiptHeader} onChange={e => setReceiptHeader(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Xush kelibsiz!" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Chek Pastki Qismi (Footer)</label>
                                        <textarea rows={2} value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Xaridingiz uchun rahmat!" />
                                    </div>
                                </div>

                                <hr className="border-gray-100" />
                                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Lock size={16} /> Telegram Bot Integratsiyasi</h3>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Bot Token</label>
                                    <input type="password" value={botToken} onChange={e => setBotToken(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="123456:ABC-DEF..." />
                                    <p className="text-xs text-gray-500 mt-1">BotFather dan olingan token</p>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-all">
                                        <Save size={20} /> Saqlash
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg mx-auto">
                            <div className="text-center mb-6">
                                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <UserIcon size={40} className="text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{username}</h3>
                                <p className="text-gray-500 text-sm">{userRole}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Login (Username)</label>
                                <input value={username} onChange={e => setUsername(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            <hr className="border-gray-100 my-4" />

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Yangi Parol</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="********" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Parolni Tasdiqlang</label>
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="********" />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button type="submit" className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all">
                                    <Save size={20} /> Profilni Yangilash
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div >
    );
}
