// FIX: Import 'Type' to use with responseSchema for robust JSON generation.
import { GoogleGenAI, Chat, Modality, Type } from "@google/genai";
import { AIPersonality } from "../types";

const apiKey = process.env.API_KEY || '';

// Safely initialize client only when needed to prevent crashes if env is missing
const getClient = () => {
  if (!apiKey) {
    console.error("API Key is missing. Please set process.env.API_KEY");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getDailyVerseOrHadith = async (): Promise<{ content: string; source: string }> => {
  const ai = getClient();
  if (!ai) return { content: "API Anahtarı eksik.", source: "Sistem" };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Bana Prof. Dr. Hüseyin Atay'ın nuzul (iniş) sırasına göre hazırladığı Kuran mealinden, insan psikolojisine dokunan, umut verici veya düşündürücü kısa bir ayet ver. JSON formatında olsun: { \"content\": \"Ayet Meali\", \"source\": \"Sure Adı ve Ayet Numarası\" }. Sadece JSON döndür.",
      config: {
        responseMimeType: "application/json",
        // FIX: Added responseSchema for more reliable JSON output as per Gemini API guidelines.
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: {
              type: Type.STRING,
              description: 'Ayet Meali',
            },
            source: {
              type: Type.STRING,
              description: 'Sure Adı ve Ayet Numarası',
            },
          },
          required: ['content', 'source'],
        },
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    throw new Error("Empty response");
  } catch (error) {
    console.error("Verse generation failed", error);
    return {
      content: "Kalpler ancak Allah'ı anmakla huzur bulur.",
      source: "Ra'd Suresi, 28"
    };
  }
};

export const createChatSession = (personality: AIPersonality = {}): Chat | null => {
  const ai = getClient();
  if (!ai) return null;

  const personalityTraits: string[] = [];
  if (personality.wise) personalityTraits.push("bilge");
  if (personality.compassionate) personalityTraits.push("şefkatli");
  if (personality.calm) personalityTraits.push("sakin");
  if (personality.reassuring) personalityTraits.push("güven veren");
  if (personality.humanistic) personalityTraits.push("insan odaklı");

  const communicationStyles: string[] = [];
  if (personality.inquisitive) communicationStyles.push("sorgulayıcı ve derinlemesine inen");
  if (personality.empathetic) communicationStyles.push("empatik ve duyguları anlayan");
  if (personality.solutionOriented) communicationStyles.push("çözüm odaklı ve pratik tavsiyeler veren");
  
  let personalityInstruction = "";
  if (personalityTraits.length > 0) {
      personalityInstruction += `\n\nÜslubun şu özellikleri yansıtmalı: ${personalityTraits.join(', ')}.`;
  }
  if (communicationStyles.length > 0) {
      personalityInstruction += `\nİletişim tarzın ${communicationStyles.join(', ')} olmalı.`;
  }

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `
        SENİN KİMLİĞİN VE GÖREVİN:
        Sen, Prof. Dr. Hüseyin Atay tarafından nuzul (iniş) sırasına göre hazırlanmış olan Kuran mealini temel alan bir "Öz'e Dönüş Rehberi"sin. Senin TEK VE YEGANE BİLGİ KAYNAĞIN bu mealdir. Tüm cevapların, analizlerin ve tavsiyelerin bu mealin felsefesine, üslubuna ve ruhuna mutlak surette sadık kalmalıdır. Diğer mealleri, hadisleri veya başka kaynakları KULLANMA.

        TEMEL FELSEFEN (Hüseyin Atay Yaklaşımı):
        1.  **Akıl ve Anlama:** Kuran, aklını kullananlar için bir rehberdir. Cevapların insanları düşünmeye, sorgulamaya ve anlamaya teşvik etmelidir. Ezberci veya dogmatik bir dil kullanma.
        2.  **Evrensel Mesaj:** Kuran'ın mesajı evrenseldir. Cevapların, ayetlerin tarihsel bağlamını aşan, günümüz insanının sorunlarına (stres, anlamsızlık, ilişkiler) doğrudan hitap eden evrensel ilkelerini ortaya çıkarmalıdır.
        3.  **İnsanın Değeri:** İnsan, Allah'ın en değerli varlığıdır. Yaklaşımın, insanın öz saygısını ve potansiyelini yücelten, onu suçluluk psikolojisinden arındırıp sorumluluk bilincine yönlendiren bir yapıda olmalıdır.

        İLETİŞİM YÖNTEMİ:
        1.  **Derin Dinleme:** Kullanıcının sorununu tam olarak anla. Hemen ayet sunmak yerine, bir danışman gibi sorular sorarak sorunun kökenine in. "Bu hissin altında yatan asıl düşünce ne olabilir?", "Seni bu duruma getiren olaylar zincirini düşündün mü?" gibi sorular sor.
        2.  **Nuzul Sırasına Göre Anlamlandırma:** Cevaplarında, ayetlerin iniş sırasındaki mantıksal ve psikolojik bütünlüğünü göz önünde bulundur. Bir konuyu açıklarken, o konuyla ilgili ilk inen ayetlerden başlayarak Allah'ın insanı nasıl bir eğitim sürecinden geçirdiğini göster.
        3.  **Kavramsal Analiz:** Ayetlerde geçen kilit kavramları (örneğin "sabır", "şükür", "tevekkül") yüzeysel anlamlarıyla değil, Hüseyin Atay mealindeki derin felsefi ve psikolojik karşılıklarıyla açıkla.
        4.  **Psikolojik Entegrasyon:** Modern psikolojinin temel bulgularını, Kuran'ın bu mealdeki insan tanımıyla birleştir. Kullanıcının bilişsel çarpıtmalarını (cognitive distortions) ayetlerin ışığında yeniden çerçevelemesine yardımcı ol.
        5.  **Sorumluluk ve Eylem:** Kullanıcıyı pasif bir alıcı konumunda bırakma. Ona, ayetlerden çıkardığı derslerle hayatında atabileceği somut, akılcı adımlar konusunda yol göster.

        SINIRLARIN:
        -   **Kaynak Sadakati:** Hüseyin Atay meali DIŞINDA hiçbir kaynak kullanma.
        -   **Kriz Anı:** Ağır depresyon veya kendine zarar verme gibi durumlarda, manevi desteğini sunarken mutlaka profesyonel tıbbi yardım almanın önemini vurgula.
        -   **Üslup:** Bilgili ama kibirli değil; bilge, şefkatli ve yol gösterici bir "rehber" üslubu kullan.
        ${personalityInstruction}
      `,
    },
  });
};

export const getVerseExplanation = async (surahName: string, verseNumber: number, verseText: string): Promise<string | null> => {
  const ai = getClient();
  if (!ai) return null;

  try {
    const prompt = `
      Sen Prof. Dr. Hüseyin Atay'ın Kuran meali ve tefsiri konusunda derin bilgiye sahip bir uzmansın.
      Aşağıdaki ayet için, Hüseyin Atay'ın rasyonel, akılcı ve insan psikolojisine odaklanan bakış açısıyla, KISA VE ÖZ bir açıklama (tefsir) yaz.
      
      Kurallar:
      1. Açıklama 2-3 cümleyi geçmemeli. Çok net ve anlaşılır olmalı.
      2. Dogmatik değil, düşündürücü ve günümüz insanının hayatına dokunan bir dil kullan.
      3. Ayetin "neden" indiğine veya insana "ne" kattığına odaklan.
      
      Ayet Bilgisi: ${surahName} Suresi, ${verseNumber}. Ayet
      Ayet Metni: "${verseText}"
      
      Sadece açıklama metnini döndür.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Explanation generation failed", error);
    return null;
  }
};


export const generateVerseSpeech = async (text: string): Promise<string | null> => {
  const ai = getClient();
  if (!ai) return null;

  try {
    // Instruct the AI on the desired tone and pace.
    // Updated prompt: Enforcing a "very old, deep, chest voice" character.
    // The pace is requested to be "calm but fluent". We rely on the client-side playbackRate for speed adjustments.
    const prompt = `Çok yaşlı, sesi göğüsten gelen, son derece derin, tok ve yankılı bir bilge adam tonuyla okuyun.
    Aşağıdaki metni monoton olmayan, doğal ve akıcı bir hızda seslendir: "${text}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Fenrir" 
              }
            }
        }
      }
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return audioData || null;

  } catch (error) {
    console.error("Speech generation failed", error);
    return null;
  }
};