import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import InventoryHub from "./pages/InventoryHub";
import StockAdjustments from "./pages/StockAdjustments";
import Categories from "./pages/Categories";
import Suppliers from "./pages/Suppliers";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/inventory-hub" element={<InventoryHub />} />
      <Route path="/stock-adjustments" element={<StockAdjustments />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/suppliers" element={<Suppliers />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;