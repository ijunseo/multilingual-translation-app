import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { X, Volume2, Mic } from "lucide-react";

interface MobileTranslationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  language: string;
  onSpeak?: () => void;
  onVoiceInput?: () => void;
  maxLength?: number;
}

export function MobileTranslationInput({
  value,
  onChange,
  placeholder,
  language,
  onSpeak,
  onVoiceInput,
  maxLength = 5000,
}: MobileTranslationInputProps) {
  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="mx-4 mb-6">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[140px] resize-none text-base p-4 border-2 rounded-2xl focus:border-primary"
          maxLength={maxLength}
        />
        
        {/* Action buttons */}
        <div className="flex justify-between items-center mt-3">
          <div className="text-xs text-muted-foreground">
            {value.length} / {maxLength}
          </div>
          
          <div className="flex gap-2">
            {value && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="h-10 w-10 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
            
            {onVoiceInput && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onVoiceInput}
                className="h-10 w-10 rounded-full"
              >
                <Mic className="w-5 h-5" />
              </Button>
            )}
            
            {value && onSpeak && (
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
        </div>
      </div>
    </div>
  );
}