import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const SYMPTOM_DATABASE = {
    "fever": {
        disease: "Common Flu / Viral Infection",
        recommendations: [
            "Practice plenty of bed rest.",
            "Stay hydrated by drinking warm water or soups.",
            "Monitor body temperature regularly.",
            "Consider paracetamol if fever is high, but check with a doctor."
        ]
    },
    "cough": {
        disease: "Bronchitis / Respiratory Cold",
        recommendations: [
            "Drink warm honey-lemon water or herbal tea.",
            "Consider steam inhalation to ease airways.",
            "Avoid cold foods or iced drinks.",
            "Wear a face mask if you are around others."
        ]
    },
    "headache": {
        disease: "Tension Headache / Migraine / Fatigue",
        recommendations: [
            "Rest in a quiet, dark or dimly lit room.",
            "Stay hydrated and avoid staring at screens.",
            "Gently massage your neck and temples.",
            "Track if it is accompanied by vision changes or stiffness."
        ]
    },
    "stomach pain": {
        disease: "Gastritis / Indigestion / Food Poisoning",
        recommendations: [
            "Eat a bland diet (BRAT: Bananas, Rice, Applesauce, Toast).",
            "Avoid oily, spicy, or deeply fried foods.",
            "Drink electrolyte solutions if experiencing diarrhea.",
            "Avoid lying down immediately after consuming food."
        ]
    }
};

export default function SymptomCheckerBot() {
    const [messages, setMessages] = useState([
        { 
            id: 1, 
            sender: 'bot', 
            text: 'नमस्ते! म मेडी-सेवा च्याटबोट हु। (Hello! I am your Medi-Sewa bot.) How can I help you? Please type your symptoms or select a quick option below.' 
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleProcessSymptom = (symptomKey, contextUserText) => {
        const query = symptomKey.toLowerCase().trim();
        let matched = false;

        for (const key in SYMPTOM_DATABASE) {
            // Enhanced match logic for both manual typing inputs and quick pills
            if (query.includes(key) || key.includes(query)) {
                const match = SYMPTOM_DATABASE[key];
                const recLines = match.recommendations.map(rec => `• ${rec}`).join('\n');
                
                // First human-like DM response block
                const analysisReply = {
                    id: Date.now() + 1,
                    sender: 'bot',
                    text: `आधारभूत विश्लेषण (Based on your input):\nYour symptoms match patterns associated with *${match.disease}*.`,
                    replyTo: contextUserText 
                };

                // Second back-to-back distinct chat bubble (like a real person typing a follow-up DM)
                const recommendationReply = {
                    id: Date.now() + 2,
                    sender: 'bot',
                    text: `सुझावहरू (Recommendations):\n${recLines}`,
                    replyTo: null // Keeps the layout clean without repeating the quote link
                };

                setMessages(prev => [...prev, analysisReply]);
                
                // Slight offset delay for the second bubble to feel natural
                setTimeout(() => {
                    setMessages(prev => [...prev, recommendationReply]);
                }, 400);

                matched = true;
                break;
            }
        }

        if (!matched) {
            const fallbackReply = {
                id: Date.now() + 1,
                sender: 'bot',
                text: "मलाई माफ गर्नुहोस्, म त्यो लक्षण बुझ्न असमर्थ भएँ। Please try keywords like: Fever, Cough, Headache, or Stomach Pain.",
                replyTo: contextUserText
            };
            setMessages(prev => [...prev, fallbackReply]);
        }
    };

    const handleAddUserMessageAndProcess = (textToSend) => {
        const userMsg = { id: Date.now(), sender: 'user', text: textToSend };
        setMessages(prev => [...prev, userMsg]);

        setTimeout(() => {
            handleProcessSymptom(textToSend, textToSend);
        }, 600);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const currentInput = inputValue;
        setInputValue('');
        handleAddUserMessageAndProcess(currentInput);
    };

    return (
        <div className="chat-wrapper">
            {/* Header */}
            <div className="chat-header">
                <div className="header-user-info">
                    <div className="avatar bot-avatar-mini">🩺</div>
                    <div>
                        <h3>मेडी-सेवा AI</h3>
                        <span className="active-status">Active now</span>
                    </div>
                </div>
                <span className="disclaimer-badge">AI Triage</span>
            </div>

            {/* Chat Body Window */}
            <div className="chat-body">
                <div className="chat-timestamp">8:50 PM</div>
                
                {messages.map((msg) => (
                    <div key={msg.id} className={`chat-row ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                        {msg.sender === 'bot' && <div className="avatar bot-main-avatar">🩺</div>}
                        
                        <div className="bubble-container">
                            {/* Instagram Style Reply Quote Header */}
                            {msg.replyTo && (
                                <div className="insta-reply-context">
                                    <span className="reply-label">मेडी-सेवा AI replied to you</span>
                                    <div className="reply-quote-box">{msg.replyTo}</div>
                                </div>
                            )}

                            <div className={`chat-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Interactive Quick-Click Pills */}
            <div className="pill-container">
                {Object.keys(SYMPTOM_DATABASE).map((symptom) => (
                    <button 
                        key={symptom} 
                        onClick={() => handleAddUserMessageAndProcess(`I have a ${symptom}`)}
                        className="pill-button"
                    >
                        +{symptom}
                    </button>
                ))}
            </div>

            {/* Form Input Bar */}
            <form onSubmit={handleSendMessage} className="input-area">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Message..."
                    className="text-field"
                />
                {inputValue.trim() && (
                    <button type="submit" className="send-button">Send</button>
                )}
            </form>

            {/* Safety Sticky Disclaimer */}
            <div className="medical-warning">
                ⚠️ <strong>Disclaimer:</strong> Home care suggestions only. If severe, visit a clinic immediately.
            </div>
        </div>
    );
}