import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Search, Filter, Banknote, Tag } from 'lucide-react';

const Inventory = () => {
  const { items } = useInventory();
  const [search, setSearch] = useState('');

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.barcode.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Inventory Management</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:min-w-[300px]">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow shadow-sm placeholder-gray-400"
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 shadow-sm transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Barcode</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Stock</th>
                <th className="px-6 py-4 text-right">Buy Price</th>
                <th className="px-6 py-4 text-right">Sell Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-gray-100 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {item.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        {item.name}
                        {item.quantity && <span className="text-gray-500 font-normal text-xs ml-1.5">{item.quantity}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-500">{item.barcode}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                        <Tag className="w-3 h-3" />
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full text-xs font-bold ${
                        item.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600 tabular-nums">
                      {item.buyPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 tabular-nums">
                      {item.sellPrice.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-900">No items found</p>
                      <p className="text-sm mt-1">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4 mb-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover rounded-xl border border-gray-100 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-bold shrink-0">
                      {item.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base mb-1 truncate">
                      {item.name} {item.quantity && <span className="text-gray-500 font-normal text-sm ml-1">{item.quantity}</span>}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{item.barcode}</span>
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <Tag className="w-3 h-3" />
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className={`inline-flex flex-col items-center justify-center px-3 py-1 rounded-lg text-xs font-bold ${
                      item.stock < 5 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                    }`}>
                      <span className="text-[10px] text-opacity-80">Stock</span>
                      <span className="text-sm">{item.stock}</span>
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Buy Price</p>
                    <p className="font-medium text-gray-600">৳ {item.buyPrice.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-0.5">Sell Price</p>
                    <p className="font-bold text-indigo-700 text-lg leading-tight">৳ {item.sellPrice.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              <div className="flex flex-col items-center justify-center">
                <Search className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-lg font-medium text-gray-900">No items found</p>
                <p className="text-sm mt-1">Try adjusting your search criteria</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filteredItems.length} items</span>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
