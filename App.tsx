import React, { useState, useEffect, useRef } from 'react';
import StarBackground from './components/StarBackground';
import { GoogleGenerativeAI } from "@google/generative-ai";
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
  
  // 新增：查看更多控制
  const [showAllDepot, setShowAllDepot] = useState(false);
  
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const bgmRef = useRef<HTMLAudioElement>(null);
  const [depotPlayingTitle, setDepotPlayingTitle] = useState<string | null>(null);
  const depotAudioRef = useRef<HTMLAudioElement>(null);
  const BGM_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3";

  // 打字机逻辑保持不变
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [currentConcernIndex, setCurrentConcernIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (bgmRef.current) {
      if (isBgmPlaying) {
        bgmRef.current.play().catch(() => setIsBgmPlaying(false));
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
    setShowAllDepot(false); // 重置查看更多状态

    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // 使用最新 2.0-flash

      const prompt = `你是一位精通意识法则的大师。针对用户困扰进行频率校准。
      用户困扰："${input}"
      
      请从以下列表中匹配一本书和一段音乐：
      书籍列表：${BOOKS_DATA.map(b => b.title).join(', ')}
      音乐列表：${MUSIC_DATA.map(m => m.title).join(', ')}

      JSON返回：{ 
        "frequencyScan": "...", 
        "illusionStripping": "...", 
        "fiveSteps": ["step1", ...], 
        "actionAnchor": "...", 
        "recommendedBookTitle": "必须是列表中的原名", 
        "recommendedMusicTitle": "必须是列表中的原名" 
      }`;

      const response = await model.generateContent(prompt);
      const data = JSON.parse(response.response.text().replace(/```json|```/g, ""));

      setResult(data);
      setHistory(prev => [{ id: Date.now().toString(), timestamp: Date.now(), input: input, result: data }, ...prev].slice(0, 10));
      setInput('');
      if (!isBgmPlaying) setIsBgmPlaying(true);
    } catch (err: any) {
      setError("连接量子核心失败。请检查配置。");
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
        depotAudioRef.current.play().catch(e => console.error(e));
        setDepotPlayingTitle(track.title);
        setIsBgmPlaying(false);
      }
    }
  };

  // 改进匹配：去除书名号影响进行查找
  const matchedBook = result ? BOOKS_DATA.find(b => b.title.replace(/[《》]/g, '') === result.recommendedBookTitle.replace(/[《》]/g, '')) || BOOKS_DATA[0] : null;
  const matchedMusic = result ? MUSIC_DATA.find(m => m.title === result.recommendedMusicTitle) || MUSIC_DATA[0] : null;

  return (
    <div className="relative min-h-screen flex flex-col z-10 font-light selection:bg-cyan-500/30">
      <StarBackground />
      <audio ref={bgmRef} src={BGM_URL} loop />
      <audio ref={depotAudioRef} onEnded={() => setDepotPlayingTitle(null)} />

      {/* 右上角音乐图标 */}
      <button 
        onClick={() => {
          setIsBgmPlaying(!isBgmPlaying);
          if (depotAudioRef.current) { depotAudioRef.current.pause(); setDepotPlayingTitle(null); }
        }}
        className="fixed top-6 right-6 z-50 p-4 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 opacity-60 hover:opacity-100 hover:scale-110 transition-all duration-500"
      >
        <div className="text-cyan-400 text-lg md:text-xl">
          {isBgmPlaying || depotPlayingTitle ? <i className="fas fa-volume-up animate-pulse"></i> : <i className="fas fa-volume-mute"></i>}
        </div>
      </button>

      <div className="flex-grow flex flex-col items-center justify-center py-10 px-6 w-full max-w-5xl mx-auto">
        <header className="text-center mb-10 animate-fadeIn">
          <h1 className="text-3xl md:text-5xl font-extralight tracking-[0.3em] gradient-text mb-4 drop-shadow-2xl">频率校准之镜</h1>
          <p className="text-cyan-200/80 font-medium text-[10px] md:text-xs tracking-[0.4em] uppercase opacity-90">QUANTUM MIRROR • 剥离幻象 • 收回力量</p>
        </header>

        <main className="w-full">
          {/* 首页/结果大面板 */}
          <div className="glass-panel rounded-[2.5rem] p-6 md:p-14 transition-all duration-700 hover:shadow-[0_0_80px_rgba(128,222,234,0.15)] min-h-[480px] flex flex-col justify-center relative overflow-hidden shadow-2xl">
            
            {!result && !loading && (
              <div className="space-y-10 animate-fadeIn">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={displayedPlaceholder}
                    className="relative w-full h-40 md:h-56 bg-black/40 backdrop-blur-3xl border border-cyan-400/40 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 text-white text-center placeholder-cyan-100/20 text-lg md:text-2xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-300/20 transition-all resize-none shadow-2xl leading-relaxed font-light"
                  />
                </div>
                <button
                  onClick={handleCalibrate}
                  disabled={!input.trim() || loading}
                  className={`w-full py-6 rounded-2xl font-bold text-lg tracking-[0.5em] transition-all duration-700 transform uppercase
                    ${input.trim() ? 'bg-gradient-to-r from-cyan-500/80 via-blue-500/80 to-purple-600/80 text-white hover:scale-[1.01] hover:shadow-[0_20px_40px_rgba(128,222,234,0.3)] shadow-xl' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'}`}
                >收回力量</button>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center py-20 animate-pulse">
                <div className="text-cyan-400 text-4xl mb-6"><i className="fas fa-atom animate-spin-slow"></i></div>
                <p className="text-white text-xl font-light tracking-[0.6em] uppercase">解析全息图景</p>
              </div>
            )}

            {result && (
              <div className="animate-fadeIn space-y-12 py-4 overflow-y-auto max-h-[75vh] no-scrollbar pr-2">
                {/* 结果内容区域 */}
                <section className="space-y-4 border-l-2 border-cyan-400/80 pl-8 py-1">
                  <h3 className="text-cyan-400 text-[10px] font-bold tracking-[0.3em] uppercase">【频率扫描】</h3>
                  <p className="text-xl md:text-2xl text-white font-light leading-tight">{result.frequencyScan}</p>
                </section>

                <section className="space-y-4 border-l-2 border-purple-400/80 pl-8 py-1">
                  <h3 className="text-purple-400 text-[10px] font-bold tracking-[0.3em] uppercase">【幻象剥离】</h3>
                  <p className="text-white text-lg font-light leading-relaxed italic opacity-90">{result.illusionStripping}</p>
                </section>

                <section className="space-y-6">
                  <h3 className="text-yellow-400 text-[10px] font-bold tracking-[0.3em] uppercase ml-8 mb-4">【收回力量五部曲】</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {result.fiveSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start space-x-6 bg-white/[0.03] p-8 rounded-[1.5rem] border border-white/5 hover:bg-white/[0.06] transition-all">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs">{idx + 1}</span>
                        <p className="text-lg text-white font-light leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 量子补给站区域 */}
                <section className="mt-16 pt-12 border-t border-white/10 space-y-10">
                  <h3 className="text-white/30 text-[10px] font-bold tracking-[0.5em] uppercase text-center">QUANTUM DEPOT 量子补给站</h3>
                  
                  {/* 网格显示：要么显示推荐，要么显示全部 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {!showAllDepot ? (
                      <>
                        <div className="bg-black/40 border border-white/10 p-5 rounded-[1.5rem] hover:bg-white/[0.05] transition-all">
                          <h4 className="text-[9px] text-pink-300 uppercase mb-2">意识指引</h4>
                          <p className="text-base text-white font-medium">{matchedBook?.title}</p>
                          <p className="text-xs text-white/60 font-light mt-1">{matchedBook?.desc}</p>
                        </div>
                        <div onClick={() => handleDepotMusicPlay(matchedMusic!)} className={`cursor-pointer bg-black/40 border ${depotPlayingTitle === matchedMusic?.title ? 'border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'border-white/10'} p-5 rounded-[1.5rem] hover:bg-white/[0.05] transition-all flex justify-between items-center`}>
                          <div>
                            <h4 className="text-[9px] text-cyan-300 uppercase mb-2">频率共鸣</h4>
                            <p className="text-base text-white font-medium">{matchedMusic?.title}</p>
                          </div>
                          <div className="text-cyan-400 text-2xl">{depotPlayingTitle === matchedMusic?.title ? <i className="fas fa-pause-circle"></i> : <i className="fas fa-play-circle opacity-40"></i>}</div>
                        </div>
                      </>
                    ) : (
                      // 显示全部书籍和音乐
                      <div className="col-span-1 md:col-span-2 space-y-10 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {BOOKS_DATA.map((book, i) => (
                            <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5">
                               <p className="text-white text-sm font-medium">{book.title}</p>
                               <p className="text-[10px] text-white/40">{book.desc}</p>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {MUSIC_DATA.map((music, i) => (
                            <div key={i} onClick={() => handleDepotMusicPlay(music)} className={`cursor-pointer p-4 rounded-xl border ${depotPlayingTitle === music.title ? 'border-cyan-400' : 'border-white/5'} flex justify-between items-center bg-white/5`}>
                               <p className="text-white text-sm">{music.title}</p>
                               <i className={`fas ${depotPlayingTitle === music.title ? 'fa-pause' : 'fa-play'} text-cyan-400 text-xs`}></i>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 查看更多按钮 */}
                  <div className="flex justify-center">
                    <button 
                      onClick={() => setShowAllDepot(!showAllDepot)}
                      className="px-6 py-2 rounded-full border border-white/10 text-[9px] text-white/40 hover:text-cyan-400 hover:border-cyan-400/40 transition-all uppercase tracking-widest"
                    >
                      {showAllDepot ? "收起档案" : "查看更多补给"}
                    </button>
                  </div>
                </section>

                <button onClick={() => setResult(null)} className="w-full mt-6 py-8 text-white/10 hover:text-white transition-all text-[10px] tracking-[1em] font-medium uppercase border-t border-white/5">— 返回虚空 —</button>
              </div>
            )}
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 15s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
};

export default App;
