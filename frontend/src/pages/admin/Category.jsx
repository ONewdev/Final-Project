import React, { useEffect, useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaTimes, FaSearch, FaEyeSlash, FaEye } from 'react-icons/fa';

function Category() {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [form, setForm] = useState({ category_name: '' });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  // แสดง/ไม่แสดง จะแสดงจากสถานะในฐานข้อมูล
  const host = import.meta.env.VITE_HOST;

  useEffect(() => {
    fetch(`${host}/api/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, [host]);

  // เก็บกวาด preview URL ตอน unmount
  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleStatus = async (row) => {
    const nextStatus = row.status ? 0 : 1;
    try {
      const res = await fetch(`${host}/api/categories/${row.category_id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'อัปเดตสถานะไม่สำเร็จ');
      setCategories((prev) => prev.map((c) => c.category_id === row.category_id ? { ...c, status: data.status } : c));
      Swal.fire('สำเร็จ', 'อัปเดตสถานะเรียบร้อยแล้ว', 'success');
    } catch (e) {
      Swal.fire('ผิดพลาด', e.message || 'อัปเดตสถานะไม่สำเร็จ', 'error');
    }
  };

  const handleAdd = () => {
    // ล้างพรีวิวเดิมถ้ามี
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setEditCategory(null);
    setForm({ category_name: '' });
    setImageFile(null);
    setPreview(null);
    setShowModal(true);
  };

  const handleEdit = (id) => {
    const category = categories.find((c) => c.category_id === id);
    if (!category) return;
    // ล้างพรีวิวเดิมถ้ามี
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setEditCategory(category);
    setForm({ category_name: category.category_name });
    setImageFile(null);
    setPreview(category.image_url ? `${host}/uploads/categories/${category.image_url}` : null);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'ยืนยันการลบหมวดหมู่?',
      text: 'การลบนี้จะทำให้ข้อมูลหมวดหมู่ถูกลบออกถาวร',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน ลบหมวดหมู่',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#16a34a',
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${host}/api/categories/${id}`, { method: 'DELETE' })
          .then((res) => res.json())
          .then(() => {
            setCategories((prev) => prev.filter((a) => a.category_id !== id));
            Swal.fire('ลบสำเร็จ!', '', 'success');
          });
      }
    });
  };

  const handleDeleteSafe = (id) => {
    Swal.fire({
      title: 'ยืนยันการลบหมวดหมู่?'
      , text: 'คุณแน่ใจหรือไม่ที่จะลบรายการนี้'
      , icon: 'warning'
      , showCancelButton: true
      , confirmButtonText: 'ยืนยันการลบ'
      , cancelButtonText: 'ยกเลิก'
      , confirmButtonColor: '#16a34a'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${host}/api/categories/${id}`, { method: 'DELETE' })
          .then(async (res) => {
            let data = null;
            try { data = await res.json(); } catch (_) {}
            if (!res.ok) {
              Swal.fire('ลบไม่สำเร็จ', data?.error || 'ไม่สามารถลบรายการนี้ได้', 'error');
              return;
            }
            setCategories((prev) => prev.filter((a) => a.category_id !== id));
            Swal.fire('ลบสำเร็จ', '', 'success');
          })
          .catch(() => Swal.fire('ลบไม่สำเร็จ', 'เกิดข้อผิดพลาด', 'error'));
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editCategory) {
      // update base fields
      fetch(`${host}/api/categories/${editCategory.category_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
        .then((res) => res.json())
        .then(async (updatedBase) => {
          let updated = updatedBase;
          // upload image if selected
          if (imageFile) {
            const fd = new FormData();
            fd.append('image', imageFile);
            const upRes = await fetch(`${host}/api/categories/${editCategory.category_id}/image`, {
              method: 'POST',
              body: fd,
            });
            if (upRes.ok) updated = await upRes.json();
          }
          setCategories((prev) =>
            prev.map((a) =>
              a.category_id === editCategory.category_id
                ? { ...a, ...form, image_url: updated.image_url }
                : a
            )
          );
          setShowModal(false);
          Swal.fire('สำเร็จ', 'แก้ไขหมวดหมู่เรียบร้อยแล้ว', 'success');
          // ล้าง preview blob ถ้ามี
          if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
          setPreview(null);
          setImageFile(null);
        });
    } else {
      // create
      fetch(`${host}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
        .then((res) => res.json())
        .then(async (created) => {
          let result = created;
          if (imageFile && created?.category_id) {
            const fd = new FormData();
            fd.append('image', imageFile);
            const upRes = await fetch(`${host}/api/categories/${created.category_id}/image`, {
              method: 'POST',
              body: fd,
            });
            if (upRes.ok) result = await upRes.json();
          }
          setCategories((prev) => [...prev, result]);
          setShowModal(false);
          Swal.fire('สำเร็จ', 'เพิ่มหมวดหมู่เรียบร้อยแล้ว', 'success');
          if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
          setPreview(null);
          setImageFile(null);
        });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    // ล้าง URL เดิมก่อนสร้างใหม่
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : (editCategory?.image_url ? `${host}/uploads/categories/${editCategory.image_url}` : null));
  };

  // ฟิลเตอร์ผลลัพธ์จากคำค้นหา
  const shownCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(row => String(row.category_name || '').toLowerCase().includes(q));
  }, [categories, search]);

  return (
    <div className="container mx-auto mt-8 pl-24 font-kanit">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">จัดการหมวดหมู่สินค้า</h2>
        <div className="flex gap-2 items-center">
          {/* กล่องค้นหา (ไอคอนแทนอีโมจิ) */}
          <div className="relative w-64 max-w-xs">
            <FaSearch
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="ค้นหาหมวดหมู่สินค้า..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="ค้นหาหมวดหมู่สินค้า"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="ล้างคำค้นหา"
                title="ล้างคำค้นหา"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            + เพิ่มหมวดหมู่
          </button>
        </div>
      </div>

      {/* ตารางปกติ */}
      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">ลำดับ</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">ชื่อหมวดหมู่</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b w-40">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {shownCategories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              shownCategories.map((row, idx) => (
                <tr key={row.category_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b">{idx + 1}</td>
                  <td className="px-4 py-3 border-b">{row.category_name}</td>
                  <td className="px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded ${(row.status === 0) ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'}`}>
                        {(row.status === 0) ? 'ไม่แสดง' : 'แสดง'}
                      </span>
                      <button
                        onClick={() => toggleStatus(row)}
                        className={`px-2 py-1 border rounded transition-colors ${(row.status === 0) ? 'text-gray-700 border-gray-300 hover:bg-gray-50' : 'text-amber-600 border-amber-300 hover:bg-amber-50'}`}
                        title={(row.status === 0) ? 'แสดง' : 'ไม่แสดง'}
                      >
                        {(row.status === 0) ? <FaEye /> : <FaEyeSlash />}
                      </button>
                      <button
                        onClick={() => handleEdit(row.category_id)}
                        className="px-2 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                        title="แก้ไข"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteSafe(row.category_id)}
                        className="px-2 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                        title="ลบ"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal ฟอร์ม */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => {
              setShowModal(false);
              // ล้าง preview blob ถ้ามี
              if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
              setPreview(null);
              setImageFile(null);
            }}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
                  setPreview(null);
                  setImageFile(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="ปิด"
                title="ปิด"
              >
                <FaTimes />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
            >
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหมวดหมู่</label>
                  <input
                    name="category_name"
                    value={form.category_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพ (ถ้ามี)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm"
                  />
                  {(preview || editCategory?.image_url) && (
                    <div className="mt-2">
                      <img
                        src={preview || `${host}/uploads/categories/${editCategory?.image_url || ''}`}
                        alt="preview"
                        className="h-24 w-24 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 p-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
                    setPreview(null);
                    setImageFile(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Category;
