const url = 'https://aqmszxhqrtjagjwxztul.supabase.co/rest/v1/reservations';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxbXN6eGhxcnRqYWdqd3h6dHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTgwMjIsImV4cCI6MjA5NzU5NDAyMn0.Zkv-NHlUsRSHN1xYghgyXTduU0XgP2FQBShw_pf9xu0';

async function testSupabase() {
    console.log("🚀 Running Supabase Backend Test via Node...");
    
    const dummyData = {
        customer_name: 'TEST_NODE_SCRIPT',
        phone_number: '0000000000',
        reservation_date: '2026-12-31',
        time_slot: '10:00 - 11:30 น.',
        guest_count: 2,
        special_requests: 'This is an automated test from Node',
        status: 'Booked'
    };

    try {
        console.log("\n1. Testing INSERT (Creating a reservation)...");
        const insertRes = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dummyData)
        });
        
        const insertData = await insertRes.json();
        if (!insertRes.ok) {
            throw new Error(`INSERT Failed: ${JSON.stringify(insertData)}`);
        }
        console.log("✅ INSERT Successful! Inserted ID:", insertData[0].id);

        console.log("\n2. Testing SELECT via RPC (Availability Check)...");
        const rpcUrl = 'https://aqmszxhqrtjagjwxztul.supabase.co/rest/v1/rpc/get_booked_slots';
        const rpcRes = await fetch(rpcUrl, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ p_date: '2026-12-31' })
        });
        
        const rpcData = await rpcRes.json();
        if (!rpcRes.ok) {
            throw new Error(`RPC Failed: ${JSON.stringify(rpcData)}`);
        }
        console.log("✅ RPC Successful! Slots booked on 2026-12-31:");
        console.log(rpcData);
        
        console.log("\n🎉 All tests passed successfully!");
        
    } catch (error) {
        console.error("\n❌ Test Failed:");
        console.error(error.message);
    }
}

testSupabase();
