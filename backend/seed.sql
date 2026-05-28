-- Seed file for Rasoi Intelligence
-- Insert initial mock restaurants to support testing and admin features
-- Deterministic UUIDs are used to map c1-c6 to valid Postgres UUIDs.

INSERT INTO public.restaurants (id, name, email, type, location, city, capacity, icon)
VALUES 
  ('c1000000-0000-0000-0000-000000000001', 'Saffron Lounge', 'demo@rasoi.in', 'Fine Dining', 'Bandra West', 'Mumbai', 64, '🪷'),
  ('c2000000-0000-0000-0000-000000000002', 'Tandoor & Tonic', 'tandoor@rasoi.in', 'Bar & Restaurant', 'Indiranagar', 'Bengaluru', 110, '🍸'),
  ('c3000000-0000-0000-0000-000000000003', 'Curry Leaf Cafe', 'curry@rasoi.in', 'Casual', 'Koramangala', 'Bengaluru', 48, '🌿'),
  ('c4000000-0000-0000-0000-000000000004', 'Dilli Junction', 'dilli@rasoi.in', 'QSR', 'Connaught Place', 'Delhi', 32, '🍛'),
  ('c5000000-0000-0000-0000-000000000005', 'Coastal Co.', 'coastal@rasoi.in', 'Cloud Kitchen', 'Powai', 'Mumbai', 0, '🐟'),
  ('c6000000-0000-0000-0000-000000000006', 'Maharaja Dhaba', 'maharaja@rasoi.in', 'Dhaba', 'NH-44', 'Karnal', 180, '🚛')
ON CONFLICT (email) DO NOTHING;
