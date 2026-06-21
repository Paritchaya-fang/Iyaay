import { db } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const MAX_CAPACITY_PER_SLOT = 5;
const TIME_SLOTS = ["09:00 - 11:00", "11:00 - 13:00", "13:00 - 15:00", "15:00 - 17:00", "17:00 - 19:00"];

document.addEventListener('DOMContentLoaded', () => {
    const dateSelect = document.getElementById('date');
    const timeSlotsContainer = document.getElementById('timeSlots');
    const selectedSlotInput = document.getElementById('selectedSlot');
    const form = document.getElementById('bookingForm');
    const submitBtn = document.getElementById('submitBtn');

    // 1. Populate Dates (1-7 days ahead)
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
        let nextDate = new Date();
        nextDate.setDate(today.getDate() + i);
        let dateString = nextDate.toISOString().split('T')[0]; // YYYY-MM-DD
        let displayString = nextDate.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        let option = document.createElement('option');
        option.value = dateString;
        option.textContent = displayString;
        dateSelect.appendChild(option);
    }

    // 2. Load and Check Availability
    async function loadTimeSlots() {
        const selectedDate = dateSelect.value;
        timeSlotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">กำลังโหลดคิวว่าง...</p>';
        selectedSlotInput.value = '';
        
        try {
            // Wait, if db is not initialized (no config), we should mock it or it will crash.
            if(!db) {
                renderMockSlots();
                return;
            }

            const q = query(collection(db, "bookings"), where("date", "==", selectedDate), where("status", "!=", "Cancelled"));
            const querySnapshot = await getDocs(q);
            
            let slotCounts = {};
            TIME_SLOTS.forEach(slot => slotCounts[slot] = 0);

            querySnapshot.forEach((doc) => {
                let data = doc.data();
                if (slotCounts[data.timeSlot] !== undefined) {
                    slotCounts[data.timeSlot]++;
                }
            });

            renderSlots(slotCounts);
        } catch (error) {
            console.error("Error fetching availability:", error);
            // Fallback for demo without DB config
            renderMockSlots();
        }
    }

    function renderMockSlots() {
        let mockCounts = {};
        TIME_SLOTS.forEach(slot => mockCounts[slot] = Math.floor(Math.random() * 6)); // Random 0-5
        renderSlots(mockCounts);
    }

    function renderSlots(slotCounts) {
        timeSlotsContainer.innerHTML = '';
        TIME_SLOTS.forEach(slot => {
            let count = slotCounts[slot] || 0;
            let isFull = count >= MAX_CAPACITY_PER_SLOT;

            let btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'slot-btn';
            btn.textContent = isFull ? `${slot} (เต็ม)` : slot;
            btn.disabled = isFull;

            btn.addEventListener('click', () => {
                // Deselect others
                document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedSlotInput.value = slot;
            });

            timeSlotsContainer.appendChild(btn);
        });
    }

    dateSelect.addEventListener('change', loadTimeSlots);
    // Initial load
    loadTimeSlots();

    // 3. Handle Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!selectedSlotInput.value) {
            alert('กรุณาเลือกรอบเวลา (Time Slot)');
            return;
        }

        const submitOriginalText = submitBtn.textContent;
        submitBtn.textContent = 'กำลังทำรายการ...';
        submitBtn.disabled = true;

        const bookingData = {
            customerName: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            pax: parseInt(document.getElementById('pax').value),
            date: document.getElementById('date').value,
            timeSlot: selectedSlotInput.value,
            note: document.getElementById('note').value,
            status: 'Booked',
            createdAt: Timestamp.now()
        };

        try {
            let bookingId = 'IY-' + Math.floor(1000 + Math.random() * 9000); // fallback ID
            if (db) {
                const docRef = await addDoc(collection(db, "bookings"), bookingData);
                // Use last 4 chars of doc ID as reference
                bookingId = 'IY-' + docRef.id.slice(-4).toUpperCase();
            }

            // Show Success Modal
            const modal = document.getElementById('successModal');
            document.getElementById('refDisplay').textContent = bookingId;
            document.getElementById('detailsDisplay').textContent = 
                `วันที่: ${dateSelect.options[dateSelect.selectedIndex].text} | เวลา: ${bookingData.timeSlot} | จำนวน: ${bookingData.pax} ท่าน`;
            
            modal.classList.add('active');
            form.reset();
            selectedSlotInput.value = '';
            
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่อีกครั้ง");
        } finally {
            submitBtn.textContent = submitOriginalText;
            submitBtn.disabled = false;
        }
    });
});
