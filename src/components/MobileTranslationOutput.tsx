import { Button } from "./ui/button";
import { Copy, Volume2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner@2.0.3";

interface MobileTranslationOutputProps {
  translation: string;
  isLoading: boolean;
  language: string;
  onSpeak?: () => void;
}

export function MobileTranslationOutput({
  translation,
  isLoading,
  language,
  onSpeak,
}: MobileTranslationOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!translation) return;
    
    try {
      await navigator.clipboard.writeText(translation);
      setCopied(true);
      toast.success("Translation copied");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="mx-4 mb-6">
      <div className="bg-muted/30 rounded-2xl p-4 min-h-[140px] flex flex-col justify-between">
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
              <span>Translating...</span>
            </div>
          ) : translation ? (
            <p className="text-base leading-relaxed whitespace-pre-wrap">{translation}</p>
          ) : (
            <p className="text-muted-foreground text-base">
              Translation will appear here
            </p>
          )}
        </div>
        
        {translation && !isLoading && (
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-10 w-10 rounded-full"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </Button>
            
            {onSpeak && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSpeak}
                className="h-10 w-10 rounded-full"
              >
                <Volume2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}