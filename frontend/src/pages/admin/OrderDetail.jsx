import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function AdminOrderDetail() {
  const host = import.meta.env.VITE_HOST;
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${host}/api/orders/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('ไม่พบคำสั่งซื้อ');
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id, host]);

  if (loading) return <div className="p-8">กำลังโหลด...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!order) return <div className="p-8">ไม่พบข้อมูลคำสั่งซื้อ</div>;

  const statusMapping = {
    pending: 'รอชำระเงิน/รออนุมัติ',
    approved: 'ชำระเงินแล้ว/อนุมัติแล้ว',
    shipped: 'กำลังจัดส่ง',
    delivered: 'จัดส่งสำเร็จ',
    cancelled: 'ยกเลิก',
  };

  return (
    <div className="container mx-auto mt-8 pl-24">
      <button onClick={() => navigate(-1)} className="mb-4 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">ย้อนกลับ</button>
      <h2 className="text-2xl font-bold mb-4">รายละเอียดคำสั่งซื้อ #{order.id}</h2>
      <div className="mb-4">
        <span className="font-semibold">สถานะ:</span>{' '}
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          order.status === 'approved' ? 'bg-blue-100 text-blue-800' :
          order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-600'
        }`}>
          {statusMapping[order.status] || order.status}
        </span>
      </div>
      <div className="mb-2"><span className="font-semibold">วันที่สั่ง:</span> {new Date(order.created_at).toLocaleString('th-TH')}</div>
      <div className="mb-2"><span className="font-semibold">ชื่อลูกค้า:</span> {order.customer_name}</div>
      <div className="mb-2"><span className="font-semibold">ที่อยู่จัดส่ง:</span> {order.shipping_address}</div>
      <div className="mb-2"><span className="font-semibold">เบอร์โทร:</span> {order.phone}</div>
      <div className="mb-2"><span className="font-semibold">หมายเหตุ:</span> {order.note || '-'}</div>
      <div className="mb-4">
        <span className="font-semibold">รายการสินค้า:</span>
        {order.items && order.items.length > 0 ? (
          <ul className="list-disc pl-6 mt-2">
            {order.items.map((item, idx) => (
              <li key={item.id ? `item-${item.id}` : `idx-${idx}`}> 
                {item.product_name} <span className="text-xs text-gray-500">x{item.quantity}</span> <span className="text-xs">(฿{Number(item.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })})</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-gray-400 ml-2">-</span>
        )}
      </div>
      <div className="mb-2"><span className="font-semibold">รวมราคา:</span> ฿{Number(order.total_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
      {order.receipt_url && (
        <div className="mb-2">
          <span className="font-semibold">สลิปโอนเงิน:</span>{' '}
          <a href={order.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ดาวน์โหลด</a>
        </div>
      )}
      <div className="mt-6">
        <span className="font-semibold">Admin Note:</span> {order.admin_note || '-'}
      </div>
    </div>
  );
}

export default AdminOrderDetail;
