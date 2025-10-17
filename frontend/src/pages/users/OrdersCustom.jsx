import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const host = import.meta.env.VITE_HOST || '';


// สถานะภาษาไทย
const STATUS_TEXT = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติ',
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

// ✅ สร้างรหัส OC# สำหรับแสดงผล (ใช้ order_code ถ้ามี)
function getDisplayCustomCode(o) {
  if (!o) return '';
  if (o.order_code) return o.order_code; // ใช้จาก backend ทันทีถ้ามี
  const d = o.created_at ? new Date(o.created_at) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const seq = String(o.id ?? 0).padStart(4, '0');
  return `OC#${y}${m}${day}-${seq}`;
}

async function copyText(text) {
  try {
    await navigator.clipboard?.writeText(text);
  } catch {
    // เงียบไว้ ถ้าคัดลอกไม่ได้
  }
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
        const res = await fetch(`${host}/api/custom-orders/orders?user_id=${user.id}`, {
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
      const res = await fetch(`${host}/api/custom-orders/orders/${orderId}`);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(o => {
            const code = getDisplayCustomCode(o);
            return (
              <div key={o.id} className="bg-white rounded-xl shadow p-6 flex flex-col justify-between hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-gray-800 font-mono">{code}</span>
                    <button
                      className="text-xs border rounded px-2 py-0.5 hover:bg-gray-50"
                      onClick={() => copyText(code)}
                      title="คัดลอก"
                    >
                      คัดลอก
                    </button>
                    <span className="text-xs text-gray-400">#{String(o.id).padStart(4, '0')}</span>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_CLASS[o.status] || 'bg-gray-100 text-gray-800'}`}>
                    {STATUS_TEXT[o.status] || o.status}
                  </span>
                </div>

                <div className="mb-2"><span className="font-semibold">ประเภท:</span> {o.product_type || '-'}</div>
                <div className="mb-2"><span className="font-semibold">ขนาด:</span> {o.width}x{o.height} {o.unit}</div>
                <div className="mb-2"><span className="font-semibold">สี:</span> {o.color || '-'}</div>
                <div className="mb-2"><span className="font-semibold">จำนวน:</span> {o.quantity}</div>
                <div className="mb-2">
                  <span className="font-semibold">ราคาสินค้า:</span>{' '}
                  <span className="text-blue-700 font-bold">฿{Number(o.price || 0).toLocaleString()}</span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">ค่าส่ง:</span>{' '}
                  <span className="text-orange-600 font-bold">
                    {o.shipping_method === 'pickup' 
                      ? 'รับหน้าร้าน' 
                      : (Number(o.shipping_fee) || 0) > 0 
                        ? `฿${Number(o.shipping_fee).toLocaleString()}` 
                        : 'ฟรี'}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">ราคารวม:</span>{' '}
                  <span className="text-green-600 font-bold text-lg">
                    ฿{(() => {
                      const productPrice = Number(o.price) || 0;
                      const shippingFee = Number(o.shipping_fee) || 0;
                      return (productPrice + shippingFee).toLocaleString();
                    })()}
                  </span>
                </div>
                <div className="mb-2"><span className="font-semibold">วันที่สั่ง:</span> {formatDateTimeTH(o.created_at)}</div>

                <div className="flex gap-2 mt-4">
                  {o.status === 'waiting_payment' && (
                    <button
                      className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-semibold"
                      onClick={() => navigate(`/users/custom-order-payment/${o.id}`)}
                    >
                      ชำระเงิน
                    </button>
                  )}
                  <button
                    className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-semibold"
                    onClick={() => handleShowDetail(o.id)}
                  >
                    ดูรายละเอียด
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal แสดงรายละเอียดออเดอร์ */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative animate-fadein">
            <button
              onClick={() => setModalOrder(null)}
              className="absolute top-2 right-2 px-2 py-1 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-700"
              aria-label="ปิด"
            >
              ✕
            </button>

            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-2xl font-bold text-blue-700 font-mono">
                {getDisplayCustomCode(modalOrder)}
              </h3>
              <button
                className="text-xs border rounded px-2 py-0.5 hover:bg-gray-50"
                onClick={() => copyText(getDisplayCustomCode(modalOrder))}
                title="คัดลอก"
              >
                คัดลอก
              </button>
              <span className="text-xs text-gray-400">#{String(modalOrder.id).padStart(4, '0')}</span>
            </div>

            {modalLoading ? (
              <div className="text-gray-500">กำลังโหลด...</div>
            ) : (
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">สถานะ: </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_CLASS[modalOrder.status] || 'bg-gray-100 text-gray-800'}`}>
                    {STATUS_TEXT[modalOrder.status] || modalOrder.status}
                  </span>
                </div>
                <div><span className="font-semibold">ประเภท:</span> {modalOrder.product_type}</div>
                <div><span className="font-semibold">ขนาด:</span> {modalOrder.width}x{modalOrder.height} {modalOrder.unit}</div>
                <div><span className="font-semibold">สี:</span> {modalOrder.color}</div>
                <div><span className="font-semibold">จำนวน:</span> {modalOrder.quantity}</div>
                <div>
                  <span className="font-semibold">ราคาสินค้า:</span>{' '}
                  <span className="text-blue-700 font-bold">฿{Number(modalOrder.price || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-semibold">ค่าส่ง:</span>{' '}
                  <span className="text-orange-600 font-bold">
                    {modalOrder.shipping_method === 'pickup' 
                      ? 'รับหน้าร้าน' 
                      : (Number(modalOrder.shipping_fee) || 0) > 0 
                        ? `฿${Number(modalOrder.shipping_fee).toLocaleString()}` 
                        : 'ฟรี'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">ราคารวม:</span>{' '}
                  <span className="text-green-600 font-bold text-lg">
                    ฿{(() => {
                      const productPrice = Number(modalOrder.price) || 0;
                      const shippingFee = Number(modalOrder.shipping_fee) || 0;
                      return (productPrice + shippingFee).toLocaleString();
                    })()}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">วิธีการจัดส่ง:</span>{' '}
                  {modalOrder.shipping_method === 'pickup' ? 'รับหน้าร้าน' : 'จัดส่ง'}
                </div>
                {modalOrder.shipping_method === 'delivery' && (
                  <>
                    <div>
                      <span className="font-semibold">ที่อยู่จัดส่ง:</span> {modalOrder.shipping_address || '-'}
                    </div>
                    <div>
                      <span className="font-semibold">เบอร์โทร:</span> {modalOrder.phone || '-'}
                    </div>
                    <div>
                      <span className="font-semibold">รหัสไปรษณีย์:</span> {modalOrder.postal_code || '-'}
                    </div>
                  </>
                )}
                <div><span className="font-semibold">วันที่สั่ง:</span> {formatDateTimeTH(modalOrder.created_at)}</div>

                {modalOrder.details && (
                  <div><span className="font-semibold">รายละเอียดเพิ่มเติม:</span> {modalOrder.details}</div>
                )}

                {modalOrder.files && modalOrder.files.length > 0 && (
                  <div>
                    <span className="font-semibold">ไฟล์แนบ:</span>
                    <ul className="list-disc pl-6 mt-2">
                      {modalOrder.files.map(f => (
                        <li key={f.id}>
                          <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                            {f.filename}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersCustom;
