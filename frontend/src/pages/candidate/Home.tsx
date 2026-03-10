import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function CandidateHome() {
    const navigate = useNavigate();
    const [hasPassport, setHasPassport] = useState(false);
    const [name, setName] = useState("Candidate");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const storedName = localStorage.getItem("candidateName");
        if (storedName) setName(storedName);

        const passportStatus = localStorage.getItem("hasPassport");
        if (passportStatus === "true") setHasPassport(true);
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setUploading(true);

            const formData = new FormData();
            formData.append("file", file);

            try {
                // Real LangGraph integration: This endpoint compiles the PDF, extracts skills via Agent 1, and generates tests via Agent 2
                const response = await api.post("/candidates/upload-resume", formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const { test_session_id } = response.data;
                // Navigate to the test flow with real session ID
                navigate(`/dashboard/candidate/test?session=${test_session_id}`);
            } catch (err: any) {
                console.error("Upload failed", err);
                alert(err.response?.data?.detail || "Failed to parse resume.");
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in relative">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">Welcome back, {name}</h1>
                <p className="text-muted mt-1">Here's your current SkillBridge status.</p>
            </header>

            {/* Status Card */}
            <div className="glass p-6 rounded-2xl border-l-4 border-l-primary flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Skill Passport Status</h3>
                    <p className="text-sm text-muted mt-1">
                        {hasPassport ? "Active and verified for 18 months." : "You do not have a verified passport yet."}
                    </p>
                </div>
                {!hasPassport && (
                    <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-error/20 text-error-light rounded-full text-xs font-medium mb-2">Pending Action</span>
                        <p className="text-xs text-muted">Upload resume to start.</p>
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Upload Action */}
                <motion.div
                    whileHover={{ y: !uploading ? -5 : 0 }}
                    className="glass p-6 rounded-2xl flex flex-col items-center justify-center text-center min-h-[250px] border border-white/5 hover:border-primary/50 transition-colors cursor-pointer relative overflow-hidden group"
                    onClick={() => !uploading && fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary-light group-hover:scale-110 transition-transform">
                        {uploading ? (
                            <div className="w-5 h-5 border-2 border-primary-light border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                        )}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{uploading ? "Analyzing resume..." : "Upload Resume"}</h3>
                    <p className="text-sm text-muted mt-2 mb-6">Drop your PDF resume here. Our agent will parse your skills and generate a dynamic verification test.</p>
                    <button disabled={uploading} className="btn-primary w-full max-w-[200px] py-2 flex justify-center items-center">
                        {uploading ? "Parsing..." : "Select PDF"}
                    </button>
                </motion.div>

                {/* Mock Passport View (Empty State) */}
                {!hasPassport ? (
                    <div className="glass bg-surface/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center min-h-[250px] border border-white/5 opacity-50">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-muted">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white">Skill Passport</h3>
                        <p className="text-sm text-muted mt-2">Locked until you pass the AI verification test.</p>
                    </div>
                ) : (
                    <div className="glass p-6 rounded-2xl border border-accent/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[50px] rounded-full pointer-events-none" />
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    Verified Passport
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                                </h3>
                                <p className="text-xs text-muted mt-1">Expires: Dec 2026</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-accent">98%</div>
                                <div className="text-[10px] text-muted uppercase tracking-wider">Trust Score</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-white">ReactJS</span>
                                    <span className="text-accent text-xs bg-accent/10 px-2 py-0.5 rounded">Advanced</span>
                                </div>
                                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                                    <div className="h-full bg-accent w-[90%] rounded-full" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-white">Python</span>
                                    <span className="text-accent text-xs bg-accent/10 px-2 py-0.5 rounded">Intermediate</span>
                                </div>
                                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                                    <div className="h-full bg-accent w-[75%] rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
