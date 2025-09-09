import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const host = import.meta.env.VITE_HOST;

  useEffect(() => {
    if (!id) return;

    fetch(`${host}/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching product:', err);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          className="mb-6 text-green-700 hover:underline"
          onClick={() => navigate(-1)}
        >
          ← กลับ
        </button>

        {loading ? (
          <p className="text-center text-lg">กำลังโหลด...</p>
        ) : !product ? (
          <p className="text-center text-red-500">ไม่พบข้อมูลสินค้า</p>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-green-700 mb-6">{product.name}</h1>
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col md:flex-row gap-8">
              <img
                src={`${host}${product.image_url}`}
                alt={product.name}
                className="w-full md:w-96 h-96 object-cover rounded-lg border"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/no-image.png';
                }}
              />
              <div className="flex-1">
                <p className="text-gray-700 mb-4 whitespace-pre-line">{product.description}</p>
                <p className="text-green-700 text-2xl font-extrabold mb-2">
                  {parseFloat(product.price).toLocaleString()} บาท
                </p>
                <p className="text-sm text-gray-500">
                  หมวดหมู่: {product.category_name || '-'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

