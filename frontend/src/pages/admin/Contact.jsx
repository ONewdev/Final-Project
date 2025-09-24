import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function ContactAdmin() {
  const host = import.meta.env.VITE_HOST;

  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    email: '',
    open_hours: '',
    map_url: '',
    status: 'active'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${host}/api/contact`)
      .then((res) => res.json())
      .then((data) => {
        setFormData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching contact:', err);
        Swal.fire('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้', 'error');
        setIsLoading(false);
      });
  }, [host]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${host}/api/contact`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        Swal.fire('สำเร็จ', 'อัปเดตข้อมูลเรียบร้อยแล้ว', 'success');
      } else {
        Swal.fire('ผิดพลาด', 'ไม่สามารถอัปเดตข้อมูลได้', 'error');
      }
    } catch (err) {
      console.error('Update failed:', err);
      Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดบางอย่าง', 'error');
    }
    setIsSubmitting(false);
  };

  if (isLoading) return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;

  return (
    <div
      style={{ fontFamily: "'Kanit', sans-serif" }}
      className="min-h-screen w-full px-4 md:px-6 lg:px-8 py-10"
    >
      {/* หัวข้อหน้า */}
      <div className="max-w-3xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-green-700 tracking-wide">
          แก้ไขข้อมูลการติดต่อ
        </h1>
        <p className="text-gray-600 mt-2">
          ปรับปรุงที่อยู่ เบอร์โทร อีเมล เวลาเปิดทำการ และลิงก์แผนที่ของร้าน
        </p>
      </div>

      {/* ฟอร์มแบบไม่ใส่กล่อง */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        {/* ที่อยู่ / ชื่อร้าน */}
        <div className="space-y-2">
          <label className="block font-semibold text-gray-800">ที่อยู่ / รายละเอียดร้าน</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition"
            placeholder="ใส่ที่อยู่หรือรายละเอียดร้าน"
          />
        </div>

        {/* เบอร์โทร & อีเมล */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block font-semibold text-gray-800">เบอร์โทร</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition"
              placeholder="0812345678"
            />
          </div>
          <div className="space-y-2">
            <label className="block font-semibold text-gray-800">อีเมล</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition"
              placeholder="you@email.com"
            />
          </div>
        </div>

        {/* เวลาเปิดทำการ */}
        <div className="space-y-2">
          <label className="block font-semibold text-gray-800">เวลาเปิดทำการ</label>
          <input
            type="text"
            name="open_hours"
            value={formData.open_hours}
            onChange={handleChange}
            className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition"
            placeholder="จันทร์ - ศุกร์ เวลา 08.00 - 17.00 น."
          />
        </div>

        {/* ลิงก์แผนที่ */}
        <div className="space-y-2">
          <label className="block font-semibold text-gray-800">ลิงก์แผนที่ (Google Maps)</label>
          <input
            type="url"
            name="map_url"
            value={formData.map_url}
            onChange={handleChange}
            className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition"
            placeholder="https://goo.gl/maps/..."
          />
        </div>

        {/* สถานะ */}
        <div className="space-y-2">
          <label className="block font-semibold text-gray-800">สถานะ</label>
          <select
            name="status"
            value={formData.status || 'active'}
            onChange={handleChange}
            className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition bg-white"
          >
            <option value="active">เปิดทำการ</option>
            <option value="inactive">ปิดทำการ</option>
          </select>
        </div>

        {/* ปุ่มบันทึก */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto px-6 py-3 rounded-md font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 transition"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
        </div>
      </form>
    </div>
  );
}
