import './style.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './src/components/Layout.tsx';
import Materials from './src/pages/Materials.tsx';
import Products from './src/pages/Products.tsx';
import StockMovements from './src/pages/StockMovements.tsx';
import Settings from './src/pages/Settings.tsx';
import Dashboard from './src/pages/Dashboard.tsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="materials" element={<Materials />} />
          <Route path="products" element={<Products />} />
          <Route path="movements" element={<StockMovements />} />
          {/* <Route path="batches" element={<ProductBatches />} /> */}
          {/* <Route path="customers" element={<div className="p-8">客戶管理 (待開發)</div>} /> */}
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);