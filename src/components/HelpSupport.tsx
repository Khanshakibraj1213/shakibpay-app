import React, { useState } from 'react';
import { Send, HelpCircle, Phone, Mail, Sparkles, Check, ShieldAlert } from 'lucide-react';

interface HelpSupportProps {
  onTicketCreated: () => void;
  user?: any;
  orders?: any[];
  theme?: 'light' | 'dark';
}

export default function HelpSupport({ onTicketCreated, user, orders, theme = 'light' }: HelpSupportProps) {
  // Support Ticket Form State
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [ticketLoading, setTicketLoading] = useState<boolean>(false);
  const [ticketSuccess, setTicketSuccess] = useState<boolean>(false);
  const [ticketError, setTicketError] = useState<string>('');

  // AI Assistant Chatbot State
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot', text: string }>>([
    { sender: 'bot', text: 'আসসালামু আলাইকুম! আমি টেলিকম রিসেলার ও এমএফএস (MFS) প্ল্যাটফর্মের এআই অ্যাসিস্ট্যান্ট। কিভাবে আপনাকে সাহায্য করতে পারি?' }
  ]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  const suggestions = [
    { label: '💰 ব্যালেন্স চেক', query: 'আমার বর্তমান ব্যালেন্স কত?' },
    { label: '➕ অ্যাড মানি কীভাবে করব?', query: 'অ্যাড মানি করার নিয়ম কী?' },
    { label: '📦 ড্রাইভ প্যাক কেনার নিয়ম', query: 'ড্রাইভ প্যাক কেনার নিয়ম কি?' },
    { label: '💸 ব্যালেন্স ট্রান্সফার নিয়ম', query: 'ব্যালেন্স ট্রান্সফার করার নিয়ম কি?' },
    { label: '📜 আমার অর্ডারের রিপোর্ট', query: 'আমার সর্বশেষ অর্ডারের রিপোর্ট কী?' }
  ];

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setTicketError('অনুগ্রহ করে সবগুলো তথ্য পূরণ করুন।');
      return;
    }

    setTicketLoading(true);
    setTicketError('');

    try {
      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });

      if (!response.ok) {
        throw new Error('টিকিট তৈরি করা যায়নি। পুনরায় চেষ্টা করুন।');
      }

      setTicketSuccess(true);
      setSubject('');
      setMessage('');
      onTicketCreated();
    } catch (err: any) {
      setTicketError(err.message);
    } finally {
      setTicketLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text }]);
    setChatLoading(true);

    try {
      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, user, recentOrders: orders }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'চ্যাটবটে ত্রুটি দেখা দিয়েছে।');
      }

      setChatMessages((prev) => [...prev, { sender: 'bot', text: data.text }]);
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { sender: 'bot', text: 'দুঃখিত, এই মুহূর্তে চ্যাট সার্ভারে সাময়িক বিঘ্ন ঘটেছে। দয়া করে একটু পর পুনরায় চেষ্টা করুন।' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Help Banner & AI Assistant Intro */}
      <div className={`rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
        theme === 'dark'
          ? 'bg-gradient-to-tr from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 text-white'
          : 'bg-gradient-to-tr from-indigo-600 via-indigo-700 to-indigo-850 text-white shadow-lg shadow-indigo-600/10'
      }`}>
        <div className="space-y-2 max-w-lg z-10">
          <span className={`font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md inline-block ${
            theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-white/15 text-white'
          }`}>
            AI Help Desk (Bangla AI)
          </span>
          <h2 className="text-xl sm:text-2xl font-serif-display font-extrabold leading-tight">আমরা আপনাকে কিভাবে সাহায্য করতে পারি?</h2>
          <p className={`text-xs leading-relaxed font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-indigo-100/90'}`}>
            যেকোনো সার্ভিস সংক্রান্ত জিজ্ঞাসায় আমাদের বাংলাভাষী এআই চ্যাটবটের সাথে ইনস্ট্যান্ট মেসেজিং করে সমাধান জেনে নিন অথবা সাপোর্ট টিকিট তৈরি করুন।
          </p>
        </div>

        <button
          onClick={() => setChatOpen(true)}
          className={`font-black px-5 py-3 rounded-xl shadow-md text-xs flex items-center space-x-2 shrink-0 transition-all cursor-pointer z-10 active:scale-95 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:opacity-95'
              : 'bg-white text-indigo-600 hover:bg-neutral-50 shadow-md shadow-indigo-900/10'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse shrink-0" />
          <span>এআই চ্যাটবট चालू করুন</span>
        </button>

        {/* Decorative subtle background mesh */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-indigo-500/15 rounded-full blur-2xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Direct Contacts & Info */}
        <div className="md:col-span-5 space-y-5">
          <h3 className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>সরাসরি যোগাযোগ করুন</h3>

          <div className="space-y-3">
            {/* WhatsApp */}
            <a
              href="https://wa.me/8801635275233"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center space-x-4 p-4 rounded-2xl transition-all border ${
                theme === 'dark'
                  ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-850'
                  : 'bg-white hover:bg-neutral-50 border-neutral-150 hover:border-neutral-350 shadow-4xs'
              }`}
            >
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>হোয়াটসঅ্যাপ সাপোর্ট (WhatsApp)</p>
                <p className={`text-sm font-extrabold ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-800'}`}>+8801635275233</p>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:Khanshakibraj@gmail.com"
              className={`flex items-center space-x-4 p-4 rounded-2xl transition-all border ${
                theme === 'dark'
                  ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-850'
                  : 'bg-white hover:bg-neutral-50 border-neutral-150 hover:border-neutral-350 shadow-4xs'
              }`}
            >
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>ইমেইল করুন (Email Support)</p>
                <p className={`text-sm font-extrabold ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-800'}`}>Khanshakibraj@gmail.com</p>
              </div>
            </a>
          </div>

          <div className={`p-5 rounded-2xl border space-y-3 ${
            theme === 'dark'
              ? 'bg-slate-900/60 border-slate-800/80'
              : 'bg-neutral-50/50 border-neutral-200/60'
          }`}>
            <h4 className={`text-xs font-bold flex items-center space-x-1.5 ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-800'}`}>
              <HelpCircle className="w-4 h-4 text-neutral-500" />
              <span>সাধারণ জিজ্ঞাসা (FAQ)</span>
            </h4>
            <div className={`space-y-2.5 text-xs font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-600'}`}>
              <div className="space-y-0.5">
                <p className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-800'}`}>১. টাকা জমা হতে কত সময় লাগে?</p>
                <p className={`leading-normal ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>MFS অ্যাড মানি সাধারণ অবস্থায় ৫ থেকে ১০ মিনিটের মধ্যে অনুমোদিত হয়।</p>
              </div>
              <div className="space-y-0.5">
                <p className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-800'}`}>২. ড্রাইভ প্যাক সক্রিয় হতে কতক্ষণ লাগে?</p>
                <p className={`leading-normal ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>ড্রাইভ বা রেগুলার প্যাক অর্ডারের পর এডমিন প্যানেল থেকে ৫-১৫ মিনিটে গ্রাহক নম্বরে সাকসেস করা হয়।</p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Ticket System Form */}
        <div className={`md:col-span-7 p-6 rounded-2xl border shadow-3xs space-y-4 ${
          theme === 'dark'
            ? 'bg-slate-900/60 border-slate-800/80 text-slate-100'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}>
          <div className={`space-y-1 border-b pb-3 ${theme === 'dark' ? 'border-slate-850' : 'border-neutral-100'}`}>
            <h3 className={`text-sm font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>সাপোর্ট টিকিট তৈরি করুন (Raise Ticket)</h3>
            <p className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>আপনার অভিযোগ সরাসরি এডমিন প্যানেলে প্রেরিত হবে।</p>
          </div>

          {ticketSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>টিকিট সফলভাবে তৈরি হয়েছে!</p>
                <p className={`text-xs leading-relaxed max-w-sm mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>আমাদের সাপোর্ট টিম টিকিটটি পর্যালোচনা করবে এবং খুব শীঘ্রই আপনার সমস্যা সমাধান করবে। স্ট্যাটাস প্রোফাইল সেকশনে দেখতে পাবেন।</p>
              </div>
              <button
                onClick={() => setTicketSuccess(false)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-600'
                    : 'bg-neutral-950 hover:bg-neutral-900 text-white'
                }`}
              >
                নতুন টিকিট তৈরি করুন
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-700'}`}>টিকিটের বিষয় / ক্যাটাগরি (Subject)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: অ্যাড মানি ব্যালেন্স যোগ হয়নি / ড্রাইভ প্যাক পেন্ডিং"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={`w-full text-xs p-3 border rounded-lg focus:outline-none focus:border-indigo-500 ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-850 text-slate-100 placeholder-slate-700'
                      : 'bg-white border-neutral-250 text-neutral-800 placeholder-neutral-400'
                  }`}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-700'}`}>বিস্তারিত বিবরণ (Description)</label>
                <textarea
                  required
                  rows={4}
                  placeholder="আপনার সমস্যার কথা বিস্তারিত উল্লেখ করুন। বিকাশ নম্বর এবং ট্রানজেকশন আইডি দিলে দ্রুত সমাধান করা সম্ভব।"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`w-full text-xs p-3 border rounded-lg focus:outline-none focus:border-indigo-500 ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-850 text-slate-100 placeholder-slate-700'
                      : 'bg-white border-neutral-250 text-neutral-800 placeholder-neutral-400'
                  }`}
                ></textarea>
              </div>

              {ticketError && (
                <div className="bg-red-500/10 text-red-500 p-2.5 rounded-lg text-xs font-semibold border border-red-500/20 flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{ticketError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={ticketLoading}
                className={`w-full py-3.5 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  ticketLoading 
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' 
                    : theme === 'dark'
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black hover:opacity-95'
                      : 'bg-neutral-950 hover:bg-neutral-900 text-white shadow-xs'
                }`}
              >
                {ticketLoading ? <span>টিকিট পাঠানো হচ্ছে...</span> : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>টিকিট জমা দিন</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* AI CHATBOT MODAL INTERFACE */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-950/45 backdrop-blur-3xs">
          <div className={`w-full sm:max-w-md h-[100dvh] sm:h-[550px] sm:rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-neutral-200'
          }`}>
            
            {/* Chatbot Header */}
            <div className={`p-4 flex items-center justify-between shrink-0 ${
              theme === 'dark' ? 'bg-slate-950 text-slate-100 border-b border-slate-800' : 'bg-neutral-950 text-white'
            }`}>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs animate-pulse">
                  AI
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-none">প্লাটফর্ম এআই অ্যাসিস্ট্যান্ট</h4>
                  <span className={`text-[9px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-300'}`}>Gemini Powered Bangla Chat</span>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
              >
                <XButton />
              </button>
            </div>

            {/* Chatbot Messages List */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
              theme === 'dark' ? 'bg-slate-950/40' : 'bg-neutral-50/50'
            }`}>
              {chatMessages.map((m, idx) => {
                const isBot = m.sender === 'bot';
                return (
                  <div key={idx} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                    <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                      isBot 
                        ? theme === 'dark'
                          ? 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                          : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-none' 
                        : theme === 'dark'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-neutral-900 text-white rounded-tr-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                );
              })}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className={`p-3 rounded-2xl rounded-tl-none text-xs flex items-center space-x-1.5 font-semibold ${
                    theme === 'dark' ? 'bg-slate-900 border border-slate-800 text-slate-400' : 'bg-white border border-neutral-200 text-neutral-500'
                  }`}>
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions */}
            <div className={`px-3 py-2 flex flex-wrap gap-1.5 shrink-0 border-t ${
              theme === 'dark' ? 'bg-slate-950 border-slate-850' : 'bg-neutral-50 border-neutral-100'
            }`}>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendMessage(s.query)}
                  className={`px-2.5 py-1 border text-[10px] font-bold rounded-full cursor-pointer transition-all active:scale-95 whitespace-nowrap shadow-3xs ${
                    theme === 'dark'
                      ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
                      : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Chatbot input bar */}
            <form onSubmit={handleSendChatMessage} className={`p-3 flex items-center space-x-2 shrink-0 border-t ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-neutral-150'
            }`}>
              <input
                type="text"
                placeholder="বাংলায় যেকোনো প্রশ্ন লিখুন..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className={`flex-1 text-xs p-3 border rounded-xl focus:outline-none focus:border-indigo-500 font-medium ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-700'
                    : 'bg-white border-neutral-250 text-neutral-850'
                }`}
              />
              <button
                type="submit"
                className={`p-3 rounded-xl shadow transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950'
                    : 'bg-neutral-950 hover:bg-neutral-900 text-white'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple internal X component
function XButton() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  );
}
