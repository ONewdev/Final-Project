import React, { useEffect, useMemo, useState } from 'react';
import DataTable from 'react-data-table-component';
import { FaSearch, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';

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

  // ยืนยันและสลับสถานะด้วย SweetAlert2
  const toggleStatusSwal = async (row) => {
    const next = row.status === 'active' ? 'inactive' : 'active';
    const nextLabel = next === 'active' ? 'ใช้งาน' : 'ปิดใช้งาน';

    const { isConfirmed } = await Swal.fire({
      title: 'ยืนยันการเปลี่ยนสถานะ?',
      html: `ต้องการเปลี่ยนเป็น <b>${nextLabel}</b> สำหรับ<br/><small>${row.name || row.email}</small>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      focusCancel: true,
    });
    if (!isConfirmed) return;

    try {
      Swal.fire({
        title: 'กำลังบันทึก...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch(`${host}/api/customers/${row.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setCustomers((prev) => prev.map((c) => (c.id === row.id ? { ...c, status: next } : c)));
      Swal.fire({ title: 'สำเร็จ', text: 'อัปเดตสถานะเรียบร้อย', icon: 'success', timer: 1200, showConfirmButton: false });
    } catch (e) {
      console.error('Toggle status error:', e);
      Swal.fire({ title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้', icon: 'error' });
    }
  };

  // กรองตามคำค้น
  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  // คอลัมน์หลัก (ภาษาไทย)
  const columns = [
    { name: 'ลำดับ', cell: (_row, index) => index + 1, width: '80px' },
    { name: 'อีเมล', selector: (row) => row.email ?? '-' },
    { name: 'ชื่อ', selector: (row) => row.name ?? '-' },
    {
      name: 'วันที่สร้าง',
      selector: (row) => (row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : '-'),
      sortable: true,
      width: '180px',
    },
    {
      name: 'รูปโปรไฟล์',
      cell: (row) =>
        row.profile_picture ? (
          <img
            src={`${host}${row.profile_picture}`}
            alt="รูปโปรไฟล์"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          'N/A'
        ),
      width: '140px',
    },
  ];

  const columnsWithActions = [
    ...columns,
    {
      name: 'สถานะ',
      cell: (row) => {
        const isActive = row.status === 'active';
        const label = isActive ? 'ใช้งาน' : 'ปิดใช้งาน';
        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {label}
          </span>
        );
      },
      width: '120px',
    },
    {
      name: 'การจัดการ',
      cell: (row) => {
        const isActive = row.status === 'active';
        return (
          <button
            type="button"
            onClick={() => toggleStatusSwal(row)}
            className={`px-3 py-1 rounded border text-sm hover:opacity-90 ${
              isActive ? 'bg-red-50 text-red-700 border-red-300' : 'bg-green-50 text-green-700 border-green-300'
            }`}
            title={isActive ? 'ระงับสิทธิ์ผู้ใช้งาน' : 'เปิดสิทธิ์ผู้ใช้งาน'}
          >
            {isActive ? 'ระงับ' : 'เปิด'}
          </button>
        );
      },
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '140px',
    },
  ];

  return (
    <div className="container mx-auto mt-8 pl-24">
      {/* หัวข้อ + ค้นหา */}
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
            aria-label="กล่องค้นหา"
          />
          <FaSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            size={16}
            aria-hidden="true"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="ล้างคำค้น"
              title="ล้างคำค้น"
            >
              <FaTimes size={16} />
            </button>
          )}
        </div>
      </div>

      {customers.length > 0 ? (
        filteredCustomers.length > 0 ? (
          <DataTable columns={columnsWithActions} data={filteredCustomers} pagination />
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
