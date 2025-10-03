import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import DataTable from 'react-data-table-component';

const host = import.meta.env.VITE_HOST || '';

// ---- utils ----
function todayISO() {
  const tz = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - tz).toISOString().slice(0, 10);
}
function fmtMoney(n) {
  const num = Number(n) || 0;
  return `฿${num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// รวม logic คำนวณจำนวนเงินไว้ที่เดียว
function computeTotals({ qty, unit_price, type, amount }) {
  const q = Math.max(1, Number(qty) || 1);
  const unit = Math.abs(Number(unit_price) || 0);
  let total = Number.isFinite(Number(amount)) && amount !== '' ? Number(amount) : q * unit;
  if (type === 'รายจ่าย') total = -Math.abs(total);
  if (type === 'รายรับ') total = Math.abs(total);
  return { q, unit, total };
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

  // ฟอร์ม
  const [form, setForm] = useState({
    date: todayISO(),
    type: 'รายรับ',
    source: 'store',
    ref_no: '',
    material_id: '', // เราจะเก็บ key "p:<id>" หรือ "m:<id>" ไว้เฉพาะฝั่ง UI
    code: '',
    name: '',
    qty: 1,
    unit_price: '',
    description: '',
    amount: '' // ปล่อยว่างให้ computeTotals จัดการ
  });

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    source: 'all',
    type: 'all',
    q: ''
  });

  const formRef = useRef(null);

  // ===== โหลด “สินค้า + วัสดุ” เพื่อทำดรอปดาวน์รวม =====
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');

  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState('');

  useEffect(() => {
    (async () => {
      // 1) โหลดสินค้า
      try {
        setProductsLoading(true);
        setProductsError('');
        const res = await fetch(`${host}/api/products?status=active`);
        if (!res.ok) throw new Error('โหลดสินค้าล้มเหลว');
        const rows = await res.json();
        setProducts(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error('load products error:', e);
        setProducts([]);
        setProductsError('โหลดสินค้าจากระบบไม่สำเร็จ');
      } finally {
        setProductsLoading(false);
      }

      // 2) โหลดวัสดุ (แสดงรวมกัน)
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

  // สร้าง options แยก 2 กลุ่ม
  const productOptions = useMemo(() => (
    products.map(p => ({
      key: `p:${p.id}`,
      id: Number(p.id),
      code: p.product_code || '-',
      name: p.name || '-',
      price: Number(p.price) || 0,
      source: 'product',
    }))
  ), [products]);

  const materialOptions = useMemo(() => (
    materials.map(m => ({
      key: `m:${m.id}`,
      id: Number(m.id),
      code: m.code || '-',
      name: m.name || '-',
      price: Number(m.price) || 0, // ถ้าไม่มีราคา จะเป็น 0
      source: 'material',
    }))
  ), [materials]);

  // รวมไว้เพื่อค้นหาค่าที่เลือก
  const allOptions = useMemo(() => [...productOptions, ...materialOptions], [productOptions, materialOptions]);

  // เมื่อเลือก option: อ่านจาก key "p:<id>" หรือ "m:<id>"
  const handleItemSelect = (e) => {
    const key = e.target.value;
    if (!key) {
      setForm(prev => ({ ...prev, material_id: '', code: '', name: '' }));
      return;
    }
    const found = allOptions.find(it => it.key === key);
    if (!found) return;

    setForm(prev => ({
      ...prev,
      material_id: key, // เก็บ key ไว้เฉพาะฝั่ง UI
      code: found.code || '',
      name: found.name || '',
      unit_price:
        (prev.unit_price === '' || prev.unit_price === null || prev.unit_price === undefined)
          ? (found.price || '')
          : prev.unit_price,
    }));
  };

  // ===== helper สำหรับตาราง =====
  const getTotal = (row) => {
    const hasUnit =
      row?.unit_price !== undefined &&
      row?.unit_price !== null &&
      String(row.unit_price) !== '';
    const qty = Math.max(1, Number(row?.qty) || 1);

    if (hasUnit) {
      let total = qty * Math.abs(Number(row.unit_price) || 0);
      if (row?.type === 'รายจ่าย') total = -Math.abs(total);
      if (row?.type === 'รายรับ') total = Math.abs(total);
      return total;
    }
    return Number(row?.amount) || 0;
  };

  // Auto-calc total (preview ในฟอร์ม)
  const autoTotal = useMemo(() => computeTotals(form).total, [form.qty, form.unit_price, form.type, form.amount]);

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // query สำหรับดึง/ส่งออก
  const buildQuery = (includeQ = false) => {
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.source !== 'all') params.set('source', filters.source);
    if (filters.type !== 'all') params.set('type', filters.type);
    if (includeQ && filters.q) params.set('q', filters.q.trim());
    return params.toString();
  };

  const splitDateTime = (val) => {
    if (!val) return { date: '', time: '' };
    if (val instanceof Date) {
      const iso = val.toISOString();
      return { date: iso.slice(0, 10), time: iso.slice(11, 19) };
    }
    const str = String(val).trim();
    if (!str) return { date: '', time: '' };
    const direct = str.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?/);
    if (direct) return { date: direct[1], time: direct[2] || '' };
    const parsed = new Date(str);
    if (!Number.isNaN(parsed.getTime())) {
      const iso = parsed.toISOString();
      return { date: iso.slice(0, 10), time: iso.slice(11, 19) };
    }
    return { date: str.slice(0, 10), time: str.length > 10 ? str.slice(11, 19) : '' };
  };

  // แปลงออเดอร์ออนไลน์เป็นแถว
  function makeOnlineRow(order, { idx = null, item = null }) {
    const dtStr = order?.created_at ? String(order.created_at) : '';
    const { date, time } = splitDateTime(dtStr);
    const orderNo = `OR#${order.id}`;
    if (item) {
      const qty = Number(item?.qty ?? item?.quantity ?? 0) || 1;
      const price = Number(item?.price ?? 0) || 0;
      const amount = qty * price;
      if (!amount) return null;
      const code =
        item?.sku ||
        item?.product_code ||
        (item?.product_id ? `P${item.product_id}` : '-') ||
        '-';
      const name = item?.product_name || item?.name || `คำสั่งซื้อ #${order.id}`;
      return {
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
      };
    } else {
      const total = Number(order?.total_price || 0);
      if (!total) return null;
      return {
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
      };
    }
  }

  const loadEntries = async () => {
    try {
      setLoading(true);
      const qs = buildQuery(false);
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
            const items = Array.isArray(order?.items) ? order.items : [];
            if (items.length) {
              items.forEach((item, idx) => {
                const row = makeOnlineRow(order, { idx, item });
                if (row) onlineEntries.push(row);
              });
            } else {
              const row = makeOnlineRow(order, { idx: null, item: null });
              if (row) onlineEntries.push(row);
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

  // โหลดตาม filters (รวมครั้งแรก)
  useEffect(() => { loadEntries(); }, [filters.from, filters.to, filters.source, filters.type]);

  // เพิ่มรายการชั่วคราว (draft)
  const addDraft = (e) => {
    e.preventDefault();
    const dateVal = form.date || todayISO();
    if (!dateVal || !form.type) return;

    const { q, unit, total } = computeTotals({
      qty: form.qty,
      unit_price: form.unit_price,
      type: form.type,
      amount: form.amount
    });

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
        qty: q,
        unit_price: unit,
        amount: total,
        description: form.description || '-',
      }
    ]));

    // เคลียร์ฟอร์ม
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

  // filter client-side
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

  const draftNet = useMemo(
    () => drafts.reduce((s, d) => s + (Number(d.amount) || 0), 0),
    [drafts]
  );

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
      const qs = buildQuery(true); // รวม q
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

  // -------- columns --------
  const baseCols = {
    date: { name: 'วันที่', selector: r => r.date, sortable: true, width: '120px' },
    time: { name: 'เวลา', selector: r => r.time || '-', sortable: true, width: '100px' },
    order: {
      name: 'เลขที่ (สั่งซื้อ/สั่งทำ/ใบเสร็จ)',
      selector: r => r.order_no || '-',
      sortable: true,
      wrap: true,
      width: '220px'
    },
    type: {
      name: 'ประเภท', selector: r => r.type, sortable: true, width: '110px',
      cell: r => <span className={`badge ${r.type === 'รายจ่าย' ? 'bg-danger' : 'bg-success'}`}>{r.type}</span>
    },
    source: {
      name: 'แหล่งที่มา', selector: r => r.source, sortable: true, width: '110px',
      cell: r => <span className="badge bg-secondary">{r.source === 'online' ? 'ออนไลน์' : 'หน้าร้าน'}</span>
    },
    code: { name: 'รหัสสินค้า/วัสดุ', selector: r => r.code || '-', sortable: true, width: '160px', wrap: true },
    name: { name: 'ชื่อสินค้า/วัสดุ', selector: r => r.name || '-', sortable: true, wrap: true, grow: 2 },
    qty: {
      name: 'จำนวน', selector: r => r.qty ?? 1, sortable: true, right: true, width: '100px',
      cell: r => <span>{Number(r.qty || 1).toLocaleString('th-TH')}</span>
    },
    unit: {
      name: 'ราคาต่อหน่วย', selector: r => r.unit_price ?? r.amount, sortable: true, right: true, width: '150px',
      cell: r => <span>{fmtMoney(r.unit_price ?? r.amount)}</span>
    },
    total: {
      id: 'total', name: 'ราคารวม', selector: r => getTotal(r), sortable: true, right: true, width: '160px',
      cell: r => <span className={r.type === 'รายจ่าย' ? 'text-danger' : 'text-success'}>{fmtMoney(getTotal(r))}</span>
    },
    amount: {
      id: 'amount', name: 'จำนวนเงิน', selector: r => r.amount, sortable: true, right: true, width: '160px',
      cell: r => <span className={r.type === 'รายจ่าย' ? 'text-danger' : 'text-success'}>{fmtMoney(r.amount)}</span>
    },
  };

  function makeColumns({ compact = false, withActions = false }) {
    if (compact) {
      return [
        { ...baseCols.date, width: '110px' },
        { ...baseCols.time, width: '90px' },
        { ...baseCols.order, name: 'เลขที่', width: '140px' },
        { ...baseCols.name, name: 'ชื่อรายการ' },
        baseCols.total,
        baseCols.amount
      ];
    }
    const cols = [
      baseCols.date, baseCols.time, baseCols.order, baseCols.type, baseCols.source,
      baseCols.code, baseCols.name, baseCols.qty, baseCols.unit, baseCols.total, baseCols.amount
    ];
    if (withActions) {
      cols.push({
        name: '',
        width: '90px',
        right: true,
        cell: row => (
          <button className="btn btn-sm btn-outline-danger" onClick={() => removeDraft(row.id)}>
            ลบ
          </button>
        ),
      });
    }
    return cols;
  }

  const columnsCompact = makeColumns({ compact: true, withActions: false });
  const columnsDrafts = makeColumns({ compact: false, withActions: true });

  // ชุดคอลัมน์รวม ที่ตัด 'จำนวนเงิน' ออก (ตามที่ขอ)
  const columnsMainNoAmount = [
    baseCols.date, baseCols.time, baseCols.order, baseCols.type, baseCols.source,
    baseCols.code, baseCols.name, baseCols.qty, baseCols.unit, baseCols.total
  ];

  // -------- render --------
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
              <input type="date" className="form-control" name="date" required value={form.date} onChange={handleChange} />
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
              <input type="text" className="form-control" name="ref_no" placeholder="เช่น ใบเสร็จ/OR#123" value={form.ref_no} onChange={handleChange} />
            </div>

            {/* รหัสสินค้า/วัสดุ — รวมสินค้า+วัสดุ แยก optgroup */}
            <div className="col-md-3">
              <label className="form-label">รหัสสินค้า/วัสดุ</label>
              <select
                className="form-select"
                name="material_id"
                value={form.material_id}
                onChange={handleItemSelect}
                disabled={productsLoading || materialsLoading}
              >
                <option value="">-- เลือกจากรายการ --</option>

                {productOptions.length > 0 && (
                  <optgroup label="สินค้า">
                    {productOptions.map(it => (
                      <option key={it.key} value={it.key}>
                        {it.code} — {it.name}
                      </option>
                    ))}
                  </optgroup>
                )}

                {materialOptions.length > 0 && (
                  <optgroup label="วัสดุ">
                    {materialOptions.map(it => (
                      <option key={it.key} value={it.key}>
                        {it.code} — {it.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {(productsError || materialsError) && (
                <div className="form-text text-danger">
                  {productsError || materialsError}
                </div>
              )}

              {/* hint ราคาเริ่มต้นตามที่เลือก */}
              {(() => {
                const sel = allOptions.find(i => i.key === form.material_id);
                if (!sel || !sel.price) return null;
                return (
                  <div className="form-text text-muted">
                    ราคาเริ่มต้น: {fmtMoney(sel.price)}
                  </div>
                );
              })()}
            </div>

            {/* ชื่อสินค้า/วัสดุ — auto-fill */}
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
              <input type="number" className="form-control" name="qty" min={1} step="1" value={form.qty} onChange={handleChange} />
            </div>

            <div className="col-md-2">
              <label className="form-label">ราคาต่อหน่วย</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                name="unit_price"
                placeholder="0.00"
                value={form.unit_price}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">ราคารวม</label>
              <input
                type="text"
                className="form-control text-end fw-bold text-success bg-light"
                value={fmtMoney(autoTotal)}   // แสดงเป็น ฿0.00 ได้เมื่อยังไม่มีค่า
                readOnly
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">คำอธิบาย</label>
              <input type="text" className="form-control" name="description" placeholder="รายละเอียดรายการ" value={form.description} onChange={handleChange} />
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
                  <div className={`fw-bold ${draftNet >= 0 ? 'text-success' : 'text-danger'}`}>
                    {fmtMoney(draftNet)}
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
              {/* ตารางรวม (ตัดคอลัมน์ 'จำนวนเงิน' ออก) */}
              <DataTable
                columns={columnsMainNoAmount}
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
