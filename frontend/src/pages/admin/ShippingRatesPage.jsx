import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';
import { FaSearch, FaTimes } from 'react-icons/fa';

// ใช้ host กลางให้สอดคล้องทั้งไฟล์
const host = import.meta.env.VITE_HOST || '';

// ---- utils ----
function fmtMoneyTHB(n) {
  const num = Number.parseFloat(n || 0) || 0;
  return `฿${num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function isPositiveNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
}

const ShippingRatesPage = () => {
  // state หลัก
  const [shippingRates, setShippingRates] = useState([]);
  const [searchText, setSearchText] = useState('');

  // geo options
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);

  // ui states
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRate, setEditingRate] = useState(null);

  // form
  const [formData, setFormData] = useState({
    province_id: '',
    district_id: '',
    subdistrict_id: '',
    base_fee: ''
  });

  // ---- data loaders ----
  const loadShippingRates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${host}/api/shipping-rates`);
      setShippingRates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading shipping rates:', error);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลค่าส่งได้', 'error');
      setShippingRates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProvinces = useCallback(async () => {
    try {
      const { data } = await axios.get(`${host}/api/provinces`);
      setProvinces(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading provinces:', error);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลจังหวัดได้', 'error');
      setProvinces([]);
    }
  }, []);

  const loadDistricts = useCallback(async (provinceId, { preserve = false } = {}) => {
    if (!provinceId) return;
    try {
      const { data } = await axios.get(`${host}/api/districts`, { params: { province_id: provinceId } });
      setDistricts(Array.isArray(data) ? data : []);
      setSubdistricts([]);
      setFormData(prev => ({
        ...prev,
        district_id: preserve ? prev.district_id : '',
        subdistrict_id: preserve ? prev.subdistrict_id : ''
      }));
    } catch (error) {
      console.error('Error loading districts:', error);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลอำเภอได้', 'error');
      setDistricts([]);
    }
  }, []);

  const loadSubdistricts = useCallback(async (districtId, { preserve = false } = {}) => {
    if (!districtId) return;
    try {
      const { data } = await axios.get(`${host}/api/subdistricts`, { params: { district_id: districtId } });
      setSubdistricts(Array.isArray(data) ? data : []);
      setFormData(prev => ({
        ...prev,
        subdistrict_id: preserve ? prev.subdistrict_id : ''
      }));
    } catch (error) {
      console.error('Error loading subdistricts:', error);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลตำบลได้', 'error');
      setSubdistricts([]);
    }
  }, []);

  // init
  useEffect(() => {
    loadShippingRates();
    loadProvinces();
  }, [loadShippingRates, loadProvinces]);

  // ---- handlers ----
  const handleProvinceChange = (provinceId) => {
    setFormData(prev => ({ ...prev, province_id: provinceId, district_id: '', subdistrict_id: '' }));
    if (provinceId) {
      loadDistricts(provinceId, { preserve: false });
    } else {
      setDistricts([]);
      setSubdistricts([]);
    }
  };

  const handleDistrictChange = (districtId) => {
    setFormData(prev => ({ ...prev, district_id: districtId, subdistrict_id: '' }));
    if (districtId) {
      loadSubdistricts(districtId, { preserve: false });
    } else {
      setSubdistricts([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingRate(null);
    setFormData({ province_id: '', district_id: '', subdistrict_id: '', base_fee: '' });
    setDistricts([]);
    setSubdistricts([]);
    setModalVisible(true);
  };

  const openEditModal = async (record) => {
    setEditingRate(record);
    setFormData({
      province_id: record.province_id || '',
      district_id: record.district_id || '',
      subdistrict_id: record.subdistrict_id || '',
      base_fee: record.base_fee ?? ''
    });
    if (record.province_id) {
      await loadDistricts(record.province_id, { preserve: true });
      if (record.district_id) await loadSubdistricts(record.district_id, { preserve: true });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingRate(null);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณต้องการลบค่าส่งนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    });
    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${host}/api/shipping-rates/${id}`);
      Swal.fire('สำเร็จ', 'ลบค่าส่งสำเร็จ', 'success');
      loadShippingRates();
    } catch (error) {
      const msg = error?.response?.data?.message || 'ไม่สามารถลบค่าส่งได้';
      Swal.fire('เกิดข้อผิดพลาด', msg, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ตรวจความครบถ้วนและความสอดคล้อง
    if (!formData.province_id) {
      return Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกจังหวัด', 'warning');
    }
    if (!formData.district_id) {
      return Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกอำเภอ', 'warning');
    }
    if (!isPositiveNumber(formData.base_fee)) {
      return Swal.fire('ข้อมูลไม่ถูกต้อง', 'ค่าส่งต้องเป็นตัวเลข 0 ขึ้นไป', 'warning');
    }

    const payload = {
      district_id: Number(formData.district_id),
      subdistrict_id: formData.subdistrict_id ? Number(formData.subdistrict_id) : 0,
      base_fee: Number.parseFloat(formData.base_fee)
    };

    try {
      if (editingRate) {
        await axios.put(`${host}/api/shipping-rates/${editingRate.id}`, payload);
        Swal.fire('สำเร็จ', 'แก้ไขค่าส่งสำเร็จ', 'success');
      } else {
        await axios.post(`${host}/api/shipping-rates`, payload);
        Swal.fire('สำเร็จ', 'เพิ่มค่าส่งสำเร็จ', 'success');
      }
      closeModal();
      loadShippingRates();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาด';
      Swal.fire('เกิดข้อผิดพลาด', errorMessage, 'error');
    }
  };

  // Toggle Active/Inactive แบบปลอดภัย (ยืนยันก่อน)
  const toggleActiveSafe = useCallback(async (record) => {
    try {
      const willHide = !!record.is_active;
      const result = await Swal.fire({
        title: willHide ? 'ยืนยันการซ่อนเรทจัดส่ง?' : 'ยืนยันการแสดงเรทจัดส่ง?',
        text: willHide ? 'เรทนี้จะไม่ถูกใช้งานและไม่ถูกแสดง' : 'เรทนี้จะถูกใช้งานและถูกแสดง',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: willHide ? '#d33' : '#198754',
        cancelButtonColor: '#6c757d',
        confirmButtonText: willHide ? 'ซ่อน' : 'แสดง',
        cancelButtonText: 'ยกเลิก',
      });
      if (!result.isConfirmed) return;

      await axios.put(`${host}/api/shipping-rates/${record.id}`, {
        district_id: Number(record.district_id),
        subdistrict_id: record.subdistrict_id ? Number(record.subdistrict_id) : 0,
        base_fee: Number.parseFloat(record.base_fee),
        is_active: record.is_active ? 0 : 1,
      });

      Swal.fire('สำเร็จ', willHide ? 'ซ่อนเรทจัดส่งแล้ว' : 'แสดงเรทจัดส่งแล้ว', 'success');
      loadShippingRates();
    } catch (error) {
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถปรับสถานะได้', 'error');
    }
  }, [loadShippingRates]);

  // ---- table ----
  const displayedRates = useMemo(() => {
    let filtered = shippingRates;
    if (searchText.trim()) {
      const lower = searchText.trim().toLowerCase();
      filtered = filtered.filter(r =>
        (r.province_name || '').toLowerCase().includes(lower) ||
        (r.district_name || '').toLowerCase().includes(lower) ||
        (r.subdistrict_name || '').toLowerCase().includes(lower)
      );
    }
    return filtered.map((r, idx) => ({ ...r, _no: idx + 1 }));
  }, [shippingRates, searchText]);

  const columns = useMemo(() => [
    {
      name: <span className="whitespace-nowrap">ลำดับ</span>,
      selector: row => row._no,
      width: '96px',
      sortable: true,
      center: true
    },
    { name: 'จังหวัด', selector: row => row.province_name || '-', sortable: true },
    { name: 'อำเภอ', selector: row => row.district_name || '-', sortable: true },
    { name: 'ตำบล', selector: row => row.subdistrict_name || '-', sortable: true },
    {
      name: 'ค่าส่ง (บาท)',
      selector: row => Number.parseFloat(row.base_fee || 0),
      sortable: true,
      right: true,
      cell: row => <span className="font-medium">{fmtMoneyTHB(row.base_fee)}</span>
    },
    {
      name: 'การจัดการ',
      cell: row => (
        <div className="btn-group" role="group" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={(e) => { e.stopPropagation(); openEditModal(row); }}
          >
            <i className="fas fa-edit me-1"></i> แก้ไข
          </button>
          <button
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
          >
            <i className="fas fa-trash me-1"></i> ลบ
          </button>
          <button
            className={`btn btn-sm ms-2 ${row.is_active ? 'btn-outline-secondary' : 'btn-outline-success'}`}
            onClick={(e) => { e.stopPropagation(); toggleActiveSafe(row); }}
            title={row.is_active ? 'ไม่แสดง' : 'แสดง'}
          >
            <i className={`fas me-1 ${row.is_active ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            {row.is_active ? 'ไม่แสดง' : 'แสดง'}
          </button>
        </div>
      ),
      ignoreRowClick: true,
      center: true
    }
  ], [toggleActiveSafe]);

  return (
    <div className="container-fluid p-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="mb-0">จัดการค่าส่ง</h2>
          <div>
            <button className="btn btn-primary" onClick={openAddModal}>
              <i className="fas fa-plus me-1"></i> เพิ่มค่าส่ง
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Search box */}
          <div className="mb-3 d-flex">
            <div className="position-relative" style={{ width: 280, maxWidth: '100%' }}>
              <FaSearch
                size={14}
                className="position-absolute"
                style={{ left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}
                aria-hidden="true"
              />
              <input
                type="text"
                className="form-control"
                placeholder="ค้นหาจังหวัด/อำเภอ/ตำบล"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                style={{ paddingLeft: 32, paddingRight: 32 }}
                aria-label="ค้นหาพื้นที่จัดส่ง"
              />
              {!!searchText && (
                <button
                  type="button"
                  className="btn btn-link p-0 position-absolute"
                  onClick={() => setSearchText('')}
                  style={{ right: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                  title="ล้างคำค้น"
                  aria-label="ล้างคำค้น"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={displayedRates}
            progressPending={loading}
            noDataComponent={<div className="text-muted">ไม่มีข้อมูลค่าส่ง</div>}
            pagination
            highlightOnHover
            responsive
            striped
          />
        </div>
      </div>

      {/* Modal */}
      {modalVisible && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingRate ? 'แก้ไขค่าส่ง' : 'เพิ่มค่าส่ง'}</h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">จังหวัด *</label>
                      <select
                        className="form-select"
                        name="province_id"
                        value={formData.province_id}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        required
                      >
                        <option value="">เลือกจังหวัด</option>
                        {provinces.map((p) => (
                          <option key={p.id} value={p.id}>{p.name_th}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">อำเภอ *</label>
                      <select
                        className="form-select"
                        name="district_id"
                        value={formData.district_id}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        required
                        disabled={!formData.province_id}
                      >
                        <option value="">เลือกอำเภอ</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>{d.name_th}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">ตำบล (ไม่บังคับ)</label>
                      <select
                        className="form-select"
                        name="subdistrict_id"
                        value={formData.subdistrict_id}
                        onChange={handleInputChange}
                        disabled={!formData.district_id}
                      >
                        <option value="">เลือกตำบล (ถ้าไม่เลือกจะใช้ค่าส่งของอำเภอ)</option>
                        {subdistricts.map((s) => (
                          <option key={s.id} value={s.id}>{s.name_th}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">ค่าส่ง (บาท) *</label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          name="base_fee"
                          value={formData.base_fee}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="กรอกค่าส่ง"
                          required
                          inputMode="decimal"
                        />
                        <span className="input-group-text">บาท</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    ยกเลิก
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingRate ? 'บันทึกการแก้ไข' : 'เพิ่มค่าส่ง'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingRatesPage;
