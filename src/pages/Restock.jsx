import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import Scanner from '../components/Scanner';
import { Camera, Save, PackagePlus, AlertCircle, Loader2 } from 'lucide-react';

const Restock = () => {
  const { items, addStock } = useInventory();
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: 'General',
    qty: 1,
    buyPrice: 0,
    sellPrice: 0,
    imageUrl: '',
    quantityLabel: ''
  });
  const [isFetching, setIsFetching] = useState(false);

  const fetchProductDetails = async (barcode) => {
    setIsFetching(true);
    try {
      // First try open food facts
      const foodResponse = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      let data = foodResponse.ok ? await foodResponse.json() : null;

      // If not found in food, try open beauty facts
      if (!data || !data.product) {
        const beautyResponse = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`);
        if (beautyResponse.ok) {
          data = await beautyResponse.json();
        }
      }

      if (data && data.product) {
        const productName = data.product.product_name || data.product.product_name_en || data.product.generic_name || '';
        const quantity = data.product.quantity || '';
        const image = data.product.image_front_url || data.product.image_url || '';
        
        if (productName) {
          setFormData(prev => ({
            ...prev,
            name: productName,
            quantityLabel: quantity,
            imageUrl: image,
            // Try to map to our categories if possible, otherwise leave as General
            category: data.product.categories_tags?.some(c => c.includes('beverage')) ? 'Beverage' : 
                      data.product.categories_tags?.some(c => c.includes('snack')) ? 'Snacks' : 
                      data.product.categories_tags?.some(c => c.includes('sweet') || c.includes('chocolate')) ? 'Sweets' : 
                      data.product.categories_tags?.some(c => c.includes('bakery') || c.includes('bread')) ? 'Bakery' : 
                      data.product.categories_tags?.some(c => c.includes('cosmetics') || c.includes('hygiene') || c.includes('perfume')) ? 'General' : 'General'
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch product details:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleScan = (decodedText) => {
    // Check if item exists
    const existing = items.find(i => i.barcode === decodedText);
    if (existing) {
      setFormData({
        barcode: existing.barcode,
        name: existing.name,
        category: existing.category,
        qty: 1, // default to adding 1 more
        buyPrice: existing.buyPrice,
        sellPrice: existing.sellPrice,
        imageUrl: existing.imageUrl || '',
        quantityLabel: existing.quantity || ''
      });
    } else {
      setFormData(prev => ({ ...prev, barcode: decodedText, name: '', buyPrice: 0, sellPrice: 0, imageUrl: '', quantityLabel: '' }));
      fetchProductDetails(decodedText);
    }
    setShowScanner(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: ['qty', 'buyPrice', 'sellPrice'].includes(name) ? Number(value) : value 
    }));
  };

  const handleBarcodeChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, barcode: val }));
    const existing = items.find(i => i.barcode === val);
    if (existing) {
      setFormData(prev => ({
        ...prev,
        name: existing.name,
        category: existing.category,
        buyPrice: existing.buyPrice,
        sellPrice: existing.sellPrice,
        imageUrl: existing.imageUrl || '',
        quantityLabel: existing.quantity || ''
      }));
    }
  };

  const handleBarcodeBlur = () => {
    if (formData.barcode && !items.find(i => i.barcode === formData.barcode) && !formData.name) {
      fetchProductDetails(formData.barcode);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.barcode || !formData.name) {
      alert("Barcode and Name are required!");
      return;
    }
    addStock(
      formData.barcode,
      formData.qty,
      formData.buyPrice,
      formData.sellPrice,
      formData.name,
      formData.category,
      formData.imageUrl,
      formData.quantityLabel
    );
    
    alert("Stock added successfully!");
    setFormData({
      barcode: '',
      name: '',
      category: 'General',
      qty: 1,
      buyPrice: 0,
      sellPrice: 0,
      imageUrl: '',
      quantityLabel: ''
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 p-2.5 rounded-xl">
          <PackagePlus className="w-6 h-6 text-indigo-700" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Stock In / Buy</h2>
          <p className="text-gray-500 text-sm">Add new products or replenish existing inventory</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <div className="space-y-6">
            
            {/* Barcode Section */}
            <div className="col-span-full">
              <label className="block text-sm font-semibold leading-6 text-gray-900 mb-2">
                Barcode
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleBarcodeChange}
                  onBlur={handleBarcodeBlur}
                  className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Scan or enter barcode"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="flex-none rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-100 flex items-center gap-2 border border-indigo-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  <Camera className="w-5 h-5" />
                  <span className="hidden sm:inline">Scan</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold leading-6 text-gray-900 mb-2 flex items-center gap-2">
                  Product Name
                  {isFetching && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                </label>
                <div className="flex gap-2 items-start">
                  {formData.imageUrl && (
                    <img 
                      src={formData.imageUrl} 
                      alt="Product preview" 
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm shrink-0 bg-white" 
                    />
                  )}
                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      required
                    />
                    <input
                      type="text"
                      name="quantityLabel"
                      value={formData.quantityLabel}
                      onChange={handleChange}
                      placeholder="e.g. 2L"
                      className="block w-24 rounded-xl border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 text-center font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold leading-6 text-gray-900 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white"
                >
                  <option>General</option>
                  <option>Bakery</option>
                  <option>Sweets</option>
                  <option>Beverage</option>
                  <option>Snacks</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold leading-6 text-gray-900 mb-2">
                  Quantity to Add
                </label>
                <input
                  type="number"
                  name="qty"
                  min="1"
                  value={formData.qty}
                  onChange={handleChange}
                  className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  required
                />
              </div>

              <div className="col-span-full border-t border-gray-100 my-2 pt-6">
                <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4" />
                  Pricing Details
                </h3>
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold leading-6 text-gray-900 mb-2">
                      Buying Price (৳)
                    </label>
                    <input
                      type="number"
                      name="buyPrice"
                      min="0"
                      step="0.01"
                      value={formData.buyPrice}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold leading-6 text-gray-900 mb-2">
                      Selling Price (৳)
                    </label>
                    <input
                      type="number"
                      name="sellPrice"
                      min="0"
                      step="0.01"
                      value={formData.sellPrice}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 font-mono text-indigo-700 font-bold bg-indigo-50/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-x-6 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={() => setFormData({ barcode: '', name: '', category: 'General', qty: 1, buyPrice: 0, sellPrice: 0, imageUrl: '', quantityLabel: '' })}
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-600 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:shadow-indigo-600/50 hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Stock
            </button>
          </div>
        </form>
      </div>

      {showScanner && (
        <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};

export default Restock;
