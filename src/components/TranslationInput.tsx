import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { X, Volume2 } from "lucide-react";

interface TranslationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  language: string;
  onSpeak?: () => void;
  maxLength?: number;
}

export function TranslationInput({
  value,
  onChange,
  placeholder,
  language,
  onSpeak,
  maxLength = 5000,
}: TranslationInputProps) {
  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[120px] resize-none pr-20"
        maxLength={maxLength}
      />
      
      <div className="absolute bottom-3 right-3 flex gap-2">
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="w-8 h-8"
            aria-label="クリア / Clear"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        
        {value && onSpeak && (
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
      
      <div className="absolute bottom-1 left-3 text-xs text-muted-foreground">
        {value.length} / {maxLength}
      </div>
    </div>
  );
}