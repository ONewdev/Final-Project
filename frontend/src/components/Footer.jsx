import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';


function Footer() {
  const [contact, setContact] = useState({ address: '', phone: '', email: '', open_hours: '', map_url: '' });
  const host = import.meta.env.VITE_HOST;

  useEffect(() => {
    async function fetchContact() {
      try {
        const res = await fetch(`${host}/api/contact`);
        const data = await res.json();
        if (res.ok) setContact(data);
      } catch (err) {
        setContact({ address: '', phone: '', email: '', open_hours: '', map_url: '' });
      }
    }
    fetchContact();
  }, [host]);

  return (
    <footer className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700 text-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold text-gray-100 mb-4" style={{ fontFamily: "'Kanit', sans-serif" }}>Aluglaue Pro</div>
            <p className="text-gray-400 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>
              ผู้เชี่ยวชาญด้านอลูมิเนียมและกระจก มากกว่า 20 ปี
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-100">เมนูหลัก</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/home" className="hover:text-white">หน้าแรก</Link></li>
              <li><Link to="/products" className="hover:text-white">สินค้า</Link></li>
              <li><Link to="/contact" className="hover:text-white">ติดต่อเรา</Link></li>
            </ul>
          </div>

          <div className="justify-self-end">
            <h3 className="text-lg font-semibold mb-4 text-gray-100">ติดต่อเรา</h3>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {contact.address || '---'}
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                {contact.phone || '---'}
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                {contact.email || '---'}
              </div>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
