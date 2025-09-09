import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import OrdersNavbar from '../../components/OrdersNavbar';

function OrdersDelivered() {
  const host = import.meta.env.VITE_HOST;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${host}/api/orders/customer/${user.id}`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setOrders(data.filter((o) => o.status === 'delivered'));
        } else {
          setOrders([]);
        }
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, host, navigate]);

  if (loading) return <div className="text-center py-8">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <OrdersNavbar />
        <h1 className="text-2xl font-bold mb-6">คำสั่งซื้อที่จัดส่งสำเร็จ</h1>
        {orders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">ยังไม่มีคำสั่งซื้อที่จัดส่งสำเร็จ</div>
        ) : (
          <div className="divide-y">
            {orders.map((order) => (
              <div key={order.id} className="p-4 border rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">หมายเลขคำสั่งซื้อ: #{String(order.id).padStart(4, '0')}</span>
                  <span className="font-semibold text-lg">฿{Number(order.total_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
                <span className="text-green-600">จัดส่งสำเร็จ</span>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                    onClick={() => navigate(`/users/orders/${order.id}`)}
                  >
                    ดูรายละเอียด
                  </button>
                  <a
                    href={`${host}/api/orders/${order.id}/receipt`}
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-xs"
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`receipt_order_${order.id}.pdf`}
                  >
                    ดาวน์โหลดใบเสร็จ
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersDelivered;

