import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const host = import.meta.env.VITE_HOST ;

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${host}/api/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // credentials: 'include', // … cookie …
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        // save token and user
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ',
          text: 'กำลังพากลับไปหน้าแรก!',
          timer: 1200,
          showConfirmButton: false
        }).then(() => {
          window.dispatchEvent(new Event('userChanged'));
          navigate('/home');
        });
      } else {
        if (res.status === 403) {
          Swal.fire({
            icon: 'warning',
            title: 'บัญชีถูกระงับการใช้งาน',
            text: data.message || 'บัญชีของคุณถูกระงับชั่วคราว กรุณาติดต่อผู้ดูแลระบบ',
            confirmButtonText: 'ตกลง'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'เข้าสู่ระบบไม่สำเร็จ',
            text: data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
          });
        }
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  // Enter key submit
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleForgotPassword = async () => {
    try {
      const { value: inputEmail } = await Swal.fire({
        title: 'ลืมรหัสผ่าน',
        input: 'email',
        inputLabel: 'กรอกอีเมลที่ใช้สมัคร',
        inputValue: email,
        inputPlaceholder: 'you@example.com',
        confirmButtonText: 'ส่งลิงก์รีเซ็ต',
        showCancelButton: true,
        cancelButtonText: 'ยกเลิก',
        validationMessage: 'กรุณากรอกอีเมลให้ถูกต้อง',
        inputValidator: (value) => {
          if (!value || !value.includes('@')) return 'กรุณากรอกอีเมลให้ถูกต้อง';
        },
      });
      if (!inputEmail) return;

      const res = await fetch(`${host}/api/customers/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(inputEmail).trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'ส่งอีเมลไม่สำเร็จ');

      Swal.fire({
        icon: 'success',
        title: 'ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว',
        text: 'โปรดตรวจสอบอีเมลของคุณ หากไม่พบให้ตรวจสอบในกล่องสแปม'
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message || 'ไม่สามารถส่งอีเมลได้' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 relative">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      </div>

      {/* Back Button */}
      <button
        onClick={()=> navigate('/')}
        className="absolute top-6 left-6 z-10 p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl text-gray-600 hover:text-gray-900 hover:bg-white transition-all duration-300 transform hover:scale-110"
        aria-label="กลับหน้าแรก"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 007 7H5a7 7 0 007-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">เข้าสู่ระบบ</h2>
            <p className="text-gray-500 mt-2">ยินดีต้อนรับกลับสู่ ALShop</p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 block">
                อีเมล
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 block">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button" onClick={handleForgotPassword}
                className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors duration-200"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 focus:ring-4 focus:ring-green-200 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังเข้าสู่ระบบ...</span>
                </div>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">หรือ</span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center space-y-4">
              <p className="text-gray-600">ยังไม่มีบัญชีผู้ใช้?</p>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full px-4 py-3 text-green-600 border-2 border-green-500 rounded-xl hover:bg-green-50 hover:border-green-600 transition-all duration-300 font-medium transform hover:scale-[1.02]"
              >
                สมัครสมาชิก
              </button>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
}

