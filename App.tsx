
import React, { useState, useEffect, useRef } from 'react';
import StarBackground from './components/StarBackground';
import { calibrateFrequency } from './services/geminiService';
import { CalibrationResult, HistoryItem } from './types';

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
  
  // Audio Refs & State
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const bgmRef = useRef<HTMLAudioElement>(null);
  const [depotPlayingTitle, setDepotPlayingTitle] = useState<string | null>(null);
  const depotAudioRef = useRef<HTMLAudioElement>(null);

  // Background BGM URL (Selected for high availability)
  const BGM_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3";

  // Typewriter effect
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [currentConcernIndex, setCurrentConcernIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (bgmRef.current) {
      if (isBgmPlaying) {
        bgmRef.current.play().catch(e => {
          console.warn("BGM autoplay blocked or error:", e);
          setIsBgmPlaying(false);
        });
      } else {
        bgmRef.current.pause();
      }
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
    setResult(null);
    try {
      const data = await calibrateFrequency(input);
      setResult(data);
      setHistory(prev => [{ id: Date.now().toString(), timestamp: Date.now(), input: input, result: data }, ...prev].slice(0, 10));
      setInput('');
      // Optionally start BGM on first successful interaction if browser allowed
      if (!isBgmPlaying && !depotPlayingTitle) {
        setIsBgmPlaying(true);
      }
    } catch (err: any) {
      console.error("Calibration interaction error:", err);
      setError(err.message || "连接量子核心失败。请检查 API Key 配置。");
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
        depotAudioRef.current.play().catch(e => console.error("Depot playback error:", e));
        setDepotPlayingTitle(track.title);
        // Pause main BGM when depot music starts
        setIsBgmPlaying(false);
      }
    }
  };

  const matchedBook = result ? BOOKS_DATA.find(b => b.title.includes(result.recommendedBookTitle) || result.recommendedBookTitle.includes(b.title)) || BOOKS_DATA[0] : null;
  const matchedMusic = result ? MUSIC_DATA.find(m => m.title.includes(result.recommendedMusicTitle) || result.recommendedMusicTitle.includes(m.title)) || MUSIC_DATA[0] : null;

  return (
    <div className="relative min-h-screen flex flex-col z-10 font-light selection:bg-cyan-500/30">
      <StarBackground />
      <audio ref={bgmRef} src={BGM_URL} loop />
      <audio ref={depotAudioRef} onEnded={() => setDepotPlayingTitle(null)} />

      {/* Main Music Control */}
      <button 
        onClick={() => {
          setIsBgmPlaying(!isBgmPlaying);
          if (depotAudioRef.current) {
            depotAudioRef.current.pause();
            setDepotPlayingTitle(null);
          }
        }}
        className="fixed top-6 right-6 z-50 p-4 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 opacity-60 hover:opacity-100 hover:scale-110 transition-all duration-500 shadow-2xl group"
        title="背景音乐"
      >
        <div className="text-cyan-400 text-lg md:text-xl">
          {isBgmPlaying ? <i className="fas fa-volume-up animate-pulse"></i> : <i className="fas fa-volume-mute"></i>}
        </div>
      </button>

      <div className="flex-grow flex flex-col items-center justify-center py-10 px-6 w-full max-w-5xl mx-auto">
        <div className="w-full flex flex-col items-center">
          <header className="text-center mb-10 relative w-full animate-fadeIn">
            <h1 className="text-3xl md:text-5xl font-extralight tracking-[0.2em] md:tracking-[0.3em] gradient-text mb-4 drop-shadow-2xl whitespace-nowrap">
              频率校准之镜
            </h1>
            <p className="text-cyan-200/80 font-medium text-xs md:text-sm tracking-[0.2em] md:tracking-[0.4em] uppercase opacity-90">
              QUANTUM MIRROR • 剥离幻象 • 收回力量
            </p>
            <div className="mt-6 mx-auto w-24 md:w-32 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
          </header>

          <main className="w-full">
            <div className="glass-panel rounded-[2.5rem] p-6 md:p-14 transition-all duration-700 hover:shadow-[0_0_80px_rgba(128,222,234,0.15)] min-h-[400px] md:min-h-[480px] flex flex-col justify-center relative overflow-hidden shadow-2xl">
              
              {!result && !loading && (
                <div className="space-y-8 md:space-y-10 animate-fadeIn">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={displayedPlaceholder}
                      className="relative w-full h-40 md:h-56 bg-black/40 backdrop-blur-3xl border border-cyan-400/40 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 text-white text-center placeholder-cyan-100/20 text-lg md:text-2xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-300/20 transition-all resize-none shadow-2xl leading-relaxed font-light"
                    />
                    <div className="absolute bottom-4 right-8 text-[8px] md:text-[10px] text-cyan-400/30 tracking-[0.3em] uppercase font-bold">Quantum Detection Active</div>
                  </div>
                  <button
                    onClick={handleCalibrate}
                    disabled={!input.trim() || loading}
                    className={`w-full py-5 md:py-6 rounded-2xl font-bold text-base md:text-lg tracking-[0.4em] md:tracking-[0.5em] transition-all duration-700 transform uppercase
                      ${input.trim() ? 'bg-gradient-to-r from-cyan-500/80 via-blue-500/80 to-purple-600/80 text-white hover:scale-[1.01] hover:shadow-[0_20px_40px_rgba(128,222,234,0.3)] active:scale-95 shadow-xl' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'}`}
                  >
                    收回力量
                  </button>
                  {error && (
                    <div className="p-4 md:p-6 bg-red-900/20 border border-red-500/30 rounded-2xl animate-shake">
                      <p className="text-red-300 text-center text-xs md:text-sm font-medium">{error}</p>
                    </div>
                  )}
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-16 md:py-20 space-y-8 md:space-y-10">
                  <div className="relative w-24 h-24 md:w-32 md:h-32">
                    <div className="absolute inset-0 border border-cyan-500/10 rounded-full scale-150 animate-pulse"></div>
                    <div className="absolute inset-0 border-[3px] border-cyan-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-[3px] border-t-white rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-cyan-400 text-3xl md:text-4xl">
                      <i className="fas fa-atom animate-spin-slow"></i>
                    </div>
                  </div>
                  <div className="text-center space-y-4">
                    <p className="text-white text-lg md:text-xl font-light tracking-[0.5em] md:tracking-[0.6em] uppercase animate-pulse">解析全息图景</p>
                    <p className="text-white/40 text-[10px] md:text-xs tracking-widest uppercase italic">正在剥离频率投影，请保持深呼吸...</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="animate-fadeIn space-y-10 md:space-y-12 py-4 overflow-y-auto max-h-[75vh] no-scrollbar pr-2">
                  <section className="space-y-4 border-l-2 border-cyan-400/80 pl-6 md:pl-8 py-1">
                    <h3 className="text-cyan-400 text-[9px] md:text-[10px] font-bold tracking-[0.3em] uppercase">【频率扫描】</h3>
                    <p className="text-xl md:text-2xl text-white font-light leading-tight">{result.frequencyScan}</p>
                  </section>

                  <section className="space-y-4 border-l-2 border-purple-400/80 pl-6 md:pl-8 py-1">
                    <h3 className="text-purple-400 text-[9px] md:text-[10px] font-bold tracking-[0.3em] uppercase">【幻象剥离】</h3>
                    <p className="text-white text-base md:text-lg font-light leading-relaxed italic opacity-90">{result.illusionStripping}</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-yellow-400 text-[9px] md:text-[10px] font-bold tracking-[0.3em] uppercase ml-6 md:ml-8 mb-4">【收回力量五部曲】</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {result.fiveSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start space-x-4 md:space-x-6 bg-white/[0.03] p-6 md:p-8 rounded-[1.5rem] border border-white/5 hover:bg-white/[0.06] transition-all duration-500 group shadow-sm">
                          <span className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-[10px] md:text-xs group-hover:bg-cyan-500/20 transition-colors">
                            {idx + 1}
                          </span>
                          <p className="text-base md:text-lg text-white font-light leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="p-6 md:p-8 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-[2rem] md:rounded-[2.5rem] border border-green-500/20 shadow-xl">
                    <h3 className="text-green-400 text-[9px] md:text-[10px] font-bold tracking-[0.3em] uppercase mb-4">【行动锚点】</h3>
                    <p className="text-lg md:text-xl text-white font-light italic leading-relaxed">{result.actionAnchor}</p>
                  </section>

                  {/* 量子补给站 - Matched only */}
                  <section className="mt-12 md:mt-16 pt-10 md:pt-12 border-t border-white/10 space-y-8 md:space-y-10">
                    <h3 className="text-white/30 text-[9px] md:text-[10px] font-bold tracking-[0.4em] md:tracking-[0.5em] uppercase text-center">QUANTUM DEPOT 量子补给站</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {matchedBook && (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3 mb-1 ml-4">
                            <i className="fas fa-book-open text-pink-400/60 text-sm md:text-base"></i>
                            <h4 className="text-[9px] md:text-[10px] font-bold text-pink-300 tracking-[0.2em] uppercase">意识指引</h4>
                          </div>
                          <div className="bg-black/40 backdrop-blur-3xl border border-white/10 p-5 rounded-[1.5rem] hover:bg-white/[0.05] transition-all shadow-lg">
                            <p className="text-base md:text-lg text-white font-medium mb-1">{matchedBook.title}</p>
                            <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2">{matchedBook.author}</p>
                            <p className="text-xs text-white/60 leading-relaxed font-light">{matchedBook.desc}</p>
                          </div>
                        </div>
                      )}
                      {matchedMusic && (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3 mb-1 ml-4">
                            <i className="fas fa-wave-square text-cyan-400/60 text-sm md:text-base"></i>
                            <h4 className="text-[9px] md:text-[10px] font-bold text-cyan-300 tracking-[0.2em] uppercase">频率共鸣</h4>
                          </div>
                          <div 
                            onClick={() => handleDepotMusicPlay(matchedMusic)}
                            className={`cursor-pointer bg-black/40 backdrop-blur-3xl border ${depotPlayingTitle === matchedMusic.title ? 'border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'border-white/10'} p-5 rounded-[1.5rem] hover:bg-white/[0.05] transition-all flex justify-between items-center group shadow-lg`}
                          >
                            <div>
                              <p className="text-base md:text-lg text-white font-medium mb-1 group-hover:text-cyan-200 transition-colors">{matchedMusic.title}</p>
                              <p className="text-[9px] text-white/40 uppercase tracking-widest">{matchedMusic.type}</p>
                            </div>
                            <div className="text-cyan-400 text-2xl">
                              {depotPlayingTitle === matchedMusic.title ? <i className="fas fa-pause-circle animate-pulse"></i> : <i className="fas fa-play-circle opacity-40 group-hover:opacity-100"></i>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <button
                    onClick={() => {
                      setResult(null);
                      if (depotAudioRef.current) {
                        depotAudioRef.current.pause();
                        setDepotPlayingTitle(null);
                      }
                    }}
                    className="w-full mt-6 py-6 text-white/20 hover:text-white transition-all text-[9px] md:text-[10px] tracking-[0.8em] md:tracking-[1em] font-medium uppercase border-t border-white/5 pt-8"
                  >
                    — 返回虚空 —
                  </button>
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="mt-16 md:mt-20 w-full animate-fadeIn">
                <h4 className="text-[9px] text-white/20 tracking-[0.5em] md:tracking-[0.8em] uppercase mb-8 text-center font-bold">同步的校准档案</h4>
                <div className="flex flex-wrap justify-center gap-4 md:gap-6 px-2 md:px-4">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setResult(item.result)}
                      className="group flex-shrink-0 w-36 md:w-44 p-4 md:p-6 bg-white/[0.02] backdrop-blur-3xl rounded-[1.2rem] md:rounded-[1.5rem] border border-white/10 text-left hover:border-cyan-400/40 transition-all hover:-translate-y-2 shadow-2xl"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[8px] text-white/30 font-bold tracking-tighter uppercase">#{item.id.slice(-4)}</span>
                      </div>
                      <p className="text-[10px] text-white/40 truncate group-hover:text-white transition-colors leading-relaxed font-light italic">"{item.input}"</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <footer className="w-full py-10 md:py-12 text-[8px] md:text-[10px] text-white/10 tracking-[1em] md:tracking-[1.5em] font-medium uppercase text-center shrink-0">
        © Mirror Logic • Engineered for Consciousness
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .animate-shake {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        textarea::placeholder {
          transition: opacity 0.5s ease;
        }
      `}} />
    </div>
  );
};

export default App;
