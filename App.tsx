import React, { useState, useEffect, useRef } from 'react';
import StarBackground from './components/StarBackground';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 1. 类型定义 ---
export interface CalibrationResult {
  frequencyScan: string;
  illusionStripping: string;
  fiveSteps: string[];
  actionAnchor: string;
  recommendedBookTitle: string;
  recommendedMusicTitle: string;
}

// --- 2. 静态数据（确保模型只能从这里选） ---
const BOOKS_DATA = [
  { title: "《你值得过更好的生活》", author: "罗伯特·谢费尔德", desc: "拆解全息幻象的进阶指南" },
  { title: "《金钱的灵魂》", author: "林恩·特威斯特", desc: "重新定义丰盛与流动的本质" },
  { title: "《当下的力量》", author: "埃克哈特·托利", desc: "进入意识现场的必经之路" },
  { title: "《瓦解控制》", author: "克拉克·斯特兰德", desc: "放弃小我控制，回归自然源头" },
  { title: "《信念的力量》", author: "布鲁斯·利普顿", desc: "量子生物学视角下的意识改写" },
  { title: "《零极限》", author: "修·蓝博士", desc: "清理潜意识记忆的实操手册" },
  { title: "《终极自由之路》", author: "莱斯特·利文森", desc: "关于释放与收回力量的终极教导" },
  { title: "《显化的真义》", author: "尼维尔·高达德", desc: "意识即实相的古典量子观" }
];

const MUSIC_DATA = [
  { title: "Deep Space 432Hz - Abundance", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", type: "谐振频率" },
  { title: "Quantum Field Meditation", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", type: "场域扩张" },
  { title: "Solfeggio 528Hz & 432Hz Mix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", type: "修复与显化" },
  { title: "Alpha Wave Focus", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", type: "深度专注" },
  { title: "Healing Resonance 432Hz", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", type: "细胞修复" },
  { title: "Higher Self Connection", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", type: "意识链接" },
  { title: "Pineal Gland Activation", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", type: "觉知开启" },
  { title: "Universal Harmony", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", type: "万物共振" }
];

const PRESET_CONCERNS = [
  "金钱似乎总是指间沙，无论如何努力都填不满内心深处的匮乏深渊...",
  "在职场表演中耗尽了最后一丝生命力，却依然对未知的评价感到深深恐惧...",
  "试图在亲密关系中寻找救赎，却发现只是在对方的镜子里重复旧有的伤痛...",
  "感觉自己被囚禁在社会的矩阵剧本里，渴望收回主权却找不到出口..."
];

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 音乐与弹窗控制
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [isDepotOpen, setIsDepotOpen] = useState(false);
  const [depotPlayingTitle, setDepotPlayingTitle] = useState<string | null>(null);
  
  const bgmRef = useRef<HTMLAudioElement>(null);
  const depotAudioRef = useRef<HTMLAudioElement>(null);
  const BGM_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3";

  // 打字机占位符逻辑
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [currentConcernIndex, setCurrentConcernIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (bgmRef.current) {
      isBgmPlaying ? bgmRef.current.play().catch(() => setIsBgmPlaying(false)) : bgmRef.current.pause();
    }
  }, [isBgmPlaying]);

  useEffect(() => {
    if (result || loading) return;
    const currentFullText = PRESET_CONCERNS[currentConcernIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting && charIndex < currentFullText.length) {
        setDisplayedPlaceholder(currentFullText.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
      } else if (!isDeleting && charIndex === currentFullText.length) {
        setTimeout(() => setIsDeleting(true), 3000);
      } else if (isDeleting && charIndex > 0) {
        setDisplayedPlaceholder(currentFullText.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
      } else {
        setIsDeleting(false);
        setCharIndex(0);
        setCurrentConcernIndex((prev) => (prev + 1) % PRESET_CONCERNS.length);
      }
    }, isDeleting ? 30 : 100);
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, currentConcernIndex, result, loading]);

  const handleCalibrate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setIsBgmPlaying(true);

    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `你是一位精通意识法则的大师。请针对用户的困扰进行频率校准。
      用户困扰："${input}"
      
      请必须从以下列表中选出一本书名（严格匹配）：${BOOKS_DATA.map(b => b.title).join(',')}
      请必须从以下列表中选出一个音乐名（严格匹配）：${MUSIC_DATA.map(m => m.title).join(',')}

      返回 JSON：
      {
        "frequencyScan": "对用户当前振动频率的解析",
        "illusionStripping": "剥离这件事表象后的实相",
        "fiveSteps": ["步骤1", "步骤2", "步骤3", "步骤4", "步骤5"],
        "actionAnchor": "物理世界的一个校准动作",
        "recommendedBookTitle": "书名",
        "recommendedMusicTitle": "音乐名"
      }`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const cleanText = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanText) as CalibrationResult;

      setResult(data);
      setInput('');
    } catch (err: any) {
      setError("频率接入失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleMusicToggle = (track: typeof MUSIC_DATA[0]) => {
    if (depotPlayingTitle === track.title) {
      depotAudioRef.current?.pause();
      setDepotPlayingTitle(null);
    } else {
      if (depotAudioRef.current) {
        depotAudioRef.current.src = track.url;
        depotAudioRef.current.play();
        setDepotPlayingTitle(track.title);
        setIsBgmPlaying(false);
      }
    }
  };

  // 增强匹配算法：忽略书名的《》括号进行模糊匹配
  const findBook = (title: string) => {
    const cleanTitle = title.replace(/《|》/g, '');
    return BOOKS_DATA.find(b => b.title.includes(cleanTitle) || cleanTitle.includes(b.title.replace(/《|》/g, ''))) || BOOKS_DATA[0];
  };

  const findMusic = (title: string) => {
    return MUSIC_DATA.find(m => m.title === title || title.includes(m.title)) || MUSIC_DATA[0];
  };

  const matchedBook = result ? findBook(result.recommendedBookTitle) : null;
  const matchedMusic = result ? findMusic(result.recommendedMusicTitle) : null;

  return (
    <div className="relative min-h-screen flex flex-col z-10 font-light text-white overflow-hidden">
      <StarBackground />
      <audio ref={bgmRef} src={BGM_URL} loop />
      <audio ref={depotAudioRef} onEnded={() => setDepotPlayingTitle(null)} />

      {/* 顶部控制栏 */}
      <button 
        onClick={() => { setIsBgmPlaying(!isBgmPlaying); setDepotPlayingTitle(null); depotAudioRef.current?.pause(); }}
        className="fixed top-6 right-6 z-50 p-4 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 opacity-60 hover:opacity-100 transition-all"
      >
        <div className="text-cyan-400 w-6 h-6">
          {isBgmPlaying || depotPlayingTitle ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" /></svg>
          )}
        </div>
      </button>

      <div className="flex-grow flex flex-col items-center justify-center py-10 px-6 w-full max-w-5xl mx-auto">
        <header className="text-center mb-10 animate-fadeIn">
          <h1 className="text-3xl md:text-5xl font-extralight tracking-[0.2em] gradient-text mb-4 uppercase">频率校准之镜</h1>
          <p className="text-cyan-200/80 text-[10px] md:text-xs tracking-[0.4em] uppercase">QUANTUM MIRROR • 剥离幻象 • 收回力量</p>
        </header>

        <main className="w-full">
          <div className="glass-panel rounded-[2.5rem] p-6 md:p-14 min-h-[520px] flex flex-col justify-center relative shadow-2xl overflow-hidden">
            
            {!result && !loading && (
              <div className="space-y-10 animate-fadeIn">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={displayedPlaceholder}
                  className="w-full h-56 bg-black/40 backdrop-blur-3xl border border-cyan-400/40 rounded-[2.5rem] p-12 text-white text-center text-xl md:text-2xl focus:outline-none transition-all resize-none shadow-2xl"
                />
                <button
                  onClick={handleCalibrate}
                  disabled={!input.trim()}
                  className="w-full py-6 rounded-2xl font-bold text-lg tracking-[0.5em] bg-gradient-to-r from-cyan-500/80 to-purple-600/80 text-white hover:scale-[1.01] transition-all"
                >
                  收回力量
                </button>
                {error && <p className="text-red-400 text-center text-sm">{error}</p>}
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-10">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 border border-cyan-500/10 rounded-full scale-150 animate-pulse"></div>
                  <div className="absolute inset-0 border-[3px] border-cyan-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-[3px] border-t-white rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
                     <svg className="w-12 h-12 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" /></svg>
                  </div>
                </div>
                <p className="tracking-[0.5em] text-cyan-200 uppercase animate-pulse">正在剥离全息投影...</p>
              </div>
            )}

            {result && (
              <div className="animate-fadeIn space-y-10 py-4 overflow-y-auto max-h-[70vh] no-scrollbar px-2">
                <section className="border-l-2 border-cyan-400/80 pl-8">
                  <h3 className="text-cyan-400 text-[10px] font-bold tracking-[0.3em] uppercase">【频率扫描】</h3>
                  <p className="text-2xl font-light mt-2 leading-snug">{result.frequencyScan}</p>
                </section>

                <section className="border-l-2 border-purple-400/80 pl-8">
                  <h3 className="text-purple-400 text-[10px] font-bold tracking-[0.3em] uppercase">【幻象剥离】</h3>
                  <p className="text-lg italic opacity-90 mt-2 leading-relaxed">{result.illusionStripping}</p>
                </section>

                {/* 推荐补给区 */}
                <div className="pt-10 border-t border-white/10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white/30 text-[10px] font-bold tracking-[0.5em] uppercase">校准补给</h3>
                    <button onClick={() => setIsDepotOpen(true)} className="text-cyan-400/60 hover:text-cyan-400 text-[10px] tracking-widest uppercase transition-all">
                      量子资源库 (查看更多) →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition-all">
                      <h4 className="text-pink-300 text-[9px] uppercase tracking-widest mb-2 font-bold">意识指引</h4>
                      <p className="text-lg">{matchedBook?.title}</p>
                      <p className="text-[10px] opacity-40 italic">{matchedBook?.author}</p>
                    </div>
                    <div 
                      onClick={() => matchedMusic && handleMusicToggle(matchedMusic)}
                      className="bg-white/5 p-6 rounded-3xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all flex justify-between items-center group"
                    >
                      <div>
                        <h4 className="text-cyan-300 text-[9px] uppercase tracking-widest mb-2 font-bold">频率共鸣</h4>
                        <p className="text-lg">{matchedMusic?.title}</p>
                        <p className="text-[10px] opacity-40 uppercase">{matchedMusic?.type}</p>
                      </div>
                      <div className="text-cyan-400">
                        {depotPlayingTitle === matchedMusic?.title ? (
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                        ) : (
                          <svg className="w-8 h-8 opacity-20 group-hover:opacity-100" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={() => setResult(null)} className="w-full text-center text-white/20 text-[10px] tracking-[1em] py-10 uppercase hover:text-white transition-all">
                  — 返回虚空 —
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 量子资源库 (弹出层) */}
      {isDepotOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-fadeIn">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={() => setIsDepotOpen(false)} />
          <div className="relative w-full max-w-5xl max-h-[85vh] bg-white/[0.02] border border-white/10 rounded-[3rem] p-8 md:p-16 overflow-y-auto no-scrollbar shadow-2xl">
            <div className="flex justify-between items-center mb-16">
              <div>
                <h2 className="text-3xl font-extralight tracking-[0.4em] uppercase">量子资源库</h2>
                <p className="text-cyan-400/40 text-[10px] tracking-widest mt-2 uppercase">Manual Frequency Selection</p>
              </div>
              <button onClick={() => setIsDepotOpen(false)} className="text-white/20 hover:text-white text-4xl font-thin transition-colors">×</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* 书籍列 */}
              <section className="space-y-8">
                <h3 className="text-pink-300 text-[10px] font-bold tracking-[0.5em] uppercase border-b border-pink-500/20 pb-4">意识典籍 DEPOT</h3>
                <div className="grid grid-cols-1 gap-4">
                  {BOOKS_DATA.map((book, i) => (
                    <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-pink-500/10 transition-all group">
                      <p className="text-xl font-light group-hover:text-pink-200 transition-colors">{book.title}</p>
                      <p className="text-[10px] text-white/30 mb-3 uppercase tracking-widest">{book.author}</p>
                      <p className="text-xs text-white/50 leading-relaxed font-light">{book.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 音乐列 */}
              <section className="space-y-8">
                <h3 className="text-cyan-300 text-[10px] font-bold tracking-[0.5em] uppercase border-b border-cyan-500/20 pb-4">场域频率 DEPOT</h3>
                <div className="grid grid-cols-1 gap-4">
                  {MUSIC_DATA.map((music, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleMusicToggle(music)}
                      className={`p-6 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${depotPlayingTitle === music.title ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-white/5 border-white/5 hover:bg-cyan-500/10'}`}
                    >
                      <div>
                        <p className="text-xl font-light">{music.title}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">{music.type}</p>
                      </div>
                      <div className="text-cyan-400">
                        {depotPlayingTitle === music.title ? (
                           <svg className="w-8 h-8 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        ) : (
                          <svg className="w-8 h-8 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      <footer className="py-10 text-[10px] text-white/10 tracking-[1em] text-center uppercase">
        © Mirror Logic • Quantum Consciousness
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};

export default App;
