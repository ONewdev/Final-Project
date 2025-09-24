import React, { useEffect, useMemo, useState } from 'react';
import { calculatePrice } from '../utils/pricing';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';

const host = import.meta.env.VITE_HOST || '';

function toMeters(value, unit) {
  const n = parseFloat(String(value || ''));
  if (isNaN(n) || n <= 0) return 0;
  return unit === 'cm' ? n / 100 : n;
}

function getCartKey(user) {
  return user ? `custom_cart_${user.id}` : 'custom_cart_guest';
}

function readCart(user) {
  try {
    const raw = localStorage.getItem(getCartKey(user));
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeCart(user, arr) {
  localStorage.setItem(getCartKey(user), JSON.stringify(arr || []));
}

function Custom() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    category: '',
    width: '',
    height: '',
    unit: 'cm',
    color: '',
    quantity: 1,
    details: '',
    hasScreen: false,
    roundFrame: false,
    swingType: 'บานเดี่ยว',
    mode: 'มาตรฐาน',
    fixedLeftM2: '',
    fixedRightM2: '',
  });

  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  // ==== CART STATE (ขวา) ====
  const [cart, setCart] = useState(() => readCart(user));

  useEffect(() => {
    // refresh cart เมื่อ user เปลี่ยน (เช่น login/logout)
    setCart(readCart(user));
  }, [user]);

  useEffect(() => {
    fetch(`${host}/api/categories`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
        else if (Array.isArray(data.data)) setCategories(data.data);
        else if (Array.isArray(data.categories)) setCategories(data.categories);
        else if (data && typeof data === 'object') {
          const arr = Object.values(data).find(v => Array.isArray(v));
          setCategories(arr || []);
        } else setCategories([]);
      })
      .catch(err => { console.error('API /api/categories error:', err); setCategories([]); });
  }, []);

  const selectedCategory = useMemo(
    () => categories.find(c => String(c.category_id) === String(form.category)) || null,
    [categories, form.category]
  );

  const productType = selectedCategory?.category_name || '';

  const categoryImageUrl = useMemo(() => {
    const file = selectedCategory?.image_url;
    return file ? `${host}/uploads/categories/${file}` : null;
  }, [selectedCategory]);

  const parsed = useMemo(() => {
    const widthM = toMeters(form.width, form.unit);
    const heightM = toMeters(form.height, form.unit);
    if (!widthM || !heightM) return null;
    const widthCm = widthM * 100;
    const heightCm = heightM * 100;
    const areaM2 = widthM * heightM;
    return { widthCm, heightCm, widthM, heightM, areaM2 };
  }, [form.width, form.height, form.unit]);

  const sizeString = useMemo(() => {
    if (!form.width || !form.height) return '';
    return `${form.width}x${form.height} ${form.unit}`;
  }, [form.width, form.height, form.unit]);

  const autoEstimated = useMemo(() => {
    if (!productType) return 0;
    const input = {
      type: productType,
      quantity: Number(form.quantity) || 1,
      color: form.color,
      size: sizeString,
      parsed,
      hasScreen: form.hasScreen,
      roundFrame: form.roundFrame,
      swingType: form.swingType,
      mode: form.mode,
      fixedLeftM2: parseFloat(form.fixedLeftM2 || '0') || 0,
      fixedRightM2: parseFloat(form.fixedRightM2 || '0') || 0,
    };
    return calculatePrice(input);
  }, [productType, form, parsed, sizeString]);

  useEffect(() => setEstimatedPrice(autoEstimated), [autoEstimated]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const clampQty = (q) => Math.max(1, Number.isFinite(q) ? Math.floor(q) : 1);
  const handleQty = (delta) => {
    setForm(prev => ({ ...prev, quantity: clampQty((Number(prev.quantity) || 1) + delta) }));
  };

  // ====== เพิ่มลงตะกร้า (ไม่ส่งทันที) ======
  const handleAddToCart = async () => {
    // validation ขั้นพื้นฐาน
    if (!form.category || !form.width || !form.height || !form.color) {
      Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'ประเภทสินค้า / ขนาด / สี ต้องไม่ว่าง' });
      return;
    }
    if (!parsed) {
      Swal.fire({ icon: 'warning', title: 'คำนวณขนาดไม่ได้', text: 'กรุณาตรวจสอบความกว้าง/ความสูง' });
      return;
    }
    if (!productType) {
      Swal.fire({ icon: 'warning', title: 'ไม่มีประเภทสินค้า', text: 'กรุณาเลือกประเภทสินค้า' });
      return;
    }

    // option เฉพาะประเภท
    const showHasScreen = productType === 'หน้าต่างบานเลื่อน2' || productType === 'หน้าต่างบานเลื่อน4';
    const showRoundFrame = productType === 'ประตูมุ้ง';
    const showSwingType = productType === 'ประตูสวิง';
    const showHangingOptions = productType === 'ประตูรางแขวน';
    const showFixedAreas = showHangingOptions && form.mode === 'แบ่ง4';

    const item = {
      id: Date.now(), // simple unique
      category_id: form.category,
      productType,
      size: sizeString,
      parsed, // เก็บไว้ส่งให้ backend ด้วย
      unit: form.unit,
      width: form.width,
      height: form.height,
      color: form.color,
      quantity: clampQty(Number(form.quantity) || 1),
      details: form.details || '',
      // เงื่อนไขที่เกี่ยวข้องเท่านั้น
      hasScreen: showHasScreen ? form.hasScreen : false,
      roundFrame: showRoundFrame ? form.roundFrame : false,
      swingType: showSwingType ? form.swingType : '',
      mode: showHangingOptions ? form.mode : 'มาตรฐาน',
      fixedLeftM2: showFixedAreas ? (form.fixedLeftM2 === '' ? null : parseFloat(form.fixedLeftM2)) : null,
      fixedRightM2: showFixedAreas ? (form.fixedRightM2 === '' ? null : parseFloat(form.fixedRightM2)) : null,
      // ราคาประเมิน
      estimatedPrice: Number(estimatedPrice) || 0,
      // image preview (optional)
      categoryImageUrl,
    };

    const next = [...cart, item];
    setCart(next);
    writeCart(user, next);

    Swal.fire({
      icon: 'success',
      title: 'เพิ่มลงตะกร้าแล้ว',
      text: `${productType} - ${item.size}`,
      timer: 1500,
      showConfirmButton: false
    });
  };

  // ====== ฟังก์ชันจัดการตะกร้า ======
  const removeCartItem = (id) => {
    const next = cart.filter(i => i.id !== id);
    setCart(next);
    writeCart(user, next);
  };

  const changeQtyInCart = (id, delta) => {
    const next = cart.map(i => {
      if (i.id !== id) return i;
      const q = Math.max(1, (Number(i.quantity) || 1) + delta);
      // อัปเดตราคาประเมินตาม qty ใหม่
      const p = i.estimatedPrice / (i.quantity || 1); // ราคาเฉลี่ยต่อชิ้นเก่า
      return { ...i, quantity: q, estimatedPrice: Math.max(0, Math.round(p * q)) };
    });
    setCart(next);
    writeCart(user, next);
  };

  const clearCart = () => {
    Swal.fire({
      icon: 'question',
      title: 'ล้างตะกร้า?',
      showCancelButton: true,
      confirmButtonText: 'ล้าง',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626'
    }).then(r => {
      if (r.isConfirmed) {
        setCart([]);
        writeCart(user, []);
      }
    });
  };

  const cartSubtotal = cart.reduce((sum, i) => sum + (Number(i.estimatedPrice) || 0), 0);

  // ====== ส่งคำสั่งทำจาก "ตะกร้า" ทั้งหมด ======
  const handleSubmitCart = async () => {
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเข้าสู่ระบบ',
        text: 'ต้องเข้าสู่ระบบก่อนส่งคำสั่งทำ',
        confirmButtonText: 'เข้าสู่ระบบ',
        showCancelButton: true,
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#dc2626'
      }).then((result) => {
        if (result.isConfirmed) navigate('/login');
      });
      return;
    }

    if (!cart.length) {
      Swal.fire({ icon: 'info', title: 'ตะกร้าว่าง', text: 'เพิ่มรายการก่อนส่งคำสั่งทำ' });
      return;
    }

    setLoading(true);
    try {
      // ยิงทีละรายการ (ถ้ามี endpoint bulk ค่อยเปลี่ยนมาใช้ทีเดียว)
      const results = await Promise.allSettled(
        cart.map(async (item) => {
          const payload = {
            category: item.category_id,
            width: item.width,
            height: item.height,
            unit: item.unit,
            color: item.color,
            quantity: item.quantity,
            details: item.details,
            hasScreen: item.hasScreen,
            roundFrame: item.roundFrame,
            swingType: item.swingType,
            mode: item.mode,
            fixedLeftM2: item.fixedLeftM2,
            fixedRightM2: item.fixedRightM2,
            productType: item.productType,
            size: item.size,
            parsed: item.parsed,
            priceClient: item.estimatedPrice,
            user_id: user.id,
          };
          const res = await fetch(`${host}/api/custom/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          return { ok: res.ok, data };
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        Swal.fire({
          icon: 'success',
          title: `ส่งคำสั่งทำสำเร็จ ${successCount} รายการ`,
          text: failCount ? `ไม่สำเร็จ ${failCount} รายการ` : '',
        });
        setCart([]);
        writeCart(user, []);
      } else {
        Swal.fire({ icon: 'error', title: 'ส่งคำสั่งทำไม่สำเร็จ', text: 'กรุณาลองใหม่หรือติดต่อร้าน' });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถส่งคำสั่งทำได้' });
    } finally {
      setLoading(false);
    }
  };

  // เงื่อนไขแสดง option ตามประเภท (ฝั่งฟอร์ม)
  const showHasScreen = productType === 'หน้าต่างบานเลื่อน2' || productType === 'หน้าต่างบานเลื่อน4';
  const showRoundFrame = productType === 'ประตูมุ้ง';
  const showSwingType = productType === 'ประตูสวิง';
  const showHangingOptions = productType === 'ประตูรางแขวน';
  const showFixedAreas = showHangingOptions && form.mode === 'แบ่ง4';

  return (
    <div style={{ maxWidth: 1200, margin: '32px auto', padding: '0 12px' }}>
      {/* แถวปุ่มกลับ */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={backBtnStyle}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>←</span>
          กลับหน้าก่อนหน้า
        </button>
      </div>

      {/* เลย์เอาต์ 2 คอลัมน์ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        {/* ซ้าย: ฟอร์ม (ไม่มีการ์ด/กล่อง) */}
        <div>
          <h2 style={{ color: '#1976d2', margin: '0 0 16px 0', fontWeight: 800, letterSpacing: 0.5 }}>
            สั่งทำสินค้า
          </h2>

          {/* ประเภทสินค้า */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 600 }}>ประเภทสินค้า</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              style={selectStyle}
            >
              <option value="">เลือกประเภท</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
              ))}
            </select>

            {/* ตัวอย่างภาพ (ถ้ามี) */}
            {selectedCategory && (
              <div style={{ marginTop: 10 }}>
                <div style={{
                  width: '100%',
                  maxHeight: 380,
                  overflow: 'hidden',
                  borderRadius: 12,
                  background: '#f0f0f0',
                  border: '1px solid #e5e5e5'
                }}>
                  {categoryImageUrl ? (
                    <img
                      src={categoryImageUrl}
                      alt={selectedCategory.category_name}
                      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, color: '#aaa' }}>
                      ไม่มีรูปภาพ
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ขนาด */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 600 }}>ขนาด</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 8, marginTop: 4 }}>
              <div>
                <label style={{ fontSize: 14, color: '#555' }}>ความกว้าง</label>
                <input name="width" value={form.width} onChange={handleChange} required inputMode="decimal" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 14, color: '#555' }}>ความสูง</label>
                <input name="height" value={form.height} onChange={handleChange} required inputMode="decimal" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 14, color: '#555' }}>หน่วย</label>
                <select name="unit" value={form.unit} onChange={handleChange} style={selectStyle}>
                  <option value="cm">เซนติเมตร</option>
                  <option value="m">เมตร</option>
                </select>
              </div>
            </div>
          </div>

          {/* สี */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 600 }}>สี</label>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              {['ขาว', 'ชา', 'เงิน', 'ดำ'].map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                  <input
                    type="radio"
                    name="color"
                    value={c}
                    checked={form.color === c}
                    onChange={handleChange}
                  />
                  {c}{c === 'ดำ' && ' (+300)'}
                </label>
              ))}
            </div>
          </div>

          {/* จำนวน */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 600 }}>จำนวน</label>
            <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 56px', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <button type="button" onClick={() => handleQty(-1)} style={iconBtnStyle}>−</button>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={(e) => setForm(prev => ({ ...prev, quantity: clampQty(parseInt(e.target.value, 10)) }))}
                min={1}
                required
                style={{ ...inputStyle, textAlign: 'center' }}
              />
              <button type="button" onClick={() => handleQty(1)} style={iconBtnStyle}>+</button>
            </div>
          </div>

          {/* เงื่อนไขอื่น ๆ */}
          {showHasScreen && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input type="checkbox" name="hasScreen" checked={form.hasScreen} onChange={handleChange} />
              <label>เพิ่มมุ้งลวด (+500)</label>
            </div>
          )}

          {showRoundFrame && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input type="checkbox" name="roundFrame" checked={form.roundFrame} onChange={handleChange} />
              <label>กรอบวงกลม (ติ๊ก = 1200/ชุด, ไม่ติ๊ก = 800/ชุด)</label>
            </div>
          )}

          {showSwingType && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 600 }}>ประเภทประตูสวิง</label>
              <select name="swingType" value={form.swingType} onChange={handleChange} style={selectStyle}>
                <option value="บานเดี่ยว">บานเดี่ยว (≤1.2×2 = 7000)</option>
                <option value="บานคู่">บานคู่ (14000)</option>
              </select>
            </div>
          )}

          {showHangingOptions && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 600 }}>โหมดประตูรางแขวน</label>
              <select name="mode" value={form.mode} onChange={handleChange} style={selectStyle}>
                <option value="มาตรฐาน">มาตรฐาน</option>
                <option value="แบ่ง4">แบ่ง4</option>
              </select>
            </div>
          )}

          {showFixedAreas && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 600 }}>พื้นที่บานตายซ้าย/ขวา (ตร.ม.)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                <input
                  name="fixedLeftM2"
                  value={form.fixedLeftM2}
                  onChange={handleChange}
                  inputMode="decimal"
                  placeholder="ซ้าย"
                  style={inputStyle}
                />
                <input
                  name="fixedRightM2"
                  value={form.fixedRightM2}
                  onChange={handleChange}
                  inputMode="decimal"
                  placeholder="ขวา"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* รายละเอียด */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontWeight: 600 }}>รายละเอียดเพิ่มเติม</label>
            <textarea
              name="details"
              value={form.details}
              onChange={handleChange}
              style={{ ...inputStyle, minHeight: 64 }}
              placeholder="รายละเอียดอื่น ๆ"
            />
          </div>

          {/* ราคาประเมิน + ปุ่มเพิ่มลงตะกร้า */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <span style={{ color: estimatedPrice > 0 ? '#388e3c' : '#e53935', fontWeight: 800, fontSize: 18 }}>
              {estimatedPrice > 0
                ? `ราคาประเมิน: ${Number(estimatedPrice).toLocaleString('th-TH')} บาท`
                : 'ขนาดเล็กกว่าขั้นต่ำ กรุณาติดต่อร้าน'}
            </span>

            <button
              type="button"
              disabled={estimatedPrice <= 0}
              onClick={handleAddToCart}
              style={{ ...buttonStyle, background: '#16a34a' }}
              title="เพิ่มรายการนี้ลงตะกร้าสั่งทำ"
            >
              เพิ่มลงตะกร้าสั่งทำ
            </button>
          </div>
        </div>

        {/* ขวา: ตะกร้าสั่งทำ (Sticky) */}
        <aside style={cartAsideStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ margin: 0, color: '#111827' }}>ตะกร้าสั่งทำ</h3>
            {!!cart.length && (
              <button onClick={clearCart} style={linkBtnStyle}>ล้างตะกร้า</button>
            )}
          </div>

          {!cart.length ? (
            <div style={emptyCartStyle}>ยังไม่มีรายการ</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cart.map(item => (
                <div key={item.id} style={cartItemStyle}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
                      {item.categoryImageUrl ? (
                        <img src={item.categoryImageUrl} alt={item.productType} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : null}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{item.productType}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>{item.size} • สี{item.color}</div>
                      {item.hasScreen && <div style={tagStyle}>มุ้งลวด</div>}
                      {item.roundFrame && <div style={tagStyle}>กรอบวงกลม</div>}
                      {item.swingType && <div style={tagStyle}>{item.swingType}</div>}
                      {item.mode && item.mode !== 'มาตรฐาน' && <div style={tagStyle}>โหมด: {item.mode}</div>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => changeQtyInCart(item.id, -1)} style={qtyBtnStyle}>−</button>
                      <div style={{ minWidth: 28, textAlign: 'center' }}>{item.quantity}</div>
                      <button onClick={() => changeQtyInCart(item.id, +1)} style={qtyBtnStyle}>+</button>
                    </div>
                    <div style={{ fontWeight: 800, color: '#111827' }}>
                      ฿{Number(item.estimatedPrice).toLocaleString('th-TH')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <button onClick={() => removeCartItem(item.id)} style={dangerBtnStyle}>ลบ</button>
                    {item.details ? <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'right', marginLeft: 8, flex: 1 }}>หมายเหตุ: {item.details}</div> : null}
                  </div>
                </div>
              ))}

              <div style={cartTotalBoxStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>ยอดรวม</span>
                  <span>฿{cartSubtotal.toLocaleString('th-TH')}</span>
                </div>
                <button
                  onClick={handleSubmitCart}
                  disabled={loading || !cart.length}
                  style={{ ...buttonStyle, width: '100%', marginTop: 10 }}
                >
                  {loading ? 'กำลังส่ง...' : `ส่งคำสั่งทำ (ทั้งหมด ${cart.length} รายการ)`}
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* ============ Styles ============ */
const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 16,
  marginTop: 4,
  boxSizing: 'border-box',
  outline: 'none'
};
const selectStyle = { ...inputStyle, background: '#fafafa' };
const buttonStyle = {
  padding: '12px 16px',
  borderRadius: 10,
  border: 'none',
  background: '#1976d2',
  color: '#fff',
  fontWeight: 800,
  fontSize: 16,
  cursor: 'pointer',
  transition: 'transform .05s ease',
};
const iconBtnStyle = {
  ...buttonStyle,
  padding: 0,
  height: 44,
  background: '#f5f5f5',
  color: '#333',
  border: '1px solid #ddd',
};
const backBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  background: 'linear-gradient(90deg,#43e97b 0%,#38f9d7 100%)',
  color: '#fff', fontWeight: 800, fontSize: 16,
  border: 'none', borderRadius: 24, padding: '10px 24px',
  boxShadow: '0 2px 8px rgba(67,233,123,0.15)',
  cursor: 'pointer'
};

const cartAsideStyle = {
  position: 'sticky',
  top: 16,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  padding: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
  maxHeight: 'calc(100vh - 32px)',
  overflow: 'auto'
};
const cartItemStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 10,
  background: '#fff'
};
const emptyCartStyle = {
  border: '1px dashed #d1d5db',
  borderRadius: 12,
  padding: 16,
  color: '#6b7280',
  textAlign: 'center',
  background: '#fafafa'
};
const qtyBtnStyle = {
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#f9fafb',
  cursor: 'pointer',
  fontWeight: 800
};
const dangerBtnStyle = {
  border: '1px solid #ef4444',
  background: '#fee2e2',
  color: '#991b1b',
  padding: '6px 10px',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 700
};
const linkBtnStyle = {
  background: 'transparent',
  color: '#2563eb',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700
};
const cartTotalBoxStyle = {
  borderTop: '1px solid #e5e7eb',
  paddingTop: 10,
  marginTop: 2
};
const tagStyle = {
  display: 'inline-block',
  fontSize: 11,
  color: '#374151',
  background: '#f3f4f6',
  border: '1px solid #e5e7eb',
  padding: '2px 6px',
  borderRadius: 999,
  marginTop: 4,
  marginRight: 6
};

export default Custom;
 