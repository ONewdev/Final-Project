import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const host = import.meta.env.VITE_HOST || '';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// 👉 แมปสถานะ → ภาษาไทย
const STATUS_TH = {
  draft: 'ร่าง',
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติ',
  rejected: 'ไม่อนุมัติ',
  waiting_payment: 'รอชำระเงิน',
  paid: 'ชำระเงินแล้ว',
  in_production: 'กำลังผลิต',
  delivering: 'กำลังจัดส่ง',
  finished: 'เสร็จสิ้น',
  canceled: 'ยกเลิก',
};
// ใช้ฟังก์ชันนี้ตอนแสดงผล
function tStatus(s) {
  if (!s) return '-';
  return STATUS_TH[s] || s; // ถ้าไม่รู้จัก ให้แสดงค่าเดิมกันพัง
}

function CustomOrderPayment() {
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    fetch(`${host}/api/contact`)
      .then((res) => res.json())
      .then((data) => setContactInfo(data))
      .catch(() => setContactInfo(null));
  }, []); // host เป็นค่าคงที่อยู่แล้ว ตัดออกจาก deps ได้

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

  // พรีวิวสลิป
  const [previewUrl, setPreviewUrl] = useState(null);

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

  const clearFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleFileChange = e => {
    const f = e.target.files?.[0];
    if (!f) {
      clearFile();
      return;
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxBytes = 8 * 1024 * 1024; // 8MB
    if (!allowed.includes(f.type)) {
      setError('รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP เท่านั้น');
      e.target.value = '';
      return;
    }
    if (f.size > maxBytes) {
      setError('ขนาดไฟล์ใหญ่เกินไป (เกิน 8MB)');
      e.target.value = '';
      return;
    }
    setError('');
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file) return;
    if (!user) {
      setError('กรุณาเข้าสู่ระบบก่อนชำระเงิน');
      return;
    }
    setUploading(true);
    setError('');
    const formData = new FormData();
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
        <h2 className="text-2xl font-bold mb-4 text-green-700">
          อัปโหลดสลิปชำระเงิน ใบสั่งทำ #{order.id}
        </h2>

        <div className="mb-4">
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
            <span className="text-gray-400 text-sm block mb-4 mx-auto text-center">
              ยังไม่มี QR Code สำหรับโอนเงิน
            </span>
          )}

          <div><span className="font-semibold">ประเภท:</span> {order.product_type}</div>
          <div><span className="font-semibold">ขนาด:</span> {order.width}x{order.height} {order.unit}</div>
          <div><span className="font-semibold">สี:</span> {order.color}</div>
          <div><span className="font-semibold">จำนวน:</span> {order.quantity}</div>
          <div><span className="font-semibold">ยอดชำระ:</span> ฿{Number(order.price || 0).toLocaleString()}</div>

          {/* ✅ แสดงสถานะเป็นภาษาไทย */}
          <div>
            <span className="font-semibold">สถานะ:</span> {tStatus(order.status)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-2">เลือกรูปสลิปชำระเงิน</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              className="border rounded px-3 py-2 w-full"
            />

            {previewUrl && (
              <div className="mt-3 p-3 border border-green-200 rounded-lg bg-green-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">ตัวอย่างสลิปที่จะส่ง</span>
                  <button
                    type="button"
                    onClick={clearFile}
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

          <button
            type="submit"
            disabled={uploading || !file}
            className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {uploading ? 'กำลังอัปโหลด...' : 'ยืนยันการชำระเงิน'}
          </button>

          {success && (
            <div className="text-green-600 font-semibold mt-2">
              ส่งสลิปเรียบร้อย กำลังพากลับไปหน้ารายการ...
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default CustomOrderPayment;
