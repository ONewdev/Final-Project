
import Swal from 'sweetalert2';
import React, { useEffect, useState } from 'react';


export default function PaymentCheck() {
  const host = import.meta.env.VITE_HOST;
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Preview payment slip image in a SweetAlert modal
  const handlePreview = (imageName) => {
    if (!imageName) return;
    const url = `${host}/uploads/payments/${imageName}`;
    Swal.fire({
      imageUrl: url,
      imageAlt: 'สลิป',
      showConfirmButton: false,
      showCloseButton: true,
      background: '#000',
      width: 'auto',
      padding: 0,
    });
  };

  useEffect(() => {
    fetch(`${host}/api/payments?status=pending`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error('Response is not valid JSON');
        }
      })
      .then((data) => {
        setPayments(data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        setPayments([]);
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลการโอนเงินได้\n' + err.message, 'error');
        console.error(err);
      });
  }, [host]);

  // ฟังก์ชันอนุมัติการชำระเงิน
const handleApprove = async (paymentId) => {
    const result = await Swal.fire({
      title: 'ยืนยันการอนุมัติ',
      text: 'คุณต้องการอนุมัติการชำระเงินนี้ใช่หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'อนุมัติ',
      cancelButtonText: 'ยกเลิก',
    });
    if (result.isConfirmed) {
      try {
        // อัปเดตสถานะการชำระเงิน
        const res = await fetch(`${host}/api/payments/${paymentId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved' })
        });

        if (res.ok) {
          // สร้างการแจ้งเตือน
          const payment = payments.find(p => p.id === paymentId);
          if (payment) {
            await fetch(`${host}/api/notifications`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customer_id: payment.customer_id,
                type: 'success',
                title: 'ชำระเงินสำเร็จ',
                message: `การชำระเงินของคุณได้รับการอนุมัติแล้ว จำนวน ฿${Number(payment.amount).toLocaleString('th-TH')}`,
              })
            });
          }

          Swal.fire('สำเร็จ', 'อนุมัติการชำระเงินเรียบร้อยแล้ว', 'success');
          setPayments((prev) => prev.filter((p) => p.id !== paymentId));
        } else {
          Swal.fire('ผิดพลาด', 'ไม่สามารถอนุมัติได้', 'error');
        }
      } catch (err) {
        Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดขณะอนุมัติ', 'error');
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">ตรวจสอบการโอนเงิน</h1>
      {loading ? (
        <div>กำลังโหลด...</div>
      ) : payments.length === 0 ? (
        <div className="text-gray-500">ไม่มีรายการโอนเงินที่รอการตรวจสอบ</div>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2">#</th>
              <th className="border px-4 py-2">ลูกค้า</th>
              <th className="border px-4 py-2">ยอดโอน</th>
              <th className="border px-4 py-2">สลิป</th>
              <th className="border px-4 py-2">วันที่โอน</th>
              <th className="border px-4 py-2">สถานะ</th>
              <th className="border px-4 py-2">อนุมัติ</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, idx) => (
              <tr key={payment.id}>
                <td className="border px-4 py-2 text-center">{idx + 1}</td>
                <td className="border px-4 py-2">{payment.customer_name || '-'}</td>
                <td className="border px-4 py-2">{payment.amount !== undefined && payment.amount !== null && !isNaN(Number(payment.amount)) ? `฿${Number(payment.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}</td>
                <td className="border px-4 py-2">
                  {payment.image ? (
                    <div>
                      <button type="button" onClick={() => handlePreview(payment.image)} className="focus:outline-none" title="คลิกเพื่อดูภาพ">
                        <img src={`${host}/uploads/payments/${payment.image}`} alt="สลิป" className="h-12 rounded cursor-zoom-in" />
                      </button>
                      <div className="text-xs text-gray-400 break-all">{payment.image}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="border px-4 py-2">{payment.created_at ? new Date(payment.created_at).toLocaleDateString('th-TH') : '-'}</td>
                <td className="border px-4 py-2">
                  <span className="px-2 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-600">{payment.status === 'pending' ? 'รอตรวจสอบ' : payment.status}</span>
                </td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() => handleApprove(payment.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                  >อนุมัติ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
