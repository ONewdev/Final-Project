import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const host = import.meta.env.VITE_HOST;

function Payments() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const orderIdFromQuery = queryParams.get('order_id');
  const [form, setForm] = useState({
    order_id: orderIdFromQuery || '',
    amount: '',
    image: null,
    note: ''
  });
  const [orderDetail, setOrderDetail] = useState(null);

  // เมื่อ orderDetail เปลี่ยน ให้เติม amount อัตโนมัติ
  useEffect(() => {
    if (orderDetail && orderDetail.total_price !== undefined && orderDetail.total_price !== null) {
      setForm((prev) => ({ ...prev, amount: String(orderDetail.total_price) }));
    }
  }, [orderDetail]);
  // ดึงข้อมูล order ถ้ามี order_id ใน query
  useEffect(() => {
    if (orderIdFromQuery) {
      fetch(`${host}/api/orders/${orderIdFromQuery}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setOrderDetail(data))
        .catch(() => setOrderDetail(null));
    }
  }, [orderIdFromQuery, host]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // ดึง customer_id จาก localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image' && files.length > 0) {
      setForm((prev) => ({ ...prev, image: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('customer_id', user.id);
      formData.append('order_id', form.order_id);
      formData.append('amount', form.amount);
      if (form.image) {
        formData.append('proof_image', form.image);
      }
      // หมายเหตุ (ถ้ามี) - ไม่บังคับ
      if (form.note) {
        formData.append('note', form.note);
      }

      const res = await fetch(`${host}/api/payments`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        // Update order status to shipped after successful payment
        if (form.order_id) {
          try {
            await fetch(`${host}/api/orders/${form.order_id}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'shipped' }),
              credentials: 'include',
            });
          } catch {}
        }
        setSuccessMsg('แจ้งชำระเงินสำเร็จ');
        setTimeout(() => {
          navigate('/users/shipped');
        }, 800);
        setForm({
          order_id: '',
          amount: '',
          image: null,
          note: ''
        });
      } else {
        setErrorMsg(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white py-10 px-2">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-green-100">
        <h2 className="text-3xl font-bold mb-8 text-green-700 text-center tracking-tight">แจ้งชำระเงิน</h2>
        {/* QR Code สำหรับโอนเงิน */}
        <div className="mb-8 flex flex-col items-center">
          <div className="bg-gray-100 rounded-xl p-4 shadow-sm mb-2">
            <img
              src='/images/qr-payment.png'
              alt="QR Code สำหรับโอนเงิน"
              className="w-52 h-52 object-contain rounded-lg border border-gray-200"
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>
          <div className="text-gray-500 text-sm">สแกนเพื่อโอนเงินผ่าน Mobile Banking</div>
        </div>
        {/* แสดงรายละเอียด order ถ้ามี */}
        {orderDetail && (
          <div className="mb-8 p-5 bg-green-50 rounded-xl border border-green-100">
            <div className="font-semibold mb-3 text-green-700 text-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" /></svg>
              รายละเอียดคำสั่งซื้อ
            </div>
            {orderDetail.items && orderDetail.items.length > 0 ? (
              <ul className="mb-2 divide-y divide-green-100">
                {orderDetail.items.map((item, idx) => (
                  <li key={item.id || idx} className="py-2 flex justify-between items-center">
                    <span className="font-medium text-gray-800">{item.product_name}</span>
                    <span className="text-gray-500">x {item.quantity}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-400">ไม่พบรายการสินค้าในออเดอร์นี้</div>
            )}
            <div className="mt-2 text-right font-semibold text-green-700">ยอดรวม: ฿{orderDetail.total_price ? parseFloat(orderDetail.total_price).toLocaleString() : '-'}</div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">เลขที่ออเดอร์ <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="order_id"
              value={form.order_id}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 placeholder:text-gray-400 text-lg"
              required
              placeholder="กรอกเลขที่ออเดอร์"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">จำนวนเงินที่โอน (บาท) <span className="text-red-500">*</span></label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 placeholder:text-gray-400 text-lg"
              required
              min="0"
              step="0.01"
              readOnly={!!orderDetail && (orderDetail.total_price !== undefined && orderDetail.total_price !== null && Number(orderDetail.total_price) > 0)}
              placeholder={orderDetail && orderDetail.total_price !== undefined && orderDetail.total_price !== null && Number(orderDetail.total_price) > 0 ? `฿${Number(orderDetail.total_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : 'กรอกจำนวนเงินที่โอน'}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">สลิปการโอนเงิน <span className="text-red-500">*</span></label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">หมายเหตุ (ถ้ามี)</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 placeholder:text-gray-400 text-lg"
              rows={2}
              placeholder="รายละเอียดเพิ่มเติมหรือหมายเหตุ"
            />
          </div>
          {successMsg && <div className="text-green-600 text-center font-semibold text-lg">{successMsg}</div>}
          {errorMsg && <div className="text-red-600 text-center font-semibold text-lg">{errorMsg}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg shadow-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition text-lg"
          >
            {loading ? 'กำลังส่งข้อมูล...' : 'แจ้งชำระเงิน'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Payments;
