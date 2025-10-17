// controllers/orders.js
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const db = require('../db');
const sendEmail = require('../utils/sendEmail');

// ---------- Helpers ----------
const fmtMoney = (n) =>
  `฿${Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDateTH = (d) =>
  new Date(d).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

async function sendNotification({ customer_id, type = 'info', title, message }) {
  if (!customer_id) return;
  await db('notifications').insert({
    customer_id,
    type,
    title,
    message,
    created_at: new Date(),
  });
}

function hr(doc, y = doc.y, color = '#E5E7EB') {
  const { width, margins } = doc.page;
  doc.save()
    .strokeColor(color)
    .lineWidth(1)
    .moveTo(margins.left, y)
    .lineTo(width - margins.right, y)
    .stroke()
    .restore();
}

function drawPageFooter(doc, shopName) {
  const text = `${shopName || ''}  •  สร้างเมื่อ ${fmtDateTH(new Date())}`;
  const page = doc.page;
  doc.fontSize(9).fillColor('#6b7280');
  doc.text(text, 40, page.height - 40, { align: 'left' });
  doc.text(`หน้า ${doc.pageNumber}`, -40, page.height - 40, { align: 'right' });
  doc.fillColor('#111827');
}

function drawHeader(doc, { shopName, shopAddress, shopPhone, shopEmail, logoPath }) {
  const topY = doc.y;
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, doc.page.margins.left, topY, { width: 64, height: 64, fit: [64, 64] });
    } catch (_) {}
  }
  const titleX = doc.page.margins.left + (logoPath && fs.existsSync(logoPath) ? 76 : 0);
  doc.fillColor('#111827').font('thai').fontSize(20).text(shopName || 'ใบเสร็จรับเงิน', titleX, topY);
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#374151');
  if (shopAddress) doc.text(shopAddress, titleX);
  const line2 = [shopPhone ? `โทร: ${shopPhone}` : null, shopEmail ? `อีเมล: ${shopEmail}` : null]
    .filter(Boolean)
    .join('   •   ');
  if (line2) doc.text(line2, titleX);
  doc.moveDown(0.5);
  hr(doc);
  doc.moveDown(0.8);
}

function drawInfoBox(doc, leftTitle, leftLines = [], rightTitle, rightLines = []) {
  const startY = doc.y;
  const boxPadding = 10;
  const colW = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 2 - 6;

  // left
  doc.save().roundedRect(doc.x, startY, colW, 88, 10).fill('#F9FAFB').restore();
  doc.moveUp();
  doc.fontSize(11).fillColor('#374151').text(leftTitle, doc.x + boxPadding, startY + boxPadding);
  doc.fontSize(10).fillColor('#111827');
  leftLines.forEach((t) => doc.text(t, { indent: 10 }));

  // right
  const rightX = doc.x + colW + 12;
  doc.save().roundedRect(rightX, startY, colW, 88, 10).fill('#F9FAFB').restore();
  doc.fontSize(11).fillColor('#374151').text(rightTitle, rightX + boxPadding, startY + boxPadding);
  doc.fontSize(10).fillColor('#111827');
  rightLines.forEach((t) => doc.text(t, rightX + 10));

  doc.moveDown(1.5);
  doc.y = Math.max(startY + 98, doc.y);
}

function drawItemsTable(doc, items) {
  const headerBg = '#111827';
  const headerFg = '#FFFFFF';
  const rowStripe = '#F3F4F6';
  const border = '#E5E7EB';

  const col = [
    { key: 'no', label: 'ลำดับ', width: 50, align: 'center' },
    { key: 'name', label: 'ชื่อสินค้า', width: 250, align: 'left' },
    { key: 'qty', label: 'จำนวน', width: 70, align: 'center' },
    { key: 'price', label: 'ราคา/หน่วย', width: 100, align: 'right' },
    { key: 'amount', label: 'ยอดรวม', width: 110, align: 'right' },
  ];

  const startX = doc.x;
  let y = doc.y + 4;

  // header
  doc.save().roundedRect(startX, y, col.reduce((s, c) => s + c.width, 0), 28, 6).fill(headerBg).restore();
  let x = startX + 8;
  doc.fillColor(headerFg).fontSize(11).font('thai');
  col.forEach((c) => {
    doc.text(c.label, x, y + 8, { width: c.width - 16, align: c.align });
    x += c.width;
  });
  y += 28;

  // rows
  items.forEach((it, idx) => {
    if (y > doc.page.height - doc.page.margins.bottom - 120) {
      drawPageFooter(doc, process.env.SHOP_NAME || 'AL Shop');
      doc.addPage();
      y = doc.y;
      doc.save().roundedRect(startX, y, col.reduce((s, c) => s + c.width, 0), 28, 6).fill(headerBg).restore();
      let x2 = startX + 8;
      doc.fillColor(headerFg).fontSize(11).font('thai');
      col.forEach((c) => {
        doc.text(c.label, x2, y + 8, { width: c.width - 16, align: c.align });
        x2 += c.width;
      });
      y += 28;
    }

    const rowH = 26;
    if (idx % 2 === 0) {
      doc.save().rect(startX, y, col.reduce((s, c) => s + c.width, 0), rowH).fill(rowStripe).restore();
    }
    doc.save().strokeColor(border).lineWidth(1)
      .moveTo(startX, y + rowH)
      .lineTo(startX + col.reduce((s, c) => s + c.width, 0), y + rowH)
      .stroke()
      .restore();

    let xi = startX + 8;
    doc.fillColor('#111827').fontSize(10).font('thai');
    const amount = (Number(it.price) || 0) * (Number(it.quantity) || 0);
    const cells = [
      { text: String(idx + 1), w: col[0].width - 16, align: col[0].align },
      { text: it.product_name || it.name || '-', w: col[1].width - 16, align: col[1].align },
      { text: `${it.quantity}`, w: col[2].width - 16, align: col[2].align },
      { text: fmtMoney(it.price), w: col[3].width - 16, align: col[3].align },
      { text: fmtMoney(amount), w: col[4].width - 16, align: col[4].align },
    ];
    cells.forEach((c) => {
      doc.text(c.text, xi, y + 8, { width: c.w, align: c.align });
      xi += c.w + 16;
    });

    y += rowH;
  });

  doc.moveDown(1);
}

function drawTotalsBox(doc, { subtotal = 0, shipping = 0, discount = 0, vatRate = 0, vatBaseIncludesVat = false }) {
  const boxW = 280;
  const x = doc.page.width - doc.page.margins.right - boxW;
  let y = doc.y;

  let vatBase = subtotal - discount + shipping;
  let vat = 0;
  if (vatRate > 0) {
    if (vatBaseIncludesVat) {
      vat = (vatBase * vatRate) / (100 + vatRate);
      vatBase = vatBase - vat;
    } else {
      vat = (vatBase * vatRate) / 100;
    }
  }
  const grand = vatBase + vat;

  doc.save().roundedRect(x, y, boxW, 138, 10).fill('#F9FAFB').restore();
  y += 10;
  const line = (label, value, strong = false) => {
    doc.fontSize(strong ? 12 : 11).font('thai').fillColor(strong ? '#111827' : '#374151');
    doc.text(label, x + 14, y, { width: boxW - 28, align: 'left', continued: true });
    doc.text(value, x + 14, y, { width: boxW - 28, align: 'right' });
    y += 20;
  };

  line('Sub-total', fmtMoney(subtotal));
  if (discount > 0) line('ส่วนลด', `- ${fmtMoney(discount)}`);
  if (shipping > 0) line('ค่าขนส่ง', fmtMoney(shipping));
  if (vatRate > 0) line(`VAT (${vatRate}%)`, fmtMoney(vat));
  hr(doc, y + 2, '#D1D5DB');
  y += 10;
  line('รวมทั้งสิ้น (Grand Total)', fmtMoney(grand), true);

  doc.moveDown(1.5);
}

// ---------- Controllers ----------

// จัดส่งสินค้า (shipped) + แจ้งเตือน
exports.shipOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await db('orders as o')
      .leftJoin('customers as c', 'o.customer_id', 'c.id')
      .select('o.*', 'c.name as customer_name', 'c.email as email')
      .where('o.id', id)
      .first();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await db('orders').where('id', id).update({ status: 'shipped', shipped_at: db.fn.now() });

    await sendNotification({
      customer_id: order.customer_id,
      type: 'info',
      title: 'คำสั่งซื้อถูกจัดส่งแล้ว',
      message: `คำสั่งซื้อ #${id} ของคุณถูกจัดส่งแล้ว กรุณาตรวจสอบสถานะการจัดส่ง`,
    });

    res.json({ success: true, message: 'Order shipped successfully' });
  } catch (err) {
    console.error('Error shipping order:', err);
    res.status(500).json({ success: false, message: 'Failed to ship order', error: err.message });
  }
};

// ดึงข้อมูล order ตาม id (รวม items และ total)
exports.getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await db('orders as o')
      .leftJoin('customers as c', 'o.customer_id', 'c.id')
      .select('o.*', 'c.name as customer_name', 'c.email as email')
      .where('o.id', id)
      .first();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const items = await db('order_items')
      .where('order_id', id)
      .leftJoin('products', 'order_items.product_id', 'products.id')
      .select('order_items.*', 'products.name as product_name', 'products.image_url');

    const total_price = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    res.json({ ...order, items, total_price });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: 'Error fetching order' });
  }
};

// สร้างคำสั่งซื้อ
exports.createOrder = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { customer_id, items, order_type, customDetails, shipping_address, phone, address_id, product_list } = req.body;
    const productListPayload = Array.isArray(product_list) ? product_list : [];

    if (!customer_id || !Array.isArray(items) || items.length === 0) {
      await trx.rollback();
      return res.status(400).json({ message: 'Missing required data' });
    }

    if (order_type === 'custom') {
      const need = customDetails && customDetails.width && customDetails.height && customDetails.material;
      if (!need) {
        await trx.rollback();
        return res.status(400).json({ message: 'Missing custom details for custom order' });
      }
    }

    // ใส่ address_id และตั้ง total_price ชั่วคราวเป็น 0
    const [orderId] = await trx('orders').insert({
      customer_id,
      address_id: address_id || null,         // ⬅️ เพิ่ม
      total_price: 0,                         // ⬅️ เพิ่ม (จะอัปเดตตอนท้าย)
      order_type: order_type || 'standard',
      status: 'pending',
      shipping_address: shipping_address || null,
      phone: phone || null,
      product_list: JSON.stringify(productListPayload),
      created_at: db.fn.now(),
    });

    let total = 0; // ⬅️ ไว้รวมราคา
    const storedProductList = [];

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const product = await trx('products').where({ id: item.product_id }).first();
      if (!product) {
        await trx.rollback();
        return res.status(404).json({ message: `Product ${item.product_id} not found` });
      }

      await trx('order_items').insert({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price,
      });

      // ตัดสต๊อก
      const newQty = product.quantity - item.quantity;
      if (newQty < 0) {
        await trx.rollback();
        return res.status(400).json({ message: `สินค้า ${product.name} มีจำนวนไม่พอในคลัง` });
      }
      await trx('products').where({ id: item.product_id }).update({ quantity: newQty });
      const clientEntry = productListPayload.length > index ? productListPayload[index] : null;
      let entryQty = Number(item.quantity);
      if (isNaN(entryQty)) {
        entryQty = clientEntry && !isNaN(Number(clientEntry.product_qty)) ? Number(clientEntry.product_qty) : 0;
      }
      let entryName = product && product.name ? product.name : '';
      if (clientEntry && clientEntry.product_name) {
        entryName = clientEntry.product_name;
      }
      storedProductList.push({
        product_name: entryName,
        product_qty: entryQty,
      });

      // รวมราคา
      total += Number(product.price) * Number(item.quantity || 0);
    }

    if (order_type === 'custom' && customDetails) {
      await trx('order_custom_details').insert({
        order_id: orderId,
        width: customDetails.width,
        height: customDetails.height,
        material: customDetails.material,
        special_request: customDetails.special_request || null,
        estimated_price: customDetails.estimated_price || null,
      });

      // ถ้าอยากนับ estimated เข้า total ด้วย ให้ปลดคอมเมนต์ 2 บรรทัดล่างนี้
      // if (customDetails.estimated_price) {
      //   total += Number(customDetails.estimated_price) || 0;
      // }
    }

    // อัปเดต total_price กลับเข้า orders
    await trx('orders').where({ id: orderId }).update({
      total_price: total,
      product_list: JSON.stringify(storedProductList),
    });

    await trx.commit();

    await sendNotification({
      customer_id,
      type: 'info',
      title: 'สร้างคำสั่งซื้อสำเร็จ',
      message: `คำสั่งซื้อ #${orderId} ถูกสร้างเรียบร้อยแล้ว`,
    });

    // ส่ง socket event แจ้งเตือน admin
    try {
      const { io } = require('../app');
      if (io) {
        io.emit('order:new', { orderId, customer_id, total_price: total });
      }
    } catch (err) {
      console.warn('Socket notification failed:', err.message);
    }

    res.status(201).json({ message: 'Order created successfully', orderId, total_price: total });
  } catch (err) {
    await trx.rollback();
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Error creating order', error: err.message });
  }
};


// ดึงคำสั่งซื้อทั้งหมด (รวม items + total)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await db('orders')
      .leftJoin('customers', 'orders.customer_id', 'customers.id')
      .select('orders.*', 'customers.name as customer_name', 'customers.email as customer_email')
      .orderBy('orders.created_at', 'desc');

    const orderIds = orders.map((o) => o.id);
    const items = orderIds.length
      ? await db('order_items')
          .whereIn('order_id', orderIds)
          .leftJoin('products', 'order_items.product_id', 'products.id')
          .select('order_items.*', 'products.name as product_name', 'products.image_url')
      : [];

    const itemsByOrder = {};
    for (const it of items) {
      if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
      itemsByOrder[it.order_id].push(it);
    }

    const result = orders.map((order) => {
      const orderItems = itemsByOrder[order.id] || [];
      const total_price = orderItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      return { ...order, items: orderItems, total_price };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

// ดึงคำสั่งซื้อตาม customer_id
exports.getOrdersByCustomer = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const orders = await db('orders').where({ customer_id }).orderBy('created_at', 'desc');

    const orderIds = orders.map((o) => o.id);
    const items = orderIds.length
      ? await db('order_items')
          .whereIn('order_id', orderIds)
          .leftJoin('products', 'order_items.product_id', 'products.id')
          .select('order_items.*', 'products.name as product_name', 'products.image_url')
      : [];

    const itemsByOrder = {};
    for (const it of items) {
      if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
      itemsByOrder[it.order_id].push(it);
    }

    const result = orders.map((order) => {
      const orderItems = itemsByOrder[order.id] || [];
      const total_price = orderItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      return { ...order, items: orderItems, total_price };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching customer orders:', err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

// อัปเดตสถานะคำสั่งซื้อ (พร้อมแจ้งเตือนและส่งอีเมล)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;
    // ตรวจสอบสถานะที่อนุญาต
    const allowed = ['pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
  // อัปเดตวันที่ตามสถานะ
  const updateData = { status };
  if (status === 'approved') updateData.approved_at = db.fn.now();
  if (status === 'processing') updateData.processing_at = db.fn.now();
  if (status === 'shipped') updateData.shipped_at = db.fn.now();
  if (status === 'delivered') updateData.delivered_at = db.fn.now();
  if (status === 'cancelled') updateData.cancelled_at = db.fn.now();
    const changed = await db('orders').where({ id }).update(updateData);
    if (!changed) return res.status(404).json({ message: 'Order not found' });

    // ดึงข้อมูล order และ customer
    const order = await db('orders').where({ id }).first();
    const customer = order?.customer_id ? await db('customers').where({ id: order.customer_id }).first() : null;

    // กำหนดข้อความแจ้งเตือนและอีเมล
    let notify = { type: 'info', title: '', message: '' };
    if (status === 'approved') {
      notify = {
        type: 'success',
        title: 'คำสั่งซื้อได้รับการอนุมัติ',
        message: `คำสั่งซื้อ #${id} ของคุณได้รับการอนุมัติแล้ว`,
      };
    } else if (status === 'processing') {
      notify = {
        type: 'info',
        title: 'กำลังเตรียมสินค้า',
        message: `คำสั่งซื้อ #${id} ของคุณอยู่ระหว่างการเตรียมสินค้า กรุณารอการจัดส่ง`,
      };
    } else if (status === 'shipped') {
      notify = {
        type: 'info',
        title: 'คำสั่งซื้อถูกจัดส่งแล้ว',
        message: `คำสั่งซื้อ #${id} ของคุณถูกจัดส่งแล้ว กรุณาตรวจสอบสถานะการจัดส่ง`,
      };
    } else if (status === 'delivered') {
      notify = {
        type: 'success',
        title: 'จัดส่งสำเร็จ',
        message: `คำสั่งซื้อ #${id} ของคุณถูกจัดส่งสำเร็จแล้ว`,
      };
    } else if (status === 'cancelled') {
      notify = {
        type: 'warning',
        title: 'คำสั่งซื้อถูกยกเลิก',
        message: `คำสั่งซื้อ #${id} ของคุณถูกยกเลิกแล้ว`,
      };
    }

    // แจ้งเตือนในระบบ
    await sendNotification({
      customer_id: order.customer_id,
      ...notify,
    });

    // ส่งอีเมลถ้ามีอีเมลลูกค้า
    if (customer?.email) {
      const emailSubject = notify.title || 'Order status updated';
      const emailBody = notify.message || `Order #${id} status has been updated to ${status}`;
      const emailHtml = `<div style="font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6;">
        <h3 style="margin: 0 0 12px; color: #15803d;">${emailSubject}</h3>
        <p style="margin: 0 0 12px; color: #1f2937;">${emailBody}</p>
        <p style="margin: 16px 0 0; color: #4b5563;">Order number: <strong>#${id}</strong></p>
        <p style="margin: 0; color: #4b5563;">Current status: <strong>${status}</strong></p>
        <p style="margin: 24px 0 0; color: #6b7280; font-size: 13px;">Thank you for shopping with us.</p>
      </div>`;
      await sendEmail(customer.email, emailSubject, emailHtml);
    }

    res.json({ message: 'Order status updated' });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Error updating order status' });
  }
};

// อนุมัติคำสั่งซื้อ
exports.approveOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await db('orders as o')
      .leftJoin('customers as c', 'o.customer_id', 'c.id')
      .select('o.*', 'c.name as customer_name', 'c.email as email')
      .where('o.id', id)
      .first();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await db('orders').where('id', id).update({ status: 'approved', approved_at: db.fn.now() });

    await sendNotification({
      customer_id: order.customer_id,
      type: 'success',
      title: 'คำสั่งซื้อได้รับการอนุมัติ',
      message: `คำสั่งซื้อ #${id} ของคุณได้รับการอนุมัติแล้ว`,
    });

    res.json({ success: true, message: 'Order approved successfully' });
  } catch (err) {
    console.error('Error approving order:', err);
    res.status(500).json({ success: false, message: 'Failed to approve order', error: err.message });
  }
};

// ดึงออเดอร์ตามสถานะ (flat list)
exports.getOrdersByStatus = async (req, res) => {
  const { status } = req.params;
  try {
    const orders = await db('orders')
      .leftJoin('customers', 'orders.customer_id', 'customers.id')
      .leftJoin('order_items', 'orders.id', 'order_items.order_id')
      .leftJoin('products', 'order_items.product_id', 'products.id')
      .select(
        'orders.id as order_id',
        'orders.status',
        'orders.order_type',
        'orders.created_at',
        'customers.id as customer_id',
        'customers.name as customer_name',
        'products.id as product_id',
        'products.name as product_name',
        'products.image_url',
        'order_items.quantity'
      )
      .where('orders.status', status)
      .orderBy('orders.created_at', 'desc');

    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders by status:', err);
    res.status(500).json({ message: 'Error fetching orders by status' });
  }
};

// ยกเลิกคำสั่งซื้อ
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db('orders').where({ id }).first();
    if (!order) return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อนี้' });

    // คืน stock สินค้า
    const items = await db('order_items').where({ order_id: id });
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      await db('products')
        .where({ id: item.product_id })
        .increment('quantity', item.quantity);
    }

    await db('orders').where({ id }).update({ status: 'cancelled', cancelled_at: db.fn.now() });

    await sendNotification({
      customer_id: order.customer_id,
      type: 'warning',
      title: 'คำสั่งซื้อถูกยกเลิก',
      message: `คำสั่งซื้อ #${id} ถูกยกเลิกแล้ว และคืนสินค้าเข้าสต็อก`,
    });

    const updated = await db('orders').where({ id }).first();
    res.json(updated);
  } catch (err) {
    console.error('Error canceling order:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการยกเลิกคำสั่งซื้อ' });
  }
};

// สร้าง PDF ใบเสร็จ (ฉบับใหม่แบบสวย)
exports.generateReceiptPdf = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await db('orders').where({ id: orderId }).first();
    if (!order) return res.status(404).send('Order not found');

    const customer = order.customer_id
      ? await db('customers').where({ id: order.customer_id }).first()
      : null;

    const items = await db('order_items as oi')
      .leftJoin('products as p', 'oi.product_id', 'p.id')
      .select('oi.*', 'p.name as product_name')
      .where('oi.order_id', orderId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt_order_${orderId}.pdf`);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    const thaiFont = path.join(__dirname, '../fonts/NotoSansThai-Regular.ttf');
    if (fs.existsSync(thaiFont)) {
      doc.registerFont('thai', thaiFont);
      doc.font('thai');
    } else {
      console.error('ไม่พบไฟล์ฟอนต์ภาษาไทย:', thaiFont);
      doc.font('Helvetica');
    }

    drawHeader(doc, {
      shopName: process.env.SHOP_NAME || 'AL Shop Aluminium & Glass',
      shopAddress: process.env.SHOP_ADDRESS || '123 หมู่ 9 ต.ตัวอย่าง อ.เมือง จ.เชียงราย 57xxx',
      shopPhone: process.env.SHOP_PHONE || '08x-xxx-xxxx',
      shopEmail: process.env.SHOP_EMAIL || 'contact@example.com',
      logoPath: process.env.SHOP_LOGO_PATH ? path.resolve(process.env.SHOP_LOGO_PATH) : null,
    });

    doc.fontSize(18).fillColor('#111827').text('ใบเสร็จรับเงิน (RECEIPT)', { align: 'right' });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#374151')
      .text(`เลขที่เอกสาร: RC-${String(order.id).padStart(6, '0')}`, { align: 'right' })
      .text(`วันที่: ${fmtDateTH(order.created_at)}`, { align: 'right' });
    doc.moveDown(0.8);

    // Ensure all key info is present, fallback to '-'
    const leftLines = [
      `ชื่อลูกค้า: ${customer?.name || '-'}`,
      `โทร: ${customer?.phone || '-'}`,
      `อีเมล: ${customer?.email || '-'}`,
      `ที่อยู่: ${order.shipping_address || customer?.address || '-'}`,
    ];

    const rightLines = [
      `เลขที่ออเดอร์: #${order.id || '-'}`,
      `สถานะ: ${order.status || '-'}`,
      `วิธีชำระเงิน: ${order.payment_method || '-'}`,
      `วันที่ชำระเงิน: ${order.paid_at ? fmtDateTH(order.paid_at) : '-'}`,
    ];
    drawInfoBox(doc, 'ข้อมูลลูกค้า', leftLines, 'ข้อมูลคำสั่งซื้อ', rightLines);

    doc.fontSize(14).fillColor('#111827').text('รายการสินค้า');
    doc.moveDown(0.4);
    drawItemsTable(doc, items);

    const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
    const shipping = Number(order.shipping_fee || 0);
    const discount = Number(order.discount || 0);
    const vatRate = Number(order.vat_rate || 0);
    const vatIncluded = Boolean(order.vat_included || 0);

    drawTotalsBox(doc, { subtotal, shipping, discount, vatRate, vatBaseIncludesVat: vatIncluded });

    doc.moveDown(0.5);
    hr(doc);
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#374151').font('thai')
      .text('หมายเหตุ: สินค้าตามใบเสร็จนี้ไม่สามารถเปลี่ยนคืนได้ ยกเว้นกรณีชำรุดจากการผลิต/ขนส่ง กรุณาตรวจสอบความถูกต้องก่อนลงชื่อรับสินค้า')
      .moveDown(0.4)
      .text('ขอบคุณที่อุดหนุนครับ/ค่ะ');

    drawPageFooter(doc, process.env.SHOP_NAME || 'AL Shop Aluminium & Glass');
    doc.end();
  } catch (err) {
    console.error('PDF Error:', err);
    if (!res.headersSent) res.status(500).send('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
  }
};






