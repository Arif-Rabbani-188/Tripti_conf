import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import Scanner from '../components/Scanner';
import { Camera, Plus, Minus, Trash2, CheckCircle, CreditCard, Banknote } from 'lucide-react';
import clsx from 'clsx';

const Pos = () => {
  const { items, addSale } = useInventory();
  const [cart, setCart] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [manualBarcode, setManualBarcode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const addToCart = (barcode) => {
    const item = items.find(i => i.barcode === barcode);
    if (!item) {
      alert("Item not found in inventory!");
      return;
    }

    const cartItem = cart.find(c => c.barcode === barcode);
    if (cartItem) {
      if (item.stock > cartItem.qty) {
        setCart(cart.map(c => c.barcode === barcode ? { ...c, qty: c.qty + 1 } : c));
      } else {
        alert("Not enough stock!");
      }
    } else {
      if (item.stock > 0) {
        setCart([...cart, { ...item, qty: 1 }]);
      } else {
        alert("Item out of stock!");
      }
    }
  };

  const updateQty = (barcode, delta) => {
    const item = items.find(i => i.barcode === barcode);
    setCart(cart.map(c => {
      if (c.barcode === barcode) {
        const newQty = c.qty + delta;
        if (newQty > 0 && newQty <= item.stock) {
          return { ...c, qty: newQty };
        }
      }
      return c;
    }));
  };

  const removeFromCart = (barcode) => {
    setCart(cart.filter(c => c.barcode !== barcode));
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (manualBarcode) {
      addToCart(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  const handleScan = (decodedText) => {
    addToCart(decodedText);
    setShowScanner(false);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.qty), 0);
  const subtotalProfit = cart.reduce((sum, item) => sum + ((item.sellPrice - item.buyPrice) * item.qty), 0);
  const finalTotal = Math.max(0, subtotal - discount);
  const finalProfit = subtotalProfit - discount;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    addSale(cart, finalTotal, finalProfit);
    setCart([]);
    setDiscount(0);
    alert("Sale completed successfully!");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full p-2">
      {/* Search and Cart Items section */}
      <div className="flex-1 flex flex-col space-y-4 lg:pr-4 h-full">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Point of Sale</h2>
        </div>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleManualAdd} className="flex-1 flex gap-2">
            <input 
              autoFocus
              type="text" 
              placeholder="Enter Barcode manually..."
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow placeholder-gray-400 font-mono text-sm"
            />
            <button type="submit" className="px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-100 transition-colors">
              Add
            </button>
          </form>
          <button 
            onClick={() => setShowScanner(true)}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 font-semibold"
          >
            <Camera className="w-5 h-5" />
            <span className="hidden sm:inline">Scan Item</span>
          </button>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex-none font-semibold text-gray-700">
            Current Cart ({cart.length} items)
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 p-8">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-gray-300" />
                </div>
                <p className="font-medium text-center">Your cart is empty.<br/><span className="text-sm font-normal">Scan an item or enter a barcode to begin.</span></p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.barcode} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-indigo-100 transition-colors">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-lg border border-gray-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                        {item.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {item.name} {item.quantity && <span className="text-gray-500 font-normal text-sm ml-1">{item.quantity}</span>}
                      </p>
                      <p className="text-sm text-gray-500 tabular-nums">৳ {item.sellPrice.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                      <button 
                        onClick={() => updateQty(item.barcode, -1)}
                        className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-bold font-mono">{item.qty}</span>
                      <button 
                        onClick={() => updateQty(item.barcode, 1)}
                        className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="w-24 text-right pr-2">
                      <p className="font-bold text-indigo-700 tabular-nums">
                        ৳ {(item.qty * item.sellPrice).toLocaleString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.barcode)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Sidebar section */}
      <div className="w-full lg:w-80 bg-white shadow-xl lg:shadow-sm border border-gray-100 rounded-3xl lg:rounded-2xl p-6 flex flex-col shrink-0 h-fit lg:h-[calc(100vh-8rem)] sticky bottom-0 z-10 lg:static">
        <h3 className="text-lg font-bold border-b border-gray-100 pb-4 mb-4 text-gray-900">Summary</h3>
        
        <div className="space-y-4 mb-6 flex-1">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums">৳ {subtotal.toLocaleString()}</span>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-gray-600 text-sm font-medium">
              <span>Discount</span>
              <span className="font-mono tabular-nums text-red-500">- ৳ {discount.toLocaleString()}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">৳</span>
              <input 
                type="number" 
                placeholder="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex justify-between text-gray-600 pt-2">
            <span className="text-sm">Profit (Est.)</span>
            <span className={clsx(
              "font-mono tabular-nums font-bold",
              finalProfit >= 0 ? "text-green-600" : "text-red-600"
            )}>
              ৳ {finalProfit.toLocaleString()}
            </span>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
            <span className="text-xl font-bold text-gray-900">Total</span>
            <span className="text-2xl font-black text-indigo-600 tabular-nums">
              ৳ {finalTotal.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mb-6 space-y-2">
          <p className="text-sm font-semibold text-gray-700 mb-2">Payment Method</p>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setPaymentMethod('cash')}
              className={clsx(
                "py-2.5 px-4 rounded-xl border flex flex-col items-center gap-1 transition-all",
                paymentMethod === 'cash' ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"
              )}
            >
              <Banknote className="w-5 h-5" />
              <span className="text-xs font-semibold">Cash</span>
            </button>
            <button 
              onClick={() => setPaymentMethod('card')}
              className={clsx(
                "py-2.5 px-4 rounded-xl border flex flex-col items-center gap-1 transition-all",
                paymentMethod === 'card' ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"
              )}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-semibold">Card</span>
            </button>
          </div>
        </div>

        <button 
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className={clsx(
            "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg",
            cart.length === 0 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" 
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5"
          )}
        >
          <CheckCircle className="w-6 h-6" />
          Complete Sale
        </button>
      </div>

      {showScanner && (
        <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};

export default Pos;
