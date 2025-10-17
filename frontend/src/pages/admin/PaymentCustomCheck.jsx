import Swal from 'sweetalert2';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FaSearch } from 'react-icons/fa';

export default function PaymentCustomCheck() {
  const host = import.meta.env.VITE_HOST || '';
  const [customPayments, setCustomPayments] = useState([]);
  const [customLoading, setCustomLoading] = useState(true);
  const [customOrdersMap, setCustomOrdersMap] = useState({});
  const [search, setSearch] = useState(''); // <— คีย์เวิร์ดค้นหา

  // ✅ แมปสถานะ → ภาษาไทย
  const STATUS_TH = {
    draft: 'ร่าง',
    pending: 'รอตรวจสอบ',
    approved: 'อนุมัติ',
    rejected: 'ไม่อนุมัติ',
    waiting_payment: 'รอชำระเงิน',
    paid: 'ชำระเงินแล้ว',
    in_production: 'กำลังผลิต',
    delivering: 'กำลังจัดส่ง',
    finished: 'เสร็จสิ้น',
    canceled: 'ยกเลิก',
  };
  const tStatus = (s) => (s ? (STATUS_TH[s] || s) : '-');

  // ✅ สไตล์ป้ายสถานะ
  const STATUS_STYLE = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    waiting_payment: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    in_production: 'bg-blue-100 text-blue-700',
    delivering: 'bg-indigo-100 text-indigo-700',
    finished: 'bg-gray-100 text-gray-700',
    canceled: 'bg-neutral-200 text-neutral-700',
  };
  const badgeClass = (s) =>
    `px-2 py-1 rounded text-sm font-medium ${STATUS_STYLE[s] || 'bg-gray-100 text-gray-700'}`;

  useEffect(() => {
    let cancelled = false;
    async function loadCustom() {
      try {
        const resOrders = await fetch(`${host}/api/custom-orders/orders`);
        if (!resOrders.ok) throw new Error('cannot list custom orders');
        const allOrders = await resOrders.json();
        const arr = Array.isArray(allOrders) ? allOrders : [];
        const coMap = {};
        arr.forEach(o => { coMap[o.id] = { custom_code: o.custom_code, created_at: o.created_at }; });
        if (!cancelled) setCustomOrdersMap(coMap);

        const waiting = arr.filter((o) => o.status === 'waiting_payment');
        const lists = await Promise.all(
          waiting.map(async (o) => {
            try {
              const r = await fetch(`${host}/api/custom-orders/orders/${o.id}/payments`);
              if (!r.ok) return [];
              const rows = await r.json();
              return (rows || [])
                .filter(p => p.status === 'pending')
                .map(p => ({ ...p, order_id: o.id }));
            } catch {
              return [];
            }
          })
        );
        if (!cancelled) setCustomPayments(lists.flat());
      } catch (e) {
        if (!cancelled) setCustomPayments([]);
        console.error('load custom payments failed:', e);
      } finally {
        if (!cancelled) setCustomLoading(false);
      }
    }
    loadCustom();
    return () => { cancelled = true; };
  }, [host]);

  const handlePreviewCustom = (imagePath) => {
    if (!imagePath) return;
    const url = imagePath.startsWith('/') ? `${host}${imagePath}` : `${host}/uploads/custom_payments/${imagePath}`;
    Swal.fire({
      imageUrl: url,
      imageAlt: 'สลิปชำระเงิน (สั่งทำ)',
      showConfirmButton: false,
      showCloseButton: true,
      background: '#000',
      width: 'auto',
      padding: 0
    });
  };

  const handleApproveCustom = async (paymentId) => {
    const result = await Swal.fire({
      title: 'ยืนยันอนุมัติสลิปสั่งทำนี้หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'อนุมัติ',
      cancelButtonText: 'ยกเลิก'
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${host}/api/custom-orders/payments/${paymentId}/approve`, { method: 'PUT' });
      if (!res.ok) throw new Error('approve failed');
      setCustomPayments((prev) => prev.filter((p) => p.id !== paymentId));
      Swal.fire('สำเร็จ', 'อนุมัติสลิปสั่งทำแล้ว', 'success');
    } catch {
      Swal.fire('ผิดพลาด', 'ไม่สามารถอนุมัติรายการนี้ได้', 'error');
    }
  };

  const getDisplayCustomCode = useCallback((p) => {
    const detail = p?.order_id ? customOrdersMap[p.order_id] : undefined;
    if (detail?.custom_code) return detail.custom_code;
    const d = p?.created_at ? new Date(p.created_at) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const seq = String(p?.order_id ?? 0).padStart(4, '0');
    return `OC#${y}${m}${day}-${seq}`;
  }, [customOrdersMap]);

  const copyText = (text) => {
    try {
      navigator.clipboard?.writeText(text);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'คัดลอกแล้ว', showConfirmButton: false, timer: 1200 });
    } catch { }
  };

  // ---- กรองรายการตามคำค้น (รองรับค้นหาสถานะภาษาไทยด้วย) ----
  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customPayments;
    return customPayments.filter((p) => {
      const code = getDisplayCustomCode(p).toLowerCase();
      const orderId = String(p.order_id ?? '').toLowerCase();
      const customerId = String(p.customer_id ?? '').toLowerCase();
      const amount = (p.amount != null ? String(p.amount) : '').toLowerCase();
      const statusEn = String(p.status ?? '').toLowerCase();
      const statusTh = tStatus(p.status).toLowerCase();
      return (
        code.includes(q) ||
        orderId.includes(q) ||
        customerId.includes(q) ||
        amount.includes(q) ||
        statusEn.includes(q) ||
        statusTh.includes(q)
      );
    });
  }, [customPayments, search, getDisplayCustomCode]);

  const renderCustomTable = () => {
    if (customLoading) return <div>กำลังโหลด...</div>;
    if (!filteredPayments.length) {
      return (
        <div className="text-gray-500">
          {customPayments.length ? 'ไม่พบรายการที่ตรงกับคำค้น' : 'ไม่มีสลิปสั่งทำที่รออนุมัติ'}
        </div>
      );
    }

    return (
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">#</th>
            <th className="border px-4 py-2">รหัสสั่งทำ</th>
            <th className="border px-4 py-2">Customer ID</th>
            <th className="border px-4 py-2">ยอด</th>
            <th className="border px-4 py-2">สลิป</th>
            <th className="border px-4 py-2">วันที่</th>
            <th className="border px-4 py-2">สถานะ</th>
            <th className="border px-4 py-2">ตรวจสอบ</th>
          </tr>
        </thead>
        <tbody>
          {filteredPayments.map((p, idx) => {
            const code = getDisplayCustomCode(p);
            return (
              <tr key={p.id}>
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
                  <div className="text-xs text-gray-500">#{p.order_id}</div>
                </td>
                <td className="border px-4 py-2">{p.customer_id}</td>
                <td className="border px-4 py-2">
                  {p.amount !== undefined && p.amount !== null && !isNaN(Number(p.amount))
                    ? `฿${Number(p.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                    : '-'}
                </td>
                <td className="border px-4 py-2">
                  {p.image ? (
                    <button
                      type="button"
                      onClick={() => handlePreviewCustom(p.image)}
                      className="focus:outline-none"
                      title="ดูสลิป"
                    >
                      <img
                        src={p.image && p.image.startsWith('/') ? `${host}${p.image}` : `${host}/uploads/custom_payments/${p.image}`}
                        alt="สลิป"
                        className="h-12 rounded cursor-zoom-in"
                      />
                    </button>
                  ) : <span className="text-gray-400">-</span>}
                </td>
                <td className="border px-4 py-2">
                  {p.created_at ? new Date(p.created_at).toLocaleDateString('th-TH') : '-'}
                </td>

                {/* ✅ แสดงสถานะเป็นภาษาไทย + ป้ายสี */}
                <td className="border px-4 py-2">
                  <span className={badgeClass(p.status)}>
                    {tStatus(p.status)}
                  </span>
                </td>

                <td className="border px-4 py-2">
                  <button
                    onClick={() => handleApproveCustom(p.id)}
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
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold">ตรวจสอบสลิปสั่งทำ (OC#)</h1>

        {/* กล่องค้นหา */}
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
            placeholder="ค้นหา: OC#, Order ID, ลูกค้า, ยอด, สถานะ"
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

      {renderCustomTable()}
    </div>
  );
}
