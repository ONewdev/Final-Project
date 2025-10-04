import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import OrdersNavbar from '../../components/OrdersNavbar';

function OrdersCancelled() {
  const host = import.meta.env.VITE_HOST || '';
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // === utils (ให้สอดคล้องกับ Orders.jsx/หน้าอื่น ๆ) ===
  const getDisplayOrderCode = (o) => {
    if (!o) return '';
    if (o.order_code) return o.order_code;
    const d = o.created_at ? new Date(o.created_at) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const seq = String(o.id ?? 0).padStart(4, '0');
    return `OR#${y}${m}${day}-${seq}`;
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard?.writeText(text);
      Swal.fire({ icon: 'success', title: 'คัดลอกแล้ว', text, timer: 1200, showConfirmButton: false });
    } catch { /* noop */ }
  };

  const imageSrc = (maybePath) => {
    if (!maybePath) return '';
    const str = String(maybePath);
    if (/^https?:\/\//i.test(str)) return str;
    const clean = str.startsWith('/') ? str : `/${str}`;
    return `${host}${clean}`;
  };

  const formatCurrency = (num) =>
    num !== undefined && num !== null && !isNaN(Number(num))
      ? `฿${Number(num).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
      : '-';

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'รอชำระเงิน/รออนุมัติ',
      approved: 'ชำระเงินแล้ว/อนุมัติแล้ว',
      confirmed: 'ยืนยันแล้ว',
      processing: 'กำลังดำเนินการ',
      shipped: 'กำลังจัดส่ง',
      delivered: 'จัดส่งสำเร็จ',
      cancelled: 'ยกเลิก',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
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
        ? new Date(order.created_at).toLocaleDateString('th-TH', { dateStyle: 'long' })
        : '-';
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(order);
    });
    return grouped;
  };

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      navigate('/login');
      return;
    }
    const ac = new AbortController();
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${host}/api/orders/customer/${user.id}`, {
          credentials: 'include',
          signal: ac.signal,
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data.filter((o) => o.status === 'cancelled'));
        } else {
          setOrders([]);
        }
      } catch {
        if (!ac.signal.aborted) setOrders([]);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };
    fetchOrders();
    return () => ac.abort();
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
            <h2 className="text-xl font-semibold">ยกเลิกออเดอร์</h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">ยังไม่มีคำสั่งซื้อที่ยกเลิก</div>
          ) : (
            <div className="divide-y">
              {Object.entries(groupedOrders).map(([date, dateOrders]) => (
                <div key={date} className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{date}</h3>
                  <div className="space-y-4">
                    {dateOrders.map((order) => {
                      const displayCode = getDisplayOrderCode(order);
                      return (
                        <div key={order.id} className="p-4 border rounded-lg mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">
                                รหัสออเดอร์:{' '}
                                <span className="font-mono">{displayCode}</span>
                              </span>
                              <button
                                className="text-xs border rounded px-2 py-0.5 hover:bg-gray-50"
                                onClick={() => copyText(displayCode)}
                                title="คัดลอก"
                              >
                                คัดลอก
                              </button>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                              {/* #0001 อ้างอิง/ดีบัก */}
                              <span className="text-xs text-gray-400">
                                #{String(order.id).padStart(4, '0')}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-lg">
                                {formatCurrency(order.total_price)}
                              </span>
                            </div>
                          </div>

                          {/* เหตุผลการยกเลิก (ถ้ามี) */}
                          {order.cancel_reason && (
                            <div className="text-sm text-red-700 mb-2">
                              เหตุผลการยกเลิก: {order.cancel_reason}
                            </div>
                          )}

                          {/* แสดงสินค้า (โชว์ 3 ชิ้นแรก + นับเพิ่ม) */}
                          <div className="flex flex-wrap gap-4 mb-2">
                            {order.items && order.items.length > 0 ? (
                              <>
                                {order.items.slice(0, 3).map((item, idx) => (
                                  <div key={item.id || idx} className="flex items-center gap-2 border rounded p-2 bg-gray-50">
                                    {item.image_url && (
                                      <img
                                        src={imageSrc(item.image_url)}
                                        alt={item.product_name}
                                        className="w-12 h-12 object-cover rounded"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                      />
                                    )}
                                    <div>
                                      <div className="font-medium">{item.product_name}</div>
                                      <div className="text-xs text-gray-500">จำนวน: {item.quantity}</div>
                                      <div className="text-xs text-gray-500">
                                        ราคา: {formatCurrency(item.price)}
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

                          {/* ปุ่ม */}
                          <div className="mt-3">
                            <button
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                              onClick={() => navigate(`/users/order/${order.id}`)}
                            >
                              ดูรายละเอียด
                            </button>
                          </div>
                        </div>
                      );
                    })}
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

export default OrdersCancelled;
