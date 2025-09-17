import { Button } from "./ui/button";
import { Copy, Volume2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner@2.0.3";

interface TranslationOutputProps {
  translation: string;
  isLoading: boolean;
  language: string;
  onSpeak?: () => void;
}

export function TranslationOutput({
  translation,
  isLoading,
  language,
  onSpeak,
}: TranslationOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!translation) return;
    
    try {
      await navigator.clipboard.writeText(translation);
      setCopied(true);
      toast.success("翻訳をコピーしました / Translation copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("コピーに失敗しました / Failed to copy");
    }
  };

  return (
    <div className="relative">
      <div className="min-h-[120px] p-3 border rounded-lg bg-muted/30">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-muted-foreground">翻訳中... / Translating...</span>
          </div>
        ) : translation ? (
          <p className="whitespace-pre-wrap">{translation}</p>
        ) : (
          <p className="text-muted-foreground">
            翻訳結果がここに表示されます / Translation will appear here
          </p>
        )}
      </div>
      
      {translation && !isLoading && (
        <div className="absolute bottom-3 right-3 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="w-8 h-8"
            aria-label="コピー / Copy"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          
          {onSpeak && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSpeak}
              className="w-8 h-8"
              aria-label="読み上げ / Speak"
            >
              <Volume2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}