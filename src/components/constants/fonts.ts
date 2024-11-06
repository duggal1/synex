import { Inter, DM_Sans, Roboto, Poppins } from "next/font/google";
import localFont from "next/font/local";

export const satoshi2 = localFont({
    src: [
        // {
        //     path: "../../public/fonts/Satoshi-Thin.woff2",
        //     weight: "200",
        // },
        {
            path: "../../public/fonts/Satoshi-Light.woff2",
            weight: "300",
        },
        {
            path: "../../public/fonts/Satoshi-Regular.woff2",
            weight: "400",
        },
        {
            path: "../../public/fonts/Satoshi-Medium.woff2",
            weight: "500",
        },
        {
            path: "../../public/fonts/Satoshi-Bold.woff2",
            weight: "700",
        },
        {
            path: "../../public/fonts/Satoshi-Black.woff2",
            weight: "900",
        },
    ],
    variable: "--font-satoshi",
});

export const satoshi = Poppins({
    subsets: ["latin"],
    variable: "--font-inter",
    weight: ["100", "200", "300", "400", "500", "600", "700","800", "900"],
});

export const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});
