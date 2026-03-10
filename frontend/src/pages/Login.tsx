import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post("/auth/login", { email, password });
            const { access_token, role, full_name } = response.data;

            // Store real auth token and metadata
            localStorage.setItem("accessToken", access_token);
            localStorage.setItem("userRole", role);
            localStorage.setItem("candidateEmail", email);
            localStorage.setItem("candidateName", full_name || email.split('@')[0] || "User");

            // Route dynamically based on true database role
            if (role === "candidate") {
                navigate('/dashboard/candidate');
            } else if (role === "recruiter") {
                navigate('/dashboard/recruiter');
            } else {
                setError("Undefined role assigned. Contact support.");
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "Invalid credentials or Server Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

            <Link to="/" className="absolute top-6 left-6 text-muted hover:text-white flex items-center gap-2 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                Back to Home
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass p-8 rounded-2xl w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-muted">Log in to your SkillBridge account.</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-error/20 border border-error/50 text-error-light text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">Email</label>
                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="user@example.com" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-muted">Password</label>
                            <a href="#" className="text-xs text-primary-light hover:underline">Forgot?</a>
                        </div>
                        <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="••••••••" />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4 text-white font-medium hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50">
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <p className="text-sm text-muted mb-4">Don't have an account?</p>
                    <div className="flex gap-4 justify-center">
                        <Link to="/register/candidate" className="text-sm font-medium text-white hover:text-primary-light transition-colors">Candidate Signup</Link>
                        <span className="text-white/20">•</span>
                        <Link to="/register/recruiter" className="text-sm font-medium text-white hover:text-primary-light transition-colors">Recruiter Signup</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
