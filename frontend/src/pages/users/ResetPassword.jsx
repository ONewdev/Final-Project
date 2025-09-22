import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const host = import.meta.env.VITE_HOST; // backend base URL, e.g. http://localhost:3001

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // basic guard
    if (!token || !email) {
      setChecking(false);
      setValid(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${host}/api/customers/verify-reset-token?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
        setValid(res.ok);
      } catch (_) {
        setValid(false);
      } finally {
        setChecking(false);
      }
    };
    verify();
  }, [token, email, host]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!password || password.length < 6) {
      Swal.fire({ icon: 'warning', title: 'รหัสผ่านสั้นเกินไป', text: 'กรุณาตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร' });
      return;
    }
    if (password !== confirm) {
      Swal.fire({ icon: 'warning', title: 'รหัสผ่านไม่ตรงกัน', text: 'โปรดยืนยันรหัสผ่านให้ตรงกัน' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${host}/api/customers/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, newPassword: password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');

      await Swal.fire({ icon: 'success', title: 'เปลี่ยนรหัสผ่านสำเร็จ', timer: 1200, showConfirmButton: false });
      navigate('/login');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้' });
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">กำลังตรวจสอบลิงก์...</div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">ลิงก์ไม่ถูกต้องหรือหมดอายุ</h2>
          <p className="text-gray-600 mb-4">โปรดขออีเมลรีเซ็ตรหัสผ่านใหม่อีกครั้ง</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
          >กลับไปหน้าเข้าสู่ระบบ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">ตั้งรหัสผ่านใหม่</h1>
        <p className="text-gray-500 mb-6">อีเมล: {email}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">รหัสผ่านใหม่</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-emerald-500"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="พิมพ์รหัสผ่านซ้ำ"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
          >{submitting ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}</button>
        </form>
      </div>
    </div>
  );
}

