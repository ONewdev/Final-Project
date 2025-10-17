import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import AddressManager from '../../components/AddressManager';

function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    profile_picture: '',
    phone: '',
    address: ''
  });
  // ลบ state จังหวัด อำเภอ ตำบล
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const host = import.meta.env.VITE_HOST;
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Helpers
  const userId = user?.user_id ?? user?.id;
  const getImageSrc = (p) => (p ? (String(p).startsWith('http') ? p : `${host}${p}`) : '');

  useEffect(() => {
    // Hydrate form
    const getHasId = (u) => !!(u && (u.id || u.user_id));
    let storedUser = null;
    try {
      const raw = localStorage.getItem('user');
      storedUser = raw ? JSON.parse(raw) : null;
    } catch {}

    const source = getHasId(user) ? user : storedUser;
    if (getHasId(source)) {
      setForm({
        name: source.name ?? '',
        email: source.email ?? '',
        profile_picture: source.profile_picture ?? '',
        phone: source.phone ?? '',
        address: source.address ?? ''
      });
      if (!getHasId(user) && getHasId(storedUser)) {
        setUser(storedUser);
      }
    }
  }, [user, setUser]);

  // ลบ useEffect ที่เกี่ยวกับจังหวัด อำเภอ ตำบล

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profile_picture' && files?.length > 0) {
      const file = files[0];
      const allowed = ['image/jpeg', 'image/png', 'image/gif'];
      const maxMB = 5;
      if (!allowed.includes(file.type)) {
        Swal.fire({ icon: 'error', title: 'ชนิดไฟล์ไม่รองรับ', text: 'อัปโหลดได้เฉพาะ JPG, PNG, GIF' });
        return;
      }
      if (file.size > maxMB * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'ไฟล์ใหญ่เกินไป', text: `ขนาดไฟล์ต้องไม่เกิน ${maxMB}MB` });
        return;
      }
      setForm((prev) => ({ ...prev, profile_picture: file }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      Swal.fire({ icon: 'error', title: 'ยังไม่พบผู้ใช้', text: 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง' });
      return;
    }

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const formData = new FormData();
      if (form.name !== user.name) formData.append('name', form.name?.trim());
      if (form.email !== user.email) formData.append('email', form.email?.trim());
      if (form.phone !== user.phone) formData.append('phone', form.phone?.trim());
      if (form.address !== user.address) formData.append('address', form.address?.trim());
      if (form.profile_picture && typeof File !== 'undefined' && form.profile_picture instanceof File) {
        formData.append('profile_picture', form.profile_picture);
      }

      const res = await fetch((import.meta.env.DEV ? `/api/customers/${userId}` : `${host}/api/customers/${userId}`), {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccessMsg('อัปเดตโปรไฟล์สำเร็จ');

        if (data.user) {
          const updatedUser = { ...user, ...data.user };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          window.dispatchEvent(new Event('userChanged'));
          setForm({
            name: data.user.name ?? '',
            email: data.user.email ?? '',
            profile_picture: data.user.profile_picture ?? '',
            phone: data.user.phone ?? '',
            address: data.user.address ?? ''
          });
        }

        Swal.fire({ icon: 'success', title: 'อัปเดตโปรไฟล์สำเร็จ', showConfirmButton: false, timer: 1500 });
      } else {
        const msg = data?.message || 'เกิดข้อผิดพลาด';
        setErrorMsg(msg);
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: data?.message || 'ไม่สามารถอัปเดตโปรไฟล์ได้' });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!userId) {
      Swal.fire({ icon: 'error', title: 'ยังไม่พบผู้ใช้', text: 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง' });
      return;
    }

    const result = await Swal.fire({
      title: 'ลบรูปโปรไฟล์?',
      text: 'คุณต้องการลบรูปโปรไฟล์นี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบรูป',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch((import.meta.env.DEV ? `/api/customers/${userId}/profile-picture` : `${host}/api/customers/${userId}/profile-picture`), {
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'ลบรูปโปรไฟล์สำเร็จ', timer: 1500, showConfirmButton: false });
          const updatedUser = { ...user, profile_picture: null };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setForm((prev) => ({ ...prev, profile_picture: '' }));
        } else {
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: data?.message || 'ไม่สามารถลบรูปโปรไฟล์ได้' });
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Headbar แบบโล่ง */}
      <div className="px-4 sm:px-6 lg:px-8 pt-10 pb-6 border-b">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-green-700">โปรไฟล์ของฉัน</h1>
          <p className="mt-2 text-gray-600">แก้ไขข้อมูลส่วนตัวและที่อยู่ในการจัดส่ง</p>
        </div>
      </div>

      {/* เนื้อหาแบบ section ไม่มีกล่อง/เงา */}
      <div className="px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* รูปโปรไฟล์ */}
          <section className="border-b pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-5">
                {user?.profile_picture ? (
                  <img
                    src={getImageSrc(user.profile_picture)}
                    alt="Current Profile"
                    className="w-28 h-28 rounded-full object-cover cursor-pointer ring-2 ring-green-200 hover:ring-green-400 transition"
                    onClick={() => setIsImageModalOpen(true)}
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">รูปโปรไฟล์</h3>
                  <p className="text-sm text-gray-500 mt-1">คลิกที่รูปเพื่อขยายดู</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {user?.profile_picture && (
                  <button
                    type="button"
                    onClick={handleDeleteProfilePicture}
                    className="px-4 py-2 text-sm rounded-full border border-red-300 text-red-700 hover:bg-red-50 transition"
                  >
                    ลบรูปโปรไฟล์
                  </button>
                )}
                <label className="px-4 py-2 text-sm rounded-full border border-gray-300 hover:bg-gray-50 transition cursor-pointer">
                  อัปโหลดรูปใหม่
                  <input
                    type="file"
                    name="profile_picture"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB</p>
          </section>

          {/* ฟอร์มข้อมูล */}
          <form onSubmit={handleSubmit} className="space-y-10">
            <section className="space-y-6 border-b pb-10">
              <h3 className="text-xl font-semibold">ข้อมูลติดต่อ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full bg-transparent border-b border-gray-300 focus:border-green-600 focus:ring-0 py-2"
                    required
                    placeholder="ชื่อ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full bg-transparent border-b border-gray-300 focus:border-green-600 focus:ring-0 py-2"
                    required
                    placeholder="อีเมล"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full bg-transparent border-b border-gray-300 focus:border-green-600 focus:ring-0 py-2"
                    required
                    placeholder="0xxxxxxxxx"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-transparent border-b border-gray-300 focus:border-green-600 focus:ring-0 py-2 resize-y"
                    placeholder="บ้านเลขที่, ถนน, ตำบล/แขวง"
                  />
                </div>
              </div>
            </section>

            {/* ลบ section ที่อยู่สำหรับจัดส่ง จังหวัด อำเภอ ตำบล รหัสไปรษณีย์ */}

            {(successMsg || errorMsg) && (
              <div className={`${successMsg ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'} px-4 py-3 rounded-lg`}>
                <span className="font-medium">{successMsg || errorMsg}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-7 py-3 rounded-full border border-green-600 text-green-700 hover:bg-green-50 disabled:opacity-50 transition"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    บันทึกการเปลี่ยนแปลง
                  </>
                )}
              </button>
            </div>
          </form>

          <AddressManager userId={userId} host={host} defaultRecipient={form.name} defaultPhone={form.phone} />
        </div>
      </div>

      {/* Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsImageModalOpen(false)} />
          <div className="relative z-10 max-w-lg w-[95%] transform transition-all duration-300 scale-100">
            <div className="relative bg-white rounded-2xl overflow-hidden">
              <div className="absolute right-4 top-4 z-10">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="rounded-full p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-all duration-200"
                  aria-label="ปิด"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-4">รูปโปรไฟล์</h3>
                <div className="relative group">
                  <div className="overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={getImageSrc(user?.profile_picture ?? '')}
                      alt="Profile Preview"
                      className="max-h-[70vh] w-full object-contain transform transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;




