import React, { useEffect, useMemo, useState, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import Swal from 'sweetalert2';
import { FaCheck, FaShippingFast } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function Orders() {
  const host = import.meta.env.VITE_HOST;
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchText, setSearchText] = useState('');

  const statusMapping = {
    pending: 'รอชำระเงิน/รออนุมัติ',
    approved: 'ชำระเงินแล้ว/อนุมัติแล้ว',
    processing: 'กำลังเตรียมสินค้า',
    shipped: 'กำลังจัดส่ง',
    delivered: 'จัดส่งสำเร็จ',
    cancelled: 'ยกเลิก',
  };

  useEffect(() => {
    fetch(`${host}/api/orders`)
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Fetch error:', err));
  }, [host]);

  // ✅ ฟังก์ชันสร้างรหัสแสดงผล (fallback ถ้ายังไม่มี order_code)
  const getDisplayOrderCode = useCallback((o) => {
    if (o?.order_code) return o.order_code;
    // สร้างแบบ OR#YYYYMMDD-000X ใช้วันที่ created_at ถ้ามี ไม่งั้นใช้วันนี้
    const d = o?.created_at ? new Date(o.created_at) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const seq = String(o?.id ?? 0).padStart(4, '0');
    return `OR#${y}${m}${day}-${seq}`;
  }, []);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filterStatus !== 'all') {
      result = result.filter((o) => o.status === filterStatus);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((o) => o.created_at && new Date(o.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setDate(to.getDate() + 1);
      result = result.filter((o) => o.created_at && new Date(o.created_at) < to);
    }
    if (searchText.trim() !== '') {
      const lower = searchText.toLowerCase();
      result = result.filter((o) =>
        (o.customer_name && o.customer_name.toLowerCase().includes(lower)) ||
        (String(o.id).includes(lower)) ||
        (o.order_code && o.order_code.toLowerCase().includes(lower)) || // ✅ ค้นด้วย order_code
        (getDisplayOrderCode(o).toLowerCase().includes(lower)) ||        // ✅ fallback code
        (o.items && o.items.some(item => item.product_name && item.product_name.toLowerCase().includes(lower))) ||
        (o.status && (statusMapping[o.status] || o.status).toLowerCase().includes(lower))
      );
    }
    return result;
  }, [orders, filterStatus, dateFrom, dateTo, searchText, statusMapping, getDisplayOrderCode]);

  const handleStatusChange = (id, status) => {
    const order = orders.find(o => o.id === id);
    const code = getDisplayOrderCode(order);
    const statusText = statusMapping[status] || status;

    Swal.fire({
      title: 'ยืนยันเปลี่ยนสถานะคำสั่งซื้อ?',
      text: `เปลี่ยนเป็น "${statusText}" สำหรับ ${code}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await fetch(`${host}/api/orders/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('update status failed');
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
        Swal.fire('สำเร็จ', `อัปเดตสถานะเป็น "${statusText}" แล้ว`, 'success');
      } catch {
        Swal.fire('ผิดพลาด', 'อัปเดตสถานะไม่สำเร็จ', 'error');
      }
    });
  };

  const handleCopyCode = (code) => {
    try {
      navigator.clipboard?.writeText(code);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'คัดลอกรหัสแล้ว', showConfirmButton: false, timer: 1200 });
    } catch { }
  };

  const columns = useMemo(
    () => [
      {
        name: 'รหัสคำสั่งซื้อ',
        width: '200px',
        cell: (row) => {
          const code = getDisplayOrderCode(row);
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
      { name: 'ชื่อลูกค้า', selector: (row) => row.customer_name || '-' },
      {
        name: 'สินค้า',
        cell: (row) =>
          row.items?.length ? (
            <ul className="list-disc pl-4">
              {row.items.map((item, idx) => (
                <li key={item.id ? `item-${item.id}` : `idx-${idx}`}>
                  {item.product_name}{' '}
                  <span className="text-xs text-gray-500">x{item.quantity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-400">-</span>
          ),
      },
      {
        name: 'รวมราคา',
        selector: (row) =>
          row.total_price != null && !isNaN(Number(row.total_price))
            ? `฿${Number(row.total_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
            : '-',
      },
      { name: 'ที่อยู่จัดส่ง', selector: (row) => row.shipping_address || '-' },
      {
        name: 'วันที่สั่ง',
        selector: (row) => (row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : '-'),
      },
      {
        name: 'สถานะ',
        cell: (row) => {
          let colorClass = 'bg-gray-100 text-gray-600';
          if (row.status === 'pending') colorClass = 'bg-yellow-100 text-yellow-800';
          else if (row.status === 'approved') colorClass = 'bg-blue-100 text-blue-800';
          else if (row.status === 'processing') colorClass = 'bg-purple-100 text-purple-800';
          else if (row.status === 'shipped') colorClass = 'bg-amber-100 text-amber-800';
          else if (row.status === 'delivered') colorClass = 'bg-green-100 text-green-800';
          else if (row.status === 'cancelled') colorClass = 'bg-red-100 text-red-800';
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
              {statusMapping[row.status] || row.status}
            </span>
          );
        },
      },
      {
        name: 'การดำเนินการ',
        cell: (row) => (
          <div className="flex gap-2">
            {row.status === 'pending' ? (
              <button
                onClick={() => handleStatusChange(row.id, 'approved')}
                className="px-2 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                title="อนุมัติ/ชำระเงินแล้ว"
              >
                <FaCheck />
              </button>
            ) : row.status === 'approved' ? (
              <button
                onClick={() => handleStatusChange(row.id, 'processing')}
                className="px-2 py-1 text-purple-600 border border-purple-300 rounded hover:bg-purple-50 transition-colors"
                title="กำลังเตรียมสินค้า"
              >
                <FaCheck />
              </button>
            ) : row.status === 'processing' ? (
              <button
                onClick={() => handleStatusChange(row.id, 'shipped')}
                className="px-2 py-1 text-amber-600 border border-amber-300 rounded hover:bg-amber-50 transition-colors"
                title="จัดส่ง"
              >
                <FaShippingFast />
              </button>
            ) : row.status === 'shipped' ? (
              <button
                onClick={() => handleStatusChange(row.id, 'delivered')}
                className="px-2 py-1 text-green-600 border border-green-300 rounded hover:bg-green-50 transition-colors"
                title="จัดส่งสำเร็จ"
              >
                <FaCheck />
              </button>
            ) : null}
          </div>
        ),
      },
    ],
    [getDisplayOrderCode, statusMapping]
  );

  return (
    <div className="container mx-auto mt-8 pl-24">
      <h2 className="text-2xl font-bold mb-6">คำสั่งซื้อ</h2>

      {/* ฟิลเตอร์ */}
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
              placeholder="รหัส (OR#...), ชื่อ, สินค้า, สถานะ..."
              className="border rounded w-full p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">วันที่สั่ง (จาก)</label>
            <div className="relative">
              <input
                type="date"
                lang="th-TH" // หรือ "en-GB"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="border rounded w-full p-2"
              />
              
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ถึงวันที่</label>
            <div className="relative">
              <input
                type="date"
                lang="th-TH"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="border rounded w-full p-2"
              />
             
            </div>

          </div>
          {(dateFrom || dateTo) && (
            <div className="flex items-end">
              <button
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs mt-6"
                onClick={() => { setDateFrom(''); setDateTo(''); }}
              >ล้างวันที่</button>
            </div>
          )}
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredOrders}
          pagination
          onRowClicked={(row) => navigate(`/admin/orders/${row.id}`)} // URL ยังใช้ id เดิม
          highlightOnHover
          pointerOnHover
        />
      ) : (
        <p className="text-gray-500">ไม่พบคำสั่งซื้อ</p>
      )}
    </div>
  );
}

export default Orders;
