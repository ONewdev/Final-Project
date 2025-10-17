import React, { useEffect, useMemo, useState, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import th from 'date-fns/locale/th';
import DataTable from 'react-data-table-component';
import Swal from 'sweetalert2';

const host = import.meta.env.VITE_HOST || '';

const statusMapping = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติ',
  rejected: 'ไม่อนุมัติ',
  waiting_payment: 'รอชำระเงิน',
  paid: 'ชำระเงินแล้ว',
  in_production: 'กำลังผลิต',
  delivering: 'กำลังจัดส่ง',
  finished: 'เสร็จสิ้น',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  waiting_payment: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  in_production: 'bg-purple-100 text-purple-800',
  delivering: 'bg-sky-100 text-sky-800',
  finished: 'bg-green-100 text-green-800',
};

const nextStatus = {
  pending: ['approved','rejected','waiting_payment'],
  waiting_payment: ['paid','rejected'],
  paid: ['in_production','rejected'],
  approved: ['in_production','rejected'],
  in_production: ['delivering','rejected'],
  delivering: ['finished'],
  finished: [],
  rejected: []
};

function OrdersCustom() {
  // helper ISO <-> Date
  const isoToDate = (iso) => {
    if (!iso) return null;
    const d = new Date(`${iso}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
  };
  const dateToISO = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  // ThaiDatePicker component
  const ThaiDatePicker = ({ valueISO, onChangeISO, ...props }) => (
    <DatePicker
      selected={isoToDate(valueISO)}
      onChange={(date) => onChangeISO(dateToISO(date))}
      dateFormat="dd/MM/yyyy"
      locale={th}
      className="border rounded w-full p-2"
      placeholderText="วัน/เดือน/ปี"
      isClearable
      showYearDropdown
      scrollableYearDropdown
      yearDropdownItemNumber={40}
      {...props}
    />
  );

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal เดิม
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // สำหรับลำดับต่อเนื่องตามหน้า
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const startIndex = (currentPage - 1) * perPage;

  useEffect(() => {
    fetch(`${host}/api/custom-orders/orders`)
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching orders:', error);
        Swal.fire({
          icon: 'error',
          title: 'ไม่สามารถโหลดข้อมูลได้',
          text: 'กรุณาลองใหม่อีกครั้ง',
        });
        setLoading(false);
      });
  }, []);

  // ✅ แสดง OC# จาก custom_code และทำ fallback อัตโนมัติ
  const getDisplayCustomCode = useCallback((o) => {
    if (o?.custom_code) return o.custom_code;
    const d = o?.created_at ? new Date(o.created_at) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const seq = String(o?.id ?? 0).padStart(4, '0');
    return `OC#${y}${m}${day}-${seq}`;
  }, []);

  const handleCopyCode = (code) => {
    try {
      navigator.clipboard?.writeText(code);
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: 'คัดลอกรหัสแล้ว', showConfirmButton: false, timer: 1200
      });
    } catch {}
  };

  // ใช้ Modal เดิม: เปิดเมื่อคลิกแถว
  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };
  const closeDetailModal = () => {
    setSelectedOrder(null);
    setShowDetailModal(false);
  };

  const updateStatus = async (id, status) => {
    try {
      const result = await Swal.fire({
        title: 'ยืนยันการเปลี่ยนสถานะ',
        text: `ต้องการเปลี่ยนสถานะเป็น "${statusMapping[status] || status}" ใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
      });

      if (!result.isConfirmed) return;

      const response = await fetch(`${host}/api/custom-orders/order/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      const mapped = status === 'approved' ? 'waiting_payment' : status;
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, status: mapped } : o)));

      Swal.fire({ icon: 'success', title: 'อัพเดทสถานะสำเร็จ', showConfirmButton: false, timer: 1500 });
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({ icon: 'error', title: 'ไม่สามารถอัพเดทสถานะได้', text: 'กรุณาลองใหม่อีกครั้ง' });
    }
  };

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (filterStatus !== 'all') {
      result = result.filter((o) => o.status === filterStatus);
    }

    if (searchText.trim() !== '') {
      const lower = searchText.toLowerCase();
      result = result.filter((o) =>
        (o.user_id && String(o.user_id).toLowerCase().includes(lower)) ||
        (o.product_type && o.product_type.toLowerCase().includes(lower)) ||
        (o.color && o.color.toLowerCase().includes(lower)) ||
        (o.status && (statusMapping[o.status] || o.status).toLowerCase().includes(lower)) ||
        (o.custom_code && o.custom_code.toLowerCase().includes(lower)) ||
        (getDisplayCustomCode(o).toLowerCase().includes(lower))
      );
    }

    // ✅ กรองวันที่ (end ครอบคลุมถึงก่อนเที่ยงคืนวันถัดไป)
    const start = startDate ? new Date(startDate) : null;
    const end = endDate
      ? new Date(new Date(endDate).getFullYear(), new Date(endDate).getMonth(), new Date(endDate).getDate() + 1)
      : null;

    if (start) result = result.filter(o => o.created_at && new Date(o.created_at) >= start);
    if (end)   result = result.filter(o => o.created_at && new Date(o.created_at) < end);

    return result;
  }, [orders, filterStatus, searchText, startDate, endDate, getDisplayCustomCode]);

  // รีเซ็ตหน้าเป็นหน้า 1 เมื่อกรอง/ค้นหา/ช่วงวันที่เปลี่ยน หรือข้อมูลเปลี่ยน
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchText, startDate, endDate, orders]);

  const columns = useMemo(
    () => [
      // ⭐ คอลัมน์ลำดับ
      {
        name: 'ลำดับ',
        width: '90px',
        center: true,
        cell: (_row, index) => <span className="font-mono">{startIndex + index + 1}</span>,
      },
      // 👈 ย้าย 'วันที่สั่ง' มาหลัง 'ลำดับ'
      {
        name: 'วันที่สั่ง',
        selector: (row) => (row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : '-'),
      },
      {
        name: 'รหัสสั่งทำ',
        width: '210px',
        cell: (row) => {
          const code = getDisplayCustomCode(row);
          return (
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-wide font-mono">{code}</span>
              <button
                className="px-2 py-0.5 text-xs border rounded hover:bg-gray-50"
                onClick={(e) => { e.stopPropagation(); handleCopyCode(code); }}
                title="คัดลอกรหัส"
              >
                คัดลอก
              </button>
            </div>
          );
        },
      },
      { name: 'ลูกค้า', selector: (row) => row.customer_name || '-' },
      { name: 'ประเภท', selector: (row) => row.product_type || '-' },
      { name: 'ขนาด', selector: (row) => `${row.width}x${row.height} ${row.unit}` },
      { name: 'สี', selector: (row) => row.color || '-' },
      { name: 'จำนวน', selector: (row) => row.quantity },
      {
        name: 'ราคาสินค้า',
        selector: (row) =>
          Number.isFinite(Number(row.price))
            ? `฿${Number(row.price).toLocaleString('th-TH')}`
            : '-',
      },
      { 
        name: 'ค่าส่ง', 
        selector: (row) => {
          const shippingFee = Number(row.shipping_fee) || 0;
          const method = row.shipping_method;
          if (method === 'pickup') return 'รับหน้าร้าน';
          return shippingFee > 0 ? `฿${shippingFee.toLocaleString('th-TH')}` : '-';
        },
      },
      { 
        name: 'ราคารวม', 
        selector: (row) => {
          const productPrice = Number(row.price) || 0;
          const shippingFee = Number(row.shipping_fee) || 0;
          const total = productPrice + shippingFee;
          return `฿${total.toLocaleString('th-TH')}`;
        },
      },
      {
        name: 'สถานะ',
        cell: (row) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[row.status] || 'bg-gray-100 text-gray-800'}`}>
            {statusMapping[row.status] || row.status}
          </span>
        ),
      },
      // 🔧 เอาปุ่ม "ดูรายละเอียด" ออก เหลือเฉพาะ select เปลี่ยนสถานะ
      {
        name: 'จัดการ',
        width: '220px',
        cell: (row) => (
          <div className="flex gap-2">
            <select
              value={row.status}
              onChange={e => updateStatus(row.id, e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
              onClick={(e) => e.stopPropagation()} // กันไม่ให้เปิดโมดัลเวลาเปลี่ยนสถานะ
            >
              <option value={row.status}>{statusMapping[row.status] || row.status}</option>
              {nextStatus[row.status]?.map((value) => (
                <option key={value} value={value}>{statusMapping[value] || value}</option>
              ))}
            </select>
          </div>
        ),
      },
    ],
    [getDisplayCustomCode, startIndex]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-8 pl-24">
      <h2 className="text-2xl font-bold mb-6">รายการสั่งทำสินค้า</h2>

      {/* ฟิลเตอร์ค้นหาแบบ card/grid */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">สถานะ</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded w-full p-2"
            >
              <option value="all">ทั้งหมด</option>
              {Object.entries(statusMapping).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ค้นหา</label>
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="รหัส (OC#...), ลูกค้า, ประเภท, สี, สถานะ..."
              className="border rounded w-full p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">วันที่เริ่มต้น</label>
            <ThaiDatePicker
              valueISO={startDate}
              onChangeISO={setStartDate}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ถึงวันที่</label>
            <ThaiDatePicker
              valueISO={endDate}
              onChangeISO={setEndDate}
            />
          </div>
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredOrders}
          pagination
          paginationPerPage={perPage}
          onChangePage={(page) => setCurrentPage(page)}
          onChangeRowsPerPage={(newPerPage, page) => {
            setPerPage(newPerPage);
            setCurrentPage(page);
          }}
          highlightOnHover
          pointerOnHover
          onRowClicked={(row) => handleViewDetail(row)} // ← คลิกแถวเพื่อเปิดโมดัลรายละเอียด (ใช้ modal เดิม)
        />
      ) : (
        <p className="text-gray-500">ไม่พบรายการสั่งทำ</p>
      )}

      {/* Modal รายละเอียดออเดอร์ (เดิม) */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  รายละเอียดสั่งทำสินค้า - {getDisplayCustomCode(selectedOrder)}
                </h3>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* ข้อมูลหลัก */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-3 text-gray-800">ข้อมูลลูกค้า</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">ชื่อลูกค้า:</span> {selectedOrder.customer_name || '-'}</p>
                    <p><span className="font-medium">เบอร์โทร:</span> {selectedOrder.phone || '-'}</p>
                    <p><span className="font-medium">ที่อยู่:</span> {selectedOrder.address || '-'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-3 text-gray-800">ข้อมูลสินค้า</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">ประเภท:</span> {selectedOrder.product_type || '-'}</p>
                    <p><span className="font-medium">ขนาด:</span> {selectedOrder.width}x{selectedOrder.height} {selectedOrder.unit}</p>
                    <p><span className="font-medium">สี:</span> {selectedOrder.color || '-'}</p>
                    <p><span className="font-medium">จำนวน:</span> {selectedOrder.quantity}</p>
                  </div>
                </div>
              </div>

              {/* ข้อมูลราคาและสถานะ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-3 text-gray-800">ข้อมูลราคา</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">ราคาสินค้า:</span> 
                      {Number.isFinite(Number(selectedOrder.price)) 
                        ? `฿${Number(selectedOrder.price).toLocaleString('th-TH')}` 
                        : '-'}
                    </p>
                    <p><span className="font-medium">ค่าส่ง:</span> 
                      {selectedOrder.shipping_method === 'pickup' 
                        ? 'รับหน้าร้าน' 
                        : (Number(selectedOrder.shipping_fee) || 0) > 0 
                          ? `฿${Number(selectedOrder.shipping_fee).toLocaleString('th-TH')}` 
                          : '-'}
                    </p>
                    <p><span className="font-medium">ราคารวม:</span> 
                      <span className="text-lg font-bold text-green-600">
                        {(() => {
                          const productPrice = Number(selectedOrder.price) || 0;
                          const shippingFee = Number(selectedOrder.shipping_fee) || 0;
                          const total = productPrice + shippingFee;
                          return `฿${total.toLocaleString('th-TH')}`;
                        })()}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-3 text-gray-800">สถานะและวันที่</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">สถานะปัจจุบัน:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedOrder.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusMapping[selectedOrder.status] || selectedOrder.status}
                      </span>
                    </p>
                    <p><span className="font-medium">วันที่สั่ง:</span> 
                      {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('th-TH') : '-'}
                    </p>
                    <p><span className="font-medium">วันที่อัพเดท:</span> 
                      {selectedOrder.updated_at ? new Date(selectedOrder.updated_at).toLocaleString('th-TH') : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ข้อมูลการจัดส่ง */}
              <div className="bg-purple-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-lg mb-3 text-gray-800">ข้อมูลการจัดส่ง</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">วิธีการจัดส่ง:</span> 
                    {selectedOrder.shipping_method === 'pickup' ? 'รับหน้าร้าน' : 'จัดส่ง'}
                  </p>
                  {selectedOrder.shipping_method === 'delivery' && (
                    <>
                      <p><span className="font-medium">ที่อยู่จัดส่ง:</span> {selectedOrder.shipping_address || '-'}</p>
                      <p><span className="font-medium">เบอร์โทร:</span> {selectedOrder.phone || '-'}</p>
                      <p><span className="font-medium">รหัสไปรษณีย์:</span> {selectedOrder.postal_code || '-'}</p>
                    </>
                  )}
                </div>
              </div>

              {/* รายละเอียดเพิ่มเติม */}
              {(selectedOrder.description || selectedOrder.note || selectedOrder.special_request) && (
                <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-lg mb-3 text-gray-800">รายละเอียดเพิ่มเติม</h4>
                  <div className="space-y-2">
                    {selectedOrder.description && (
                      <p><span className="font-medium">คำอธิบาย:</span> {selectedOrder.description}</p>
                    )}
                    {selectedOrder.note && (
                      <p><span className="font-medium">หมายเหตุ:</span> {selectedOrder.note}</p>
                    )}
                    {selectedOrder.special_request && (
                      <p><span className="font-medium">คำขอพิเศษ:</span> {selectedOrder.special_request}</p>
                    )}
                  </div>
                </div>
              )}

              {/* ปุ่มจัดการ */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-2">
                  <select
                    value={selectedOrder.status}
                    onChange={e => {
                      updateStatus(selectedOrder.id, e.target.value);
                      setSelectedOrder({...selectedOrder, status: e.target.value});
                    }}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value={selectedOrder.status}>{statusMapping[selectedOrder.status] || selectedOrder.status}</option>
                    {nextStatus[selectedOrder.status]?.map((value) => (
                      <option key={value} value={value}>{statusMapping[value] || value}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersCustom;
