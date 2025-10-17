import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Slidebar from '../../components/Slidebar';
import PopularProducts from '../../components/PopularProducts';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // อาจเพิ่มโค้ดอื่นภายหลัง
  }, []);

  return (
    <div className="min-h-screen bg-gray-to-b from-white-50 via-white-100 to-white-200" style={{ fontFamily: "'Prompt', 'Kanit', sans-serif" }}>
      <Navbar />
      <div className="w-full bg-gray/80 py-6 shadow text-left pl-10">
        <h1 className="text-3xl md:text-4xl font-bold text-green-700 tracking-wide" style={{ fontFamily: "'Kanit', 'Prompt', sans-serif" }}>หน้าแรก</h1>
      </div>

  <Slidebar />
  <PopularProducts />

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Kanit', sans-serif" }}>พร้อมเริ่มโปรเจคของคุณแล้วหรือยัง?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ fontFamily: "'Prompt', sans-serif" }}>
            ปรึกษาฟรี ประเมินราคาฟรี พร้อมให้คำแนะนำจากทีมผู้เชี่ยวชาญ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
           
            <button
              className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-green-700 transition duration-300"
              onClick={() => navigate('/contact')}
            >
              ส่งข้อความหาเรา
            </button>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}  