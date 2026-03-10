-- ========================================================
-- 0. NUKE AND START OVER (Run this first to clear everything)
-- ========================================================
DROP TABLE IF EXISTS public.interview_sessions CASCADE;
DROP TABLE IF EXISTS public.test_sessions CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.skill_categories CASCADE;
DROP TABLE IF EXISTS public.skill_passports CASCADE;
DROP TABLE IF EXISTS public.recruiters CASCADE;
DROP TABLE IF EXISTS public.candidates CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.improvement_roadmaps CASCADE;

-- ========================================================
-- 1. Profiles (Extends auth.users)
-- ========================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('candidate', 'recruiter')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ========================================================
-- 2. Candidates
-- ========================================================
CREATE TABLE public.candidates (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  college TEXT,
  graduation_year INT,
  degree TEXT,
  resume_path TEXT
);

-- ========================================================
-- 3. Recruiters
-- ========================================================
CREATE TABLE public.recruiters (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT,
  is_verified BOOLEAN DEFAULT FALSE
);

-- ========================================================
-- 4. Skill Passports
-- ========================================================
CREATE TABLE public.skill_passports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  skills JSONB, -- Stores the compiled skills from Agent 4
  proctoring_score INT DEFAULT 100,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc', NOW()) + INTERVAL '18 months')
);

-- ========================================================
-- 5. Jobs
-- ========================================================
CREATE TABLE public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID REFERENCES public.recruiters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  job_type TEXT,
  min_experience_years INT DEFAULT 0,
  required_skills JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ========================================================
-- 6. Applications
-- ========================================================
CREATE TABLE public.applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('applied', 'tested', 'interviewing', 'reviewed', 'rejected', 'hired')) DEFAULT 'applied',
  match_score INT,
  analysis_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ========================================================
-- 7. Test Sessions (For the dynamic MCQ test)
-- ========================================================
CREATE TABLE public.test_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  questions JSONB,
  answers JSONB,
  score INT,
  passed BOOLEAN DEFAULT FALSE,
  proctoring_flags JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ========================================================
-- 8. Interview Sessions (For the Bot Interview)
-- ========================================================
CREATE TABLE public.interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  transcript JSONB,
  assessment_summary JSONB,
  overall_rating INT,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ========================================================
-- 9. Improvement Roadmaps
-- ========================================================
CREATE TABLE public.improvement_roadmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  roadmap_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS (Simplified for Hackathon)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public candidates are viewable by everyone" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "Users can update own candidate record" ON public.candidates FOR ALL USING (auth.uid() = id);

ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view/update own test sessions" ON public.test_sessions FOR ALL USING (auth.uid() = candidate_id);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jobs are viewable by everyone" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Recruiters can manage own jobs" ON public.jobs FOR ALL USING (auth.uid() = recruiter_id);

ALTER TABLE public.skill_passports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Passports are viewable by everyone" ON public.skill_passports FOR SELECT USING (true);
CREATE POLICY "Candidates can view own passport" ON public.skill_passports FOR ALL USING (auth.uid() = candidate_id);
