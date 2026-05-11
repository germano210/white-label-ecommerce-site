import { type LucideIcon, Home, Sparkles, Heart } from 'lucide-react';

interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'paravoc', label: 'Para Você', icon: Sparkles },
    { id: 'historia', label: 'Nossa História', icon: Heart },
];

interface Props {
    activeTab: string;
    setActiveTab: (id: string) => void;
}

export function BottomNavigation({ activeTab, setActiveTab }: Props) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[300] max-w-[430px] mx-auto bg-[#FAF7F2]/95 backdrop-blur-xl border-t border-[#D9D0C4] h-[72px] flex items-center px-2 pb-2 gap-1">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors active:bg-[#EDE4D8]"
                >
                    <item.icon
                        size={20}
                        className={activeTab === item.id ? 'text-[#C2693F]' : 'text-[#6B5444]'}
                    />
                    <span className={`text-[10px] font-medium ${
                        activeTab === item.id ? 'text-[#C2693F]' : 'text-[#6B5444]'
                    }`}>
            {item.label}
          </span>
                    {activeTab === item.id && (
                        <div className="w-1 h-1 rounded-full bg-[#C2693F] -mt-0.5" />
                    )}
                </button>
            ))}
        </nav>
    );
}