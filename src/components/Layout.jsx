import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, PlusCircle, Store } from 'lucide-react';
import clsx from 'clsx';

const Layout = () => {
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'POS / Sell', path: '/pos', icon: ShoppingCart },
    { name: 'Stock In / Buy', path: '/restock', icon: PlusCircle },
    { name: 'Inventory', path: '/inventory', icon: Package },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-indigo-900 text-white shadow-2xl z-50">
        <div className="p-6 pb-2 border-b border-indigo-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg text-indigo-900 shadow-md">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Tripty</h1>
              <p className="text-indigo-300 text-xs font-medium uppercase tracking-wider -mt-1">Confectionary</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20" 
                    : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
                )}
              >
                <Icon className={clsx("w-5 h-5", isActive ? "text-indigo-100" : "text-indigo-400")} />
                {link.name}
              </NavLink>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-indigo-800">
          <div className="bg-indigo-800/50 p-4 rounded-xl">
            <p className="text-xs text-indigo-300 font-medium">Logged in as</p>
            <p className="text-sm font-semibold text-white truncate">Admin User</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header 
          className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-center shadow-sm z-30 shrink-0"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
        >
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Tripty Confectionary</h1>
          </div>
        </header>

        {/* Page Content area. pb-20 on mobile to clear bottom nav */}
        <div className="flex-1 overflow-auto bg-gray-50/50">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full min-h-full flex flex-col relative">
            <Outlet />
            {/* Spacer for mobile bottom nav so content isn't hidden behind it */}
            <div className="lg:hidden shrink-0" style={{ height: 'calc(env(safe-area-inset-bottom) + 5rem)' }}></div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav 
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex justify-around items-center px-2 py-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) => clsx(
                    "flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200",
                    isActive 
                      ? "text-indigo-600" 
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <div className={clsx(
                    "p-1.5 rounded-xl transition-all duration-200",
                    isActive ? "bg-indigo-50" : "bg-transparent"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={clsx(
                    "text-[10px] font-medium mt-1 truncate w-full text-center transition-all duration-200",
                    isActive ? "font-bold" : ""
                  )}>
                    {link.name.split('/')[0].trim()}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
};

export default Layout;
