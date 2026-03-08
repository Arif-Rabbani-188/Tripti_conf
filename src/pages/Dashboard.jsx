import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { Banknote, TrendingUp, TrendingDown, AlertCircle, PackageSearch } from 'lucide-react';
import clsx from 'clsx';

const StatsCard = ({ title, value, icon: Icon, trend, type = 'neutral' }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-1">
            <Banknote className="w-5 h-5 text-gray-400" />
            {value.toLocaleString()}
          </h3>
        </div>
        <div className={clsx(
          "p-3 rounded-xl",
          type === 'positive' && "bg-green-100 text-green-600",
          type === 'negative' && "bg-red-100 text-red-600",
          type === 'neutral' && "bg-indigo-100 text-indigo-600"
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div className={clsx(
          "mt-4 text-sm flex items-center gap-1 font-medium",
          trend.isUp ? "text-green-600" : "text-red-600"
        )}>
          {trend.isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {trend.value}% <span className="text-gray-400 font-normal">vs yesterday</span>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { items, sales, buys } = useInventory();

  // Calculate today's sales
  const today = new Date().toISOString().split('T')[0];
  
  const todaySales = sales.filter(s => s.date.startsWith(today)).reduce((sum, s) => sum + s.total, 0);
  const todayProfit = sales.filter(s => s.date.startsWith(today)).reduce((sum, s) => sum + (s.profit || 0), 0);
  const todayBuys = buys.filter(b => b.date.startsWith(today)).reduce((sum, b) => sum + b.total, 0);

  const lowStockItems = items.filter(item => item.stock < 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overivew</h2>
        <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          title="Today's Sales" 
          value={todaySales} 
          icon={TrendingUp} 
          type="positive" 
          trend={{ isUp: true, value: 12.5 }} 
        />
        <StatsCard 
          title="Today's Purchases" 
          value={todayBuys} 
          icon={PackageSearch} 
          type="neutral"
        />
        <StatsCard 
          title="Sales Profit" 
          value={todayProfit} 
          icon={todayProfit >= 0 ? TrendingUp : TrendingDown} 
          type={todayProfit >= 0 ? "positive" : "negative"} 
        />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Low Stock Alerts
          </h3>
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
            {lowStockItems.length} items
          </span>
        </div>

        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
          {lowStockItems.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {lowStockItems.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-xl border border-gray-100 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0">
                        {item.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.name} {item.quantity && <span className="text-gray-500 font-normal text-sm ml-1">{item.quantity}</span>}
                      </p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">Barcode: {item.barcode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      {item.stock} left
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <p className="font-medium">All items are sufficiently stocked!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
