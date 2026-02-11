import React, { useState, useEffect, useRef } from 'react';
import StarBackground from './components/StarBackground';
// 彻底解决路径报错：不再从外部 import，直接在这里定义和实现
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. 核心接口定义 (原 types.ts 内容)
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

// 2. 静态数据配置
const PRESET_CONCERNS = [
  "金钱似乎总是指间沙，无论如何努力都填不满内心深处的匮乏深渊...",
  "在职场表演中耗尽了最后一丝生命力，却依然对未知的评价感到深深恐惧...",
  "试图在亲密关系中寻找救赎，却发现只是在对方的镜子里重复旧有的伤痛...",
  "感觉自己被囚禁在社会的矩阵剧本里，渴望收回主权却找不到出口..."
];

const BOOKS_DATA = [
  { title: "《你值得过更好的生活》", author: "罗伯特·谢费尔德", desc: "核心架构：拆解全息幻象" },
  { title: "《金钱的灵魂》", author: "林恩·特威斯特", desc: "重新定义丰盛与金钱的关系" },
  { title: "《当下的力量》", author: "埃克哈特·托利", desc: "进入意识现场的必经之路" },
  { title: "《瓦解控制》", author: "克拉克·斯特兰德", desc: "放弃小我控制，回归源头" }
];

const MUSIC_DATA = [
  { title: "Deep Space 432Hz - Abundance", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", type: "谐振频率" },
  { title: "Quantum Field Meditation", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", type: "场域扩张" },
  { title: "Solfeggio 528Hz & 432Hz Mix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", type: "修复与显化" }
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

  // 打字机特效逻辑
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [currentConcernIndex, setCurrentConcernIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- 核心逻辑：直接在组件内调用 Gemini ---
  const handleCalibrate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);

    // [关键] 必须使用 import.meta.env 读取 Vercel 变量
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!API_KEY) {
      setError("量子密钥未设置。请在 Vercel 中添加 VITE_GEMINI_API_KEY。");
      setLoading(false);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "你是一位精通意识法则的大师。请根据用户烦恼，以 JSON 格式严格返回：frequencyScan (1句), illusionStripping (1句), fiveSteps (5个动作), actionAnchor (1句), recommendedBookTitle, recommendedMusicTitle。"
      });

      const prompt = `用户烦恼：${input}`;
      const apiResult = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(apiResult.response.text()) as CalibrationResult;
      setResult(data);
      setHistory(prev => [{ id: Date.now().toString(), timestamp: Date.now(), input, result: data }, ...prev].slice(0, 10));
      setInput('');
      if (!isBgmPlaying) setIsBgmPlaying(true);
    } catch (err: any) {
      console.error("Calibration Error:", err);
      // 捕获 API 具体的报错信息
      setError(err.message?.includes("key") ? "密钥无效或已过期，请检查 Vercel 设置。" : "量子链路波动，请重试。");
    } finally {
      setLoading(false);
    }
  };

  // 音乐与特效逻辑 (保持原样)
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

  const handleDepotMusicPlay = (track: any) => {
    if (depotPlayingTitle === track.title) {
      depotAudioRef.current?.pause();
      setDepotPlayingTitle(null);
    } else if (depotAudioRef.current) {
      depotAudioRef.current.src = track.url;
      depotAudioRef.current.play();
      setDepotPlayingTitle(track.title);
      setIsBgmPlaying(false);
    }
  };

  const matchedBook = result ? BOOKS_DATA.find(b => result.recommendedBookTitle.includes(b.title.replace(/《|》/g, ''))) || BOOKS_DATA[0] : null;
  const matchedMusic = result ? MUSIC_DATA.find(m => result.recommendedMusicTitle.includes(m.title)) || MUSIC_DATA[0] : null;

  return (
    <div className="relative min-h-screen flex flex-col z-10 font-light selection:bg-cyan-500/30">
      <StarBackground />
      <audio ref={bgmRef} src={BGM_URL} loop />
      <audio ref={depotAudioRef} onEnded={() => setDepotPlayingTitle(null)} />

      {/* 所有的 UI 渲染逻辑保持你原来的精美设计... */}
      <button onClick={() => setIsBgmPlaying(!isBgmPlaying)} className="fixed top-6 right-6 z-50 p-4 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 opacity-60 hover:opacity-100 transition-all">
        <div className="text-cyan-400 text-xl">{isBgmPlaying ? "🔊" : "🔇"}</div>
      </button>

      <div className="flex-grow flex flex-col items-center justify-center py-10 px-6 w-full max-w-5xl mx-auto">
        <header className="text-center mb-10 animate-fadeIn">
          <h1 className="text-3xl md:text-5xl font-extralight tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400 mb-4">频率校准之镜</h1>
          <p className="text-cyan-200/80 text-xs tracking-[0.4em]">QUANTUM MIRROR • 剥离幻象 • 收回力量</p>
        </header>

        <main className="w-full">
          <div className="bg-black/20 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-14 border border-white/5 shadow-2xl min-h-[400px] flex flex-col justify-center overflow-hidden">
            {!result && !loading && (
              <div className="space-y-10 animate-fadeIn">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={displayedPlaceholder}
                  className="w-full h-40 md:h-56 bg-black/40 border border-cyan-400/40 rounded-[2.5rem] p-8 md:p-12 text-white text-center text-lg md:text-2xl focus:outline-none focus:border-cyan-400 transition-all resize-none font-light"
                />
                <button
                  onClick={handleCalibrate}
                  disabled={!input.trim()}
                  className="w-full py-6 rounded-2xl font-bold tracking-[0.5em] bg-gradient-to-r from-cyan-500/80 to-purple-600/80 text-white hover:scale-[1.01] transition-all disabled:opacity-20"
                >
                  收回力量
                </button>
                {error && <p className="text-red-400 text-center text-sm animate-shake">{error}</p>}
              </div>
            )}

            {loading && (
               <div className="flex flex-col items-center py-20 space-y-10">
                 <div className="w-24 h-24 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
                 <p className="text-white text-lg tracking-[0.5em] animate-pulse">解析全息图景...</p>
               </div>
            )}

            {result && (
              <div className="animate-fadeIn space-y-12 py-4 overflow-y-auto max-h-[70vh] pr-2">
                <section className="border-l-2 border-cyan-400/80 pl-8">
                  <h3 className="text-cyan-400 text-[10px] font-bold tracking-[0.3em] mb-2">【频率扫描】</h3>
                  <p className="text-xl md:text-2xl text-white font-light">{result.frequencyScan}</p>
                </section>
                <section className="border-l-2 border-purple-400/80 pl-8">
                  <h3 className="text-purple-400 text-[10px] font-bold tracking-[0.3em] mb-2">【幻象剥离】</h3>
                  <p className="text-white text-base md:text-lg font-light italic opacity-90">{result.illusionStripping}</p>
                </section>
                <section className="space-y-4">
                  <h3 className="text-yellow-400 text-[10px] font-bold tracking-[0.3em] ml-8">【收回力量五部曲】</h3>
                  {result.fiveSteps.map((step, i) => (
                    <div key={i} className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 flex items-center space-x-4">
                      <span className="text-cyan-300 font-bold">{i+1}</span>
                      <p className="text-white font-light">{step}</p>
                    </div>
                  ))}
                </section>
                <button onClick={() => setResult(null)} className="w-full py-10 text-white/20 hover:text-white transition-all text-[10px] tracking-[1em]">返回虚空</button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
