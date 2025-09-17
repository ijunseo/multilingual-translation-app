import { Button } from "./ui/button";
import { Trash2, RotateCcw } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface MultiTranslationHistoryItem {
  id: string;
  sourceText: string;
  translations: Record<string, string>; // language code -> translation
  sourceLanguage: string;
  timestamp: Date;
}

interface MobileMultiTranslationHistoryProps {
  history: MultiTranslationHistoryItem[];
  onSelectItem: (item: MultiTranslationHistoryItem) => void;
  onClearHistory: () => void;
  allLanguages: { code: string; name: string; nativeName: string }[];
}

export function MobileMultiTranslationHistory({
  history,
  onSelectItem,
  onClearHistory,
  allLanguages,
}: MobileMultiTranslationHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <RotateCcw className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            No translation history
          </p>
        </div>
      </div>
    );
  }

  const getLanguageByCode = (code: string) => {
    return allLanguages.find(lang => lang.code === code);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-medium">History</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>
      
      {/* History List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {history.map((item) => {
            const sourceLang = getLanguageByCode(item.sourceLanguage);
            
            return (
              <div
                key={item.id}
                className="bg-card rounded-2xl p-4 border border-border hover:bg-muted/30 transition-colors"
                onClick={() => onSelectItem(item)}
              >
                {/* Source language indicator */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full">
                    {sourceLang?.nativeName || item.sourceLanguage}
                  </span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-xs text-muted-foreground">All languages</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 ml-auto rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem(item);
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Source text */}
                <p className="text-sm mb-3 line-clamp-2 font-medium">{item.sourceText}</p>
                
                {/* Translations */}
                <div className="space-y-2 mb-3">
                  {Object.entries(item.translations).map(([langCode, translation]) => {
                    const lang = getLanguageByCode(langCode);
                    return (
                      <div key={langCode} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-medium mt-0.5">
                          {langCode.toUpperCase()}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                          {translation}
                        </p>
                      </div>
                    );
                  })}
                </div>
                
                {/* Timestamp */}
                <p className="text-xs text-muted-foreground">
                  {item.timestamp.toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}