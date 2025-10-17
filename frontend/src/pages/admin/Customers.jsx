import React, { useEffect, useMemo, useState } from 'react';
import DataTable from 'react-data-table-component';
import { FaSearch, FaTimes } from 'react-icons/fa';


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

  const columns = [
    { name: 'ลำดับ', cell: (_row, index) => index + 1, width: '80px' },
    { name: 'อีเมล', selector: (row) => row.email ?? '-' },
    { name: 'ชื่อ', selector: (row) => row.name ?? '-' },
    {
      name: 'เวลา',
      selector: (row) =>
        row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : '-',
      sortable: true,
    },
    {
      name: 'รูปโปรไฟล์',
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

