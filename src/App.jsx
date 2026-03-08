import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { InventoryProvider } from './context/InventoryContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pos from './pages/Pos';
import Inventory from './pages/Inventory';
import Restock from './pages/Restock';

function App() {
  return (
    <InventoryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<Pos />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="restock" element={<Restock />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </InventoryProvider>
  );
}

export default App;
