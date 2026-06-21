-- 1. Create Custom Enum for Reservation Status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
        CREATE TYPE public.reservation_status AS ENUM ('Booked', 'Arrived', 'No-show', 'Cancelled');
    END IF;
END $$;

-- 2. Create the reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    reservation_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    guest_count INTEGER NOT NULL CHECK (guest_count > 0),
    special_requests TEXT,
    status public.reservation_status DEFAULT 'Booked'::public.reservation_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies

-- Policy: Allow anonymous users (guests) to insert reservations
CREATE POLICY "Allow guest insertions" ON public.reservations
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy: Allow authenticated staff/admin to view all reservations
CREATE POLICY "Allow staff to select all" ON public.reservations
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow authenticated staff/admin to update reservations
CREATE POLICY "Allow staff to update" ON public.reservations
    FOR UPDATE
    TO authenticated
    USING (true);

-- (Optional) If you want staff to be able to delete, though changing status to 'Cancelled' is preferred:
-- CREATE POLICY "Allow staff to delete" ON public.reservations FOR DELETE TO authenticated USING (true);


-- 5. Create Database Function (RPC) to check booked slots
-- This allows the frontend to fetch just the "counts" of bookings per slot, safely hiding customer data.
CREATE OR REPLACE FUNCTION public.get_booked_slots(p_date DATE)
RETURNS TABLE (
    slot_time TEXT,
    booked_count BIGINT
) 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
    SELECT time_slot, COUNT(*) as booked_count
    FROM public.reservations
    WHERE reservation_date = p_date 
      AND status != 'Cancelled'::public.reservation_status
    GROUP BY time_slot;
$$;
