import React, { useEffect, useMemo, useState } from 'react';
import DataTable from 'react-data-table-component';
import Swal from 'sweetalert2';
import { FaCheck, FaShippingFast } from 'react-icons/fa';

function Orders() {
  const host = import.meta.env.VITE_HOST;
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOrder, setModalOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const statusMapping = {
    pending: 'รอชำระเงิน/รออนุมัติ',
    approved: 'ชำระเงินแล้ว/อนุมัติแล้ว',
    shipped: 'กำลังจัดส่ง',
    delivered: 'จัดส่งสำเร็จ',
    cancelled: 'ยกเลิก',
  };

  // โหลดรายการคำสั่งซื้อ
  useEffect(() => {
    fetch(`${host}/api/orders`)
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Fetch error:', err));
  }, [host]);

  // กรองรายการตามสถานะ
  const filteredOrders = useMemo(() => {
    if (filterStatus === 'all') return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [orders, filterStatus]);

  // ดูรายละเอียด (เปิดโมดอล)
  const handleShowDetail = (orderId) => {
    setModalLoading(true);
    fetch(`${host}/api/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error('ไม่พบคำสั่งซื้อ');
        return res.json();
      })
      .then((data) => {
        setModalOrder(data);
        setModalLoading(false);
      })
      .catch(() => {
        setModalOrder(null);
        setModalLoading(false);
        Swal.fire('ผิดพลาด', 'ไม่พบข้อมูลคำสั่งซื้อ', 'error');
      });
  };

  // เปลี่ยนสถานะ
  const handleStatusChange = (id, status) => {
    const statusText = statusMapping[status] || status;
    Swal.fire({
      title: 'ยืนยันเปลี่ยนสถานะคำสั่งซื้อ?',
      text: `เปลี่ยนเป็น "${statusText}" สำหรับ Order #${id}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      // TODO: ปรับ endpoint ให้ตรงกับ backend ของคุณ
      try {
        const res = await fetch(`${host}/api/orders/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('update status failed');

        // อัปเดต state ฝั่งหน้าเว็บให้ทันที
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status } : o))
        );

        Swal.fire('สำเร็จ', `อัปเดตสถานะเป็น "${statusText}" แล้ว`, 'success');
      } catch (e) {
        Swal.fire('ผิดพลาด', 'อัปเดตสถานะไม่สำเร็จ', 'error');
      }
    });
  };

  // คอลัมน์ของตาราง
  const columns = useMemo(
    () => [
      { name: '#', cell: (row, idx) => idx + 1, width: '60px', /* center: true */ },
      { name: 'ชื่อลูกค้า', selector: (row) => row.customer_name || '-' },
      {
        name: 'สินค้า',
        cell: (row) =>
          row.items && row.items.length > 0 ? (
            <ul className="list-disc pl-4">
              {row.items.map((item, idx) => (
                <li key={item.id ? `item-${item.id}` : `idx-${idx}`}>
                  {item.product_name}{' '}
                  <span className="text-xs text-gray-500">x{item.quantity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-400">-</span>
          ),
      },
      {
        name: 'รวมราคา',
        selector: (row) =>
          row.total_price !== undefined &&
          row.total_price !== null &&
          !isNaN(Number(row.total_price))
            ? `฿${Number(row.total_price).toLocaleString('th-TH', {
                minimumFractionDigits: 2,
              })}`
            : '-',
      },
      { name: 'ที่อยู่จัดส่ง', selector: (row) => row.shipping_address || '-' },
      {
        name: 'วันที่สั่ง',
        selector: (row) =>
          row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : '-',
      },
      {
        name: 'สถานะ',
        cell: (row) => {
          let colorClass = 'bg-gray-100 text-gray-600';
          if (row.status === 'pending') colorClass = 'bg-yellow-100 text-yellow-800';
          else if (row.status === 'approved') colorClass = 'bg-blue-100 text-blue-800';
          else if (row.status === 'shipped') colorClass = 'bg-purple-100 text-purple-800';
          else if (row.status === 'delivered') colorClass = 'bg-green-100 text-green-800';
          else if (row.status === 'cancelled') colorClass = 'bg-red-100 text-red-800';
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
              {statusMapping[row.status] || row.status}
            </span>
          );
        },
      },
      {
        name: 'การดำเนินการ',
        cell: (row) => (
          <div className="flex gap-2">
            {row.status === 'pending' ? (
              <button
                onClick={() => handleStatusChange(row.id, 'approved')}
                className="px-2 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                title="อนุมัติ/ชำระเงินแล้ว"
              >
                <FaCheck />
              </button>
            ) : row.status === 'approved' ? (
              <button
                onClick={() => handleStatusChange(row.id, 'shipped')}
                className="px-2 py-1 text-purple-600 border border-purple-300 rounded hover:bg-purple-50 transition-colors"
                title="จัดส่ง"
              >
                <FaShippingFast />
              </button>
            ) : row.status === 'shipped' ? (
              <button
                onClick={() => handleStatusChange(row.id, 'delivered')}
                className="px-2 py-1 text-green-600 border border-green-300 rounded hover:bg-green-50 transition-colors"
                title="จัดส่งสำเร็จ"
              >
                <FaCheck />
              </button>
            ) : null}
          </div>
        ),
      },
    ],
    [statusMapping]
  );

  return (
    <div className="container mx-auto mt-8 pl-24">
      <h2 className="text-2xl font-bold mb-6">คำสั่งซื้อ</h2>

      <div className="mb-4">
        <label className="mr-2">กรองตามสถานะ:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded p-1"
        >
          <option value="all">ทั้งหมด</option>
          {Object.entries(statusMapping).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {filteredOrders.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredOrders}
          pagination
          onRowClicked={(row) => handleShowDetail(row.id)}
          highlightOnHover
          pointerOnHover
        />
      ) : (
        <p className="text-gray-500">ไม่พบคำสั่งซื้อ</p>
      )}

      {/* Modal detail */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-xl relative">
            <button
              onClick={() => setModalOrder(null)}
              className="absolute top-2 right-2 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              ปิด
            </button>

            <h3 className="text-xl font-bold mb-4">
              รายละเอียดคำสั่งซื้อ #{modalOrder.id}
            </h3>

            {modalLoading ? (
              <div className="text-gray-500">กำลังโหลด...</div>
            ) : (
              <>
                <div className="mb-2">
                  <span className="font-semibold">สถานะ: </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      modalOrder.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : modalOrder.status === 'approved'
                        ? 'bg-blue-100 text-blue-800'
                        : modalOrder.status === 'shipped'
                        ? 'bg-purple-100 text-purple-800'
                        : modalOrder.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : modalOrder.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {statusMapping[modalOrder.status] || modalOrder.status}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="font-semibold">วันที่สั่ง: </span>
                  {modalOrder.created_at
                    ? new Date(modalOrder.created_at).toLocaleString('th-TH')
                    : '-'}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">ชื่อลูกค้า: </span>
                  {modalOrder.customer_name || '-'}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">ที่อยู่จัดส่ง: </span>
                  {modalOrder.shipping_address || '-'}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">เบอร์โทร: </span>
                  {modalOrder.phone || '-'}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">หมายเหตุ: </span>
                  {modalOrder.note || '-'}
                </div>

                <div className="mb-4">
                  <span className="font-semibold">รายการสินค้า:</span>
                  {modalOrder.items && modalOrder.items.length > 0 ? (
                    <ul className="list-disc pl-6 mt-2">
                      {modalOrder.items.map((item, idx) => (
                        <li key={item.id ? `item-${item.id}` : `idx-${idx}`}>
                          {item.product_name}{' '}
                          <span className="text-xs text-gray-500">
                            x{item.quantity}
                          </span>{' '}
                          <span className="text-xs">
                            (฿
                            {Number(item.price).toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                            })}
                            )
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 ml-2">-</span>
                  )}
                </div>

                <div className="mb-2">
                  <span className="font-semibold">รวมราคา: </span>
                  ฿
                  {Number(modalOrder.total_price || 0).toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                  })}
                </div>

                {modalOrder.receipt_url && (
                  <div className="mb-2">
                    <span className="font-semibold">สลิปโอนเงิน: </span>
                    <a
                      href={modalOrder.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      ดาวน์โหลด
                    </a>
                  </div>
                )}

                <div className="mt-6">
                  <span className="font-semibold">Admin Note: </span>
                  {modalOrder.admin_note || '-'}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
