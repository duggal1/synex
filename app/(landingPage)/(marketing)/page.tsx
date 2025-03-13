import CTA from "../_components/cta";
import FAQ from "../_components/faq";
import Features from "../_components/features";
import { Hero } from "../_components/hero";
import HowItWorks from "../_components/how-it-works";

import Perks from "../_components/perks";
import PlatformMetrics from "../_components/platform-metrics";
import Pricing from "../_components/pricing";
import Testimonials from "../_components/testimonials";

const HomePage = () => {
    return (
        <div className="relative flex flex-col w-full">
            <section className="w-full">
                <Hero/>
            </section>

            <section className="w-full">
                <Perks />
            </section>

            <section className="w-full">
                <HowItWorks />
            </section>

            <section className="w-full">
                <Features />
            </section>

            <section className="w-full">
                <Testimonials />
            </section>

            <section className="w-full">
                <Pricing />
            </section>

            <section className="w-full">
                <PlatformMetrics />
            </section>

            <section className="w-full">
                <FAQ />
            </section>

            <section className="w-full">
                <CTA />
            </section>
        </div>
    );
};

export default HomePage;
