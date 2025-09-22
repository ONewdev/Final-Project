
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

function formatDateTimeTH(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}


function OrdersCustom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOrder, setModalOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

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

  const handleShowDetail = async (orderId) => {
    setModalLoading(true);
    try {
      const res = await fetch(`${host}/api/custom/orders/${orderId}`);
      if (!res.ok) throw new Error('ไม่พบข้อมูล');
      const data = await res.json();
      setModalOrder(data);
    } catch {
      setModalOrder(null);
    } finally {
      setModalLoading(false);
    }
  };

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
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ดูรายละเอียด</th>
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
                    {formatDateTimeTH(o.created_at)}
                  </td>
                  <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-semibold"
                      onClick={() => handleShowDetail(o.id)}
                    >
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal แสดงรายละเอียดออเดอร์ */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-xl relative">
            <button
              onClick={() => setModalOrder(null)}
              className="absolute top-2 right-2 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              ปิด
            </button>
            <h3 className="text-xl font-bold mb-4">รายละเอียดคำสั่งทำ #{modalOrder.id}</h3>
            {modalLoading ? (
              <div className="text-gray-500">กำลังโหลด...</div>
            ) : (
              <>
                <div className="mb-2">
                  <span className="font-semibold">สถานะ: </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CLASS[modalOrder.status] || 'bg-gray-100 text-gray-800'}`}>{STATUS_TEXT[modalOrder.status] || modalOrder.status}</span>
                </div>
                <div className="mb-2"><span className="font-semibold">ประเภท:</span> {modalOrder.product_type}</div>
                <div className="mb-2"><span className="font-semibold">ขนาด:</span> {modalOrder.width}x{modalOrder.height} {modalOrder.unit}</div>
                <div className="mb-2"><span className="font-semibold">สี:</span> {modalOrder.color}</div>
                <div className="mb-2"><span className="font-semibold">จำนวน:</span> {modalOrder.quantity}</div>
                <div className="mb-2"><span className="font-semibold">ราคา:</span> ฿{Number(modalOrder.price || 0).toLocaleString()}</div>
                <div className="mb-2"><span className="font-semibold">วันที่สั่ง:</span> {formatDateTimeTH(modalOrder.created_at)}</div>
                {modalOrder.details && (
                  <div className="mb-2"><span className="font-semibold">รายละเอียดเพิ่มเติม:</span> {modalOrder.details}</div>
                )}
                {modalOrder.files && modalOrder.files.length > 0 && (
                  <div className="mb-2">
                    <span className="font-semibold">ไฟล์แนบ:</span>
                    <ul className="list-disc pl-6 mt-2">
                      {modalOrder.files.map(f => (
                        <li key={f.id}><a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{f.filename}</a></li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersCustom;
