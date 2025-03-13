import { Inter, Outfit, Poppins } from "next/font/google";

export const heading = Poppins({
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    variable: "--font-heading",
});

export const base = Inter({
    subsets: ["latin"],
    variable: "--font-base",
});
