import React, { useCallback, useEffect, useState } from 'react';

const ADDRESS_FORM_DEFAULT = {
  id: null,
  label: '',
  recipient_name: '',
  phone: '',
  address: '',
  province_id: '',
  district_id: '',
  subdistrict_id: '',
  postal_code: '',
  is_default: false,
};

function AddressManager({ userId, host, defaultRecipient = '', defaultPhone = '' }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [form, setForm] = useState(() => ({ ...ADDRESS_FORM_DEFAULT }));
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });

  const isEditing = Boolean(form.id);

  const fetchAddresses = useCallback(async (targetId) => {
    if (!targetId) {
      setAddresses([]);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Use relative API path to leverage Vite proxy in dev
      const url = `/api/customers/${targetId}/addresses`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(`Failed to load addresses (${response.status})`);
      const payload = await response.json();
      setAddresses(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error('Failed to load addresses:', error);
      setAddresses([]);
      setMessage((prev) => (prev.type === 'success' ? prev : { type: 'error', text: 'ไม่สามารถโหลดที่อยู่ที่บันทึกไว้ได้ในขณะนี้' }));
    } finally {
      setLoading(false);
    }
  }, [host]);

  useEffect(() => {
    if (!userId) {
      setAddresses([]);
      return;
    }
    fetchAddresses(userId);
  }, [userId, fetchAddresses]);

  useEffect(() => {
    if (!host && !import.meta.env.DEV) return;
    let active = true;
    const loadProvinces = async () => {
      try {
        const response = await fetch(`/api/customers/provinces`);
        if (!response.ok) throw new Error('Failed to load provinces');
        const payload = await response.json();
        if (active) setProvinces(Array.isArray(payload) ? payload : []);
      } catch (error) {
        if (active) {
          console.error('Failed to load provinces:', error);
          setProvinces([]);
        }
      }
    };
    loadProvinces();
    return () => { active = false; };
  }, [host]);

  useEffect(() => {
    if (!showForm) return;
    if (!form.province_id) {
      setDistricts([]); setSubdistricts([]);
      if (form.district_id || form.subdistrict_id || form.postal_code) {
        setForm((prev) => ({ ...prev, district_id: '', subdistrict_id: '', postal_code: '' }));
      }
      return;
    }
    let active = true;
    const loadDistricts = async () => {
      try {
        const response = await fetch(`/api/customers/districts?province_id=${form.province_id}`);
        if (!response.ok) throw new Error('Failed to load districts');
        const payload = await response.json();
        if (!active) return;
        const options = Array.isArray(payload) ? payload : [];
        setDistricts(options);
        if (!options.length || !options.some((i) => String(i.id) === String(form.district_id))) {
          if (form.district_id || form.subdistrict_id || form.postal_code) {
            setForm((prev) => ({ ...prev, district_id: '', subdistrict_id: '', postal_code: '' }));
          }
        }
      } catch (error) {
        if (active) { console.error('Failed to load districts:', error); setDistricts([]); }
      }
    };
    loadDistricts();
    return () => { active = false; };
  }, [form.province_id, host, showForm, form.district_id, form.subdistrict_id, form.postal_code]);

  useEffect(() => {
    if (!showForm) return;
    if (!form.district_id) {
      setSubdistricts([]);
      if (form.subdistrict_id || form.postal_code) {
        setForm((prev) => ({ ...prev, subdistrict_id: '', postal_code: '' }));
      }
      return;
    }
    let active = true;
    const loadSubdistricts = async () => {
      try {
        const response = await fetch(`/api/customers/subdistricts?district_id=${form.district_id}`);
        if (!response.ok) throw new Error('Failed to load subdistricts');
        const payload = await response.json();
        if (!active) return;
        const options = Array.isArray(payload) ? payload : [];
        setSubdistricts(options);
        if (!options.length) {
          if (form.subdistrict_id || form.postal_code) {
            setForm((prev) => ({ ...prev, subdistrict_id: '', postal_code: '' }));
          }
          return;
        }
        const matched = options.find((i) => String(i.id) === String(form.subdistrict_id));
        if (!matched) {
          if (form.subdistrict_id || form.postal_code) {
            setForm((prev) => ({ ...prev, subdistrict_id: '', postal_code: '' }));
          }
          return;
        }
        if (matched.postal_code && String(matched.postal_code) !== String(form.postal_code ?? '')) {
          setForm((prev) => ({ ...prev, postal_code: String(matched.postal_code ?? '') }));
        }
      } catch (error) {
        if (active) { console.error('Failed to load subdistricts:', error); setSubdistricts([]); }
      }
    };
    loadSubdistricts();
    return () => { active = false; };
  }, [form.district_id, host, showForm, form.subdistrict_id, form.postal_code]);

  useEffect(() => {
    if (!showForm || !form.subdistrict_id) return;
    const matched = subdistricts.find((i) => String(i.id) === String(form.subdistrict_id));
    if (matched?.postal_code && String(matched.postal_code) !== String(form.postal_code ?? '')) {
      setForm((prev) => ({ ...prev, postal_code: String(matched.postal_code ?? '') }));
    }
  }, [form.subdistrict_id, form.postal_code, subdistricts, showForm]);

  const openNew = () => {
    setMessage({ type: null, text: '' });
    setShowForm(true);
    setDistricts([]); setSubdistricts([]);
    setForm({
      ...ADDRESS_FORM_DEFAULT,
      recipient_name: defaultRecipient || '',
      phone: defaultPhone || '',
      is_default: addresses.length === 0,
    });
  };

  const openEdit = (address) => {
    if (!address) return;
    setMessage({ type: null, text: '' });
    setShowForm(true);
    setDistricts([]); setSubdistricts([]);
    setForm({
      id: address.id,
      label: address.label ?? '',
      recipient_name: address.recipient_name ?? defaultRecipient ?? '',
      phone: address.phone ?? defaultPhone ?? '',
      address: address.address ?? '',
      province_id: address.province_id ? String(address.province_id) : '',
      district_id: address.district_id ? String(address.district_id) : '',
      subdistrict_id: address.subdistrict_id ? String(address.subdistrict_id) : '',
      postal_code: address.postal_code ? String(address.postal_code) : address.subdistrict_postal_code ? String(address.subdistrict_postal_code) : '',
      is_default: Boolean(address.is_default),
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setForm({ ...ADDRESS_FORM_DEFAULT });
    setDistricts([]); setSubdistricts([]);
  };

  const handleCancel = () => { setMessage({ type: null, text: '' }); closeForm(); };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'postal_code') { setForm((p) => ({ ...p, postal_code: value.replace(/\D/g, '').slice(0, 5) })); return; }
    if (type === 'checkbox') { setForm((p) => ({ ...p, [name]: checked })); return; }
    if (name === 'province_id') { setForm((p) => ({ ...p, province_id: value, district_id: '', subdistrict_id: '', postal_code: '' })); return; }
    if (name === 'district_id') { setForm((p) => ({ ...p, district_id: value, subdistrict_id: '', postal_code: '' })); return; }
    if (name === 'subdistrict_id') { setForm((p) => ({ ...p, subdistrict_id: value, postal_code: value ? p.postal_code : '' })); return; }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) { setMessage({ type: 'error', text: 'กรุณาเข้าสู่ระบบเพื่อจัดการที่อยู่' }); return; }

    const trimmed = {
      address: (form.address || '').trim(),
      phone: (form.phone || '').trim(),
      recipient_name: (form.recipient_name || '').trim(),
      label: (form.label || '').trim(),
      postal_code: (form.postal_code || '').trim(),
    };

    if (!trimmed.address || !trimmed.phone) { setMessage({ type: 'error', text: 'กรุณากรอกที่อยู่และเบอร์โทร' }); return; }
    if (!form.province_id || !form.district_id || !form.subdistrict_id) {
      setMessage({ type: 'error', text: 'กรุณาเลือกจังหวัด อำเภอ/เขต และตำบล/แขวง' }); return;
    }

    setSaving(true);
    const token = localStorage.getItem('token');

    try {
      const payload = {
        label: trimmed.label || null,
        recipient_name: trimmed.recipient_name || defaultRecipient || '',
        phone: trimmed.phone,
        address: trimmed.address,
        postal_code: trimmed.postal_code || null,
        province_id: form.province_id,
        district_id: form.district_id,
        subdistrict_id: form.subdistrict_id,
        is_default: Boolean(form.is_default),
      };

      const url = form.id
        ? `/api/customers/${userId}/addresses/${form.id}`
        : `/api/customers/${userId}/addresses`;
      const method = form.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'ไม่สามารถบันทึกที่อยู่ได้');

      await fetchAddresses(userId);
      setMessage({ type: 'success', text: form.id ? 'อัปเดตที่อยู่เรียบร้อยแล้ว' : 'เพิ่มที่อยู่เรียบร้อยแล้ว' });
      closeForm();
    } catch (error) {
      console.error('Failed to save address:', error);
      setMessage({ type: 'error', text: error?.message || 'ไม่สามารถบันทึกที่อยู่ได้' });
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addressId) => {
    if (!userId || !addressId) return;
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${userId}/addresses/${addressId}/default`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'ไม่สามารถตั้งค่าเป็นที่อยู่เริ่มต้นได้');
      await fetchAddresses(userId);
      setMessage({ type: 'success', text: 'อัปเดตที่อยู่เริ่มต้นเรียบร้อยแล้ว' });
    } catch (error) {
      console.error('Failed to set default address:', error);
      setMessage({ type: 'error', text: error?.message || 'ไม่สามารถตั้งค่าเป็นที่อยู่เริ่มต้นได้' });
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-6">
        {/* ส่วนหัวของหน้า */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">ที่อยู่จัดส่ง</h3>
            <p className="text-sm text-gray-500">จัดการที่อยู่สำหรับการจัดส่งคำสั่งซื้อของคุณ</p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center justify-center rounded-full border border-green-600 px-5 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
            disabled={saving}
          >
            {showForm && !isEditing ? 'เพิ่มที่อยู่อีก' : 'เพิ่มที่อยู่'}
          </button>
        </div>

        {message.text && (
          <div className={`px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {/* หัวข้อรายการที่อยู่ */}
        <div>
          <h4 className="mb-2 text-base font-semibold text-gray-900">รายการที่อยู่ของฉัน</h4>
          <div className="grid gap-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-500">กำลังโหลดที่อยู่...</div>
            ) : addresses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                ยังไม่มีที่อยู่ที่บันทึกไว้
              </div>
            ) : (
              addresses.map((address) => (
                <div
                  key={address.id}
                  className={`rounded-xl border p-4 shadow-sm transition ${address.is_default ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{address.recipient_name || defaultRecipient || 'ผู้รับ'}</p>
                      {address.phone && <p className="mt-1 text-sm text-gray-600">{address.phone}</p>}
                      {address.label && <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">{address.label}</p>}
                    </div>
                    {address.is_default && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        ที่อยู่เริ่มต้น
                      </span>
                    )}
                  </div>
                  {address.address && (
                    <p className="mt-4 whitespace-pre-line text-sm text-gray-700">
                      {address.address}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    {[address.subdistrict_name, address.district_name, address.province_name, address.postal_code || address.subdistrict_postal_code]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => openEdit(address)}
                      className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      disabled={saving}
                    >
                      แก้ไข
                    </button>
                    {!address.is_default && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(address.id)}
                        className="inline-flex items-center rounded-md border border-green-600 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                        disabled={loading || saving}
                      >
                        ตั้งเป็นที่อยู่เริ่มต้น
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ฟอร์มเพิ่ม/แก้ไข */}
        {showForm && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}
              </h4>
              <button
                type="button"
                onClick={handleCancel}
                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                disabled={saving}
              >
                ยกเลิก
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-6">
              {/* หัวข้อย่อย: ข้อมูลผู้รับ */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-5 w-1 rounded bg-green-600" />
                  <h5 className="text-sm font-semibold text-gray-900">ข้อมูลผู้รับ</h5>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">ป้ายกำกับ</label>
                    <input
                      type="text"
                      name="label"
                      value={form.label}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      placeholder="บ้าน, ที่ทำงาน"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">ชื่อผู้รับ</label>
                    <input
                      type="text"
                      name="recipient_name"
                      value={form.recipient_name}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      placeholder="ชื่อ-นามสกุลผู้รับ"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">เบอร์โทร</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      placeholder="0xxxxxxxxx"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* หัวข้อย่อย: ที่อยู่และรหัสไปรษณีย์ */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-5 w-1 rounded bg-green-600" />
                  <h5 className="text-sm font-semibold text-gray-900">ที่อยู่และรหัสไปรษณีย์</h5>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">ที่อยู่</label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      placeholder="บ้านเลขที่ ถนน หมู่บ้าน"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">รหัสไปรษณีย์</label>
                    <input
                      type="text"
                      name="postal_code"
                      value={form.postal_code}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      maxLength={5}
                      placeholder="xxxxx"
                    />
                  </div>
                </div>
              </div>

              {/* หัวข้อย่อย: เขตพื้นที่จัดส่ง */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-5 w-1 rounded bg-green-600" />
                  <h5 className="text-sm font-semibold text-gray-900">เขตพื้นที่จัดส่ง</h5>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">จังหวัด</label>
                    <select
                      name="province_id"
                      value={form.province_id}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      required
                    >
                      <option value="">เลือกจังหวัด</option>
                      {provinces.map((province) => (
                        <option key={province.id} value={province.id}>{province.name_th}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">อำเภอ/เขต</label>
                    <select
                      name="district_id"
                      value={form.district_id}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      disabled={!form.province_id}
                      required
                    >
                      <option value="">เลือกอำเภอ/เขต</option>
                      {districts.map((district) => (
                        <option key={district.id} value={district.id}>{district.name_th}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">ตำบล/แขวง</label>
                    <select
                      name="subdistrict_id"
                      value={form.subdistrict_id}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      disabled={!form.district_id}
                      required
                    >
                      <option value="">เลือกตำบล/แขวง</option>
                      {subdistricts.map((subdistrict) => (
                        <option key={subdistrict.id} value={subdistrict.id}>{subdistrict.name_th}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={Boolean(form.is_default)}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                />
                <span className="text-sm text-gray-700">ตั้งเป็นที่อยู่จัดส่งเริ่มต้น</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  disabled={saving}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:bg-gray-400"
                >
                  {saving ? 'กำลังบันทึก...' : isEditing ? 'อัปเดตที่อยู่' : 'บันทึกที่อยู่'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

export default AddressManager;
