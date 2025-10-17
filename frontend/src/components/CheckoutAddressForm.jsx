import React, { useCallback, useEffect, useRef, useState } from 'react';

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
};

function CheckoutAddressForm({ user, host, onChange }) {
  const userId = user?.id ?? user?.user_id;
  const defaultRecipient = user?.name || '';
  const defaultPhone = user?.phone || '';

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState('new');
  const [form, setForm] = useState(() => ({ ...ADDRESS_FORM_DEFAULT }));
  const [provinceOptions, setProvinceOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [subdistrictOptions, setSubdistrictOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });
  const isInitialLoading = loading && addresses.length === 0;

  const provinceOptionsRef = useRef([]);
  const districtOptionsRef = useRef([]);
  const subdistrictOptionsRef = useRef([]);

  const { province_id: provinceId, district_id: districtId, subdistrict_id: subdistrictId, postal_code: postalCode } = form;

  useEffect(() => {
    provinceOptionsRef.current = provinceOptions;
    districtOptionsRef.current = districtOptions;
    subdistrictOptionsRef.current = subdistrictOptions;
  }, [provinceOptions, districtOptions, subdistrictOptions]);

  const notifyExisting = useCallback((address) => {
    if (!onChange || !address) return;
    onChange({
      mode: 'existing',
      addressId: address.id,
      shippingAddress: address.address || '',
      phone: address.phone || '',
      provinceId: address.province_id ? String(address.province_id) : '',
      districtId: address.district_id ? String(address.district_id) : '',
      subdistrictId: address.subdistrict_id ? String(address.subdistrict_id) : '',
      postalCode: address.postal_code ? String(address.postal_code) : address.subdistrict_postal_code ? String(address.subdistrict_postal_code) : '',
      provinceName: address.province_name || '',
      districtName: address.district_name || '',
      subdistrictName: address.subdistrict_name || '',
    });
  }, [onChange]);

  const notifyNew = useCallback((data) => {
    if (!onChange) return;
    const provinces = provinceOptionsRef.current;
    const districts = districtOptionsRef.current;
    const subdistricts = subdistrictOptionsRef.current;

    onChange({
      mode: 'new',
      addressId: null,
      shippingAddress: data.address || '',
      phone: data.phone || '',
      provinceId: data.province_id || '',
      districtId: data.district_id || '',
      subdistrictId: data.subdistrict_id || '',
      postalCode: data.postal_code || '',
      provinceName: provinces.find((p) => String(p.id) === String(data.province_id))?.name_th || '',
      districtName: districts.find((d) => String(d.id) === String(data.district_id))?.name_th || '',
      subdistrictName: subdistricts.find((s) => String(s.id) === String(data.subdistrict_id))?.name_th || '',
    });
  }, [onChange]);

  const loadAddresses = useCallback(async (preferredId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${host}/api/customers/${userId}/addresses`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new Error('Failed to load addresses');
      }
      const payload = await response.json();
      const rows = Array.isArray(payload) ? payload : [];
      setAddresses(rows);
      if (rows.length) {
        const chosen = rows.find((item) => String(item.id) === String(preferredId))
          || rows.find((item) => item.is_default)
          || rows[0];
        if (chosen) {
          setSelectedId(chosen.id);
          notifyExisting(chosen);
          return;
        }
      }
      setSelectedId('new');
      setForm((prev) => ({
        ...ADDRESS_FORM_DEFAULT,
        phone: prev.phone || defaultPhone,
        recipient_name: prev.recipient_name || defaultRecipient,
      }));
      notifyNew({ ...ADDRESS_FORM_DEFAULT, phone: defaultPhone, recipient_name: defaultRecipient });
    } catch (error) {
      console.error('Failed to load addresses:', error);
      setAddresses([]);
      setSelectedId('new');
      notifyNew({ ...ADDRESS_FORM_DEFAULT, phone: defaultPhone, recipient_name: defaultRecipient });
    } finally {
      setLoading(false);
    }
  }, [userId, host, notifyExisting, notifyNew, defaultPhone, defaultRecipient]);

  useEffect(() => {
    if (!userId) return;
    loadAddresses();
  }, [userId, loadAddresses]);

  useEffect(() => {
    let active = true;
    const loadProvinces = async () => {
      try {
        const response = await fetch(`${host}/api/customers/provinces`);
        if (!response.ok) {
          throw new Error('Failed to load provinces');
        }
        const payload = await response.json();
        if (active) {
          setProvinceOptions(Array.isArray(payload) ? payload : []);
        }
      } catch (error) {
        if (active) {
          console.error('Failed to load provinces:', error);
          setProvinceOptions((prev) => {
            if (!prev.length) return prev;
            return [];
          });
        }
      }
    };
    loadProvinces();
    return () => {
      active = false;
    };
  }, [host]);

  useEffect(() => {
    if (selectedId !== 'new') return;
    if (!provinceId) {
      setDistrictOptions((prev) => {
        if (!prev.length) return prev;
        return [];
      });
      setSubdistrictOptions((prev) => {
        if (!prev.length) return prev;
        return [];
      });
      setForm((prev) => {
        if (!prev.district_id && !prev.subdistrict_id && !prev.postal_code) {
          return prev;
        }
        const next = { ...prev, district_id: '', subdistrict_id: '', postal_code: '' };
        notifyNew(next);
        return next;
      });
      return;
    }

    let cancelled = false;
    const loadDistricts = async () => {
      try {
        const response = await fetch(`${host}/api/customers/districts?province_id=${provinceId}`);
        if (!response.ok) {
          throw new Error('Failed to load districts');
        }
        const payload = await response.json();
        if (cancelled) return;
        const options = Array.isArray(payload) ? payload : [];
        setDistrictOptions(options);
        if (!options.some((item) => String(item.id) === String(districtId))) {
          setForm((prev) => {
            if (!prev.district_id && !prev.subdistrict_id && !prev.postal_code) {
              return prev;
            }
            const next = { ...prev, district_id: '', subdistrict_id: '', postal_code: '' };
            notifyNew(next);
            return next;
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load districts:', error);
          setDistrictOptions((prev) => {
            if (!prev.length) return prev;
            return [];
          });
        }
      }
    };
    loadDistricts();
    return () => {
      cancelled = true;
    };
  }, [selectedId, provinceId, districtId, host, notifyNew]);

  useEffect(() => {
    if (selectedId !== 'new') return;
    if (!districtId) {
      setSubdistrictOptions((prev) => {
        if (!prev.length) return prev;
        return [];
      });
      setForm((prev) => {
        if (!prev.subdistrict_id && !prev.postal_code) {
          return prev;
        }
        const next = { ...prev, subdistrict_id: '', postal_code: '' };
        notifyNew(next);
        return next;
      });
      return;
    }

    let cancelled = false;
    const loadSubdistricts = async () => {
      try {
        const response = await fetch(`${host}/api/customers/subdistricts?district_id=${districtId}`);
        if (!response.ok) {
          throw new Error('Failed to load subdistricts');
        }
        const payload = await response.json();
        if (cancelled) return;
        const options = Array.isArray(payload) ? payload : [];
        setSubdistrictOptions(options);
        const matched = options.find((item) => String(item.id) === String(subdistrictId));
        if (!matched) {
          setForm((prev) => {
            if (!prev.subdistrict_id && !prev.postal_code) {
              return prev;
            }
            const next = { ...prev, subdistrict_id: '', postal_code: '' };
            notifyNew(next);
            return next;
          });
          return;
        }
        if (matched.postal_code && String(matched.postal_code ?? '') !== String(postalCode ?? '')) {
          const nextPostal = String(matched.postal_code ?? '');
          setForm((prev) => {
            if (String(prev.postal_code ?? '') === nextPostal) {
              return prev;
            }
            const next = { ...prev, postal_code: nextPostal };
            notifyNew(next);
            return next;
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load subdistricts:', error);
          setSubdistrictOptions((prev) => {
            if (!prev.length) return prev;
            return [];
          });
        }
      }
    };
    loadSubdistricts();
    return () => {
      cancelled = true;
    };
  }, [selectedId, districtId, subdistrictId, postalCode, host, notifyNew]);

  const handleSelectExisting = (address) => {
    setSelectedId(address.id);
    setMessage({ type: null, text: '' });
    notifyExisting(address);
  };

  const handleSelectNew = () => {
    setSelectedId('new');
    setMessage({ type: null, text: '' });
    const next = {
      ...form,
      recipient_name: form.recipient_name || defaultRecipient,
      phone: form.phone || defaultPhone,
    };
    setForm(next);
    notifyNew(next);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setMessage({ type: null, text: '' });
    if (name === 'postal_code') {
      const digits = value.replace(/\D/g, '').slice(0, 5);
      const next = { ...form, postal_code: digits };
      setForm(next);
      notifyNew(next);
      return;
    }
    if (name === 'province_id') {
      const next = { ...form, province_id: value, district_id: '', subdistrict_id: '', postal_code: '' };
      setForm(next);
      notifyNew(next);
      return;
    }
    if (name === 'district_id') {
      const next = { ...form, district_id: value, subdistrict_id: '', postal_code: '' };
      setForm(next);
      notifyNew(next);
      return;
    }
    if (name === 'subdistrict_id') {
      const next = { ...form, subdistrict_id: value, postal_code: value ? form.postal_code : '' };
      setForm(next);
      notifyNew(next);
      return;
    }
    const next = { ...form, [name]: value };
    setForm(next);
    notifyNew(next);
  };

  const handleSaveNewAddress = async () => {
    if (!userId) {
      setMessage({ type: 'error', text: 'กรุณาเข้าสู่ระบบก่อนบันทึกที่อยู่' });
      return;
    }
    const required = [form.address, form.phone, form.province_id, form.district_id, form.subdistrict_id];
    if (required.some((item) => !item || String(item).trim() === '')) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลที่อยู่และพื้นที่ให้ครบถ้วน' });
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${host}/api/customers/${userId}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          label: form.label || 'ที่อยู่สำหรับชำระเงิน',
          recipient_name: form.recipient_name || defaultRecipient,
          phone: form.phone,
          address: form.address,
          postal_code: form.postal_code || null,
          province_id: form.province_id || null,
          district_id: form.district_id || null,
          subdistrict_id: form.subdistrict_id || null,
          is_default: addresses.length === 0 ? 1 : 0,
        }),
      });
      const created = await response.json();
      if (!response.ok) {
        throw new Error(created?.message || 'บันทึกที่อยู่ไม่สำเร็จ');
      }
      setMessage({ type: 'success', text: 'บันทึกที่อยู่เรียบร้อย' });
      await loadAddresses(created.id);
    } catch (error) {
      console.error('Failed to save address:', error);
      setMessage({ type: 'error', text: error?.message || 'บันทึกที่อยู่ไม่สำเร็จ' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {isInitialLoading ? (
        <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500">
          กำลังโหลดที่อยู่...
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">ที่อยู่สำหรับจัดส่ง</h3>
            {message.text && (
              <span className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {addresses.length > 0 && (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`flex items-start gap-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer ${String(selectedId) === String(address.id) ? 'border-green-500 ring-1 ring-green-200 bg-green-50' : 'border-gray-200'}`}
                  >
                    <input
                      type="radio"
                      name="checkout_address"
                      value={address.id}
                      checked={String(selectedId) === String(address.id)}
                      onChange={() => handleSelectExisting(address)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{address.label || 'ที่อยู่ที่บันทึกไว้'}</span>
                        {address.is_default ? (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">ค่าเริ่มต้น</span>
                        ) : null}
                      </div>
                      {address.recipient_name ? (
                        <div className="text-sm text-gray-600">ผู้รับ: {address.recipient_name}</div>
                      ) : null}
                      <div className="text-sm text-gray-700 whitespace-pre-line">
                        {address.address}
                      </div>
                      <div className="text-sm text-gray-500">
                        {[address.subdistrict_name, address.district_name, address.province_name, address.postal_code || address.subdistrict_postal_code]
                          .filter(Boolean)
                          .join(' ')}
                      </div>
                      {address.phone ? (
                        <div className="text-sm text-gray-600">โทร: {address.phone}</div>
                      ) : null}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <label
              className={`flex items-start gap-3 p-3 border-2 rounded-md cursor-pointer ${selectedId === 'new' ? 'border-dashed border-green-500 bg-green-50' : 'border-dashed border-gray-300'}`}
            >
              <input
                type="radio"
                name="checkout_address"
                value="new"
                checked={selectedId === 'new'}
                onChange={handleSelectNew}
                className="mt-1"
              />
              <div className="flex-1">
                <span className="font-medium text-gray-900">ใช้ที่อยู่ใหม่</span>
                <p className="text-sm text-gray-600">กรอกแบบฟอร์มด้านล่างเพื่อบันทึกและใช้ที่อยู่นี้</p>
              </div>
            </label>

            {selectedId === 'new' && (
              <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-white">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้รับ</label>
                    <input
                      type="text"
                      name="recipient_name"
                      value={form.recipient_name}
                      onChange={handleFormChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      placeholder="ชื่อ-นามสกุลผู้รับ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleFormChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      placeholder="0XXXXXXXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                    placeholder="บ้านเลขที่ ถนน หมู่บ้าน"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                    <select
                      name="province_id"
                      value={form.province_id}
                      onChange={handleFormChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                    >
                      <option value="">เลือกจังหวัด</option>
                      {provinceOptions.map((item) => (
                        <option key={item.id} value={item.id}>{item.name_th}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">อำเภอ/เขต</label>
                    <select
                      name="district_id"
                      value={form.district_id}
                      onChange={handleFormChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      disabled={!form.province_id}
                    >
                      <option value="">เลือกอำเภอ/เขต</option>
                      {districtOptions.map((item) => (
                        <option key={item.id} value={item.id}>{item.name_th}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ตำบล/แขวง</label>
                    <select
                      name="subdistrict_id"
                      value={form.subdistrict_id}
                      onChange={handleFormChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      disabled={!form.district_id}
                    >
                      <option value="">เลือกตำบล/แขวง</option>
                      {subdistrictOptions.map((item) => (
                        <option key={item.id} value={item.id}>{item.name_th}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์</label>
                    <input
                      type="text"
                      name="postal_code"
                      value={form.postal_code}
                      onChange={handleFormChange}
                      maxLength={5}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      placeholder="xxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ป้ายกำกับ</label>
                    <input
                      type="text"
                      name="label"
                      value={form.label}
                      onChange={handleFormChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      placeholder="เช่น บ้าน, ที่ทำงาน"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNewAddress}
                    className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:bg-gray-400"
                    disabled={saving}
                  >
                    {saving ? 'กำลังบันทึก...' : 'บันทึกที่อยู่'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CheckoutAddressForm;
