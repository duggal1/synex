
import Image from 'next/image';
import AnimationContainer from './global/animation-container';
import Wrapper from "./global/wrapper";
import SectionBadge from './ui/section-badge';
import { FEATURES } from '../constants';

const Features = () => {
    return (
        <Wrapper className="py-20 lg:py-32">
            <div className="flex flex-col items-center gap-6 mb-20 text-center">
                <AnimationContainer animation="fadeUp" delay={0.2}>
                    <SectionBadge title="Platform Features" />
                </AnimationContainer>

                <AnimationContainer animation="fadeUp" delay={0.3}>
                    <h2 className="bg-clip-text bg-gradient-to-b from-white dark:from-white via-white/80 dark:via-white/80 to-white/20 dark:to-blue-500/50 font-black text-transparent text-3xl md:text-5xl lg:text-6xl !leading-[1.1] tracking-tight">
                 Agentic Automated 
                        <span className="block bg-clip-text bg-gradient-to-r from-neutral-100 to-neutral-300 text-transparent">
                        Invoice  Handling
                        </span>
                    </h2>
                </AnimationContainer>

                <AnimationContainer animation="fadeUp" delay={0.4}>
                    <p className="mx-auto max-w-2xl font-medium text-neutral-400 text-sm md:text-base">
                    Stop chasing payments. Synex AI auto-generates, tracks, and follows up on invoices—so you get paid on time without lifting a finger.
                    </p>
                </AnimationContainer>
            </div>

            <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
                {FEATURES.map((feature, index) => (
                    <AnimationContainer
                        key={index}
                        animation={index % 2 === 0 ? "fadeRight" : "fadeLeft"}
                        delay={0.5 + index * 0.1}
                    >
                        <div className="group relative bg-black/40 hover:bg-black/60 hover:shadow-2xl hover:shadow-blue-500/10 backdrop-blur-2xl border border-white/5 hover:border-blue-500/10 rounded-3xl overflow-hidden transition-all duration-300">
                            <div className="flex flex-col justify-between gap-8 p-8 h-full">
                                <div className="space-y-4">
                                    <h3 className="bg-clip-text bg-gradient-to-br from-white to-white/60 font-black text-transparent text-xl md:text-2xl tracking-tight">
                                        {feature.title}
                                    </h3>
                                    <p className="max-w-md font-medium text-neutral-400 text-sm md:text-base">
                                        {feature.description}
                                    </p>
                                </div>
                                
                                <div className="relative border border-white/5 rounded-2xl w-full aspect-[16/9] overflow-hidden">
                                    <Image
                                        src={feature.image}
                                        alt={feature.title}
                                        fill
                                        className="object-center object-cover group-hover:scale-105 transition-transform duration-300 transform"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                            </div>
                        </div>
                    </AnimationContainer>
                ))}
            </div>
        </Wrapper>
    );
};

export default Features;