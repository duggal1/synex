import { cn } from "@/lib";
import AnimationContainer from './global/animation-container';
import Wrapper from "./global/wrapper";
import SectionBadge from "./ui/section-badge";
import { HOW_IT_WORKS } from "../constants";

const HowItWorks = () => {
  return (
    <section className="relative py-32 lg:py-40 overflow-hidden">
      <Wrapper>
        <div className="relative flex flex-col items-center gap-8 py-12 w-full text-center">
          <AnimationContainer animation="fadeUp" delay={0.2}>
            <SectionBadge
              title="How it works"
              className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl px-6 border border-white/10 hover:border-white/20 transition-all duration-500"
            />
          </AnimationContainer>

          <AnimationContainer animation="fadeUp" delay={0.3}>
            <h1 className="relative">
              <span className="relative text-neutral-100 font-black text-5xl md:text-6xl lg:text-7xl !leading-[1.1] tracking-tight">
                Four Powerful Steps
                <span className="block text-neutral-200 mt-2">to Automation</span>
              </span>
            </h1>
          </AnimationContainer>

          <AnimationContainer animation="fadeUp" delay={0.4}>
            <p className="mx-auto max-w-2xl font-light text-neutral-300/80 text-lg md:text-xl lg:text-2xl">
              Our four-step process automates invoices, streamlines ticket handling, and simplifies business operations—so you focus on growth, not admin work.
            </p>
          </AnimationContainer>
        </div>

        <div className="relative gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 pt-16 w-full">
          {HOW_IT_WORKS.map((item, index) => (
            <AnimationContainer
              key={index}
              animation="fadeUp"
              delay={0.5 + index * 0.1}
            >
              <div className="group relative h-full">
              <div className="relative flex flex-col bg-black backdrop-blur-xl p-8 rounded-2xl h-full border-2 border-transparent transition-all duration-300 ease-out hover:border-violet-600"> 
                  <AnimationContainer animation="scaleUp" delay={0.7 + index * 0.1}>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="relative">
                        <div className="flex justify-center items-center bg-gradient-to-r from-blue-600 to-violet-500 rounded-lg w-12 h-12 shadow-[0_0_20px_rgba(96,165,250,0.2)]">
                          <span className="font-medium text-white text-lg">
                            {index + 1}
                          </span>
                        </div>
                      </div>

                      <h3 className="bg-gradient-to-r from-white to-white/90 bg-clip-text font-semibold text-transparent text-xl">
                        {item.title}
                      </h3>
                    </div>
                  </AnimationContainer>

                  <AnimationContainer animation="fadeUp" delay={0.9 + index * 0.1}>
                    <div className="relative flex justify-center items-center mb-8 h-32">
                      <item.icon className="w-16 h-16 text-white/90" />
                    </div>
                  </AnimationContainer>

                  <AnimationContainer animation="fadeUp" delay={1.1 + index * 0.1}>
                    <p className="font-light text-neutral-300/80 text-base leading-relaxed">
                      {item.description}
                    </p>
                  </AnimationContainer>
                </div>
              </div>
         
            </AnimationContainer>
          ))}
        </div>

      </Wrapper>
    </section>
  );
};

export default HowItWorks;
