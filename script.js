document.addEventListener('DOMContentLoaded', () => {
    // 1. กำหนดค่า Supabase Project (ใส่ URL ที่ให้มา และรอใส่ Anon Key)
    const SUPABASE_URL = 'https://aqmszxhqrtjagjwxztul.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxbXN6eGhxcnRqYWdqd3h6dHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTgwMjIsImV4cCI6MjA5NzU5NDAyMn0.Zkv-NHlUsRSHN1xYghgyXTduU0XgP2FQBShw_pf9xu0';

    
    // สร้าง Client
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const MAX_CAPACITY = 5; // จำนวนโต๊ะสูงสุดต่อรอบ

    const form = document.getElementById('reservationForm');
    const successMessage = document.getElementById('successMessage');
    const resetBtn = document.getElementById('resetBtn');
    const dateInput = document.getElementById('bookingDate');
    const timeSlotSelect = document.getElementById('timeSlot');
    
    // ตั้งค่า วันที่เริ่มต้นให้เป็นวันนี้
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    dateInput.min = localDate;
    dateInput.value = localDate;

    // 2. ฟังก์ชันตรวจสอบคิวว่าง (เมื่อมีการเปลี่ยนวันที่)
    async function checkAvailability() {
        const selectedDate = dateInput.value;
        if (!selectedDate) return;

        // Reset all options to enabled first
        Array.from(timeSlotSelect.options).forEach(opt => {
            if (opt.value !== "") {
                opt.disabled = false;
                opt.text = opt.value; // Reset text
            }
        });

        // ถ้ายังไม่ได้ใส่ API Key ให้ข้ามการเช็คไปก่อน
        if (SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
            console.warn("ยังไม่ได้ใส่ Supabase Anon Key ระบบจะข้ามการเช็คคิวว่าง");
            return;
        }

        try {
            // เรียกใช้ RPC function ที่เราสร้างไว้ใน Supabase
            const { data, error } = await supabaseClient.rpc('get_booked_slots', {
                p_date: selectedDate
            });

            if (error) throw error;

            if (data && data.length > 0) {
                data.forEach(slotData => {
                    if (slotData.booked_count >= MAX_CAPACITY) {
                        // หารอบเวลาที่ตรงกันแล้วปิดไม่ให้เลือก
                        const option = Array.from(timeSlotSelect.options).find(opt => opt.value === slotData.slot_time);
                        if (option) {
                            option.disabled = true;
                            option.text = `${slotData.slot_time} (เต็มแล้ว)`;
                        }
                    }
                });
            }
        } catch (error) {
            console.error("Error checking availability:", error);
        }
    }

    // เช็คคิวว่างทุกครั้งที่เปลี่ยนวันที่
    dateInput.addEventListener('change', checkAvailability);
    checkAvailability(); // เช็คครั้งแรกตอนโหลดเว็บ

    // 3. ฟังก์ชันบันทึกข้อมูลการจอง
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'กำลังบันทึกข้อมูล...';
        submitBtn.disabled = true;

        const bookingData = {
            customer_name: document.getElementById('customerName').value,
            phone_number: document.getElementById('phone').value,
            reservation_date: document.getElementById('bookingDate').value,
            time_slot: document.getElementById('timeSlot').value,
            guest_count: parseInt(document.getElementById('guests').value),
            special_requests: document.getElementById('note').value || null,
            status: 'Booked' // Default
        };

        // สร้าง ID อ้างอิงขึ้นมาเองจาก Frontend เลยเพื่อไม่ให้ติดปัญหา RLS
        const generatedId = crypto.randomUUID();
        bookingData.id = generatedId;

        try {
            // บันทึกข้อมูลลงตาราง reservations (ไม่ต้อง select กลับมาแล้ว)
            const { error } = await supabaseClient
                .from('reservations')
                .insert([bookingData]);

            if (error) throw error;

            // นำ ID ที่สร้างเองมาแสดง (ใช้ 8 ตัวแรกเพื่อให้จำง่ายขึ้น)
            const shortId = generatedId.substring(0, 8).toUpperCase();
            document.getElementById('refDisplay').textContent = shortId;

            // แสดงหน้าจอสำเร็จ
            form.style.display = 'none';
            successMessage.style.display = 'block';
            
        } catch (error) {
            console.error("Error submitting reservation:", error);
            alert(`เกิดข้อผิดพลาดในการจองคิว: ${error.message || 'กรุณาลองใหม่อีกครั้ง'}`);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // 4. รีเซ็ตฟอร์ม
    resetBtn.addEventListener('click', () => {
        form.reset();
        dateInput.value = localDate;
        checkAvailability(); // อัปเดตคิวใหม่
        successMessage.style.display = 'none';
        form.style.display = 'block';
    });
});
