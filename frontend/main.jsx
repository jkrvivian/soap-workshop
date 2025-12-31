import './style.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './src/components/Layout.tsx';
import Materials from './src/pages/Materials.tsx';
import Products from './src/pages/Products.tsx';
import StockMovements from './src/pages/StockMovements.tsx';

function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">儀表板</h1>
        <p className="text-stone-500">總覽與快速操作</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <h3 className="text-lg font-semibold mb-2">原料庫存</h3>
          <p className="text-3xl font-bold text-soap-wood">--</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <h3 className="text-lg font-semibold mb-2">產品庫存</h3>
          <p className="text-3xl font-bold text-soap-wood">--</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <h3 className="text-lg font-semibold mb-2">低庫存警示</h3>
          <p className="text-3xl font-bold text-orange-600">--</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="materials" element={<Materials />} />
          <Route path="products" element={<Products />} />
          <Route path="movements" element={<StockMovements />} />
          <Route path="batches" element={<div className="p-8">生產批次 (待開發)</div>} />
          <Route path="customers" element={<div className="p-8">客戶管理 (待開發)</div>} />
          <Route path="settings" element={<div className="p-8">設定 (待開發)</div>} />
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