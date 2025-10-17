import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import DataTable from "react-data-table-component";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { th } from "date-fns/locale";

registerLocale("th", th);

const host = import.meta.env.VITE_HOST || "";

// ---------------- utils ----------------
function todayISO() {
  const tz = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - tz).toISOString().slice(0, 10);
}
function fmtMoney(n) {
  const num = Number(n) || 0;
  return `฿${num.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
function makeOptionLabel(item) {
  const code = item?.code || "-";
  const name = item?.name || "-";
  return `${code} — ${name}`;
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
function formatTimeThai(timeStr) {
  if (!timeStr) return "-";
  try {
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return timeStr;
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

// ---------------- ThaiDatePicker ----------------
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

// ---------------- Component ----------------
export default function IncomeExpensePage() {
  const customStyles = {
    rows: { style: { minHeight: "40px" } },
    headRow: { style: { minHeight: "48px" } },
    headCells: {
      style: {
        fontWeight: 600,
        fontSize: "14px",
        backgroundColor: "#f8f9fa",
        whiteSpace: "normal",       // ✅ ยอมให้ตัดบรรทัด
        lineHeight: "1.2",          // ✅ หัวคอลัมน์ไม่สูงเกิน
        textAlign: "center",        // ✅ จัดกึ่งกลางหัวคอลัมน์
        paddingTop: "10px",
        paddingBottom: "10px",
      },
    },
    cells: { style: { fontSize: "14px" } },
  };

  // ----- States -----
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [filters, setFilters] = useState({ from: "", to: "", source: "all", type: "all", q: "" });
  const [filterItemSearch, setFilterItemSearch] = useState("");
  const [filterItemCode, setFilterItemCode] = useState("");
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState("");

  const printContainerRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setProductsLoading(true);
        setProductsError("");
        const res = await fetch(`${host}/api/products?status=active`);
        if (!res.ok) throw new Error("โหลดสินค้าล้มเหลว");
        const rows = await res.json();
        setProducts(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error("load products error:", e);
        setProducts([]);
        setProductsError("โหลดสินค้าจากระบบไม่สำเร็จ");
      } finally {
        setProductsLoading(false);
      }
    })();
  }, [host]);

  useEffect(() => {
    (async () => {
      try {
        setMaterialsLoading(true);
        setMaterialsError("");
        const res = await fetch(`${host}/api/materials?status=active`);
        if (!res.ok) throw new Error("โหลดวัสดุล้มเหลว");
        const rows = await res.json();
        setMaterials(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error("load materials error:", e);
        setMaterials([]);
        setMaterialsError("โหลดวัสดุจากระบบไม่สำเร็จ");
      } finally {
        setMaterialsLoading(false);
      }
    })();
  }, [host]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${host}/api/ledger`);
        const rows = (await res.json()) || [];
        const mapped = rows.map((r, idx) => ({
          id: r.id ?? idx + 1,
          date: r.date || r.entry_date || (typeof r.created_at === "string" ? r.created_at.slice(0, 10) : null) || (typeof r.createdAt === "string" ? r.createdAt.slice(0, 10) : null) || todayISO(),
          time: r.time || r.entry_time || r.created_at || r.createdAt || r.paid_at || r.order_time || r.updated_at || r.updatedAt || "",
          type:
            r.type === "income" || r.type === 1 || r.type === "รายรับ"
              ? "รายรับ"
              : "รายจ่าย",
          source: r.source || r.channel || "store",
          item_code: r.item_code || r.product_code || r.material_code || r.code || r.sku || r.product_sku || r.order_code || r.order_no || r.ref_no || "",
          item_name: r.item_name || r.product_name || r.material_name || r.name || r.title || r.product || r.product_title || "-",
          qty: Number(r.qty ?? r.quantity ?? 1),
          unit_price: Number(r.unit_price ?? r.price ?? 0),
          amount: Number(r.amount ?? r.total ?? 0),
          note: r.note || r.remark || r.description || "",
          created_at: r.created_at || r.createdAt || null,
        }));
        setData(mapped);
      } catch (e) {
        console.error(e);
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [host]);

  // ---------------- filtering ----------------
  function normalizeDateToISO(dateStr) {
    if (!dateStr) return "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split("/");
      const y = Number(year) > 2500 ? Number(year) - 543 : Number(year);
      return `${y}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
    return dateStr;
  }

  const filteredData = useMemo(() => {
    const { from, to, source, type, q } = filters;
    const fromISO = from ? normalizeDateToISO(from) : null;
    const toISO = to ? normalizeDateToISO(to) : null;
    const fromTime = fromISO ? new Date(`${fromISO}T00:00:00`).getTime() : null;
    const toTime = toISO ? new Date(`${toISO}T23:59:59`).getTime() : null;

    return data.filter((r) => {
      const recordISO = normalizeDateToISO(r.date);
      const d = new Date(`${recordISO}T00:00:00`).getTime();
      if (fromTime && d < fromTime) return false;
      if (toTime && d > toTime) return false;
      if (source !== "all" && String(r.source) !== String(source)) return false;
      if (type !== "all" && r.type !== type) return false;
      const hay = [r.item_code, r.item_name, r.note, r.source, r.type].join(" ").toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (filterItemCode && !(r.item_code || "").toLowerCase().includes(filterItemCode.toLowerCase())) return false;
      if (filterItemSearch && !(r.item_name || "").toLowerCase().includes(filterItemSearch.toLowerCase())) return false;
      return true;
    });
  }, [data, filters, filterItemCode, filterItemSearch]);

  const incomeRows = useMemo(() => filteredData.filter((r) => r.type === "รายรับ"), [filteredData]);
  const expenseRows = useMemo(() => filteredData.filter((r) => r.type === "รายจ่าย"), [filteredData]);
  const incomeTotal = useMemo(() => incomeRows.reduce((s, r) => s + Math.abs(Number(r.amount || r.qty * r.unit_price || 0)), 0), [incomeRows]);
  const expenseTotal = useMemo(() => expenseRows.reduce((s, r) => s + Math.abs(Number(r.amount || r.qty * r.unit_price || 0)), 0), [expenseRows]);
  const netTotal = useMemo(() => incomeTotal - expenseTotal, [incomeTotal, expenseTotal]);

  // ---------------- columns ----------------
  const columnsMainNoAmount = useMemo(
    () => [
      {
        name: <span className="block text-center">วันที่</span>,
        selector: (r) => r.date,
        sortable: true,
        width: "110px",
        center: true,
        cell: (r) => <span>{formatDateThai(r.date)}</span>,
      },
      {
        name: <span className="block text-center">เวลา</span>,
        selector: (r) => r.time,
        sortable: true,
        width: "100px",
        center: true,
        cell: (r) => <span>{formatTimeThai(r.time)}</span>,
      },
      {
        name: <span className="block text-center">ประเภท</span>,
        selector: (r) => r.type,
        sortable: true,
        width: "90px",
        center: true,
        cell: (r) => (
          <span className={r.type === "รายรับ" ? "text-success fw-semibold" : "text-danger fw-semibold"}>{r.type}</span>
        ),
      },
      {
        name: <span className="block text-center">แหล่งที่มา</span>,
        selector: (r) => r.source,
        sortable: true,
        width: "110px",
        center: true,
        cell: (r) => {
          let label = r.source;
          if (label === "store") label = "หน้าร้าน";
          else if (label === "online") label = "ออนไลน์";
          else if (label === "other") label = "อื่น ๆ";
          return <span>{label}</span>;
        },
      },
      {
        name: <span className="block text-center">รหัส / รายการ</span>,
        selector: (r) => `${r.item_code || "-"} ${r.item_name || "-"}`,
        wrap: true,
        grow: 2.2,             // ✅ ให้คอลัมน์นี้กินพื้นที่มากขึ้น
        minWidth: "220px",
        cell: (r) => (
          <div>
            <div className="fw-semibold">{r.item_name || "-"}</div>
            <div className="text-muted small">{r.item_code || "-"}</div>
          </div>
        ),
      },
      {
        name: <span className="block text-center">จำนวน × ราคา</span>,
        selector: (r) => Number(r.qty || 0),
        minWidth: "160px",
        right: true,
        cell: (r) => (
          <span>
            {Number(r.qty || 0).toLocaleString("th-TH")} × {fmtMoney(r.unit_price)}
          </span>
        ),
      },
      {
        id: "total",
        name: <span className="block text-center">รวม</span>,
        selector: (r) => Number(r.amount || r.qty * r.unit_price || 0),
        sortable: true,
        width: "120px",
        right: true,
        center: false,
        cell: (r) => (
          <span className={r.type === "รายรับ" ? "text-success fw-bold" : "text-danger fw-bold"}>
            {fmtMoney(Number(r.amount || r.qty * r.unit_price || 0))}
          </span>
        ),
      },
      {
        name: <span className="block text-center">หมายเหตุ</span>,
        selector: (r) => r.note,
        wrap: true,
        grow: 1.2,
        minWidth: "160px",
      },
    ],
    []
  );

  const columnsCompact = useMemo(
    () => [
      {
        name: <span className="block text-center">วันที่</span>,
        selector: (r) => r.date,
        sortable: true,
        width: "110px",
        center: true,
        cell: (r) => formatDateThai(r.date),
      },
      {
        name: <span className="block text-center">รหัส / รายการ</span>,
        selector: (r) => `${r.item_code || "-"} ${r.item_name || "-"}`,
        wrap: true,
        grow: 2.2,
        minWidth: "220px",
      },
      {
        name: <span className="block text-center">จำนวน</span>,
        selector: (r) => Number(r.qty || 0),
        width: "90px",
        right: true,
      },
      {
        name: <span className="block text-center">ราคา/หน่วย</span>,
        selector: (r) => Number(r.unit_price || 0),
        width: "120px",
        right: true,
        cell: (r) => fmtMoney(r.unit_price || 0),
      },
      {
        id: "total",
        name: <span className="block text-center">รวม</span>,
        selector: (r) => Number(r.amount || r.qty * r.unit_price || 0),
        sortable: true,
        width: "120px",
        right: true,
        cell: (r) => <strong>{fmtMoney(Number(r.amount || r.qty * r.unit_price || 0))}</strong>,
      },
    ],
    []
  );

  // ---------------- export (Excel/PDF) ----------------
  const exportExcel = () => {
    const rows = filteredData.map((r) => {
      let sourceLabel = r.source;
      if (sourceLabel === "store") sourceLabel = "หน้าร้าน";
      else if (sourceLabel === "online") sourceLabel = "ออนไลน์";
      else if (sourceLabel === "other") sourceLabel = "อื่น ๆ";
      return {
        วันที่: formatDateThai(r.date),
        เวลา: formatTimeThai(r.time),
        ประเภท: r.type,
        แหล่งที่มา: sourceLabel,
        รหัส: r.item_code || "-",
        รายการ: r.item_name || "-",
        จำนวน: Number(r.qty || 0),
        ราคา_หน่วย: Number(r.unit_price || 0),
        รวม: Number(r.amount || r.qty * r.unit_price || 0),
        หมายเหตุ: r.note || "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ledger");
    XLSX.writeFile(wb, `รายรับรายจ่าย_${filters.from || "all"}_${filters.to || "all"}.xlsx`);
  };

  const exportPDF = () => {
    const printable = printContainerRef.current;
    if (!printable) return;
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    const html = `
      <html>
        <head>
          <title>รายรับ-รายจ่าย</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: Tahoma, 'sans-serif'; padding: 16px; }
            h2 { margin: 0 0 8px 0; }
            .muted { color: #666; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
            th { background: #f2f2f2; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h2>สรุปรายรับ-รายจ่าย</h2>
          <div class="muted">ช่วง: ${filters.from || '-'} ถึง ${filters.to || '-'}</div>
          ${printable.innerHTML}
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };</script>
        </body>
      </html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const downloadPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      const t = String(filters.type || "");
      if (t && t !== "all") {
        if (t === "รายรับ") params.set("type", "income");
        else if (t === "รายจ่าย") params.set("type", "expense");
      }
      const s = String(filters.source || "");
      if (s && s !== "all") params.set("source", s);
      if (filters.q) params.set("q", filters.q);
      if (splitView) params.set("split", "true");

      const url = `${host}/api/ledger/export/pdf${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to export PDF");
      const blob = await res.blob();
      const fileURL = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = fileURL;
      a.download = `ledger_${filters.from || "all"}_${filters.to || "all"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(fileURL);
    } catch (e) {
      console.error("downloadPDF error:", e);
      alert("Failed to export PDF");
    }
  };

  // ---------------- FilterBar ----------------
  const FilterBar = () => (
    <div className="card mb-3">
      <div className="card-header py-3 d-flex align-items-center justify-content-between bg-light">
        <div className="d-flex align-items-center">
          <i className="fas fa-filter text-primary me-2"></i>
          <strong>ตัวกรอง</strong>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setFilters({ from: "", to: "", source: "all", type: "all", q: "" })}
          title="ล้างตัวกรองทั้งหมด"
        >
          <i className="fas fa-times me-1"></i>
          ล้างตัวกรอง
        </button>
      </div>
      <div className="card-body p-4">
        {/* Row 1: Date & Selects */}
        <div className="row g-3 align-items-end">
          <div className="col-sm-6 col-md-3">
            <label className="form-label" htmlFor="fromDate">
              <i className="fas fa-calendar-alt me-2 text-primary"></i>
              ตั้งแต่วันที่
            </label>
            <ThaiDatePicker
              valueISO={filters.from}
              onChangeISO={(v) => setFilters((s) => ({ ...s, from: v }))}
              id="fromDate"
              className="form-control shadow-sm"
            />
          </div>
          <div className="col-sm-6 col-md-3">
            <label className="form-label" htmlFor="toDate">
              <i className="fas fa-calendar-alt me-2 text-primary"></i>
              ถึงวันที่
            </label>
            <ThaiDatePicker
              valueISO={filters.to}
              onChangeISO={(v) => setFilters((s) => ({ ...s, to: v }))}
              id="toDate"
              className="form-control shadow-sm"
            />
          </div>
          <div className="col-sm-6 col-md-2">
            <label className="form-label" htmlFor="typeSelect">
              <i className="fas fa-tag me-2 text-primary"></i>
              ประเภท
            </label>
            <select
              id="typeSelect"
              className="form-select shadow-sm"
              value={filters.type}
              onChange={(e) => setFilters((s) => ({ ...s, type: e.target.value }))}
            >
              <option value="all">ทั้งหมด</option>
              <option value="รายรับ">รายรับ</option>
              <option value="รายจ่าย">รายจ่าย</option>
            </select>
          </div>
          <div className="col-sm-6 col-md-2">
            <label className="form-label" htmlFor="sourceSelect">
              <i className="fas fa-shopping-bag me-2 text-primary"></i>
              แหล่งที่มา
            </label>
            <select
              id="sourceSelect"
              className="form-select shadow-sm"
              value={filters.source}
              onChange={(e) => setFilters((s) => ({ ...s, source: e.target.value }))}
            >
              <option value="all">ทั้งหมด</option>
              <option value="store">หน้าร้าน</option>
              <option value="online">ออนไลน์</option>
              <option value="other">อื่น ๆ</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label" htmlFor="searchAll">ค้นหา</label>
            <div className="input-group">
              <input
                id="searchAll"
                type="text"
                className="form-control"
                placeholder="คำค้น (รหัส/ชื่อ/หมายเหตุ)"
                value={filters.q}
                onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))}
                autoComplete="off"
              />
              {filters.q && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setFilters((s) => ({ ...s, q: "" }))}
                  title="ล้างคำค้น"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Code/Name search + View switch */}
        <div className="row g-2 mt-2 align-items-end">
          <div className="col-sm-6 col-md-3">
            <label className="form-label" htmlFor="searchCode">
              <i className="fas fa-barcode me-2 text-primary"></i>
              ค้นหาตามรหัส
            </label>
            <div className="input-group">
              <input
                id="searchCode"
                type="text"
                className="form-control shadow-sm"
                placeholder="เช่น SCR-GR-120x180"
                value={filterItemCode}
                onChange={(e) => setFilterItemCode(e.target.value)}
                autoComplete="off"
              />
              {filterItemCode && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setFilterItemCode("")}
                  title="ล้างรหัส"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <div className="col-sm-6 col-md-3">
            <label className="form-label" htmlFor="searchName">
              <i className="fas fa-search me-2 text-primary"></i>
              ค้นหาตามชื่อรายการ
            </label>
            <div className="input-group">
              <input
                id="searchName"
                type="text"
                className="form-control shadow-sm"
                placeholder="เช่น บานสวิงดำ, กระจกใส 6 มม."
                value={filterItemSearch}
                onChange={(e) => setFilterItemSearch(e.target.value)}
                autoComplete="off"
              />
              {filterItemSearch && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setFilterItemSearch("")}
                  title="ล้างชื่อรายการ"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <div className="col-md-6 d-flex justify-content-end align-items-center gap-3">
            <div className="form-check form-switch">
              <input
                id="splitSwitch"
                className="form-check-input"
                type="checkbox"
                checked={splitView}
                onChange={(e) => setSplitView(e.target.checked)}
              />
              <label htmlFor="splitSwitch" className="form-check-label ms-2">แยกตาราง รายรับ/รายจ่าย</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ---------------- Render ----------------
  return (
    <div className="container py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="m-0">รายงาน รายรับ-รายจ่าย</h2>
      </div>

      <FilterBar />

      {/* Summary */}
      <div className="row g-3 mb-3" ref={printContainerRef}>
        <div className="col-md-4">
          <div className="card border-success">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div className="small text-muted">รายรับรวม</div>
                <div className="fs-5 fw-bold text-success">{fmtMoney(incomeTotal)}</div>
              </div>
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
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className={`card ${netTotal >= 0 ? "border-success" : "border-danger"}`}>
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div className="small text-muted">ยอดต่าง (รายรับ - รายจ่าย)</div>
                <div className={`fs-5 fw-bold ${netTotal >= 0 ? "text-success" : "text-danger"}`}>{fmtMoney(netTotal)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Records */}
        <div className="card shadow-sm mt-3" id="section-records">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <span className="me-2">📒</span>
              <strong>รายการบันทึกทั้งหมด</strong>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-success" onClick={exportExcel}>
                <i className="fas fa-file-excel" /> รายงาน Excel
              </button>
              <button className="btn btn-danger" onClick={downloadPDF} title="ดาวน์โหลด PDF ผ่านเซิร์ฟเวอร์">
                <i className="fas fa-file-download" /> รายงาน PDF
              </button>
            </div>
          </div>

          <div className="card-body">
            {splitView ? (
              <>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="card h-100">
                      <div className="card-header text-center">
                        <div className="d-inline-flex align-items-center gap-2">
                          <strong className="text-success">รายรับ</strong>
                        </div>
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
                          dense
                          noDataComponent={<div className="py-4">ไม่พบข้อมูลรายรับในช่วงที่เลือก</div>}
                        />
                      </div>
                      <div className="card-footer d-flex justify-content-end">
                        <div className="text-end">
                          <div className="small text-muted">รวมรายรับ</div>
                          <div className="fw-bold text-success">{fmtMoney(incomeTotal)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <div className="card h-100">
                      <div className="card-header text-center">
                        <div className="d-inline-flex align-items-center gap-2">
                          <strong className="text-danger">รายจ่าย</strong>
                        </div>
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
                          dense
                          noDataComponent={<div className="py-4">ไม่พบข้อมูลรายจ่ายในช่วงที่เลือก</div>}
                        />
                      </div>
                      <div className="card-footer d-flex justify-content-end">
                        <div className="text-end">
                          <div className="small text-muted">รวมรายจ่าย</div>
                          <div className="fw-bold text-danger">{fmtMoney(expenseTotal)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-2">
                  <div className="text-end">
                    <div className="small text-muted">ยอดสุทธิ (รายรับ - รายจ่าย)</div>
                    <div className={`fs-5 fw-bold ${netTotal >= 0 ? "text-success" : "text-danger"}`}>{fmtMoney(netTotal)}</div>
                  </div>
                </div>
              </>
            ) : (
              <>
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
                  fixedHeader
                  fixedHeaderScrollHeight="520px"
                  dense
                  noDataComponent={<div className="py-4">ไม่พบข้อมูลในช่วงและเงื่อนไขที่เลือก</div>}
                />
                <div className="d-flex justify-content-end mt-3">
                  <div className="text-end">
                    <div className="fw-bold">สุทธิ:</div>
                    <div className={`fw-bold ${netTotal >= 0 ? "text-success" : "text-danger"}`}>{fmtMoney(netTotal)}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {(productsLoading || materialsLoading || productsError || materialsError) && (
        <div className="row g-3">
          <div className="col-md-6">
            <div className="small text-muted">
              สินค้า: {productsLoading ? "กำลังโหลด…" : productsError ? productsError : `${products.length} รายการ`}
            </div>
          </div>
          <div className="col-md-6">
            <div className="small text-muted text-md-end">
              วัสดุ: {materialsLoading ? "กำลังโหลด…" : materialsError ? materialsError : `${materials.length} รายการ`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
