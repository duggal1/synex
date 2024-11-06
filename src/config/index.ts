import { Metadata } from "next";

export const SITE_CONFIG: Metadata = {
    title: {
        default: "SYNEXAI⚡️ - The Ultimate AI-Driven Business Intelligence Software",
        template: `%s | SYNEXAI`
    },
    description: "SYNEXAI revolutionizes the way you manage your business with cutting-edge AI technology. Build, analyze, and optimize your operations in record time. Experience the future of business intelligence now!",
    icons: {
        icon: [
            {
                url: "/images/synex-ai.png", // Changed to synex-ai.png as the default favicon
                href: "/images/synex-ai.png", // Changed to synex-ai.png as the default favicon
            },
           
            {
                url: "/images/synex-logo.png",
                href: "/images/synex-logo.png",
            }
        ]
    },
    openGraph: {
        title: "SYNEXAI⚡️- The Ultimate AI-Driven Business Intelligence Software",
        description: "SYNEXAI revolutionizes the way you manage your business with cutting-edge AI technology. Build, analyze, and optimize your operations in record time. Experience the future of business intelligence now!",
        images: [
            {
                url: "/assets/og-image.png",
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        creator: "@SYNEXAI⚡️",
        title: "SYNEXAI⚡️ - The Ultimate AI-Driven Business Intelligence Software",
        description: "SYNEXAI revolutionizes the way you manage your business with cutting-edge AI technology. Build, analyze, and optimize your operations in record time. Experience the future of business intelligence now!",
        images: [
            {
                url: "/assets/og-image.png",
            }
        ]
    },
    metadataBase: new URL("https://synexai.in"),
};
