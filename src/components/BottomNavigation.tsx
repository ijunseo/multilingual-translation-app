import { Languages, History, Settings, CreditCard } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    {
      id: "translate",
      label: "翻訳",
      labelEn: "Translate",
      icon: Languages,
    },
    {
      id: "history",
      label: "履歴",
      labelEn: "History",
      icon: History,
    },
    {
      id: "flashcard",
      label: "フラッシュカード",
      labelEn: "Flash Cards",
      icon: CreditCard,
    },
    {
      id: "settings",
      label: "設定",
      labelEn: "Settings",
      icon: Settings,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-4 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-xs leading-none">
                {tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}