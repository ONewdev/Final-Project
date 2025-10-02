import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'ทั้งหมด', path: '/users/orders' },
  { label: 'รอดำเนินการ', path: '/users/pending' },
  { label: 'กำลังเตรียมสินค้า', path: '/users/processing' },
  { label: 'กำลังจัดส่ง', path: '/users/shipped' },
  { label: 'จัดส่งสำเร็จ', path: '/users/delivered' },
  { label: 'ยกเลิก', path: '/users/cancelled' },
];

function OrdersNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="mb-8 mx-auto w-full max-w-4xl rounded-2xl border border-green-100/70 bg-white/80 backdrop-blur-md px-4 py-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              title={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative rounded-full px-6 py-2.5 font-semibold text-sm border transition-all duration-300 ease-out transform hover:scale-105 
                ${isActive 
                  ? 'bg-gradient-to-r from-green-600 via-emerald-500 to-green-500 text-white border-transparent shadow-lg ring-2 ring-green-500/30' 
                  : 'bg-white/95 text-green-700 border-green-200 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-800 hover:border-green-300 hover:shadow-md'
                } 
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 active:scale-95`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default OrdersNavbar;

