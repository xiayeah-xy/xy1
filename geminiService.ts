
import { GoogleGenAI, Type } from "@google/genai";
import { CalibrationResult } from "../types";

const BOOKS_LIST = `
1. 《你值得过更好的生活》 - 罗伯特·谢费尔德 (核心架构：拆解全息幻象)
2. 《金钱的灵魂》 - 林恩·特威斯特 (重新定义丰盛与金钱的关系)
3. 《当下的力量》 - 埃克哈特·托利 (进入意识现场的必经之路)
4. 《瓦解控制》 - 克拉克·斯特兰德 (放弃小我控制，回归源头)
5. 《信念的力量》 - 布鲁斯·利普顿 (量子生物学视角下的意识改写)
6. 《零极限》 - 修·蓝博士 (清理潜意识记忆的实操指南)
7. 《终极自由之路》 - 莱斯特·利文森 (关于释放与收回力量的终极教导)
8. 《显化的真义》 - 尼维尔·高达德 (意识即实相的古典量子观)
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
请以充满智慧、空灵且赋能的口吻回答。

书籍列表参考：
${BOOKS_LIST}

音乐列表参考：
${MUSIC_LIST}

你必须从上述列表中各选择最契合的一项，并严格按照以下JSON格式返回结果：
{
  "frequencyScan": "简短描述识别到的能量模式（如：权力外借、生存恐惧、匮乏投射等）",
  "illusionStripping": "剖析为什么这个烦恼只是一个幻象，以及它试图教给用户什么",
  "fiveSteps": ["动作1", "动作2", "动作3", "动作4", "动作5"],
  "actionAnchor": "一个简单的物理行动锚点",
  "recommendedBookTitle": "从提供的书籍列表中选择最匹配的完整书名",
  "recommendedMusicTitle": "从提供的音乐列表中选择最匹配的完整曲名"
}

确保 responseMimeType 为 application/json。`;

export const calibrateFrequency = async (userInput: string): Promise<CalibrationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: `用户烦恼："${userInput}"。请进行深度频率校准。` }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            frequencyScan: { type: Type.STRING },
            illusionStripping: { type: Type.STRING },
            fiveSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionAnchor: { type: Type.STRING },
            recommendedBookTitle: { type: Type.STRING },
            recommendedMusicTitle: { type: Type.STRING }
          },
          required: ["frequencyScan", "illusionStripping", "fiveSteps", "actionAnchor", "recommendedBookTitle", "recommendedMusicTitle"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("量子镜面未能形成有效反射，请重试。");
    }

    return JSON.parse(resultText) as CalibrationResult;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("API_KEY")) {
      throw new Error("量子核心密钥缺失或无效。");
    }
    throw new Error("量子干扰过强，无法完成校准。请检查网络或稍后重试。");
  }
};
