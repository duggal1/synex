import * as React from "react"
import { cn } from "@/lib"
import { ChevronRight } from "lucide-react"
import Image from "next/image"

import { ShineBorder } from "../magicui/shine-border"
import { ButtonColorful } from "@/components/ui/button-colorful"

interface HeroSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: {
    regular: string
    gradient: string
  }
  description?: string
  ctaText?: string
  ctaHref?: string
  bottomImage?: {
    light?: string
    dark: string
  }
  gridOptions?: {
    angle?: number
    cellSize?: number
    opacity?: number
    lightLineColor?: string
    darkLineColor?: string
  }
}

const RetroGrid = ({
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = "gray",
  darkLineColor = "gray",
}) => {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
    "--light-line": lightLineColor,
    "--dark-line": darkLineColor,
  } as React.CSSProperties

  return (
    <div
      className={cn(
        "pointer-events-none absolute size-full overflow-hidden [perspective:200px]",
        `opacity-[var(--opacity)]`,
      )}
      style={gridStyles}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div className="[background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] dark:[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_0)] [margin-left:-200%] [transform-origin:100%_0_0] animate-grid [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [width:600vw]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black to-90% to-transparent" />
    </div>
  )
}

const HeroSection = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  ({
    className,
    title = "Build products for everyone",
    subtitle = {
      regular: "Designing your projects faster with ",
      gradient: "the largest figma UI kit.",
    },
    description = "Sed ut perspiciatis unde omnis iste natus voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae.",
    ctaText = "Browse courses",
    ctaHref = "",
    bottomImage = {
      dark: "/images/dashboard.png",
    },

    ...props
  }, ref) => {
    return (
      <div className={cn("relative bg-black", className)} ref={ref} {...props}>
        {/* Ultra modern futuristic background with pure black and blue-violet theme */}
        <div className="top-0 z-[0] absolute bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,89,255,0.15),rgba(0,0,0,0))] bg-black dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(88,70,255,0.2),rgba(0,0,0,0))] w-screen h-screen" />
        
        {/* Animated glow effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10px] opacity-30">
            <div className="top-1/4 left-1/2 absolute bg-violet-600/20 blur-[100px] rounded-full w-[40%] h-[40%] -translate-x-1/2 animate-pulse" />
            <div className="top-2/3 left-1/3 absolute bg-blue-600/20 blur-[80px] rounded-full w-[25%] h-[25%] -translate-x-1/2 animate-pulse" style={{ animationDelay: "1s" }} />
            <div className="top-1/3 right-1/4 absolute bg-indigo-600/20 blur-[90px] rounded-full w-[30%] h-[30%] animate-pulse" style={{ animationDelay: "2s" }} />
          </div>
        </div>
        
        <section className="z-1 relative mx-auto max-w-full">
          {/* RetroGrid is removed */}
          
          <div className="z-10 gap-12 mx-auto px-4 md:px-8 py-28 max-w-screen-xl">
            <div className="space-y-5 mx-auto max-w-3xl text-center leading-0 lg:leading-5">
              {/* Updated badge styling with more futuristic look */}
              <h1 className="group bg-gradient-to-tr from-violet-500/10 via-indigo-500/5 to-transparent backdrop-blur-xl mx-auto px-5 py-2 border-[1px] border-violet-500/20 rounded-full w-fit font-black text-violet-200 text-sm tracking-tight">
                {title}
                <ChevronRight className="inline ml-2 w-3 h-3 group-hover:translate-x-1.5 duration-500" />
              </h1>

              {/* Ultra modern heading with enhanced gradient */}
              <h2 className="bg-clip-text bg-gradient-to-b from-white via-violet-100 to-blue-500/50 mx-auto font-black text-transparent text-5xl md:text-7xl tracking-tighter">
                {subtitle.regular}
                <span className="bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-600 text-transparent">
                  {subtitle.gradient}
                </span>
              </h2>

              <p className="mx-auto max-w-2xl text-violet-100/80 text-sm tracking-wide">
                {description}
              </p>

              {/* Using the imported ButtonColorful component */}
              <div className="flex justify-center items-center mt-8">
                <a href={ctaHref}>
                  <ButtonColorful 
                    label={ctaText} 
                    className="px-8 py-6 font-bold text-base"
                  />
                </a>
              </div>
            </div>

            {/* Bottom image with enhanced shine effect */}
            <div className="relative pt-12">
              {bottomImage && (
                <div className="z-10 relative mx-auto mt-32 max-w-6xl">
                  <div className="relative rounded-xl overflow-hidden">
                    <ShineBorder 
                      shineColor={["#ec4899", "#0011ff", "#7b00ff"]}
                      borderWidth={2}
                      duration={10}
                    />
                    <Image
                      src={bottomImage.dark}
                      className="z-20 relative shadow-2xl border border-violet-500/20 rounded-xl w-full"
                      alt="Dashboard preview"
                      width={1200}
                      height={800}
                      priority={true}
                      loading="eager"
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzExMTEyMiIvPjwvc3ZnPg=="
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                    />
                    {/* Futuristic glow effect under the image */}
                    <div className="-bottom-10 left-1/2 absolute bg-violet-600/20 blur-[50px] rounded-full w-[80%] h-20 -translate-x-1/2"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }
); 
HeroSection.displayName = "HeroSection"

export { HeroSection }