import { GoogleGenerativeAI } from "@google/generative-ai";

// 直接在这里定义接口，不引用外部 types 文件，防止路径报错
export interface CalibrationResult {
  frequencyScan: string;
  illusionStripping: string;
  fiveSteps: string[];
  actionAnchor: string;
  recommendedBookTitle: string;
  recommendedMusicTitle: string;
}

const BOOKS_LIST = `
1. 《你值得过更好的生活》 - 罗伯特·谢费尔德
2. 《金钱的灵魂》 - 林恩·特威斯特
3. 《当下的力量》 - 埃克哈特·托利
4. 《瓦解控制》 - 克拉克·斯特兰德
5. 《信念的力量》 - 布鲁斯·利普顿
6. 《零极限》 - 修·蓝博士
7. 《终极自由之路》 - 莱斯特·利文森
8. 《显化的真义》 - 尼维尔·高达德
`;

const MUSIC_LIST = `
1. Deep Space 432Hz - Abundance
2. Quantum Field Meditation
3. Solfeggio 528Hz & 432Hz Mix
4. Alpha Wave Focus
5. Healing Resonance 432Hz
6. Higher Self Connection
7. Pineal Gland Activation
8. Universal Harmony
9. Eternal Silence
10. Soul Blueprint Alignment
`;

const SYSTEM_INSTRUCTION = `你是一位精通意识法则、频率校准与现实创造的大师。
你的任务是帮助用户看穿他们生活中的“烦恼”，将其识别为内在频率的“全息投影”。
请以充满智慧、空灵且赋能的口吻回答。严格按照以下JSON格式返回结果：
{
  "frequencyScan": "简短描述识别到的能量模式",
  "illusionStripping": "剖析为什么这个烦恼只是一个幻象",
  "fiveSteps": ["动作1", "动作2", "动作3", "动作4", "动作5"],
  "actionAnchor": "一个简单的物理行动锚点",
  "recommendedBookTitle": "从提供的书籍列表中选择最匹配的完整书名",
  "recommendedMusicTitle": "从提供的音乐列表中选择最匹配的完整曲名"
}
书籍列表：${BOOKS_LIST}
音乐列表：${MUSIC_LIST}`;

export const calibrateFrequency = async (userInput: string): Promise<CalibrationResult> => {
  // 关键：必须使用 VITE_ 前缀才能被前端读取
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error("量子核心密钥缺失。请在 Vercel 中设置 VITE_GEMINI_API_KEY。");
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // 使用最稳定的 1.5 版本
      systemInstruction: SYSTEM_INSTRUCTION 
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `用户烦恼："${userInput}"。请进行深度频率校准。` }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const resultText = result.response.text();
    return JSON.parse(resultText) as CalibrationResult;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error("量子干扰过强，请确保 Vercel 环境变量已保存并重新部署。");
  }
};
