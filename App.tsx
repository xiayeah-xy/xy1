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

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  result: CalibrationResult;
}

// --- 2. 静态数据 ---
const PRESET_CONCERNS = [
  "金钱似乎总是指间沙，无论如何努力都填不满内心深处的匮乏深渊...",
  "在职场表演中耗尽了最后一丝生命力，却依然对未知的评价感到深深恐惧...",
  "试图在亲密关系中寻找救赎，却发现只是在对方的镜子里重复旧有的伤痛...",
  "当生活变成了一场无止境的追逐，我开始怀疑这一切繁荣背后的终极意义...",
  "无法停止对未来可能发生的‘最坏情况’进行灾难化预演，灵魂无法安放...",
  "感觉自己被囚禁在社会的矩阵剧本里，渴望收回主权却找不到出口..."
];

const BOOKS_DATA = [
  { title: "《你值得过更好的生活》", author: "罗伯特·谢费尔德", desc: "核心架构：拆解全息幻象" },
  { title: "《金钱的灵魂》", author: "林恩·特威斯特", desc: "重新定义丰盛与金钱的关系" },
  { title: "《当下的力量》", author: "埃克哈特·托利", desc: "进入意识现场的必经之路" },
  { title: "《瓦解控制》", author: "克拉克·斯特兰德", desc: "放弃小我控制，回归源头" },
  { title: "《信念的力量》", author: "布鲁斯·利普顿", desc: "量子生物学视角下的意识改写" },
  { title: "《零极限》", author: "修·蓝博士", desc: "清理潜意识记忆的实操指南" },
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
  { title: "Universal Harmony", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", type: "万物共振" },
  { title: "Eternal Silence", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", type: "宁静本源" },
  { title: "Soul Blueprint Alignment", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", type: "灵魂重塑" }
];

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const bgmRef = useRef<HTMLAudioElement>(null);
  const [depotPlayingTitle, setDepotPlayingTitle] = useState<string | null>(null);
  const depotAudioRef = useRef<HTMLAudioElement>(null);
  const BGM_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3";

  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [currentConcernIndex, setCurrentConcernIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const playAudio = async () => {
      if (bgmRef.current && isBgmPlaying) {
        try {
          await bgmRef.current.play();
        } catch (e) {
          console.warn("Autoplay blocked, waiting for interaction");
          setIsBgmPlaying(false);
        }
      } else if (bgmRef.current) {
        bgmRef.current.pause();
      }
    };
    playAudio();
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
    
    if (!isBgmPlaying && !depotPlayingTitle) {
      setIsBgmPlaying(true);
    }

    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      if (!API_KEY) throw new Error("API Key 未配置，请在 Vercel 环境变量中设置 VITE_GEMINI_API_KEY");

      const genAI = new GoogleGenerativeAI(API_KEY);
      // 使用最新的 gemini-3.0-flash 模型
      const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash" });

      const prompt = `你是一位精通意识法则的大师。请针对用户的困扰进行频率校准，并严格返回 JSON 格式。
      困扰内容："${input}"
      
      要求：
      1. frequencyScan: 一句对当前频率状态的深度洞察。
      2. illusionStripping: 揭示该困扰背后的全息幻象本质。
      3. fiveSteps: 给出具体的收回力量的五个步骤。
      4. actionAnchor: 一个当下可以执行的物理动作锚点。
      5. recommendedBookTitle: 推荐一本书（必须从提供的列表标题中选择）。
      6. recommendedMusicTitle: 推荐一个音乐标题（必须从提供的列表标题中选择）。

      请直接返回 JSON 内容，不要包含 markdown 代码块。`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const cleanText = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanText) as CalibrationResult;

      setResult(data);
      setHistory(prev => [{ id: Date.now().toString(), timestamp: Date.now(), input: input, result: data }, ...prev].slice(0, 10));
      setInput('');
    } catch (err: any) {
      console.error("API Error:", err);
      setError("量子核心接入失败：" + (err.message || "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  const handleDepotMusicPlay = (track: typeof MUSIC_DATA[0]) => {
    if (depotPlayingTitle === track.title) {
      depotAudioRef.current?.pause();
      setDepotPlayingTitle(null);
    } else {
      if (depotAudioRef.current) {
        depotAudioRef.current.src = track.url;
        depotAudioRef.current.play().catch(e => console.error("Play error:", e));
        setDepotPlayingTitle(track.title);
        setIsBgmPlaying(false);
      }
    }
  };

  const matchedBook = result ? BOOKS_DATA.find(b => b.title.includes(result.recommendedBookTitle) || result.recommendedBookTitle.includes(b.title)) || BOOKS_DATA[0] : null;
  const matchedMusic = result ? MUSIC_DATA.find(m => m.title.includes(result.recommendedMusicTitle) || result.recommendedMusicTitle.includes(m.title)) || MUSIC_DATA[0] : null;

  return (
    <div className="relative min-h-screen flex flex-col z-10 font-light selection:bg-cyan-500/30 text-white">
      <StarBackground />
      <audio ref={bgmRef} src={BGM_URL} loop />
      <audio ref={depotAudioRef} onEnded={() => setDepotPlayingTitle(null)} />

      {/* 音乐图标 - SVG 实现 */}
      <button 
        onClick={() => {
          setIsBgmPlaying(!isBgmPlaying);
          if (depotAudioRef.current) {
            depotAudioRef.current.pause();
            setDepotPlayingTitle(null);
          }
        }}
        className="fixed top-6 right-6 z-50 p-4 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 opacity-60 hover:opacity-100 hover:scale-110 transition-all duration-500 shadow-2xl"
      >
        <div className="text-cyan-400 w-6 h-6">
          {isBgmPlaying ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" /></svg>
          )}
        </div>
      </button>

      <div className="flex-grow flex flex-col items-center justify-center py-10 px-6 w-full max-w-5xl mx-auto">
        <div className="w-full flex flex-col items-center">
          <header className="text-center mb-10 relative w-full animate-fadeIn">
            <h1 className="text-3xl md:text-5xl font-extralight tracking-[0.2em] gradient-text mb-4 drop-shadow-2xl">
              频率校准之镜
            </h1>
            <p className="text-cyan-200/80 font-medium text-xs md:text-sm tracking-[0.4em] uppercase opacity-90">
              QUANTUM MIRROR • 剥离幻象 • 收回力量
            </p>
            <div className="mt-6 mx-auto w-32 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
          </header>

          <main className="w-full">
            <div className="glass-panel rounded-[2.5rem] p-6 md:p-14 transition-all duration-700 hover:shadow-[0_0_80px_rgba(128,222,234,0.15)] min-h-[480px] flex flex-col justify-center relative overflow-hidden shadow-2xl">
              
              {!result && !loading && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={displayedPlaceholder}
                      className="relative w-full h-56 bg-black/40 backdrop-blur-3xl border border-cyan-400/40 rounded-[2.5rem] p-12 text-white text-center placeholder-cyan-100/20 text-xl md:text-2xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-300/20 transition-all resize-none shadow-2xl leading-relaxed"
                    />
                    <div className="absolute bottom-4 right-8 text-[10px] text-cyan-400/30 tracking-[0.3em] uppercase font-bold">Quantum Detection Active</div>
                  </div>
                  <button
                    onClick={handleCalibrate}
                    disabled={!input.trim() || loading}
                    className={`w-full py-6 rounded-2xl font-bold text-lg tracking-[0.5em] transition-all duration-700 transform uppercase
                      ${input.trim() ? 'bg-gradient-to-r from-cyan-500/80 via-blue-500/80 to-purple-600/80 text-white hover:scale-[1.01] hover:shadow-[0_20px_40px_rgba(128,222,234,0.3)] active:scale-95' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'}`}
                  >
                    收回力量
                  </button>
                  {error && (
                    <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-2xl animate-shake">
                      <p className="text-red-300 text-center text-sm font-medium">{error}</p>
                    </div>
                  )}
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
                  <div className="text-center space-y-4">
                    <p className="text-white text-xl font-light tracking-[0.6em] uppercase animate-pulse">解析全息图景</p>
                    <p className="text-white/40 text-xs tracking-widest uppercase italic">正在剥离频率投影，请保持深呼吸...</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="animate-fadeIn space-y-12 py-4 overflow-y-auto max-h-[75vh] no-scrollbar pr-2">
                  <section className="space-y-4 border-l-2 border-cyan-400/80 pl-8 py-1">
                    <h3 className="text-cyan-400 text-[10px] font-bold tracking-[0.3em] uppercase">【频率扫描】</h3>
                    <p className="text-2xl text-white font-light leading-tight">{result.frequencyScan}</p>
                  </section>

                  <section className="space-y-4 border-l-2 border-purple-400/80 pl-8 py-1">
                    <h3 className="text-purple-400 text-[10px] font-bold tracking-[0.3em] uppercase">【幻象剥离】</h3>
                    <p className="text-white text-lg font-light leading-relaxed italic opacity-90">{result.illusionStripping}</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-yellow-400 text-[10px] font-bold tracking-[0.3em] uppercase ml-8 mb-4">【收回力量五部曲】</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {result.fiveSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start space-x-6 bg-white/[0.03] p-8 rounded-[1.5rem] border border-white/5 hover:bg-white/[0.06] transition-all duration-500 group">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs group-hover:bg-cyan-500/20">
                            {idx + 1}
                          </span>
                          <p className="text-lg text-white font-light leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="p-8 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-[2.5rem] border border-green-500/20">
                    <h3 className="text-green-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-4">【行动锚点】</h3>
                    <p className="text-xl text-white font-light italic leading-relaxed">{result.actionAnchor}</p>
                  </section>

                  <section className="mt-16 pt-12 border-t border-white/10 space-y-10">
                    <h3 className="text-white/30 text-[10px] font-bold tracking-[0.5em] uppercase text-center">QUANTUM DEPOT 量子补给站</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {matchedBook && (
                        <div className="bg-black/40 backdrop-blur-3xl border border-white/10 p-5 rounded-[1.5rem] hover:bg-white/[0.05] transition-all">
                          <h4 className="text-[10px] font-bold text-pink-300 tracking-[0.2em] uppercase mb-3">意识指引</h4>
                          <p className="text-lg text-white font-medium mb-1">{matchedBook.title}</p>
                          <p className="text-[9px] text-white/40 uppercase mb-2">{matchedBook.author}</p>
                          <p className="text-xs text-white/60 font-light">{matchedBook.desc}</p>
                        </div>
                      )}
                      {matchedMusic && (
                        <div 
                          onClick={() => handleDepotMusicPlay(matchedMusic)}
                          className={`cursor-pointer bg-black/40 backdrop-blur-3xl border ${depotPlayingTitle === matchedMusic.title ? 'border-cyan-400/60' : 'border-white/10'} p-5 rounded-[1.5rem] hover:bg-white/[0.05] transition-all flex justify-between items-center group`}
                        >
                          <div>
                            <h4 className="text-[10px] font-bold text-cyan-300 tracking-[0.2em] uppercase mb-3">频率共鸣</h4>
                            <p className="text-lg text-white font-medium mb-1">{matchedMusic.title}</p>
                            <p className="text-[9px] text-white/40 uppercase">{matchedMusic.type}</p>
                          </div>
                          <div className="text-cyan-400">
                            {depotPlayingTitle === matchedMusic.title ? (
                               <svg className="w-10 h-10 animate-pulse" viewBox="0 0 24 24" fill="currentColor"><path d="M10 19H6V5h4v14zm8-14h-4v14h4V5z"/></svg>
                            ) : (
                               <svg className="w-10 h-10 opacity-40 group-hover:opacity-100" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <button
                    onClick={() => { setResult(null); setDepotPlayingTitle(null); if (depotAudioRef.current) depotAudioRef.current.pause(); }}
                    className="w-full mt-6 py-6 text-white/20 hover:text-white transition-all text-[10px] tracking-[1em] font-medium uppercase border-t border-white/5 pt-8"
                  >
                    — 返回虚空 —
                  </button>
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="mt-20 w-full animate-fadeIn">
                <h4 className="text-[10px] text-white/20 tracking-[0.8em] uppercase mb-8 text-center font-bold">同步的校准档案</h4>
                <div className="flex flex-wrap justify-center gap-6 px-4">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setResult(item.result)}
                      className="group flex-shrink-0 w-44 p-6 bg-white/[0.02] backdrop-blur-3xl rounded-[1.5rem] border border-white/10 text-left hover:border-cyan-400/40 transition-all hover:-translate-y-2 shadow-2xl"
                    >
                      <p className="text-[10px] text-white/40 truncate group-hover:text-white leading-relaxed font-light italic">"{item.input}"</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <footer className="w-full py-12 text-[10px] text-white/10 tracking-[1.5em] font-medium uppercase text-center shrink-0">
        © Mirror Logic • Engineered for Consciousness
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 15s linear infinite; }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
        .animate-shake { animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default App;
