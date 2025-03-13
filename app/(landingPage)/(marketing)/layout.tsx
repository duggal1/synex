import Footer from "../_components/footer";
import Navbar from "../_components/navbar";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="relative w-full">
            <Navbar />
            {children}
            <Footer />
        </main>
    );
};
