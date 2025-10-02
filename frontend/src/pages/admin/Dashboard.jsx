import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const initialStats = {
  customers: 0,
  orders: 0,
  products: 0,
  totalSales: 0,
  ordersByStatus: [],
  recentOrders: [],
};

const statusLabels = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติแล้ว',
  waiting_payment: 'รอการชำระเงิน',
  paid: 'ชำระเงินแล้ว',
  in_production: 'กำลังผลิต',
  delivering: 'กำลังจัดส่ง',
  shipped: 'จัดส่งแล้ว',
  delivered: 'ส่งมอบแล้ว',
  cancelled: 'ยกเลิก',
  rejected: 'ถูกปฏิเสธ',
  unspecified: 'ไม่ระบุสถานะ',
};

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-700',
  waiting_payment: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-sky-100 text-sky-700',
  paid: 'bg-emerald-100 text-emerald-700',
  in_production: 'bg-indigo-100 text-indigo-700',
  delivering: 'bg-blue-100 text-blue-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
  rejected: 'bg-rose-100 text-rose-700',
  unspecified: 'bg-slate-100 text-slate-600',
};

const formatNumber = (value) => new Intl.NumberFormat('th-TH').format(value ?? 0);

const formatCurrency = (value) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(value);
  }
};

const getStatusStyle = (status) => statusStyles[status] ?? statusStyles.unspecified;

export default function Dashboard() {
  const host = import.meta.env.VITE_HOST || '';
  const [stats, setStats] = useState(initialStats);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // ไม่ต้องใช้ customOrderCount state แยกอีกต่อไป

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        const results = await Promise.allSettled([
          axios.get(`${host}/api/stats`, { withCredentials: true }),
          axios.get(`${host}/api/customers`, {
            params: { limit: 5, order: 'desc' },
            withCredentials: true,
          })
        ]);

        if (!isMounted) return;

        const [statsResult, customersResult] = results;

        if (statsResult.status === 'fulfilled') {
          setStats({ ...initialStats, ...statsResult.value.data });
          setError(null);
        } else {
          console.error('Failed to load stats:', statsResult.reason);
          setError('ไม่สามารถดึงข้อมูลสถิติได้ กรุณาลองใหม่อีกครั้ง');
        }

        if (customersResult.status === 'fulfilled') {
          const customersData = customersResult.value.data;
          setRecentCustomers(Array.isArray(customersData) ? customersData : []);
        } else {
          console.error('Failed to load customers:', customersResult.reason);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        if (isMounted) setError('ไม่สามารถดึงข้อมูลสถิติได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboard();
    return () => { isMounted = false; };
  }, []);

  const chartData = useMemo(
    () =>
      (stats.ordersByStatus ?? []).map((item) => ({
        name: statusLabels[item.status] ?? item.status ?? 'ไม่ระบุ',
        orders: item.count ?? 0,
      })),
    [stats.ordersByStatus]
  );

  const metrics = useMemo(
    () => [
      {
        id: 'customers',
        label: 'ลูกค้าทั้งหมด',
        value: formatNumber(stats.customers),
        helper: 'บัญชีที่ลงทะเบียน',
        accent: 'bg-sky-500',
      },
      {
        id: 'orders',
        label: 'จำนวนคำสั่งซื้อ',
        value: formatNumber(stats.orders),
        helper: 'ทุกสถานะรวมกัน',
        accent: 'bg-violet-500',
      },
      {
        id: 'customOrders',
        label: 'ยอดสั่งทำ',
        value: formatNumber(stats.totalCustomOrders),
        helper: 'ออเดอร์สั่งทำทั้งหมด',
        accent: 'bg-purple-500',
      },
      {
        id: 'products',
        label: 'สินค้าในระบบ',
        value: formatNumber(stats.products),
        helper: 'ประเภทสินค้าออนไลน์',
        accent: 'bg-amber-500',
      },
      {
        id: 'totalSales',
        label: 'ยอดชำระเงินสะสม',
        value: formatCurrency(stats.totalSales),
        helper: 'รวมจากการชำระเงินที่อนุมัติแล้ว',
        accent: 'bg-emerald-500',
        highlight: true,
      },
    ],
    [stats.customers, stats.orders, stats.products, stats.totalSales, stats.totalCustomOrders]
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-lg bg-slate-200" />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <p className="font-semibold">เกิดข้อผิดพลาด</p>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 p-6">
      <header>
        <h2 className="text-3xl font-semibold text-slate-900">สถิติ</h2>
        <p className="mt-2 text-sm text-slate-500">
          ข้อมูลภาพรวมธุรกิจที่อัปเดตแบบเรียลไทม์ ช่วยให้คุณติดตามยอดขาย ลูกค้า และสถานะคำสั่งซื้อได้ง่ายขึ้น
        </p>
      </header>

      {/* Metrics */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((card) => (
          <article
            key={card.id}
            className={[
              'relative overflow-hidden rounded-2xl shadow-sm transition hover:-translate-y-1 hover:shadow-md',
              card.highlight
                ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                : 'bg-white ring-1 ring-slate-100',
            ].join(' ')}
          >
            <div className={['absolute inset-x-0 top-0 h-1', card.accent].join(' ')} />
            <div className="p-6">
              <p className={card.highlight ? 'text-sm font-medium text-emerald-50' : 'text-sm font-medium text-slate-500'}>
                {card.label}
              </p>
              <p className={card.highlight ? 'mt-4 text-3xl font-semibold text-white' : 'mt-4 text-3xl font-semibold text-slate-900'}>
                {card.value}
              </p>
              <p className={card.highlight ? 'mt-1 text-sm text-emerald-100' : 'mt-1 text-sm text-slate-400'}>{card.helper}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {/* Orders by status chart */}
        <article className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">สรุปคำสั่งซื้อแยกตามสถานะ</h3>
              <p className="mt-1 text-sm text-slate-500">ดูภาพรวมว่าคำสั่งซื้ออยู่ในขั้นตอนไหนมากที่สุด</p>
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="mt-8 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                    formatter={(value) => [`${formatNumber(value)} คำสั่งซื้อ`, 'จำนวน']}
                  />
                  <Bar dataKey="orders" radius={[8, 8, 4, 4]} fill="#22c55e" maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-10 text-sm text-slate-500">ยังไม่มีข้อมูลคำสั่งซื้อให้แสดงผล</p>
          )}
        </article>

        {/* Right column */}
        <div className="space-y-6">
          {/* Recent orders */}
          <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">คำสั่งซื้อล่าสุด</h3>
            <p className="mt-1 text-sm text-slate-500">แสดงคำสั่งซื้อ 5 รายการล่าสุดจากระบบ</p>

            <ul className="mt-6 space-y-4">
              {stats.recentOrders?.length ? (
                stats.recentOrders.map((order) => {
                  const label = statusLabels[order.status] ?? statusLabels.unspecified;
                  const created =
                    order.createdAt || order.created_at || order.created || null;
                  const paidAmount = Number(order.paidAmount ?? order.paid_amount ?? 0);

                  return (
                    <li key={order.id} className="rounded-xl border border-slate-100 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">คำสั่งซื้อ #{order.id}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDateTime(created)}</p>
                          <p className="mt-2 text-sm text-slate-600 truncate">
                            {order.customerName || order.customer_name || 'ไม่ระบุชื่อลูกค้า'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                              order.status
                            )}`}
                          >
                            {label}
                          </span>
                          <p className="mt-3 text-sm font-medium text-slate-900">
                            {paidAmount > 0 ? formatCurrency(paidAmount) : 'ยังไม่ชำระเงิน'}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  ยังไม่มีคำสั่งซื้อใหม่ในช่วงนี้
                </li>
              )}
            </ul>
          </article>

          {/* Recent customers */}
          <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">ลูกค้าใหม่ล่าสุด</h3>
            <p className="mt-1 text-sm text-slate-500">ลูกค้าที่เพิ่งลงทะเบียนเข้ามา</p>

            <ul className="mt-6 space-y-4">
              {recentCustomers.length ? (
                recentCustomers.map((customer) => (
                  <li key={customer.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {customer.name || 'ไม่ระบุชื่อ'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 truncate">
                          {customer.email || '—'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(customer.created_at || customer.createdAt)}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <span className="block font-medium text-slate-700">
                          {customer.phone || '—'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  ยังไม่มีลูกค้าใหม่ในช่วงนี้
                </li>
              )}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}

