


import { LucideIcon, FileText, BarChart3, Send, Settings } from "lucide-react";
export interface PerkItem {
    title: string;
    description: string;
    icon: LucideIcon;
}

export const PERKS: PerkItem[] = [
    {
        title: "Synex AI",
        description: "An AI agent for businesses to send invoices effortlessly. Setup in seconds, and the AI agent handles the rest.",
        icon: Send
    },
    {
        title: "Smart Analytics",
        description: "Track performance with real-time insights.",
        icon: BarChart3
    },
    {
        title: "Doc Manager",
        description: "Handle documents and e-signs easily.",
        icon: FileText
    },
    {
        title: "Automation Hub",
        description: "Seamlessly automate tasks and optimize workflows.",
        icon: Settings
    }
];