import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import DataTable from 'react-data-table-component';

const host = import.meta.env.VITE_HOST || '';

function todayISO() {
  const tz = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - tz).toISOString().slice(0, 10);
}

function fmtMoney(n) {
  const num = Number(n) || 0;
  return `฿${num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function IncomeExpensePage() {
  const customStyles = {
    rows: { style: { minHeight: '40px' } },
    headCells: { style: { fontWeight: 'bold', fontSize: '15px', backgroundColor: '#f8f9fa' } },
    cells: { style: { fontSize: '14px' } }
  };

  // ----- States -----
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState([]);

  const [splitView, setSplitView] = useState(true);

  // ฟอร์ม + เพิ่ม field สำหรับวัสดุที่เลือก (material_id)
  const [form, setForm] = useState({
    date: todayISO(),
    type: 'รายรับ',
    source: 'store',
    ref_no: '',
    material_id: '',   // <-- ใช้ถือค่า option ที่เลือก
    code: '',
    name: '',
    qty: 1,
    unit_price: '',
    description: '',
    amount: ''
  });

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    source: 'all',
    type: 'all',
    q: ''
  });

  const formRef = useRef(null);

  // ===== Materials dropdown =====
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setMaterialsLoading(true);
        setMaterialsError('');
        const res = await fetch(`${host}/api/materials`);
        if (!res.ok) throw new Error('โหลดรายการวัสดุล้มเหลว');
        const rows = await res.json();
        setMaterials(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error('load materials error:', e);
        setMaterials([]);
        setMaterialsError('โหลดรายการวัสดุไม่สำเร็จ');
      } finally {
        setMaterialsLoading(false);
      }
    })();
  }, [host]);

  // เมื่อเลือกวัสดุ: ตั้งค่า material_id, code, name อัตโนมัติ
  const handleMaterialSelect = (e) => {
    const materialIdStr = e.target.value;
    if (!materialIdStr) {
      setForm(prev => ({ ...prev, material_id: '', code: '', name: '' }));
      return;
    }
    const materialId = Number(materialIdStr);
    const found = materials.find(m => Number(m.id) === materialId);
    if (!found) return;
    setForm(prev => ({
      ...prev,
      material_id: String(found.id),
      code: found.code || '',
      name: found.name || ''
    }));
  };

  // ===== helper =====
  const getTotal = (row) => {
    const qty = Number(row?.qty ?? 1) || 1;
    const unit = Number(row?.unit_price ?? row?.amount ?? 0) || 0;
    return qty * unit;
  };

  // Auto-calculate amount when qty or unit_price changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    let next = { ...form, [name]: value };
    // Only auto-calc if editing qty or unit_price and amount is empty or not manually set
    if ((name === 'qty' || name === 'unit_price') && next.qty && next.unit_price && (!form.amount || form.amount === '' || form.amount === '0')) {
      const qty = Math.max(1, Number(next.qty) || 1);
      const unit = Math.abs(Number(next.unit_price) || 0);
      let total = qty * unit;
      // If type is expense, make negative
      if (next.type === 'รายจ่าย') total = -Math.abs(total);
      next.amount = total;
    }
    setForm(next);
  };

  // Show auto-calculated total in the form
  const autoTotal = useMemo(() => {
    const qty = Math.max(1, Number(form.qty) || 1);
    const unit = Math.abs(Number(form.unit_price) || 0);
    let total = qty * unit;
    if (form.type === 'รายจ่าย') total = -Math.abs(total);
    return total;
  }, [form.qty, form.unit_price, form.type]);
  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const addDraft = (e) => {
    e.preventDefault();
    const dateVal = form.date || todayISO();
    if (!dateVal || !form.type) return;

    const qty = Math.max(1, Number(form.qty) || 1);
    const unit = Math.abs(Number(form.unit_price) || 0);

    let total = Number(form.amount);
    if (!Number.isFinite(total)) total = qty * unit;

    if (form.type === 'รายจ่าย' && total > 0) total = -total;
    if (form.type === 'รายรับ' && total < 0) total = -total;

    setDrafts(prev => ([
      ...prev,
      {
        id: prev.length + 1,
        date: dateVal,
        time: '',
        type: form.type,
        source: form.source || 'store',
        order_no: form.ref_no || '-',
        ref_no: form.ref_no || '',
        material_id: form.material_id || '',
        code: form.code || '',
        name: form.name || form.description || '-',
        qty,
        unit_price: unit,
        amount: total,
        description: form.description || '-',
      }
    ]));

    setForm({
      date: todayISO(),
      type: 'รายรับ',
      source: 'store',
      ref_no: '',
      material_id: '',
      code: '',
      name: '',
      qty: 1,
      unit_price: '',
      description: '',
      amount: ''
    });
  };

  const removeDraft = (id) => setDrafts(prev => prev.filter(d => d.id !== id));
  const clearDrafts = () => setDrafts([]);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.source !== 'all') params.set('source', filters.source);
    if (filters.type !== 'all') params.set('type', filters.type);
    return params.toString();
  };

  const buildExportQuery = () => {
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.source !== 'all') params.set('source', filters.source);
    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.q) params.set('q', filters.q.trim());
    return params.toString();
  };

  const splitDateTime = (val) => {
    const s = String(val || '');
    if (!s) return { date: '', time: '' };
    const d = s.slice(0, 10);
    const t = s.length > 10 ? s.slice(11, 19) : '';
    return { date: d, time: t };
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      const qs = buildQuery();
      const res = await fetch(`${host}/api/ledger${qs ? `?${qs}` : ''}`);

      const baseRows = res.ok ? await res.json().catch(() => []) : [];
      let combined = (Array.isArray(baseRows) ? baseRows : []).map((r) => {
        const t = splitDateTime(r.entry_date);
        const isExpense = r.type === 'expense';
        const signedAmount = Number(r.amount || 0);
        const qty = Number(r.qty || 0) > 0 ? Number(r.qty) : 1;
        const unitPrice = Number(r.unit_price ?? 0) || (isExpense ? Math.abs(signedAmount) : signedAmount);

        return {
          id: r.id,
          date: t.date,
          time: t.time,
          type: isExpense ? 'รายจ่าย' : 'รายรับ',
          source: r.source || 'store',
          order_no: r.ref_no || '-',
          ref_no: r.ref_no || null,
          code: r.code || '-',
          name: r.name || r.description || '-',
          qty,
          unit_price: unitPrice,
          amount: signedAmount,
          description: r.description || '-',
        };
      });

      const includeOnline =
        (filters.source === 'all' || filters.source === 'online') &&
        (filters.type === 'all' || filters.type === 'income');

      if (includeOnline) {
        const params = new URLSearchParams();
        if (filters.from) params.set('from', filters.from);
        if (filters.to) params.set('to', filters.to);
        params.set('limit', '1000');
        params.set('status', 'approved,shipped,delivered');

        const onlineUrl = `${host}/api/reports/online-sales${params.toString() ? `?${params.toString()}` : ''}`;
        const onlineRes = await fetch(onlineUrl);

        if (onlineRes.ok) {
          const onlineJson = await onlineRes.json().catch(() => ({}));
          const orders = Array.isArray(onlineJson?.data) ? onlineJson.data : [];
          const onlineEntries = [];

          orders.forEach((order) => {
            const dtStr = order?.created_at ? String(order.created_at) : '';
            const { date, time } = splitDateTime(dtStr);
            const items = Array.isArray(order?.items) ? order.items : [];
            const orderNo = `OR#${order.id}`;

            if (items.length) {
              items.forEach((item, idx) => {
                const qty = Number(item?.qty ?? item?.quantity ?? 0) || 1;
                const price = Number(item?.price ?? 0) || 0;
                const amount = qty * price;
                if (!amount) return;

                const code =
                  item?.sku ||
                  item?.product_code ||
                  (item?.product_id ? `P${item.product_id}` : '-') ||
                  '-';

                const name = item?.product_name || item?.name || `คำสั่งซื้อ #${order.id}`;

                onlineEntries.push({
                  id: `online-order-${order.id}-${idx}`,
                  date,
                  time,
                  type: 'รายรับ',
                  source: 'online',
                  order_no: orderNo,
                  ref_no: orderNo,
                  code,
                  name,
                  qty,
                  unit_price: price,
                  amount,
                  description: name,
                });
              });
            } else {
              const total = Number(order?.total_price || 0);
              if (total) {
                onlineEntries.push({
                  id: `online-order-${order.id}`,
                  date,
                  time,
                  type: 'รายรับ',
                  source: 'online',
                  order_no: orderNo,
                  ref_no: orderNo,
                  code: '-',
                  name: `คำสั่งซื้อ #${order.id}`,
                  qty: 1,
                  unit_price: total,
                  amount: total,
                  description: `คำสั่งซื้อ #${order.id}`,
                });
              }
            }
          });

          if (onlineEntries.length) combined = combined.concat(onlineEntries);
        }
      }

      combined.sort((a, b) => {
        const da = new Date(`${a.date || '1970-01-01'} ${a.time || '00:00:00'}`).getTime();
        const db = new Date(`${b.date || '1970-01-01'} ${b.time || '00:00:00'}`).getTime();
        if (da !== db) return db - da;
        return String(b.id || '').localeCompare(String(a.id || ''));
      });

      setData(combined);
    } catch (err) {
      console.error('loadEntries error:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const columnsMain = [
    { name: 'วันที่', selector: row => row.date, sortable: true, width: '120px' },
    { name: 'เวลา', selector: row => row.time || '-', sortable: true, width: '100px' },
    {
      name: 'เลขที่ (สั่งซื้อ/สั่งทำ/ใบเสร็จ)',
      selector: row => row.order_no || '-',
      sortable: true,
      wrap: true,
      width: '220px',
    },
    {
      name: 'ประเภท',
      selector: row => row.type,
      sortable: true,
      width: '110px',
      cell: row => (
        <span className={`badge ${row.type === 'รายจ่าย' ? 'bg-danger' : 'bg-success'}`}>{row.type}</span>
      ),
    },
    {
      name: 'แหล่งที่มา',
      selector: row => row.source,
      sortable: true,
      width: '110px',
      cell: row => (
        <span className="badge bg-secondary">{row.source === 'online' ? 'ออนไลน์' : 'หน้าร้าน'}</span>
      ),
    },
    { name: 'รหัสสินค้า/วัสดุ', selector: row => row.code || '-', sortable: true, width: '160px', wrap: true },
    { name: 'ชื่อสินค้า/วัสดุ', selector: row => row.name || '-', sortable: true, wrap: true, grow: 2 },
    {
      name: 'จำนวน',
      selector: row => row.qty ?? 1,
      sortable: true,
      right: true,
      width: '100px',
      cell: row => <span>{Number(row.qty || 1).toLocaleString('th-TH')}</span>,
    },
    {
      name: 'ราคาต่อหน่วย',
      selector: row => row.unit_price ?? row.amount,
      sortable: true,
      right: true,
      width: '150px',
      cell: row => <span>{fmtMoney(row.unit_price ?? row.amount)}</span>,
    },
    {
      id: 'total',
      name: 'ราคารวม',
      selector: row => getTotal(row),
      sortable: true,
      right: true,
      width: '160px',
      cell: row => (
        <span className={row.type === 'รายจ่าย' ? 'text-danger' : 'text-success'}>
          {fmtMoney(getTotal(row))}
        </span>
      ),
    },
    {
      id: 'amount',
      name: 'จำนวนเงิน',
      selector: row => row.amount,
      sortable: true,
      right: true,
      width: '160px',
      cell: row => (
        <span className={row.type === 'รายจ่าย' ? 'text-danger' : 'text-success'}>
          {fmtMoney(row.amount)}
        </span>
      ),
    },
  ];

  const columnsCompact = [
    { name: 'วันที่', selector: row => row.date, sortable: true, width: '110px' },
    { name: 'เวลา', selector: row => row.time || '-', sortable: true, width: '90px' },
    { name: 'เลขที่', selector: row => row.order_no || '-', sortable: true, wrap: true, width: '140px' },
    { name: 'ชื่อรายการ', selector: row => row.name || '-', sortable: true, wrap: true, grow: 2 },
    {
      id: 'total',
      name: 'ราคารวม',
      selector: row => getTotal(row),
      sortable: true,
      right: true,
      width: '140px',
      cell: row => (
        <span className={row.type === 'รายจ่าย' ? 'text-danger' : 'text-success'}>
          {fmtMoney(getTotal(row))}
        </span>
      ),
    },
    {
      id: 'amount',
      name: 'จำนวนเงิน',
      selector: row => row.amount,
      sortable: true,
      right: true,
      width: '150px',
      cell: row => (
        <span className={row.type === 'รายจ่าย' ? 'text-danger' : 'text-success'}>
          {fmtMoney(row.amount)}
        </span>
      ),
    },
  ];

  const columnsDrafts = [
    { name: 'วันที่', selector: row => row.date, sortable: true, width: '120px' },
    { name: 'เวลา', selector: row => row.time || '-', sortable: true, width: '100px' },
    {
      name: 'เลขที่ (สั่งซื้อ/สั่งทำ/ใบเสร็จ)',
      selector: row => row.order_no || '-',
      sortable: true,
      wrap: true,
      width: '220px',
    },
    {
      name: 'ประเภท',
      selector: row => row.type,
      sortable: true,
      width: '110px',
      cell: row => (
        <span className={`badge ${row.type === 'รายจ่าย' ? 'bg-danger' : 'bg-success'}`}>{row.type}</span>
      ),
    },
    {
      name: 'แหล่งที่มา',
      selector: row => row.source,
      sortable: true,
      width: '110px',
      cell: row => (
        <span className="badge bg-secondary">{row.source === 'online' ? 'ออนไลน์' : 'หน้าร้าน'}</span>
      ),
    },
    { name: 'รหัสสินค้า/วัสดุ', selector: row => row.code || '-', sortable: true, width: '160px', wrap: true },
    { name: 'ชื่อสินค้า/วัสดุ', selector: row => row.name || '-', sortable: true, wrap: true, grow: 2 },
    {
      name: 'จำนวน',
      selector: row => row.qty ?? 1,
      sortable: true,
      right: true,
      width: '100px',
      cell: row => <span>{Number(row.qty || 1).toLocaleString('th-TH')}</span>,
    },
    {
      name: 'ราคาต่อหน่วย',
      selector: row => row.unit_price ?? row.amount,
      sortable: true,
      right: true,
      width: '150px',
      cell: row => <span>{fmtMoney(row.unit_price ?? row.amount)}</span>,
    },
    {
      id: 'amount',
      name: 'จำนวนเงิน',
      selector: row => row.amount,
      sortable: true,
      right: true,
      width: '150px',
      cell: row => (
        <span className={row.type === 'รายจ่าย' ? 'text-danger' : 'text-success'}>
          {fmtMoney(row.amount)}
        </span>
      ),
    },
    {
      name: '',
      width: '90px',
      right: true,
      cell: row => (
        <button className="btn btn-sm btn-outline-danger" onClick={() => removeDraft(row.id)}>
          ลบ
        </button>
      ),
    },
  ];

  useEffect(() => { loadEntries(); }, []);
  useEffect(() => { loadEntries(); }, [filters.from, filters.to, filters.source, filters.type]);

  const saveDrafts = async () => {
    if (drafts.length === 0) return;
    const payload = {
      items: drafts.map((d) => ({
        date: d.date,
        type: d.type,
        source: d.source,
        ref_no: d.ref_no || d.order_no || null,
        code: d.code || null,
        name: d.name || null,
        qty: d.qty,
        unit_price: d.unit_price,
        description: d.description,
        amount: d.amount
      }))
    };
    try {
      setSaving(true);
      const res = await fetch(`${host}/api/ledger/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Save failed');
      clearDrafts();
      await loadEntries();
    } catch (err) {
      console.error('saveDrafts error:', err);
      alert('บันทึกล้มเหลว');
    } finally {
      setSaving(false);
    }
  };

  const filteredData = useMemo(() => {
    const q = (filters.q || '').trim().toLowerCase();
    if (!q) return data;
    return data.filter((r) =>
      (r.description || '').toLowerCase().includes(q)
      || (r.type || '').toLowerCase().includes(q)
      || (r.source || '').toLowerCase().includes(q)
      || (r.order_no || '').toLowerCase().includes(q)
      || (r.code || '').toLowerCase().includes(q)
      || (r.name || '').toLowerCase().includes(q)
    );
  }, [data, filters.q]);

  const incomeRows = useMemo(() => filteredData.filter(r => r.type === 'รายรับ'), [filteredData]);
  const expenseRows = useMemo(() => filteredData.filter(r => r.type === 'รายจ่าย'), [filteredData]);

  const incomeTotal = useMemo(() => incomeRows.reduce((s, it) => s + (Number(it.amount) || 0), 0), [incomeRows]);
  const expenseTotal = useMemo(() => expenseRows.reduce((s, it) => s + (Number(it.amount) || 0), 0), [expenseRows]);
  const netTotal = useMemo(() => incomeTotal + expenseTotal, [incomeTotal, expenseTotal]);

  const exportExcel = () => {
    const rows = filteredData.map((item) => {
      const total = getTotal(item);
      return {
        Date: item.date,
        Time: item.time || '',
        RefNo: item.order_no || '-',
        Type: item.type,
        Source: item.source === 'online' ? 'Online' : 'Store',
        Code: item.code || '-',
        Name: item.name || '-',
        Qty: item.qty ?? 1,
        UnitPrice: item.unit_price ?? item.amount,
        Total: total,
        Amount: item.amount
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายรับ-รายจ่าย');
    XLSX.writeFile(wb, 'รายรับ-รายจ่าย.xlsx');
  };

  const exportPDF = async () => {
    try {
      const qs = buildExportQuery();
      const res = await fetch(`${host}/api/ledger/export/pdf${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `รายรับ-รายจ่าย.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('ส่งออก PDF ล้มเหลว');
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">ข้อมูล รายรับ - รายจ่าย</h2>
        <div>
          {loading && <span className="badge bg-secondary me-2">กำลังโหลด…</span>}
          {saving && <span className="badge bg-info">กำลังบันทึก…</span>}
        </div>
      </div>

      <div className="card shadow-sm mb-4" id="section-draft">
        <div className="card-header d-flex align-items-center">
          <span className="me-2">📝</span>
          <strong>บันทึกรายรับ - รายจ่าย (หน้าร้าน)</strong>
        </div>
        <div className="card-body">
          <form ref={formRef} onSubmit={addDraft} className="row g-3 align-items-end">
            <div className="col-md-2">
              <label className="form-label">วันที่</label>
              <input type="date" className="form-control" name="date" required value={form.date} onChange={handleChange}/>
            </div>
            <div className="col-md-2">
              <label className="form-label">ประเภท</label>
              <select className="form-select" name="type" value={form.type} onChange={handleChange}>
                <option value="รายรับ">รายรับ</option>
                <option value="รายจ่าย">รายจ่าย</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">เลขที่/อ้างอิง</label>
              <input type="text" className="form-control" name="ref_no" placeholder="เช่น ใบเสร็จ/OR#123" value={form.ref_no} onChange={handleChange}/>
            </div>

            {/* รหัสสินค้า/วัสดุ เป็นดรอปดาวน์ */}
            <div className="col-md-3">
              <label className="form-label">รหัสสินค้า/วัสดุ</label>
              <select
                className="form-select"
                name="material_id"
                value={form.material_id}
                onChange={handleMaterialSelect}
                disabled={materialsLoading}
              >
                <option value="">-- เลือกจากรายการ --</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.code} — {m.name}
                  </option>
                ))}
              </select>
              {materialsError && <div className="form-text text-danger">{materialsError}</div>}
            </div>

            {/* ชื่อสินค้า/วัสดุ แสดงตามที่เลือก */}
            <div className="col-md-3">
              <label className="form-label">ชื่อสินค้า/วัสดุ</label>
              <input
                type="text"
                className="form-control"
                name="name"
                placeholder="จะถูกกรอกอัตโนมัติเมื่อเลือกรหัส"
                value={form.name}
                readOnly
                onChange={handleChange}
              />
            </div>

            <div className="col-md-1">
              <label className="form-label">จำนวน</label>
              <input type="number" className="form-control" name="qty" min={1} step="1" value={form.qty} onChange={handleChange}/>
            </div>
            <div className="col-md-2">
              <label className="form-label">ราคาต่อหน่วย</label>
              <input type="number" step="0.01" className="form-control" name="unit_price" placeholder="0.00" value={form.unit_price} onChange={handleChange}/>
              <div className="form-text text-success">รวม: {fmtMoney(autoTotal)}</div>
            </div>

            <div className="col-md-3">
              <label className="form-label">คำอธิบาย</label>
              <input type="text" className="form-control" name="description" placeholder="รายละเอียดรายการ" value={form.description} onChange={handleChange}/>
            </div>
          
            <div className="col-md-1 d-grid">
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-plus"></i> เพิ่ม
              </button>
            </div>
          </form>

          {drafts.length > 0 && (
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">รายการที่ยังไม่บันทึก</h6>
                <div className="btn-group">
                  <button onClick={saveDrafts} className="btn btn-success"><i className="fas fa-save"></i> บันทึกทั้งหมด</button>
                  <button onClick={clearDrafts} className="btn btn-outline-secondary">ล้างรายการ</button>
                </div>
              </div>

              <DataTable
                columns={columnsDrafts}
                data={drafts}
                progressPending={saving}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[5, 10, 25, 30, 50]}
                highlightOnHover
                responsive
                persistTableHead
                defaultSortFieldId="amount"
                defaultSortAsc={false}
                customStyles={customStyles}
              />

              <div className="d-flex justify-content-end mt-3">
                <div className="text-end">
                  <div className="fw-bold">สุทธิ (Draft):</div>
                  <div className={`fw-bold ${drafts.reduce((s,d)=>s+(Number(d.amount)||0),0) >= 0 ? 'text-success' : 'text-danger'}`}>
                    {fmtMoney(drafts.reduce((s,d)=>s+(Number(d.amount)||0),0))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-sm mb-3" id="section-filters">
        <div className="card-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <span className="me-2">🔎</span>
            <strong>เงื่อนไขรายงาน</strong>
          </div>
          <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" id="splitSwitch" checked={splitView} onChange={(e) => setSplitView(e.target.checked)} />
            <label className="form-check-label" htmlFor="splitSwitch">มุมมองแยกซ้าย-ขวา</label>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-2">
              <label className="form-label">เริ่มวันที่</label>
              <input type="date" className="form-control" name="from" value={filters.from} onChange={handleFilterChange} />
            </div>
            <div className="col-md-2">
              <label className="form-label">ถึงวันที่</label>
              <input type="date" className="form-control" name="to" value={filters.to} onChange={handleFilterChange} />
            </div>
            <div className="col-md-2">
              <label className="form-label">แหล่งที่มา</label>
              <select className="form-select" name="source" value={filters.source} onChange={handleFilterChange}>
                <option value="all">ทั้งหมด</option>
                <option value="store">หน้าร้าน</option>
                <option value="online">ออนไลน์</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">ประเภท</label>
              <select className="form-select" name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="all">ทั้งหมด</option>
                <option value="income">รายรับ</option>
                <option value="expense">รายจ่าย</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">ค้นหา</label>
              <input type="text" className="form-control" name="q" placeholder="ค้นหาอ้างอิง/รหัส/ชื่อ/คำอธิบาย/ประเภท/แหล่งที่มา" value={filters.q} onChange={handleFilterChange} />
            </div>
            <div className="col-md-1 d-grid">
              <button className="btn btn-outline-secondary" onClick={loadEntries}>ดึงข้อมูล</button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="card border-success">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div className="small text-muted">รายรับรวม</div>
                <div className="fs-5 fw-bold text-success">{fmtMoney(incomeTotal)}</div>
              </div>
              <span className="badge bg-success">IN</span>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-danger">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div className="small text-muted">รายจ่ายรวม</div>
                <div className="fs-5 fw-bold text-danger">{fmtMoney(expenseTotal)}</div>
              </div>
              <span className="badge bg-danger">OUT</span>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className={`card ${netTotal >= 0 ? 'border-success' : 'border-danger'}`}>
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div className="small text-muted">ยอดต่าง (รายรับ + รายจ่าย)</div>
                <div className={`fs-5 fw-bold ${netTotal >= 0 ? 'text-success' : 'text-danger'}`}>{fmtMoney(netTotal)}</div>
              </div>
              <span className={`badge ${netTotal >= 0 ? 'bg-success' : 'bg-danger'}`}>NET</span>
            </div>
          </div>
        </div>
      </div>

      {/* Records */}
      <div className="card shadow-sm" id="section-records">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <span className="me-2">📒</span>
            <strong>รายการบันทึกทั้งหมด</strong>
          </div>
          <div className="btn-group">
            <button className="btn btn-outline-success" onClick={exportExcel}><i className="fas fa-file-excel" /> Export Excel</button>
            <button className="btn btn-outline-danger" onClick={exportPDF}><i className="fas fa-file-pdf" /> Export PDF</button>
          </div>
        </div>

        <div className="card-body">
          {splitView ? (
            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="card h-100">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <strong>ด้านซ้าย: รายรับ</strong>
                    <span className="badge bg-success">{fmtMoney(incomeTotal)}</span>
                  </div>
                  <div className="card-body p-0">
                    <DataTable
                      columns={columnsCompact}
                      data={incomeRows}
                      progressPending={loading}
                      pagination
                      paginationPerPage={10}
                      paginationRowsPerPageOptions={[5, 10, 25, 30, 50]}
                      highlightOnHover
                      responsive
                      persistTableHead
                      defaultSortFieldId="total"
                      defaultSortAsc={false}
                      customStyles={customStyles}
                      fixedHeader
                      fixedHeaderScrollHeight="420px"
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="card h-100">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <strong>ด้านขวา: รายจ่าย</strong>
                    <span className="badge bg-danger">{fmtMoney(expenseTotal)}</span>
                  </div>
                  <div className="card-body p-0">
                    <DataTable
                      columns={columnsCompact}
                      data={expenseRows}
                      progressPending={loading}
                      pagination
                      paginationPerPage={10}
                      paginationRowsPerPageOptions={[5, 10, 25, 30, 50]}
                      highlightOnHover
                      responsive
                      persistTableHead
                      defaultSortFieldId="total"
                      defaultSortAsc={false}
                      customStyles={customStyles}
                      fixedHeader
                      fixedHeaderScrollHeight="420px"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <DataTable
                columns={columnsMain}
                data={filteredData}
                progressPending={loading}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[5, 10, 25, 30, 50]}
                highlightOnHover
                responsive
                persistTableHead
                defaultSortFieldId="total"
                defaultSortAsc={false}
                customStyles={customStyles}
              />
              <div className="d-flex justify-content-end mt-3">
                <div className="text-end">
                  <div className="fw-bold">สุทธิ:</div>
                  <div className={`fw-bold ${netTotal >= 0 ? 'text-success' : 'text-danger'}`}>
                    {fmtMoney(netTotal)}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
