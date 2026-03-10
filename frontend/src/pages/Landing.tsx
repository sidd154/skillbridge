import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            {/* Background decoration */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px] pointer-events-none" />

            {/* Nav */}
            <nav className="w-full p-6 flex justify-between items-center relative z-10 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent" />
                    <span className="text-xl font-bold tracking-tight text-white">SkillBridge</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-medium text-muted hover:text-white transition-colors">
                        Log in
                    </Link>
                    <Link to="/register/candidate" className="btn-primary px-4 py-2 text-sm">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 mt-[-5vh]">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-4xl mx-auto space-y-8"
                >
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                        Stop guessing. <br />
                        Start <span className="text-gradient">proving</span> skills.
                    </h1>

                    <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
                        Replace unverified resume claims with AI-proctored <b>Skill Passports</b>.
                        Connect top verified talent with verified recruiters instantly.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link to="/register/candidate" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
                            I'm a Candidate
                        </Link>
                        <Link to="/register/recruiter" className="btn-outline text-lg px-8 py-4 w-full sm:w-auto bg-surface/30 backdrop-blur-sm">
                            I'm a Recruiter
                        </Link>
                    </div>

                    <div className="pt-16 flex flex-col items-center gap-4 text-sm text-muted/60">
                        <p>Backed by AI Multi-Agent Architecture • Real-time Proctoring</p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
