import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";

export default function RegisterCandidate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        password: "",
        phone: "",
        college: "",
        graduation_year: new Date().getFullYear(),
        degree: "Bachelors"
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post("/auth/register/candidate", {
                email: form.email,
                password: form.password,
                full_name: form.full_name,
                phone: form.phone,
                college: form.college,
                graduation_year: Number(form.graduation_year),
                degree: form.degree
            });

            // Redirect to login upon successful registration
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to register candidate.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden py-12">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

            <Link to="/" className="absolute top-6 left-6 text-muted hover:text-white flex items-center gap-2 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                Back to Home
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-8 rounded-2xl w-full max-w-md relative z-10 my-auto"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Candidate Signup</h2>
                    <p className="text-muted">Create your Skill Passport today.</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-error/20 border border-error/50 text-error-light text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">Full Name</label>
                        <input required type="text" name="full_name" value={form.full_name} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="John Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">Email</label>
                        <input required type="email" name="email" value={form.email} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="john@example.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-muted mb-1">Phone</label>
                            <input required type="text" name="phone" value={form.phone} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="+1234567890" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted mb-1">Degree</label>
                            <select required name="degree" value={form.degree} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all">
                                <option className="bg-background">Bachelors</option>
                                <option className="bg-background">Masters</option>
                                <option className="bg-background">PhD</option>
                                <option className="bg-background">Associate</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-muted mb-1">College</label>
                            <input type="text" name="college" value={form.college} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="MIT" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted mb-1">Grad Year</label>
                            <input type="number" name="graduation_year" value={form.graduation_year} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="2024" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">Password</label>
                        <input required type="password" name="password" value={form.password} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="••••••••" />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4 text-white font-medium relative hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50">
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-muted">
                    Already have an account? <Link to="/login" className="text-primary-light hover:underline font-medium">Log in</Link>
                </p>
            </motion.div>
        </div>
    );
}
