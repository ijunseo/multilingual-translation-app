import { MobileTranslationOutput } from "./MobileTranslationOutput";

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface MultiTranslationOutputProps {
  translations: Record<string, string>;
  isLoading: boolean;
  targetLanguages: Language[];
  onSpeak: (text: string, language: string) => void;
}

export function MultiTranslationOutput({
  translations,
  isLoading,
  targetLanguages,
  onSpeak,
}: MultiTranslationOutputProps) {
  if (targetLanguages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <div className="text-2xl">🌐</div>
          </div>
          <h3 className="text-base font-medium mb-2">No target languages enabled</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please enable at least one target language in Settings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4">
      {targetLanguages.map((language) => (
        <div key={language.code}>
          <div className="px-4 mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Translate ({language.nativeName})
            </h3>
          </div>
          <MobileTranslationOutput
            translation={translations[language.code] || ""}
            isLoading={isLoading}
            language={language.code}
            onSpeak={() => onSpeak(translations[language.code] || "", language.code)}
          />
        </div>
      ))}
    </div>
  );
}