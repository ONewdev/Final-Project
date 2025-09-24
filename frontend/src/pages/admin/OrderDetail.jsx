import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const host = import.meta.env.VITE_HOST || '';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // ===== utils =====
  const formatPrice = (price) =>
    price != null && !isNaN(Number(price))
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
      hour12: false,
    });
  };

  const statusText = (status) =>
    ({
      pending: 'รอชำระเงิน/รออนุมัติ',
      approved: 'ชำระเงินแล้ว/อนุมัติแล้ว',
      shipped: 'จัดส่งแล้ว',
      delivered: 'จัดส่งสำเร็จ',
      cancelled: 'ยกเลิก',
    }[status] || status || '-');

  const statusClass = (status) =>
    ({
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      shipped: 'bg-emerald-100 text-emerald-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }[status] || 'bg-gray-100 text-gray-800');

  const imageSrc = (maybePath) => {
    if (!maybePath) return '';
    const str = String(maybePath);
    if (/^https?:\/\//i.test(str)) return str;
    const clean = str.startsWith('/') ? str : `/${str}`;
    return `${host}${clean}`;
  };

  // ===== fetch order =====
  const fetchOrder = async (signal) => {
    try {
      setErrorMsg('');
      setLoading(true);
      const res = await fetch(`${host}/api/orders/${id}`, { signal });
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
      if (!signal?.aborted) {
        setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        setOrder(null);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    fetchOrder(ac.signal);
    return () => ac.abort();
  }, [id, host]);

  const refetch = async () => {
    const res = await fetch(`${host}/api/orders/${id}`);
    if (res.ok) setOrder(await res.json());
  };

  // ===== actions (admin) =====
  const changeStatus = async (nextStatus, confirmText) => {
    if (!order) return;
    const text = confirmText || `เปลี่ยนสถานะเป็น "${statusText(nextStatus)}" ?`;
    const ok = await Swal.fire({
      title: 'ยืนยันการเปลี่ยนสถานะ',
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
    });
    if (!ok.isConfirmed) return;

    try {
      const res = await fetch(`${host}/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await refetch();
        Swal.fire('สำเร็จ', `อัปเดตสถานะเป็น "${statusText(nextStatus)}" แล้ว`, 'success');
      } else {
        Swal.fire('ผิดพลาด', 'อัปเดตสถานะไม่สำเร็จ', 'error');
      }
    } catch {
      Swal.fire('ผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error');
    }
  };

  const canApprove = order?.status === 'pending';
  const canShip = order?.status === 'approved';
  const canMarkDelivered = order?.status === 'shipped';
  const canCancel = order && !['delivered', 'cancelled'].includes(order.status);

  const items = useMemo(() => (Array.isArray(order?.items) ? order.items : []), [order]);

  // ===== render =====
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
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-red-500 font-semibold mb-2">ไม่พบข้อมูลคำสั่งซื้อ</div>
            {errorMsg && <div className="text-gray-600 mb-4">{errorMsg}</div>}
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => navigate('/admin/orders')}
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
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-2xl font-bold text-green-700">
              รายละเอียดคำสั่งซื้อ #{String(order.id).padStart(4, '0')}
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusClass(order.status)}`}>
              {statusText(order.status)}
            </span>
          </div>

          {/* ข้อมูลลูกค้า / จัดส่ง */}
          <div className="mb-6 grid md:grid-cols-2 gap-4 text-gray-700">
            <div>วันที่สั่งซื้อ: <span className="font-semibold">{formatDateTimeTH(order.created_at)}</span></div>
            <div>เบอร์โทร: <span className="font-semibold">{order.phone || '-'}</span></div>
            <div>ชื่อลูกค้า: <span className="font-semibold">{order.customer_name || '-'}</span></div>
            <div>อีเมล: <span className="font-semibold">{order.email || '-'}</span></div>
            <div className="md:col-span-2">
              ที่อยู่จัดส่ง: <span className="font-semibold">{order.shipping_address || '-'}</span>
            </div>
            {order.note && (
              <div className="md:col-span-2">
                หมายเหตุลูกค้า: <span className="font-semibold">{order.note}</span>
              </div>
            )}
          </div>

          {/* รายการสินค้า */}
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

          {/* รวมราคา */}
          <div className="border-t pt-4 mt-4 flex justify-between text-lg font-bold">
            <span>ยอดรวมทั้งหมด</span>
            <span className="text-green-700">{formatPrice(order.total_price)}</span>
          </div>

          {/* เอกสาร / สลิป */}
          <div className="mt-4 space-y-2">
            {order.receipt_url && (
              <div>
                <span className="font-semibold">สลิปโอนเงิน: </span>
                <a
                  href={imageSrc(order.receipt_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  เปิดดู/ดาวน์โหลด
                </a>
              </div>
            )}
            {/* ถ้ามี endpoint ออกใบเสร็จ/ใบกำกับภาษี */}
            {order.status === 'delivered' && (
              <div>
                <a
                  href={`${host}/api/orders/${order.id}/receipt`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 underline"
                >
                  ดาวน์โหลดใบเสร็จ (PDF)
                </a>
              </div>
            )}
          </div>

          {/* ปุ่มแอคชันแอดมิน */}
          <div className="mt-6 flex gap-2 flex-wrap">
            {canApprove && (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold"
                onClick={() => changeStatus('approved')}
              >
                อนุมัติ/ชำระแล้ว
              </button>
            )}
            {canShip && (
              <button
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-semibold"
                onClick={() => changeStatus('shipped')}
              >
                จัดส่ง
              </button>
            )}
            {canMarkDelivered && (
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
                onClick={() => changeStatus('delivered')}
              >
                ยืนยันจัดส่งสำเร็จ
              </button>
            )}
            {canCancel && (
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
                onClick={() => changeStatus('cancelled', 'ยกเลิกคำสั่งซื้อนี้หรือไม่?')}
              >
                ยกเลิกคำสั่งซื้อ
              </button>
            )}
            <button
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm font-semibold"
              onClick={() => navigate('/admin/orders')}
            >
              กลับไปหน้าคำสั่งซื้อ
            </button>
          </div>

          {errorMsg && <div className="mt-4 text-sm text-red-600">{errorMsg}</div>}
        </div>
      </div>
    </div>
  );
}
