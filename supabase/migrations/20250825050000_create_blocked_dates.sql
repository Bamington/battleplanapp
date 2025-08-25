-- Create blocked_dates table
CREATE TABLE IF NOT EXISTS blocked_dates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (date >= CURRENT_DATE)
);

-- Enable RLS
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read blocked dates
CREATE POLICY "Anyone can read blocked dates" ON blocked_dates
    FOR SELECT USING (true);

-- Policy: Admins and location admins can manage blocked dates
CREATE POLICY "Admins and location admins can manage blocked dates" ON blocked_dates
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.is_admin = true
            ) OR
            EXISTS (
                SELECT 1 FROM locations 
                WHERE locations.id = blocked_dates.location_id
                AND locations.admins @> ARRAY[auth.uid()]
            )
        )
    );
