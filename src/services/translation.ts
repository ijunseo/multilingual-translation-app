import OpenAI from 'openai';

interface TranslationOptions {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  tone?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  'ja': 'Japanese',
  'ko': 'Korean',
  'en-us': 'English (US)',
  'en-uk': 'English (UK)',
  'en-au': 'English (Australia)',
};

const TONE_DESCRIPTIONS: Record<string, string> = {
  'casual': 'casual and friendly tone',
  'neutral': 'neutral and standard tone',
  'semi-formal': 'polite and professional tone',
  'formal': 'formal and respectful tone',
};

class TranslationService {
  private openai: OpenAI;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your environment variables.');
    }

    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Note: In production, use a backend proxy instead
    });
  }

  private generateTranslationPrompt(options: TranslationOptions): string {
    const { text, sourceLanguage, targetLanguage, tone = 'neutral' } = options;

    const sourceLangName = LANGUAGE_NAMES[sourceLanguage] || sourceLanguage;
    const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;
    const toneDescription = TONE_DESCRIPTIONS[tone] || tone;

    return `You are a professional translator. Please translate the following text from ${sourceLangName} to ${targetLangName}.

Requirements:
- Use a ${toneDescription}
- Maintain the original meaning and context
- Adapt cultural references appropriately for ${targetLangName} speakers
- Keep proper nouns and technical terms appropriately
- If translating to English variants (US, UK, Australia), use region-specific expressions and spelling
- Return only the translated text without explanations or additional formatting

Source text: "${text}"

Translation:`;
  }

// Please convert the Japanese or English sentence written in "#Japanese Sentence" into casual, 
// everyday English commonly used in Australia. Output the English expression only.

  async translateText(options: TranslationOptions): Promise<string> {
    try {
      const prompt = this.generateTranslationPrompt(options);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const translation = response.choices[0]?.message?.content?.trim();

      if (!translation) {
        throw new Error('No translation received from OpenAI');
      }

      return translation;
    } catch (error) {
      console.error('Translation error:', error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('OpenAI API key is invalid or missing. Please check your environment configuration.');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        if (error.message.includes('quota')) {
          throw new Error('OpenAI quota exceeded. Please check your billing settings.');
        }
      }

      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async translateToMultipleLanguages(
    text: string,
    sourceLanguage: string,
    targetLanguages: string[],
    tone: string = 'neutral'
  ): Promise<Record<string, string>> {
    const translations: Record<string, string> = {};

    // Process translations concurrently for better performance
    const translationPromises = targetLanguages.map(async (targetLang) => {
      try {
        const translation = await this.translateText({
          text,
          sourceLanguage,
          targetLanguage: targetLang,
          tone
        });
        return { targetLang, translation };
      } catch (error) {
        console.error(`Failed to translate to ${targetLang}:`, error);
        return { targetLang, translation: 'Translation failed' };
      }
    });

    const results = await Promise.allSettled(translationPromises);

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { targetLang, translation } = result.value;
        translations[targetLang] = translation;
      }
    });

    return translations;
  }
}

export const translationService = new TranslationService();
export default translationService;