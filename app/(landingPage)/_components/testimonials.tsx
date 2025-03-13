
import { Star } from 'lucide-react';
import Image from 'next/image';
import AnimationContainer from './global/animation-container';
import Wrapper from "./global/wrapper";
import Marquee from './ui/marquee';
import SectionBadge from './ui/section-badge';
import { TESTIMONIALS } from '../constants';

const Testimonials = () => {
    return (
        <Wrapper className="py-20 lg:py-32">
            <div className="flex flex-col items-center gap-6 mb-20 text-center">
                <AnimationContainer animation="fadeUp" delay={0.2}>
                    <SectionBadge title="Client Stories" />
                </AnimationContainer>

                <AnimationContainer animation="fadeUp" delay={0.3}>
                    <h2 className="bg-clip-text bg-gradient-to-b from-white via-white/80 to-blue-500/50 font-black text-transparent text-3xl md:text-5xl lg:text-6xl !leading-[1.1] tracking-tight">
                        Loved by industry
                        <span className="block bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent">
                            professionals
                        </span>
                    </h2>
                </AnimationContainer>

                <AnimationContainer animation="fadeUp" delay={0.4}>
                    <p className="mx-auto max-w-2xl font-medium text-neutral-400 text-sm md:text-base tracking-wide">
                        Join thousands of satisfied users transforming their property management experience
                    </p>
                </AnimationContainer>
            </div>

            <AnimationContainer animation="fadeUp" delay={0.5}>
                <div className="relative">
                    <div className="top-0 -left-1 z-10 absolute bg-gradient-to-r from-black via-black/80 to-transparent w-32 h-full" />
                    <div className="top-0 -right-1 z-10 absolute bg-gradient-to-l from-black via-black/80 to-transparent w-32 h-full" />

                    <Marquee className="[--gap:2rem]" pauseOnHover>
                        {TESTIMONIALS.map((testimonial, index) => (
                            <AnimationContainer
                                key={index}
                                animation="fadeUp"
                                delay={0.6 + (index * 0.1)}
                            >
                                <div className="flex-shrink-0 bg-black/40 hover:bg-black/60 hover:shadow-2xl hover:shadow-blue-500/10 backdrop-blur-2xl p-8 border border-white/5 hover:border-blue-500/10 rounded-3xl w-[400px] transition-all duration-300">
                                    <div className="flex flex-col gap-8">
                                        <AnimationContainer animation="fadeRight" delay={0.7 + (index * 0.1)}>
                                            <div className="flex items-center gap-4">
                                                <div className="relative border border-white/10 rounded-2xl w-14 h-14 overflow-hidden">
                                                    <Image
                                                        src={testimonial.image}
                                                        alt={testimonial.author}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="bg-clip-text bg-gradient-to-r from-white to-white/70 font-bold text-transparent tracking-tight">
                                                        {testimonial.author}
                                                    </h4>
                                                    <p className="font-medium text-blue-400/80 text-sm">
                                                        {testimonial.role}
                                                    </p>
                                                </div>
                                            </div>
                                        </AnimationContainer>

                                        <AnimationContainer animation="fadeUp" delay={0.8 + (index * 0.1)}>
                                            <p className="font-medium text-neutral-300/90 text-lg tracking-wide">
                                                &quot;{testimonial.content}&#34;
                                            </p>
                                        </AnimationContainer>

                                        <AnimationContainer animation="fadeUp" delay={0.9 + (index * 0.1)}>
                                            <div className="flex gap-1.5">
                                                {[...Array(testimonial.rating)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className="fill-blue-500 w-5 h-5 text-blue-400"
                                                    />
                                                ))}
                                            </div>
                                        </AnimationContainer>
                                    </div>
                                </div>
                            </AnimationContainer>
                        ))}
                    </Marquee>
                </div>
            </AnimationContainer>
        </Wrapper>
    );
};

export default Testimonials;