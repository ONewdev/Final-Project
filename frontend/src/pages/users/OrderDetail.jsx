import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OrdersNavbar from '../../components/OrdersNavbar';

function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const host = import.meta.env.VITE_HOST || '';
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // === utils ===
  const formatPrice = (price) =>
    price !== undefined && price !== null && !isNaN(Number(price))
      ? `฿${Number(price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
      : '-';

  const formatDateTimeTH = (dt) => {
    if (!dt) return '-';
    const d = new Date(dt);
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const statusText = (status) => ({
    pending: 'รอการชำระ',
    confirmed: 'ยืนยันแล้ว',
    processing: 'กำลังดำเนินการ',
    shipped: 'จัดส่งแล้ว',
    delivered: 'จัดส่งสำเร็จ',
    cancelled: 'ยกเลิก'
  }[status] || status || '-');

  const statusClass = (status) => ({
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-emerald-100 text-emerald-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }[status] || 'bg-gray-100 text-gray-800');

  const imageSrc = (maybePath) => {
    if (!maybePath) return '';
    const str = String(maybePath);
    if (/^https?:\/\//i.test(str)) return str;
    // ทำให้เป็น relative/absolute ที่ไม่ซ้อน host
    const clean = str.startsWith('/') ? str : `/${str}`;
    return `${host}${clean}`;
  };

  // === fetch order ===
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const ac = new AbortController();
    const fetchOrder = async () => {
      try {
        setErrorMsg('');
        setLoading(true);
        const res = await fetch(`${host}/api/orders/${id}`, {
          credentials: 'include',
          signal: ac.signal
        });
        if (res.status === 403) {
          setErrorMsg('คุณไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้');
          setOrder(null);
          return;
        }
        if (res.status === 404) {
          setErrorMsg('ไม่พบคำสั่งซื้อ');
          setOrder(null);
          return;
        }
        if (!res.ok) {
          setErrorMsg('เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ');
          setOrder(null);
          return;
        }
        const data = await res.json();
        setOrder(data);
      } catch (e) {
        if (!ac.signal.aborted) {
          setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
          setOrder(null);
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };
    fetchOrder();
    return () => ac.abort();
  }, [id, user, host, navigate]);

  // === actions ===
  const refetch = async () => {
    try {
      const res = await fetch(`${host}/api/orders/${id}`, { credentials: 'include' });
      if (res.ok) setOrder(await res.json());
    } catch { /* noop */ }
  };

  const handleConfirmDelivered = async () => {
    if (!order) return;
    try {
      const res = await fetch(`${host}/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'delivered' })
      });
      if (res.ok) {
        await refetch();
      } else {
        alert('ยืนยันรับสินค้าไม่สำเร็จ');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const canPay = order?.status === 'pending';
  const canConfirmReceive = order?.status === 'shipped';
  const canDownloadReceipt = order?.status === 'delivered';

  const items = useMemo(() => Array.isArray(order?.items) ? order.items : [], [order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <OrdersNavbar />
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-red-500 font-semibold mb-2">ไม่พบข้อมูลคำสั่งซื้อ</div>
            {errorMsg && <div className="text-gray-600 mb-4">{errorMsg}</div>}
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => navigate('/users/orders')}
            >
              กลับไปหน้าคำสั่งซื้อ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <OrdersNavbar />

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-2xl font-bold text-green-700">
              รายละเอียดคำสั่งซื้อ #{String(order.id).padStart(4, '0')}
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusClass(order.status)}`}>
              {statusText(order.status)}
            </span>
          </div>

          <div className="mb-6 grid md:grid-cols-2 gap-4 text-gray-700">
            <div>วันที่สั่งซื้อ: <span className="font-semibold">{formatDateTimeTH(order.created_at)}</span></div>
            <div>เบอร์โทร: <span className="font-semibold">{order.phone || '-'}</span></div>
            <div className="md:col-span-2">
              ที่อยู่จัดส่ง: <span className="font-semibold">{order.shipping_address || '-'}</span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">รายการสินค้า</h3>
            {items.length > 0 ? (
              <ul className="divide-y rounded border">
                {items.map((item, idx) => (
                  <li key={item.id || idx} className="py-3 px-3 flex items-center gap-4">
                    {item.image_url ? (
                      <img
                        src={imageSrc(item.image_url)}
                        alt={item.product_name || 'product'}
                        className="w-14 h-14 object-cover rounded border"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.product_name || '-'}</div>
                      <div className="text-xs text-gray-500">จำนวน: {item.quantity}</div>
                      <div className="text-xs text-gray-500">ราคา: {formatPrice(item.price)}</div>
                    </div>
                    <div className="font-semibold text-green-700">
                      {formatPrice(Number(item.price) * Number(item.quantity))}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-400">ไม่มีสินค้า</div>
            )}
          </div>

          <div className="border-t pt-4 mt-4 flex justify-between text-lg font-bold">
            <span>ยอดรวมทั้งหมด</span>
            <span className="text-green-700">{formatPrice(order.total_price)}</span>
          </div>

          <div className="mt-6 flex gap-2 flex-wrap">
            {/* ปุ่มซื้ออีกครั้ง */}
            {items.length > 0 && (
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
                onClick={() => {
                  if (!user) return;
                  const cartKey = `cart_${user.id}`;
                  // สร้าง cart ใหม่จากรายการสินค้าในออเดอร์
                  const newCart = items.map(item => ({
                    id: item.product_id || item.id,
                    product_id: item.product_id || item.id,
                    name: item.product_name || item.name,
                    product_name: item.product_name || item.name,
                    price: Number(item.price),
                    image_url: item.image_url,
                    quantity: item.quantity
                  }));
                  localStorage.setItem(cartKey, JSON.stringify(newCart));
                  window.dispatchEvent(new Event('cartUpdated'));
                  navigate('/users/checkout');
                }}
              >
                ซื้ออีกครั้ง
              </button>
            )}
            {canPay && (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold"
                onClick={() => navigate(`/users/payments?order_id=${order.id}`)}
              >
                ชำระเงิน
              </button>
            )}

            {canConfirmReceive && (
              <button
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-semibold"
                onClick={handleConfirmDelivered}
              >
                ยืนยันรับสินค้า
              </button>
            )}

            {canDownloadReceipt && (
              <a
                href={`${host}/api/orders/${order.id}/receipt`}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-semibold"
                target="_blank"
                rel="noopener noreferrer"
                download={`receipt_order_${order.id}.pdf`}
              >
                ดาวน์โหลดใบเสร็จ
              </a>
            )}

            <button
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm font-semibold"
              onClick={() => navigate('/users/orders')}
            >
              กลับไปหน้าคำสั่งซื้อ
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 text-sm text-red-600">{errorMsg}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
