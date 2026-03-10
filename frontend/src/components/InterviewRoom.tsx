import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function InterviewRoom() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState<{ speaker: string, text: string }[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Mock WebSocket Connection Setup
        wsRef.current = new WebSocket("ws://localhost:8000/ws/interview/mock-session");

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setTranscript(prev => [...prev, { speaker: data.speaker, text: data.text }]);
            // Trigger Web Speech API Synthesis for Bot Voice here
            speakWithWebSpeech(data.text);
        };

        return () => {
            wsRef.current?.close();
        };
    }, []);

    const speakWithWebSpeech = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            // Optional: Choose specific voice
            // const voices = window.speechSynthesis.getVoices();
            // utterance.voice = voices[0];
            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
            // Stop Web Speech Recognition
            // Send final candidate text to WebSocket
            const mockCandidateText = "I think React Context is great for global state.";
            setTranscript(prev => [...prev, { speaker: "candidate", text: mockCandidateText }]);
            wsRef.current?.send(JSON.stringify({ text: mockCandidateText }));
        } else {
            setIsRecording(true);
            // Start Web Speech Recognition
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-[80vh] flex flex-col pt-8">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Bot Interview</h1>
                    <p className="text-muted text-sm mt-1">Role: Senior React Developer</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-sm font-medium text-accent">Live</span>
                </div>
            </header>

            {/* Transcript Area */}
            <div className="flex-1 glass rounded-2xl p-6 overflow-y-auto mb-6 flex flex-col gap-6">
                {transcript.length === 0 ? (
                    <div className="m-auto text-center text-muted flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                        </div>
                        <p>Connecting to AI Interviewer...</p>
                    </div>
                ) : (
                    transcript.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.speaker === 'bot' ? 'justify-start' : 'justify-end'}`}
                        >
                            <div className={`max-w-[80%] p-4 rounded-2xl ${msg.speaker === 'bot' ? 'bg-surface/80 border border-white/10 text-white rounded-tl-sm' : 'bg-primary text-white rounded-tr-sm'}`}>
                                <p className="text-xs opacity-50 mb-1 uppercase tracking-wider">{msg.speaker}</p>
                                <p className="leading-relaxed">{msg.text}</p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Controls */}
            <div className="flex justify-center items-center gap-6">
                <button
                    onClick={toggleRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-error shadow-[0_0_30px_rgba(244,63,94,0.5)]' : 'bg-surface border border-white/20 hover:bg-white/10'}`}
                >
                    {isRecording ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="10" height="10" x="7" y="7" rx="2" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                    )}
                </button>
                <div className="text-sm font-medium text-muted">
                    {isRecording ? "Listening... Click to send" : "Click to speak"}
                </div>
            </div>
        </div>
    );
}
