import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

const host = import.meta.env.VITE_HOST || '';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  finished: 'bg-green-100 text-green-800',
};

const statusText = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติ',
  rejected: 'ไม่อนุมัติ',
  finished: 'เสร็จสิ้น',
};

function Custom_Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
        text: `ต้องการเปลี่ยนสถานะเป็น "${statusText[status]}" ใช่หรือไม่?`,
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

        setOrders(orders => orders.map(o => o.id === id ? { ...o, status } : o));
        
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">รายการสั่งทำสินค้า</h2>
        <div className="text-sm text-gray-500">
          ทั้งหมด {orders.length} รายการ
        </div>
      </div>
      
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัส</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลูกค้า</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ขนาด</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สี</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวน</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ราคา</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.user_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.product_type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.width}x{order.height} {order.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.color}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ฿{Number(order.price).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status]}`}>
                    {statusText[order.status]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <select
                    value={order.status}
                    onChange={e => updateStatus(order.id, e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    {Object.entries(statusText).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Custom_Orders;