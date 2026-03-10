-- Disable RLS for hackathon scope, or enable and add policies if needed.
-- For speed in hackathon, we'll keep it simple but structured.

-- Enums
CREATE TYPE user_role AS ENUM ('candidate', 'recruiter');
CREATE TYPE application_source AS ENUM ('candidate_applied', 'recruiter_headhunted');
CREATE TYPE application_status AS ENUM ('applied', 'mcq_pending', 'mcq_done', 'interview_pending', 'interview_done', 'reviewed', 'accepted', 'rejected');
CREATE TYPE interview_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE headhunt_status AS ENUM ('pending', 'accepted', 'declined');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    role user_role NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Candidates
CREATE TABLE candidates (
    id UUID REFERENCES profiles(id) PRIMARY KEY,
    college TEXT,
    graduation_year INT,
    degree TEXT,
    resume_path TEXT,
    passport_id UUID, -- Will be FK, set below
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recruiters
CREATE TABLE recruiters (
    id UUID REFERENCES profiles(id) PRIMARY KEY,
    company_name TEXT NOT NULL,
    company_domain TEXT NOT NULL,
    company_size TEXT,
    designation TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    otp_code TEXT,
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skill Categories
CREATE TABLE skill_categories (
    id SERIAL PRIMARY KEY,
    category_name TEXT UNIQUE NOT NULL
);

INSERT INTO skill_categories (category_name) VALUES 
('Frontend'), ('Backend'), ('Data Science'), ('DevOps'), ('Design'), ('Management'), ('Free-form');

-- Skill Passports
CREATE TABLE skill_passports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id) NOT NULL,
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    proctoring_score FLOAT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE candidates ADD CONSTRAINT fk_passport FOREIGN KEY (passport_id) REFERENCES skill_passports(id);

-- Test Sessions
CREATE TABLE test_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id) NOT NULL,
    questions JSONB,
    answers JSONB,
    proctoring_log JSONB,
    proctoring_consent BOOLEAN DEFAULT FALSE,
    score FLOAT,
    passed BOOLEAN,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Improvement Roadmaps
CREATE TABLE improvement_roadmaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id) NOT NULL,
    test_session_id UUID REFERENCES test_sessions(id) NOT NULL,
    failed_skills JSONB,
    roadmap JSONB,
    retake_available_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs
CREATE TABLE jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recruiter_id UUID REFERENCES recruiters(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    job_type TEXT,
    required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    min_experience_years INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications
CREATE TABLE applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) NOT NULL,
    candidate_id UUID REFERENCES candidates(id) NOT NULL,
    source application_source NOT NULL,
    status application_status DEFAULT 'applied',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview Sessions
CREATE TABLE interview_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID REFERENCES applications(id) NOT NULL,
    recruiter_mcqs JSONB,
    transcript JSONB DEFAULT '[]'::jsonb,
    audio_chunks JSONB DEFAULT '[]'::jsonb,
    summary JSONB,
    status interview_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Headhunt Invitations
CREATE TABLE headhunt_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recruiter_id UUID REFERENCES recruiters(id) NOT NULL,
    candidate_id UUID REFERENCES candidates(id) NOT NULL,
    job_id UUID REFERENCES jobs(id) NOT NULL,
    message TEXT,
    status headhunt_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
