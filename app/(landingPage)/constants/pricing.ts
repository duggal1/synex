export type PLAN = {
    id: string;
    title: string;
    desc: string;
    monthlyPrice: number;
    annuallyPrice: number;
    badge?: string;
    buttonText: string;
    features: string[];
    link: string;
};

export const PLANS: PLAN[] = [
    {
        id: "free",
        title: "Free",
        desc: "Basic invoice management features for individuals.",
        monthlyPrice: 0,
        annuallyPrice: 0,
        buttonText: "Get Started",
        features: [
            "Up to 5 invoices per month",
            "Limited Magnetic AI automation",
            "Basic invoice builder",
            "Standard email support",
            "Basic data insights",
            "Invoice tracking",
            "PDF invoice generation"
        ],
        link: "https://synexai.in/dashboard/upgrade"
    },
    {
        id: "",
        title: "Standard",
        desc: "Ideal for growing businesses and agencies who need advanced invoice management capabilities.",
        monthlyPrice: 19,
        annuallyPrice: 136.4,
        badge: "Most Popular",
        buttonText: "Upgrade to Pro",
        features: [
            "Everything in Free",
            "Unlimited invoices",
            "Full Agentic AI automation",
            "Automated email reminders",
            "AI-powered data extraction",
            "Customizable invoice templates",
            "Payment processing integration"
        ],
   link: "https://synexai.in/dashboard/upgrade"
    },
    {
        id: "enterprise",
        title: "Enterprise",
        desc: "Full-scale invoice management solution for large organizations.",
        monthlyPrice: 49,
        annuallyPrice: 294,
        badge: "Custom AI Solutions",
        buttonText: "Contact Sales",
        features: [
            "Everything in Mastermind",
            "Custom AI automation rules",
            "Bulk invoice processing",
            "Dedicated account manager",
            "API access & custom integrations",
            "Enhanced security features",
            "24/7 dedicated support"
        ],
        link: "https://synexai.in/dashboard/upgrade"
    }
];
