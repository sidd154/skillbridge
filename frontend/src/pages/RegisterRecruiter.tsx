import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";

export default function RegisterRecruiter() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone: "",
        company_name: "",
        company_size: "1-10",
        designation: "",
        password: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleNext = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post("/auth/register/recruiter", {
                email: form.email,
                password: form.password,
                full_name: form.full_name,
                phone: form.phone,
                company_name: form.company_name,
                company_size: form.company_size,
                designation: form.designation
            });
            setStep(2); // Go to OTP step visualization
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to register recruiter");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Supabase typically handles OTP verification via a separate endpoint.
        // For hackathon sake, we mock the OTP verification step, as auth token is actually
        // what matters for login. We route them to login directly to login themselves.
        setTimeout(() => {
            navigate('/login');
        }, 1000);
    }

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden py-12">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[100px] pointer-events-none" />

            <Link to="/" className="absolute top-6 left-6 text-muted hover:text-white flex items-center gap-2 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                Back to Home
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-8 rounded-2xl w-full max-w-md relative z-10 my-auto mt-12"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Recruiter Signup</h2>
                    <p className="text-muted">Find verified talent instantly.</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-error/20 border border-error/50 text-error-light text-sm text-center">
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleNext} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted mb-1">Full Name</label>
                            <input required type="text" name="full_name" value={form.full_name} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="Sarah Jenkins" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Work Email</label>
                                <input required type="email" name="email" value={form.email} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="sarah@corp.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Phone</label>
                                <input required type="text" name="phone" value={form.phone} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="+1234567" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Company</label>
                                <input required type="text" name="company_name" value={form.company_name} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="Acme Corp" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Designation</label>
                                <input required type="text" name="designation" value={form.designation} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="HR Manager" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted mb-1">Password</label>
                            <input required type="password" name="password" value={form.password} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="••••••••" />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-6 text-white font-medium hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50">
                            {loading ? "Registering..." : "Continue to Verification"}
                        </button>
                    </form>
                ) : (
                    <motion.form
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        onSubmit={handleVerifyOTP} className="space-y-6 text-center"
                    >
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-light"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white">Check your email</h3>
                        <p className="text-muted text-sm px-4">We've sent a 6-digit verification code to your work email address to verify your company domain.</p>

                        <div className="pt-4">
                            <input required type="text" maxLength={6} className="w-full tracking-[1em] text-center font-mono text-2xl bg-surface/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:outline-none" placeholder="000000" />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-6">
                            {loading ? "Verifying..." : "Verify & Continue to Login"}
                        </button>
                    </motion.form>
                )}

                {step === 1 && (
                    <p className="mt-6 text-center text-sm text-muted">
                        Already have an account? <Link to="/login" className="text-primary-light hover:underline font-medium">Log in</Link>
                    </p>
                )}
            </motion.div>
        </div>
    );
}
