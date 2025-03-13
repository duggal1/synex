import { cn } from "@/lib";
import Wrapper from "./global/wrapper";
import { PERKS } from "../constants";
import AnimationContainer from "./global/animation-container";
import SectionBadge from "./section-badge";

const Perks = () => {
  return (
    <Wrapper className="py-32 lg:py-40">
      {/* Header - Ultra minimal, bold typography */}
      <div className="flex flex-col items-center gap-4 py-8 w-full text-center">
                <AnimationContainer animation="fadeUp" delay={0.2}>
                    <SectionBadge className="bg-black" title="How it works" />
                </AnimationContainer>

                <AnimationContainer animation="fadeUp" delay={0.3}>
                <h1 className="bg-clip-text bg-gradient-to-b from-blue-800 via-violet-600 to-black font-black text-transparent text-4xl md:text-5xl lg:text-6xl !leading-[1.1] tracking-tight">
                Use our platform with 
                        <span className="block bg-clip-text bg-gradient-to-r from-neutral-100 to-neutral-300 text-transparent">
                        {" "}powerful tools
                        </span>
                    </h1>
                </AnimationContainer>

                <AnimationContainer animation="fadeUp" delay={0.4}>
                    <p className="mx-auto max-w-lg text-muted-foreground text-sm md:text-base lg:text-lg">
                    Seamlessly integrated tools for effortless property management.
                    </p>
                </AnimationContainer>
            </div>


      {/* Modern minimalistic grid with refined spacing */}
      <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mx-auto max-w-6xl">
        {PERKS.map((perk, index) => (
          <div 
            key={index}
            className="group relative bg-black hover:bg-white/10 dark:bg-neutral-900/20 hover:shadow-xl backdrop-blur-lg p-6 rounded-2xl transition-all hover:translate-y-[-4px]  border-transparent hover:border-blue-600 duration-300"
          >
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex justify-center items-center bg-gradient-to-br from-neutral-50 dark:from-neutral-800 to-neutral-100 dark:to-neutral-900 backdrop-blur-sm rounded-2xl w-16 h-16 group-hover:scale-110 transition-transform duration-300 shrink-0 transform">
                <perk.icon className="w-8 h-8 text-neutral-800 dark:text-neutral-100" />
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-foreground text-lg">
                  {perk.title}
                </h3>
                
                <p className="font-light text-neutral-400 text-sm leading-relaxed">
                  {perk.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Wrapper>
  );
};

export default Perks;
