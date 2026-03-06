import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, FileText, DollarSign, BarChart3, Shield, Menu, X, BookOpen } from 'lucide-react';
import { storage } from './services/storage';
import { Dashboard } from './components/Dashboard';
import { EmployeeManagement } from './components/EmployeeManagement';
import { UserManagement } from './components/UserManagement';
import { JournalEntries } from './components/JournalEntries';
import { Invoicing } from './components/Invoicing';
import { FinancialReports } from './components/FinancialReports';
import { AuditTrail } from './components/AuditTrail';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { UserDropdown } from './components/UserDropdown';

type View = 'dashboard' | 'employees' | 'journal' | 'invoicing' | 'reports' | 'audit' | 'users';

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    storage.initializeDefaultAccounts();
  }, []);

  const baseMenu = [
    { id: 'dashboard' as View, name: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees' as View, name: 'Empleados', icon: Users },
    { id: 'journal' as View, name: 'Libro Diario', icon: BookOpen },
    { id: 'invoicing' as View, name: 'Facturación', icon: DollarSign },
    { id: 'reports' as View, name: 'Reportes', icon: BarChart3 },
    { id: 'audit' as View, name: 'Auditoría', icon: Shield },
  ];

  const menuItems = [...baseMenu];
  if (user?.role === 'ADMIN') {
    menuItems.splice(1, 0, { id: 'users' as View, name: 'Usuarios', icon: Users });
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'employees':
        return <EmployeeManagement />;
      case 'users':
        return <UserManagement />;
      case 'journal':
        return <JournalEntries />;
      case 'invoicing':
        return <Invoicing />;
      case 'reports':
        return <FinancialReports />;
      case 'audit':
        return <AuditTrail />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex relative">
      {/* watermark logo shown only when user is authenticated (hidden on small screens) */}
      {user && (
        <img
          src={import.meta.env.PROD ? './logo.jpg' : '/logo.jpg'}
          alt=""
          aria-hidden="true"
          className="hidden md:block"
          style={{
            position: 'fixed',
            top: '50%',
            left: '60%',
            transform: 'translate(-50%, -50%)',
            width: '18rem',
            height: '18rem',
            opacity: 0.05,
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex ${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex-col relative z-10`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold">Hvent</h1>
              <p className="text-xs text-gray-400">Sistema Contable Hvent</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      currentView === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {sidebarOpen && <span className="font-medium">{item.name}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className={`${sidebarOpen ? 'block' : 'hidden'} text-xs text-gray-400`}>
            <p className="mb-1">Sistema Contable Hvent v1.3 (núcleo)</p>
            <p>(Versión Demo)</p>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-20 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 z-30 w-64 bg-gray-900 text-white p-4">
            <div className="flex items-center justify-between border-b border-gray-700 pb-4">
              <div>
                <h1 className="text-lg font-bold">Hvent</h1>
                <p className="text-xs text-gray-400">Sistema Contable Hvent</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <nav className="mt-4">
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setCurrentView(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                          currentView === item.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="font-medium">{item.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="md:hidden p-2 rounded-md hover:bg-gray-100"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir menú"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                    {menuItems.find(item => item.id === currentView)?.name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {new Date().toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.fullName || 'Usuario'}</p>
                  <p className="text-xs text-gray-500">{user?.username}</p>
                </div>
                <UserDropdown />
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-[calc(100vh-5rem)]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}

const InnerApp: React.FC = () => {
  const { user } = useAuth();
  return user ? <AppContent /> : <Login />;
};

export default App;
