import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { X, ArrowRight, Package, User, ShoppingCart, Edit } from 'lucide-react';

interface ProductHistoryProps {
    productId: string;
    productName: string;
    onClose: () => void;
}

interface HistoryLog {
    id: string;
    type: string;
    quantity: number;
    stock_after: number;
    note: string;
    created_at: string;
    user: {
        username: string;
    } | null;
}

export default function ProductHistory({ productId, productName, onClose }: ProductHistoryProps) {
    const [logs, setLogs] = useState<HistoryLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, [productId]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await api.logs.list({ product_id: productId, limit: 50 });
            setLogs(data);
        } catch (e) {
            console.error("History load failed", e);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'import': return <Package size={16} className="text-blue-600" />;
            case 'sale': return <ShoppingCart size={16} className="text-green-600" />;
            case 'edit': return <Edit size={16} className="text-orange-600" />;
            default: return <ArrowRight size={16} className="text-gray-600" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'import': return "Kirim (Import)";
            case 'sale': return "Sotuv";
            case 'edit': return "Tahrirlash";
            case 'delete': return "O'chirish";
            case 'restock': return "Qoldiq to'ldirish";
            default: return type;
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col h-[80vh] animate-slide-up">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Mahsulot Tarixi</h2>
                        <p className="text-xs text-gray-500">{productName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-0 scrollbar-thin">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <div className="bg-gray-50 p-4 rounded-full mb-3">
                                <Package size={32} className="opacity-20" />
                            </div>
                            <p>Tarix topilmadi</p>
                            <p className="text-xs opacity-60 mt-1">Bu mahsulot bo'yicha hali hech qanday harakat bo'lmagan.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {logs.map(log => (
                                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex gap-3">
                                    <div className={`mt-1 p-2 rounded-lg h-fit ${log.quantity > 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                                        {getIcon(log.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-gray-800 text-sm">{getTypeLabel(log.type)}</span>
                                            <span className="text-xs text-gray-400 font-mono">{new Date(log.created_at).toLocaleString('uz-UZ')}</span>
                                        </div>

                                        <div className="mt-1 flex items-center gap-2 text-xs">
                                            {log.quantity > 0 ? (
                                                <span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">+{log.quantity}</span>
                                            ) : (
                                                <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">{log.quantity}</span>
                                            )}
                                            <ArrowRight size={12} className="text-gray-300" />
                                            <span className="text-gray-600 font-medium">Qoldiq: {log.stock_after}</span>
                                        </div>

                                        {log.note && (
                                            <div className="mt-1.5 text-xs text-gray-500 italic bg-gray-50 p-1.5 rounded border border-gray-100">
                                                {log.note}
                                            </div>
                                        )}

                                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400">
                                            <User size={10} />
                                            <span>{log.user?.username || 'Tizim'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-400">
                    Jami {logs.length} ta yozuv
                </div>
            </div>
        </div>
    );
}
