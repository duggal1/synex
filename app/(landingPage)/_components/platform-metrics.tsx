
import { cn } from "@/lib";

import Image from "next/image";
import AnimationContainer from './global/animation-container';
import Wrapper from "./global/wrapper";
import { Button } from './ui/button';
import SectionBadge from './ui/section-badge';
import { NumberFlow } from './Number-flow-metrics';
import { METRICS } from "../constants";



const PlatformMetrics = () => {
    return (
        <Wrapper className="py-20 lg:py-32">
            <div className="items-center gap-16 grid grid-cols-1 lg:grid-cols-2">
                <div className="flex flex-col items-center lg:items-start gap-6 lg:text-left text-center">
                    <AnimationContainer animation="fadeUp" delay={0.2}>
                        <SectionBadge title=" Invoice Automation with AI" />
                    </AnimationContainer>

                    <AnimationContainer animation="fadeUp" delay={0.3}>
                        <h2 className="bg-clip-text bg-gradient-to-b from-white to-white/90 font-black text-transparent text-4xl md:text-4xl lg:text-6xl !leading-[1.1] tracking-tight">
                        Transforming Business Operations
                            <span className="block bg-clip-text bg-gradient-to-r from-gray-200 to-gray-100 text-transparent">
                     
                            with AI Insights
                            </span>
                        </h2>
                    </AnimationContainer>

                    <AnimationContainer animation="fadeUp" delay={0.4}>
                        <p className="max-w-2xl font-medium text-neutral-400 text-sm md:text-base tracking-wide">
                        Thousands of businesses trust Synex AI to automate invoice processing, reduce errors, and accelerate payments—saving time and boosting cash flow effortlessly.
                        </p>
                    </AnimationContainer>

                    <AnimationContainer animation="fadeUp" delay={0.5}>
                        <Button className="bg-gradient-to-r from-blue-600 hover:from-blue-500 to-indigo-600 hover:to-indigo-500 shadow-blue-500/20 shadow-xl mt-4 px-8 py-6 rounded-2xl font-bold text-white tracking-wide hover:scale-105 transition-all duration-300">
                        Start Automating Now
                        </Button>
                    </AnimationContainer>
                </div>

                <div className="flex flex-col gap-6 px-1 md:px-0">
                    {METRICS.map((metric, index) => (
                        <AnimationContainer
                            key={index}
                            animation={metric.reverse ? "fadeLeft" : "fadeRight"}
                            delay={0.6 + (index * 0.2)}
                        >
                            <div className="group relative bg-gradient-to-b from-black/60 to-black/40 hover:shadow-2xl hover:shadow-blue-500/10 backdrop-blur-xl p-6 lg:p-8 border border-white/5 hover:border-blue-500/20 rounded-3xl overflow-hidden transition-all duration-300">
                                <AnimationContainer animation="scaleUp" delay={0.7 + (index * 0.2)}>
                                    <div className={cn(
                                        "absolute -bottom-1/2 right-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 size-32 lg:size-40 blur-[100px] rounded-full -z-10 transition-all duration-500 group-hover:blur-[120px] group-hover:opacity-70",
                                        metric.reverse && "left-0"
                                    )}></div>
                                </AnimationContainer>

                                <div className={cn(
                                    "flex items-center justify-between gap-8 z-30",
                                    metric.reverse && "flex-row-reverse"
                                )}>
                                    <AnimationContainer animation="fadeUp" delay={0.8 + (index * 0.2)}>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-baseline gap-1">
                                            <span className="bg-clip-text bg-gradient-to-r from-white to-white/70 font-black text-transparent text-5xl lg:text-6xl">
    <NumberFlow value={metric.number} />
</span>
                                                {metric.suffix && (
                                                    <span className="font-black text-blue-400 text-4xl lg:text-5xl">
                                                        {metric.suffix}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="font-medium text-neutral-400 text-sm tracking-wide">
                                                {metric.label}
                                            </p>
                                        </div>
                                    </AnimationContainer>

                                    <AnimationContainer
                                        animation={metric.reverse ? "fadeRight" : "fadeLeft"}
                                        delay={0.9 + (index * 0.2)}
                                    >
                                        <div className={cn(
                                            "h-32 lg:h-40 absolute inset-y-0 my-auto right-0 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-105",
                                            metric.reverse && "left-0 right-auto"
                                        )}>
                                            <Image
                                                src={metric.image}
                                                alt={metric.label}
                                                width={1024}
                                                height={1024}
                                                className="size-full object-cover"
                                            />
                                        </div>
                                    </AnimationContainer>
                                </div>
                            </div>
                        </AnimationContainer>
                    ))}
                </div>
            </div>
        </Wrapper>
    );
};
export default PlatformMetrics; 