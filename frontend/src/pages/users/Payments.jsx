import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const host = import.meta.env.VITE_HOST;

function Payments() {
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    fetch(`${host}/api/contact`)
      .then((res) => res.json())
      .then((data) => setContactInfo(data))
      .catch(() => setContactInfo(null));
  }, [host]);

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

  // --- NEW: preview URL สำหรับรูปสลิป ---
  const [previewUrl, setPreviewUrl] = useState(null);

  // เติม amount อัตโนมัติเมื่อได้ orderDetail
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

  // --- NEW: ฟังก์ชันเคลียร์รูป/พรีวิว ---
  const clearImage = () => {
    setForm((prev) => ({ ...prev, image: null }));
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'image') {
      if (files && files.length > 0) {
        const file = files[0];

        // --- NEW: ตรวจสอบชนิดไฟล์และขนาด ---
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxBytes = 8 * 1024 * 1024; // 8MB
        if (!allowedTypes.includes(file.type)) {
          setErrorMsg('รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP เท่านั้น');
          e.target.value = ''; // reset input
          return;
        }
        if (file.size > maxBytes) {
          setErrorMsg('ขนาดไฟล์ใหญ่เกินไป (เกิน 8MB)');
          e.target.value = '';
          return;
        }

        // เคลียร์ URL เก่า (ถ้ามี) แล้วสร้างใหม่
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setErrorMsg('');
        setForm((prev) => ({ ...prev, image: file }));
      } else {
        clearImage();
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // --- NEW: cleanup URL ตอน unmount ---
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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
      if (form.image) formData.append('proof_image', form.image);
      if (form.note) formData.append('note', form.note);

      const res = await fetch(`${host}/api/payments`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const data = await res.json();

      if (res.ok) {
        // Update order status to processing after successful payment
        if (form.order_id) {
          try {
            await fetch(`${host}/api/orders/${form.order_id}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'processing' }),
              credentials: 'include',
            });
          } catch {}
        }
        setSuccessMsg('แจ้งชำระเงินสำเร็จ');
        setTimeout(() => {
          navigate('/users/processing');
        }, 800);
        setForm({
          order_id: '',
          amount: '',
          image: null,
          note: ''
        });
        clearImage();
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
            {contactInfo?.qr_image ? (
              <>
                <img
                  src={contactInfo.qr_image.startsWith('/') ? `${host}${contactInfo.qr_image}` : contactInfo.qr_image}
                  alt="QR Code สำหรับโอนเงิน"
                  className="w-52 h-52 object-contain rounded-lg border border-gray-200 mb-2 mx-auto"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="text-center mt-2">
                  <div className="text-gray-700 font-semibold">
                    {contactInfo.bank_name ? `ธนาคาร: ${contactInfo.bank_name}` : ''}
                  </div>
                  <div className="text-gray-700 font-semibold">
                    {contactInfo.bank_account ? `เลขบัญชี: ${contactInfo.bank_account}` : ''}
                  </div>
                  {contactInfo.account_name && (
                    <div className="text-gray-700 font-semibold">
                      {`ชื่อบัญชี: ${contactInfo.account_name}`}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span className="text-gray-400 text-sm">ยังไม่มี QR Code สำหรับโอนเงิน</span>
            )}
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
            <div className="mt-2 text-right font-semibold text-green-700">
              ยอดรวม: ฿{orderDetail.total_price ? parseFloat(orderDetail.total_price).toLocaleString() : '-'}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              เลขที่ออเดอร์ <span className="text-red-500">*</span>
            </label>
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
            <label className="block text-gray-700 font-semibold mb-2">
              จำนวนเงินที่โอน (บาท) <span className="text-red-500">*</span>
            </label>
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
              placeholder={
                orderDetail && orderDetail.total_price !== undefined && orderDetail.total_price !== null && Number(orderDetail.total_price) > 0
                  ? `฿${Number(orderDetail.total_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                  : 'กรอกจำนวนเงินที่โอน'
              }
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              สลิปการโอนเงิน <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
              required
            />

            {/* --- NEW: กล่องตัวอย่างภาพ --- */}
            {previewUrl && (
              <div className="mt-3 p-3 border border-green-200 rounded-lg bg-green-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">ตัวอย่างสลิปที่จะส่ง</span>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="text-xs px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    ลบรูป
                  </button>
                </div>
                <div className="w-full flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="ตัวอย่างสลิป"
                    className="max-h-72 w-auto object-contain rounded-md shadow-sm border border-green-100"
                    draggable={false}
                  />
                </div>
              </div>
            )}
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
