import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import OrdersNavbar from '../../components/OrdersNavbar';

function OrdersPending() {
  const host = import.meta.env.VITE_HOST;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'รอการยืนยัน/ชำระเงิน',
      waiting_payment: 'รอการชำระเงิน',
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
      waiting_payment: 'bg-yellow-100 text-yellow-800',
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

  const handleCancelOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'คุณต้องการยกเลิกออเดอร์นี้ใช่หรือไม่?',
      text: 'หากยกเลิกแล้วจะไม่สามารถย้อนกลับได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ไม่ยกเลิก',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });
    if (!result.isConfirmed) return;
    try {
      const response = await fetch(`${host}/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (response.ok) {
        const updated = await fetch(`${host}/api/orders/customer/${user.id}`, {
          credentials: 'include',
        });
        if (updated.ok) {
          const data = await updated.json();
          setOrders(data.filter((o) => o.status === 'pending'));
        }
        await Swal.fire({
          icon: 'success',
          title: 'ยกเลิกออเดอร์สำเร็จ',
          text: 'ออเดอร์ของคุณถูกยกเลิกแล้ว',
          confirmButtonColor: '#22c55e',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'เกิดข้อผิดพลาดในการยกเลิกออเดอร์',
          confirmButtonColor: '#d33',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
        confirmButtonColor: '#d33',
      });
      console.error('Error cancelling order:', error);
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
          setOrders(data.filter((o) => o.status === 'pending'));
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
        <OrdersNavbar />

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">รอดำเนินการ</h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">ยังไม่มีคำสั่งซื้อที่รอดำเนินการ</div>
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
                            <span className={`ml-4 text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
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
                            <>
                              {order.items.slice(0, 3).map((item, idx) => (
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
                              ))}
                              {order.items.length > 3 && (
                                <div className="flex items-center gap-2 border rounded p-2 bg-gray-100 text-gray-600 text-xs font-medium">
                                  +{order.items.length - 3} รายการ
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400">ไม่มีสินค้า</span>
                          )}
                        </div>

                        {/* ปุ่มเฉพาะหน้า Pending */}
                        <div className="flex gap-2 flex-wrap">
                          {/* ปุ่มชำระเงิน เฉพาะสถานะ pending หรือ waiting_payment */}
                          {(order.status === 'pending' || order.status === 'waiting_payment') && (
                            <>
                              <button
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                onClick={() => navigate(`/users/payments?order_id=${order.id}`)}
                              >
                                ชำระเงิน
                              </button>
                              <button
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                                onClick={() => handleCancelOrder(order.id)}
                              >
                                ยกเลิกออเดอร์
                              </button>
                              <button
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                onClick={() => navigate(`/users/order/${order.id}`)}
                              >
                                ดูรายละเอียด
                              </button>
                            </>
                          )}
                          {/* สถานะ approved: รอแอดมินตรวจสอบ ไม่แสดงปุ่มใด ๆ */}
                          {order.status === 'approved' && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                              รอแอดมินตรวจสอบการชำระเงินและอนุมัติจัดส่ง
                            </span>
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

export default OrdersPending;
