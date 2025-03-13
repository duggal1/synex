
import { Metadata } from "next";

export const generateMetadata = ({
    title = 'SynexAI - AI Agent Invoice Automation ',
    description = `Automate invoice processing, reduce errors, and get paid faster than ever  with Synex AI.`,
    image = "/icons/synex-thumbnail.png",
    icons = {
        icon: [
            { rel: "icon", sizes: "32x32", url: "/icons/synex-thumbnail.png", type: "image/png" },
            { rel: "apple-touch-icon", sizes: "180x180", url: "/icons/synex-thumbnail.png" }
        ]
    },
    noIndex = false
}: {
    title?: string;
    description?: string;
    image?: string | null;
    icons?: Metadata["icons"];
    noIndex?: boolean;
} = {}): Metadata => ({
    title,
    description,
    openGraph: {
        title,
        description,
        images: [{ url: image ?? "/icons/synex-thumbnail.png", width: 1200, height: 630, alt: "Synex AI Preview" }],
        type: "website"
    },
    twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image ?? "/icons/synex-thumbnail.png"]
    },
    icons,
    ...(noIndex && { robots: { index: false, follow: false } })
});