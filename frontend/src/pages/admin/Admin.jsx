import React, { useEffect, useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import { FaSearch, FaTimes } from 'react-icons/fa';

function Admin() {
  const [admins, setAdmins] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [form, setForm] = useState({ username: '', password: '' });
  const [query, setQuery] = useState(''); // คำค้นหา
  const host = import.meta.env.VITE_HOST;

  useEffect(() => {
    fetch(`${host}/api/admin`)
      .then(res => res.json())
      .then(data => setAdmins(Array.isArray(data) ? data : []))
      .catch(() => setAdmins([]));
  }, [host]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = () => {
    setEditAdmin(null);
    setForm({ username: '', password: '' });
    setShowModal(true);
  };

  const handleEdit = admin => {
    setEditAdmin(admin);
    setForm({ username: admin.username, password: '' });
    setShowModal(true);
  };

  const handleDelete = id => {
    Swal.fire({
      title: 'ลบแอดมิน?',
      text: 'คุณต้องการลบแอดมินนี้หรือไม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#16a34a',
    }).then(result => {
      if (result.isConfirmed) {
        fetch(`${host}/api/admin/${id}`, { method: 'DELETE' })
          .then(res => res.json())
          .then(() => {
            setAdmins(prev => prev.filter(a => a.id !== id));
            Swal.fire('ลบแล้ว!', '', 'success');
          });
      }
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (editAdmin) {
      // update
      fetch(`${host}/api/admin/${editAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
        .then(res => {
          if (!res.ok) throw new Error('Update failed');
          return res.json();
        })
        .then(() => {
          setAdmins(prev => prev.map(a => (a.id === editAdmin.id ? { ...a, username: form.username } : a)));
          setShowModal(false);
          Swal.fire('สำเร็จ', 'อัปเดตข้อมูลแอดมินแล้ว', 'success');
        })
        .catch(() => Swal.fire('ผิดพลาด', 'ไม่สามารถอัปเดตรหัสผ่านได้', 'error'));
    } else {
      // create
      fetch(`${host}/api/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
        .then(res => {
          if (!res.ok) throw new Error('Create failed');
          return res.json();
        })
        .then(data => {
          setAdmins(prev => [...prev, data]);
          setShowModal(false);
          Swal.fire('สำเร็จ', 'เพิ่มแอดมินแล้ว', 'success');
        })
        .catch(() => Swal.fire('ผิดพลาด', 'ไม่สามารถเพิ่มแอดมินได้', 'error'));
    }
  };

  // ฟิลเตอร์รายการตามคำค้นหา
  const shownAdmins = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(a => String(a.username || '').toLowerCase().includes(q));
  }, [admins, query]);

  return (
    <div className="container mx-auto mt-8 pl-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold">จัดการแอดมิน</h2>

        {/* กล่องค้นหา + ปุ่มเพิ่ม */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Search with icon */}
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อแอดมิน..."
              className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
              aria-label="ค้นหาแอดมิน"
            />
            {/* ปุ่มล้างช่องค้นหาเป็นไอคอน X */}
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
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
            + เพิ่มแอดมิน
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-green-100 text-green-800">
              <th className="py-2 px-4 text-left">ชื่อ</th>
              <th className="py-2 px-4 text-left">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {shownAdmins.length === 0 ? (
              <tr><td colSpan={2} className="text-center py-4 text-gray-500">ไม่มีข้อมูล</td></tr>
            ) : (
              shownAdmins.map(admin => (
                <tr key={admin.id} className="border-b">
                  <td className="py-2 px-4">{admin.username}</td>
                  <td className="py-2 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(admin)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(admin.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editAdmin ? 'แก้ไขแอดมิน' : 'เพิ่มแอดมิน'}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="ปิด"
                title="ปิด"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  type="password"
                  required={!editAdmin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={editAdmin ? 'กรอกหากต้องการเปลี่ยนรหัสผ่าน' : ''}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
