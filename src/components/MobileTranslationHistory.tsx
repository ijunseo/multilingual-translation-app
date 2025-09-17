import { Button } from "./ui/button";
import { Trash2, RotateCcw } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: Date;
}

interface MobileTranslationHistoryProps {
  history: TranslationHistoryItem[];
  onSelectItem: (item: TranslationHistoryItem) => void;
  onClearHistory: () => void;
}

export function MobileTranslationHistory({
  history,
  onSelectItem,
  onClearHistory,
}: MobileTranslationHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <RotateCcw className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            翻訳履歴はありません
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-medium">翻訳履歴</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          削除
        </Button>
      </div>
      
      {/* History List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-2xl p-4 border border-border hover:bg-muted/30 transition-colors"
              onClick={() => onSelectItem(item)}
            >
              {/* Language indicators */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full">
                  {item.sourceLanguage}
                </span>
                <span className="text-xs text-muted-foreground">→</span>
                <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                  {item.targetLanguage}
                </span>
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
              <p className="text-sm mb-2 line-clamp-2 font-medium">{item.sourceText}</p>
              
              {/* Translated text */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {item.targetText}
              </p>
              
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
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}