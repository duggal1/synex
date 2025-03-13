type PLAN = {
    id: string;
    title: string;
    desc: string;
    monthlyPrice: number;
    yearlyPrice: number;
    badge?: string;
    buttonText: string;
    features: string[];
    link: string;
};

export const PLANS: PLAN[] = [
    {
        id: "free",
        title: "Free",
        desc: "Get started with AI-powered invoicing at zero cost.",
        monthlyPrice: 0,
        yearlyPrice: 0,
        buttonText: "Start for Free",
        features: [
            "Up to 5 invoices per month",
            "Limited Magnetic AI automation",
            "Basic invoice builder",
            "Standard email support",
            "Basic data insights"
        ],
        link: ""
    },
    {
        id: "pro",
        title: "Pro",
        desc: "For businesses needing full automation and efficiency.",
        monthlyPrice: 19,
        yearlyPrice: 190,
        buttonText: "Upgrade to Pro",
        features: [
            "Unlimited invoices",
            "Full Magnetic AI automation",
            "Advanced invoice builder",
            "Automated email reminders",
            "AI-powered data extraction",
            "Priority email support"
        ],
        link: ""
    },
    {
        id: "enterprise",
        title: "Enterprise",
        desc: "Custom solutions for large-scale invoicing automation.",
        monthlyPrice: 49,
        yearlyPrice: 490,
        buttonText: "Contact Sales",
        features: [
            "Everything in Pro",
            "Custom AI automation rules",
            "Bulk invoice processing",
            "Team collaboration tools",
            "Dedicated account manager",
            "API access & custom integrations"
        ],
        link: ""
    }
];