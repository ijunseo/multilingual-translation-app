import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ChevronLeft, ChevronRight, RotateCcw, Volume2, Heart, History, Shuffle, Play, Pause, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface MultiTranslationHistoryItem {
  id: string;
  sourceText: string;
  translations: Record<string, string>;
  sourceLanguage: string;
  timestamp: Date;
  category?: string;
  tone?: string; // Translation tone used
}

interface PhrasebookCategory {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

interface MobileFlashCardProps {
  history: MultiTranslationHistoryItem[];
  phrasebook: MultiTranslationHistoryItem[];
  phrasebookCategories: PhrasebookCategory[];
  allLanguages: { code: string; name: string; nativeName: string }[];
  onSpeak: (text: string, language: string) => void;
}

interface SwipeResult {
  cardId: string;
  understood: boolean;
}

export function MobileFlashCard({
  history,
  phrasebook,
  phrasebookCategories,
  allLanguages,
  onSpeak,
}: MobileFlashCardProps) {
  const [activeTab, setActiveTab] = useState("select");
  const [selectedItems, setSelectedItems] = useState<MultiTranslationHistoryItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState<NodeJS.Timeout | null>(null);
  const [swipeResults, setSwipeResults] = useState<SwipeResult[]>([]);
  const [cardTransform, setCardTransform] = useState({ x: 0, rotation: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  // Define these early so they can be used in callbacks
  const currentCard = selectedItems[currentCardIndex];
  const understoodCount = swipeResults.filter(r => r.understood).length;
  const notUnderstoodCount = swipeResults.filter(r => !r.understood).length;

  const getLanguageByCode = (code: string) => {
    return allLanguages.find(lang => lang.code === code);
  };

  const getCategoryById = (id: string) => {
    return phrasebookCategories.find(cat => cat.id === id);
  };

  const getPhrasebookByCategory = (categoryId: string) => {
    return phrasebook.filter(item => item.category === categoryId);
  };

  const getCategoryItemCount = (categoryId: string) => {
    return phrasebook.filter(item => item.category === categoryId).length;
  };

  const startFlashCardSession = (items: MultiTranslationHistoryItem[]) => {
    if (items.length === 0) {
      toast.error("No items selected for flash cards");
      return;
    }
    setSelectedItems(items);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSwipeResults([]);
    setCardTransform({ x: 0, rotation: 0 });
    setActiveTab("study");
    toast.success(`Starting flash card session with ${items.length} cards`);
  };

  const shuffleCards = () => {
    const shuffled = [...selectedItems].sort(() => Math.random() - 0.5);
    setSelectedItems(shuffled);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSwipeResults([]);
    setCardTransform({ x: 0, rotation: 0 });
    toast.success("Cards shuffled");
  };

  const nextCard = () => {
    setCardTransform({ x: 0, rotation: 0 });
    if (currentCardIndex < selectedItems.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      // Show results
      setActiveTab("results");
    }
  };

  const prevCard = () => {
    setCardTransform({ x: 0, rotation: 0 });
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const toggleAutoPlay = () => {
    if (isAutoPlay) {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        setAutoPlayInterval(null);
      }
      setIsAutoPlay(false);
      toast.success("Auto-play stopped");
    } else {
      const interval = setInterval(() => {
        if (!isFlipped) {
          setIsFlipped(true);
        } else {
          nextCard();
        }
      }, 3000);
      setAutoPlayInterval(interval);
      setIsAutoPlay(true);
      toast.success("Auto-play started");
    }
  };

  useEffect(() => {
    return () => {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
    };
  }, [autoPlayInterval]);

  // Swipe gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAutoPlay) return;
    
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    currentPos.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  }, [isAutoPlay]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || isAutoPlay) return;
    
    const touch = e.touches[0];
    currentPos.current = { x: touch.clientX, y: touch.clientY };
    
    const deltaX = currentPos.current.x - startPos.current.x;
    const maxSwipe = 150;
    const rotation = (deltaX / maxSwipe) * 15; // Max 15 degrees rotation
    
    setCardTransform({
      x: deltaX,
      rotation: Math.max(-15, Math.min(15, rotation))
    });
  }, [isDragging, isAutoPlay]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || isAutoPlay) return;
    
    const deltaX = currentPos.current.x - startPos.current.x;
    const threshold = 100;
    
    if (Math.abs(deltaX) > threshold && currentCard) {
      const understood = deltaX > 0; // Right swipe = understood
      
      // Record the result
      setSwipeResults(prev => [
        ...prev.filter(r => r.cardId !== currentCard.id), // Remove existing result for this card
        { cardId: currentCard.id, understood }
      ]);
      
      // Show feedback
      if (understood) {
        toast.success("理解した！", { duration: 1000 });
      } else {
        toast.error("分からない", { duration: 1000 });
      }
      
      // Move to next card after a short delay
      setTimeout(() => {
        nextCard();
      }, 300);
    } else {
      // Reset card position
      setCardTransform({ x: 0, rotation: 0 });
    }
    
    setIsDragging(false);
  }, [isDragging, isAutoPlay, currentCard, nextCard]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isAutoPlay) return;
    
    startPos.current = { x: e.clientX, y: e.clientY };
    currentPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  }, [isAutoPlay]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || isAutoPlay) return;
    
    currentPos.current = { x: e.clientX, y: e.clientY };
    
    const deltaX = currentPos.current.x - startPos.current.x;
    const maxSwipe = 150;
    const rotation = (deltaX / maxSwipe) * 15;
    
    setCardTransform({
      x: deltaX,
      rotation: Math.max(-15, Math.min(15, rotation))
    });
  }, [isDragging, isAutoPlay]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || isAutoPlay) return;
    
    const deltaX = currentPos.current.x - startPos.current.x;
    const threshold = 100;
    
    if (Math.abs(deltaX) > threshold && currentCard) {
      const understood = deltaX > 0;
      
      setSwipeResults(prev => [
        ...prev.filter(r => r.cardId !== currentCard.id),
        { cardId: currentCard.id, understood }
      ]);
      
      if (understood) {
        toast.success("理解した！", { duration: 1000 });
      } else {
        toast.error("分からない", { duration: 1000 });
      }
      
      setTimeout(() => {
        nextCard();
      }, 300);
    } else {
      setCardTransform({ x: 0, rotation: 0 });
    }
    
    setIsDragging(false);
  }, [isDragging, isAutoPlay, currentCard, nextCard]);

  // Mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const markAsUnderstood = useCallback(() => {
    if (!currentCard) return;
    
    setSwipeResults(prev => [
      ...prev.filter(r => r.cardId !== currentCard.id),
      { cardId: currentCard.id, understood: true }
    ]);
    
    toast.success("理解した！", { duration: 1000 });
    setTimeout(() => {
      nextCard();
    }, 300);
  }, [currentCard, nextCard]);

  const markAsNotUnderstood = useCallback(() => {
    if (!currentCard) return;
    
    setSwipeResults(prev => [
      ...prev.filter(r => r.cardId !== currentCard.id),
      { cardId: currentCard.id, understood: false }
    ]);
    
    toast.error("分からない", { duration: 1000 });
    setTimeout(() => {
      nextCard();
    }, 300);
  }, [currentCard, nextCard]);

  const renderItemCard = (item: MultiTranslationHistoryItem, isFromPhrasebook: boolean = false) => {
    const sourceLang = getLanguageByCode(item.sourceLanguage);
    const category = item.category ? getCategoryById(item.category) : null;
    
    return (
      <Card key={item.id} className="p-4 border border-border hover:bg-muted/30 transition-colors">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            {/* Source language indicator */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {sourceLang?.nativeName || item.sourceLanguage}
              </Badge>
              {isFromPhrasebook && (
                <Heart className="w-4 h-4 text-red-500 fill-current" />
              )}
              {item.tone && (
                <Badge variant="outline" className="text-xs">
                  {item.tone.charAt(0).toUpperCase() + item.tone.slice(1)}
                </Badge>
              )}
              {isFromPhrasebook && category && (
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{ backgroundColor: `${category.color}20`, color: category.color }}
                >
                  {category.name}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {item.timestamp.toLocaleDateString()}
              </span>
            </div>
            
            {/* Source text */}
            <p className="font-medium mb-3 line-clamp-2">{item.sourceText}</p>
            
            {/* Translations preview */}
            <div className="space-y-1">
              {Object.entries(item.translations).slice(0, 2).map(([langCode, translation]) => {
                const lang = getLanguageByCode(langCode);
                return (
                  <div key={langCode} className="flex items-start">
                    <p className="text-sm text-muted-foreground line-clamp-1 flex-1">
                      {translation}
                    </p>
                  </div>
                );
              })}
              {Object.keys(item.translations).length > 2 && (
                <p className="text-xs text-muted-foreground">
                  +{Object.keys(item.translations).length - 2} more translations
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const SelectionScreen = () => (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-4 border-b border-border flex-shrink-0">
        <h2 className="text-lg font-medium mb-2">Select Flash Cards</h2>
        <p className="text-sm text-muted-foreground">
          Choose items from your history or phrasebook to create flash cards
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center gap-2"
              onClick={() => startFlashCardSession(phrasebook)}
              disabled={phrasebook.length === 0}
            >
              <Heart className="w-5 h-5" />
              <span className="text-sm">All Phrasebook ({phrasebook.length})</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center gap-2"
              onClick={() => startFlashCardSession(history.slice(0, 10))}
              disabled={history.length === 0}
            >
              <History className="w-5 h-5" />
              <span className="text-sm">Recent History ({Math.min(history.length, 10)})</span>
            </Button>
          </div>

          {/* Category quick actions */}
          {phrasebookCategories.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Study by Category</h3>
              <div className="grid grid-cols-2 gap-2">
                {phrasebookCategories.map(category => {
                  const itemCount = getCategoryItemCount(category.id);
                  return (
                    <Button
                      key={category.id}
                      variant="outline"
                      className="h-12 flex items-center gap-2 justify-start"
                      onClick={() => startFlashCardSession(getPhrasebookByCategory(category.id))}
                      disabled={itemCount === 0}
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm truncate">{category.name} ({itemCount})</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Individual selection */}
          <Tabs defaultValue="phrasebook" className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="phrasebook">
                Phrasebook ({phrasebook.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                History ({history.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="phrasebook" className="mt-4">
              {phrasebook.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No saved phrases</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {phrasebook.map((item) => (
                    <div key={item.id} onClick={() => startFlashCardSession([item])}>
                      {renderItemCard(item, true)}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No translation history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 20).map((item) => (
                    <div key={item.id} onClick={() => startFlashCardSession([item])}>
                      {renderItemCard(item)}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );

  const StudyScreen = () => {
    if (!currentCard) return null;

    const sourceLang = getLanguageByCode(currentCard.sourceLanguage);

    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setActiveTab("select")}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          
          <div className="text-center">
            <p className="text-sm font-medium">
              {currentCardIndex + 1} / {selectedItems.length}
            </p>
            <p className="text-xs text-muted-foreground">Flash Cards</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={shuffleCards}>
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleAutoPlay}>
              {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Flash Card */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative">
          {/* Swipe instructions */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 text-xs text-muted-foreground z-10">
            <div className="flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>← 分からない</span>
            </div>
            <div className="flex items-center gap-1">
              <span>理解した →</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          </div>
          
          {/* Progress indicators */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>{understoodCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-3 h-3 text-red-500" />
              <span>{notUnderstoodCount}</span>
            </div>
          </div>
          
          <div
            ref={cardRef}
            className="w-full max-w-md h-80 cursor-pointer select-none"
            style={{
              transform: `translateX(${cardTransform.x}px) rotate(${cardTransform.rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <Card 
              className={`w-full h-full border-2 transition-all duration-300 hover:shadow-lg ${
                cardTransform.x > 50 ? 'border-green-500 bg-green-50' :
                cardTransform.x < -50 ? 'border-red-500 bg-red-50' : ''
              }`}
              onClick={(e) => {
                if (!isDragging && Math.abs(cardTransform.x) < 10) {
                  setIsFlipped(!isFlipped);
                }
              }}
            >
              <div className="h-full p-6 flex flex-col">
                {!isFlipped ? (
                  // Front side - Source text
                  <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
                      <Badge>
                        {sourceLang?.nativeName || currentCard.sourceLanguage}
                      </Badge>
                      {currentCard.tone && (
                        <Badge variant="outline" className="text-xs">
                          {currentCard.tone.charAt(0).toUpperCase() + currentCard.tone.slice(1)} Style
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-lg font-medium mb-4 leading-relaxed break-words">
                      {currentCard.sourceText}
                    </p>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSpeak(currentCard.sourceText, currentCard.sourceLanguage);
                      }}
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      Listen
                    </Button>
                    
                    <p className="text-xs text-muted-foreground mt-4">
                      Tap to see translations
                    </p>
                  </div>
                ) : (
                  // Back side - Translations
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="text-center mb-4 flex-shrink-0">
                      <Badge variant="secondary">Translations</Badge>
                    </div>
                    
                    <ScrollArea className="flex-1 min-h-0">
                      <div className="space-y-3">
                        {Object.entries(currentCard.translations).map(([langCode, translation]) => {
                          const lang = getLanguageByCode(langCode);
                          return (
                            <div key={langCode} className="p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                  {lang?.nativeName || langCode}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSpeak(translation, langCode);
                                  }}
                                >
                                  <Volume2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="text-sm leading-relaxed break-words">{translation}</p>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                    
                    <p className="text-xs text-muted-foreground text-center mt-4 flex-shrink-0">
                      Tap to see source text
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Swipe Action Buttons */}
        <div className="flex items-center justify-center gap-4 p-4 border-t border-border flex-shrink-0">
          <Button 
            variant="outline" 
            size="lg"
            onClick={markAsNotUnderstood}
            className="flex-1 max-w-32 border-red-200 text-red-600 hover:bg-red-50"
          >
            <XCircle className="w-5 h-5 mr-2" />
            分からない
          </Button>
          
          <Button 
            variant="outline" 
            onClick={prevCard}
            disabled={currentCardIndex === 0}
            className="px-3"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" onClick={() => setIsFlipped(!isFlipped)} className="px-3">
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button 
            onClick={nextCard}
            disabled={currentCardIndex === selectedItems.length - 1}
            className="px-3"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <Button 
            size="lg"
            onClick={markAsUnderstood}
            className="flex-1 max-w-32 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            理解した
          </Button>
        </div>
      </div>
    );
  };

  const ResultsScreen = () => {
    const totalCards = selectedItems.length;
    const reviewedCards = swipeResults.length;
    const percentage = reviewedCards > 0 ? Math.round((understoodCount / reviewedCards) * 100) : 0;
    
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-medium mb-2">学習結果</h2>
          <p className="text-sm text-muted-foreground">
            フラッシュカードセッションが完了しました
          </p>
        </div>

        <div className="flex-1 p-4">
          <div className="max-w-md mx-auto space-y-6">
            {/* Overall Statistics */}
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-3xl font-bold mb-2">{percentage}%</div>
              <p className="text-sm text-muted-foreground">理解度</p>
            </div>

            {/* Detailed Results */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-xl font-semibold text-green-700">{understoodCount}</div>
                <p className="text-sm text-green-600">理解した</p>
              </div>
              
              <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-xl font-semibold text-red-700">{notUnderstoodCount}</div>
                <p className="text-sm text-red-600">分からない</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setCurrentCardIndex(0);
                  setIsFlipped(false);
                  setSwipeResults([]);
                  setCardTransform({ x: 0, rotation: 0 });
                  setActiveTab("study");
                }}
                className="w-full"
                size="lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                もう一度学習する
              </Button>
              
              {notUnderstoodCount > 0 && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    const notUnderstoodCards = selectedItems.filter(item => 
                      swipeResults.find(r => r.cardId === item.id && !r.understood)
                    );
                    setSelectedItems(notUnderstoodCards);
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                    setSwipeResults([]);
                    setCardTransform({ x: 0, rotation: 0 });
                    setActiveTab("study");
                  }}
                  className="w-full"
                  size="lg"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  分からないカードを復習 ({notUnderstoodCount})
                </Button>
              )}
              
              <Button 
                variant="ghost"
                onClick={() => setActiveTab("select")}
                className="w-full"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                カード選択に戻る
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {activeTab === "select" ? <SelectionScreen /> : 
       activeTab === "results" ? <ResultsScreen /> : <StudyScreen />}
    </div>
  );
}