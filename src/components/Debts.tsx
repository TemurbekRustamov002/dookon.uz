import { useEffect, useState } from 'react';
import { api, Debt } from '../lib/api';
import {
  UserX,
  CheckCircle,
  Search,
  History,
  CreditCard,
  TrendingDown,
  TrendingUp,
  X,
  ShoppingCart
} from 'lucide-react';

export default function Debts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  // We will store the full detailed debt object here
  const [selectedDebtHistory, setSelectedDebtHistory] = useState<any | null>(null);

  const [filter, setFilter] = useState<'all' | 'active' | 'paid'>('active');
  const [searchTerm, setSearchTerm] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTargetDebt, setPaymentTargetDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Tab state for history modal
  const [historyTab, setHistoryTab] = useState<'payments' | 'purchases'>('payments');

  useEffect(() => {
    loadDebts();
  }, [filter]);

  const loadDebts = async () => {
    try {
      const data = await api.debts.list(filter === 'all' ? undefined : filter);
      setDebts(data || []);
    } catch (e) {
      console.error("Failed to load debts", e);
    }
  };

  const openPaymentModal = (debt: Debt) => {
    setPaymentTargetDebt(debt);
    setPaymentAmount('');
    setShowPaymentModal(true);
  };

  const viewHistory = async (debt: Debt) => {
    try {
      // Fetch full details: payments + sales items
      const details = await api.debts.getDetails(debt.id);
      setSelectedDebtHistory(details);
      setHistoryTab('payments'); // Reset to default tab
    } catch (e) {
      alert('Tarixni yuklashda xatolik');
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetDebt) return;

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > paymentTargetDebt.remaining_amount) {
      alert('Noto\'g\'ri summa! Qarz miqdoridan oshib ketmasligi kerak.');
      return;
    }

    try {
      await api.debts.addPayment(paymentTargetDebt.id, amount);
      setShowPaymentModal(false);
      setPaymentTargetDebt(null);
      setPaymentAmount('');
      loadDebts();
      // Also update history if open
      if (selectedDebtHistory && selectedDebtHistory.id === paymentTargetDebt.id) {
        viewHistory(paymentTargetDebt);
      }
    } catch (error: any) {
      alert('Xatolik: ' + error.message);
    }
  };

  const filteredDebts = debts.filter(debt =>
    debt.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    debt.customer_phone.includes(searchTerm)
  );

  const totalActiveDebt = debts
    .filter(d => d.status === 'active')
    .reduce((sum, d) => sum + d.remaining_amount, 0);

  const totalPaid = debts.reduce((sum, d) => sum + d.paid_amount, 0);

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Qarzlar Daftari</h1>
            <p className="text-gray-500 text-sm">Mijozlarning qarz holati va to'lovlar tarixi</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto overflow-x-auto">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex items-center gap-3 min-w-[200px]">
              <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                <TrendingDown size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Jami Qarz (Faol)</p>
                <p className="text-xl font-bold text-gray-900">{totalActiveDebt.toLocaleString()} <span className="text-xs font-normal">so'm</span></p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex items-center gap-3 min-w-[200px]">
              <div className="bg-green-100 p-2 rounded-lg text-green-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Jami Undirilgan</p>
                <p className="text-xl font-bold text-gray-900">{totalPaid.toLocaleString()} <span className="text-xs font-normal">so'm</span></p>
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

          <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
            {(['all', 'active', 'paid'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {f === 'all' ? 'Barchasi' : f === 'active' ? 'Faol' : "To'langan"}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mijoz</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Umumiy Qarz</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">To'langan</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Qoldiq</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDebts.map(debt => (
                <tr key={debt.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-3">
                    <div className="font-bold text-gray-900">{debt.customer_name}</div>
                    <div className="text-xs text-gray-500 font-mono">{debt.customer_phone}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{new Date(debt.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-gray-600">
                    {debt.total_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-green-600">
                    {debt.paid_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="font-bold text-gray-900">{debt.remaining_amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    {debt.status === 'active' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Faol
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Yopilgan
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => viewHistory(debt)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Tarixni ko'rish"
                      >
                        <History size={18} />
                      </button>
                      {debt.status === 'active' && (
                        <button
                          onClick={() => openPaymentModal(debt)}
                          className="p-2 text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm shadow-green-200 transition-all active:scale-95 flex items-center gap-1 text-xs font-bold px-3"
                        >
                          <CreditCard size={14} /> To'lov
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDebts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <UserX size={48} className="mx-auto mb-3 opacity-20" />
                    <p>Qarzlar topilmadi</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden space-y-3">
          {filteredDebts.map(debt => (
            <div key={debt.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 active:scale-[0.99] transition-transform">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-gray-900">{debt.customer_name}</div>
                  <div className="text-xs text-gray-500">{debt.customer_phone}</div>
                </div>
                {debt.status === 'active' ? (
                  <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Qarz</span>
                ) : (
                  <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Yopilgan</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="text-[10px] text-gray-400 uppercase">Jami</div>
                  <div className="font-semibold text-sm">{debt.total_amount.toLocaleString()}</div>
                </div>
                <div className="bg-green-50 p-2 rounded-lg">
                  <div className="text-[10px] text-green-400 uppercase">To'landi</div>
                  <div className="font-semibold text-sm text-green-700">{debt.paid_amount.toLocaleString()}</div>
                </div>
                <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                  <div className="text-[10px] text-red-400 uppercase">Qoldiq</div>
                  <div className="font-bold text-sm text-red-700">{debt.remaining_amount.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => viewHistory(debt)}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 font-medium text-sm rounded-lg hover:bg-gray-200"
                >
                  Tarix
                </button>
                {debt.status === 'active' && (
                  <button
                    onClick={() => openPaymentModal(debt)}
                    className="flex-[2] py-2 bg-green-600 text-white font-bold text-sm rounded-lg hover:bg-green-700 shadow-lg shadow-green-100"
                  >
                    To'lov Qilish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && paymentTargetDebt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
              <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">To'lov Qilish</h3>
                  <p className="text-xs text-gray-500">{paymentTargetDebt.customer_name}</p>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="p-6">
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6 text-center">
                  <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Joriy Qarz</p>
                  <p className="text-3xl font-black text-orange-600 tracking-tight">{paymentTargetDebt.remaining_amount.toLocaleString()}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">To'lov Summasi</label>
                    <input
                      type="number"
                      autoFocus
                      className="w-full text-xl font-bold p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="0"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <button type="button" onClick={() => setPaymentAmount(paymentTargetDebt.remaining_amount.toString())} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium whitespace-nowrap">To'liq yopish</button>
                    <button type="button" onClick={() => setPaymentAmount((paymentTargetDebt.remaining_amount / 2).toString())} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium whitespace-nowrap">50%</button>
                  </div>

                  <button
                    onClick={handlePayment}
                    className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-xl shadow-green-200 active:scale-[0.98] transition-transform"
                  >
                    Tasdiqlash
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {selectedDebtHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-up">
              <div className="p-5 border-b bg-gray-50 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">Qarz Tarixi</h3>
                  <p className="text-xs text-gray-500">{selectedDebtHistory.customer_name}</p>
                </div>
                <button onClick={() => setSelectedDebtHistory(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              {/* Tabs */}
              <div className="flex p-2 bg-white border-b gap-2">
                <button
                  onClick={() => setHistoryTab('payments')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${historyTab === 'payments' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  To'lovlar
                </button>
                <button
                  onClick={() => setHistoryTab('purchases')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${historyTab === 'purchases' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  Xaridlar (Mahsulotlar)
                </button>
              </div>

              <div className="overflow-y-auto p-4 space-y-2 bg-gray-50 flex-1">
                {historyTab === 'payments' ? (
                  <>
                    {selectedDebtHistory.payments.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">
                        <History size={48} className="mx-auto mb-2 opacity-20" />
                        <p>To'lovlar mavjud emas</p>
                      </div>
                    ) : (
                      selectedDebtHistory.payments.map((payment: any) => (
                        <div key={payment.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-full text-green-600">
                              <CheckCircle size={16} />
                            </div>
                            <div>
                              <div className="font-bold text-gray-800">To'lov</div>
                              <div className="text-xs text-gray-500">{new Date(payment.payment_date).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="font-bold text-green-600">
                            +{payment.amount.toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    {(!selectedDebtHistory.sales_links || selectedDebtHistory.sales_links.length === 0) ? (
                      <div className="text-center py-10 text-gray-400">
                        <ShoppingCart size={48} className="mx-auto mb-2 opacity-20" />
                        <p>Xaridlar tarixi mavjud emas</p>
                      </div>
                    ) : (
                      selectedDebtHistory.sales_links.map((link: any) => {
                        const sale = link.sale;
                        return (
                          <div key={link.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-2">
                            <div className="flex justify-between items-center mb-2 border-b pb-2">
                              <div>
                                <div className="font-bold text-gray-800 text-sm">Sale #{sale.sale_number}</div>
                                <div className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleString()}</div>
                              </div>
                              <div className="text-right">
                                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-full font-bold">
                                  {sale.total_amount.toLocaleString()} so'm
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {sale.sale_items.map((item: any) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span className="text-gray-700">{item.product.name}</span>
                                  <span className="text-gray-500 text-xs">
                                    {item.quantity} x {item.price.toLocaleString()} = {item.total.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                )}
              </div>

              <div className="border-t bg-white p-4 shrink-0">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Jami Qarz:</span>
                  <span>{selectedDebtHistory.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-red-600 text-lg">
                  <span>Qoldiq:</span>
                  <span>{selectedDebtHistory.remaining_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
