const db = require('../db');

exports.getStatistics = async (req, res) => {
  try {
    const hasPaymentsTable = await db.schema.hasTable('payments');

    const [totalCustomers, totalOrders, totalProducts, totalSales, totalCustomOrders] = await Promise.all([
      db('customers').count('id as count').first(),
      db('orders').count('id as count').first(),
      db('products').count('id as count').first(),
      hasPaymentsTable
        ? db('payments').where('status', 'approved').sum('amount as sum').first()
        : Promise.resolve({ sum: 0 }),
      db('custom_orders').count('id as count').first(),
    ]);

    const ordersByStatusRaw = await db('orders')
      .select('status')
      .count('id as count')
      .groupBy('status');

    let recentOrdersQuery = db('orders as o')
      .leftJoin('customers as c', 'o.customer_id', 'c.id')
      .select('o.id', 'o.status', 'o.created_at', 'c.name as customer_name')
      .orderBy('o.created_at', 'desc')
      .limit(5);

    if (hasPaymentsTable) {
      recentOrdersQuery = recentOrdersQuery
        .leftJoin('payments as p', function joinPayments() {
          this.on('p.order_id', 'o.id').andOnVal('p.status', 'approved');
        })
        .sum({ paid_total: 'p.amount' })
        .groupBy('o.id', 'o.status', 'o.created_at', 'c.name');
    } else {
      recentOrdersQuery = recentOrdersQuery.select(db.raw('0 as paid_total'));
    }

    const recentOrdersRaw = await recentOrdersQuery;

    const formatNumber = (value) => Number(value ?? 0);

    const ordersByStatus = ordersByStatusRaw.map((row) => ({
      status: row.status || 'unspecified',
      count: formatNumber(row.count),
    }));

    const recentOrders = recentOrdersRaw.map((order) => ({
      id: order.id,
      status: order.status || 'pending',
      paidAmount: formatNumber(order.paid_total),
      createdAt: order.created_at,
      customerName: order.customer_name || 'Unknown customer',
    }));

    res.json({
      customers: formatNumber(totalCustomers?.count),
      orders: formatNumber(totalOrders?.count),
      products: formatNumber(totalProducts?.count),
      totalSales: Number(totalSales?.sum ?? 0),
      totalCustomOrders: formatNumber(totalCustomOrders?.count),
      ordersByStatus,
      recentOrders,
    });
  } catch (err) {
    console.error('Error getting statistics:', err);
    res.status(500).json({ error: 'Server error' });
  }
};



