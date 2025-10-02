const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ledgerController');

// สร้างหลายรายการจาก drafts
router.post('/ledger/bulk', ctrl.createBulk);

// รายการทั้งหมด/ช่วงวัน (optional: filter by source, type)
router.get('/ledger', ctrl.list);

// สรุปยอดตามช่วงวัน + แยกช่องทาง
router.get('/ledger/summary', ctrl.summary);

router.get('/ledger/export/pdf', ctrl.exportPdf);

router.get('/reports/online-sales', ctrl.onlineSales);
router.get('/reports/online-sales/summary-by-product', ctrl.onlineSalesSummaryByProduct);

module.exports = router;