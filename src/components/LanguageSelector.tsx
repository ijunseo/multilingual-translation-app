import { Button } from "./ui/button";
import { ChevronDown, ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface LanguageSelectorProps {
  languages: Language[];
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  label: string;
}

export function LanguageSelector({
  languages,
  selectedLanguage,
  onLanguageChange,
  label,
}: LanguageSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="justify-between min-w-[150px]">
            <span>{selectedLanguage.nativeName}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => onLanguageChange(language)}
              className="flex flex-col items-start"
            >
              <span>{language.nativeName}</span>
              <span className="text-xs text-muted-foreground">
                {language.name}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface LanguagePairSelectorProps {
  languages: Language[];
  sourceLanguage: Language;
  targetLanguage: Language;
  onSourceLanguageChange: (language: Language) => void;
  onTargetLanguageChange: (language: Language) => void;
  onSwapLanguages: () => void;
}

export function LanguagePairSelector({
  languages,
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onSwapLanguages,
}: LanguagePairSelectorProps) {
  return (
    <div className="flex items-end gap-4">
      <LanguageSelector
        languages={languages}
        selectedLanguage={sourceLanguage}
        onLanguageChange={onSourceLanguageChange}
        label="翻訳元 / From"
      />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onSwapLanguages}
        className="mb-2"
        aria-label="言語を交換 / Swap languages"
      >
        <ArrowUpDown className="w-4 h-4" />
      </Button>
      
      <LanguageSelector
        languages={languages}
        selectedLanguage={targetLanguage}
        onLanguageChange={onTargetLanguageChange}
        label="翻訳先 / To"
      />
    </div>
  );
}