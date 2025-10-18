import React, { useEffect, useMemo, useState } from 'react';
import DataTable from 'react-data-table-component';
import { FaSearch, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import Swal from 'sweetalert2';

const host = import.meta.env.VITE_HOST || '';

export default function MaterialsAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // modal state
  const emptyForm = useMemo(() => ({ id: null, code: '', name: '' }), []);
  const [form, setForm] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // search state
  const [search, setSearch] = useState('');

  const fetchList = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${host}/api/materials`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('โหลดข้อมูลไม่สำเร็จ');
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'โหลดข้อมูลไม่สำเร็จ' });
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (row) => {
    const next = (row.status === 0) ? 1 : 0;
    try {
      const res = await fetch(`${host}/api/materials/${row.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Update failed');

      // อัปเดตแถวในตาราง
      setRows((prev) => prev.map(r => r.id === row.id ? { ...r, status: data.status } : r));

      // แจ้งเตือนสถานะปัจจุบันหลังสลับ
      const isShown = data.status === 1;
      Swal.fire({
        icon: 'success',
        title: 'อัปเดตสำเร็จ',
        text: isShown ? 'สถานะ: แสดงอยู่' : 'สถานะ: ซ่อนอยู่ (ไม่แสดง)',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'อัปเดตไม่สำเร็จ', text: 'อัปเดตสถานะไม่สำเร็จ' });
    }
  };

  useEffect(() => { fetchList(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (r) => {
    setForm({ id: r.id, code: r.code || '', name: r.name || '' });
    setShowModal(true);
  };

  const onDelete = async (r) => {
    const res = await Swal.fire({
      icon: 'warning',
      title: 'ลบรายการนี้หรือไม่?',
      text: `ID: ${r.id}`,
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });
    if (!res.isConfirmed) return;

    try {
      const del = await fetch(`${host}/api/materials/${r.id}`, { method: 'DELETE' });
      if (!del.ok) throw new Error('Delete failed');
      await fetchList();
      Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ' });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!form.id;

    if (!isEdit && (!form.code.trim() || !form.name.trim())) {
      Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'กรอก code และ name ให้ครบ' });
      return;
    }
    if (isEdit && !form.name.trim()) {
      Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'กรอก name ให้ครบ' });
      return;
    }

    setSaving(true);
    try {
      const url = isEdit ? `${host}/api/materials/${form.id}` : `${host}/api/materials`;
      const method = isEdit ? 'PUT' : 'POST';
      const payload = isEdit
        ? { name: form.name.trim() }
        : { code: form.code.trim(), name: form.name.trim() };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');

      await fetchList();
      setShowModal(false);
      Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ' });
    } finally {
      setSaving(false);
    }
  };

  // filter rows by search term (code/name)
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const code = (r.code || '').toString().toLowerCase();
      const name = (r.name || '').toString().toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [rows, search]);

  // DataTable columns
  const columns = [
    {
      name: 'ลำดับ',
      width: '80px',
      center: true,
      cell: (row, index) => <span>{index + 1}</span>,
    },
    {
      name: 'รหัส (code)',
      selector: row => row.code,
      sortable: true,
      width: '160px',
    },
    {
      name: 'ชื่อ (name)',
      selector: row => row.name,
      sortable: true,
    },
    {
      name: 'สร้างเมื่อ (created_at)',
      selector: row => {
        try {
          return row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : '-';
        } catch {
          return row.created_at ?? '-';
        }
      },
      sortable: true,
      width: '200px',
    },
    // ติดกับปุ่มสลับสถานะ
    {
      name: 'สถานะ',
      width: '140px',
      selector: row => (row.status === 0 ? 'ไม่แสดง' : 'แสดง'),
      cell: (row) => (
        <span className={`badge ${row.status === 0 ? 'bg-secondary' : 'bg-success'}`}>
          {row.status === 0 ? 'ไม่แสดง' : 'แสดง'}
        </span>
      ),
      sortable: true,
      right: true,
    },
    {
      name: 'สลับสถานะ',
      width: '140px',
      right: true,
      cell: (row) => (
        <button
          className={`btn btn-sm ${row.status === 0 ? 'btn-outline-success' : 'btn-outline-secondary'}`}
          title={row.status === 0 ? 'แสดง' : 'ไม่แสดง'}
          onClick={() => toggleStatus(row)}
        >
          {row.status === 0 ? <FaEye /> : <FaEyeSlash />}
        </button>
      ),
    },
    {
      name: 'การจัดการ',
      width: '160px',
      right: true,
      cell: (row) => (
        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-sm btn-primary" onClick={() => openEdit(row)}>แก้ไข</button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(row)}>ลบ</button>
        </div>
      ),
    },
  ];

  return (
    <div className="container py-4" style={{ fontFamily: 'Kanit, sans-serif' }}>
      {/* Header: ชื่อหน้า + ปุ่มเพิ่ม + ค้นหา */}
      <div className="d-flex align-items-center mb-3">
        <h2 className="m-0">รายการรายจ่าย</h2>

        <div className="d-flex align-items-center gap-2 ms-auto">
          {/* Search with icon */}
          <div className="position-relative" style={{ width: 320, maxWidth: '100%' }}>
            <FaSearch
              size={14}
              className="position-absolute"
              style={{ left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}
              aria-hidden="true"
            />
            <input
              className="form-control"
              style={{ paddingLeft: 32, paddingRight: 32 }}
              placeholder="ค้นหา: รหัส (code) หรือ ชื่อ (name)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="ค้นหาวัสดุ"
            />
            {!!search && (
              <button
                type="button"
                className="btn btn-link p-0 position-absolute"
                onClick={() => setSearch('')}
                style={{ right: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                title="ล้างคำค้น"
                aria-label="ล้างคำค้น"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <button className="btn btn-success" onClick={openCreate}>+ เพิ่มรายการ</button>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <DataTable
        columns={columns}
        data={filteredRows}
        progressPending={loading}
        pagination
        highlightOnHover
        pointerOnHover
        persistTableHead
        noDataComponent={
          <div className="py-3">
            {search ? 'ไม่พบข้อมูลที่ตรงกับคำค้น' : 'ไม่พบข้อมูล'}
          </div>
        }
      />

      {/* Modal */}
      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={onSubmit}>  
                <div className="modal-header">
                  <h5 className="modal-title">
                    {form.id ? 'แก้ไขรายการ (ไม่สามารถแก้รหัสได้)' : 'เพิ่มรายการ'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      รหัส (code) <span className="text-danger">*</span>{' '}
                      {form.id && <small className="text-muted">— แก้ไขไม่ได้</small>}
                    </label>
                    <input
                      className="form-control"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      disabled={!!form.id}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">ชื่อ (name) <span className="text-danger">*</span></label>
                    <input
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
