import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';

const initialFormState = {
  id: null,
  name: '',
  address: '',
  phone: '',
  email: '',
  open_hours: '',
  map_url: '',
  logo: '',
  qr_image: '',
  bank_account: '',
  bank_name: '',
  account_name: '',
  status: 'active',
};

export default function ContactAdmin() {
  const host = import.meta.env.VITE_HOST || '';

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const qrImageSrc = useMemo(() => {
    if (qrPreview) return qrPreview;
    if (!formData.qr_image) return '';
    if (formData.qr_image.startsWith('/')) {
      return `${host}${formData.qr_image}`;
    }
    return formData.qr_image;
  }, [qrPreview, formData.qr_image, host]);

  const logoImageSrc = useMemo(() => {
    if (logoPreview) return logoPreview;
    if (!formData.logo) return '';
    if (formData.logo.startsWith('/')) {
      return `${host}${formData.logo}`;
    }
    return formData.logo;
  }, [logoPreview, formData.logo, host]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQrFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setQrFile(file);
    if (!file) {
      setQrPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return '';
      });
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setQrPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return nextUrl;
    });
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (!file) {
      setLogoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return '';
      });
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return nextUrl;
    });
  };

  const validate = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push('กรุณากรอกชื่อร้าน');
    if (!formData.phone.trim()) errors.push('กรุณาระบุหมายเลขโทรศัพท์');
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('รูปแบบอีเมลไม่ถูกต้อง');
    }
    if (formData.map_url && !/^https?:\/\//i.test(formData.map_url)) {
      errors.push('ลิงก์แผนที่ต้องขึ้นต้นด้วย http:// หรือ https://');
    }
    if (formData.logo && !/^https?:\/\//i.test(formData.logo)) {
      errors.push('ลิงก์โลโก้ต้องขึ้นต้นด้วย http:// หรือ https://');
    }
    if (
      !qrFile &&
      formData.qr_image &&
      !/^https?:\/\//i.test(formData.qr_image) &&
      !formData.qr_image.startsWith('/')
    ) {
      errors.push('ลิงก์รูป QR ต้องขึ้นต้นด้วย http:// หรือ https://');
    }

    if (errors.length) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาตรวจสอบแบบฟอร์ม',
        html: errors.join('<br/>'),
      });
      return false;
    }
    return true;
  };

  const fetchContact = useCallback(
    async (withLoader = false) => {
      if (withLoader) {
        setIsLoading(true);
      }
      try {
        const res = await fetch(`${host}/api/contact`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const obj = Array.isArray(data) ? (data[0] || {}) : (data?.data || data || {});

        setFormData({
          id: obj.id ?? null,
          name: obj.name ?? '',
          address: obj.address ?? '',
          phone: obj.tel ?? obj.phone ?? '',
          email: obj.gmail ?? obj.email ?? '',
          open_hours: obj.time ?? obj.open_hours ?? '',
          map_url: obj.map ?? obj.map_url ?? '',
          logo: obj.logo ?? '',
          qr_image: obj.qr_image ?? '',
          bank_account: obj.bank_account ?? '',
          bank_name: obj.bank_name ?? '',
          account_name: obj.account_name ?? '',
          status:
            obj.status === 'inactive' || obj.status === 0 || obj.status === '0'
              ? 'inactive'
              : 'active',
        });

        setQrFile(null);
        setQrPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return '';
        });
      } catch (error) {
        console.error('ไม่สามารถโหลดข้อมูลการติดต่อ:', error);
      } finally {
        if (withLoader) {
          setIsLoading(false);
        }
      }
    },
    [host]
  );

  useEffect(() => {
    fetchContact(true);
  }, [fetchContact]);

  useEffect(
    () => () => {
      if (qrPreview) URL.revokeObjectURL(qrPreview);
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    },
    [qrPreview, logoPreview]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        tel: formData.phone,
        gmail: formData.email,
        time: formData.open_hours,
        map: formData.map_url,
        logo: formData.logo,
        qr_image: formData.qr_image,
        bank_account: formData.bank_account,
        bank_name: formData.bank_name,
        account_name: formData.account_name,
        status: formData.status,
      };

      let url = `${host}/api/contact`;
      let method = 'POST';
      if (formData.id) {
        url = `${host}/api/contact/${formData.id}`;
        method = 'PUT';
      }

      const body = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        // logo จะถูกแทนที่ด้วยไฟล์ ถ้ามี
        if (key === 'logo') return;
        // qr_image จะถูกแทนที่ด้วยไฟล์ ถ้ามี
        if (key === 'qr_image') return;
        body.append(key, value ?? '');
      });
      if (logoFile) {
        body.append('logo_file', logoFile);
      } else {
        body.append('logo', formData.logo ?? '');
      }
      if (qrFile) {
        body.append('qr_image_file', qrFile);
      }

      const res = await fetch(url, {
        method,
        body,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const saved = await res.json();
      const id = saved?.id ?? saved?.data?.id ?? formData.id ?? null;
      setFormData((prev) => ({ ...prev, id }));

      await fetchContact();

      Swal.fire({
        icon: 'success',
        title: 'บันทึกข้อมูลการติดต่อเรียบร้อย',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('บันทึกไม่สำเร็จ:', error);
      Swal.fire({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: error.message || 'ไม่สามารถบันทึกข้อมูลได้ในขณะนี้',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-5 text-gray-600">กำลังโหลดข้อมูลการติดต่อ...</div>;
  }

  return (
    <div
      className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8"
      style={{ fontFamily: "'Kanit', sans-serif" }}
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-6">จัดการข้อมูลการติดต่อ</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ชื่อร้าน */}
        <div className="space-y-2">
          <label className="block font-semibold text-gray-800" htmlFor="name">
            ชื่อร้าน <span className="text-red-600">*</span>
          </label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition"
            placeholder="กรอกชื่อร้าน"
          />
        </div>

        {/* ที่อยู่ */}
        <div className="space-y-2">
          <label className="block font-semibold text-gray-800" htmlFor="address">
            ที่อยู่
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition"
            placeholder="กรอกที่อยู่ร้าน"
          />
        </div>

        {/* โทรศัพท์ + อีเมล */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block font-semibold text-gray-800" htmlFor="phone">
              เบอร์โทรศัพท์ <span className="text-red-600">*</span>
            </label>
            <input
              id="phone"
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition"
              placeholder="0X-XXX-XXXX"
            />
          </div>
          <div className="space-y-2">
            <label className="block font-semibold text-gray-800" htmlFor="email">
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition"
              placeholder="name@example.com"
            />
          </div>
        </div>

        {/* เวลาเปิดทำการ */}
        <div className="space-y-2">
          <label className="block font-semibold text-gray-800" htmlFor="open_hours">
            เวลาเปิดทำการ
          </label>
          <input
            id="open_hours"
            type="text"
            name="open_hours"
            value={formData.open_hours}
            onChange={handleChange}
            className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition"
            placeholder="08:00 - 17:00"
          />
        </div>

        {/* ลิงก์แผนที่ */}
        <div className="space-y-2">
          <label className="block font-semibold text-gray-800" htmlFor="map_url">
            ลิงก์แผนที่ (Google Maps)
          </label>
          <input
            id="map_url"
            type="url"
            name="map_url"
            value={formData.map_url}
            onChange={handleChange}
            className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition"
            placeholder="https://goo.gl/maps/..."
          />
        </div>

        {/* โลโก้ */}
        <div className="space-y-2">
          <label className="block font-semibold text-gray-800">โลโก้ร้าน</label>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-32 h-32 border border-dashed border-gray-300 rounded-md flex items-center justify-center overflow-hidden bg-gray-50">
              {logoImageSrc ? (
                <img src={logoImageSrc} alt="โลโก้ร้าน" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400 text-center px-2">ยังไม่ได้เลือกรูป</span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                type="file"
                name="logo_file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
          </div>
        </div>

        {/* คิวอาร์โค้ด */}
        <div className="space-y-2">
          <label className="block font-semibold text-gray-800">รูปคิวอาร์โค้ด (สำหรับชำระเงิน)</label>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-32 h-32 border border-dashed border-gray-300 rounded-md flex items-center justify-center overflow-hidden bg-gray-50">
              {qrImageSrc ? (
                <img src={qrImageSrc} alt="ตัวอย่างรูป QR" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400 text-center px-2">ยังไม่ได้เลือกรูป</span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                type="file"
                name="qr_image_file"
                accept="image/*"
                onChange={handleQrFileChange}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
          </div>
        </div>

        {/* บัญชีธนาคาร */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block font-semibold text-gray-800" htmlFor="bank_account">
              หมายเลขบัญชี
            </label>
            <input
              id="bank_account"
              type="text"
              name="bank_account"
              value={formData.bank_account}
              onChange={handleChange}
              className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition"
              placeholder="กรอกเลขบัญชี"
            />
          </div>
          <div className="space-y-2">
            <label className="block font-semibold text-gray-800" htmlFor="bank_name">
              ธนาคาร
            </label>
            <input
              id="bank_name"
              type="text"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition"
              placeholder="เช่น กสิกรไทย, ไทยพาณิชย์"
            />
          </div>
          <div className="space-y-2">
            <label className="block font-semibold text-gray-800" htmlFor="account_name">
              ชื่อบัญชี
            </label>
            <input
              id="account_name"
              type="text"
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition"
              placeholder="ชื่อเจ้าของบัญชี"
            />
          </div>
        </div>

        {/* สถานะการแสดงผล */}
        <div className="space-y-2">
          <label className="block font-semibold text-gray-800" htmlFor="status">
            สถานะ
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-md px-4 py-3 outline-none transition bg-white"
          >
            <option value="active">แสดง</option>
            <option value="inactive">ซ่อน</option>
          </select>
        </div>

        {/* ปุ่มบันทึก */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto px-6 py-3 rounded-md font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 transition"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลการติดต่อ'}
          </button>
        </div>

        {/* หมายเหตุช่องจำเป็น */}
        <p className="text-sm text-gray-500">เครื่องหมาย <span className="text-red-600">*</span> คือช่องที่จำเป็นต้องกรอก</p>
      </form>
    </div>
  );
}
