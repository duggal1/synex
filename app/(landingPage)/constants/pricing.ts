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
        id: "starter",
        title: "Starter",
        desc: "Perfect for small teams starting their hiring journey",
        monthlyPrice: 49,
        yearlyPrice: 499,
        buttonText: "Start Free",
        features: [
            "Up to 3 active job posts",
            "Basic candidate verification",
            "Email support",
            "Basic candidate matching",
            "48-hour response time"
        ],
        link: ""
    },
    {
        id: "pro",
        title: "Professional",
        desc: "For growing teams who need serious hiring power",
        monthlyPrice: 99,
        yearlyPrice: 990,
        buttonText: "Start Hiring",
        features: [
            "Unlimited job posts",
            "Triple-layer verification",
            "AI-powered candidate matching",
            "24-hour candidate response guarantee",
            "Custom hiring pipeline",
            "Advanced analytics dashboard",
            "Priority support"
        ],
        link: ""
    },
    {
        id: "enterprise",
        title: "Enterprise",
        desc: "Custom solutions for large-scale hiring needs",
        monthlyPrice: 299,
        yearlyPrice: 2990,
        buttonText: "Contact Sales",
        features: [
            "Everything in Pro",
            "Custom verification process",
            "Dedicated account manager",
            "Custom AI matching rules",
            "API access",
            "Advanced team collaboration",
            "Custom analytics"
        ],
        link: ""
    }
];