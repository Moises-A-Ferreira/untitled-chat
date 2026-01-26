-- Script to promote a user to admin
-- Replace 'admin@saomanuel.sp.gov.br' with the email of the user you want to make admin

-- First, create the user through the Supabase Auth UI or sign up flow
-- Then run this script to promote them to admin

-- Update the role of an existing user to admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@saomanuel.sp.gov.br';

-- Alternatively, if you know the user's ID:
-- UPDATE profiles SET role = 'admin' WHERE id = 'user-uuid-here';

-- To see all users and their roles:
-- SELECT id, email, nome_completo, role FROM profiles;
