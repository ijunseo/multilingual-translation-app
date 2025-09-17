import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { GripVertical, Languages as LanguagesIcon } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface LanguageOrderingProps {
  allLanguages: Language[];
  languageOrder: string[];
  onLanguageOrderChange: (newOrder: string[]) => void;
}

export function LanguageOrdering({
  allLanguages,
  languageOrder,
  onLanguageOrderChange,
}: LanguageOrderingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<string[]>(languageOrder);

  const orderedLanguages = currentOrder.map(code => 
    allLanguages.find(lang => lang.code === code)
  ).filter(Boolean) as Language[];

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
    
    if (dragIndex === dropIndex) return;
    
    const newOrder = [...currentOrder];
    const draggedItem = newOrder[dragIndex];
    
    // Remove the dragged item
    newOrder.splice(dragIndex, 1);
    
    // Insert at the new position
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setCurrentOrder(newOrder);
  };

  const moveLanguage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newOrder = [...currentOrder];
    const item = newOrder[fromIndex];
    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, item);
    
    setCurrentOrder(newOrder);
  };

  const handleSave = () => {
    onLanguageOrderChange(currentOrder);
    setIsOpen(false);
    toast.success("Language order updated successfully");
  };

  const handleCancel = () => {
    setCurrentOrder(languageOrder); // Reset to original order
    setIsOpen(false);
  };

  const resetToDefault = () => {
    const defaultOrder = ["ja", "ko", "en-us", "en-uk", "en-au"];
    setCurrentOrder(defaultOrder);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <LanguagesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-medium">Language Display Order</h4>
            <p className="text-sm text-muted-foreground">
              Customize the order languages appear in the interface
            </p>
          </div>
        </div>
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <GripVertical className="w-4 h-4 mr-2" />
            Customize Order
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reorder Languages</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {orderedLanguages.map((language, index) => (
              <div
                key={language.code}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-move hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{language.nativeName}</div>
                    <div className="text-sm text-muted-foreground">{language.name}</div>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveLanguage(index, Math.max(0, index - 1))}
                    disabled={index === 0}
                    className="h-8 w-8 p-0"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveLanguage(index, Math.min(orderedLanguages.length - 1, index + 1))}
                    disabled={index === orderedLanguages.length - 1}
                    className="h-8 w-8 p-0"
                  >
                    ↓
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={resetToDefault} className="flex-1">
              Reset to Default
            </Button>
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Current order preview */}
      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
        <p className="text-xs font-medium text-muted-foreground mb-2">CURRENT ORDER</p>
        <div className="flex flex-wrap gap-2">
          {orderedLanguages.map((language, index) => (
            <div
              key={language.code}
              className="flex items-center gap-1 px-2 py-1 bg-background rounded text-xs"
            >
              <span className="text-muted-foreground">{index + 1}.</span>
              <span>{language.nativeName}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}