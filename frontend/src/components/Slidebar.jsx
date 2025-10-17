import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import React from 'react';

// Slidebar สามารถรับ props เพื่อแสดง slide เฉพาะแต่ละหน้า
function Slidebar({ slides }) {
  // ถ้าไม่ส่ง slides มา ให้ใช้ default
  const defaultSlides = [
    {
      image: '../../public/images/148539-1024x768.jpg',
      title: 'ALshop สินค้าคุณภาพ',
      desc: 'เลือกชมสินค้าหลากหลายหมวดหมู่ในราคาสุดคุ้ม!'
    },
    {
      image: '../../public/images/1r1uli.jpg',
      title: 'บริการรวดเร็ว',
      desc: 'จัดส่งไวทั่วประเทศ พร้อมบริการหลังการขาย'
    },
    {
      image: '../../public/images/thaimetal-product-cover-slide.jpg.jpg',
      title: 'โปรโมชั่นพิเศษ',
      desc: 'รับข้อเสนอสุดพิเศษสำหรับลูกค้าใหม่และเก่า!'
    }
  ];
  const slideData = slides && slides.length > 0 ? slides : defaultSlides;
  return (
    <div id="carouselExample" className="carousel slide" data-bs-ride="carousel" data-bs-interval="3000" style={{ maxWidth: '1550px', margin: '0 auto' }}>
      <div className="carousel-indicators">
        {slideData.map((_, idx) => (
          <button key={idx} type="button" data-bs-target="#carouselExample" data-bs-slide-to={idx} className={idx === 0 ? 'active' : ''} aria-current={idx === 0 ? 'true' : undefined} aria-label={`Slide ${idx + 1}`}></button>
        ))}
      </div>
      <div className="carousel-inner">
        {slideData.map((slide, idx) => (
          <div key={idx} className={`carousel-item${idx === 0 ? ' active' : ''}`}> 
            <img
              src={slide.image}
              className="d-block w-100"
              alt={slide.title}
              style={{ objectFit: 'cover', height: '400px' }}
            />
            {/* รายละเอียดใต้รูป */}
            <div className="carousel-caption d-none d-md-block bg-black/40 rounded-xl p-3 mb-8">
              <h5 className="text-2xl font-bold text-white drop-shadow mb-2">{slide.title}</h5>
              <p className="text-white text-lg drop-shadow">{slide.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="carousel-control-prev" type="button" data-bs-target="#carouselExample" data-bs-slide="prev">
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Previous</span>
      </button>
      <button className="carousel-control-next" type="button" data-bs-target="#carouselExample" data-bs-slide="next">
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  );

}

export default Slidebar;  