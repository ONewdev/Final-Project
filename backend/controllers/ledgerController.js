const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const db = require('../db');


exports.createBulk = async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (items.length === 0) return res.status(400).json({ message: 'No items' });

  const rows = items.map((it) => {
    // type
    const normalizedType =
      (it.type === 'รายจ่าย' || it.type === 'expense') ? 'expense' : 'income';

    // source (ให้ส่งมาได้: 'store' | 'online'; ถ้าไม่ส่ง = 'store')
    const rawSource = (it.source || '').toString().toLowerCase();
    let normalizedSource = (rawSource === 'online' || rawSource === 'store') ? rawSource : 'store';

    // qty / unit_price (ค่าบวก)
    const qty = Math.max(1, Number(it.qty) || 1);
    const unitPrice = Math.abs(Number(it.unit_price) || 0);

    // amount: ถ้ามี amount ส่งมาให้ถือว่า “อยากกำหนดเอง”
    // ไม่งั้นคำนวณจาก qty*unit_price แล้วปรับสัญลักษณ์ตาม type
    let amt = Number(it.amount);
    if (!Number.isFinite(amt)) {
      amt = qty * unitPrice;
      if (normalizedType === 'expense') amt = -amt;
    } else {
      // ถ้าผู้ใช้ส่ง amount มาเอง: บังคับสัญลักษณ์ให้ถูกทิศอีกชั้น
      if (normalizedType === 'expense' && amt > 0) amt = -amt;
      if (normalizedType === 'income' && amt < 0) amt = -amt;
    }

    const row = {
      entry_date: it.date,                               // YYYY-MM-DD
      type: normalizedType,                              // 'income' | 'expense'
      source: normalizedSource,                          // 'store' | 'online'
      ref_no: it.ref_no || it.order_no || null,          // เลขที่ (อ้างอิง/ใบเสร็จ/OR#...)
      code: it.code || null,                             // รหัสสินค้า/วัสดุ
      name: it.name || it.description || null,           // ชื่อสินค้า/วัสดุ
      qty,
      unit_price: unitPrice,                             // เก็บเป็นค่าบวก
      description: it.description || '-',                // คำอธิบาย
      amount: amt,                                       // ยอดรวมสุดท้าย (ลบถ้า expense)
      category_id: it.category_id || null,
      order_id: it.order_id || null,
      custom_order_id: it.custom_order_id || null,
    };

    // ถ้ามีการอ้างอิง order/custom-order → บังคับ source='online'
    if ((row.order_id || row.custom_order_id) && row.source !== 'online') {
      row.source = 'online';
    }
    return row;
  });

  try {
    await db('ledger_entries').insert(rows);
    res.json({ ok: true, inserted: rows.length });
  } catch (err) {
    console.error('ledger.createBulk error:', err);
    res.status(500).json({ message: 'Insert failed' });
  }
};


exports.list = async (req, res) => {
    const { from, to, source, type } = req.query;
    try {
        const q = db('ledger_entries').select('*');
        if (from) q.where('entry_date', '>=', from);
        if (to) q.where('entry_date', '<=', to);
        if (source && ['online', 'store'].includes(String(source))) q.where('source', source);
        if (type && ['income', 'expense'].includes(String(type))) q.where('type', type);


        const rows = await q.orderBy('entry_date', 'asc').orderBy('id', 'asc');
        res.json(rows);
    } catch (err) {
        console.error('ledger.list error:', err);
        res.status(500).json({ message: 'Fetch failed' });
    }
};

exports.summary = async (req, res) => {
    const { from, to } = req.query;
    try {
        const scoped = db('ledger_entries');
        if (from) scoped.where('entry_date', '>=', from);
        if (to) scoped.where('entry_date', '<=', to);


        const bySource = await scoped
            .clone()
            .select('source')
            .sum({ income: db.raw("CASE WHEN type='income' THEN amount ELSE 0 END") })
            .sum({ expenseAbs: db.raw("CASE WHEN type='expense' THEN -amount ELSE 0 END") })
            .sum({ net: 'amount' })
            .groupBy('source');


        const overall = await scoped
            .clone()
            .select({
                total_income: db.raw("SUM(CASE WHEN type='income' THEN amount ELSE 0 END)"),
                total_expense: db.raw("SUM(CASE WHEN type='expense' THEN -amount ELSE 0 END)"),
                net_total: db.raw('SUM(amount)')
            })
            .first();


        res.json({
            bySource, overall: {
                total_income: Number(overall?.total_income || 0),
                total_expense: Number(overall?.total_expense || 0),
                net_total: Number(overall?.net_total || 0),
            }
        });
    } catch (err) {
        console.error('ledger.summary error:', err);
        res.status(500).json({ message: 'Summary failed' });
    }
};

exports.exportPdf = async (req, res) => {
    const { from, to, source, type, q } = req.query;

    try {
        // ----- Query rows -----
        const qBuilder = db('ledger_entries').select('*');
        if (from) qBuilder.where('entry_date', '>=', from);
        if (to) qBuilder.where('entry_date', '<=', to);
        if (source && ['online', 'store'].includes(String(source))) qBuilder.where('source', source);
        if (type && ['income', 'expense'].includes(String(type))) qBuilder.where('type', type);
        if (q && String(q).trim()) {
            const kw = `%${String(q).trim()}%`;
            qBuilder.where((qb) => {
                qb.where('description', 'like', kw);
                // ถ้าต้องการค้นหาที่ source/type ด้วย (เป็นอังกฤษ): เปิดบรรทัดด้านล่าง
                // .orWhere('source', 'like', kw).orWhere('type', 'like', kw);
            });
        }
        const rows = await qBuilder.orderBy('entry_date', 'asc').orderBy('id', 'asc');

        // ----- Summary -----
        const agg = (arr) => arr.reduce((acc, r) => {
            const amt = Number(r.amount) || 0;
            if (r.type === 'income') acc.income += amt;
            else acc.expense += Math.abs(amt);
            acc.net += amt;
            return acc;
        }, { income: 0, expense: 0, net: 0 });

        const summary = agg(rows);

        // ----- PDF -----
        const doc = new PDFDocument({ size: 'A4', margin: 36 }); // 0.5 นิ้ว
        const fontPath = path.join(__dirname, '../assets/fonts/THSarabunNew.ttf');
        if (fs.existsSync(fontPath)) doc.font(fontPath);

        const fmtMoney = (n) =>
            new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 }).format(Number(n) || 0);

        const writeHeader = () => {
            doc.fontSize(20).text('รายงานรายรับ-รายจ่าย', { align: 'left' });
            doc.moveDown(0.2);
            doc.fontSize(12).fillColor('#555')
                .text(`ช่วงเวลา: ${from || '-'} ถึง ${to || '-'}`);
            doc.text(`ตัวกรอง: ช่องทาง=${source || 'ทั้งหมด'} ประเภท=${type || 'ทั้งหมด'} ค้นหา=${q || '-'}`);
            doc.text(`สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}`);
            doc.moveDown(0.6);
            doc.fillColor('#000');
        };

        const writeSummary = () => {
            const y0 = doc.y;
            const boxW = 170, boxH = 50, gap = 14;
            const xStart = doc.page.margins.left;
            const boxes = [
                { title: 'รวมรายรับ', value: fmtMoney(summary.income) },
                { title: 'รวมรายจ่าย', value: fmtMoney(summary.expense) },
                { title: 'สุทธิ', value: fmtMoney(summary.net) },
            ];
            boxes.forEach((b, i) => {
                const x = xStart + i * (boxW + gap);
                doc.roundedRect(x, y0, boxW, boxH, 8).fill('#f6f7fb').stroke('#e5e7eb');
                doc.fillColor('#374151').fontSize(12).text(b.title, x + 12, y0 + 10, { width: boxW - 24 });
                doc.fontSize(16).fillColor('#111827').text(b.value, x + 12, y0 + 26, { width: boxW - 24 });
            });
            doc.fillColor('#000');
            doc.moveDown(3.5);
        };

        const writeTable = () => {
            const col = [
                { key: 'entry_date', label: 'วันที่', width: 80, align: 'left' },
                { key: 'type', label: 'ประเภท', width: 70, align: 'left', map: v => v === 'expense' ? 'รายจ่าย' : 'รายรับ' },
                { key: 'source', label: 'ช่องทาง', width: 80, align: 'left', map: v => v === 'online' ? 'ออนไลน์' : 'หน้าร้าน' },
                { key: 'description', label: 'รายละเอียด', width: 210, align: 'left' },
                { key: 'amount', label: 'จำนวนเงิน', width: 90, align: 'right', map: v => fmtMoney(v) },
            ];

            // Header strip
            const startX = doc.page.margins.left;
            let y = doc.y;
            doc.rect(startX, y, col.reduce((s, c) => s + c.width, 0), 24).fill('#0ea5e9');
            doc.fillColor('#fff').fontSize(12);
            let x = startX;
            col.forEach(c => {
                doc.text(c.label, x + 8, y + 6, { width: c.width - 16, align: c.align });
                x += c.width;
            });
            doc.fillColor('#000');
            y += 24;

            // Rows
            rows.forEach((r, idx) => {
                const rowH = 24;
                if (y + rowH > doc.page.height - doc.page.margins.bottom) {
                    doc.addPage();
                    y = doc.page.margins.top;
                }
                if (idx % 2 === 1) {
                    doc.rect(startX, y, col.reduce((s, c) => s + c.width, 0), rowH).fill('#f9fafb');
                    doc.fillColor('#000');
                }
                x = startX;
                col.forEach(c => {
                    const raw = r[c.key];
                    const val = c.map ? c.map(raw) : raw;
                    const color = (c.key === 'amount' && Number(r.amount) < 0) ? '#dc2626' : (c.key === 'amount' ? '#16a34a' : '#111827');
                    doc.fillColor(color).fontSize(11)
                        .text(String(val ?? ''), x + 8, y + 6, { width: c.width - 16, align: c.align, ellipsis: true });
                    doc.fillColor('#111827');
                    x += c.width;
                });
                y += rowH;
            });

            // Footer total bar
            if (y + 34 > doc.page.height - doc.page.margins.bottom) {
                doc.addPage(); y = doc.page.margins.top;
            }
            const totalW = col.reduce((s, c) => s + c.width, 0);
            doc.rect(startX, y, totalW, 34).fill('#eef2ff');
            doc.fillColor('#111827').fontSize(12)
                .text('รวมสุทธิ', startX + 8, y + 10, { width: totalW - col[col.length - 1].width - 16, align: 'right' });
            doc.fillColor(summary.net < 0 ? '#dc2626' : '#16a34a').fontSize(14)
                .text(fmtMoney(summary.net), startX + totalW - col[col.length - 1].width + 8, y + 9, { width: col[col.length - 1].width - 16, align: 'right' });
            doc.fillColor('#111827');
            doc.moveDown();
        };

        // ---- Stream response ----
        res.setHeader('Content-Type', 'application/pdf');
        // ชื่อไฟล์ไทย แนะนำ Content-Disposition แบบ attachment พร้อมไฟล์ชื่ออังกฤษสั้น ๆ ปลอดภัยกว่า
        res.setHeader('Content-Disposition', 'attachment; filename=\"ledger-report.pdf\"');

        doc.pipe(res);
        writeHeader();
        writeSummary();
        writeTable();
        doc.end();
    } catch (err) {
        console.error('ledger.exportPdf error:', err);
        res.status(500).json({ message: 'Export PDF failed' });
    }
};      
// ====== รายงานยอดขายออนไลน์ (ต่อออเดอร์ + รายการสินค้าในออเดอร์) ======
exports.onlineSales = async (req, res) => {
  // พารามิเตอร์: ?from=YYYY-MM-DD&to=YYYY-MM-DD&status=approved,shipped,delivered&limit=200&offset=0
  // สถานะที่นับเป็น "ขายแล้ว"
  const DEFAULT_STATUSES = ['approved', 'shipped', 'delivered'];

  try {
    const { from, to, status, limit, offset, tz } = req.query;

    // สร้างลิสต์สถานะที่ยอมรับ
    const rawStatuses = (status || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const statuses = rawStatuses.length ? rawStatuses : DEFAULT_STATUSES;

    // Note เรื่อง timezone:
    // - ถ้าตาราง time_zone ของ MySQL ถูกติดตั้งครบ สามารถใช้ CONVERT_TZ ได้
    // - ถ้าไม่แน่ใจ ใช้ DATE(created_at) แบบเดิม (จะถือวันที่ตาม timezone ของเซิร์ฟเวอร์)
    // ใส่พารามิเตอร์ tz ได้ เช่น tz=+07:00 เพื่อบังคับ
    const tzOffset = /^([+-]\d{2}:\d{2})$/.test(tz || '') ? tz : null;

    const qOrders = db('orders')
      .select(['id', 'created_at', 'status', 'total_price', 'product_list'])
      .whereIn('status', statuses);

    if (from) {
      if (tzOffset) qOrders.andWhereRaw('DATE(CONVERT_TZ(created_at, "+00:00", ?)) >= ?', [tzOffset, from]);
      else qOrders.andWhereRaw('DATE(created_at) >= ?', [from]);
    }
    if (to) {
      if (tzOffset) qOrders.andWhereRaw('DATE(CONVERT_TZ(created_at, "+00:00", ?)) <= ?', [tzOffset, to]);
      else qOrders.andWhereRaw('DATE(created_at) <= ?', [to]);
    }

    qOrders.orderBy('created_at', 'desc');

    const lim = Math.min(Number(limit || 200), 1000);
    const off = Math.max(Number(offset || 0), 0);
    qOrders.limit(lim).offset(off);

    const orders = await qOrders;

    // เอา order_ids ไปดึง order_items + products
    const orderIds = orders.map(o => o.id);
    let itemsByOrder = {};
    if (orderIds.length) {
      const rows = await db('order_items as oi')
        .leftJoin('products as p', 'oi.product_id', 'p.id')
        .select([
          'oi.order_id',
          'oi.product_id',
          'oi.quantity',
          'oi.price',
          db.raw('COALESCE(p.name, "-") as product_name')
        ])
        .whereIn('oi.order_id', orderIds);

      itemsByOrder = rows.reduce((acc, r) => {
        (acc[r.order_id] ||= []).push({
          product_id: r.product_id,
          product_name: r.product_name,
          qty: Number(r.quantity || 0),
          price: Number(r.price || 0),
        });
        return acc;
      }, {});
    }

    const data = orders.map(o => {
      // fallback: ถ้าไม่มี order_items แต่มี product_list เก่าใน orders ก็แปลงมาใช้
      let items = itemsByOrder[o.id] || [];
      if (!items.length && o.product_list) {
        try {
          const parsed = typeof o.product_list === 'string' ? JSON.parse(o.product_list) : o.product_list;
          if (Array.isArray(parsed)) {
            items = parsed.map(x => ({
              product_id: x.product_id || null,
              product_name: x.product_name || '-',
              qty: Number(x.product_qty || x.qty || 0),
              price: Number(x.price || 0),
            }));
          }
        } catch { /* ignore */ }
      }

      return {
        id: o.id,
        created_at: o.created_at,
        status: o.status,
        total_price: Number(o.total_price || 0),
        items
      };
    });

    res.json({ data, limit: lim, offset: off, count: data.length });
  } catch (err) {
    console.error('reports.onlineSales error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ====== สรุปยอดขายออนไลน์แบบ "ตามสินค้า" ======
exports.onlineSalesSummaryByProduct = async (req, res) => {
  const DEFAULT_STATUSES = ['approved', 'shipped', 'delivered'];

  try {
    const { from, to, status, tz } = req.query;
    const rawStatuses = (status || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const statuses = rawStatuses.length ? rawStatuses : DEFAULT_STATUSES;

    const tzOffset = /^([+-]\d{2}:\d{2})$/.test(tz || '') ? tz : null;

    // join orders + order_items + products แล้ว group by สินค้า
    const q = db('orders as o')
      .innerJoin('order_items as oi', 'oi.order_id', 'o.id')
      .leftJoin('products as p', 'oi.product_id', 'p.id')
      .whereIn('o.status', statuses);

    if (from) {
      if (tzOffset) q.andWhereRaw('DATE(CONVERT_TZ(o.created_at, "+00:00", ?)) >= ?', [tzOffset, from]);
      else q.andWhereRaw('DATE(o.created_at) >= ?', [from]);
    }
    if (to) {
      if (tzOffset) q.andWhereRaw('DATE(CONVERT_TZ(o.created_at, "+00:00", ?)) <= ?', [tzOffset, to]);
      else q.andWhereRaw('DATE(o.created_at) <= ?', [to]);
    }

    const rows = await q
      .groupBy('oi.product_id', 'p.name')
      .select([
        'oi.product_id',
        db.raw('COALESCE(p.name, "-") as product_name'),
        db.raw('SUM(oi.quantity) as qty_sold'),
        db.raw('SUM(oi.quantity * oi.price) as revenue')
      ])
      .orderBy('revenue', 'desc');

    // แปลง number ให้ชัด
    const data = rows.map(r => ({
      product_id: r.product_id,
      product_name: r.product_name,
      qty_sold: Number(r.qty_sold || 0),
      revenue: Number(r.revenue || 0),
    }));

    res.json({ data });
  } catch (err) {
    console.error('reports.onlineSalesSummaryByProduct error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
