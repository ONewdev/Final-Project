import Swal from 'sweetalert2';
import React, { useEffect, useState, useMemo, useCallback } from 'react';

export default function PaymentCheck() {
  const host = import.meta.env.VITE_HOST || '';
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // map สำหรับดึงรหัส OR# จาก orders
  const [ordersMap, setOrdersMap] = useState({}); // { [order_id]: { order_code, created_at } }
  const [ordersLoading, setOrdersLoading] = useState(true);

  // custom order payments
  const [customPayments, setCustomPayments] = useState([]);
  const [customLoading, setCustomLoading] = useState(true);
  // map สำหรับดึงรหัส OC# จาก custom_orders
  const [customOrdersMap, setCustomOrdersMap] = useState({}); // { [id]: { custom_code, created_at } }

  // all | order | custom
  const [categoryFilter, setCategoryFilter] = useState('all');

  const handlePreview = (imageName) => {
    if (!imageName) return;
    const url = `${host}/uploads/payments/${imageName}`;
    Swal.fire({ imageUrl: url, imageAlt: 'สลิป', showConfirmButton: false, showCloseButton: true, background: '#000', width: 'auto', padding: 0 });
  };

  useEffect(() => {
    fetch(`${host}/api/payments?status=pending`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        try { return JSON.parse(text); } catch { throw new Error('Response is not valid JSON'); }
      })
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch((err) => {
        setPayments([]);
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลการโอนเงินได้\n' + err.message, 'error');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [host]);

  // โหลด orders เพื่อให้ได้ order_code (OR#...)
  useEffect(() => {
    let cancel = false;
    async function loadOrdersMap() {
      try {
        const res = await fetch(`${host}/api/orders`);
        if (!res.ok) throw new Error('cannot list orders');
        const rows = await res.json();
        const map = {};
        (Array.isArray(rows) ? rows : []).forEach(o => {
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
    return () => { cancel = true; };
  }, [host]);

  // Load pending custom-order payment slips + map custom orders (OC#...)
  useEffect(() => {
    let cancelled = false;
    async function loadCustom() {
      try {
        const resOrders = await fetch(`${host}/api/custom-orders/orders`);
        if (!resOrders.ok) throw new Error('cannot list custom orders');
        const allOrders = await resOrders.json();
        const arr = Array.isArray(allOrders) ? allOrders : [];

        // map สำหรับดึง custom_code/created_at
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
              return (rows || []).filter(p => p.status === 'pending').map(p => ({ ...p, order_id: o.id }));
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
    Swal.fire({ imageUrl: url, imageAlt: 'สลิปชำระเงิน (สั่งทำ)', showConfirmButton: false, showCloseButton: true, background: '#000', width: 'auto', padding: 0 });
  };

  const handleApproveCustom = async (paymentId) => {
    const result = await Swal.fire({ title: 'ยืนยันอนุมัติสลิปสั่งทำนี้หรือไม่?', icon: 'question', showCancelButton: true, confirmButtonText: 'อนุมัติ', cancelButtonText: 'ยกเลิก' });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${host}/api/custom/payments/${paymentId}/approve`, { method: 'PUT' });
      if (!res.ok) throw new Error('approve failed');
      setCustomPayments((prev) => prev.filter((p) => p.id !== paymentId));
      Swal.fire('สำเร็จ', 'อนุมัติสลิปสั่งทำแล้ว', 'success');
    } catch {
      Swal.fire('ผิดพลาด', 'ไม่สามารถอนุมัติรายการนี้ได้', 'error');
    }
  };

  const handleApprove = async (paymentId) => {
    const result = await Swal.fire({ title: 'ยืนยันการอนุมัติ', text: 'คุณต้องการอนุมัติการชำระเงินนี้ใช่หรือไม่?', icon: 'question', showCancelButton: true, confirmButtonText: 'อนุมัติ', cancelButtonText: 'ยกเลิก' });
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

  // ===== รหัสแสดงผล + fallback =====
  const getDisplayOrderCode = useCallback((payment) => {
    // ลองจาก ordersMap ก่อน (มีโค้ดจริง)
    const detail = payment?.order_id ? ordersMap[payment.order_id] : undefined;
    if (detail?.order_code) return detail.order_code;
    // fallback: ใช้วันที่สลิป + id
    const d = payment?.created_at ? new Date(payment.created_at) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const seq = String(payment?.order_id ?? 0).padStart(4, '0');
    return `OR#${y}${m}${day}-${seq}`;
  }, [ordersMap]);

  const getDisplayCustomCode = useCallback((p) => {
    const detail = p?.order_id ? customOrdersMap[p.order_id] : undefined;
    if (detail?.custom_code) return detail.custom_code;
    // fallback: อิงวันที่สลิป + order_id
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
    } catch {}
  };

  // === ค่าที่ใช้โชว์ผลรวมบน label ===
  const counts = useMemo(
    () => ({ order: payments.length, custom: customPayments.length, all: payments.length + customPayments.length }),
    [payments, customPayments]
  );

  // === ตารางสลิปสั่งซื้อ (OR#) ===
  const renderOrdersTable = () => {
    if (loading || ordersLoading) return <div>กำลังโหลด...</div>;
    if (!payments.length) return <div className="text-gray-500">ไม่มีรายการโอนเงินที่รอการตรวจสอบ</div>;

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
          {payments.map((payment, idx) => {
            const code = getDisplayOrderCode(payment);
            return (
              <tr key={payment.id}>
                <td className="border px-4 py-2 text-center">{idx + 1}</td>
                <td className="border px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{code}</span>
                    <button className="text-xs border rounded px-2 py-0.5 hover:bg-gray-50" onClick={() => copyText(code)}>คัดลอก</button>
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
                      <button type="button" onClick={() => handlePreview(payment.image)} className="focus:outline-none" title="คลิกเพื่อดูภาพ">
                        <img src={`${host}/uploads/payments/${payment.image}`} alt="สลิป" className="h-12 rounded cursor-zoom-in" />
                      </button>
                      <div className="text-xs text-gray-400 break-all">{payment.image}</div>
                    </div>
                  ) : <span className="text-gray-400">-</span>}
                </td>
                <td className="border px-4 py-2">{payment.created_at ? new Date(payment.created_at).toLocaleDateString('th-TH') : '-'}</td>
                <td className="border px-4 py-2">
                  <span className="px-2 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-600">
                    {payment.status === 'pending' ? 'รอตรวจสอบ' : payment.status}
                  </span>
                </td>
                <td className="border px-4 py-2">
                  <button onClick={() => handleApprove(payment.id)} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs">
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

  // === ตารางสลิปสั่งทำ (OC#) ===
  const renderCustomTable = () => {
    if (customLoading) return <div>กำลังโหลด...</div>;
    if (!customPayments.length) return <div className="text-gray-500">ไม่มีสลิปสั่งทำที่รออนุมัติ</div>;

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
          {customPayments.map((p, idx) => {
            const code = getDisplayCustomCode(p);
            return (
              <tr key={p.id}>
                <td className="border px-4 py-2 text-center">{idx + 1}</td>
                <td className="border px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{code}</span>
                    <button className="text-xs border rounded px-2 py-0.5 hover:bg-gray-50" onClick={() => copyText(code)}>คัดลอก</button>
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
                    <button type="button" onClick={() => handlePreviewCustom(p.image)} className="focus:outline-none" title="ดูสลิป">
                      <img
                        src={p.image && p.image.startsWith('/') ? `${host}${p.image}` : `${host}/uploads/custom_payments/${p.image}`}
                        alt="สลิป"
                        className="h-12 rounded cursor-zoom-in"
                      />
                    </button>
                  ) : <span className="text-gray-400">-</span>}
                </td>
                <td className="border px-4 py-2">{p.created_at ? new Date(p.created_at).toLocaleDateString('th-TH') : '-'}</td>
                <td className="border px-4 py-2">
                  <span className="px-2 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-600">
                    {p.status}
                  </span>
                </td>
                <td className="border px-4 py-2">
                  <button onClick={() => handleApproveCustom(p.id)} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold">ตรวจสอบการโอนเงิน</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="categoryFilter" className="text-sm text-gray-700">หมวดหมู่:</label>
          <select
            id="categoryFilter"
            className="border rounded px-3 py-2 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">ทั้งหมด ({counts.all})</option>
            <option value="order">สลิปสั่งซื้อ ({counts.order})</option>
            <option value="custom">สลิปสั่งทำ ({counts.custom})</option>
          </select>
        </div>
      </div>

      {(categoryFilter === 'all' || categoryFilter === 'order') && (
        <>
          <h2 className="text-xl font-bold mb-2">
            สลิปสั่งซื้อ (รอตรวจสอบ){' '}
            <span className="text-sm font-normal text-gray-500">— {counts.order} รายการ</span>
          </h2>
          {renderOrdersTable()}
          {(categoryFilter === 'all') && <div className="h-8" />}
        </>
      )}

      {(categoryFilter === 'all' || categoryFilter === 'custom') && (
        <>
          <h2 className="text-xl font-bold mb-2">
            สลิปสั่งทำ (รอตรวจสอบ){' '}
            <span className="text-sm font-normal text-gray-500">— {counts.custom} รายการ</span>
          </h2>
          {renderCustomTable()}
        </>
      )}
    </div>
  );
}
