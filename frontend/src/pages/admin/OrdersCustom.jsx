import React, { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    fetch(`${host}/api/custom/orders`)
      .then(res => res.json())
      .then(data => {
        setOrders(data);
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

  const updateStatus = async (id, status) => {
    try {
      const result = await Swal.fire({
        title: 'ยืนยันการเปลี่ยนสถานะ',
        text: `ต้องการเปลี่ยนสถานะเป็น "${statusMapping[status] || status}" ใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
      });

      if (result.isConfirmed) {
        const response = await fetch(`${host}/api/custom/order/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) throw new Error('Failed to update status');

        // reflect backend mapping: approved -> waiting_payment
        const mapped = status === 'approved' ? 'waiting_payment' : status;
        setOrders(orders => orders.map(o => o.id === id ? { ...o, status: mapped } : o));
        
        Swal.fire({
          icon: 'success',
          title: 'อัพเดทสถานะสำเร็จ',
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถอัพเดทสถานะได้',
        text: 'กรุณาลองใหม่อีกครั้ง',
      });
    }
  };

  const filteredOrders = useMemo(() => {
    if (filterStatus === 'all') return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [orders, filterStatus]);

  const columns = useMemo(
    () => [
      { name: '#', cell: (row, idx) => idx + 1, width: '60px' },
      { name: 'ลูกค้า', selector: (row) => row.user_id },
      { name: 'ประเภท', selector: (row) => row.product_type },
      { name: 'ขนาด', selector: (row) => `${row.width}x${row.height} ${row.unit}` },
      { name: 'สี', selector: (row) => row.color },
      { name: 'จำนวน', selector: (row) => row.quantity },
      { name: 'ราคา', selector: (row) => `฿${Number(row.price).toLocaleString()}` },
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
    []
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );

  return (
    <div className="container mx-auto mt-8 pl-24">
      <h2 className="text-2xl font-bold mb-6">รายการสั่งทำสินค้า</h2>

      <div className="mb-4">
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
