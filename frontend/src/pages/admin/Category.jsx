import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

function Category() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [form, setForm] = useState({ category_name: '' });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const host = import.meta.env.VITE_HOST;

  useEffect(() => {
    fetch(`${host}/api/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, [host]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = () => {
    setEditCategory(null);
    setForm({ category_name: '' });
    setImageFile(null);
    setPreview(null);
    setShowModal(true);
  };

  const handleEdit = (id) => {
    const category = categories.find((c) => c.category_id === id);
    if (!category) return;
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editCategory) {
      fetch(`${host}/api/categories/${editCategory.category_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
        .then((res) => res.json())
        .then(async (updatedBase) => {
          let updated = updatedBase;
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
            prev.map((a) => (a.category_id === editCategory.category_id ? { ...a, ...form, image_url: updated.image_url } : a))
          );
          setShowModal(false);
          Swal.fire('สำเร็จ', 'แก้ไขหมวดหมู่เรียบร้อยแล้ว', 'success');
        });
    } else {
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
        });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleClearImage = async (id) => {
    const res = await fetch(`${host}/api/categories/${id}/image`, { method: 'DELETE' });
    if (res.ok) {
      const updated = await res.json();
      setCategories((prev) => prev.map((a) => (a.category_id === id ? { ...a, image_url: updated.image_url } : a)));
      Swal.fire('สำเร็จ', 'ลบรูปภาพเรียบร้อยแล้ว', 'success');
    }
  };

  const columns = [
    {
      name: 'ลำดับ',
      width: '70px',
      cell: (row, index) => <span className="font-kanit">{index + 1}</span>,
      center: true,
    },
    { name: 'ชื่อหมวดหมู่', selector: (row) => row.category_name },
    {
      name: 'รูปภาพ',
      cell: (row) =>
        row.image_url ? (
          <img
            src={`${host}/uploads/categories/${row.image_url}`}
            alt="category"
            className="h-12 w-12 object-cover rounded"
          />
        ) : (
          <span className="text-gray-400">-</span>
        ),
      width: '100px',
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row.category_id)}
            className="px-2 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
            title="Edit"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => handleDelete(row.category_id)}
            className="px-2 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <FaTrash />
          </button>
          {row.image_url && (
            <button
              onClick={() => handleClearImage(row.category_id)}
              className="px-2 py-1 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              title="Remove image"
            >
              ลบรูปภาพ
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto mt-8 pl-24 font-kanit">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-kanit">จัดการหมวดหมู่สินค้า</h2>
        <button onClick={handleAdd} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-kanit">
          + เพิ่มหมวดหมู่
        </button>
      </div>
      {categories.length > 0 ? (
        <DataTable columns={columns} data={categories} pagination />
      ) : (
        <p className="text-gray-500 font-kanit">ไม่พบข้อมูล</p>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)}></div>

          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 font-kanit">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold font-kanit">{editCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors font-kanit">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-kanit">ชื่อหมวดหมู่</label>
                  <input
                    name="category_name"
                    value={form.category_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-kanit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-kanit">รูปภาพ (ถ้ามี)</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm" />
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
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors font-kanit"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors font-kanit">
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

