import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader2, Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InputBar({ onSend, disabled = false }) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');
        setMessage(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setMessage('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSend = () => {
    const text = message.trim();
    if (!text || disabled) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    onSend(text);
    setMessage('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4">
      <div className={`flex items-center gap-2 theme-input rounded-full px-4 py-2 transition-all ${isListening ? 'ring-2 ring-primary-cyan/70 bg-primary-cyan/10' : 'focus-within:ring-2 focus-within:ring-primary-violet/50'}`}>
        <button
          className="p-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Attach file"
        >
          <Paperclip size={18} />
        </button>

        {speechSupported && (
          <button
            className={`p-2 transition-opacity cursor-pointer ${isListening ? 'text-primary-cyan opacity-100 animate-pulse' : 'opacity-50 hover:opacity-100'}`}
            onClick={toggleListening}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
            disabled={disabled}
          >
            {isListening ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
        )}

        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Type your message..."}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-sm theme-input-text"
          aria-label="Chat message input"
        />

        <motion.button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="p-2 rounded-full gradient-primary text-white disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Send message"
        >
          {disabled ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </motion.button>
      </div>
    </div>
  );
}
