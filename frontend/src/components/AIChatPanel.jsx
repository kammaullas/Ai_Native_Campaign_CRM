import React, { useState, useEffect, useRef } from 'react';
import { aiService, segmentService, campaignService } from '../services/api';
import { Send, Sparkles, Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AIChatPanel({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey there! 👋 I'm your CampaignIQ assistant.\nTell me who you want to reach — I'll find the right audience, draft your message, and launch the campaign. Try something like:\n'Win back At-Risk customers from Bangalore'" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // State to hold conversational context
  const [currentSegment, setCurrentSegment] = useState(null);
  const [draftedMessages, setDraftedMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (role, content, customData = null) => {
    setMessages(prev => [...prev, { role, content, customData }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    addMessage('user', userText);
    setLoading(true);

    try {
      // 1. If we don't have a segment yet, assume user is creating one
      if (!currentSegment) {
        const res = await aiService.parseSegment(userText);
        const segmentData = res.data;
        setCurrentSegment(segmentData);
        
        addMessage('assistant', `I've created a segment based on your description.`, {
          type: 'segment_preview',
          data: segmentData
        });
        
        // Save the segment immediately so we have an ID
        const savedSegment = await segmentService.createSegment(segmentData);
        setCurrentSegment(savedSegment.data);
        
        addMessage('assistant', `Segment saved! Want me to draft a WhatsApp message for this audience? Just tell me the tone (e.g., 'Make it friendly and offer a 10% discount').`);
      } 
      // 2. If we have a segment but no drafted messages, draft messages
      else if (currentSegment && draftedMessages.length === 0) {
        const res = await aiService.draftMessage(currentSegment.description, 'WHATSAPP', userText);
        const msgs = res.data.messages;
        setDraftedMessages(msgs);
        
        addMessage('assistant', `Here are 3 options for your WhatsApp campaign. Which one would you like to use?`, {
          type: 'message_options',
          data: msgs
        });
      }
      // 3. If we have messages, assume user is picking an option to launch
      else if (draftedMessages.length > 0) {
        // Quick hack: see if they typed 1, 2, or 3
        const optionMatch = userText.match(/[123]/);
        if (optionMatch) {
          const index = parseInt(optionMatch[0]) - 1;
          const chosenMsg = draftedMessages[index];
          
          addMessage('assistant', `Great! Launching the campaign now...`);
          
          const campaignPayload = {
            name: `${currentSegment.name} Campaign`,
            segmentId: currentSegment._id,
            message: chosenMsg,
            channel: 'WHATSAPP'
          };
          
          const launchRes = await campaignService.launchCampaign(campaignPayload);
          
          addMessage('assistant', `Campaign Launched! 🚀`, {
            type: 'campaign_launched',
            data: launchRes.data
          });
          
          // Reset state for next interaction
          setCurrentSegment(null);
          setDraftedMessages([]);
        } else {
          addMessage('assistant', `Please select option 1, 2, or 3.`);
        }
      }
    } catch (error) {
      console.error(error);
      addMessage('assistant', `Oops, AI is taking a break — try again in a moment. (${error.message})`);
    } finally {
      setLoading(false);
    }
  };

  const renderCustomData = (msg) => {
    if (!msg.customData) return null;
    
    const { type, data } = msg.customData;
    
    if (type === 'segment_preview') {
      return (
        <div className="mt-3 bg-slate-900 border border-indigo-500/30 rounded-lg p-3 text-sm">
          <div className="font-bold text-white mb-1">{data.name}</div>
          <div className="text-slate-400 mb-2">{data.description}</div>
          <div className="flex items-center gap-2 text-indigo-400 font-medium">
            <Users size={14} /> {data.audienceSize.toLocaleString()} audience size
          </div>
        </div>
      );
    }
    
    if (type === 'message_options') {
      return (
        <div className="mt-3 space-y-2">
          {data.map((opt, i) => (
            <div key={i} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm cursor-pointer hover:border-indigo-500 transition-colors">
              <span className="text-indigo-400 font-bold mb-1 block">Option {i + 1}</span>
              <span className="text-slate-300">{opt}</span>
            </div>
          ))}
        </div>
      );
    }

    if (type === 'campaign_launched') {
      return (
        <div className="mt-3">
          <button 
            onClick={() => {
              onClose();
              navigate(`/campaigns/${data._id}`);
            }}
            className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
          >
            View Live Report
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        {messages.map((msg, idx) => (
          <React.Fragment key={idx}>
          <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-800 text-slate-200 border border-slate-700'
            }`}>
              {msg.role === 'assistant' && (
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
              )}
              {msg.role === 'user' && (
                <div className="text-sm">
                  {msg.content}
                </div>
              )}
              {renderCustomData(msg)}
            </div>
          </div>
          {idx === 0 && msg.role === 'assistant' && (
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                "Find At-Risk customers who haven't ordered in 60 days",
                "Show me loyal customers from Mumbai",
                "Target one-timers with a win-back offer"
              ].map((chipText, i) => (
                <button
                  key={i}
                  onClick={() => setInput(chipText)}
                  className="rounded-full border border-indigo-500/40 text-indigo-300 text-xs px-3 py-1.5 hover:bg-indigo-500/10 transition-colors text-left"
                >
                  {chipText}
                </button>
              ))}
            </div>
          )}
          </React.Fragment>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-400 border border-slate-700 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} /> Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-500"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
