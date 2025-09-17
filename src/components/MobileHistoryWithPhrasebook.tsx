import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Trash2, RotateCcw, Heart, Plus, FolderPlus, Edit3, MoreVertical, Folder, Search, X, Crown } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner@2.0.3";

interface MultiTranslationHistoryItem {
  id: string;
  sourceText: string;
  translations: Record<string, string>; // language code -> translation
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

interface SubscriptionPlan {
  id: 'free' | 'basic' | 'premium';
  name: string;
  phrasebookLimit: number;
  pdfExport: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
}

interface UserSubscription {
  planId: 'free' | 'basic' | 'premium';
  isActive: boolean;
  expiresAt: Date | null;
  cancelledAt: Date | null;
  willCancelAt: Date | null;
}

interface MobileHistoryWithPhrasebookProps {
  history: MultiTranslationHistoryItem[];
  phrasebook: MultiTranslationHistoryItem[];
  phrasebookCategories: PhrasebookCategory[];
  onSelectItem: (item: MultiTranslationHistoryItem) => void;
  onClearHistory: () => void;
  onToggleFavorite: (item: MultiTranslationHistoryItem, categoryId?: string) => void;
  onRemoveFromPhrasebook: (id: string) => void;
  onAddCategory: (name: string, color: string) => string;
  onUpdateCategory: (id: string, name: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
  onMoveToCategory: (itemId: string, categoryId: string) => void;
  allLanguages: { code: string; name: string; nativeName: string }[];
  userSubscription: UserSubscription;
  subscriptionPlans: SubscriptionPlan[];
  canAddToPhrasebook: () => boolean;
}

export function MobileHistoryWithPhrasebook({
  history,
  phrasebook,
  phrasebookCategories,
  onSelectItem,
  onClearHistory,
  onToggleFavorite,
  onRemoveFromPhrasebook,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onMoveToCategory,
  allLanguages,
  userSubscription,
  subscriptionPlans,
  canAddToPhrasebook,
}: MobileHistoryWithPhrasebookProps) {
  const [activeTab, setActiveTab] = useState("phrasebook");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PhrasebookCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  const getLanguageByCode = (code: string) => {
    return allLanguages.find(lang => lang.code === code);
  };

  const isInPhrasebook = (itemId: string) => {
    return phrasebook.some(item => item.id === itemId);
  };

  const getCategoryById = (id: string) => {
    return phrasebookCategories.find(cat => cat.id === id);
  };

  const searchInItem = (item: MultiTranslationHistoryItem, query: string) => {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return true;

    // Search in source text
    if (item.sourceText.toLowerCase().includes(searchTerm)) return true;

    // Search in translations
    const translationValues = Object.values(item.translations);
    if (translationValues.some(translation => translation.toLowerCase().includes(searchTerm))) return true;

    // Search in language names
    const sourceLang = getLanguageByCode(item.sourceLanguage);
    if (sourceLang && (
      sourceLang.name.toLowerCase().includes(searchTerm) ||
      sourceLang.nativeName.toLowerCase().includes(searchTerm)
    )) return true;

    // Search in category name for phrasebook items
    if (item.category) {
      const category = getCategoryById(item.category);
      if (category && category.name.toLowerCase().includes(searchTerm)) return true;
    }

    return false;
  };

  const getFilteredPhrasebook = () => {
    let filtered = phrasebook;
    
    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(item => searchInItem(item, searchQuery));
    }
    
    return filtered;
  };

  const getFilteredHistory = () => {
    if (!searchQuery.trim()) return history;
    return history.filter(item => searchInItem(item, searchQuery));
  };

  const getCategoryItemCount = (categoryId: string) => {
    return phrasebook.filter(item => item.category === categoryId).length;
  };

  const getCurrentPlan = () => {
    return subscriptionPlans.find(plan => plan.id === userSubscription.planId) || subscriptionPlans[0];
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  const handleSearchToggle = () => {
    if (isSearchActive && searchQuery) {
      handleClearSearch();
    } else {
      setIsSearchActive(!isSearchActive);
    }
  };

  const predefinedColors = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", 
    "#8b5cf6", "#06b6d4", "#84cc16", "#f97316",
    "#ec4899", "#6366f1", "#14b8a6", "#eab308"
  ];

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim(), newCategoryColor);
      setNewCategoryName("");
      setNewCategoryColor("#3b82f6");
      setIsAddCategoryOpen(false);
      toast.success("Category created successfully");
    }
  };

  const handleEditCategory = () => {
    if (editingCategory && newCategoryName.trim()) {
      onUpdateCategory(editingCategory.id, newCategoryName.trim(), newCategoryColor);
      setEditingCategory(null);
      setNewCategoryName("");
      setNewCategoryColor("#3b82f6");
      setIsEditCategoryOpen(false);
      toast.success("Category updated successfully");
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (categoryId === "general") {
      toast.error("Cannot delete General category");
      return;
    }
    onDeleteCategory(categoryId);
    if (selectedCategory === categoryId) {
      setSelectedCategory("all");
    }
    toast.success("Category deleted successfully");
  };

  const openEditCategory = (category: PhrasebookCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setIsEditCategoryOpen(true);
  };

  const renderHistoryItem = (item: MultiTranslationHistoryItem, showRemoveFromPhrasebook = false) => {
    const sourceLang = getLanguageByCode(item.sourceLanguage);
    const isFavorite = isInPhrasebook(item.id);
    const category = item.category ? getCategoryById(item.category) : null;
    
    return (
      <div
        key={item.id}
        className="bg-card rounded-2xl p-4 border border-border hover:bg-muted/30 transition-colors"
        onClick={() => onSelectItem(item)}
      >
        {/* Source language indicator */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full">
            {sourceLang?.nativeName || item.sourceLanguage}
          </span>
          <span className="text-xs text-muted-foreground">→</span>
          <span className="text-xs text-muted-foreground">All languages</span>
          
          {/* Tone badge */}
          {item.tone && (
            <Badge variant="outline" className="text-xs">
              {item.tone.charAt(0).toUpperCase() + item.tone.slice(1)} Style
            </Badge>
          )}
          
          {/* Category badge for phrasebook items */}
          {showRemoveFromPhrasebook && category && (
            <Badge 
              variant="secondary" 
              className="text-xs"
              style={{ backgroundColor: `${category.color}20`, color: category.color }}
            >
              {category.name}
            </Badge>
          )}
          
          <div className="ml-auto flex items-center gap-1">
            {/* More options for phrasebook items */}
            {showRemoveFromPhrasebook && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    <Folder className="w-4 h-4 mr-2" />
                    Move to Category
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {phrasebookCategories.map(cat => (
                    <DropdownMenuItem 
                      key={cat.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveToCategory(item.id, cat.id);
                        toast.success(`Moved to ${cat.name}`);
                      }}
                      className="pl-6"
                    >
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Favorite button */}
            <Button
              variant="ghost"
              size="icon"
              className={`w-8 h-8 rounded-full ${isFavorite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (showRemoveFromPhrasebook) {
                  onRemoveFromPhrasebook(item.id);
                  toast.success("Removed from phrasebook");
                } else {
                  if (isFavorite) {
                    onToggleFavorite(item);
                    toast.success("Removed from phrasebook");
                  } else {
                    // Check if user can add to phrasebook
                    if (!canAddToPhrasebook()) {
                      const currentPlan = getCurrentPlan();
                      toast.error(`Phrasebook limit reached (${currentPlan.phrasebookLimit} phrases). Upgrade to add more.`);
                      return;
                    }
                    onToggleFavorite(item);
                    toast.success("Added to phrasebook");
                  }
                }
              }}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
            
            {/* Reuse button */}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onSelectItem(item);
              }}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Source text */}
        <p className="text-sm mb-3 line-clamp-2 font-medium">{item.sourceText}</p>
        
        {/* Translations */}
        <div className="space-y-2 mb-3">
          {Object.entries(item.translations).map(([langCode, translation]) => {
            const lang = getLanguageByCode(langCode);
            return (
              <div key={langCode} className="flex items-start gap-2">

                <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                  {translation}
                </p>
              </div>
            );
          })}
        </div>
        
        {/* Timestamp */}
        <p className="text-xs text-muted-foreground">
          {item.timestamp.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    );
  };

  const EmptyState = ({ title, description, icon: Icon }: { title: string; description: string; icon: any }) => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">
          {description}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-border">
        {isSearchActive ? (
          <div className="flex items-center gap-2 p-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab === "phrasebook" ? "phrasebook" : "history"}...`}
                className="pl-10 pr-10"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8"
                  onClick={handleClearSearch}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearchToggle}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-medium">History & Phrasebook</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSearchToggle}
              >
                <Search className="w-4 h-4" />
              </Button>
              {activeTab === "history" && history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearHistory}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value);
          // Clear search when switching tabs
          if (searchQuery) {
            setSearchQuery("");
          }
        }} 
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
          <TabsTrigger value="phrasebook">
            Phrasebook
            {phrasebook.length > 0 && (
              <span className={`ml-1 text-xs rounded-full px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center ${
                phrasebook.length >= getCurrentPlan().phrasebookLimit 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-primary text-primary-foreground'
              }`}>
                {phrasebook.length}/{getCurrentPlan().phrasebookLimit}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="phrasebook" className="flex-1 flex flex-col mt-0">
          {phrasebook.length === 0 ? (
            <EmptyState
              title="No saved phrases"
              description="Tap the heart icon on any translation to save it to your phrasebook"
              icon={Heart}
            />
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Subscription Status Banner */}
              {(phrasebook.length >= getCurrentPlan().phrasebookLimit * 0.8) && (
                <div className={`mx-4 mt-4 p-3 rounded-lg border ${
                  phrasebook.length >= getCurrentPlan().phrasebookLimit
                    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <Crown className={`w-4 h-4 ${
                      phrasebook.length >= getCurrentPlan().phrasebookLimit ? 'text-red-600' : 'text-amber-600'
                    }`} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        phrasebook.length >= getCurrentPlan().phrasebookLimit 
                          ? 'text-red-800 dark:text-red-200' 
                          : 'text-amber-800 dark:text-amber-200'
                      }`}>
                        {phrasebook.length >= getCurrentPlan().phrasebookLimit
                          ? 'Phrasebook limit reached!'
                          : 'Phrasebook almost full'
                        }
                      </p>
                      <p className={`text-xs ${
                        phrasebook.length >= getCurrentPlan().phrasebookLimit 
                          ? 'text-red-600 dark:text-red-300' 
                          : 'text-amber-600 dark:text-amber-300'
                      }`}>
                        {phrasebook.length >= getCurrentPlan().phrasebookLimit
                          ? 'Upgrade to save more phrases'
                          : `${getCurrentPlan().phrasebookLimit - phrasebook.length} phrases remaining`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Category Filter & Management - Hide when searching */}
              {!searchQuery.trim() && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Categories ({phrasebook.length})
                        </SelectItem>
                        {phrasebookCategories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name} ({getCategoryItemCount(category.id)})
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Category</DialogTitle>
                          <DialogDescription>
                            Create a new category to organize your phrasebook items.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="categoryName">Category Name</Label>
                            <Input
                              id="categoryName"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder="Enter category name"
                            />
                          </div>
                          <div>
                            <Label>Category Color</Label>
                            <div className="grid grid-cols-6 gap-2 mt-2">
                              {predefinedColors.map(color => (
                                <button
                                  key={color}
                                  className={`w-8 h-8 rounded-full border-2 ${
                                    newCategoryColor === color ? 'border-foreground' : 'border-border'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => setNewCategoryColor(color)}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                            Add Category
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {/* Category chips */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        selectedCategory === "all" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      All ({phrasebook.length})
                    </button>
                    {phrasebookCategories.map(category => (
                      <div key={category.id} className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedCategory(category.id)}
                          className={`px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1 ${
                            selectedCategory === category.id 
                              ? "text-white" 
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                          style={{
                            backgroundColor: selectedCategory === category.id ? category.color : undefined
                          }}
                        >
                          <div 
                            className={`w-2 h-2 rounded-full ${selectedCategory === category.id ? 'bg-white/30' : ''}`}
                            style={{ 
                              backgroundColor: selectedCategory === category.id ? 'white' : category.color 
                            }}
                          />
                          {category.name} ({getCategoryItemCount(category.id)})
                        </button>
                        {category.id !== "general" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-5 h-5 p-0">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => openEditCategory(category)}>
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCategory(category.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Search Results Info */}
              {searchQuery.trim() && (
                <div className="px-4 py-2 bg-muted/30 border-b border-border">
                  <p className="text-sm text-muted-foreground">
                    {getFilteredPhrasebook().length} results for "{searchQuery}"
                  </p>
                </div>
              )}
              
              {/* Filtered Items */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {getFilteredPhrasebook().map((item) => renderHistoryItem(item, true))}
                  {getFilteredPhrasebook().length === 0 && !searchQuery.trim() && selectedCategory !== "all" && (
                    <div className="text-center py-8">
                      <Folder className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No phrases in this category</p>
                    </div>
                  )}
                  {getFilteredPhrasebook().length === 0 && searchQuery.trim() && (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No phrases found for "{searchQuery}"</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Try searching with different keywords or check spelling
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {/* Edit Category Dialog */}
              <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Category</DialogTitle>
                    <DialogDescription>
                      Modify the name and color of this category.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="editCategoryName">Category Name</Label>
                      <Input
                        id="editCategoryName"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter category name"
                      />
                    </div>
                    <div>
                      <Label>Category Color</Label>
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {predefinedColors.map(color => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 ${
                              newCategoryColor === color ? 'border-foreground' : 'border-border'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewCategoryColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditCategory} disabled={!newCategoryName.trim()}>
                      Update Category
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="flex-1 flex flex-col mt-0">
          {history.length === 0 ? (
            <EmptyState
              title="No translation history"
              description="Your translation history will appear here"
              icon={RotateCcw}
            />
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Search Results Info */}
              {searchQuery.trim() && (
                <div className="px-4 py-2 bg-muted/30 border-b border-border">
                  <p className="text-sm text-muted-foreground">
                    {getFilteredHistory().length} results for "{searchQuery}"
                  </p>
                </div>
              )}
              
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {getFilteredHistory().map((item) => renderHistoryItem(item))}
                  {getFilteredHistory().length === 0 && searchQuery.trim() && (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No history found for "{searchQuery}"</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Try searching with different keywords or check spelling
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}