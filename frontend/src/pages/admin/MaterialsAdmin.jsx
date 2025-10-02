import React, { useEffect, useMemo, useState } from 'react';
import DataTable from 'react-data-table-component';


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
        } finally {
            setLoading(false);
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
        if (!confirm(`ลบรายการนี้หรือไม่? (ID: ${r.id})`)) return;
        try {
            const res = await fetch(`${host}/api/materials/${r.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            await fetchList();
            alert('ลบสำเร็จ');
        } catch (err) {
            alert('ลบไม่สำเร็จ');
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.code.trim() || !form.name.trim()) {
            alert('กรอก code และ name ให้ครบ');
            return;
        }
        setSaving(true);
        try {
            const payload = { code: form.code.trim(), name: form.name.trim() };
            const isEdit = !!form.id;
            const url = isEdit ? `${host}/api/materials/${form.id}` : `${host}/api/materials`;
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Save failed');
            await fetchList();
            setShowModal(false);
        } catch (err) {
            alert('บันทึกไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

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
            selector: row => new Date(row.created_at).toLocaleString('th-TH'),
            sortable: true,
            width: '200px',
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
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="m-0">จัดการวัสดุ (Materials)</h2>
                <button className="btn btn-success" onClick={openCreate}>+ เพิ่มวัสดุ</button>
            </div>

            {error && <div className="alert alert-danger py-2">{error}</div>}

            <DataTable
                columns={columns}
                data={rows}
                progressPending={loading}
                pagination
                highlightOnHover
                pointerOnHover
                noDataComponent={<div className="py-3">ไม่พบข้อมูล</div>}
            />

            {/* Modal แบบง่าย */}
            {showModal && (
                <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={onSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">{form.id ? 'แก้ไขวัสดุ' : 'เพิ่มวัสดุ'}</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">รหัส (code) <span className="text-danger">*</span></label>
                                        <input
                                            className="form-control"
                                            value={form.code}
                                            onChange={(e) => setForm({ ...form, code: e.target.value })}
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