import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { TranslationDirection } from "./MobileSettings";

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface MobileSourceLanguageSelectorProps {
  languages: Language[];
  sourceLanguage: Language;
  onSourceLanguageChange: (language: Language) => void;
  translationDirection?: TranslationDirection;
}

export function MobileSourceLanguageSelector({
  languages,
  sourceLanguage,
  onSourceLanguageChange,
  translationDirection = "all-to-all",
}: MobileSourceLanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mx-4 mb-4">
      <div className="text-center">
        <div className="mb-3">
          <p className="text-sm text-muted-foreground">Select source language</p>
        </div>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full h-14 text-left justify-start rounded-2xl border-2"
            >
              <div>
                <div className="font-medium">{sourceLanguage.nativeName}</div>
                <div className="text-sm text-muted-foreground">{sourceLanguage.name}</div>
              </div>
            </Button>
          </SheetTrigger>
          
          <SheetContent side="bottom" className="h-[50vh]">
            <SheetHeader>
              <SheetTitle>Select source language</SheetTitle>
              <SheetDescription>
                Choose the language you want to translate from
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-3 mt-6">
              {languages.map((language) => {
                const isSelected = sourceLanguage.code === language.code;
                
                return (
                  <Button
                    key={language.code}
                    variant={isSelected ? "default" : "ghost"}
                    className="justify-start h-16 text-left rounded-2xl"
                    onClick={() => {
                      onSourceLanguageChange(language);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{language.nativeName}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{language.name}</div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
        
        <p className="text-xs text-muted-foreground mt-2">
          Auto-translate to other languages
        </p>
      </div>
    </div>
  );
}