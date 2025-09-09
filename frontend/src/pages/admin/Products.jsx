import React, { useEffect, useState, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import Swal from 'sweetalert2';
import { FaEdit, FaPlus, FaTimes, FaImage, FaSearch, FaEye } from 'react-icons/fa';
import { useMemo } from 'react';

// Wrap your Modal component with React.memo
const Modal = React.memo(({ show, onHide, children, title }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">​</span>
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
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
    </div>
  );
});


function Products() {
  const [products, setProducts] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({
    product_code: '',
    name: '',
    description: '',
    category_id: '',
    price: '',
    quantity: '',
    image: null,
    status: 'active',
  });
  

  const host = import.meta.env.VITE_HOST || 'http://localhost:3000';

  // Fetch products data
  useEffect(() => {
    fetchProducts();
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${host}/api/categories`);
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error('Fetch categories error:', error);
      }
    };

    fetchCategories();

  }, [host]);


  const filteredProducts = useMemo(() => {
    if (searchTerm.trim() === '') return products;
    return products.filter(product =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category_name?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);



  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${host}/api/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch error:', error);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลสินค้าได้', 'error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  

  const handleEdit = (id) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      console.log('Edit product:', product); // debug log
      setEditProduct({ ...product });
      setShowEditModal(true);
    }
  };

  const handleViewDetails = (id) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      setDetailProduct(product);
      setShowDetailModal(true);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    // ตรวจสอบถ้าเป็นช่อง 'price' ให้ลบคอมม่าออกก่อน
    const updatedValue = name === 'price' ? removeCommas(value) : value;
    setEditProduct((prev) => ({ ...prev, [name]: updatedValue }));
    console.log(editProduct)
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editProduct) return;

    try {
      const formData = new FormData();
      Object.keys(editProduct).forEach(key => {
        if (key !== 'image' && editProduct[key] !== null && editProduct[key] !== undefined) {
          formData.append(key, editProduct[key]);
        }
      });

      if (editProduct.image && editProduct.image instanceof File) {
        formData.append('image', editProduct.image);
      }

      const response = await fetch(`${host}/api/products/${editProduct.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json(); // หรือ response.text()
        console.error('Server validation error:', errorData); 
        throw new Error('Failed to update product');
      }

      const updatedProduct = await response.json();

      Swal.fire('สำเร็จ', 'อัปเดตข้อมูลสินค้าสำเร็จแล้ว', 'success');
      setProducts((prev) =>
        prev.map((p) => (p.id === editProduct.id ? updatedProduct : p))
      );
      setShowEditModal(false);
      setEditProduct(null);
    } catch (error) {
      console.error('Update error:', error);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตสินค้าได้', 'error');
    }
  };

   const handleAddChange = (e) => {
    const { name, value } = e.target;
    // ตรวจสอบถ้าเป็นช่อง 'price' ให้ลบคอมม่าออกก่อน
    const updatedValue = name === 'price' ? removeCommas(value) : value;
    setNewProduct((prev) => ({ ...prev, [name]: updatedValue }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (showEditModal) {
      setEditProduct((prev) => ({ ...prev, image: file }));
    } else {
      setNewProduct((prev) => ({ ...prev, image: file }));
    }
  };

  const resetNewProduct = useCallback(() => {
    setNewProduct({
      product_code: '',
      name: '',
      description: '',
      category_id: '',
      price: '',
      quantity: '',
      image: null,
      status: 'active',
    });
  }, []);

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    resetNewProduct();
  }, [resetNewProduct]);


  const handleAddSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('product_code', newProduct.product_code);
      formData.append('name', newProduct.name);
      formData.append('description', newProduct.description);
      formData.append('category_id', newProduct.category_id);
      formData.append('price', newProduct.price);
      formData.append('quantity', newProduct.quantity);
      formData.append('status', newProduct.status);

      if (newProduct.image) {
        formData.append('image', newProduct.image);
      }

      const response = await fetch(`${host}/api/products`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json(); // หรือ response.text()
        console.error('Server validation error:', errorData); 
        throw new Error('Failed to add product');
      }

      const data = await response.json();

      Swal.fire('สำเร็จ', 'เพิ่มสินค้าสำเร็จแล้ว', 'success');
      setProducts((prev) => [data, ...prev]);
      setShowAddModal(false);
      resetNewProduct();
    } catch (error) {
      console.error('Add error:', error);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มสินค้าได้', 'error');
    }
  };

  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    // แปลงเป็น string
    const str = value.toString();
    // ลบทุกอย่างที่ไม่ใช่ตัวเลขกับจุดทศนิยมออก
    const cleaned = str.replace(/[^\d.]/g, '');
    // แยกจุดทศนิยมออก
    const parts = cleaned.split('.');
    // ใส่ comma ที่หลักพันของจำนวนเต็ม
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // รวมกลับ
    return parts.join('.');
  };

  const removeCommas = (value) => value.replace(/,/g, '');



  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? '-' : `฿${numPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
  };

  const columns = [
    {
      name: 'รหัสสินค้า',
      selector: (row) => row.product_code,
      sortable: true,
      width: '120px'
    },
    {
      name: 'รูปภาพ',
      cell: (row) =>
        row.image_url ? (
          <img
            src={`${host}${row.image_url}`}
            alt={row.name}
            className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200 shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500">
            <FaImage size={20} />
          </div>
        ),
      width: '100px'
    },
    {
      name: 'ชื่อสินค้า',
      selector: (row) => row.name,
      wrap: true,
      sortable: true
    },
    {
      name: 'รายละเอียดสินค้า',
      selector: (row) => row.description,
      wrap: true,
      cell: (row) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-600 truncate" title={row.description}>
            {row.description || '-'}
          </p>
        </div>
      )
    },
    {
      name: 'หมวดหมู่',
      selector: (row) => row.category_name,
      width: '120px',
      sortable: true
    },
    {
      name: 'ราคา',
      selector: (row) => row.price,
      cell: (row) => (
        <span className="font-medium text-green-600">
          {formatPrice(row.price)}
        </span>
      ),
      width: '120px',
      sortable: true
    },
    {
      name: 'จำนวน',
      selector: (row) => row.quantity,
      width: '100px',
      sortable: true,
      cell: (row) => (
        <span className={`${row.quantity <= 5 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
          {row.quantity}
        </span>
      )
    },
    {
      name: 'สถานะ',
      cell: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.status === 'active'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
          }`}>
          {row.status === 'active' ? 'แสดง' : 'ไม่แสดง'}
        </span>
      ),
      width: '100px',
      sortable: true
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
      width: '140px'
    },
  ];

  const customStyles = {
    table: {
      style: {
        backgroundColor: '#ffffff',
      },
    },
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
        '&:hover': {
          backgroundColor: '#f9fafb',
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการสินค้า</h1>
          <p className="text-gray-600">จัดการข้อมูลสินค้าทั้งหมดในระบบ</p>
        </div>
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
            >
              <FaPlus className="mr-2" size={14} />
              เพิ่มสินค้าใหม่
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">สินค้าทั้งหมด</h3>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">สินค้าที่แสดง</h3>
            <p className="text-2xl font-bold text-green-600">
              {products.filter(p => p.status === 'active').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">สินค้าใกล้หมด</h3>
            <p className="text-2xl font-bold text-red-600">
              {products.filter(p => p.quantity <= 5).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredProducts}
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

        <Modal
          show={showEditModal}
          onHide={() => {
            setShowEditModal(false);
            setEditProduct(null);
          }}
          title="แก้ไขข้อมูลสินค้า"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสสินค้า <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="product_code"
                value={editProduct?.product_code || ''}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รายละเอียดสินค้า
              </label>
              <textarea
                name="description"
                value={editProduct?.description || ''}
                onChange={handleEditChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="กรอกรายละเอียดสินค้า..."
              />
            </div>

            <select
              name="category_id"
              value={editProduct?.category_id || ''}
              onChange={handleEditChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- เลือกหมวดหมู่ --</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>

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
                  value={editProduct?.quantity || ''}
                  onChange={handleEditChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                สถานะ
              </label>
              <select
                name="status"
                value={editProduct?.status || 'active'}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">แสดง</option>
                <option value="inactive">ไม่แสดง</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รูปภาพ
              </label>
              <input
                type="file"
                name="image"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {editProduct?.image_url && (
                <div className="mt-3">
                  <img
                    src={`${host}${editProduct.image_url}`}
                    alt="Product"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditProduct(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </form>
        </Modal>

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
                    src={`${host}${detailProduct.image_url}`}
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
                      <p className={`font-medium ${detailProduct.quantity <= 5 ? 'text-red-600' : 'text-gray-900'}`}>{detailProduct.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">สถานะ</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${detailProduct.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {detailProduct.status === 'active' ? 'แสดง' : 'ไม่แสดง'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">รายละเอียดสินค้า</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailProduct.description || '-'}</p>
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

        <Modal
          show={showAddModal}
          onHide={closeAddModal}
          title="เพิ่มสินค้าใหม่"
        >
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสสินค้า <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="product_code"
                placeholder="กรอกรหัสสินค้า"
                value={newProduct.product_code}
                onChange={handleAddChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อสินค้า <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="กรอกชื่อสินค้า"
                value={newProduct.name}
                onChange={handleAddChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รายละเอียดสินค้า
              </label>
              <textarea
                name="description"
                placeholder="กรอกรายละเอียดสินค้า"
                value={newProduct.description}
                onChange={handleAddChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <select
              name="category_id"
              value={newProduct.category_id}
              onChange={handleAddChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">-- เลือกหมวดหมู่ --</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>


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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รูปภาพ
              </label>
              <input
                type="file"
                name="image"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
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
