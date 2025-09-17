import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Check } from "lucide-react";

interface TranslationTone {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface MobileToneSelectorProps {
  tones: TranslationTone[];
  selectedTone: string;
  onToneChange: (toneId: string) => void;
}

export function MobileToneSelector({
  tones,
  selectedTone,
  onToneChange,
}: MobileToneSelectorProps) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Translation Style</h3>

      </div>
      
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {tones.map((tone) => (
            <Button
              key={tone.id}
              variant={selectedTone === tone.id ? "default" : "outline"}
              size="sm"
              onClick={() => onToneChange(tone.id)}
              className={`flex-shrink-0 h-auto py-2 px-3 flex flex-col items-center gap-1 min-w-[80px] ${
                selectedTone === tone.id 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-1">
                {selectedTone === tone.id && (
                  <Check className="w-3 h-3" />
                )}
              </div>
              <span className="text-xs font-medium">{tone.name}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>
      
      {/* Selected tone description */}
      <div className="mt-2">
        <p className="text-xs text-muted-foreground">
          {tones.find(t => t.id === selectedTone)?.description}
        </p>
      </div>
    </div>
  );
}