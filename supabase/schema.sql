-- Run this in the Supabase SQL Editor

-- 1. Profiles (Extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT CHECK (role IN ('candidate', 'recruiter')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Candidates
CREATE TABLE public.candidates (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  college TEXT,
  graduation_year INT,
  degree TEXT,
  phone_number TEXT,
  resume_path TEXT -- Path to local FS or Supabase Storage
);

-- 3. Recruiters
CREATE TABLE public.recruiters (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE
);

-- 4. Skill Passports
CREATE TABLE public.skill_passports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'verified', 'failed')) DEFAULT 'pending',
  overall_score INT,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Skill Categories (Stores individual skills within a passport)
CREATE TABLE public.skill_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  passport_id UUID REFERENCES public.skill_passports(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL,
  proficiency_claimed TEXT,
  proficiency_verified TEXT,
  score INT
);

-- 6. Jobs
CREATE TABLE public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID REFERENCES public.recruiters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  required_skills JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 7. Applications
CREATE TABLE public.applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('applied', 'tested', 'interviewing', 'reviewed', 'rejected', 'hired')) DEFAULT 'applied',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 8. Test Sessions (For the dynamic MCQ test)
CREATE TABLE public.test_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  questions JSONB,
  answers JSONB,
  score INT,
  proctoring_flags JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 9. Interview Sessions (For the Bot Interview)
CREATE TABLE public.interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  transcript JSONB,
  summary JSONB,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Security (Row Level Security - RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Add basic policies (simplified for hackathon)
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
