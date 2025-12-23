import { useEffect, useState } from 'react';
import { getSession, signOut } from './lib/auth';
import { api } from './lib/api';
import PartnerDashboard from './components/PartnerDashboard';
import Dashboard from './components/Dashboard';
import Warehouse from './components/Warehouse';
import Cashier from './components/Cashier';
import Debts from './components/Debts';
import Orders from './components/Orders';
import Promotions from './components/Promotions';
import Bundles from './components/Bundles';
import CustomerShop from './components/CustomerShop';
import Login from './components/Login';
import SuperAdminDashboard from './components/SuperAdmin/Dashboard';
import AdminStores from './components/SuperAdmin/Stores';
import AdminPartners from './components/SuperAdmin/Partners';
import Users from './components/Users';
import LandingPage from './components/LandingPage';
import Settings from './components/Settings';
import Expenses from './components/Expenses';
import { LayoutDashboard, Package, ShoppingCart, UserX, ClipboardList, Store, Menu, X, LogOut, Loader, Tags, Boxes, Shield, Users as UsersIcon, Settings as SettingsIcon, TrendingDown } from 'lucide-react';

import RemoteScanner from './components/RemoteScanner';

type Page = 'dashboard' | 'warehouse' | 'cashier' | 'debts' | 'orders' | 'customer' | 'promotions' | 'bundles' | 'super_dashboard' | 'admin_stores' | 'users' | 'partner_dashboard' | 'admin_partners' | 'settings' | 'expenses';

type UserRole = 'admin' | 'kassir' | 'omborchi' | 'customer' | 'OWNER' | 'ADMIN' | 'CASHIER' | 'SUPER_ADMIN' | 'WAREHOUSE' | 'DELIVERY' | 'PARTNER';

function App() {
  if (window.location.pathname === '/remote-scan') {
    return <RemoteScanner />;
  }

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [shopSlug, setShopSlug] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Check if we are in public shop mode
    const path = window.location.pathname;
    if (path.startsWith('/shop/')) {
      const slug = path.split('/')[2];
      if (slug) {
        setShopSlug(slug);
        setCurrentPage('customer');
      }
    }

    const s = getSession();
    if (s) {
      setIsAuthenticated(true);
      setUserRole(s.role as UserRole);
      setUserName(s.name);

      // Determine initial page based on role if not already set by shop slug
      if (!shopSlug) {
        const currentRole = s.role as UserRole;
        if (currentRole === 'customer') {
          setCurrentPage('customer');
        } else if (currentRole === 'SUPER_ADMIN') {
          setCurrentPage('super_dashboard');
        } else if (currentRole === 'PARTNER') {
          setCurrentPage('partner_dashboard');
        } else if (currentRole === 'CASHIER') {
          setCurrentPage('cashier'); // Cashier default
        } else {
          setCurrentPage('dashboard');
        }
      }
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
      setUserName('');
    }
    setLoading(false);
  }, []);



  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.error('Logout error', e);
    }
    signOut();
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName('');
    setCurrentPage('dashboard');
  };

  const getVisiblePages = (): Page[] => {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return ['super_dashboard', 'admin_stores', 'admin_partners'];
      case 'admin':
      case 'ADMIN':
      case 'OWNER':
        return ['dashboard', 'cashier', 'warehouse', 'debts', 'orders', 'promotions', 'bundles', 'customer', 'users', 'settings', 'expenses'];
      case 'kassir':
      case 'CASHIER':
        return ['cashier', 'debts', 'orders', 'settings', 'expenses'];
      case 'omborchi':
      case 'WAREHOUSE':
        return ['dashboard', 'warehouse', 'orders', 'settings'];
      case 'DELIVERY':
        return ['orders', 'debts', 'settings'];
      case 'PARTNER':
        return ['partner_dashboard', 'settings'];
      default:
        return ['settings'];
    }
  };

  const menuItems = [
    // Super Admin Items
    { id: 'super_dashboard' as Page, name: 'Boshqaruv (Admin)', icon: Shield, color: 'text-indigo-600', role: ['SUPER_ADMIN'] },
    { id: 'admin_stores' as Page, name: "Do'konlar", icon: Store, color: 'text-blue-600', role: ['SUPER_ADMIN'] },
    { id: 'admin_partners' as Page, name: "Hamkorlar", icon: UsersIcon, color: 'text-purple-600', role: ['SUPER_ADMIN'] },

    // Partner Items
    { id: 'partner_dashboard' as Page, name: 'Hamkor Kabineti', icon: LayoutDashboard, color: 'text-blue-600', role: ['PARTNER'] },

    // Store Items
    { id: 'dashboard' as Page, name: 'Boshqaruv Paneli', icon: LayoutDashboard, color: 'text-blue-600' },
    { id: 'users' as Page, name: 'Xodimlar', icon: UsersIcon, color: 'text-indigo-600', role: ['OWNER', 'ADMIN'] },
    { id: 'cashier' as Page, name: 'Kassir', icon: ShoppingCart, color: 'text-green-600' },
    { id: 'warehouse' as Page, name: 'Ombor', icon: Package, color: 'text-blue-600' },
    { id: 'debts' as Page, name: 'Qarzlar', icon: UserX, color: 'text-orange-600' },
    { id: 'orders' as Page, name: 'Buyurtmalar', icon: ClipboardList, color: 'text-blue-600' },
    { id: 'promotions' as Page, name: 'Aksiyalar', icon: Tags, color: 'text-pink-600' },
    { id: 'bundles' as Page, name: "To'plamlar", icon: Boxes, color: 'text-purple-600' },
    { id: 'expenses' as Page, name: 'Xarajatlar', icon: TrendingDown, color: 'text-red-500', role: ['OWNER', 'ADMIN', 'CASHIER'] },
    { id: 'settings' as Page, name: 'Sozlamalar', icon: SettingsIcon, color: 'text-gray-600', role: ['OWNER', 'ADMIN', 'CASHIER', 'WAREHOUSE', 'DELIVERY'] },
    { id: 'customer' as Page, name: 'Mijozlar Uchun', icon: Store, color: 'text-green-600' },
  ];

  const visiblePages = getVisiblePages();
  const visibleMenuItems = menuItems.filter(item => visiblePages.includes(item.id));

  const renderPage = () => {
    switch (currentPage) {
      // Super Admin
      case 'super_dashboard': return <SuperAdminDashboard />;
      case 'admin_stores': return <AdminStores />;
      case 'admin_partners': return <AdminPartners />;
      case 'users': return <Users />;

      // Store
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />;
      case 'warehouse': return <Warehouse />;
      case 'cashier': return <Cashier onExit={() => setCurrentPage('dashboard')} />;
      case 'debts': return <Debts />;
      case 'orders': return <Orders />;
      case 'promotions': return <Promotions />;
      case 'bundles': return <Bundles />;
      case 'customer': return <CustomerShop slug={shopSlug} />;
      case 'partner_dashboard': return <PartnerDashboard />;
      case 'settings': return <Settings />;
      case 'expenses': return <Expenses />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  // Redirect if current page is not allowed (handled efficiently to avoid loops)
  useEffect(() => {
    if (!loading && isAuthenticated && userRole) {
      const allowed = getVisiblePages();
      if (allowed.length > 0 && !allowed.includes(currentPage)) {
        setCurrentPage(allowed[0]);
      }
    }
  }, [currentPage, loading, isAuthenticated, userRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <Loader className="mx-auto mb-4 animate-spin text-blue-600" size={48} />
          <p className="text-gray-600 font-semibold">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !shopSlug) {
    if (showLogin) {
      return <Login
        onLoginSuccess={() => { setIsAuthenticated(true); const s = getSession(); if (s) setUserRole(s.role as any); }}
        onBack={() => setShowLogin(false)}
      />;
    }
    return <LandingPage onStart={() => setShowLogin(true)} />;
  }

  if (currentPage === 'customer' && shopSlug) {
    return <CustomerShop slug={shopSlug} />;
  }

  if (currentPage === 'customer') {
    return (
      <div className="relative">
        <button
          onClick={() => setCurrentPage(visiblePages[0] || 'dashboard')}
          className="fixed top-4 left-4 z-50 bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold border-2 border-gray-200"
        >
          ← Admin Paneliga Qaytish
        </button>
        <CustomerShop />
      </div>
    );
  }

  const isCashierMode = currentPage === 'cashier';

  return (
    <div className="flex h-screen bg-gray-100">
      {!isCashierMode && (
        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-white transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            }`}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
            <div>
              <h1 className="text-2xl font-bold">Dokon Tizimi</h1>
              <p className="text-gray-400 text-sm">
                {userRole === 'SUPER_ADMIN' ? 'Admin Panel' : 'Boshqaruv paneli'}
              </p>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-white hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${isActive
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                  <Icon size={24} className={isActive ? item.color : ''} />
                  <span className="font-semibold">{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-700 space-y-3 shrink-0 bg-gray-900/50">
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-300 font-semibold">{userName}</p>
              <p className="text-xs text-gray-400 mt-1">
                {userRole === 'SUPER_ADMIN' && 'Super Admin'}
                {(userRole === 'admin' || userRole === 'ADMIN') && 'Admin'}
                {userRole === 'OWNER' && 'Dokon Egasi'}
                {(userRole === 'kassir' || userRole === 'CASHIER') && 'Kassir'}
                {(userRole === 'omborchi' || userRole === 'WAREHOUSE') && 'Omborchi'}
                {userRole === 'DELIVERY' && 'Yetkazib Beruvchi'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-all font-semibold flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Chiqish
            </button>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-md z-40 md:hidden">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-800 hover:text-gray-600"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              {menuItems.find(item => item.id === currentPage)?.name}
            </h2>
            <div className="w-6"></div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {renderPage()}
        </main>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}

export default App;
