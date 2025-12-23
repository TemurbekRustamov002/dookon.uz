import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { UserPlus, Trash2, Edit2, Shield, X } from 'lucide-react';

export default function AdminPartners() {
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<any>(null);

    // Form State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [commission, setCommission] = useState('10');

    useEffect(() => {
        loadPartners();
    }, []);

    const loadPartners = async () => {
        try {
            const data = await api.admin.getPartners();
            setPartners(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingPartner(null);
        setName('');
        setPhone('');
        setPassword('');
        setCommission('10');
        setIsModalOpen(true);
    };

    const openEditModal = (partner: any) => {
        setEditingPartner(partner);
        setName(partner.name);
        setPhone(partner.phone);
        setPassword(''); // Paswordni ko'rsatmaymiz, faqat o'zgartirish uchun
        setCommission(partner.commission_percent.toString());
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                name,
                phone,
                commission_percent: parseFloat(commission)
            };
            if (password) payload.password = password;

            if (editingPartner) {
                await api.admin.updatePartner(editingPartner.id, payload);
            } else {
                if (!password) {
                    alert('Yangi hamkor uchun parol majburiy');
                    return;
                }
                payload.password = password;
                await api.admin.createPartner(payload);
            }

            setIsModalOpen(false);
            loadPartners();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Siz rostdan ham "${name}" hamkorini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`)) return;

        try {
            await api.admin.removePartner(id);
            loadPartners();
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Yuklanmoqda...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="text-purple-600" /> Hamkorlar
                </h1>
                <button
                    onClick={openCreateModal}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 flex items-center gap-2"
                >
                    <UserPlus size={20} /> Yangi Hamkor
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Hamkor Ismi</th>
                            <th className="px-6 py-4">Telefon</th>
                            <th className="px-6 py-4">Ulush (%)</th>
                            <th className="px-6 py-4">Daromad</th>
                            <th className="px-6 py-4">Do'konlar</th>
                            <th className="px-6 py-4 text-right">Amallar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {partners.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-800">{p.name}</td>
                                <td className="px-6 py-4 text-gray-600">{p.phone}</td>
                                <td className="px-6 py-4 font-medium text-purple-600">{p.commission_percent}%</td>
                                <td className="px-6 py-4 font-mono">{(p.total_earnings || 0).toLocaleString()} so'm</td>
                                <td className="px-6 py-4">
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">
                                        {p._count?.stores || 0} ta
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button
                                        onClick={() => openEditModal(p)}
                                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                        title="Tahrirlash"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(p.id, p.name)}
                                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                        title="O'chirish"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {partners.length === 0 && (
                    <div className="p-8 text-center text-gray-500">Hamkorlar topilmadi</div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">
                                {editingPartner ? 'Hamkorni Tahrirlash' : 'Yangi Hamkor Qo\'shish'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Ismi / Tashkilot</label>
                                <input required value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="Masalan: Ali Valiyev" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon (Login)</label>
                                <input required value={phone} onChange={e => setPhone(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="+998..." />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {editingPartner ? 'Parol (o\'zgartirish uchun kiriting)' : 'Parol'}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full border p-2 rounded-lg"
                                    placeholder={editingPartner ? "O'zgarishsiz qoldirish" : "********"}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Komissiya Ulushi (%)</label>
                                <input type="number" required value={commission} onChange={e => setCommission(e.target.value)} className="w-full border p-2 rounded-lg" />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold">Bekor qilish</button>
                                <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700">Saqlash</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
