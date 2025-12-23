import React, { useState } from 'react';
import { api } from '../lib/api';
import { Store, Phone, User, Lock, Loader, Building2 } from 'lucide-react';
import { saveSession } from '../lib/auth';

interface LoginProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
}

export default function Login({ onLoginSuccess, onBack }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login State
  const [storePhone, setStorePhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [showAdvancedLogin, setShowAdvancedLogin] = useState(false); // Hidden state

  // Register State
  const [regStoreName, setRegStoreName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regPartnerLogin, setRegPartnerLogin] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.auth.login({
        storePhone: (isSuperAdmin || isPartner) ? undefined : storePhone,
        username,
        password,
        isSuperAdmin,
        isPartner
      });

      saveSession({
        role: res.user.role,
        name: res.user.username,
        storeName: res.store.name,
        plan: res.store.plan,
      });

      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || "Kirishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.auth.registerStore({
        name: regStoreName,
        phone: regPhone,
        password: regPassword,
        ownerName: regOwnerName,
        partnerLogin: regPartnerLogin || undefined
      });

      setSuccessMsg("Do'kon muvaffaqiyatli ochildi! Endi kirishingiz mumkin.");
      setIsLogin(true); // Switch to login
      setStorePhone(regPhone);
      setUsername('admin'); // Default admin user
    } catch (err: any) {
      setError(err.message || "Ro'yxatdan o'tishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-green-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 p-8 text-white text-center cursor-pointer select-none" onDoubleClick={() => setShowAdvancedLogin(!showAdvancedLogin)}>
            <div className="flex items-center justify-center gap-3 mb-3">
              <Store size={40} />
              <h1 className="text-3xl font-bold">Dokon Tizimi</h1>
            </div>
            <p className="text-blue-100">Professional Boshqaruv Platformasi</p>
          </div>

          <div className="p-8">
            <div className="flex gap-2 mb-8">
              <button
                onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${isLogin
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Kirish
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${!isLogin
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Yangi Do'kon
              </button>
            </div>

            {successMsg && (
              <div className="mb-4 p-4 rounded-lg bg-green-100 text-green-800 text-sm font-medium">
                {successMsg}
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 rounded-lg bg-red-100 text-red-800 text-sm font-medium">
                {error}
              </div>
            )}

            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="flex flex-col gap-2 mb-4 bg-gray-50 rounded p-2">
                  {/* Hidden by default, toggled via secret interaction */}
                  {showAdvancedLogin && (
                    <div className="animate-fade-in space-y-2">
                      <div className="flex items-center gap-2 text-sm cursor-pointer" onClick={() => { setIsSuperAdmin(!isSuperAdmin); if (!isSuperAdmin) setIsPartner(false); }}>
                        <input type="checkbox" checked={isSuperAdmin} onChange={e => { setIsSuperAdmin(e.target.checked); if (e.target.checked) setIsPartner(false); }} className="cursor-pointer" />
                        <label className="font-bold text-gray-600 cursor-pointer select-none">Tizim Administratori (Super Admin)</label>
                      </div>
                      <div className="flex items-center gap-2 text-sm cursor-pointer" onClick={() => { setIsPartner(!isPartner); if (!isPartner) setIsSuperAdmin(false); }}>
                        <input type="checkbox" checked={isPartner} onChange={e => { setIsPartner(e.target.checked); if (e.target.checked) setIsSuperAdmin(false); }} className="cursor-pointer" />
                        <label className="font-bold text-gray-600 cursor-pointer select-none">Hamkor (Partner)</label>
                      </div>
                    </div>
                  )}
                </div>

                {!isSuperAdmin && !isPartner && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Do'kon Telefoni (ID)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        required={!isSuperAdmin}
                        value={storePhone}
                        onChange={(e) => setStorePhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="991234567"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Foydalanuvchi</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="admin"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Parol</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader className="animate-spin" size={20} />}
                  Tizimga Kirish
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Do'kon Nomi</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      required
                      value={regStoreName}
                      onChange={(e) => setRegStoreName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Mening Do'konim"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ega Ismi</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      required
                      value={regOwnerName}
                      onChange={(e) => setRegOwnerName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ismingiz"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon (Login bo'ladi)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="991234567"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Parol</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hamkor Logini (ixtiyoriy)</label>
                  <input
                    type="text"
                    value={regPartnerLogin}
                    onChange={(e) => setRegPartnerLogin(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Mavjud bo'lsa (Login yoki Telefon)"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-all font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader className="animate-spin" size={20} />}
                  Do'kon Ochish
                </button>
              </form>
            )}
            {onBack && (
              <button
                onClick={onBack}
                className="w-full mt-4 text-gray-400 hover:text-gray-600 text-sm font-bold transition-all"
              >
                ← Orqaga qaytish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
