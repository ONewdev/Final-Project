 import React, { useEffect, useMemo, useState } from 'react';
import DataTable from 'react-data-table-component';

export default function Inbox() {
  const host = import.meta.env.VITE_HOST || '';
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${host}/api/inbox`);
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : (data?.data ?? []));
      } catch (err) {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [host]);

  const filteredMessages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) =>
      (m.name ?? '').toLowerCase().includes(q) ||
      (m.email ?? '').toLowerCase().includes(q) ||
      (m.phone ?? '').toLowerCase().includes(q) ||
      (m.subject ?? '').toLowerCase().includes(q) ||
      (m.message ?? '').toLowerCase().includes(q)
    );
  }, [messages, search]);

  const columns = [
    { name: 'ชื่อผู้ติดต่อ', selector: (row) => row.name ?? '-' },
    { name: 'อีเมล', selector: (row) => row.email ?? '-' },
    { name: 'เบอร์โทร', selector: (row) => row.phone ?? '-' },
    { name: 'หัวข้อ', selector: (row) => row.subject ?? '-' },
    {
      name: 'ข้อความ',
      cell: (row) => (
        <div title={row.message ?? ''} className="max-w-xs truncate">
          {row.message ?? '-'}
        </div>
      ),
    },
    {
      name: 'ส่งเมื่อ',
      selector: (row) => {
        try {
          return row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : '-';
        } catch {
          return row.created_at ?? '-';
        }
      },
    },
  ];

  // ตัวเลือกภาษาไทยสำหรับเพจเนชัน (ของ react-data-table-component)
  const paginationTH = {
    rowsPerPageText: 'แถวต่อหน้า',
    rangeSeparatorText: 'จาก',
    selectAllRowsItem: true,
    selectAllRowsItemText: 'ทั้งหมด',
  };

  return (
    <div className="container mx-auto mt-8 pl-24">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold">กล่องข้อความ</h2>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา: ชื่อ, อีเมล, เบอร์โทร, หัวข้อ, ข้อความ"
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="ค้นหาข้อความ"
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

      {loading ? (
        <p className="text-gray-500">กำลังโหลดข้อความ...</p>
      ) : messages.length === 0 ? (
        <p className="text-gray-500">ยังไม่มีข้อความ</p>
      ) : filteredMessages.length === 0 ? (
        <p className="text-gray-500">ไม่พบผลลัพธ์ที่ตรงกับการค้นหา</p>
      ) : (
        <DataTable
          columns={columns}
          data={filteredMessages}
          pagination
          paginationComponentOptions={paginationTH}
          noDataComponent="ไม่พบข้อมูล"
        />
      )}
    </div>
  );
}
