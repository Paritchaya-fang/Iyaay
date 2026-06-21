# Brew & Brown (Iyaay Coffee) ☕️

ระบบเว็บไซต์และจองโต๊ะล่วงหน้าสำหรับร้านกาแฟระดับพรีเมียม (Premium Coffee Shop Landing Page & Table Reservation System)

## ฟีเจอร์หลัก (Features)
- **หน้า Landing Page ที่สวยงาม:** ออกแบบด้วยโทนสีน้ำตาลอุ่น สไตล์ Glassmorphism
- **Responsive Design:** รองรับการแสดงผลบนทุกหน้าจอ (มือถือ, แท็บเล็ต, คอมพิวเตอร์)
- **ระบบจองโต๊ะออนไลน์ (Customer Reservation):** ลูกค้าสามารถเลือกวันที่ รอบเวลา และระบุจำนวนคนเพื่อจองโต๊ะได้ โดยระบบจะเชื่อมต่อกับฐานข้อมูลแบบ Real-time
- **ป้องกันการจองซ้ำ/คิวเต็ม:** ตรวจสอบคิวว่างและล็อกรอบเวลาอัตโนมัติเมื่อคิวเต็ม
- **ระบบหลังบ้าน (Admin Dashboard):** พนักงานสามารถล็อกอินเข้ามาดูรายการจองรายวัน และปรับสถานะ (ลูกค้ามาถึงแล้ว, ยกเลิก) ได้อย่างปลอดภัย

## เทคโนโลยีที่ใช้ (Tech Stack)
- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript
- **Backend / Database:** [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, RPC Functions)
- **Authentication:** Supabase Auth (สำหรับระบบ Admin)

## โครงสร้างโปรเจกต์ (Project Structure)
- `index.html` - หน้า Landing Page และแบบฟอร์มการจองสำหรับลูกค้า
- `style.css` - ไฟล์ตกแต่งสไตล์และ UI ของเว็บไซต์
- `script.js` - โลจิกฝั่งลูกค้าสำหรับดึงข้อมูลคิวและบันทึกข้อมูลลง Database
- `admin.html` - หน้า Dashboard สำหรับแอดมิน (พนักงาน)
- `admin.js` - โลจิกฝั่งแอดมินสำหรับล็อกอินและจัดการตารางคิว
- `supabase_schema.sql` - คำสั่ง SQL สำหรับสร้าง Table, RLS และ Function ใน Supabase

## ผู้พัฒนา (Developer)
พัฒนาสำหรับโปรเจกต์ Iyaay Coffee
