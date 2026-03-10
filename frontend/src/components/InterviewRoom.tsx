import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function InterviewRoom() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState<{ speaker: string, text: string }[]>([]);
    const [isConnecting, setIsConnecting] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize WebSocket to the backend Agent 5
        const sessionId = "demo-interview-" + Math.floor(Math.random() * 10000);
        const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";

        wsRef.current = new WebSocket(`${wsUrl}/interview/${sessionId}`);

        wsRef.current.onopen = () => {
            setIsConnecting(false);
            console.log("Connected to AI Interviewer");
        };

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setTranscript(prev => [...prev, { speaker: data.speaker, text: data.text }]);
            // Trigger Web Speech API Synthesis for Bot Voice
            speakWithWebSpeech(data.text);
        };

        wsRef.current.onerror = () => {
            setError("Failed to connect to the interview server.");
            setIsConnecting(false);
        };

        // Initialize Speech Recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                const text = event.results[0][0].transcript;

                // Add candidate text to UI
                setTranscript(prev => [...prev, { speaker: "candidate", text }]);

                // Send text payload to LangGraph Agent via WebSocket
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ text }));
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech Recognition Error:", event.error);
                setIsRecording(false);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        } else {
            console.warn("Speech recognition not supported in this browser.");
            setError("Your browser does not support voice recognition. Please use Chrome/Edge.");
        }

        return () => {
            wsRef.current?.close();
            recognitionRef.current?.stop();
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
        if (!recognitionRef.current) return;

        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            // Stop any current bot speech before recording
            window.speechSynthesis.cancel();

            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (e) {
                console.error("Microphone start error", e);
            }
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
                {error ? (
                    <div className="m-auto text-center text-error flex flex-col items-center">
                        <p>{error}</p>
                    </div>
                ) : isConnecting ? (
                    <div className="m-auto text-center text-muted flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                        </div>
                        <p>Connecting to AI Interviewer...</p>
                    </div>
                ) : transcript.length === 0 ? (
                    <div className="m-auto text-center text-muted">
                        <p>Connection established. The interview will begin shortly.</p>
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
