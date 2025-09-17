import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
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

interface TranslationHistoryProps {
  history: TranslationHistoryItem[];
  onSelectItem: (item: TranslationHistoryItem) => void;
  onClearHistory: () => void;
}

export function TranslationHistory({
  history,
  onSelectItem,
  onClearHistory,
}: TranslationHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            翻訳履歴はありません / No translation history
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3>翻訳履歴 / Translation History</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearHistory}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            履歴を削除
          </Button>
        </div>
        
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onSelectItem(item)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    {item.sourceLanguage}
                  </span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                    {item.targetLanguage}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 ml-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem(item);
                    }}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
                
                <p className="text-sm mb-1 line-clamp-2">{item.sourceText}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.targetText}
                </p>
                
                <p className="text-xs text-muted-foreground mt-2">
                  {item.timestamp.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}