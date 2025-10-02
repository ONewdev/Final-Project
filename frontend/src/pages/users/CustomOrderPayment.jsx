import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const host = import.meta.env.VITE_HOST || '';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function CustomOrderPayment() {
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    fetch(`${host}/api/contact`)
      .then((res) => res.json())
      .then((data) => setContactInfo(data))
      .catch(() => setContactInfo(null));
  }, [host]);
  const { id: paramId } = useParams();
  const query = useQuery();
  const navigate = useNavigate();
  const id = paramId || query.get('order_id');
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('ไม่พบคำสั่งซื้อสั่งทำ');
      setLoading(false);
      return;
    }
    fetch(`${host}/api/custom-orders/orders/${id}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        setError('โหลดข้อมูลไม่สำเร็จ');
        setLoading(false);
      });
  }, [id]);

  const handleFileChange = e => {
    setFile(e.target.files[0] || null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file) return;
    if (!user) {
      setError('กรุณาเข้าสู่ระบบก่อนชำระเงิน');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    // backend expects 'image', also needs amount and customer_id
    formData.append('image', file);
    formData.append('amount', String(order?.price || ''));
    formData.append('customer_id', String(user.id));
    try {
      const res = await fetch(`${host}/api/custom-orders/orders/${id}/payments`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/users/orderscustom'), 2000);
      } else {
        setError('อัปโหลดสลิปไม่สำเร็จ');
      }
    } catch {
      setError('เกิดข้อผิดพลาดระหว่างส่งข้อมูล');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">กำลังโหลด...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!order) return null;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="max-w-xl w-full p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 text-green-700">อัปโหลดสลิปชำระเงิน ใบสั่งทำ #{order.id}</h2>
        <div className="mb-4">
          {contactInfo?.qr_image ? (
            <img
              src={contactInfo.qr_image.startsWith('/') ? `${host}${contactInfo.qr_image}` : contactInfo.qr_image}
              alt="QR Code สำหรับโอนเงิน"
              className="w-52 h-52 object-contain rounded-lg border border-gray-200 mb-4 mx-auto"
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <span className="text-gray-400 text-sm block mb-4 mx-auto text-center">ยังไม่มี QR Code สำหรับโอนเงิน</span>
          )}
          <div><span className="font-semibold">ประเภท:</span> {order.product_type}</div>
          <div><span className="font-semibold">ขนาด:</span> {order.width}x{order.height} {order.unit}</div>
          <div><span className="font-semibold">สี:</span> {order.color}</div>
          <div><span className="font-semibold">จำนวน:</span> {order.quantity}</div>
          <div><span className="font-semibold">ยอดชำระ:</span> ฿{Number(order.price || 0).toLocaleString()}</div>
          <div><span className="font-semibold">สถานะ:</span> {order.status}</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-2">เลือกรูปสลิปชำระเงิน</label>
            <input type="file" accept="image/*" onChange={handleFileChange} required className="border rounded px-3 py-2" />
          </div>
          <button type="submit" disabled={uploading || !file} className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50">
            {uploading ? 'กำลังอัปโหลด...' : 'ยืนยันการชำระเงิน'}
          </button>
          {success && <div className="text-green-600 font-semibold mt-2">ส่งสลิปเรียบร้อย กำลังพากลับไปหน้ารายการ...</div>}
        </form>
      </div>
    </div>
  );
}

export default CustomOrderPayment;

