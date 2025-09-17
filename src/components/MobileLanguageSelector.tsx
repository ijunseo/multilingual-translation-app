import { Button } from "./ui/button";
import { ArrowUpDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "./ui/sheet";
import { useState } from "react";

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface MobileLanguageSelectorProps {
  languages: Language[];
  sourceLanguage: Language;
  targetLanguage: Language;
  onSourceLanguageChange: (language: Language) => void;
  onTargetLanguageChange: (language: Language) => void;
  onSwapLanguages: () => void;
}

export function MobileLanguageSelector({
  languages,
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onSwapLanguages,
}: MobileLanguageSelectorProps) {
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);

  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl mx-4">
      {/* From Language */}
      <Sheet open={isFromOpen} onOpenChange={setIsFromOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="flex-1 justify-start p-3 h-auto">
            <div className="text-left">
              <div className="text-xs text-muted-foreground mb-1">翻訳元</div>
              <div className="font-medium">{sourceLanguage.nativeName}</div>
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[50vh]">
          <SheetHeader>
            <SheetTitle>翻訳元の言語を選択</SheetTitle>
            <SheetDescription>
              Choose the source language for translation
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 mt-6">
            {languages.map((language) => (
              <Button
                key={language.code}
                variant={sourceLanguage.code === language.code ? "default" : "ghost"}
                className="justify-start h-16 text-left"
                onClick={() => {
                  onSourceLanguageChange(language);
                  setIsFromOpen(false);
                }}
              >
                <div>
                  <div className="font-medium">{language.nativeName}</div>
                  <div className="text-sm text-muted-foreground">{language.name}</div>
                </div>
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Swap Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onSwapLanguages}
        className="mx-3 h-12 w-12 rounded-full"
      >
        <ArrowUpDown className="w-5 h-5" />
      </Button>

      {/* To Language */}
      <Sheet open={isToOpen} onOpenChange={setIsToOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="flex-1 justify-start p-3 h-auto">
            <div className="text-left">
              <div className="text-xs text-muted-foreground mb-1">翻訳先</div>
              <div className="font-medium">{targetLanguage.nativeName}</div>
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[50vh]">
          <SheetHeader>
            <SheetTitle>翻訳先の言語を選択</SheetTitle>
            <SheetDescription>
              Choose the target language for translation
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 mt-6">
            {languages.map((language) => (
              <Button
                key={language.code}
                variant={targetLanguage.code === language.code ? "default" : "ghost"}
                className="justify-start h-16 text-left"
                onClick={() => {
                  onTargetLanguageChange(language);
                  setIsToOpen(false);
                }}
              >
                <div>
                  <div className="font-medium">{language.nativeName}</div>
                  <div className="text-sm text-muted-foreground">{language.name}</div>
                </div>
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}