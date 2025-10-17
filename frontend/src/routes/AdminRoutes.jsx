import { Routes, Route } from "react-router-dom";
import MainLayout from "../components/MainLayoutAdmin";
import Dashboard from "../pages/admin/Dashboard";
import Admin from "../pages/admin/Admin";
import Customers from "../pages/admin/Customers";
import Products from "../pages/admin/Products";
import Category from "../pages/admin/Category";
import Orders from "../pages/admin/Orders";
import AdminOrderDetail from "../pages/admin/OrderDetail";
import PaymentOrderCheck from "../pages/admin/PaymentOrderCheck";
import PaymentCustomCheck from "../pages/admin/PaymentCustomCheck";
import ChatAdmin from "../pages/admin/ChatAdmin";
import Contact from "../pages/admin/Contact";
import IncomeExpensePage from "../pages/admin/IncomeExpensePage";
import IncomeExpenseForm from "../pages/admin/IncomeExpenseForm";
import Inbox from "../pages/admin/Inbox";
import MaterialsAdmin from "../pages/admin/MaterialsAdmin";
import OrdersCustom from "../pages/admin/OrdersCustom";
import ShippingRatesPage from "../pages/admin/ShippingRatesPage";
import Login from "../pages/admin/Login";
import PrivateRoute from "../utils/PrivateRoute";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />

      {/* ต้อง login ก่อนถึงเข้าได้ */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="admins" element={<Admin />} />
          <Route path="customers" element={<Customers />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Category />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          
          <Route path="payment-order-check" element={<PaymentOrderCheck />} />
          <Route path="payment-custom-check" element={<PaymentCustomCheck />} />
          <Route path="chat" element={<ChatAdmin />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="materials" element={<MaterialsAdmin />} />
          <Route path="contact" element={<Contact />} />
          <Route path="custom-orders" element={<OrdersCustom />} />
          <Route path="income-expense/form" element={<IncomeExpenseForm />} />
          <Route path="income-expense/report" element={<IncomeExpensePage />} />
          <Route path="shipping-rates" element={<ShippingRatesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
