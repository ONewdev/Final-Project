import React, { useEffect, useMemo, useState, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import Swal from 'sweetalert2';

const host = import.meta.env.VITE_HOST || '';

const statusMapping = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติ',
  rejected: 'ไม่อนุมัติ',
  waiting_payment: 'รอชำระเงิน',
  paid: 'ชำระเงินแล้ว',
  in_production: 'กำลังผลิต',
  delivering: 'กำลังจัดส่ง',
  finished: 'เสร็จสิ้น',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  waiting_payment: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  in_production: 'bg-purple-100 text-purple-800',
  delivering: 'bg-sky-100 text-sky-800',
  finished: 'bg-green-100 text-green-800',
};

const nextStatus = {
  pending: ['approved','rejected','waiting_payment'],
  waiting_payment: ['paid','rejected'],
  paid: ['in_production','rejected'],
  approved: ['in_production','rejected'],
  in_production: ['delivering','rejected'],
  delivering: ['finished'],
  finished: [],
  rejected: []
};

function OrdersCustom() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState(''); // yyyy-MM-dd จาก <input type="date">
  const [endDate, setEndDate] = useState('');     // yyyy-MM-dd จาก <input type="date">

  useEffect(() => {
    fetch(`${host}/api/custom-orders/orders`)
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching orders:', error);
        Swal.fire({
          icon: 'error',
          title: 'ไม่สามารถโหลดข้อมูลได้',
          text: 'กรุณาลองใหม่อีกครั้ง',
        });
        setLoading(false);
      });
  }, []);

  // ✅ แสดง OC# จาก custom_code และทำ fallback อัตโนมัติ
  const getDisplayCustomCode = useCallback((o) => {
    if (o?.custom_code) return o.custom_code; // มีจาก DB/trigger แล้ว
    const d = o?.created_at ? new Date(o.created_at) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const seq = String(o?.id ?? 0).padStart(4, '0');
    return `OC#${y}${m}${day}-${seq}`;
  }, []);

  const handleCopyCode = (code) => {
    try {
      navigator.clipboard?.writeText(code);
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: 'คัดลอกรหัสแล้ว', showConfirmButton: false, timer: 1200
      });
    } catch {}
  };

  const updateStatus = async (id, status) => {
    try {
      const result = await Swal.fire({
        title: 'ยืนยันการเปลี่ยนสถานะ',
        text: `ต้องการเปลี่ยนสถานะเป็น "${statusMapping[status] || status}" ใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
      });

      if (!result.isConfirmed) return;

      const response = await fetch(`${host}/api/custom-orders/order/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // ถ้า backend map approved -> waiting_payment
      const mapped = status === 'approved' ? 'waiting_payment' : status;
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, status: mapped } : o)));

      Swal.fire({ icon: 'success', title: 'อัพเดทสถานะสำเร็จ', showConfirmButton: false, timer: 1500 });
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({ icon: 'error', title: 'ไม่สามารถอัพเดทสถานะได้', text: 'กรุณาลองใหม่อีกครั้ง' });
    }
  };

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (filterStatus !== 'all') {
      result = result.filter((o) => o.status === filterStatus);
    }

    if (searchText.trim() !== '') {
      const lower = searchText.toLowerCase();
      result = result.filter((o) =>
        (o.user_id && String(o.user_id).toLowerCase().includes(lower)) ||
        (o.product_type && o.product_type.toLowerCase().includes(lower)) ||
        (o.color && o.color.toLowerCase().includes(lower)) ||
        (o.status && (statusMapping[o.status] || o.status).toLowerCase().includes(lower)) ||
        (o.custom_code && o.custom_code.toLowerCase().includes(lower)) ||  // ✅ ค้นด้วย custom_code
        (getDisplayCustomCode(o).toLowerCase().includes(lower))            // ✅ fallback code
      );
    }

    // ✅ กรองวันที่แบบแม่นยำ: แปลงเป็น Date และให้ endDate ครอบคลุมถึง 23:59:59
    const start = startDate ? new Date(startDate) : null; // yyyy-MM-dd -> Date
    const end = endDate
      ? new Date(new Date(endDate).getFullYear(), new Date(endDate).getMonth(), new Date(endDate).getDate() + 1)
      : null; // บวก 1 วันเพื่อใช้ < end (เทียบก่อนเที่ยงคืนวันถัดไป)

    if (start) {
      result = result.filter(o => o.created_at && new Date(o.created_at) >= start);
    }
    if (end) {
      result = result.filter(o => o.created_at && new Date(o.created_at) < end);
    }

    return result;
  }, [orders, filterStatus, searchText, startDate, endDate, getDisplayCustomCode]);

  const columns = useMemo(
    () => [
      {
        name: 'รหัสสั่งทำ',
        width: '210px',
        cell: (row) => {
          const code = getDisplayCustomCode(row);
          return (
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-wide font-mono">{code}</span>
              <button
                className="px-2 py-0.5 text-xs border rounded hover:bg-gray-50"
                onClick={(e) => { e.stopPropagation(); handleCopyCode(code); }}
                title="คัดลอกรหัส"
              >
                คัดลอก
              </button>
            </div>
          );
        },
      },
      { name: 'ลูกค้า', selector: (row) => row.customer_name || '-' },
      { name: 'ประเภท', selector: (row) => row.product_type || '-' },
      { name: 'ขนาด', selector: (row) => `${row.width}x${row.height} ${row.unit}` },
      { name: 'สี', selector: (row) => row.color || '-' },
      { name: 'จำนวน', selector: (row) => row.quantity },
      {
        name: 'ราคา',
        selector: (row) =>
          Number.isFinite(Number(row.price))
            ? `฿${Number(row.price).toLocaleString('th-TH')}`
            : '-',
      },
      {
        name: 'วันที่สั่ง',
        selector: (row) => (row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : '-'),
      },
      {
        name: 'สถานะ',
        cell: (row) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[row.status] || 'bg-gray-100 text-gray-800'}`}>
            {statusMapping[row.status] || row.status}
          </span>
        ),
      },
      {
        name: 'จัดการ',
        cell: (row) => (
          <select
            value={row.status}
            onChange={e => updateStatus(row.id, e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value={row.status}>{statusMapping[row.status] || row.status}</option>
            {nextStatus[row.status]?.map((value) => (
              <option key={value} value={value}>{statusMapping[value] || value}</option>
            ))}
          </select>
        ),
      },
    ],
    [getDisplayCustomCode]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-8 pl-24">
      <h2 className="text-2xl font-bold mb-6">รายการสั่งทำสินค้า</h2>

      {/* ฟิลเตอร์ค้นหาแบบ card/grid */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">สถานะ</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded w-full p-2"
            >
              <option value="all">ทั้งหมด</option>
              {Object.entries(statusMapping).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ค้นหา</label>
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="รหัส (OC#...), ลูกค้า, ประเภท, สี, สถานะ..."
              className="border rounded w-full p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">วันที่เริ่มต้น</label>
            <input
              type="date"
              lang="th-TH"                 // ✅ แสดง dd/mm/yyyy
              value={startDate}
              onChange={e => setStartDate(e.target.value)} // state = yyyy-MM-dd
              className="border rounded w-full p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ถึงวันที่</label>
            <input
              type="date"
              lang="th-TH"                 // ✅ แสดง dd/mm/yyyy
              value={endDate}
              onChange={e => setEndDate(e.target.value)}   // state = yyyy-MM-dd
              className="border rounded w-full p-2"
            />
          </div>
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredOrders}
          pagination
          highlightOnHover
          pointerOnHover
        />
      ) : (
        <p className="text-gray-500">ไม่พบรายการสั่งทำ</p>
      )}
    </div>
  );
}

export default OrdersCustom;
