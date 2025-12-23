import { useState } from 'react';
import SEO from './SEO';
import {
    Smartphone,
    Store,
    CheckCircle,
    ArrowRight,
    UserX,
    Phone,
    BarChart3,
    ShieldCheck,
    Zap,
    Menu,
    X
} from 'lucide-react';

interface LandingPageProps {
    onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
            <SEO />

            {/* --- TOP HEADER --- */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Store size={22} className="text-white" />
                        </div>
                        <span className="text-xl md:text-2xl font-black tracking-tight text-gray-900 uppercase">
                            DOOKON
                        </span>
                    </div>

                    <div className="hidden lg:flex items-center gap-8">
                        <a href="#about" className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">Tizim Haqida</a>
                        <a href="#features" className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">Bo'limlar</a>
                        <a href="#pricing" className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">Narxlar</a>
                        <a href="tel:+998942223545" className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-2">
                            <Phone size={16} /> +998 94 222-35-45
                        </a>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onStart}
                            className="hidden sm:block px-6 py-2.5 bg-indigo-600 text-white text-sm font-black rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                        >
                            Kirish
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden bg-white border-b border-gray-200 animate-slide-down">
                        <div className="px-4 py-6 space-y-4">
                            <a href="#about" onClick={() => setIsMenuOpen(false)} className="block text-lg font-bold text-gray-700 hover:text-indigo-600">Tizim Haqida</a>
                            <a href="#features" onClick={() => setIsMenuOpen(false)} className="block text-lg font-bold text-gray-700 hover:text-indigo-600">Bo'limlar</a>
                            <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="block text-lg font-bold text-gray-700 hover:text-indigo-600">Narxlar</a>
                            <a href="tel:+998942223545" className="block text-lg font-bold text-indigo-600">+998 94 222-35-45</a>
                            <button
                                onClick={onStart}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-lg"
                            >
                                Kirish / Boshlash
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="pt-24 md:pt-40 pb-16 md:pb-32 px-4 md:px-6 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full mb-8 border border-indigo-100">
                                <Smartphone size={14} className="animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Apparatsiz Savdo</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-8 tracking-tight text-gray-900">
                                <span className="text-indigo-600">Dookon</span> — Eng Qulay <br />
                                Kassa va Ombor <br />
                                Tizimi.
                            </h1>
                            <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                Kompyuter, shtrix-kod skaner va boshqa apparatlar shart emas. Do'koningizni hamyoningizda olib yuring. Istalgan joyda, istalgan vaqtda sotuv qiling.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <button
                                    onClick={onStart}
                                    className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white rounded-xl font-black text-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-200"
                                >
                                    Bepul Sinab Ko'ring
                                    <ArrowRight />
                                </button>
                                <div className="flex items-center gap-3 text-gray-400 font-bold">
                                    <CheckCircle className="text-green-500" size={20} />
                                    Karta talab qilinmaydi
                                </div>
                            </div>

                            <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 border-t border-gray-100 pt-10">
                                <div>
                                    <div className="text-3xl font-black text-gray-900">0 sum</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Apparat xarajatlari</div>
                                </div>
                                <div className="w-[1px] h-12 bg-gray-200"></div>
                                <div>
                                    <div className="text-3xl font-black text-gray-900">1 daqiqa</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ro'yxatdan o'tish</div>
                                </div>
                            </div>
                        </div>

                        {/* DASHBOARD PREVIEW */}
                        <div className="flex-1 w-full max-w-2xl lg:translate-x-10">
                            <div className="bg-gray-100 p-2 md:p-3 rounded-[2.5rem] border-2 border-gray-200 shadow-2xl">
                                <div className="bg-white rounded-[1.8rem] overflow-hidden border border-gray-200 shadow-inner">
                                    {/* Placeholder for now, generate_image used in context but not saved to file system manually */}
                                    <div className="bg-slate-50 w-full aspect-video flex items-center justify-center">
                                        <span className="text-gray-400 font-bold">Dashboard Preview</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- BUSINESS STATS --- */}
            <section id="about" className="py-24 px-4 bg-gray-50 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-sm font-black text-indigo-600 uppercase tracking-[0.4em] mb-4">MUKAMMAL BIZNES</h2>
                        <p className="text-3xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight">Vaqtingizni va Pulingizni tejang.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { i: Zap, t: "Tezkor Savdo", d: "Kamerani shtrix-kodga tuting va sotuvni amalga oshiring. Hech qanday murakkabliksiz." },
                            { i: ShieldCheck, t: "Xavfsiz Nazorat", d: "Masofadan turib barcha savdolarni tekshiring. Xodimlar harakatini nazorat qiling." },
                            { i: BarChart3, t: "Real Hisobot", d: "Kunlik foyda, qoldiqlar va xarajatlar - barchasi tushunarli grafiklarda." }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white p-10 rounded-[2.5rem] border border-gray-200 hover:shadow-2xl transition-all group">
                                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                    <item.i size={32} />
                                </div>
                                <h3 className="text-2xl font-black mb-4">{item.t}</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">{item.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- MODULE SHOWCASE --- */}
            <section id="features" className="py-24 px-4 bg-white">
                <div className="max-w-7xl mx-auto space-y-40">

                    {/* Module 1: Kassa */}
                    <div className="flex flex-col lg:flex-row items-center gap-16 md:gap-24">
                        <div className="flex-1 order-2 lg:order-1 w-full max-w-md mx-auto">
                            <div className="bg-gray-100 p-2 rounded-[3.5rem] border-2 border-gray-200">
                                <div className="bg-white rounded-[2.8rem] overflow-hidden border border-gray-200 shadow-xl aspect-[9/19] flex items-center justify-center text-gray-300 font-bold text-2xl">
                                    KASSA UI
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 order-1 lg:order-2">
                            <div className="inline-block px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest mb-6">KASSA MODULI</div>
                            <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 leading-tight tracking-tight">Kamera orqali <br /> <span className="text-indigo-600">Shtrix-kod o'qing.</span></h3>
                            <p className="text-gray-500 text-lg font-medium leading-relaxed mb-10">
                                Kassa apparati endi shart emas. Smartfon kamerasini tovar shtrix-kodiga qarating va tizim avtomatik mahsulotni tanlaydi. Naqd, karta va qarz — barcha to'lovlar bir joyda.
                            </p>
                            <ul className="space-y-4">
                                {["Dona, kg va litr o'lchov birliklari", "Mijozni qarzga sotuvchi moduli", "Chek chiqarish imkoniyati"].map((l, i) => (
                                    <li key={i} className="flex items-center gap-3 font-black text-gray-700">
                                        <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><CheckCircle size={16} /></div>
                                        {l}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Module 2: Qarzlar */}
                    <div className="flex flex-col lg:flex-row items-center gap-16 md:gap-24">
                        <div className="flex-1 order-2 lg:order-1 w-full max-w-2xl border bg-slate-50 rounded-3xl h-64 flex items-center justify-center font-bold text-gray-300 text-3xl">
                            QARZLAR UI
                        </div>
                        <div className="flex-1 order-1 lg:order-2">
                            <div className="inline-block px-4 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-black uppercase tracking-widest mb-6">MOLIYAVIY NAZORAT</div>
                            <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 leading-tight tracking-tight">Qarzlar va To'lovlar <br /> <span className="text-orange-600">Daftarsiz boshqaruv.</span></h3>
                            <p className="text-gray-500 text-lg font-medium leading-relaxed mb-10">
                                Mijozlaringiz qarzlari qachon olingan, qachon qaytarilishi kerak? Hammasi tizimli. Har bir mijoz uchun alohida qarz tarixi va umumiy hisoblar.
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 font-bold text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center shrink-0">
                                        <UserX size={20} />
                                    </div>
                                    Mijozlar qarz balansi
                                </div>
                                <div className="flex items-center gap-3 font-bold text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center shrink-0">
                                        <BarChart3 size={20} />
                                    </div>
                                    Qaytarilgan qarzlar tarixi
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Module 3: Telegram Shop */}
                    <div className="bg-indigo-600 rounded-[3rem] p-8 md:p-20 text-white flex flex-col lg:flex-row items-center gap-16 overflow-hidden relative shadow-2xl shadow-indigo-200">
                        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 -skew-x-12 translate-x-20"></div>
                        <div className="flex-1 relative z-10">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-10">
                                <Store size={32} />
                            </div>
                            <h3 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tight">Telegram orqali <br /> Onlayn Sotuvlar.</h3>
                            <p className="text-white/70 text-lg md:text-xl font-medium mb-12 max-w-lg leading-relaxed">
                                Mijozlaringiz Telegramdan chiqmasdan turib mahsulotlaringizni buyurtma qilishsin. Professional onlayn do'koningizni bir tugma bilan ishga tushiring.
                            </p>
                            <button
                                onClick={onStart}
                                className="w-full sm:w-auto px-10 py-5 bg-white text-indigo-600 rounded-xl font-black text-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                Do'kon Ochish
                                <ArrowRight />
                            </button>
                        </div>
                        <div className="flex-1 w-full max-w-lg relative z-10">
                            <div className="bg-gray-900/50 p-2 rounded-[3rem] backdrop-blur-md border border-white/10 shadow-2xl h-80 flex items-center justify-center">
                                <span className="text-white font-bold opacity-50">Telegram Bot UI</span>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* --- PRICING --- */}
            <section id="pricing" className="py-24 px-4 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 text-indigo-600">
                        <h2 className="text-sm font-black uppercase tracking-[0.4em] mb-4">OPTIMAL NARXLAR</h2>
                        <p className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">Biznesingizga mos tarif.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { n: "Standard", p: "99,000", d: "Kichik do'konlar uchun", f: ["Sotuvlar Paneli", "Qarzlar Hisobi", "1 ta Xodim", "Kamera Skaner"] },
                            { n: "Premium", p: "249,000", d: "Rivojlanayotgan biznes", f: ["Telegram Shop", "Cheksiz Ombor", "5 ta Xodim", "Aksiya & To'plamlar"], pop: true },
                            { n: "Business", p: "499,000", d: "Katta tarmoqlar uchun", f: ["Shaxsiy Domen", "API Integratsiya", "Cheksiz Xodim", "VIP Dastak 24/7"] }
                        ].map((plan, i) => (
                            <div key={i} className={`relative p-10 rounded-[3rem] flex flex-col bg-white border transition-all ${plan.pop ? 'border-indigo-600 shadow-2xl ring-4 ring-indigo-50' : 'border-gray-200 shadow-sm'}`}>
                                {plan.pop && (
                                    <div className="absolute top-0 right-10 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-black px-4 py-2 rounded-full tracking-widest uppercase shadow-lg">TAVSIYA</div>
                                )}
                                <h4 className="text-2xl font-black text-gray-900 mb-2">{plan.n}</h4>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-10">{plan.d}</p>
                                <div className="flex items-baseline gap-1 mb-10">
                                    <span className="text-5xl font-black text-gray-900">{plan.p}</span>
                                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">so'm / oy</span>
                                </div>
                                <div className="space-y-4 mb-12 flex-grow">
                                    {plan.f.map((feat, j) => (
                                        <div key={j} className="flex items-center gap-3 text-gray-600">
                                            <CheckCircle size={18} className="text-indigo-600" />
                                            <span className="font-bold text-sm tracking-tight">{feat}</span>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={onStart} className={`w-full py-4 rounded-xl font-black text-lg transition-all active:scale-95 ${plan.pop ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-700'}`}>Tanlash</button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CONTACT & CTA --- */}
            <section className="py-24 px-4 bg-white">
                <div className="max-w-5xl mx-auto rounded-[3rem] bg-gray-900 px-8 md:px-20 py-16 md:py-24 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-600/30 blur-[80px] rounded-full translate-x-[-20%] translate-y-[-20%] scale-150"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black mb-10 tracking-tight leading-tight">Savollaringiz bormi yoki yordam kerakmi?</h2>
                        <div className="space-y-12">
                            <a
                                href="tel:+998942223545"
                                className="text-4xl md:text-6xl font-black text-indigo-400 hover:text-indigo-300 transition-colors tracking-tighter block"
                            >
                                +998 94 222-35-45
                            </a>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <button
                                    onClick={onStart}
                                    className="px-12 py-6 bg-white text-gray-900 rounded-2xl font-black text-2xl hover:scale-105 active:scale-95 transition-transform"
                                >
                                    Bepul Ishlab Ko'ring
                                </button>
                            </div>
                            <p className="text-gray-500 font-bold text-xs uppercase tracking-[0.4em]">14 kUNLIK SINOV MUDDATI • KARTA SHART EMAS</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-20 px-4 border-t border-gray-100">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><Store size={20} /></div>
                        <span className="text-xl font-black tracking-tighter text-gray-900 uppercase">DOOKON</span>
                    </div>
                    <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span className="hover:text-indigo-600 cursor-pointer">Maxfiylik</span>
                        <span className="hover:text-indigo-600 cursor-pointer">Qoidalar</span>
                        <span className="hover:text-indigo-600 cursor-pointer">Hamkorlik</span>
                    </div>
                    <div className="text-gray-400 font-black text-[10px] uppercase tracking-[0.3em]">© 2025 DOOKON — UNLIMITED ERP</div>
                </div>
            </footer>

            {/* Global CSS */}
            <style>{`
        html { scroll-behavior: smooth; }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
      `}</style>
        </div>
    );
}
