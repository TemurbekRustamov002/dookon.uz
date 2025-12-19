import React, { useState, useEffect } from 'react';
import { api, User } from '../lib/api';
import { UserPlus, Pencil, Trash2, Users as UsersIcon, Shield, Truck, Package, ShoppingCart, User as UserIcon, Lock, Loader, X } from 'lucide-react';
import ToastContainer, { useToast } from './Toast';

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { toasts, addToast, removeToast } = useToast();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'CASHIER' | 'WAREHOUSE' | 'DELIVERY'>('CASHIER');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await api.users.list();
            setUsers(data);
        } catch (err: any) {
            setError('Xodimlarni yuklashda xatolik');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // Update
                const data: any = { username, role };
                if (password) data.password = password;

                await api.users.update(editingUser.id, data);
                addToast('Xodim ma\'lumotlari yangilandi', 'success');
            } else {
                // Create
                await api.users.create({ username, password, role });
                addToast('Yangi xodim qo\'shildi', 'success');
            }
            setIsModalOpen(false);
            resetForm();
            loadUsers();
        } catch (err: any) {
            addToast(err.message || 'Xatolik yuz berdi', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Rostdan ham bu xodimni o\'chirmoqchimisiz?')) return;
        try {
            await api.users.remove(id);
            addToast('Xodim o\'chirildi', 'success');
            loadUsers();
        } catch (err: any) {
            addToast(err.message || 'Xatolik', 'error');
        }
    };

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setUsername(user.username);
            setRole(user.role as any);
            setPassword(''); // Don't show password
        } else {
            setEditingUser(null);
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setUsername('');
        setPassword('');
        setRole('CASHIER');
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'OWNER': return <span className="px-2 py-1 rounded bg-purple-100 text-purple-800 text-xs font-bold">EGASI</span>;
            case 'ADMIN': return <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-bold">ADMIN</span>;
            case 'CASHIER': return <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-bold">KASSIR</span>;
            case 'WAREHOUSE': return <span className="px-2 py-1 rounded bg-orange-100 text-orange-800 text-xs font-bold">OMBORCHI</span>;
            case 'DELIVERY': return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-bold">YETKAZIB BERUVCHI</span>;
            default: return <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-bold">{role}</span>;
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'OWNER': return <Shield size={18} />;
            case 'ADMIN': return <UserIcon size={18} />;
            case 'CASHIER': return <ShoppingCart size={18} />;
            case 'WAREHOUSE': return <Package size={18} />;
            case 'DELIVERY': return <Truck size={18} />;
            default: return <UserIcon size={18} />;
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin text-blue-600" /></div>;

    return (
        <div className="p-6">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <UsersIcon className="text-blue-600" />
                        Xodimlar
                    </h1>
                    <p className="text-gray-500">Do'koningiz xodimlarini boshqaring</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg transition-all"
                >
                    <UserPlus size={20} />
                    Yangi Xodim
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                    <div key={user.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-gray-100 p-3 rounded-full text-gray-600">
                                {getRoleIcon(user.role)}
                            </div>
                            {getRoleBadge(user.role)}
                        </div>

                        <h3 className="text-lg font-bold text-gray-800 mb-1">{user.username}</h3>
                        <p className="text-sm text-gray-500 mb-4">ID: {user.id.substring(0, 8)}...</p>

                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                            {user.role !== 'OWNER' && (
                                <>
                                    <button
                                        onClick={() => openModal(user)}
                                        className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 font-medium transition-colors"
                                    >
                                        <Pencil size={16} /> Tahrirlash
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 font-medium transition-colors"
                                    >
                                        <Trash2 size={16} /> O'chirish
                                    </button>
                                </>
                            )}
                            {user.role === 'OWNER' && (
                                <button
                                    onClick={() => openModal(user)}
                                    className="w-full py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 font-medium transition-colors"
                                >
                                    <Pencil size={16} /> Parolni o'zgartirish
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {editingUser ? <Pencil size={20} /> : <UserPlus size={20} />}
                                {editingUser ? 'Xodimni Tahrirlash' : 'Yangi Xodim Qo\'shish'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-white hover:bg-white/20 p-1 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Foydalanuvchi Nomi (Login)</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="xodim_login"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {editingUser ? 'Yangi Parol (ixtiyoriy)' : 'Parol'}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required={!editingUser}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder={editingUser ? "O'zgartirmaslik uchun bo'sh qoldiring" : "Parolni kiriting"}
                                        minLength={4}
                                    />
                                </div>
                            </div>

                            {(!editingUser || editingUser.role !== 'OWNER') && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lavozim (Rol)</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as any)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="ADMIN">Admin (Boshqaruvchi)</option>
                                        <option value="CASHIER">Kassir</option>
                                        <option value="WAREHOUSE">Omborchi</option>
                                        <option value="DELIVERY">Yetkazib Beruvchi (Kuryer)</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md transition-colors"
                                >
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
