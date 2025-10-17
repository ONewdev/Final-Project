import React, { useEffect, useState, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import Swal from 'sweetalert2';
import { FaEdit, FaPlus, FaTimes, FaImage, FaSearch, FaEye } from 'react-icons/fa';

// ---------------- Modal ----------------
const Modal = React.memo(({ show, onHide, children, title }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-500/75" aria-hidden="true"></div>
      <div className="relative w-full max-w-3xl bg-white rounded-lg text-left shadow-xl">
        <div className="bg-white px-6 pt-6 pb-4 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onHide}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <FaTimes size={20} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
});

// ---------------- Page ----------------
function Products() {
  const host = import.meta.env.VITE_HOST || 'http://localhost:3000';

  // data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);

  // ui states
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); // dropdown filter

  // modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // item states
  const [editProduct, setEditProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    quantity: '',
    size: '',
    color: '',
    image: null,
    status: 'active',
  });

  // next-code states (สำหรับโชว์รหัสล่วงหน้าใน Add Modal)
  const [nextCode, setNextCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);

  // preview states
  const [addPreview, setAddPreview] = useState(null);
  const [editPreview, setEditPreview] = useState(null);

  // -------- Fetchers --------
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${host}/api/products`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (e) {
      console.error(e);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลสินค้าได้', 'error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${host}/api/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (e) {
      console.error(e);
      setCategories([]);
    }
  };

  const fetchColors = async () => {
    try {
      const res = await fetch(`${host}/api/colors`);
      if (!res.ok) throw new Error('Failed to fetch colors');
      const data = await res.json();
      setColorOptions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setColorOptions([]);
    }
  };

  // โหลด "รหัสถัดไป" สำหรับโชว์ใน Add Modal เท่านั้น
  const loadNextCode = useCallback(async () => {
    try {
      setCodeLoading(true);
      const res = await fetch(`${host}/api/products/next-code`);
      if (!res.ok) throw new Error('fail');
      const data = await res.json();
      setNextCode(data?.next_code || '');
    } catch (err) {
      console.error('loadNextCode error:', err);
      setNextCode('—');
    } finally {
      setCodeLoading(false);
    }
  }, [host]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchColors();
  }, [host]);

  // -------- Filters --------
  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      const matchText =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category_name?.toString().toLowerCase().includes(q);
      const matchCat =
        !selectedCategory || String(p.category_id) === String(selectedCategory);
      return matchText && matchCat;
    });
  }, [products, searchTerm, selectedCategory]);

  // เติมลำดับตามที่ "กรองแล้ว"
  const displayedProducts = useMemo(
    () => filteredProducts.map((p, idx) => ({ ...p, _no: idx + 1 })),
    [filteredProducts]
  );

  // -------- Utils --------
  const removeCommas = (v = '') => v.toString().replace(/,/g, '');
  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    const cleaned = value.toString().replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };
  const formatPrice = (price) => {
    const n = parseFloat(price);
    return Number.isNaN(n) ? '-' : `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
  };

  // -------- Handlers: table actions --------
  const handleViewDetails = (id) => {
    const p = products.find((x) => x.id === id);
    if (p) {
      setDetailProduct(p);
      setShowDetailModal(true);
    }
  };

  const handleEdit = (id) => {
    const p = products.find((x) => x.id === id);
    if (p) {
      // เคลียร์พรีวิวเดิมก่อน
      if (editPreview) URL.revokeObjectURL(editPreview);
      setEditPreview(null);
      setEditProduct({ ...p });
      setShowEditModal(true);
    }
  };

  // -------- Handlers: edit form --------
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditProduct((prev) => ({ ...prev, [name]: name === 'price' ? removeCommas(value) : value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editProduct) return;

    try {
      const formData = new FormData();
      Object.keys(editProduct).forEach((key) => {
        if (key !== 'image' && editProduct[key] !== null && editProduct[key] !== undefined) {
          formData.append(key, editProduct[key]);
        }
      });
      if (editProduct.image && editProduct.image instanceof File) {
        formData.append('image', editProduct.image);
      }

      const res = await fetch(`${host}/api/products/${editProduct.id}`, {
        method: 'PATCH',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        console.error('Server validation error:', err);
        throw new Error('Failed to update product');
      }
      const updated = await res.json();
      Swal.fire('สำเร็จ', 'อัปเดตข้อมูลสินค้าสำเร็จแล้ว', 'success');
      setProducts((prev) => prev.map((p) => (p.id === editProduct.id ? updated : p)));
      // ปิดโมดัล + ล้างพรีวิว
      if (editPreview) URL.revokeObjectURL(editPreview);
      setEditPreview(null);
      setShowEditModal(false);
      setEditProduct(null);
    } catch (error) {
      console.error(error);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตสินค้าได้', 'error');
    }
  };

  const handleDeleteProduct = async () => {
    if (!editProduct) return;
    const result = await Swal.fire({
      title: 'ยืนยันการลบสินค้า?',
      text: 'คุณต้องการลบสินค้านี้หรือไม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${host}/api/products/${editProduct.id}`, { method: 'DELETE' });
      let data = null;
      try { data = await res.json(); } catch (_) {}
      if (!res.ok) {
        Swal.fire('ลบไม่สำเร็จ', data?.error || data?.message || 'ไม่สามารถลบสินค้าได้', 'error');
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== editProduct.id));
      Swal.fire('สำเร็จ', 'ลบสินค้าสำเร็จ', 'success');
      if (editPreview) URL.revokeObjectURL(editPreview);
      setEditPreview(null);
      setShowEditModal(false);
      setEditProduct(null);
    } catch (e) {
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบสินค้าได้', 'error');
    }
  };

  // -------- Handlers: add form --------
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: name === 'price' ? removeCommas(value) : value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    if (showEditModal) {
      setEditProduct((prev) => ({ ...prev, image: file }));
      setEditPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } else {
      setNewProduct((prev) => ({ ...prev, image: file }));
      setAddPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    }
  };

  const resetNewProduct = useCallback(() => {
    setNewProduct({
      name: '',
      description: '',
      category_id: '',
      price: '',
      quantity: '',
      size: '',
      color: '',
      image: null,
      status: 'active',
    });
    if (addPreview) URL.revokeObjectURL(addPreview);
    setAddPreview(null);
    setNextCode('');
    setCodeLoading(false);
  }, [addPreview]);

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    resetNewProduct();
  }, [resetNewProduct]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('description', newProduct.description);
      formData.append('category_id', newProduct.category_id);
      formData.append('price', newProduct.price);
      formData.append('quantity', newProduct.quantity);
      formData.append('size', newProduct.size || '');
      formData.append('color', newProduct.color || '');
      formData.append('status', newProduct.status || 'active');
      if (newProduct.image) formData.append('image', newProduct.image);

      const res = await fetch(`${host}/api/products`, { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        console.error('Server validation error:', err);
        throw new Error('Failed to add product');
      }
      const added = await res.json();
      Swal.fire('สำเร็จ', 'เพิ่มสินค้าสำเร็จแล้ว', 'success');
      setProducts((prev) => [added, ...prev]);
      setShowAddModal(false);
      resetNewProduct();
    } catch (error) {
      console.error(error);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มสินค้าได้', 'error');
    }
  };

  

  // -------- DataTable columns --------
  const columns = [
    {
      name: <span className="whitespace-nowrap">ลำดับ</span>,
      selector: (row) => row._no,
      width: '96px',

      sortable: true,
    },
    {
      name: 'รหัสสินค้า',
      selector: (row) => row.product_code,
      sortable: true,
      width: '140px',
    },
    {
      name: 'รูปภาพ',
      cell: (row) =>
        row.image_url ? (
          <img
            src={`${host}${String(row.image_url).startsWith('/') ? '' : '/'}${row.image_url}`}
            alt={row.name}
            className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200 shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500">
            <FaImage size={20} />
          </div>
        ),
      width: '100px',
    },
    {
      name: 'ชื่อสินค้า',
      selector: (row) => row.name,
      wrap: true,
      sortable: true,
    },
    {
      name: 'หมวดหมู่',
      selector: (row) => row.category_name,
      width: '170px',
      sortable: true,
    },
    {
      name: 'ราคา',
      selector: (row) => row.price,
      cell: (row) => <span className="font-medium text-green-600">{formatPrice(row.price)}</span>,
      width: '120px',
      sortable: true,
    },
    {
      name: 'จำนวน',
      selector: (row) => row.quantity,
      width: '100px',
      sortable: true,
      cell: (row) => (
        <span className={row.quantity <= 5 ? 'text-red-600 font-medium' : 'text-gray-900'}>
          {row.quantity}
        </span>
      ),
    },
    {
      name: 'สถานะ',
      cell: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
        >
          {row.status === 'active' ? 'แสดง' : 'ไม่แสดง'}
        </span>
      ),
      width: '100px',
      sortable: true,
    },
    {
      name: 'จัดการ',
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewDetails(row.id)}
            className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="รายละเอียด"
          >
            <FaEye size={14} />
          </button>
          <button
            onClick={() => handleEdit(row.id)}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="แก้ไข"
          >
            <FaEdit size={14} />
          </button>
        </div>
      ),
      width: '140px',
    },
  ];

  // -------- DataTable styles --------
  const customStyles = {
    table: { style: { backgroundColor: '#ffffff' } },
    headRow: {
      style: {
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0',
        minHeight: '52px',
      },
    },
    headCells: {
      style: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        paddingLeft: '16px',
        paddingRight: '16px',
        whiteSpace: 'nowrap',
      },
    },
    cells: {
      style: {
        fontSize: '14px',
        color: '#6b7280',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
      },
    },
    rows: {
      style: {
        minHeight: '60px',
        '&:hover': { backgroundColor: '#f9fafb' },
      },
    },
  };

  // --- cleanup previews on unmount
  useEffect(() => {
    return () => {
      if (addPreview) URL.revokeObjectURL(addPreview);
      if (editPreview) URL.revokeObjectURL(editPreview);
    };
  }, [addPreview, editPreview]);

  // ---------------- Render ----------------
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการสินค้า</h1>
          <p className="text-gray-600">จัดการข้อมูลสินค้าทั้งหมดในระบบ</p>
        </div>

        {/* Toolbar: add + search + category filter */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 justify-between items-stretch">
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await loadNextCode();
                setShowAddModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
            >
              <FaPlus className="mr-2" size={14} />
              เพิ่มสินค้าใหม่
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full lg:w-auto">
            {/* search */}
            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              aria-label="กรองตามหมวดหมู่"
            >
              <option value="">หมวดหมู่: ทั้งหมด</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">สินค้าทั้งหมด</h3>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">สินค้าที่แสดง</h3>
            <p className="text-2xl font-bold text-green-600">
              {products.filter((p) => p.status === 'active').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">สินค้าใกล้หมด</h3>
            <p className="text-2xl font-bold text-red-600">
              {products.filter((p) => Number(p.quantity) <= 5).length}
            </p>
          </div>
        </div>

        {/* table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">กำลังโหลดข้อมูล...</p>
            </div>
          ) : displayedProducts.length > 0 ? (
            <DataTable
              keyField="id"
              columns={columns}
              data={displayedProducts}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20, 50]}
              customStyles={customStyles}
              highlightOnHover
              pointerOnHover
            />
          ) : (
            <div className="text-center py-12">
              <FaImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">ไม่มีข้อมูลสินค้า</p>
            </div>
          )}
        </div>

        {/* ===== Modal: Edit product ===== */}
        <Modal
          show={showEditModal}
          onHide={() => {
            if (editPreview) URL.revokeObjectURL(editPreview);
            setEditPreview(null);
            setShowEditModal(false);
            setEditProduct(null);
          }}
          title="แก้ไขข้อมูลสินค้า"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* 1) หมวดหมู่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                value={editProduct?.category_id || ''}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2) รหัสสินค้า (แก้ไขไม่ได้) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสสินค้า</label>
              <input
                type="text"
                name="product_code"
                value={editProduct?.product_code || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-500 rounded-lg"
                tabIndex={-1}
              />
            </div>

            {/* 3) ชื่อสินค้า */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อสินค้า <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={editProduct?.name || ''}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* 4) ราคา & 5) จำนวน */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ราคา <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="price"
                  value={formatNumberWithCommas(editProduct?.price) || ''}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวน <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={editProduct?.quantity || ''}
                  onChange={handleEditChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            {/* 6) สี */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สี (color)</label>
              <select
                name="color"
                value={editProduct?.color || ''}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- เลือกสี --</option>
                <option value="ขาว">ขาว</option>
                <option value="ดำ">ดำ</option>
                <option value="เงิน">เงิน</option>
                <option value="อบขาว">อบขาว</option>
                <option value="ชา">ชา</option>
                <option value="ลายไม้จามจุรี">ลายไม้จามจุรี</option>
              </select>
            </div>

            {/* 7) ขนาด */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ขนาด (size)</label>
              <input
                type="text"
                name="size"
                value={editProduct?.size || ''}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น 120x180 cm"
              />
            </div>

            {/* 8) รายละเอียด */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดสินค้า</label>
              <textarea
                name="description"
                value={editProduct?.description || ''}
                onChange={handleEditChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="กรอกรายละเอียดสินค้า..."
              />
            </div>

            {/* 9) รูปภาพ + พรีวิว */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพ</label>
              <input
                type="file"
                name="image"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* ถ้าเลือกไฟล์ใหม่ ให้พรีวิวไฟล์ใหม่ก่อน */}
              {editPreview ? (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={editPreview}
                    alt="พรีวิวรูปใหม่"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(editPreview);
                      setEditPreview(null);
                      setEditProduct((prev) => ({ ...prev, image: null }));
                    }}
                    className="px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                  >
                    ลบรูปใหม่
                  </button>
                </div>
              ) : (
                editProduct?.image_url && (
                  <div className="mt-3">
                    <img
                      src={`${host}${String(editProduct.image_url).startsWith('/') ? '' : '/'}${editProduct.image_url}`}
                      alt="Product"
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )
              )}
            </div>

            {/* 10) สถานะ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
              <select
                name="status"
                value={editProduct?.status ?? 'active'}
                onChange={(e) =>
                  setEditProduct((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="active">แสดง</option>
                <option value="inactive">ไม่แสดง</option>
              </select>
            </div>


            <div className="flex justify-between items-center pt-4 border-t">
              <button
                type="button"
                onClick={handleDeleteProduct}
                className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
              >
                ลบสินค้า
              </button>
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    if (editPreview) URL.revokeObjectURL(editPreview);
                    setEditPreview(null);
                    setShowEditModal(false);
                    setEditProduct(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                >
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </div>
          </form>
        </Modal>

        {/* ===== Modal: View details ===== */}
        <Modal
          show={showDetailModal}
          onHide={() => {
            setShowDetailModal(false);
            setDetailProduct(null);
          }}
          title="รายละเอียดสินค้า"
        >
          {detailProduct && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {detailProduct.image_url ? (
                  <img
                    src={`${host}${String(detailProduct.image_url).startsWith('/') ? '' : '/'}${detailProduct.image_url}`}
                    alt={detailProduct.name}
                    className="w-28 h-28 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                    <FaImage size={24} />
                  </div>
                )}
                <div className="flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">รหัสสินค้า</p>
                      <p className="font-medium text-gray-900">{detailProduct.product_code || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ชื่อสินค้า</p>
                      <p className="font-medium text-gray-900">{detailProduct.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">หมวดหมู่</p>
                      <p className="font-medium text-gray-900">{detailProduct.category_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ราคา</p>
                      <p className="font-medium text-green-600">{formatPrice(detailProduct.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">จำนวน</p>
                      <p
                        className={`font-medium ${Number(detailProduct.quantity) <= 5 ? 'text-red-600' : 'text-gray-900'
                          }`}
                      >
                        {detailProduct.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">สถานะ</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${detailProduct.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {detailProduct.status === 'active' ? 'แสดง' : 'ไม่แสดง'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ขนาด (size)</p>
                      <p className="font-medium text-gray-900">{detailProduct.size || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">สี (color)</p>
                      <p className="font-medium text-gray-900">{detailProduct.color || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">รายละเอียดสินค้า</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {detailProduct.description || '-'}
                </p>
              </div>

              <div className="flex justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetailProduct(null);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                >
                  ปิด
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* ===== Modal: Add product ===== */}
        <Modal show={showAddModal} onHide={closeAddModal} title="เพิ่มสินค้าใหม่">
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {/* 1) หมวดหมู่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                value={newProduct.category_id}
                onChange={handleAddChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2) รหัสสินค้า (โชว์อย่างเดียวจาก /next-code) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสสินค้า</label>
              <input
                type="text"
                value={codeLoading ? 'กำลังสร้าง…' : (nextCode || '-')}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-600 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                ระบบจะออกเลขจริงขณะบันทึก (ตัวเลขนี้อาจเปลี่ยนหากมีการเพิ่มพร้อมกัน)
              </p>
            </div>

            {/* 3) ชื่อสินค้า */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อสินค้า <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                placeholder="กรอกชื่อสินค้า"
                value={newProduct.name}
                onChange={handleAddChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* 4) ราคา & 5) จำนวน */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ราคา <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="price"
                  value={formatNumberWithCommas(newProduct.price)}
                  onChange={handleAddChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวน <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  placeholder="0"
                  value={newProduct.quantity}
                  onChange={handleAddChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* 6) สี (options จาก backend) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สี (color)</label>
              <select
                name="color"
                value={newProduct.color}
                onChange={handleAddChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">-- เลือกสี --</option>
                {colorOptions.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>

            {/* 7) ขนาด */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ขนาด (size)</label>
              <input
                type="text"
                name="size"
                placeholder="เช่น 120x180 cm"
                value={newProduct.size}
                onChange={handleAddChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* 8) รายละเอียด */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดสินค้า</label>
              <textarea
                name="description"
                placeholder="กรอกรายละเอียดสินค้า"
                value={newProduct.description}
                onChange={handleAddChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* 9) รูปภาพ + พรีวิวก่อนบันทึก */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพ</label>
              <input
                type="file"
                name="image"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {addPreview && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={addPreview}
                    alt="พรีวิวรูปสินค้า"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(addPreview);
                      setAddPreview(null);
                      setNewProduct((prev) => ({ ...prev, image: null }));
                    }}
                    className="px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                  >
                    ลบรูป
                  </button>
                </div>
              )}
            </div>

            {/* 10) สถานะ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
              <select
                name="status"
                value={newProduct?.status ?? 'active'}
                onChange={(e) =>
                  setNewProduct((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              >
                <option value="active">แสดง</option>
                <option value="inactive">ไม่แสดง</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={closeAddModal}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
              >
                บันทึกสินค้า
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

export default Products;
