import React, { createContext, useContext, useState } from 'react';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
  const [items, setItems] = useState([
    { id: '1', name: 'Milk Bread', barcode: '1234567890123', category: 'Bakery', stock: 12, buyPrice: 30, sellPrice: 40, quantity: '400g' },
    { id: '2', name: 'Dairy Milk Chocolate', barcode: '0987654321098', category: 'Sweets', stock: 4, buyPrice: 60, sellPrice: 75, quantity: '50g' },
    { id: '3', name: 'Alpenliebe Candy', barcode: '1112223334445', category: 'Sweets', stock: 50, buyPrice: 1, sellPrice: 2, quantity: '' },
    { id: '4', name: 'Coca Cola', barcode: '5556667778889', category: 'Beverage', stock: 3, buyPrice: 35, sellPrice: 45, quantity: '500ml' },
  ]);

  const [sales, setSales] = useState([
    // mock some sales
    { id: 's1', total: 120, date: new Date().toISOString() }
  ]);

  const [buys, setBuys] = useState([
    // mock some buys
    { id: 'b1', total: 500, date: new Date().toISOString() }
  ]);

  const addSale = (cartItems, total, profit) => {
    // reduce stock
    const updatedItems = items.map(item => {
      const cartItem = cartItems.find(c => c.barcode === item.barcode);
      if (cartItem) {
        return { ...item, stock: item.stock - cartItem.qty };
      }
      return item;
    });
    setItems(updatedItems);
    setSales([...sales, { id: Date.now().toString(), total, profit, date: new Date().toISOString() }]);
  };

  const addStock = (barcode, qty, buyPrice, sellPrice, name, category, imageUrl, quantityLabel) => {
    const existingIndex = items.findIndex(i => i.barcode === barcode);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].stock += qty;
      if (buyPrice !== undefined && buyPrice !== null) updated[existingIndex].buyPrice = buyPrice;
      if (sellPrice !== undefined && sellPrice !== null) updated[existingIndex].sellPrice = sellPrice;
      if (name) updated[existingIndex].name = name;
      if (category) updated[existingIndex].category = category;
      if (imageUrl) updated[existingIndex].imageUrl = imageUrl;
      if (quantityLabel) updated[existingIndex].quantity = quantityLabel;
      setItems(updated);
    } else {
      setItems([...items, { id: Date.now().toString(), name, barcode, category, stock: qty, buyPrice, sellPrice, imageUrl, quantity: quantityLabel }]);
    }
    const cost = qty * buyPrice;
    setBuys([...buys, { id: Date.now().toString(), total: cost, date: new Date().toISOString() }]);
  };

  return (
    <InventoryContext.Provider value={{ items, sales, buys, addSale, addStock }}>
      {children}
    </InventoryContext.Provider>
  );
};
