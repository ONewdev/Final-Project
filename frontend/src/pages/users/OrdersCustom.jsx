import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const host = import.meta.env.VITE_HOST || '';

const STATUS_TEXT = {
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
  waiting_payment: 'รอชำระเงิน',
  paid: 'ชำระเงินแล้ว',
  in_production: 'กำลังผลิต',
  delivering: 'กำลังจัดส่ง',
  finished: 'เสร็จสิ้น',
};

const STATUS_CLASS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  waiting_payment: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  in_production: 'bg-purple-100 text-purple-800',
  delivering: 'bg-sky-100 text-sky-800',
  finished: 'bg-green-100 text-green-800',
};

function OrdersCustom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${host}/api/custom/orders?user_id=${user.id}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        setError('ไม่สามารถดึงรายการสั่งทำได้');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">รายการสั่งทำของฉัน</h2>
        <div className="text-sm text-gray-500">ทั้งหมด {orders.length} รายการ</div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600">
          ยังไม่มีรายการสั่งทำ
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">เลขที่</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ประเภท</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ขนาด</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สี</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จำนวน</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ราคา</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 md:px-6 py-3 whitespace-nowrap text-sm text-gray-900">#{o.id}</td>
                  <td className="px-4 md:px-6 py-3 whitespace-nowrap text-sm text-gray-700">{o.product_type || '-'}</td>
                  <td className="px-4 md:px-6 py-3 whitespace-nowrap text-sm text-gray-700">{o.width}x{o.height} {o.unit}</td>
                  <td className="px-4 md:px-6 py-3 whitespace-nowrap text-sm text-gray-700">{o.color || '-'}</td>
                  <td className="px-4 md:px-6 py-3 whitespace-nowrap text-sm text-gray-700">{o.quantity}</td>
                  <td className="px-4 md:px-6 py-3 whitespace-nowrap text-sm text-gray-700">฿{Number(o.price || 0).toLocaleString()}</td>
                  <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_CLASS[o.status] || 'bg-gray-100 text-gray-800'}`}>
                      {STATUS_TEXT[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs text-gray-500">
                    {o.created_at ? new Date(o.created_at).toLocaleString('th-TH') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default OrdersCustom;
