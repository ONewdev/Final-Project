import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Product Card Component
const ProductCard = ({ product, resolveImageUrl, navigate, PLACEHOLDER_IMG }) => (
  <div 
    className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 flex flex-col items-center w-full max-w-sm transform hover:-translate-y-1"
  >
    <div className="relative w-full aspect-square mb-4">
      <img
        src={resolveImageUrl(product.image_url)}
        alt={product.name}
        className="w-full h-full object-cover rounded-xl"
        onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
      />
    </div>
    <h3 className="font-bold text-xl mb-2 text-green-800 text-center line-clamp-2">{product.name}</h3>
    <div className="flex items-center mb-3 bg-green-50 px-3 py-1 rounded-full">
      <span className="text-yellow-400 text-lg mr-1">★</span>
      <span className="font-medium text-gray-700">{product.avg_rating?.toFixed(1) || 0}</span>
      <span className="text-sm text-gray-500 ml-2">({product.rating_count} รีวิว)</span>
    </div>
    <p className="text-green-600 font-bold text-2xl mb-4">฿{product.price.toLocaleString()}</p>
    <button
      className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 active:bg-green-800 transition-colors duration-200"
      onClick={() => navigate(`/home/product/${product.id}`)}
    >
      ดูรายละเอียด
    </button>
  </div>
);

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="animate-pulse bg-gray-50 rounded-2xl shadow-lg p-6 flex flex-col items-center w-full max-w-sm">
    <div className="w-full aspect-square bg-gray-200 rounded-xl mb-4" />
    <div className="h-7 bg-gray-200 rounded-lg w-3/4 mb-3" />
    <div className="h-5 bg-gray-200 rounded-full w-1/2 mb-3" />
    <div className="h-8 bg-gray-200 rounded-lg w-1/3 mb-4" />
    <div className="h-12 bg-gray-200 rounded-xl w-full" />
  </div>
);

// Page Layout Component
const PageLayout = ({ title, subtitle, children }) => (
  <section className="py-12 bg-gradient-to-b from-white to-green-50">
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-green-800 mb-2">{title}</h2>
        {typeof subtitle === 'string' ? (
          <p className="text-lg text-gray-600">{subtitle}</p>
        ) : (
          <div className="text-lg text-gray-600">{subtitle}</div>
        )}
      </div>
      {children}
    </div>
  </section>
);

// Main Component
export default function PopularProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const host = import.meta.env.VITE_HOST;
  const navigate = useNavigate();

  const PLACEHOLDER_IMG = 'https://via.placeholder.com/128?text=No+Image';
  const SKELETON_COUNT = 3;

  const resolveImageUrl = (url) => {
    if (!url) return PLACEHOLDER_IMG;
    if (/^https?:\//i.test(url)) return url;
    if (host) {
      const base = host.endsWith('/') ? host.slice(0, -1) : host;
      const path = url.startsWith('/') ? url : `/${url}`;
      return `${base}${path}`;
    }
    return url;
  };

  useEffect(() => {
    async function fetchPopular() {
      try {
        let res = await fetch(`${host}/api/products/popular`);
        if (res.status === 404) {
          res = await fetch(`${host}/api/products?popular=true`);
        }
        const data = await res.json();
        if (res.ok) {
          const filtered = Array.isArray(data)
            ? data.filter(p => (p.avg_rating ?? 0) > 0)
            : [];
          filtered.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
          setProducts(filtered);
        }
      } catch (err) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPopular();
  }, [host]);

  if (loading) {
    return (
      <PageLayout
        title={
          <div className="h-10 bg-gray-200 rounded-lg w-64 mx-auto mb-2 animate-pulse" />
        }
        subtitle={
          <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse" />
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {[...Array(SKELETON_COUNT)].map((_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </PageLayout>
    );
  }

  if (!products.length) {
    return (
      <PageLayout
        title="ไม่มีสินค้ายอดนิยม"
        subtitle="ขออภัย ยังไม่มีสินค้ายอดนิยมในขณะนี้"
      />
    );
  }

  const mainProducts = showAll ? products : products.slice(0, 3);
  const hasMore = products.length > 3;

  return (
    <PageLayout
      title="สินค้ายอดนิยม"
      subtitle="⭐ สินค้าที่ได้รับความนิยมจากลูกค้า ⭐"
    >
      <div className="flex flex-col items-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center w-full">
          {mainProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              resolveImageUrl={resolveImageUrl} 
              navigate={navigate} 
              PLACEHOLDER_IMG={PLACEHOLDER_IMG} 
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          {hasMore && (
            <button
              className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 active:bg-green-800 transition-colors duration-200 flex items-center gap-2"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <span>แสดงน้อยลง</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </>
              ) : (
                <>
                  <span>ดูสินค้าทั้งหมด ({products.length})</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>

        {showAll && hasMore && (
          <div className="mt-12 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
              {products.slice(3).map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  resolveImageUrl={resolveImageUrl} 
                  navigate={navigate} 
                  PLACEHOLDER_IMG={PLACEHOLDER_IMG} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}