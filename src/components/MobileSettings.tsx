import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { toast } from "sonner@2.0.3";
import { Download, FileText, Crown, Star, Check, Zap, AlertTriangle, RefreshCw, X } from "lucide-react";
import { LanguageOrdering } from "./LanguageOrdering";

export type TranslationDirection = 
  | "ja-to-en-ko"   // Japanese -> English, Korean
  | "ko-to-ja-en"   // Korean -> Japanese, English  
  | "en-to-ja-ko"   // English -> Japanese, Korean
  | "all-to-all";   // All directions (default)

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface MultiTranslationHistoryItem {
  id: string;
  sourceText: string;
  translations: Record<string, string>;
  sourceLanguage: string;
  timestamp: Date;
  category?: string;
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

interface MobileSettingsProps {
  translationDirection: TranslationDirection;
  onTranslationDirectionChange: (direction: TranslationDirection) => void;
  enabledLanguages: string[];
  onLanguageToggle: (languageCode: string) => void;
  allLanguages: Language[];
  languageOrder: string[];
  onLanguageOrderChange: (newOrder: string[]) => void;
  phrasebook: MultiTranslationHistoryItem[];
  phrasebookCategories: PhrasebookCategory[];
  userSubscription: UserSubscription;
  subscriptionPlans: SubscriptionPlan[];
  onUpgradeSubscription: (planId: 'basic' | 'premium', billingCycle: 'monthly' | 'yearly') => void;
  onCancelSubscription: (immediate?: boolean) => void;
  onReactivateSubscription: () => void;
}

export function MobileSettings({
  translationDirection,
  onTranslationDirectionChange,
  enabledLanguages,
  onLanguageToggle,
  allLanguages,
  languageOrder,
  onLanguageOrderChange,
  phrasebook,
  phrasebookCategories,
  userSubscription,
  subscriptionPlans,
  onUpgradeSubscription,
  onCancelSubscription,
  onReactivateSubscription,
}: MobileSettingsProps) {
  
  const getCurrentPlan = () => {
    return subscriptionPlans.find(plan => plan.id === userSubscription.planId) || subscriptionPlans[0];
  };

  const handleLanguageChange = (languageCode: string, checked: boolean) => {
    if (!checked && enabledLanguages.length <= 2) {
      toast.error("At least 2 languages must be enabled");
      return;
    }
    onLanguageToggle(languageCode);
    
    if (checked) {
      toast.success(`${allLanguages.find(l => l.code === languageCode)?.name} enabled`);
    } else {
      toast.success(`${allLanguages.find(l => l.code === languageCode)?.name} disabled`);
    }
  };

  const handleUpgrade = (planId: 'basic' | 'premium', billingCycle: 'monthly' | 'yearly') => {
    onUpgradeSubscription(planId, billingCycle);
    toast.success(`Upgraded to ${planId === 'basic' ? 'Basic' : 'Premium'} plan!`);
  };

  const handleCancelSubscription = (immediate: boolean = false) => {
    onCancelSubscription(immediate);
    if (immediate) {
      toast.success("Subscription cancelled immediately");
    } else {
      toast.success("Subscription will be cancelled at the end of the current period");
    }
  };

  const handleReactivateSubscription = () => {
    onReactivateSubscription();
    toast.success("Subscription reactivated successfully!");
  };



  const generatePhrasebookPDF = async () => {
    if (phrasebook.length === 0) {
      toast.error("No phrases in phrasebook to export");
      return;
    }

    const currentPlan = getCurrentPlan();
    if (!currentPlan.pdfExport) {
      toast.error("PDF export is only available for Basic and Premium plans");
      return;
    }

    try {
      // Create HTML content for the PDF
      const htmlContent = generatePhrasebookHTML();
      
      // Create a temporary window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Please allow pop-ups to export PDF");
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          toast.success("PDF export window opened! Use your browser's print dialog to save as PDF.");
        }, 500);
      };
      
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const generatePhrasebookHTML = () => {
    // Group phrases by category
    const categorizedPhrases = phrasebookCategories.map(category => ({
      category,
      phrases: phrasebook.filter(phrase => phrase.category === category.id)
    })).filter(group => group.phrases.length > 0);

    // Add uncategorized phrases
    const uncategorizedPhrases = phrasebook.filter(phrase => 
      !phrase.category || !phrasebookCategories.find(cat => cat.id === phrase.category)
    );
    if (uncategorizedPhrases.length > 0) {
      categorizedPhrases.push({
        category: { id: 'uncategorized', name: 'Uncategorized', color: '#666666', createdAt: new Date() },
        phrases: uncategorizedPhrases
      });
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>My Phrasebook</title>
        <style>
          @page {
            margin: 20mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 10px 0;
            color: #030213;
          }
          .date {
            font-size: 14px;
            color: #666;
            margin: 0;
          }
          .category {
            margin: 30px 0 20px 0;
            page-break-inside: avoid;
          }
          .category-header {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ddd;
            color: #030213;
          }
          .phrase {
            margin: 20px 0;
            padding: 15px;
            background: #fafafa;
            border-radius: 8px;
            page-break-inside: avoid;
          }
          .source-lang, .target-lang {
            margin: 8px 0;
          }
          .lang-label {
            font-weight: bold;
            font-size: 14px;
            color: #666;
            margin-bottom: 4px;
          }
          .lang-text {
            font-size: 16px;
            line-height: 1.4;
            margin-left: 10px;
          }
          .source-text {
            color: #030213;
            font-weight: 500;
          }
          .translation-text {
            color: #333;
          }
          .stats {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">My Phrasebook</h1>
          <p class="date">Generated on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>

        ${categorizedPhrases.map(group => `
          <div class="category">
            <h2 class="category-header">${group.category.name}</h2>
            ${group.phrases.map(phrase => {
              const sourceLang = allLanguages.find(lang => lang.code === phrase.sourceLanguage);
              return `
                <div class="phrase">
                  <div class="source-lang">
                    <div class="lang-label">${sourceLang?.nativeName || phrase.sourceLanguage}</div>
                    <div class="lang-text source-text">${phrase.sourceText}</div>
                  </div>
                  ${Object.entries(phrase.translations).map(([langCode, translation]) => {
                    const lang = allLanguages.find(l => l.code === langCode);
                    if (!lang || !translation.trim()) return '';
                    return `
                      <div class="target-lang">
                        <div class="lang-label">${lang.nativeName}</div>
                        <div class="lang-text translation-text">${translation}</div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `;
            }).join('')}
          </div>
        `).join('')}

        <div class="stats">
          <p>Total phrases: ${phrasebook.length} | Categories: ${categorizedPhrases.length}</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b border-border">
        <h2 className="text-lg font-medium">Settings</h2>
      </div>
      
      {/* Settings Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Language Selection Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium mb-2">Translation Languages</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select which languages to include in translations. At least 2 languages must be enabled.
              </p>
            </div>
            
            <LanguageOrdering
              allLanguages={allLanguages}
              languageOrder={languageOrder}
              onLanguageOrderChange={onLanguageOrderChange}
            />
          </div>

          {/* Language Order Section */}
          <div className="space-y-4 pt-6 border-t border-border">
            <div>
              <h3 className="text-base font-medium mb-2">Language Order</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Customize the order languages appear in translation results and interface.
              </p>
            </div>
            
            <LanguageOrdering
              allLanguages={allLanguages}
              languageOrder={languageOrder}
              onLanguageOrderChange={onLanguageOrderChange}
            />
          </div>

          {/* Export Section */}
          <div className="space-y-4 pt-6 border-t border-border">
            <div>
              <h3 className="text-base font-medium mb-2">Export</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Export your saved phrases and phrasebook data.
              </p>
            </div>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Export Phrasebook as PDF</h4>
                    <p className="text-sm text-muted-foreground">
                      {phrasebook.length} phrases ready for export
                    </p>
                  </div>
                </div>
                <Badge variant={getCurrentPlan().pdfExport ? "default" : "secondary"}>
                  {getCurrentPlan().pdfExport ? "Available" : "Premium Only"}
                </Badge>
              </div>
              
              <Button
                onClick={generatePhrasebookPDF}
                disabled={phrasebook.length === 0 || !getCurrentPlan().pdfExport}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              
              {!getCurrentPlan().pdfExport && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  PDF export is available with Basic and Premium plans
                </p>
              )}
            </Card>
          </div>

          {/* Subscription Section */}
          <div className="space-y-4 pt-6 border-t border-border">
            <div>
              <h3 className="text-base font-medium mb-2">Subscription</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade your plan to unlock more features and increase your phrasebook limit.
              </p>
            </div>

            {/* Current Plan Status */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    userSubscription.planId === 'free' ? 'bg-muted' :
                    userSubscription.planId === 'basic' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    {userSubscription.planId === 'free' ? (
                      <Star className="w-5 h-5 text-muted-foreground" />
                    ) : userSubscription.planId === 'basic' ? (
                      <Zap className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Crown className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{getCurrentPlan().name} Plan</h4>
                    <p className="text-sm text-muted-foreground">
                      {phrasebook.length} / {getCurrentPlan().phrasebookLimit} phrases used
                    </p>
                  </div>
                </div>
                <Badge variant={
                  userSubscription.planId === 'free' ? 'secondary' : 
                  userSubscription.willCancelAt ? 'destructive' : 'default'
                }>
                  {userSubscription.planId === 'free' ? 'Free' : 
                   userSubscription.willCancelAt ? 'Cancelling' : 'Active'}
                </Badge>
              </div>

              {/* Subscription Status Info */}
              <div className="space-y-2 mb-4">
                {userSubscription.expiresAt && !userSubscription.willCancelAt && (
                  <p className="text-xs text-muted-foreground">
                    Expires: {userSubscription.expiresAt.toLocaleDateString()}
                  </p>
                )}
                
                {userSubscription.willCancelAt && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                          Subscription Cancelled
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-300">
                          Will downgrade to Free on {userSubscription.willCancelAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {userSubscription.cancelledAt && userSubscription.planId === 'free' && (
                  <div className="bg-muted rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">
                      Subscription cancelled on {userSubscription.cancelledAt.toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Plan Features */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Up to {getCurrentPlan().phrasebookLimit} saved phrases</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {getCurrentPlan().pdfExport ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <span className="w-4 h-4 text-muted-foreground">×</span>
                  )}
                  <span className={getCurrentPlan().pdfExport ? '' : 'text-muted-foreground'}>
                    PDF Export
                  </span>
                </div>
              </div>

              {/* Subscription Management Buttons */}
              <div className="space-y-2">
                {userSubscription.planId === 'free' && !userSubscription.cancelledAt && (
                  <>
                    <Button
                      onClick={() => handleUpgrade('basic', 'monthly')}
                      className="w-full"
                      variant="outline"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Upgrade to Basic (¥580/month)
                    </Button>
                    <Button
                      onClick={() => handleUpgrade('premium', 'monthly')}
                      className="w-full"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Premium (¥1,800/month)
                    </Button>
                  </>
                )}

                {userSubscription.planId === 'basic' && !userSubscription.willCancelAt && (
                  <>
                    <Button
                      onClick={() => handleUpgrade('premium', 'monthly')}
                      className="w-full mb-2"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Premium (¥1,800/month)
                    </Button>
                    <div className="flex gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            Cancel Subscription
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                            <AlertDialogDescription>
                              Your subscription will remain active until the end of your current billing period ({userSubscription.expiresAt?.toLocaleDateString()}). You'll still have access to all features until then.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleCancelSubscription(false)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Cancel at Period End
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}

                {userSubscription.planId === 'premium' && !userSubscription.willCancelAt && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        Cancel Subscription
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Premium Subscription</AlertDialogTitle>
                        <AlertDialogDescription>
                          Your subscription will remain active until the end of your current billing period ({userSubscription.expiresAt?.toLocaleDateString()}). You'll still have access to all Premium features until then.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleCancelSubscription(false)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Cancel at Period End
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {userSubscription.willCancelAt && (
                  <Button
                    onClick={handleReactivateSubscription}
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reactivate Subscription
                  </Button>
                )}
              </div>
            </Card>

            {/* Pricing Plans */}
            {userSubscription.planId === 'free' && (
              <Card className="p-4">
                <h4 className="font-medium mb-4">Choose Your Plan</h4>
                <Tabs defaultValue="monthly" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="yearly">Yearly</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="monthly" className="space-y-4 mt-4">
                    {subscriptionPlans.slice(1).map((plan) => (
                      <div key={plan.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{plan.name}</h5>
                          <span className="font-bold">¥{plan.monthlyPrice.toLocaleString()}/month</span>
                        </div>
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-3 h-3" />
                            {plan.phrasebookLimit} saved phrases
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-3 h-3" />
                            PDF Export
                          </div>
                        </div>
                        <Button
                          onClick={() => handleUpgrade(plan.id as 'basic' | 'premium', 'monthly')}
                          size="sm"
                          className="w-full"
                          variant={plan.id === 'premium' ? 'default' : 'outline'}
                        >
                          Choose {plan.name}
                        </Button>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="yearly" className="space-y-4 mt-4">
                    {subscriptionPlans.slice(1).map((plan) => (
                      <div key={plan.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{plan.name}</h5>
                          <div className="text-right">
                            <span className="font-bold">¥{plan.yearlyPrice.toLocaleString()}/year</span>
                            <p className="text-xs text-green-600">
                              Save ¥{(plan.monthlyPrice * 12 - plan.yearlyPrice).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-3 h-3" />
                            {plan.phrasebookLimit} saved phrases
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-3 h-3" />
                            PDF Export
                          </div>
                        </div>
                        <Button
                          onClick={() => handleUpgrade(plan.id as 'basic' | 'premium', 'yearly')}
                          size="sm"
                          className="w-full"
                          variant={plan.id === 'premium' ? 'default' : 'outline'}
                        >
                          Choose {plan.name}
                        </Button>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </Card>
            )}

            {/* PDF Export Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium">Phrasebook Export</h4>
                  <p className="text-sm text-muted-foreground">
                    Export your saved phrases as a PDF document
                  </p>
                </div>
                {getCurrentPlan().pdfExport && (
                  <FileText className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              
              <Button
                onClick={generatePhrasebookPDF}
                disabled={!getCurrentPlan().pdfExport || phrasebook.length === 0}
                className="w-full"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                {!getCurrentPlan().pdfExport 
                  ? "Upgrade to Export PDF" 
                  : phrasebook.length === 0 
                    ? "No Phrases to Export"
                    : `Export PDF (${phrasebook.length} phrases)`
                }
              </Button>
              
              {!getCurrentPlan().pdfExport && (
                <p className="text-xs text-muted-foreground mt-2">
                  PDF export is available with Basic and Premium plans
                </p>
              )}
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}