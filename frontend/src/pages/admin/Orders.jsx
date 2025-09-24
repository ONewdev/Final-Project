import React, { useEffect, useMemo, useState } from 'react';
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

  const statusMapping = {
    pending: 'รอชำระเงิน/รออนุมัติ',
    approved: 'ชำระเงินแล้ว/อนุมัติแล้ว',
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
      // Add 1 day to include the end date
      const to = new Date(dateTo);
      to.setDate(to.getDate() + 1);
      result = result.filter((o) => o.created_at && new Date(o.created_at) < to);
    }
    return result;
  }, [orders, filterStatus, dateFrom, dateTo]);

  const handleStatusChange = (id, status) => {
    const statusText = statusMapping[status] || status;
    Swal.fire({
      title: 'ยืนยันเปลี่ยนสถานะคำสั่งซื้อ?',
      text: `เปลี่ยนเป็น "${statusText}" สำหรับ Order #${id}`,
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

  const columns = useMemo(
    () => [
      { name: '#', cell: (row, idx) => idx + 1, width: '60px' },
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
          else if (row.status === 'shipped') colorClass = 'bg-purple-100 text-purple-800';
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
                onClick={() => handleStatusChange(row.id, 'shipped')}
                className="px-2 py-1 text-purple-600 border border-purple-300 rounded hover:bg-purple-50 transition-colors"
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
    []
  );

  return (
    <div className="container mx-auto mt-8 pl-24">
      <h2 className="text-2xl font-bold mb-6">คำสั่งซื้อ</h2>

      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <label className="mr-2">กรองตามสถานะ:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded p-1"
        >
          <option value="all">ทั้งหมด</option>
          {Object.entries(statusMapping).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
        <label className="ml-4">วันที่สั่ง (จาก):</label>
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="border rounded p-1"
        />
        <label className="ml-2">ถึง:</label>
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="border rounded p-1"
        />
        {(dateFrom || dateTo) && (
          <button
            className="ml-2 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs"
            onClick={() => { setDateFrom(''); setDateTo(''); }}
          >ล้างวันที่</button>
        )}
      </div>

      {filteredOrders.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredOrders}
          pagination
          // ✅ คลิกทั้งแถว -> ไปหน้า detail
          onRowClicked={(row) => navigate(`/admin/orders/${row.id}`)}
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
