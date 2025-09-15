// src/routes/UsersRoutes.jsx
import { Routes, Route } from 'react-router-dom';

import Profile from '../pages/users/Profile';
import Favorite from '../pages/users/Favorite';
import Orders from '../pages/users/Orders';
import OrdersPending from '../pages/users/OrdersPending';

import OrdersShipped from '../pages/users/OrdersShipped';
import OrdersDelivered from '../pages/users/OrdersDelivered';
import OrdersCancelled from '../pages/users/OrdersCancelled';
import Checkout from '../pages/users/Checkout';
import Payments from '../pages/users/Payments';
import Cart from '../pages/users/Cart';
import Notifications from '../pages/users/Notifications';
import MainLayout from '../components/MainLayoutProflie';
import OrdersCustom from '../pages/users/OrdersCustom';


export default function UsersRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path="profile" element={<Profile />} />
        <Route path="favorite" element={<Favorite />} />
        <Route path="orders" element={<Orders />} />
        <Route path="pending" element={<OrdersPending />} />
        
        <Route path="shipped" element={<OrdersShipped />} />
        <Route path="delivered" element={<OrdersDelivered />} />
        <Route path="cancelled" element={<OrdersCancelled />} />
        <Route path="orderscustom" element={<OrdersCustom />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="payments" element={<Payments />} />
        <Route path="cart" element={<Cart />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

    </Routes>
  );
}
