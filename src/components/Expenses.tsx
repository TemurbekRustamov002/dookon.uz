import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Calendar, TrendingDown } from 'lucide-react';

export default function Expenses() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Form
    const [form, setForm] = useState({
        name: '',
        amount: '',
        type: 'other',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadExpenses();
    }, [dateFrom, dateTo]);

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;
            const data = await api.expenses.list(params);
            setExpenses(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.expenses.create({
                ...form,
                amount: parseFloat(form.amount),
                date: new Date(form.date).toISOString()
            });
            setIsModalOpen(false);
            setForm({ name: '', amount: '', type: 'other', description: '', date: new Date().toISOString().split('T')[0] });
            loadExpenses();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('O\'chirmoqchimisiz?')) return;
        try {
            await api.expenses.delete(id);
            loadExpenses();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingDown className="text-red-500" /> Xarajatlar
                </h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 flex items-center gap-2 shadow-lg shadow-red-200"
                >
                    <Plus size={20} /> Xarajat Qo'shish
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Jami Xarajat (Tanlangan davr)</div>
                    <div className="text-2xl font-bold text-red-600">
                        {totalAmount.toLocaleString()} so'm
                    </div>
                </div>
                <div className="col-span-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">Davr:</span>
                    </div>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="border rounded-lg p-2 text-sm"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="border rounded-lg p-2 text-sm"
                    />
                    {(dateFrom || dateTo) && (
                        <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-sm text-blue-600 hover:underline">
                            Tozalash
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-600">Sana</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Nomi</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Turi</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Summa</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Izoh</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 w-10">Amal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Xarajatlar yo'q</td></tr>
                            ) : (
                                expenses.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                            {new Date(item.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 font-medium text-gray-900">{item.name}</td>
                                        <td className="p-4">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs uppercase font-bold">
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-red-600 whitespace-nowrap">
                                            -{item.amount.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 max-w-xs truncate">{item.description || '-'}</td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Yangi Xarajat</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nomi</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Masalan: Ijara xaqi"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Summa</label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        value={form.amount}
                                        onChange={e => setForm({ ...form, amount: e.target.value })}
                                        className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Turi</label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm({ ...form, type: e.target.value })}
                                        className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="other">Boshqa</option>
                                        <option value="rent">Ijara</option>
                                        <option value="salary">Maosh</option>
                                        <option value="utility">Kommunal</option>
                                        <option value="tax">Soliq</option>
                                        <option value="maintenance">Remont</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sana</label>
                                <input
                                    type="date"
                                    required
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Izoh (ixtiyoriy)</label>
                                <textarea
                                    rows={2}
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Bekor qilish</button>
                                <button type="submit" className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Saqlash</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
