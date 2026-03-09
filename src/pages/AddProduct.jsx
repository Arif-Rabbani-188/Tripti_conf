import React, { useState, useRef } from 'react';
import { Camera, QrCode, Plus, Save, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import Scanner from '../components/Scanner';

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: '',
    unit: 'pcs',
    barcode: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const fileInputRef = useRef(null);

  const units = ['pcs', 'kg', 'ltr', 'gm', 'doz', 'box', 'pkt'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScanSuccess = async (decodedText) => {
    setFormData(prev => ({ ...prev, barcode: decodedText }));
    setIsScanning(false);
    setMessage({ type: '', text: '' });

    // Check if product exists in DB
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/products/${decodedText}`);
      if (response.ok) {
        const product = await response.json();
        setFormData({
          name: product.name,
          unit: product.unit,
          barcode: product.barcode
        });
        setImagePreview(product.imageUrl);
        setIsEditing(true);
        setMessage({ type: 'info', text: 'Existing product found! You can now update its details.' });
      } else {
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setIsEditing(false);
    }
  };

  // Convert uploaded/captured image to optimized WebP
  const handleImageProcess = (file) => {
    if (!file) return;
    
    // Create an object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    // Convert to webp
    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Max dimensions for optimization
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = window.Math.floor(width);
      canvas.height = window.Math.floor(height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Export as webp with 0.8 quality
      canvas.toBlob((blob) => {
        const webpFile = new File([blob], `product_${Date.now()}.webp`, { type: 'image/webp' });
        setImageFile(webpFile);
      }, 'image/webp', 0.8);
    };
  };

  const onFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageProcess(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', unit: 'pcs', barcode: '' });
    setImageFile(null);
    setImagePreview(null);
    setIsEditing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    
    try {
      let finalImageUrl = imagePreview && !imageFile ? imagePreview : '';

      // 1. Upload to ImgBB if there's a new image file
      if (imageFile) {
        const imgData = new FormData();
        imgData.append('image', imageFile);
        
        const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY;
        const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
          method: 'POST',
          body: imgData
        });
        
        const imgbbResult = await imgbbResponse.json();
        
        if (imgbbResult.success) {
          finalImageUrl = imgbbResult.data.display_url;
        } else {
          throw new Error(imgbbResult.error?.message || 'Failed to upload image to ImgBB');
        }
      }

      // 2. Save/Update Product to MongoDB Backend
      const payload = {
        name: formData.name,
        unit: formData.unit,
        barcode: formData.barcode,
        imageUrl: finalImageUrl
      };

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const dbResponse = await fetch(`${apiUrl}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const dbResult = await dbResponse.json();

      if (dbResponse.ok) {
        setMessage({ type: 'success', text: isEditing ? 'Product updated successfully!' : 'Product added successfully!' });
        resetForm(); // Clear the form on success
      } else {
        throw new Error(dbResult.message || 'Failed to save product in database');
      }

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'An error occurred during save.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {isScanning && (
        <Scanner 
          onScan={handleScanSuccess} 
          onClose={() => setIsScanning(false)} 
        />
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
          <Plus className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Update Product' : 'Add New Product'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEditing ? 'Modify details for an existing barcode' : 'Register a product not found in the global database'}
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          message.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
          'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : 
           message.type === 'info' ? <RefreshCw className="w-5 h-5 shrink-0 animate-spin-slow" /> :
           <AlertCircle className="w-5 h-5 shrink-0" />}
          <p className="font-medium text-sm">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Image Upload Section */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-gray-700">Product Image (Optional)</label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                  imagePreview 
                    ? 'border-indigo-500 bg-indigo-50/30' 
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-indigo-400'
                }`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-2 rounded-2xl" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                      <p className="text-white font-medium flex items-center gap-2">
                        <RefreshCw className="w-5 h-5" /> Change Image
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                      <Camera className="w-8 h-8 text-indigo-500" />
                    </div>
                    <p className="mb-1 text-sm font-semibold">Click to take photo / upload</p>
                    <p className="text-xs text-gray-400">Will be optimized to WebP</p>
                  </div>
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  capture="environment" /* Prefer back camera on mobile */
                  className="hidden" 
                  onChange={onFileChange}
                />
              </div>
            </div>

            {/* Input Fields Section */}
            <div className="flex flex-col gap-5">
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  placeholder="e.g., Pran Mango Juice"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                  <select 
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium appearance-none"
                  >
                    {units.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Barcode Number</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    name="barcode"
                    required
                    placeholder="Enter or scan barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium font-mono"
                  />
                  <button 
                    type="button"
                    onClick={() => setIsScanning(true)}
                    className="flex items-center justify-center p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 border border-indigo-200 transition-all active:scale-95"
                    title="Scan Barcode"
                  >
                    <QrCode className="w-6 h-6" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
            <button 
              type="button"
              onClick={resetForm}
              className="px-6 py-3 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-all"
            >
              Clear Form
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.barcode}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                 <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-5 h-5" /> {isEditing ? 'Update Product' : 'Save Product'}</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddProduct;
