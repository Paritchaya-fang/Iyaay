document.addEventListener('DOMContentLoaded', () => {
    // 1. กำหนดค่า Supabase Project (ใช้ค่าเดียวกับหน้า script.js)
    const SUPABASE_URL = 'https://aqmszxhqrtjagjwxztul.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxbXN6eGhxcnRqYWdqd3h6dHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTgwMjIsImV4cCI6MjA5NzU5NDAyMn0.Zkv-NHlUsRSHN1xYghgyXTduU0XgP2FQBShw_pf9xu0';
    
    // สร้าง Client
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const filterDate = document.getElementById('filterDate');
    const tableBody = document.getElementById('reservationTableBody');
    const loginError = document.getElementById('loginError');

    // Stats Elements
    const statTotal = document.getElementById('statTotal');
    const statGuests = document.getElementById('statGuests');
    const statArrived = document.getElementById('statArrived');
    const statWaiting = document.getElementById('statWaiting');

    // ตั้งค่า วันที่เริ่มต้นให้เป็นวันนี้
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    filterDate.value = localDate;

    // เช็คสถานะการล็อกอินตอนเปิดหน้าเว็บ
    checkUser();

    async function checkUser() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            showDashboard();
        } else {
            showLogin();
        }
    }

    // 2. ระบบ Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        
        loginError.style.display = 'none';
        const submitBtn = loginForm.querySelector('button');
        const oldText = submitBtn.textContent;
        submitBtn.textContent = 'กำลังตรวจสอบ...';
        submitBtn.disabled = true;

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        submitBtn.textContent = oldText;
        submitBtn.disabled = false;

        if (error) {
            loginError.textContent = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือคุณยังไม่ได้สมัครสมาชิกแอดมิน';
            loginError.style.display = 'block';
        } else {
            showDashboard();
        }
    });

    // 3. ระบบ Logout
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        showLogin();
    });

    function showLogin() {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }

    function showDashboard() {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        fetchReservations(); // โหลดข้อมูลทันทีที่เปิด Dashboard
    }

    // 4. ดึงข้อมูลตารางการจองจาก Database
    async function fetchReservations() {
        const date = filterDate.value;
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">กำลังโหลดข้อมูล...</td></tr>';

        // ดึงข้อมูลทั้งหมดในวันที่เลือก เรียงตามเวลา
        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('reservation_date', date)
            .order('time_slot', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            console.error(error);
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: #e74c3c;">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}</td></tr>`;
            return;
        }

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">ยังไม่มีข้อมูลการจองในวันนี้</td></tr>';
            statTotal.textContent = '0';
            statGuests.textContent = '0';
            statArrived.textContent = '0';
            statWaiting.textContent = '0';
            return;
        }

        renderTable(data);

        // Update Dashboard Stats
        statTotal.textContent = data.length;
        
        // คำนวณจำนวนแขกรวม (แปลงจาก 6+ เป็น 6 ชั่วคราวในการคำนวณ)
        let totalGuests = data.reduce((sum, row) => {
            let count = parseInt(row.guest_count) || 0;
            return sum + count;
        }, 0);
        statGuests.textContent = totalGuests;

        statArrived.textContent = data.filter(d => d.status === 'Arrived').length;
        statWaiting.textContent = data.filter(d => d.status === 'Booked').length;
    }

    // โหลดคิวใหม่ทุกครั้งที่แอดมินเปลี่ยนวันที่
    filterDate.addEventListener('change', fetchReservations);

    // 5. Render ข้อมูลลงตาราง
    function renderTable(data) {
        tableBody.innerHTML = '';
        data.forEach(row => {
            const shortId = row.id.substring(0, 8).toUpperCase();
            
            let statusClass = '';
            let statusThai = '';
            if(row.status === 'Booked') { statusClass = 'status-booked'; statusThai = 'จองแล้ว (รอมาถึง)'; }
            if(row.status === 'Arrived') { statusClass = 'status-arrived'; statusThai = 'ลูกค้ามาถึงแล้ว'; }
            if(row.status === 'Cancelled') { statusClass = 'status-cancelled'; statusThai = 'ยกเลิก'; }
            if(row.status === 'No-show') { statusClass = 'status-no-show'; statusThai = 'ไม่มาตามนัด'; }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="color:var(--primary-color);">${shortId}</strong></td>
                <td>${row.customer_name}</td>
                <td>${row.phone_number}</td>
                <td>${row.time_slot}</td>
                <td>${row.guest_count} ท่าน</td>
                <td>${row.special_requests || '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusThai}</span></td>
                <td>
                    ${row.status === 'Booked' ? `<button class="action-btn" onclick="updateStatus('${row.id}', 'Arrived')">✔ มาถึง</button>` : ''}
                    ${row.status === 'Booked' ? `<button class="action-btn" style="color:#e74c3c; border-color:#e74c3c;" onclick="updateStatus('${row.id}', 'Cancelled')">✖ ยกเลิก</button>` : ''}
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // 6. อัปเดตสถานะ (เช่น กดว่าลูกค้ามาถึงแล้ว หรือกดยกเลิก)
    window.updateStatus = async function(id, newStatus) {
        let confirmMsg = newStatus === 'Arrived' ? 'ลูกค้ารายนี้มาถึงร้านแล้ว ใช่หรือไม่?' : 'ต้องการยกเลิกคิวนี้ ใช่หรือไม่?';
        if(!confirm(confirmMsg)) return;

        const { error } = await supabase
            .from('reservations')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            alert('เกิดข้อผิดพลาดในการอัปเดต: ' + error.message);
        } else {
            fetchReservations(); // รีเฟรชตารางใหม่
        }
    };
});
