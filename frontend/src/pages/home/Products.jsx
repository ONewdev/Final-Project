import React, { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Slidebar from "../../components/Slidebar";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { addCartItem, clearCartItems } from "../../services/cartService";
import { FaHeart, FaRegHeart, FaStar } from "react-icons/fa";
import { submitRating, addFavorite, removeFavorite, getRatingSummary } from "../../services/likeFavoriteService";

function Products() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const host = import.meta.env.VITE_HOST;

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comparison, setComparison] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [productRatings, setProductRatings] = useState({});
  const [ratingSummaries, setRatingSummaries] = useState({});
  const [favoritedProducts, setFavoritedProducts] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

  // โหลดสถานะ like/favorite และเรตติ้งของสินค้าแต่ละตัว
  const fetchStatuses = async () => {

    const ratings = {};
    const favs = {};
    const summaries = {};

    for (const p of products) {
      try {
        // เรียก API เพื่อดึงสถานะการให้คะแนน
        if (!user) {
          ratings[p.id] = 0;
          favs[p.id] = false;
        } else {
        const ratingRes = await fetch(
          `${host}/api/interactions/rating/status?customer_id=${user.id}&product_id=${p.id}`
        );

        if (ratingRes.ok) {
          const ratingData = await ratingRes.json();
          ratings[p.id] = ratingData.rating || 0;
        } else {
          ratings[p.id] = 0;
        }

        // เรียก API เพื่อดึงสถานะรายการโปรด
        const favRes = await fetch(
          `${host}/api/interactions/favorite/status?customer_id=${user.id}&product_id=${p.id}`
        );

        if (favRes.ok) {
          const favData = await favRes.json();
          favs[p.id] = !!favData.favorited;
        } else {
          favs[p.id] = false;
        }
        }

        // Fetch average rating and review count
        const summary = await getRatingSummary(p.id);
        summaries[p.id] = summary;
      } catch {
        ratings[p.id] = 0;
        favs[p.id] = false;
        summaries[p.id] = { avg_rating: 0, rating_count: 0 };
      }
    }

    setProductRatings(ratings);
    setFavoritedProducts(favs);
    setRatingSummaries(summaries);
  };

  useEffect(() => {
    if (products.length > 0) fetchStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, user, host]);

  // Preload images for better performance
  useEffect(() => {
    if (products.length > 0) {
      products.slice(0, 6).forEach(product => {
        if (product.image_url && product.image_url.trim()) {
          const img = new Image();
          img.src = getImageUrl(product.image_url);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const handleRatingChange = async (productId, newRating) => {
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเข้าสู่ระบบ',
        text: 'คุณต้องเข้าสู่ระบบก่อนให้คะแนนสินค้า',
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
    try {
      await submitRating(user.id, productId, newRating);
      setProductRatings(prev => ({ ...prev, [productId]: newRating }));
      Swal.fire({
        icon: 'success',
        title: 'ให้คะแนนสำเร็จ!',
        text: `คุณให้คะแนน ${newRating} ดาว`,
        showConfirmButton: false,
        timer: 1500,
        confirmButtonColor: '#16a34a',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถให้คะแนนได้ในขณะนี้',
        confirmButtonColor: '#16a34a',
      });
    }
  };

  const handleFavorite = async (productId) => {
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเข้าสู่ระบบ',
        text: 'คุณต้องเข้าสู่ระบบก่อนเพิ่มสินค้าในรายการโปรด',
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
    try {
      if (favoritedProducts[productId]) {
        await removeFavorite(user.id, productId);
        Swal.fire({
          icon: 'success',
          title: 'นำออกจากรายการโปรดแล้ว',
          showConfirmButton: false,
          timer: 1500,
          confirmButtonColor: '#16a34a',
        });
      } else {
        await addFavorite(user.id, productId);
        Swal.fire({
          icon: 'success',
          title: 'เพิ่มในรายการโปรดแล้ว',
          showConfirmButton: false,
          timer: 1500,
          confirmButtonColor: '#16a34a',
        });
      }
      await fetchStatuses(); // รีเฟรชสถานะจาก backend จริง
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถอัปเดตรายการโปรดได้ในขณะนี้',
        confirmButtonColor: '#16a34a',
      });
    }
  };

  // โหลดหมวดหมู่
  useEffect(() => {
    fetch(`${host}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (Array.isArray(data.data)) {
          setCategories(data.data);
        } else {
          setCategories([]);
          console.warn("หมวดหมู่ไม่ใช่ array:", data);
        }
      })
      .catch((err) => {
        console.error("หมวดหมู่ error:", err);
        setCategories([]);
      });
  }, [host]);

  // โหลดสินค้า
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url = `${host}/api/products?status=active`;
        if (selectedCategory) url += `&category_id=${selectedCategory}`;

        const res = await fetch(url);
        const data = await res.json();
        let productList = [];

        if (Array.isArray(data)) {
          productList = data;
        } else if (Array.isArray(data.data)) {
          productList = data.data;
        } else {
          console.warn("สินค้าไม่ใช่ array:", data);
          productList = [];
        }

        setProducts(productList);
        setLoading(false);
      } catch (err) {
        console.error("โหลดสินค้า error:", err);
        setProducts([]);
        setLoading(false);
      }
    };

    fetchProducts();
  }, [host, selectedCategory]);

  // ถ้าหมวดหมู่ที่เลือกถูกตั้งเป็น "ไม่แสดง" ให้รีเซ็ตการเลือก
  useEffect(() => {
    if (
      selectedCategory &&
      !categories.some(
        (c) => String(c.category_id) === String(selectedCategory) && (c.status ?? 1) === 1
      )
    ) {
      setSelectedCategory("");
    }
  }, [categories, selectedCategory]);

  // กรอง + รีเซ็ตหน้า
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
    } else {
      const s = searchTerm.toLowerCase();
      const filtered = products.filter((product) =>
        product.name?.toLowerCase().includes(s) ||
        product.description?.toLowerCase().includes(s) ||
        product.category_name?.toString().toLowerCase().includes(s) ||
        product.category?.toString().toLowerCase().includes(s)
      );
      setFilteredProducts(filtered);
    }
    setCurrentPage(1);
  }, [products, searchTerm]);

  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    return isNaN(numPrice)
      ? "-"
      : `฿${numPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
  };

  const handleCompareToggle = (product) => {
    setComparison((prev) => {
      if (prev.find((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      } else if (prev.length < 4) {
        return [...prev, product];
      } else {
        Swal.fire({
          icon: 'info',
          title: 'แจ้งเตือน',
          text: 'เปรียบเทียบได้สูงสุด 4 รายการ',
          confirmButtonColor: '#16a34a',
        });
        return prev;
      }
    });
  };

  const handleRemoveCompare = (id) => {
    setComparison((prev) => prev.filter((p) => p.id !== id));
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowScrollTop(true);
      else setShowScrollTop(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  const handleAddToCart = async (product) => {
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเข้าสู่ระบบ',
        text: 'กรุณาเข้าสู่ระบบก่อนใช้งานฟีเจอร์ตะกร้า',
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
    try {
      await addCartItem(product.id, 1);
      window.dispatchEvent(new Event('cartUpdated'));
      Swal.fire({
        icon: 'success',
        title: 'เพิ่มสินค้าในตะกร้าเรียบร้อย!',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (err) {
      Swal.fire({
        icon: err.status === 400 ? 'warning' : 'error',
        title: 'ไม่สามารถเพิ่มสินค้า',
        text: err.message || 'โปรดลองอีกครั้งภายหลัง',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleBuyNow = async (product) => {
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเข้าสู่ระบบ',
        text: 'กรุณาเข้าสู่ระบบก่อนใช้งานฟีเจอร์ตะกร้า',
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
    try {
      await clearCartItems();
      const items = await addCartItem(product.id, 1);
      window.dispatchEvent(new Event('cartUpdated'));
      const selected = items.find((item) => (item.product_id || item.id) === product.id) || {
        id: product.id,
        product_id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        quantity: 1,
        image_url: product.image_url,
      };
      navigate('/users/checkout', { state: { items: [{ ...selected, id: selected.product_id || selected.id }] } });
    } catch (err) {
      Swal.fire({
        icon: err.status === 400 ? 'warning' : 'error',
        title: 'ไม่สามารถทำรายการได้',
        text: err.message || 'โปรดลองอีกครั้งภายหลัง',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  // ฟังก์ชันสำหรับสร้าง URL รูปภาพ
  const getImageUrl = (imageUrl) => {
    if (!imageUrl || !imageUrl.trim()) return "/images/no-image.png";
    if (host.endsWith("/") && imageUrl.startsWith("/")) {
      return `${host.slice(0, -1)}${imageUrl}`;
    }
    return `${host}${imageUrl}`;
  };

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "'Prompt', 'Kanit', sans-serif" }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .image-fade-in {
          animation: fadeIn 0.3s ease-in;
        }
        .star-rating button { transition: all 0.2s ease; }
        .star-rating button:hover { transform: scale(1.1); }
      `}</style>

      <Navbar />

      {/* แถบหัวข้อ */}
      <div className="w-full bg-gray-100 py-6 shadow text-left pl-10">
        <h1
          className="text-3xl md:text-4xl font-bold text-green-700 tracking-wide"
          style={{ fontFamily: "'Kanit', 'Prompt', sans-serif" }}
        >
          สินค้า
        </h1>
      </div>

      <Slidebar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="mb-6 w-full">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-6">
              {/* ซ้าย: หมวดหมู่ + ค้นหา */}
              <div className="flex w-full lg:flex-1 gap-4">
                <select
                  className="w-full sm:w-64 py-3 px-4 border-2 border-green-400 rounded-2xl shadow-lg text-green-700 font-semibold bg-white focus:ring-4 focus:ring-green-300"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSearchTerm("");
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <option value="">ทุกหมวดหมู่</option>
                  {categories
                    .filter((cat) => (cat.status ?? 1) === 1)
                    .map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.category_name}
                      </option>
                    ))}
                </select>

                {/* ค้นหา */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="ค้นหาสินค้า ชื่อ/หมวดหมู่"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-50 pl-12 pr-3 py-3 border-2 border-green-400 bg-white rounded-2xl shadow-lg focus:ring-4 focus:ring-green-300 focus:border-green-500 text-lg font-semibold text-green-700 placeholder-black transition"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 text-xl pointer-events-none">
                    🔍
                  </span>
                </div>
              </div>

              {/* ขวา: ปุ่มสั่งทำ */}
              <div className="w-full lg:w-auto lg:ml-auto">
                <button
                  className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-8 rounded-full border-2 border-green-700 transition"
                  onClick={() => navigate("/custom")}
                >
                  สั่งทำสินค้า
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* แถบเปรียบเทียบ */}
        {comparison.length >= 2 && (
          <div className="mb-6 flex items-center gap-4 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <span className="font-semibold text-yellow-800">
              เลือก {comparison.length} รายการสำหรับเปรียบเทียบ
            </span>
            <button
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold"
              onClick={() => setShowCompare(true)}
            >
              ดูเปรียบเทียบ
            </button>
            <button
              className="ml-auto text-sm text-gray-500 hover:text-red-500"
              onClick={() => setComparison([])}
            >
              ล้างรายการ
            </button>
          </div>
        )}

        {/* สินค้า */}
        {loading ? (
          <div className="text-center py-16 text-xl text-gray-600">
            กำลังโหลดสินค้า...
          </div>
        ) : products.length > 0 ? (
          filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group relative overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    {/* รูป/ป้าย/หัวใจ */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={getImageUrl(product.image_url)}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/no-image.png";
                        }}
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

                      {Number(product.originalPrice) > Number(product.price) && (
                        <div className="absolute left-3 top-3 rounded-full bg-red-500/95 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                          ลด {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                        </div>
                      )}

                      <button
                        onClick={() => handleFavorite(product.id)}
                        aria-pressed={!!favoritedProducts[product.id]}
                        className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-pink-500 shadow-md transition hover:bg-white"
                        title="รายการโปรด"
                      >
                        {favoritedProducts[product.id] ? <FaHeart className="text-xl" /> : <FaRegHeart className="text-xl" />}
                      </button>
                    </div>

                    {/* เนื้อหา */}
                    <div className="space-y-3 p-5">
                      <div className="text-xs flex items-center gap-2">
                        <span className="inline-block rounded-full border border-green-200 bg-green-50 px-2.5 py-1 font-medium text-green-700">
                          {product.category_name || product.category || "-"}
                        </span>
                        {product.color && (
                          <span className="inline-block rounded-full border border-gray-300 bg-gray-50 px-2 py-1 font-medium text-gray-700">
                            สี: {product.color}
                          </span>
                        )}
                        {/* คงเหลือ */}
                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${product.quantity <= 5 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                          คงเหลือ {product.quantity} ชิ้น
                        </span>
                      </div>

                      <h3 className="line-clamp-2 text-lg font-extrabold tracking-tight text-gray-800">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 star-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRatingChange(product.id, star)}
                              aria-label={`ให้คะแนน ${star} ดาว`}
                              className={`text-lg transition ${star <= (productRatings[product.id] || 0) ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                            >
                              <FaStar />
                            </button>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">คุณให้: {productRatings[product.id] || 0}/5</span>
                      </div>

                      <div className="text-xs text-gray-600">
                        ค่าเฉลี่ย: {(ratingSummaries[product.id]?.avg_rating || 0).toFixed(1)}/5 · {ratingSummaries[product.id]?.rating_count || 0} รีวิว
                      </div>

                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-extrabold text-green-600">
                          {formatPrice(product.price)}
                        </span>
                        {Number(product.originalPrice) > Number(product.price) && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          className="rounded-xl border-2 border-green-600 bg-gradient-to-r from-green-600 to-green-500 py-2.5 font-semibold text-white shadow-sm transition-all hover:from-green-700 hover:to-green-600 active:scale-[0.98]"
                          onClick={() => handleAddToCart(product)}
                        >
                          เพิ่มลงตะกร้า
                        </button>
                        <button
                          className="rounded-xl border-2 border-green-500 bg-white py-2.5 font-semibold text-green-600 transition hover:bg-green-50 active:scale-[0.98]"
                          onClick={() => handleBuyNow(product)}
                        >
                          สั่งซื้อเลย
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${comparison.find((p) => p.id === product.id)
                            ? "border-yellow-500 bg-yellow-100 text-yellow-800"
                            : "border-yellow-300 bg-white text-yellow-700 hover:bg-yellow-50"
                            }`}
                          onClick={() => handleCompareToggle(product)}
                        >
                          {comparison.find((p) => p.id === product.id) ? "นำออกจากเปรียบเทียบ" : "เปรียบเทียบ"}
                        </button>

                        <Link
                          className="text-sm font-semibold text-green-600 underline-offset-4 transition hover:text-green-700 hover:underline"
                          to={`/products/${product.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          ดูรายละเอียด
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ตัวควบคุมหน้า */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 gap-2">
                  <button
                    className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold disabled:opacity-50"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    ก่อนหน้า
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`px-3 py-2 rounded-lg font-semibold ${currentPage === i + 1
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-green-100"
                        }`}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold disabled:opacity-50"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    ถัดไป
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-gray-600">
                ไม่พบสินค้า{searchTerm && `สำหรับคำค้นหา "${searchTerm}"`}
                {selectedCategory && " ในหมวดหมู่นี้"}
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">ไม่มีสินค้าในระบบ</p>
          </div>
        )}

        {/* Compare Modal */}
        {showCompare && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-gradient-to-br from-yellow-50 to-white rounded-3xl shadow-2xl max-w-5xl w-full p-8 relative border-2 border-yellow-200 animate-fadeIn">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-3xl font-bold"
                onClick={() => setShowCompare(false)}
                aria-label="ปิด"
              >
                ×
              </button>
              <h2 className="text-3xl font-extrabold mb-8 text-yellow-700 text-center tracking-wide drop-shadow">
                เปรียบเทียบสินค้า
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-gradient-to-r from-yellow-200 to-yellow-100">
                      <th className="p-4 font-bold text-lg text-gray-700 border-b-2 border-yellow-300 text-center">
                        สินค้า
                      </th>
                      {comparison.map((p) => (
                        <th
                          key={p.id}
                          className="p-4 font-bold text-gray-800 border-b-2 border-yellow-300 relative text-center"
                        >
                          <button
                            className="absolute top-2 right-2 text-xs text-red-500 hover:underline bg-white rounded-full px-2 py-1 shadow"
                            onClick={() => handleRemoveCompare(p.id)}
                          >
                            ลบ
                          </button>
                          <div className="flex flex-col items-center">
                            <img
                              src={getImageUrl(p.image_url)}
                              alt={p.name}
                              className="h-24 w-24 object-cover rounded-xl border mb-2 shadow"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/images/no-image.png";
                              }}
                            />
                            <span className="font-bold text-base text-gray-800 text-center line-clamp-2 max-w-[120px]">
                              {p.name}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="p-4 font-semibold bg-yellow-50 border-b border-yellow-100 text-gray-700 text-center">
                        ราคา
                      </td>
                      {comparison.map((p) => (
                        <td
                          key={p.id}
                          className="p-4 text-blue-600 font-bold border-b border-yellow-100 text-center text-xl"
                        >
                          {formatPrice(p.price)}
                          {Number(p.originalPrice) > Number(p.price) && (
                            <span className="ml-2 text-red-500 text-sm line-through">
                              {formatPrice(p.originalPrice)}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-white">
                      <td className="p-4 font-semibold bg-yellow-50 border-b border-yellow-100 text-gray-700 text-center">
                        หมวดหมู่
                      </td>
                      {comparison.map((p) => (
                        <td
                          key={p.id}
                          className="p-4 text-green-700 border-b border-yellow-100 text-center"
                        >
                          {p.category_name || p.category || "-"}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-white">
                      <td className="p-4 font-semibold bg-yellow-50 border-b border-yellow-100 text-gray-700 text-center">
                        รายละเอียด
                      </td>
                      {comparison.map((p) => (
                        <td
                          key={p.id}
                          className="p-4 text-gray-700 border-b border-yellow-100 text-center max-w-xs"
                        >
                          <span
                            className="block line-clamp-3"
                            title={p.description}
                          >
                            {p.description || "-"}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="text-center mt-8">
                <button
                  className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg text-lg transition"
                  onClick={() => setShowCompare(false)}
                >
                  ปิดหน้าต่างเปรียบเทียบ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    
      <Footer />
    </div>
  );
}

export default Products;
