import { LucideIcon, FileText, Inbox, Send, PlugZap } from "lucide-react";

export interface HowItWorksItem {
    title: string;
    description: string;
    icon: LucideIcon;
}

export const HOW_IT_WORKS: HowItWorksItem[] = [
    {
        title: "Effortless Setup",
        description: "Get started in seconds. Connect your business, and let Synex AI handle invoices and tickets automatically.",
        icon: PlugZap
    },
    {
        title: "Automated Invoicing",
        description: "Generate and send invoices instantly with AI-driven precision, reducing manual work and errors.",
        icon: Send
    },
    {
        title: "Smart Ticketing System",
        description: "AI-powered ticket management ensures customer issues are handled efficiently, improving response times.",
        icon: Inbox
    },
    {
        title: "Seamless Integration",
        description: "Easily integrate with your existing tools and workflows, making automation smoother than ever.",
        icon: FileText
    }
];