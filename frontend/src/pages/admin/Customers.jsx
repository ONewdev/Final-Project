import React, { useEffect, useMemo, useState } from 'react';
import DataTable from 'react-data-table-component';
import Swal from 'sweetalert2';
import { FaCheck, FaBan, FaTrash } from 'react-icons/fa';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const host = import.meta.env.VITE_HOST || '';

  useEffect(() => {
    fetch(`${host}/api/customers`)
      .then((res) => res.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : (data?.data ?? [])))
      .catch((err) => console.error('Fetch error:', err));
  }, [host]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  const handleStatusChange = (id, status) => {
    const statusText = status === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
    const customer = customers.find((c) => c.id === id);

    Swal.fire({
      title: 'ยืนยันการเปลี่ยนแปลงสถานะ',
      text: `คุณต้องการ${statusText} ${customer?.name || 'ลูกค้า'} หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ใช่, เปลี่ยนแปลง',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${host}/api/customers/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
          .then((res) => res.json())
          .then(() => {
            setCustomers((prev) =>
              prev.map((c) => (c.id === id ? { ...c, status } : c))
            );
            Swal.fire('สำเร็จ!', `สถานะของ ${customer?.name || 'ลูกค้า'} ถูก${statusText}แล้ว`, 'success');
          })
          .catch((err) => {
            console.error('Status change error:', err);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเปลี่ยนแปลงสถานะได้', 'error');
          });
      }
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: 'คุณต้องการลบลูกค้ารายนี้หรือไม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${host}/api/customers/${id}`, { method: 'DELETE' })
          .then((res) => res.json())
          .then(() => {
            setCustomers((prev) => prev.filter((c) => c.id !== id));
            Swal.fire('ลบแล้ว!', 'ลูกค้าถูกลบเรียบร้อยแล้ว', 'success');
          })
          .catch(() => {
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบลูกค้าได้', 'error');
          });
      }
    });
  };

  const columns = [
    { name: 'Email', selector: (row) => row.email ?? '-' },
    { name: 'Name', selector: (row) => row.name ?? '-' },
    {
      name: 'Status',
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {row.status === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
        </span>
      ),
    },
    {
      name: 'Profile Picture',
      cell: (row) =>
        row.profile_picture ? (
          <img
            src={`${host}${row.profile_picture}`}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          'N/A'
        ),
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          {row.status === 'active' ? (
            <button
              onClick={() => handleStatusChange(row.id, 'inactive')}
              className="px-2 py-1 text-yellow-600 border border-yellow-300 rounded hover:bg-yellow-50"
              title="ปิดใช้งาน"
            >
              <FaBan />
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange(row.id, 'active')}
              className="px-2 py-1 text-green-600 border border-green-300 rounded hover:bg-green-50"
              title="เปิดใช้งาน"
            >
              <FaCheck />
            </button>
          )}
          <button
            onClick={() => handleDelete(row.id)}
            className="px-2 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50"
            title="ลบ"
          >
            <FaTrash />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto mt-8 pl-24">
      {/* Header + Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold">รายชื่อสมาชิก</h2>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อหรืออีเมลลูกค้า…"
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 select-none">🔍</span>

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="ล้างคำค้น"
              title="ล้างคำค้น"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {customers.length > 0 ? (
        filteredCustomers.length > 0 ? (
          <DataTable columns={columns} data={filteredCustomers} pagination />
        ) : (
          <p className="text-gray-500">ไม่พบผลลัพธ์ที่ตรงกับคำค้นหา</p>
        )
      ) : (
        <p className="text-gray-500">ไม่มีข้อมูล</p>
      )}
    </div>
  );
}

export default Customers;
