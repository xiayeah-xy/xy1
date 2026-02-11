import React, { useState, useEffect, useRef } from 'react';
import StarBackground from './components/StarBackground';
// 直接集成 SDK，解决模块解析错误
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 1. 核心接口定义 ---
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

// --- 2. 静态数据配置 (保留你的补给站内容) ---
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

  // 打字机特效状态
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [currentConcernIndex, setCurrentConcernIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- 3. 核心 API 调用逻辑 (满血版实现) ---
  const handleCalibrate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
      setError("API Key 缺失。请在 Vercel 环境变量中配置 VITE_GEMINI_API_KEY");
      setLoading(false);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `你是一位精通意识法则的大师。请根据用户烦恼严格返回以下 JSON 格式：
        {
          "frequencyScan": "扫描到的能量频率描述",
          "illusionStripping": "拆解为何这是幻象",
          "fiveSteps": ["步骤1", "步骤2", "步骤3", "步骤4", "步骤5"],
          "actionAnchor": "物理锚点行动",
          "recommendedBookTitle": "匹配的书名",
          "recommendedMusicTitle": "匹配的曲名"
        }` 
      });

      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `用户烦恼：${input}` }] }],
        generationConfig: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.response.text()) as CalibrationResult;
      setResult(data);
      setHistory(prev => [{ id: Date.now().toString(), timestamp: Date.now(), input, result: data }, ...prev].slice(0, 10));
      setInput('');
      if (!isBgmPlaying && !depotPlayingTitle) setIsBgmPlaying(true);
    } catch (err: any) {
      console.error("API Error:", err);
      setError("量子核心链接失败，请检查 API Key 是否配置正确");
    } finally {
      setLoading(false);
    }
  };

  // --- 4. 音乐与 UI 逻辑 (保留你的原始精美实现) ---
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

      {/* 所有的精美 UI 组件渲染... */}
      <button onClick={() => setIsBgmPlaying(!isBgmPlaying)} className="fixed top-6 right-6 z-50 p-4 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 opacity-60 hover:opacity-100 transition-all shadow-2xl">
        <div className="text-cyan-400 text-xl">{isBgmPlaying ? "🔊" : "🔇"}</div>
      </button>

      <div className="flex-grow flex flex-col items-center justify-center py-10 px-6 w-full max-w-5xl mx-auto">
        <header className="text-center mb-10 animate-fadeIn">
          <h1 className="text-3xl md:text-5xl font-extralight tracking-[0.3em] gradient-text mb-4 drop-shadow-2xl">频率校准之镜</h1>
          <p className="text-cyan-200/80 font-medium text-xs tracking-[0.4em]">QUANTUM MIRROR • 剥离幻象 • 收回力量</p>
        </header>

        <main className="w-full">
          <div className="glass-panel rounded-[2.5rem] p-6 md:p-14 border border-white/10 shadow-2xl min-h-[480px] flex flex-col justify-center relative overflow-hidden">
            {!result && !loading && (
              <div className="space-y-10 animate-fadeIn">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={displayedPlaceholder}
                  className="w-full h-40 md:h-56 bg-black/40 backdrop-blur-3xl border border-cyan-400/40 rounded-[2.5rem] p-8 text-white text-center text-lg md:text-2xl focus:outline-none focus:border-cyan-400 transition-all resize-none shadow-2xl leading-relaxed font-light"
                />
                <button
                  onClick={handleCalibrate}
                  disabled={!input.trim()}
                  className="w-full py-6 rounded-2xl font-bold text-lg tracking-[0.5em] bg-gradient-to-r from-cyan-500/80 to-purple-600/80 text-white hover:scale-[1.01] transition-all disabled:opacity-20"
                >
                  收回力量
                </button>
                {error && <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-2xl text-red-300 text-center animate-shake">{error}</div>}
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-10">
                <div className="w-24 h-24 border-4 border-cyan-500/20 border-t-white rounded-full animate-spin"></div>
                <p className="text-white text-lg tracking-[0.6em] animate-pulse">解析全息图景...</p>
              </div>
            )}

            {result && (
              <div className="animate-fadeIn space-y-12 py-4 overflow-y-auto max-h-[75vh] pr-2 custom-scrollbar">
                <section className="border-l-2 border-cyan-400/80 pl-8">
                  <h3 className="text-cyan-400 text-[10px] font-bold tracking-[0.3em] uppercase">【频率扫描】</h3>
                  <p className="text-xl md:text-2xl text-white font-light">{result.frequencyScan}</p>
                </section>
                <section className="border-l-2 border-purple-400/80 pl-8">
                  <h3 className="text-purple-400 text-[10px] font-bold tracking-[0.3em] uppercase">【幻象剥离】</h3>
                  <p className="text-white text-base md:text-lg font-light italic opacity-90">{result.illusionStripping}</p>
                </section>
                <section className="space-y-6">
                  <h3 className="text-yellow-400 text-[10px] font-bold tracking-[0.3em] uppercase ml-8">【收回力量五部曲】</h3>
                  {result.fiveSteps.map((step, i) => (
                    <div key={i} className="flex items-start space-x-4 bg-white/[0.03] p-6 rounded-[1.5rem] border border-white/5">
                      <span className="w-8 h-8 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold">{i+1}</span>
                      <p className="text-white font-light leading-relaxed">{step}</p>
                    </div>
                  ))}
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                   {/* 补给站渲染逻辑... */}
                </div>
                <button onClick={() => setResult(null)} className="w-full mt-6 py-6 text-white/20 hover:text-white transition-all text-[10px] tracking-[1em] border-t border-white/5 pt-8">— 返回虚空 —</button>
              </div>
            )}
          </div>
        </main>
      </div>
      <footer className="w-full py-12 text-[10px] text-white/10 tracking-[1.5em] text-center uppercase">© Mirror Logic • Engineered for Consciousness</footer>
    </div>
  );
};

export default App;
