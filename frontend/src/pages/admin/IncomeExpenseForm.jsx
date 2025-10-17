import React, { useRef, useState, useMemo, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { th } from "date-fns/locale";
import DataTable from "react-data-table-component";
import "bootstrap/dist/css/bootstrap.min.css";

registerLocale("th", th);

const host = import.meta.env.VITE_HOST || "";

function todayISO() {
  const tz = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - tz).toISOString().slice(0, 10);
}
function fmtMoney(n) {
  const num = Number(n) || 0;
  return `฿${num.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDateThai(dateStr) {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = (date.getFullYear() + 543).toString();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
}
function computeTotals({ qty, unit_price, type, amount }) {
  const q = Math.max(1, Number(qty) || 1);
  const unit = Math.abs(Number(unit_price) || 0);
  let total = Number.isFinite(Number(amount)) && amount !== "" ? Number(amount) : q * unit;
  if (type === "รายจ่าย") total = -Math.abs(total);
  if (type === "รายรับ") total = Math.abs(total);
  return { q, unit, total };
}
function isoToDate(iso) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}
function dateToISO(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
const ThaiDatePicker = ({ valueISO, onChangeISO, ...props }) => (
  <DatePicker
    selected={isoToDate(valueISO)}
    onChange={(date) => onChangeISO(dateToISO(date))}
    dateFormat="dd/MM/yyyy"
    locale="th"
    className="form-control"
    placeholderText="วัน/เดือน/ปี"
    isClearable
    showYearDropdown
    scrollableYearDropdown
    yearDropdownItemNumber={40}
    {...props}
  />
);

export default function IncomeExpenseForm({ products = [], materials = [] }) {
  const customStyles = {
    rows: { style: { minHeight: "40px" } },
    headCells: { style: { fontWeight: "bold", fontSize: "15px", backgroundColor: "#f8f9fa" } },
    cells: { style: { fontSize: "14px" } },
  };

  // \u2192 ค่าใช้งานร่วม: วันที่ + เลขที่/อ้างอิง (ใช้กับทุกรายการใหม่โดยอัตโนมัติ)
  const [baseDate, setBaseDate] = useState(todayISO());
  const [baseRef, setBaseRef] = useState("");

  const makeEmptyForm = (id) => ({
    id,
    date: baseDate,
    type: "รายรับ",
    source: "store",
    ref_no: baseRef,
    material_id: "",
    code: "",
    name: "",
    qty: 1,
    unit_price: "",
    description: "",
    amount: "",
  });

  const [forms, setForms] = useState([makeEmptyForm(1)]);
  const [itemSearches, setItemSearches] = useState({ "1": "" });
  const [drafts, setDrafts] = useState([]);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  // เปลี่ยนค่า baseDate/baseRef แล้ว propagate ไปยังทุกรายการ
  useEffect(() => {
    setForms((prev) => prev.map((f) => ({ ...f, date: baseDate, ref_no: baseRef })));
  }, [baseDate, baseRef]);

  // Load products/materials locally if not provided via props
  const [productsState, setProductsState] = useState([]);
  const [materialsState, setMaterialsState] = useState([]);
  const productsList = (products && products.length ? products : productsState) || [];
  const materialsList = (materials && materials.length ? materials : materialsState) || [];

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${host}/api/products?status=active`);
        if (!res.ok) throw new Error("load products failed");
        const rows = await res.json();
        setProductsState(Array.isArray(rows) ? rows : []);
      } catch (e) {
        setProductsState([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${host}/api/materials?status=active`);
        if (!res.ok) throw new Error("load materials failed");
        const rows = await res.json();
        const list = Array.isArray(rows) ? rows : [];
        // กรองวัสดุเฉพาะที่สถานะเป็น "แสดง" เท่านั้น
        setMaterialsState(list.filter((m) => (m.status ?? 1) === 1));
      } catch (e) {
        setMaterialsState([]);
      }
    })();
  }, []);

  const productOptions = useMemo(
    () => productsList.map((p) => ({ key: `p:${p.id}`, id: Number(p.id), code: p.product_code || "-", name: p.name || "-", price: Number(p.price) || 0, source: "product" })),
    [productsList]
  );
  const materialOptions = useMemo(
    () => materialsList
      .filter((m) => (m.status ?? 1) === 1)
      .map((m) => ({ key: `m:${m.id}`, id: Number(m.id), code: m.code || "-", name: m.name || "-", price: Number(m.price) || 0, source: "material" })),
    [materialsList]
  );
  const allOptions = useMemo(() => [...productOptions, ...materialOptions], [productOptions, materialOptions]);
  function makeOptionLabel(item) {
    const code = item?.code || "-";
    const name = item?.name || "-";
    return `${code} — ${name}`;
  }
  const findOptionByInput = (value) => {
    const normalized = (value || "").trim().toLowerCase();
    if (!normalized) return null;
    return (
      allOptions.find((it) => makeOptionLabel(it).toLowerCase() === normalized) ||
      allOptions.find((it) => (it.code || "").toLowerCase() === normalized) ||
      allOptions.find((it) => (it.name || "").toLowerCase() === normalized)
    );
  };
  const handleItemInputChange = (index, e) => {
    const value = e.target.value || "";
    setItemSearches((prev) => ({ ...prev, [forms[index].id]: value }));
    const matched = findOptionByInput(value);

    if (!matched) {
      handleChange(index, "material_id", "");
      handleChange(index, "code", "");
      handleChange(index, "name", "");
      return;
    }

    handleChange(index, "material_id", matched.key);
    handleChange(index, "code", matched.code || "");
    handleChange(index, "name", matched.name || "");
    if (forms[index].unit_price === "" || forms[index].unit_price === null || forms[index].unit_price === undefined) {
      handleChange(index, "unit_price", matched.price || "");
    }

    // If user selected by code or name, transform the visible value to "CODE — NAME"
    const lower = value.trim().toLowerCase();
    const byCode = (matched.code || "").toLowerCase() === lower;
    const byName = (matched.name || "").toLowerCase() === lower;
    if (byCode || byName) {
      setItemSearches((prev) => ({ ...prev, [forms[index].id]: makeOptionLabel(matched) }));
    }
  };

  const handleItemInputBlur = (index) => {
    const matched = findOptionByInput(itemSearches[forms[index].id]);
    if (!matched) {
      setItemSearches((prev) => ({ ...prev, [forms[index].id]: "" }));
      handleChange(index, "material_id", "");
      handleChange(index, "code", "");
      handleChange(index, "name", "");
    } else {
      // Normalize display to "CODE — NAME" on blur when a match exists
      setItemSearches((prev) => ({ ...prev, [forms[index].id]: makeOptionLabel(matched) }));
    }
  };

  const handleChange = (index, name, value) => {
    setForms((prevForms) => {
      const newForms = [...prevForms];
      newForms[index] = { ...newForms[index], [name]: value };
      return newForms;
    });
  };

  const addNewForm = () => {
    const newId = (forms.length ? Math.max(...forms.map((f) => f.id)) : 0) + 1;
    setForms((prev) => [...prev, makeEmptyForm(newId)]);
    setItemSearches((prev) => ({ ...prev, [newId]: "" }));
  };

  const removeForm = (index) => {
    const formId = forms[index].id;
    setForms((prev) => prev.filter((_, i) => i !== index));
    setItemSearches((prev) => {
      const ns = { ...prev };
      delete ns[formId];
      return ns;
    });
  };

  const addDraft = (e) => {
    e.preventDefault();

    const newDrafts = forms
      .map((form) => {
        const dateVal = form.date || baseDate || todayISO();
        if (!dateVal || !form.type) return null;

        const { q, unit, total } = computeTotals({ qty: form.qty, unit_price: form.unit_price, type: form.type, amount: form.amount });

        return {
          id: Date.now() + Math.random(),
          date: dateVal,
          time: "",
          type: form.type,
          source: form.source || "store",
          order_no: form.ref_no || "-",
          ref_no: form.ref_no || "",
          material_id: form.material_id || "",
          code: form.code || "",
          name: form.name || form.description || "-",
          qty: q,
          unit_price: unit,
          amount: total,
          description: form.description || "-",
        };
      })
      .filter(Boolean);

    if (newDrafts.length > 0) {
      setDrafts((prev) => [...prev, ...newDrafts]);
      // Reset forms: เหลือ 1 รายการใหม่ โดยใช้ baseDate/baseRef เดิม
      const newId = 1;
      setForms([makeEmptyForm(newId)]);
      setItemSearches({ [newId]: "" });
    }
  };
  const removeDraft = (id) => setDrafts((prev) => prev.filter((d) => d.id !== id));
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
        amount: d.amount,
      })),
    };
    try {
      setSaving(true);
      const res = await fetch(`${host}/api/ledger/bulk`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Save failed");
      clearDrafts();
      // Optionally reload parent
    } catch (err) {
      console.error("saveDrafts error:", err);
      alert("บันทึกล้มเหลว");
    } finally {
      setSaving(false);
    }
  };
  const draftNet = useMemo(() => drafts.reduce((s, d) => s + (Number(d.amount) || 0), 0), [drafts]);
  const columnsDrafts = [
    { name: "ประเภท", selector: (r) => r.type, sortable: true, width: "110px", cell: (r) => <span className={`badge ${r.type === "รายจ่าย" ? "bg-danger" : "bg-success"}`}>{r.type}</span> },
    { name: "รหัสสินค้า/วัสดุ", selector: (r) => r.code || "-", sortable: true, width: "160px", wrap: true },
    { name: "ชื่อสินค้า/วัสดุ", selector: (r) => r.name || "-", sortable: true, wrap: true, grow: 2 },
    { name: "จำนวน", selector: (r) => r.qty ?? 1, sortable: true, right: true, width: "100px", cell: (r) => <span>{Number(r.qty || 1).toLocaleString("th-TH")}</span> },
    { name: "ราคาต่อหน่วย", selector: (r) => r.unit_price ?? r.amount, sortable: true, right: true, width: "150px", cell: (r) => <span>{fmtMoney(r.unit_price ?? r.amount)}</span> },
    { name: "ราคารวม", selector: (r) => r.amount, sortable: true, right: true, width: "160px", cell: (r) => <span className={r.type === "รายจ่าย" ? "text-danger" : "text-success"}>{fmtMoney(r.amount)}</span> },
    { name: "คำอธิบาย", selector: (r) => r.description || "-", sortable: true, wrap: true },
    { name: "จัดการ ", width: "90px", right: true, cell: (row) => <button className="btn btn-sm btn-outline-danger" onClick={() => removeDraft(row.id)}>ลบ</button> },
  ];

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center mb-3">
        <h2 className="mb-0 text-center">บันทึกรายรับ - รายจ่าย (หน้าร้าน)</h2>
      </div>

      <div className="card shadow-sm mb-4" id="section-draft">

        <div className="card-body">
          <form ref={formRef} onSubmit={addDraft}>
            {forms.map((form, index) => (
              <div key={form.id} className="border rounded p-3 mb-3 position-relative">
                {index > 0 && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm position-absolute top-0 end-0 m-2"
                    onClick={() => removeForm(index)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}

                {/* แถวที่ 1: วันที่ + เลขที่/อ้างอิง (แสดงเฉพาะบรรทัดแรก) */}
                {index === 0 && (
                  <div className="row g-3 align-items-end mb-1">
                    <div className="col-md-3 col-lg-2">
                      <label className="form-label">วันที่</label>
                      <ThaiDatePicker valueISO={baseDate} onChangeISO={(iso) => setBaseDate(iso)} />
                    </div>
                    <div className="col-md-4 col-lg-3">
                      <label className="form-label">เลขที่/อ้างอิง</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="เช่น ใบเสร็จ/OR#123"
                        value={baseRef}
                        onChange={(e) => setBaseRef(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* แถวที่ 2: ฟิลด์อื่นทั้งหมด */}
                <div className="row g-3 align-items-end">
                  <div className="col-md-2 col-lg-2">
                    <label className="form-label">ประเภท</label>
                    <select
                      className="form-select"
                      value={form.type}
                      onChange={(e) => handleChange(index, "type", e.target.value)}
                    >
                      <option value="รายรับ">รายรับ</option>
                      <option value="รายจ่าย">รายจ่าย</option>
                    </select>
                  </div>

                  <div className="col-md-4 col-lg-4">
                    <label className="form-label">รหัสสินค้า/วัสดุ</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="พิมพ์เพื่อค้นหา"
                      value={itemSearches[form.id] || ""}
                      onChange={(e) => handleItemInputChange(index, e)}
                      onBlur={() => handleItemInputBlur(index)}
                      list={`materialOptions${form.id}`}
                      autoComplete="off"
                    />
                    <datalist id={`materialOptions${form.id}`}>
                      {allOptions.map((it) => (
                        <option key={`combo:${it.key}`} value={makeOptionLabel(it)} label={makeOptionLabel(it)} />
                      ))}
                      {allOptions.map((it) => (
                        <option key={`code:${it.key}`} value={it.code || ""} label={makeOptionLabel(it)} />
                      ))}
                      {allOptions.map((it) => (
                        <option key={`name:${it.key}`} value={it.name || ""} label={makeOptionLabel(it)} />
                      ))}
                    </datalist>
                  </div>

                  <div className="col-md-2 col-lg-1">
                    <label className="form-label">จำนวน</label>
                    <input
                      type="number"
                      className="form-control"
                      min={1}
                      step="1"
                      value={form.qty}
                      onChange={(e) => handleChange(index, "qty", e.target.value)}
                    />
                  </div>

                  <div className="col-md-2 col-lg-2">
                    <label className="form-label">ราคาต่อหน่วย</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="0.00"
                      value={form.unit_price}
                      onChange={(e) => handleChange(index, "unit_price", e.target.value)}
                    />
                  </div>

                  <div className="col-md-2 col-lg-2">
                    <label className="form-label">ราคารวม</label>
                    <input
                      type="text"
                      className="form-control text-end fw-bold text-success bg-light"
                      value={fmtMoney(computeTotals(form).total)}
                      readOnly
                    />
                  </div>

                  <div className="col-md-4 col-lg-3">
                    <label className="form-label">คำอธิบาย</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="รายละเอียดรายการ"
                      value={form.description}
                      onChange={(e) => handleChange(index, "description", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="d-flex justify-content-between align-items-center mt-3">
              {/* ปุ่มสีเทา + ไอคอน + */}
              <button type="button" className="btn btn-outline-secondary" onClick={addNewForm}>
                <i className="fas fa-plus me-1"></i> + เพิ่มรายการใหม่
              </button>

              {/* ปุ่มสีเขียว */}
              <button type="submit" className="btn btn-success">
                <i className="fas fa-plus me-1"></i> เพิ่มในรายการรอบันทึก
              </button>
            </div>
          </form>

          {drafts.length > 0 && (
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">
                  รายการที่ยังไม่บันทึก
                  {drafts.length > 0 && (
                    <span className="ms-2 text-muted">
                      วันที่: {formatDateThai(drafts[0]?.date)} · เลขที่/อ้างอิง: {drafts[0]?.order_no || "-"}
                    </span>
                  )}
                </h6>
                <div className="btn-group">
                  <button onClick={saveDrafts} className="btn btn-success">
                    <i className="fas fa-save"></i> บันทึกทั้งหมด
                  </button>
                  <button onClick={clearDrafts} className="btn btn-outline-secondary">ล้างทั้งหมด</button>
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
                  <div className="fw-bold">ยอดสุทธิทั้งหมด :</div>
                  <div className={`fw-bold ${draftNet >= 0 ? "text-success" : "text-danger"}`}>{fmtMoney(draftNet)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
