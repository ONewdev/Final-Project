import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import OrdersNavbar from '../../components/OrdersNavbar';

function OrdersShipped() {
  const host = import.meta.env.VITE_HOST;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'รอการยืนยัน',
      confirmed: 'ยืนยันแล้ว',
      processing: 'กำลังดำเนินการ',
      shipped: 'จัดส่งแล้ว',
      delivered: 'จัดส่งสำเร็จ',
      cancelled: 'ยกเลิก',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-amber-100 text-amber-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const groupOrdersByDate = (list) => {
    const grouped = {};
    list.forEach((order) => {
      const date = order.created_at
        ? new Date(order.created_at).toLocaleDateString('th-TH')
        : '-';
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(order);
    });
    return grouped;
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      const response = await fetch(`${host}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
        credentials: 'include',
      });
      if (response.ok) {
        const updated = await fetch(`${host}/api/orders/customer/${user.id}`, {
          credentials: 'include',
        });
        if (updated.ok) {
          const data = await updated.json();
          setOrders(data.filter((o) => o.status === 'shipped'));
        }
      } else {
        alert('ไม่สามารถยืนยันการรับสินค้าได้');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการยืนยันการรับสินค้า');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${host}/api/orders/customer/${user.id}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data.filter((o) => o.status === 'shipped'));
        } else {
          setOrders([]);
        }
      } catch (e) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, host, navigate]);

  const groupedOrders = useMemo(() => groupOrdersByDate(orders), [orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Navbar สำหรับนำทางสถานะออเดอร์ */}
        <OrdersNavbar />

        {/* กล่องหลักเหมือนหน้า Orders.jsx */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">กำลังจัดส่ง</h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">ยังไม่มีคำสั่งซื้อที่กำลังจัดส่ง</div>
          ) : (
            <div className="divide-y">
              {Object.entries(groupedOrders).map(([date, dateOrders]) => (
                <div key={date} className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{date}</h3>
                  <div className="space-y-4">
                    {dateOrders.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-semibold">รหัสออเดอร์: #{String(order.id).padStart(4, '0')}</span>
                            <span className="ml-4 text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">กำลังจัดส่ง</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-lg">
                              {order.total_price !== undefined && order.total_price !== null && !isNaN(Number(order.total_price))
                                ? `฿${Number(order.total_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                                : '-'}
                            </span>
                          </div>
                        </div>

                        {/* แสดงรายการสินค้าในออเดอร์ */}
                        <div className="flex flex-wrap gap-4 mb-2">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item, idx) => (
                              <div key={item.id || idx} className="flex items-center gap-2 border rounded p-2 bg-gray-50">
                                {item.image_url && (
                                  <img
                                    src={`${host}${item.image_url}`}
                                    alt={item.product_name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div>
                                  <div className="font-medium">{item.product_name}</div>
                                  <div className="text-xs text-gray-500">จำนวน: {item.quantity}</div>
                                  <div className="text-xs text-gray-500">
                                    ราคา: {item.price !== undefined && item.price !== null && !isNaN(Number(item.price))
                                      ? `฿${Number(item.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                                      : '-'}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400">ไม่มีสินค้า</span>
                          )}
                        </div>

                        {/* ปุ่มเฉพาะหน้า Shipped */}
                        <div className="flex gap-2 flex-wrap">
                          {false && order.status === 'shipped' && (
                            <button
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                              onClick={() => handleConfirmOrder(order.id)}
                            >
                              ยืนยันรับสินค้า
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrdersShipped;
