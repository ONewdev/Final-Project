const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const db = require('../db');

const OPTIONAL_LEDGER_COLUMNS = ['category_id', 'order_id', 'custom_order_id'];
let ledgerColumnSupportCache = null;

async function getLedgerColumnSupport() {
  if (ledgerColumnSupportCache) return ledgerColumnSupportCache;
  try {
    const entries = await Promise.all(
      OPTIONAL_LEDGER_COLUMNS.map(async (name) => [name, await db.schema.hasColumn('ledger_entries', name)])
    );
    ledgerColumnSupportCache = entries.reduce((acc, [name, exists]) => {
      acc[name] = Boolean(exists);
      return acc;
    }, {});
  } catch (err) {
    console.error('ledger.getLedgerColumnSupport error:', err);
    ledgerColumnSupportCache = OPTIONAL_LEDGER_COLUMNS.reduce((acc, name) => {
      acc[name] = false;
      return acc;
    }, {});
  }
  return ledgerColumnSupportCache;
}

exports.createBulk = async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (items.length === 0) return res.status(400).json({ message: 'No items' });

  const columnSupport = await getLedgerColumnSupport();

  const rows = items.map((it) => {
    const typeRaw = (it.type ?? '').toString().trim();
    const typeLower = typeRaw.toLowerCase();
    const thaiExpense = 'รายจ่าย';
    const isExpense =
      typeLower === 'expense' ||
      typeRaw === thaiExpense ||
      typeLower === thaiExpense;
    const normalizedType = isExpense ? 'expense' : 'income';

    const rawSource = (it.source ?? '').toString().toLowerCase();
    let normalizedSource = rawSource === 'online' || rawSource === 'store' ? rawSource : 'store';
    if (it.order_id || it.custom_order_id) normalizedSource = 'online';

    const qty = Math.max(1, Number(it.qty) || 1);
    const unitPrice = Math.abs(Number(it.unit_price) || 0);

    let amt = Number(it.amount);
    if (!Number.isFinite(amt)) {
      amt = qty * unitPrice;
      if (normalizedType === 'expense') amt = -amt;
    } else {
      if (normalizedType === 'expense' && amt > 0) amt = -amt;
      if (normalizedType === 'income' && amt < 0) amt = -amt;
    }

    const row = {
      entry_date: it.date,
      type: normalizedType,
      source: normalizedSource,
      ref_no: it.ref_no || it.order_no || null,
      code: it.code || null,
      name: it.name || it.description || null,
      qty,
      unit_price: unitPrice,
      description: it.description || '-',
      amount: amt,
    };

    if (columnSupport.category_id) row.category_id = it.category_id || null;
    if (columnSupport.order_id) row.order_id = it.order_id || null;
    if (columnSupport.custom_order_id) row.custom_order_id = it.custom_order_id || null;

    if (
      row.source !== 'online' &&
      (
        (columnSupport.order_id && row.order_id) ||
        (columnSupport.custom_order_id && row.custom_order_id) ||
        it.order_id ||
        it.custom_order_id
      )
    ) {
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

        let rows = await q.orderBy('entry_date', 'asc').orderBy('id', 'asc');

        // Include online order incomes to align with the report view
        const includeOnline = (!source || String(source) === 'all') && (!type || String(type).toLowerCase() === 'all' || String(type).toLowerCase() === 'income');
        if (includeOnline) {
          try {
            const hasOrders = await db.schema.hasTable('orders');
            if (hasOrders) {
              const DEFAULT_STATUSES = ['approved', 'shipped', 'delivered'];
              const qOrders = db('orders')
                .select(['id', 'created_at', 'status', 'total_price', 'product_list'])
                .whereIn('status', DEFAULT_STATUSES);
              if (from) qOrders.andWhereRaw('DATE(created_at) >= ?', [from]);
              if (to) qOrders.andWhereRaw('DATE(created_at) <= ?', [to]);
              const orders = await qOrders.orderBy('created_at', 'desc');

              const orderIds = orders.map(o => o.id);
              let itemsByOrder = {};
              if (orderIds.length) {
                const hasOrderItems = await db.schema.hasTable('order_items');
                if (hasOrderItems) {
                  const itemRows = await db('order_items as oi')
                    .leftJoin('products as p', 'oi.product_id', 'p.id')
                    .select([
                      'oi.order_id',
                      'oi.product_id',
                      'oi.quantity',
                      'oi.price',
                      db.raw('COALESCE(p.name, "-") as product_name')
                    ])
                    .whereIn('oi.order_id', orderIds);

                  itemsByOrder = itemRows.reduce((acc, r) => {
                    (acc[r.order_id] ||= []).push({
                      product_id: r.product_id,
                      product_name: r.product_name,
                      qty: Number(r.quantity || 0),
                      price: Number(r.price || 0),
                    });
                    return acc;
                  }, {});
                }
              }

              const onlineRows = [];
              for (const o of orders) {
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

                const d = new Date(o.created_at);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;

                if (items.length) {
                  for (const it of items) {
                    const amount = Number(it.qty || 0) * Math.abs(Number(it.price || 0));
                    if (!amount) continue;
                    const desc = `Order #${o.id} - ${it.product_name || '-'}`;
                    onlineRows.push({ entry_date: dateStr, type: 'income', source: 'online', description: desc, amount });
                  }
                } else {
                  const total = Math.abs(Number(o.total_price || 0));
                  if (!total) continue;
                  onlineRows.push({ entry_date: dateStr, type: 'income', source: 'online', description: `Order #${o.id}`, amount: total });
                }
              }

              if (onlineRows.length) {
                rows = rows.concat(onlineRows);
                rows.sort((a, b) => {
                  const da = new Date(a.entry_date).getTime();
                  const db = new Date(b.entry_date).getTime();
                  if (da !== db) return da - db;
                  return String(a.description || '').localeCompare(String(b.description || ''));
                });
              }
            }
          } catch (e) {
            console.error('ledger.list includeOnline error:', e);
          }
        }

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
        if (type && String(type).trim() && String(type).trim().toLowerCase() !== 'all') {
            qBuilder.where('type', type);
        }
        if (q && String(q).trim()) {
            const kw = `%${String(q).trim()}%`;
            qBuilder.where((qb) => {
                qb.where('description', 'like', kw);
            });
        }
        let rows = await qBuilder.orderBy('entry_date', 'asc').orderBy('id', 'asc');

        // Include online order incomes to match the UI combined view
        const includeOnline = (!source || String(source) === 'all') && (!type || String(type).toLowerCase() === 'all' || String(type).toLowerCase() === 'income');
        if (includeOnline) {
            const DEFAULT_STATUSES = ['approved', 'shipped', 'delivered'];
            const qOrders = db('orders')
                .select(['id', 'created_at', 'status', 'total_price', 'product_list'])
                .whereIn('status', DEFAULT_STATUSES);
            if (from) qOrders.andWhereRaw('DATE(created_at) >= ?', [from]);
            if (to) qOrders.andWhereRaw('DATE(created_at) <= ?', [to]);
            const orders = await qOrders.orderBy('created_at', 'desc');

            const orderIds = orders.map(o => o.id);
            let itemsByOrder = {};
            if (orderIds.length) {
                const itemRows = await db('order_items as oi')
                    .leftJoin('products as p', 'oi.product_id', 'p.id')
                    .select([
                        'oi.order_id',
                        'oi.product_id',
                        'oi.quantity',
                        'oi.price',
                        db.raw('COALESCE(p.name, "-") as product_name')
                    ])
                    .whereIn('oi.order_id', orderIds);

                itemsByOrder = itemRows.reduce((acc, r) => {
                    (acc[r.order_id] ||= []).push({
                        product_id: r.product_id,
                        product_name: r.product_name,
                        qty: Number(r.quantity || 0),
                        price: Number(r.price || 0),
                    });
                    return acc;
                }, {});
            }

            const onlineRows = [];
            for (const o of orders) {
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

                const d = new Date(o.created_at);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;

                if (items.length) {
                    for (const it of items) {
                        const amount = Number(it.qty || 0) * Math.abs(Number(it.price || 0));
                        if (!amount) continue;
                        const desc = `Order #${o.id} - ${it.product_name || '-'}`;
                        onlineRows.push({ entry_date: dateStr, type: 'income', source: 'online', description: desc, amount });
                    }
                } else {
                    const total = Math.abs(Number(o.total_price || 0));
                    if (!total) continue;
                    onlineRows.push({ entry_date: dateStr, type: 'income', source: 'online', description: `Order #${o.id}`, amount: total });
                }
            }

            let filteredOnline = onlineRows;
            if (q && String(q).trim()) {
                const qLower = String(q).trim().toLowerCase();
                filteredOnline = onlineRows.filter(r => String(r.description || '').toLowerCase().includes(qLower));
            }

            if (filteredOnline.length) {
                rows = rows.concat(filteredOnline);
                rows.sort((a, b) => {
                    const da = new Date(a.entry_date).getTime();
                    const db = new Date(b.entry_date).getTime();
                    if (da !== db) return da - db;
                    return String(a.description || '').localeCompare(String(b.description || ''));
                });
            }
        }

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
        const isSplit = req.query.split === 'true';
        // Use landscape layout for split view so page is horizontal but text stays upright
        const doc = new PDFDocument({ size: 'A4', margin: 36, layout: isSplit ? 'landscape' : 'portrait' });
        const fontPath = path.join(__dirname, '../fonts/NotoSansThai-Regular.ttf');
        if (fs.existsSync(fontPath)) {
            doc.registerFont('thai', fontPath);
            doc.font('thai');
        } else {
            console.error('ไม่พบไฟล์ฟอนต์ภาษาไทย:', fontPath);
            doc.font('Helvetica');
        }

        // โลโก้บริษัท (ถ้ามี)
        const logoPath = path.join(__dirname, '../public/logo.png');
        const hasLogo = fs.existsSync(logoPath);

        const fmtMoney = (n) =>
            new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 }).format(Number(n) || 0);

        const writeHeader = () => {
            if (hasLogo) {
                doc.image(logoPath, doc.page.margins.left, doc.page.margins.top, { width: 60 });
                doc.moveDown(0.5);
            }
            doc.font('thai').fontSize(22).fillColor('#0ea5e9').text('รายงานรายรับ-รายจ่าย', hasLogo ? doc.page.margins.left + 70 : doc.page.margins.left, doc.page.margins.top, { align: 'left' });
            doc.moveDown(0.2);
            // Add clear sub-title for report topic
            doc.fontSize(16).fillColor('#111827')
                .text('รายรับ - รายจ่าย', hasLogo ? doc.page.margins.left + 70 : doc.page.margins.left, doc.y + 2, { align: 'left' });
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
            const boxW = 170, boxH = 54, gap = 14;
            const xStart = doc.page.margins.left;
            const boxes = [
                { title: 'รวมรายรับ', value: fmtMoney(summary.income), color: '#16a34a' },
                { title: 'รวมรายจ่าย', value: fmtMoney(summary.expense), color: '#dc2626' },
                { title: 'สุทธิ', value: fmtMoney(summary.net), color: summary.net < 0 ? '#dc2626' : '#16a34a' },
            ];
            boxes.forEach((b, i) => {
                const x = xStart + i * (boxW + gap);
                doc.roundedRect(x, y0, boxW, boxH, 8).fill('#f6f7fb').stroke('#0ea5e9');
                doc.fillColor('#374151').font('thai').fontSize(13).text(b.title, x + 12, y0 + 12, { width: boxW - 24 });
                doc.fontSize(18).fillColor(b.color).text(b.value, x + 12, y0 + 28, { width: boxW - 24 });
            });
            doc.fillColor('#000');
            doc.moveDown(3.5);
        };

        // ฟังก์ชันวาดตาราง (reuse ได้)
        const writeTableSection = (rows, label) => {
            // ฟังก์ชันแปลงวันที่เป็นเลขอารบิกปกติ
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                if (isNaN(d)) return String(dateStr);
                // yyyy-MM-dd
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            };

            const col = [
                { key: 'entry_date', label: 'วันที่', width: 80, align: 'left', map: formatDate },
                { key: 'source', label: 'ช่องทาง', width: 80, align: 'left', map: v => v === 'online' ? 'ออนไลน์' : 'หน้าร้าน' },
                { key: 'description', label: 'รายละเอียด', width: 210, align: 'left' },
                { key: 'amount', label: 'จำนวนเงิน', width: 90, align: 'right', map: v => fmtMoney(v) },
            ];

            // Header strip
            const startX = doc.page.margins.left;
            let y = doc.y;
            doc.roundedRect(startX, y, col.reduce((s, c) => s + c.width, 0), 26, 6).fill('#0ea5e9');
            doc.fillColor('#fff').font('thai').fontSize(13);
            let x = startX;
            col.forEach(c => {
                doc.text(c.label, x + 8, y + 7, { width: c.width - 16, align: c.align });
                x += c.width;
            });
            doc.fillColor('#000');
            y += 26;

            // Rows
            rows.forEach((r, idx) => {
                const rowH = 25;
                if (y + rowH > doc.page.height - doc.page.margins.bottom - 40) {
                    doc.addPage();
                    y = doc.page.margins.top;
                }
                // เส้นแบ่งระหว่างแถว
                doc.moveTo(startX, y).lineTo(startX + col.reduce((s, c) => s + c.width, 0), y).stroke('#e5e7eb');
                if (idx % 2 === 1) {
                    doc.rect(startX, y, col.reduce((s, c) => s + c.width, 0), rowH).fill('#f9fafb');
                    doc.fillColor('#000');
                }
                x = startX;
                col.forEach(c => {
                    const raw = r[c.key];
                    const val = c.map ? c.map(raw) : raw;
                    const color = (c.key === 'amount' && Number(r.amount) < 0) ? '#dc2626' : (c.key === 'amount' ? '#16a34a' : '#111827');
                    doc.fillColor(color).font('thai').fontSize(12)
                        .text(String(val ?? ''), x + 8, y + 7, { width: c.width - 16, align: c.align, ellipsis: true });
                    doc.fillColor('#111827');
                    x += c.width;
                });
                y += rowH;
            });

            // Footer total bar
            if (y + 38 > doc.page.height - doc.page.margins.bottom - 40) {
                doc.addPage(); y = doc.page.margins.top;
            }
            const totalW = col.reduce((s, c) => s + c.width, 0);
            doc.roundedRect(startX, y, totalW, 38, 8).fill('#eef2ff');
            doc.fillColor('#111827').font('thai').fontSize(13)
                .text('รวมสุทธิ', startX + 8, y + 13, { width: totalW - col[col.length - 1].width - 16, align: 'right' });
            const totalAmount = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
            doc.fillColor(totalAmount < 0 ? '#dc2626' : '#16a34a').fontSize(16)
                .text(fmtMoney(totalAmount), startX + totalW - col[col.length - 1].width + 8, y + 12, { width: col[col.length - 1].width - 16, align: 'right' });
            doc.fillColor('#111827');
            doc.moveDown();
        };

        const writeTable = () => {
            // ฟังก์ชันแปลงวันที่เป็นเลขอารบิกปกติ
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                if (isNaN(d)) return String(dateStr);
                // yyyy-MM-dd
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            };

            const col = [
                { key: 'entry_date', label: 'วันที่', width: 80, align: 'left', map: formatDate },
                { key: 'type', label: 'ประเภท', width: 70, align: 'left', map: v => v === 'expense' ? 'รายจ่าย' : 'รายรับ' },
                { key: 'source', label: 'ช่องทาง', width: 80, align: 'left', map: v => v === 'online' ? 'ออนไลน์' : 'หน้าร้าน' },
                { key: 'description', label: 'รายละเอียด', width: 210, align: 'left' },
                { key: 'amount', label: 'จำนวนเงิน', width: 90, align: 'right', map: v => fmtMoney(v) },
            ];

            // Header strip
            const startX = doc.page.margins.left;
            let y = doc.y;
            doc.roundedRect(startX, y, col.reduce((s, c) => s + c.width, 0), 26, 6).fill('#0ea5e9');
            doc.fillColor('#fff').font('thai').fontSize(13);
            let x = startX;
            col.forEach(c => {
                doc.text(c.label, x + 8, y + 7, { width: c.width - 16, align: c.align });
                x += c.width;
            });
            doc.fillColor('#000');
            y += 26;

            // Rows
            rows.forEach((r, idx) => {
                const rowH = 25;
                if (y + rowH > doc.page.height - doc.page.margins.bottom - 40) {
                    doc.addPage();
                    y = doc.page.margins.top;
                }
                // เส้นแบ่งระหว่างแถว
                doc.moveTo(startX, y).lineTo(startX + col.reduce((s, c) => s + c.width, 0), y).stroke('#e5e7eb');
                if (idx % 2 === 1) {
                    doc.rect(startX, y, col.reduce((s, c) => s + c.width, 0), rowH).fill('#f9fafb');
                    doc.fillColor('#000');
                }
                x = startX;
                col.forEach(c => {
                    const raw = r[c.key];
                    const val = c.map ? c.map(raw) : raw;
                    const color = (c.key === 'amount' && Number(r.amount) < 0) ? '#dc2626' : (c.key === 'amount' ? '#16a34a' : '#111827');
                    doc.fillColor(color).font('thai').fontSize(12)
                        .text(String(val ?? ''), x + 8, y + 7, { width: c.width - 16, align: c.align, ellipsis: true });
                    doc.fillColor('#111827');
                    x += c.width;
                });
                y += rowH;
            });

            // Footer total bar
            if (y + 38 > doc.page.height - doc.page.margins.bottom - 40) {
                doc.addPage(); y = doc.page.margins.top;
            }
            const totalW = col.reduce((s, c) => s + c.width, 0);
            doc.roundedRect(startX, y, totalW, 38, 8).fill('#eef2ff');
            doc.fillColor('#111827').font('thai').fontSize(13)
                .text('รวมสุทธิ', startX + 8, y + 13, { width: totalW - col[col.length - 1].width - 16, align: 'right' });
            doc.fillColor(summary.net < 0 ? '#dc2626' : '#16a34a').fontSize(16)
                .text(fmtMoney(summary.net), startX + totalW - col[col.length - 1].width + 8, y + 12, { width: col[col.length - 1].width - 16, align: 'right' });
            doc.fillColor('#111827');
            doc.moveDown();
        };

        // Footer: หมายเหตุ/ช่องทางติดต่อ
        // Two-column split (income left, expense right) when splitting
        const writeTwoColumnSplit = (leftRows, rightRows) => {
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                if (isNaN(d)) return String(dateStr);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            };

            const gap = 16;
            const contentW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
            const panelW = Math.floor((contentW - gap) / 2);
            const leftX = doc.page.margins.left;
            const rightX = leftX + panelW + gap;

            const rowH = 22;
            const headerH = 26;

            const buildCols = (panelWidth) => {
                const dateW = 80;
                const amountW = 90;
                const descW = Math.max(120, panelWidth - dateW - amountW);
                return [
                    { key: 'entry_date', label: 'วันที่', width: dateW, align: 'left', map: formatDate },
                    { key: 'description', label: 'รายละเอียด', width: descW, align: 'left' },
                    { key: 'amount', label: 'ยอดเงิน', width: amountW, align: 'right', map: v => fmtMoney(v) },
                ];
            };
            const leftCols = buildCols(panelW);
            const rightCols = buildCols(panelW);

            const drawHeader = (x, y, cols, title, accent) => {
                doc.fillColor(accent).font('thai').fontSize(15).text(title, x, y - 8, { width: panelW });
                const totalW = cols.reduce((s, c) => s + c.width, 0);
                doc.roundedRect(x, y, totalW, headerH, 6).fill('#0ea5e9');
                doc.fillColor('#fff').fontSize(12);
                let cx = x;
                cols.forEach(c => { doc.text(c.label, cx + 8, y + 6, { width: c.width - 16, align: c.align }); cx += c.width; });
                doc.fillColor('#111827');
            };

            const drawRow = (x, y, cols, r, isIncome) => {
                const totalW = cols.reduce((s, c) => s + c.width, 0);
                doc.moveTo(x, y).lineTo(x + totalW, y).stroke('#e5e7eb');
                let cx = x;
                cols.forEach(c => {
                    const raw = r[c.key];
                    const val = c.map ? c.map(raw) : raw;
                    const color = c.key === 'amount' ? (isIncome ? '#16a34a' : '#dc2626') : '#111827';
                    doc.fillColor(color).font('thai').fontSize(11)
                        .text(String(val ?? ''), cx + 8, y + 5, { width: c.width - 16, align: c.align, ellipsis: true });
                    doc.fillColor('#111827'); cx += c.width;
                });
            };

            const drawTotals = (x, y, cols, rows, accent) => {
                const totalW = cols.reduce((s, c) => s + c.width, 0);
                const sum = rows.reduce((acc, r) => acc + Number(r.amount || 0), 0);
                doc.roundedRect(x, y, totalW, 32, 6).fill('#eef2ff');
                doc.fillColor('#111827').font('thai').fontSize(12)
                   .text('รวม', x + 8, y + 10, { width: totalW - cols[cols.length - 1].width - 16, align: 'right' });
                doc.fillColor(accent).fontSize(14)
                   .text(fmtMoney(sum), x + totalW - cols[cols.length - 1].width + 8, y + 9, { width: cols[cols.length - 1].width - 16, align: 'right' });
                doc.fillColor('#111827');
            };

            const drawPageHeaders = () => {
                const yStart = doc.y;
                drawHeader(leftX, yStart, leftCols, 'รายรับ', '#16a34a');
                drawHeader(rightX, yStart, rightCols, 'รายจ่าย', '#dc2626');
                return { yL: yStart + headerH + 2, yR: yStart + headerH + 2 };
            };

            let iL = 0, iR = 0;
            let { yL, yR } = drawPageHeaders();
            const bottom = () => doc.page.height - doc.page.margins.bottom - 48;
            while (iL < leftRows.length || iR < rightRows.length) {
                let needPage = false;
                if (iL < leftRows.length && yL + rowH > bottom()) needPage = true;
                if (iR < rightRows.length && yR + rowH > bottom()) needPage = true;
                if (needPage) { doc.addPage(); ({ yL, yR } = drawPageHeaders()); }
                if (iL < leftRows.length) { drawRow(leftX, yL, leftCols, leftRows[iL], true); yL += rowH; iL++; }
                if (iR < rightRows.length) { drawRow(rightX, yR, rightCols, rightRows[iR], false); yR += rowH; iR++; }
            }

            const tH = 36;
            if (Math.min(yL, yR) + tH > bottom()) { doc.addPage(); ({ yL, yR } = drawPageHeaders()); }
            drawTotals(leftX, Math.min(yL, yR), leftCols, leftRows, '#16a34a');
            drawTotals(rightX, Math.min(yL, yR), rightCols, rightRows, '#dc2626');
            doc.moveDown();
        };

        const writeFooter = () => {
            const y = doc.page.height - doc.page.margins.bottom - 30;
            doc.font('thai').fontSize(10).fillColor('#555').text('หมายเหตุ: รายงานนี้จัดทำจากข้อมูลจริงในระบบ ณ วันที่สร้างเอกสาร', doc.page.margins.left, y, { align: 'left' });
            doc.text('ติดต่อฝ่ายบัญชี: 02-xxx-xxxx', doc.page.margins.left, y + 14, { align: 'left' });
        };

        // ---- Stream response ----
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="ledger-report.pdf"');

        doc.pipe(res);
        writeHeader();
        writeSummary();
        // If split view requested, render side-by-side columns on one page and return
        if (req.query.split === 'true') {
            const incomeRows = rows.filter(r => r.type === 'income');
            const expenseRows = rows.filter(r => r.type === 'expense');
            writeTwoColumnSplit(incomeRows, expenseRows);
            writeFooter();
            doc.end();
            return;
        }
        if (req.query.split === 'true') {
            // แยกตาราง รายรับ/รายจ่าย
            const incomeRows = rows.filter(r => r.type === 'income');
            const expenseRows = rows.filter(r => r.type === 'expense');
            doc.fontSize(16).fillColor('#16a34a').text('รายรับ', { align: 'left' });
            writeTableSection(incomeRows, 'รายรับ');
            doc.addPage();
            doc.fontSize(16).fillColor('#dc2626').text('รายจ่าย', { align: 'left' });
            writeTableSection(expenseRows, 'รายจ่าย');
        } else {
            writeTable();
        }
        writeFooter();
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
