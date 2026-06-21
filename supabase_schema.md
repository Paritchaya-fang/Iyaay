# การออกแบบฐานข้อมูล Supabase (Database Schema Design)
อ้างอิงจากเอกสาร SRS ระบบรับจองโต๊ะร้านกาแฟ

## ชื่อตาราง: `reservations`

ตารางนี้จะใช้สำหรับเก็บข้อมูลการจองโต๊ะของลูกค้าทั้งหมด โดยออกแบบให้รองรับการค้นหาตามวันที่และรอบเวลา เพื่อนำไปคำนวณจำนวนคิวที่ว่างอยู่

### โครงสร้างคอลัมน์ (Columns Design)

| Column Name | Data Type (PostgreSQL) | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, Default: `gen_random_uuid()` | รหัสอ้างอิงการจอง (Booking ID) |
| `customer_name` | `text` | Not Null | ชื่อลูกค้า |
| `phone_number` | `text` | Not Null | เบอร์โทรศัพท์สำหรับติดต่อกลับ |
| `reservation_date`| `date` | Not Null | วันที่ลูกค้าต้องการจอง (เพื่อความง่ายในการ Query คิวของแต่ละวัน) |
| `time_slot` | `text` | Not Null | รอบเวลาที่จอง เช่น '10:00 - 11:30 น.' |
| `guest_count` | `integer` | Not Null, Check: `> 0` | จำนวนลูกค้า |
| `special_requests`| `text` | Nullable | หมายเหตุ หรือความต้องการพิเศษ |
| `status` | `text` | Not Null, Default: `'Booked'` | สถานะ: `Booked`, `Arrived`, `No-show`, `Cancelled` |
| `created_at` | `timestamptz` | Not Null, Default: `now()` | วันเวลาที่ทำรายการจอง (ใช้ดูลำดับคิวก่อนหลัง) |

*หมายเหตุ: สำหรับคอลัมน์ `status` สามารถสร้างเป็น Custom Enum Type (`reservation_status`) ใน PostgreSQL ได้เพื่อป้องกันการกรอกข้อมูลผิดพลาด*

---

### ข้อมูลตัวอย่าง (Sample Data)

| id (uuid) | customer_name | phone_number | reservation_date | time_slot | guest_count | special_requests | status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `550e8400...` | คุณเอ สุขใจ | 0812345678 | 2026-06-25 | 10:00 - 11:30 น. | 2 | ขอโต๊ะมุมเงียบๆ | Booked |
| `6ba7b810...` | น้องบี | 0898765432 | 2026-06-25 | 10:00 - 11:30 น. | 4 | - | Booked |
| `7ca8c921...` | คุณสมชาย | 0823334444 | 2026-06-25 | 13:00 - 14:30 น. | 1 | - | Arrived |
| `8da9d032...` | คุณก้อย | 0845556666 | 2026-06-26 | 16:00 - 17:30 น. | 6 | ขอเก้าอี้เด็ก 1 ตัว | Booked |
| `9eb0e143...` | นายนัท | 0867778888 | 2026-06-26 | 11:30 - 13:00 น. | 2 | - | No-show |

---

### คำแนะนำในการอ่าน/เขียนข้อมูล (Frontend Data Fetching Strategies)

เนื่องจาก Supabase ใช้ PostgreSQL และมีระบบ **Row Level Security (RLS)** หน้าเว็บควรมีการจัดการดังนี้:

#### 1. ฝั่งลูกค้า (Customer Frontend)
* **การอ่านข้อมูล (Read):**
  * ลูกค้า**ไม่ควร**มีสิทธิ์ดึงข้อมูลรายชื่อการจองของคนอื่น (เพื่อ Privacy)
  * การเช็คคิวว่าง (Availability Check) แนะนำให้สร้าง Database Function (RPC) ใน Supabase เช่น `get_available_slots(p_date)` เพื่อส่งกลับมาแค่ "จำนวนคิวที่ถูกจองไปแล้วในแต่ละรอบ" ของวันนั้นๆ แทนที่จะให้ Frontend ดึงข้อมูลทั้งตารางไปนับเอง
* **การเขียนข้อมูล (Write):**
  * เปิดสิทธิ์ `INSERT` ให้กับผู้ใช้แบบ Anonymous (Guest)
  * ตั้ง RLS Policy ให้ Guest สามารถ `INSERT` ได้เพียงอย่างเดียว ไม่สามารถ `UPDATE` หรือ `DELETE` ได้

#### 2. ฝั่งพนักงาน (Staff / Admin Dashboard)
* **การอ่านข้อมูล (Read):**
  * พนักงานต้องทำการล็อกอิน (ผ่าน Supabase Auth) ก่อน
  * ตั้ง RLS Policy ให้ User ที่มี Role เป็น Admin สามารถ `SELECT` ข้อมูลได้ทั้งหมด
  * Query ข้อมูลโดย Filter ตาม `reservation_date` เรียงลำดับตาม `time_slot` และ `created_at`
* **การเขียนข้อมูล (Write/Update):**
  * พนักงานสามารถ `UPDATE` คอลัมน์ `status` ได้ (เปลี่ยนจาก Booked เป็น Arrived, No-show หรือ Cancelled)
  * ป้องกันการลบข้อมูล (`DELETE`) โดยเปลี่ยนเป็นการเปลี่ยนสถานะเป็น Cancelled แทน เพื่อเก็บประวัติการทำงาน (Audit Trail)
