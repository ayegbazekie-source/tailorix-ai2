import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Scissors, CornerDownLeft, RefreshCw, BookOpen, Lightbulb, Check, Copy } from 'lucide-react';

const KNOWLEDGE_BASE = {
  dart: {
    keywords: ['dart', 'french', 'pivot', 'apex', 'bust', 'manipulation', 'slash'],
    response: `### Master Tailor Guide: Dart Manipulation & French Dart Rotation
1. **Identify the Apex:** Mark the bust apex accurately on the front bodice sloper. The dart tip should typically finish 1/2" to 3/4" back from the true apex point to prevent puckering.
2. **The Slash & Spread Method:**
   - Draw a line from the side seam (approximately 2 inches above the waistline aiming toward the apex) for a classic French dart.
   - Slash along this new guideline up to the apex (leaving a 1mm hinge).
   - Close the original waist dart or shoulder dart by pivoting the paper pattern until the edges meet.
   - The slash line will naturally spread open to the exact volume needed.
3. **True the Seam:** Redraw the dart legs to equal length and fold the dart downward before cutting the side seam allowance to create the proper seam jog extension.`,
  },
  swayback: {
    keywords: ['sway', 'swayback', 'trouser', 'pants', 'crotch', 'waistband', 'pooling'],
    response: `### Master Tailor Guide: Swayback Posture Adjustment in Trousers
1. **Symptom:** Excess horizontal folds pooling just beneath the back waistband above the seat line.
2. **Correction on the Back Pattern Piece:**
   - Draw a horizontal slash line across the back panel approximately 3 inches below the waist edge, terminating at the side seam.
   - Overlap the slash line at the center-back seam by 1/2" to 3/4" (depending on the depth of the hollow curve), while keeping the side seam as a pivot hinge (0" change at side).
   - Drop the center back waist point slightly and re-curve the back waist seam to preserve the original waist measurement.
3. **Crotch Curve Check:** Slightly scoop the back crotch line by 1/8" to 1/4" to ensure smooth drape against the inward pelvic tilt without gripping.`,
  },
  ease: {
    keywords: ['ease', 'allowance', 'coat', 'wool', 'overcoat', 'shirt', 'jacket', 'lining'],
    response: `### Standard Master Tailor Ease Allowances (Chest Circumference)
- **Fitted Dress Shirt:** +2.5" to +3.5" (6cm to 9cm) total ease over bare chest.
- **Classic Dress Shirt:** +4.0" to +5.0" (10cm to 13cm) total ease.
- **Tailored Suit Jacket / Blazer:** +4.5" to +5.5" (11cm to 14cm) over bare chest to accommodate shirt and canvas interlining.
- **Winter Wool Overcoat:** +7.0" to +9.0" (18cm to 23cm) over bare chest to fit comfortably over a suit jacket, waistcoat, and heavy knitwear.
- **Bicep Sleeve Ease:** Minimum +2.0" (5cm) for woven shirts, +3.5" (9cm) for tailored jacket sleeves.`,
  },
  sleeve: {
    keywords: ['sleeve', 'two-piece', 'pitch', 'crown', 'cap', 'armhole', 'jacket sleeve'],
    response: `### Drafting a 2-Piece Tailored Jacket Sleeve
1. **Pitch Marks & Balance:** Align the front sleeve pitch mark exactly 1/2" above the front armhole notch. The back sleeve pitch mark sits at the lower third of the back armscye.
2. **Sleeve Head Ease:** A wool tailored sleeve cap requires 1.25" to 1.75" (3.2cm to 4.5cm) of ease distributed across the upper crown to shrink into shape using a tailored sleeve roll and wool wadding.
3. **Under-Sleeve Inseam:** Pitch the under-sleeve 1/4" forward to match natural arm resting posture at a 15-degree elbow forward bend.`,
  },
  seam: {
    keywords: ['seam', 'chiffon', 'silk', 'finish', 'denim', 'flat-fell', 'french seam'],
    response: `### Master Recommendations for Seam Finishes:
- **Silk Chiffon & Georgette:** Use an ultra-fine 3mm (1/8") French seam sewn with a #65/9 microtex needle and 60wt extra-fine silk or polyester thread.
- **Raw Denim (12oz-16oz):** Double-needle 1/2" flat-felled seam with contrast 30wt topstitching thread and chainstitch looper for authentic durability.
- **Tailored Woolens:** Open pressed seam with hand-catchstitched or Hong Kong bias-bound edges in silk organza.`,
  },
};

const SUGGESTIONS = [
  'How do I manipulate a bust dart into a French dart?',
  'How do I correct for a swayback posture in trousers?',
  'What ease allowances are needed for a tailored overcoat vs shirt?',
  'How do I draft a two-piece jacket sleeve and pitch marks?',
  'What seam finish is best for lightweight silk chiffon?',
];

export default function MasterTailorPage() {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Welcome to the Master Tailor atelier. I have over 30 years of bespoke tailoring, Savile Row pattern cutting, and bespoke fitting experience. 

Ask me any technical question regarding:
- Dart rotation & manipulation formulas
- Bespoke fitting corrections (swayback, high shoulder, round back)
- Ease allowances for outerwear, shirts, and denim
- Seam engineering and industrial tailoring finishes`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let matchedResponse = null;

      for (const key in KNOWLEDGE_BASE) {
        const item = KNOWLEDGE_BASE[key];
        if (item.keywords.some((kw) => lower.includes(kw))) {
          matchedResponse = item.response;
          break;
        }
      }

      if (!matchedResponse) {
        matchedResponse = `### Master Tailor Assessment:
Regarding "${query}":
1. **Fundamental Rule:** In bespoke pattern construction, balance lines (bust level, waist level, hip level) must always remain perpendicular to the lengthwise grainline of the fabric.
2. **Drafting Action:** True the seam intersections at 90-degree right angles for at least 1/2" from every seam edge before blending curves.
3. **Fitting Recommendation:** Always test high-risk adjustments in cotton muslin (toile) before laying shears to final fashion fabric. Keep seam allowances at 1" (2.5cm) on side seams for bespoke fitting leeway.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: matchedResponse,
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-64px)] font-mono">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              30-Year Master Tailor Technical Assistant
              <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-normal">
                Active Atelier
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Technical pattern drafting algorithms, dart engineering, fitting corrections, and garment metrics.
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'init-1',
                sender: 'assistant',
                text: 'Atelier notes refreshed. How may I assist your pattern drafting today?',
              },
            ])
          }
          className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-amber-400 transition-all text-xs flex items-center gap-1"
          title="Clear Conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Suggested Chips */}
      <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 flex items-center gap-1 shrink-0 text-[11px]">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Fast Queries:
        </span>
        {SUGGESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="shrink-0 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] transition-all"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant && (
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-1">
                  <Scissors className="w-4 h-4 rotate-90" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed border relative group ${
                  isAssistant
                    ? 'bg-slate-950/90 border-slate-800 text-slate-200 shadow-md'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-100 shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {isAssistant && (
                  <button
                    onClick={() => copyToClipboard(msg.text, msg.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-900 border border-slate-700 rounded-md text-slate-400 hover:text-amber-400"
                    title="Copy Answer"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-amber-400 animate-pulse bg-slate-950 border border-slate-800 w-fit px-3 py-1.5 rounded-xl">
            <Scissors className="w-3.5 h-3.5 animate-spin" />
            <span>Consulting Savile Row drafting records...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-3 flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a technical pattern drafting, dart manipulation, or fitting question..."
          className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
        >
          <span>Consult</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
