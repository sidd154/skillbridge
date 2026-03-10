import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../services/api";

export default function PostJob() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: "",
        description: "",
        location: "",
        job_type: "Full-time",
        min_experience_years: 0,
        required_skills: [] as string[]
    });

    const [skillInput, setSkillInput] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: name === "min_experience_years" ? parseInt(value) : value }));
    };

    const addSkill = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && skillInput.trim()) {
            e.preventDefault();
            if (!form.required_skills.includes(skillInput.trim())) {
                setForm(prev => ({ ...prev, required_skills: [...prev.required_skills, skillInput.trim()] }));
            }
            setSkillInput("");
        }
    };

    const removeSkill = (skill: string) => {
        setForm(prev => ({ ...prev, required_skills: prev.required_skills.filter(s => s !== skill) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post("/jobs/", form);
            navigate("/dashboard/recruiter");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to post job. Make sure you are a verified recruiter.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8">
            <header className="mb-8">
                <button onClick={() => navigate(-1)} className="text-muted hover:text-white flex items-center gap-2 mb-4 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    Back
                </button>
                <h1 className="text-3xl font-bold text-white">Post a New Job</h1>
                <p className="text-muted mt-2">Describe the role and AI-verified skills you're looking for.</p>
            </header>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-error/20 border border-error/50 text-error-light">
                    {error}
                </div>
            )}

            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="glass p-8 rounded-2xl space-y-6"
            >
                <div>
                    <label className="block text-sm font-medium text-white mb-2">Job Title</label>
                    <input required type="text" name="title" value={form.title} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:outline-none" placeholder="e.g. Senior Backend Engineer" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Location</label>
                        <input required type="text" name="location" value={form.location} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:outline-none" placeholder="e.g. Remote, San Francisco" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Job Type</label>
                        <select name="job_type" value={form.job_type} onChange={handleChange} className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:outline-none">
                            <option>Full-time</option>
                            <option>Contract</option>
                            <option>Part-time</option>
                            <option>Internship</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-white mb-2">Min. Experience (Years)</label>
                    <input type="number" name="min_experience_years" value={form.min_experience_years} onChange={handleChange} className="w-1/3 bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:outline-none" min="0" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-white mb-2">Required Skills (Press Enter to add)</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {form.required_skills.map(skill => (
                            <span key={skill} className="bg-primary/20 text-primary-light px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                {skill}
                                <button type="button" onClick={() => removeSkill(skill)} className="hover:text-white">&times;</button>
                            </span>
                        ))}
                    </div>
                    <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={addSkill} className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:outline-none" placeholder="e.g. Python, React, AWS" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-white mb-2">Job Description</label>
                    <textarea required name="description" value={form.description} onChange={handleChange} rows={5} className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:outline-none resize-none" placeholder="Describe the role, responsibilities, and team..." />
                </div>

                <div className="pt-4">
                    <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-white font-bold text-lg">
                        {loading ? "Posting..." : "Post Job Opportunity"}
                    </button>
                </div>
            </motion.form>
        </div>
    );
}
