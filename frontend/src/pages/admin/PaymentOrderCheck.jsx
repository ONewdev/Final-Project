import Swal from 'sweetalert2';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';


export default function PaymentOrderCheck() {
  const host = import.meta.env.VITE_HOST || '';
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersMap, setOrdersMap] = useState({});
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [search, setSearch] = useState(''); // ← ช่องค้นหา

  const handlePreview = (imageName) => {
    if (!imageName) return;
    const url = `${host}/uploads/payments/${imageName}`;
    Swal.fire({
      imageUrl: url,
      imageAlt: 'สลิป',
      showConfirmButton: false,
      showCloseButton: true,
      background: '#000',
      width: 'auto',
      padding: 0,
    });
  };

  useEffect(() => {
    fetch(`${host}/api/payments?status=pending`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error('Response is not valid JSON');
        }
      })
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch((err) => {
        setPayments([]);
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลการโอนเงินได้\n' + err.message, 'error');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [host]);

  useEffect(() => {
    let cancel = false;
    async function loadOrdersMap() {
      try {
        const res = await fetch(`${host}/api/orders`);
        if (!res.ok) throw new Error('cannot list orders');
        const rows = await res.json();
        const map = {};
        (Array.isArray(rows) ? rows : []).forEach((o) => {
          map[o.id] = { order_code: o.order_code, created_at: o.created_at };
        });
        if (!cancel) setOrdersMap(map);
      } catch (e) {
        if (!cancel) setOrdersMap({});
        console.error('load orders map failed:', e);
      } finally {
        if (!cancel) setOrdersLoading(false);
      }
    }
    loadOrdersMap();
    return () => {
      cancel = true;
    };
  }, [host]);

  const handleApprove = async (paymentId) => {
    const result = await Swal.fire({
      title: 'ยืนยันการอนุมัติ',
      text: 'คุณต้องการอนุมัติการชำระเงินนี้ใช่หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'อนุมัติ',
      cancelButtonText: 'ยกเลิก',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${host}/api/payments/${paymentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (!res.ok) throw new Error('update failed');
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      Swal.fire('สำเร็จ', 'อนุมัติการชำระเงินเรียบร้อยแล้ว', 'success');
    } catch {
      Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดขณะอนุมัติ', 'error');
    }
  };

  const getDisplayOrderCode = useCallback(
    (payment) => {
      const detail = payment?.order_id ? ordersMap[payment.order_id] : undefined;
      if (detail?.order_code) return detail.order_code;
      const d = payment?.created_at ? new Date(payment.created_at) : new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const seq = String(payment?.order_id ?? 0).padStart(4, '0');
      return `OR#${y}${m}${day}-${seq}`;
    },
    [ordersMap]
  );

  const copyText = (text) => {
    try {
      navigator.clipboard?.writeText(text);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'คัดลอกแล้ว', showConfirmButton: false, timer: 1200 });
    } catch { }
  };

  // —— กรองรายการตามคำค้น —— //
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => {
      const code = getDisplayOrderCode(p).toLowerCase();
      const orderId = String(p.order_id ?? '').toLowerCase();
      const name = String(p.customer_name ?? '').toLowerCase();
      const amount = p.amount != null ? String(p.amount).toLowerCase() : '';
      const status = String(p.status ?? '').toLowerCase();
      const image = String(p.image ?? '').toLowerCase();
      return (
        code.includes(q) ||
        orderId.includes(q) ||
        name.includes(q) ||
        amount.includes(q) ||
        status.includes(q) ||
        image.includes(q)
      );
    });
  }, [payments, search, getDisplayOrderCode]);

  const renderOrdersTable = () => {
    if (loading || ordersLoading) return <div>กำลังโหลด...</div>;
    if (!filtered.length) {
      return (
        <div className="text-gray-500">
          {payments.length ? 'ไม่พบรายการที่ตรงกับคำค้น' : 'ไม่มีรายการโอนเงินที่รอการตรวจสอบ'}
        </div>
      );
    }

    return (
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">#</th>
            <th className="border px-4 py-2">รหัสออเดอร์</th>
            <th className="border px-4 py-2">ลูกค้า</th>
            <th className="border px-4 py-2">ยอดโอน</th>
            <th className="border px-4 py-2">สลิป</th>
            <th className="border px-4 py-2">วันที่โอน</th>
            <th className="border px-4 py-2">สถานะ</th>
            <th className="border px-4 py-2">อนุมัติ</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((payment, idx) => {
            const code = getDisplayOrderCode(payment);
            return (
              <tr key={payment.id}>
                <td className="border px-4 py-2 text-center">{idx + 1}</td>
                <td className="border px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{code}</span>
                    <button
                      className="text-xs border rounded px-2 py-0.5 hover:bg-gray-50"
                      onClick={() => copyText(code)}
                    >
                      คัดลอก
                    </button>
                  </div>
                </td>
                <td className="border px-4 py-2">{payment.customer_name || '-'}</td>
                <td className="border px-4 py-2">
                  {payment.amount !== undefined && payment.amount !== null && !isNaN(Number(payment.amount))
                    ? `฿${Number(payment.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                    : '-'}
                </td>
                <td className="border px-4 py-2">
                  {payment.image ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => handlePreview(payment.image)}
                        className="focus:outline-none"
                        title="คลิกเพื่อดูภาพ"
                      >
                        <img
                          src={`${host}/uploads/payments/${payment.image}`}
                          alt="สลิป"
                          className="h-12 rounded cursor-zoom-in"
                        />
                      </button>
                      <div className="text-xs text-gray-400 break-all">{payment.image}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="border px-4 py-2">
                  {payment.created_at ? new Date(payment.created_at).toLocaleDateString('th-TH') : '-'}
                </td>
                <td className="border px-4 py-2">
                  <span className="px-2 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-600">
                    {payment.status === 'pending' ? 'รอตรวจสอบ' : payment.status}
                  </span>
                </td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() => handleApprove(payment.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                  >
                    อนุมัติ
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="p-4">
      {/* หัวเรื่อง + กล่องค้นหา */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold">ตรวจสอบสลิปสั่งซื้อ (OR#)</h1>
        <div className="relative w-full max-w-xs">
          <FaSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            size={14}
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา: OR#, Order ID, ชื่อลูกค้า, ยอด, สถานะ, ไฟล์"
            className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="ล้างคำค้น"
              title="ล้างคำค้น"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {renderOrdersTable()}
    </div>
  );
}
