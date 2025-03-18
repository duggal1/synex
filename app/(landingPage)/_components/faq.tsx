

import AnimationContainer from './global/animation-container';
import Wrapper from "./global/wrapper";
import { FAQS } from "../constants";
import SectionBadge from "./section-badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';


const FAQ = () => {
    return (
        <Wrapper className="relative py-20 lg:py-32">
            {/* Background Glow Effect */}
            <div className="top-1/2 left-1/2 absolute bg-blue-500/10 opacity-50 blur-[120px] rounded-full size-[500px] -translate-x-1/2 -translate-y-1/2" />

            <div className="flex flex-col items-center gap-6 text-center">
                <AnimationContainer animation="fadeUp" delay={0.2}>
                    <SectionBadge title="FAQ" />
                </AnimationContainer>

                <AnimationContainer animation="fadeUp" delay={0.3}>
                    <h2 className="font-black text-3xl md:text-5xl lg:text-6xl !leading-[1.1] tracking-tight">
                        <span className="bg-clip-text bg-gradient-to-b from-white via-white/80 to-white/20 text-transparent">
                            Still have questions?
                        </span>
                        <span className="block bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mt-2 text-transparent">
                            We&lsquo;re here to help
                        </span>
                    </h2>
                </AnimationContainer>

                <AnimationContainer animation="fadeUp" delay={0.4}>
                    <p className="mx-auto max-w-2xl font-medium text-neutral-400 text-sm md:text-base tracking-wide">
                       Find answers to common questions about SynexAI and discover how we can help automate your invoices with our advanced agnetic system.
                    </p>
                </AnimationContainer>
            </div>

            <div className="mx-auto pt-16 max-w-3xl">
    <Accordion type="single" collapsible className="space-y-4 w-full">
        {FAQS.map((item, index) => (
            <AnimationContainer
                key={index}
                animation="fadeUp"
                delay={0.5 + (index * 0.1)}
            >
                <AccordionItem
                    value={`item-${index}`}
                    className="group relative bg-black/40 border border-white/5 rounded-2xl overflow-hidden"
                >
                    <AccordionTrigger 
                        className="flex justify-between items-center px-6 py-4 w-full font-bold text-white/90 text-base md:text-lg hover:no-underline"
                    >
                        {item.question}
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-6 pb-4">
                        <div className="text-neutral-400 text-sm md:text-base">
                            {item.answer}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </AnimationContainer>
        ))}
    </Accordion>
</div>
        </Wrapper>
    );
};
export default FAQ;
