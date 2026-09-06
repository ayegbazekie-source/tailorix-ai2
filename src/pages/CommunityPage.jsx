import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Heart, Share2, Download, Filter, Scissors, Sparkles, MessageSquare, ExternalLink } from 'lucide-react';

const COMMUNITY_PATTERNS = [
  {
    id: 'cp-1',
    author: 'Elena Rossi',
    atelier: 'Milano Bespoke',
    title: 'High-Waisted Pleated Hollywood Trousers',
    category: 'Trouser',
    likes: 142,
    piecesCount: 4,
    description: 'Double reverse forward pleats with extended waistband tab and 2-inch turn-up cuffs. Sloper drafted with 0.5" ease.',
    tags: ['Pleats', 'Hollywood Waist', 'Bespoke'],
    svgPreview: 'M 40 20 L 160 20 L 170 120 L 130 320 L 70 320 L 30 120 Z',
  },
  {
    id: 'cp-2',
    author: 'Kenji Takahashi',
    atelier: 'Tokyo Denim Lab',
    title: 'Selvedge Type-II Denim Trucker Jacket',
    category: 'Jacket',
    likes: 219,
    piecesCount: 6,
    description: 'Boxy fit with dual knife front pleats, box chest pockets, and waist adjuster tabs engineered for 14oz raw selvedge.',
    tags: ['Denim', 'Trucker', 'Raw Workwear'],
    svgPreview: 'M 30 30 L 170 30 L 180 180 L 150 280 L 50 280 L 20 180 Z',
  },
  {
    id: 'cp-3',
    author: 'Claire Dupont',
    atelier: 'Paris Haute Couture',
    title: 'Bias-Cut Slip Gown with French Darts',
    category: 'Gown',
    likes: 188,
    piecesCount: 3,
    description: 'Graceful 45-degree true bias drape with lowered cowl neckline and delicate French waist darts.',
    tags: ['Bias Cut', 'Silk', 'Eveningwear'],
    svgPreview: 'M 50 20 L 150 20 L 140 100 L 180 340 L 20 340 L 60 100 Z',
  },
  {
    id: 'cp-4',
    author: 'Arthur Pendelton',
    atelier: 'Savile Row Guild',
    title: 'Spread Collar Bespoke Oxford Shirt',
    category: 'Shirt',
    likes: 95,
    piecesCount: 5,
    description: 'Split yoke back with 1/2" forward shoulder slope and dual pleated barrel cuffs.',
    tags: ['Split Yoke', 'Oxford', 'Savile Row'],
    svgPreview: 'M 50 30 L 150 30 L 160 150 L 150 290 L 50 290 L 40 150 Z',
  },
];

export default function CommunityPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [patterns, setPatterns] = useState(COMMUNITY_PATTERNS);
  const [likedMap, setLikedMap] = useState({});

  const categories = ['All', 'Trouser', 'Jacket', 'Gown', 'Shirt'];

  const filteredPatterns =
    selectedCategory === 'All'
      ? patterns
      : patterns.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());

  const toggleLike = (id) => {
    setLikedMap((prev) => {
      const isLiked = !prev[id];
      setPatterns((current) =>
        current.map((p) => (p.id === id ? { ...p, likes: p.likes + (isLiked ? 1 : -1) } : p))
      );
      return { ...prev, [id]: isLiked };
    });
  };

  const loadIntoWorkbench = (pattern) => {
    // Navigate directly to the CAD workbench
    navigate('/deconstruct');
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto font-mono text-slate-100">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Tailors Guild & Community Showcase
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Discover community pattern blocks, verified sloper cuts, and remix vector drafts in the workbench.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPatterns.map((pattern) => {
          const isLiked = likedMap[pattern.id];
          return (
            <div
              key={pattern.id}
              className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div>
                {/* Author Bar */}
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[10px]">
                      {pattern.author.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-200 block">{pattern.author}</span>
                      <span className="text-[10px] text-slate-400">{pattern.atelier}</span>
                    </div>
                  </div>

                  <span className="text-[10px] bg-slate-950 border border-slate-800 text-amber-400 px-2 py-0.5 rounded-md">
                    {pattern.category}
                  </span>
                </div>

                {/* SVG Mini Preview Thumbnail */}
                <div className="w-full h-36 bg-[#070b14] rounded-xl border border-slate-800/80 mb-3 flex items-center justify-center p-2 relative overflow-hidden">
                  <svg viewBox="0 0 200 360" className="h-full stroke-amber-400 fill-amber-500/5 stroke-2">
                    <path d={pattern.svgPreview} strokeDasharray="3,2" />
                  </svg>
                  <div className="absolute bottom-2 right-2 text-[10px] bg-slate-900/90 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800">
                    {pattern.piecesCount} Pattern Panels
                  </div>
                </div>

                <h3 className="font-bold text-sm text-white mb-1 group-hover:text-amber-400 transition-colors">
                  {pattern.title}
                </h3>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  {pattern.description}
                </p>

                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  {pattern.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
                <button
                  onClick={() => toggleLike(pattern.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
                    isLiked
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-rose-400'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400' : ''}`} />
                  <span>{pattern.likes}</span>
                </button>

                <button
                  onClick={() => loadIntoWorkbench(pattern)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20"
                >
                  <Scissors className="w-3.5 h-3.5 rotate-90" />
                  <span>Remix in CAD</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
