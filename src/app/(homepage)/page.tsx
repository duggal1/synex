import { Container, Icons, Wrapper } from "@/components";
import AnimationContainer from "@/components/animate-cantanier";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LampContainer } from "@/components/ui/lamp";
import Marquee from "@/components/ui/marquee";

import SectionBadge from "@/components/ui/section-badge";
import { SparklesCore } from "@/components/ui/sparkles";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import SparklesText from "@/components/ui/sparkles-text";
import { features, perks, pricingCards, reviews } from "@/constants";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowRightIcon, UserIcon, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const HomePage = () => {

    const firstRow = reviews.slice(0, reviews.length / 2);
    const secondRow = reviews.slice(reviews.length / 2);

    return (

        <section className="relative flex flex-col justify-center items-center">
             
{/* hero */}
<Wrapper>  
 <div className="relative flex flex-col justify-center items-center text-center">
 <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.15}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]",
          "absolute inset-0 h-full z-10",
        )}
      />

                   
                   
                    <AnimationContainer className="flex flex-col justify-center items-center w-full text-center">
                       
                        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={1200}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
        <Link href="/dashboard">
         <button className="relative z-20 grid bg-gradient-to-r from-[#0A0AFF] to-[#00F0FF] shadow-[#0A0AFF]/40 shadow-xl backdrop-blur-xl px-6 py-2.5 border-none rounded-full overflow-hidden">
                            <span className="z-10 flex justify-center items-center gap-2 py-0.5 font-bold text-white text-xs uppercase tracking-[0.2em]">
                                ⚡ Next-Gen Enterprise AI
                                <ArrowRightIcon className="ml-1 size-3.5" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#000AFF] to-[#00CFFF] opacity-20"></div>
                        </button>
                        </Link>
                        <h1 className="relative z-20 bg-clip-text bg-gradient-to-r from-[#1e40af] via-[#00D9F5] to-[#9945FF] [text-shadow:0_0_100px_rgba(30,64,175,0.5)] py-10 w-full font-bold font-heading text-6xl text-center text-transparent sm:text-7xl md:text-8xl lg:text-9xl !leading-[0.9] tracking-tighter animate-gradient-x">
                            Transform Your Business <br/>
                            <span className="bg-clip-text bg-gradient-to-r from-[#FF3BFF] via-[#ECBFBF] to-[#5C24FF] [text-shadow:0_0_100px_rgba(255,59,255,0.5)] text-transparent animate-gradient-y">
                                With SynexAI
                            </span>
                        </h1>
                        
                        <p className="relative z-20 bg-clip-text bg-gradient-to-r from-white/90 via-neutral-300/80 to-gray-500/60 mx-auto mb-14 max-w-3xl font-medium text-transparent text-xl md:text-2xl tracking-tight">
                            The Ultimate AI Business Intelligence Solution
                            <br className="md:block hidden" />
                            <span className="md:block hidden bg-clip-text bg-gradient-to-r from-[#4a4aff] via-[#7e15cf] to-[#37096f] font-medium text-transparent">Revolutionize Your Data Management. Scale Your Enterprise. Dominate Your Market.</span>
                        </p>
                        <div className="relative z-20 md:flex justify-center items-center hidden mt-8 md:mt-12 w-full">
                            <Link href="/dashboard" className="relative flex justify-center items-center gap-6 bg-gradient-to-r from-[#1e40af] hover:from-[#682472] to-[#0e0868] hover:to-[#141d60] shadow-lg backdrop-blur-lg px-10 py-6 rounded-full transform transition-transform duration-300 hover:scale-105">
                                <p className="font-semibold text-white text-xl tracking-wide">
                                  ✨ Elevate Your Enterprise
                                </p>
                                <Button size="lg" className="bg-white shadow-xl px-8 py-4 rounded-full text-white">
                                    <span className="font-bold">Get Started Now⚡️ </span>
                                    <ArrowRight className="ml-2 w-6 h-6" />
                                </Button>
                                </Link>
           
             
                        </div>
                    </AnimationContainer>
                    <AnimationContainer delay={0.2} className="relative bg-transparent px-2 md:py-40 pt-28 pb-24 w-full">
                        <div className="top-1/4 left-1/2 absolute bg-gradient-to-r from-[#1e40af]/50 via-[#00D9F5]/50 to-[#9945FF]/50 blur-[10rem] w-full h-1/2 -translate-x-1/2 animate-pulse"></div>
                        <div className="bg-black/60 hover:shadow-2xl hover:shadow-[#1e40af]/50 backdrop-blur-3xl -m-2 lg:-m-4 p-6 rounded-[2.5rem] lg:rounded-[3rem] ring-2 ring-white/30 hover:ring-[#1e40af]/50 ring-inset transition-all duration-700 group hover:scale-[1.05]">
                            <BorderBeam
                                size={500}
                                duration={5} 
                                delay={3}
                            />
                            <div className="relative bg-gradient-to-br from-black/90 via-black/80 to-black/90 rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#1e40af]/30 via-[#00D9F5]/30 to-[#9945FF]/30 animate-gradient-xy"></div>
                                <div className="bg-[linear-gradient(to_right,rgb(255,255,255,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255,255,255,0.2)_1px,transparent_1px)] absolute inset-0 bg-[size:2.5rem_2.5rem] [mask-image:radial-gradient(ellipse_90%_90%_at_50%_50%,black,transparent)]"></div>
                                <Image
                                    src="/assets/dashboard-ai.png"
                                    alt="SynexAI Dashboard"
                                    width={1400}
                                    height={1400}
                                    quality={100}
                                    className="group-hover:scale-[1.05] group-hover:rotate-1 group-hover:brightness-125 relative z-10 shadow-[#1e40af]/50 shadow-lg transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1e40af]/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            </div>
                            <div className="-bottom-6 z-40 absolute inset-x-0 bg-gradient-to-t from-black via-black/90 to-transparent w-full h-1/2"></div>
                            <div className="bottom-0 md:-bottom-10 z-50 absolute inset-x-0 bg-gradient-to-t from-black via-black/95 to-transparent w-full h-1/3"></div>
                        </div>
                        <div className="z-50 flex justify-center items-center gap-8 whitespace-nowrap">
                            <Button asChild className="relative bg-gradient-to-r from-[#1e40af] hover:from-[#1e40af]/90 via-[#00D9F5] hover:via-[#00D9F5]/90 to-[#9945FF] hover:to-[#9945FF]/90 shadow-xl hover:shadow-2xl hover:shadow-[#1e40af]/30 backdrop-blur-xl hover:backdrop-blur-2xl px-10 py-7 border-none rounded-2xl text-lg transition-all duration-500 overflow-hidden group">
                                <Link href="/dashboard" className="flex items-center gap-3">
                                    <span className="relative z-10 bg-clip-text bg-gradient-to-r from-white to-white/80 font-bold">🚀Convert your first data to json</span>
                                    <ArrowRightIcon className="w-6 h-6 transition-transform group-hover:translate-x-1 duration-300" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#1e40af]/20 via-[#00D9F5]/20 to-[#9945FF]/20 animate-pulse"></div>
                                    <div className="bottom-0 absolute -inset-x-2 bg-gradient-to-r from-transparent via-[#1e40af] to-transparent opacity-50 h-px"></div>
                                </Link>
                            </Button>
                            </div>
                    </AnimationContainer>
                    </div>
  
            <MaxWidthWrapper>
                <AnimationContainer delay={0.4}>
                    <div className="relative py-14">
                        <div className="absolute inset-0"></div>
                        <div className="relative mx-auto px-4 md:px-8">
                            <h2 className="bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-black font-bold font-heading text-6xl text-center text-transparent uppercase tracking-wider animate-gradient-x">
                                Trusted by the best in the industry
                            </h2>
                        </div>
                    </div>
                
                   
                </AnimationContainer>
                </MaxWidthWrapper>
            </Wrapper>
            <Wrapper className="relative flex flex-col justify-center items-center py-20">
                <Container>
                    <div className="mx-auto max-w-md text-center">
                        <SectionBadge title="The Process" />
                        <h2 className="bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#A78BFA] to-[#F472B6] mt-8 font-bold text-4xl text-transparent lg:text-5xl">
                            Three steps to build your dream website
                        </h2>
                        <p className="mt-6 text-gray-400 text-lg">
                            Turn your vision into reality in just 3 simple steps
                        </p>
                    </div>
                </Container>
                <Container>
                    <div className="flex flex-col justify-center items-center py-16 w-full">
                        <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
                            {perks.map((perk) => (
                                <div key={perk.title} className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-[#0EA5E9] via-[#8B5CF6] to-[#EC4899] opacity-0 group-hover:opacity-50 blur-xl transition-all duration-500" />
                                    <div className="relative flex flex-col items-start border-white/10 bg-black/40 backdrop-blur-xl p-8 border rounded-2xl">
                                        <div className="bg-gradient-to-r from-[#0EA5E9]/20 via-[#8B5CF6]/20 to-[#EC4899]/20 p-3 rounded-xl">
                                            <perk.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="mt-6 font-semibold text-white text-xl">
                                            {perk.title}
                                        </h3>
                                        <p className="mt-4 text-gray-400">
                                            {perk.info}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Container>
            </Wrapper>

            {/* features */}
            <Wrapper className="relative flex flex-col justify-center items-center py-12">
                <div className="md:block top-0 -right-1/3 -z-10 absolute hidden bg-primary blur-[10rem] rounded-full w-72 h-72"></div>
                <div className="md:block bottom-0 -left-1/3 -z-10 absolute hidden bg-indigo-600 blur-[10rem] rounded-full w-72 h-72"></div>
                <Container>
                    <div className="mx-auto max-w-md text-start md:text-center">
                        <SectionBadge title="Features" />
                        <h2 className="mt-6 font-semibold text-3xl lg:text-4xl">
                            Discover our powerful features
                        </h2>
                        <p className="mt-6 text-muted-foreground">
                            Astra offers a range of features to help you build a stunning website in no time
                        </p>
                    </div>
                </Container>
                <Container>
                    <div className="flex justify-center items-center mx-auto mt-8">
                        <Icons.feature className="w-auto h-80" />
                    </div>
                </Container>
                <Container>
                    <div className="flex flex-col justify-center items-center py-10 md:py-20 w-full">
                        <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
                            {features.map((feature) => (
                                <div key={feature.title} className="flex flex-col items-start lg:items-start px-0 md:px-0">
                                    <div className="flex justify-center items-center">
                                        <feature.icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="mt-4 font-medium text-lg">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-2 text-muted-foreground text-start lg:text-start">
                                        {feature.info}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Container>
            </Wrapper>

            {/* pricing */}
            <Wrapper className="relative flex flex-col justify-center items-center py-12">
                <div className="md:block top-0 -right-1/3 -z-10 absolute hidden bg-blue-500 blur-[10rem] rounded-full w-72 h-72"></div>
                <Container>
                    <div className="mx-auto max-w-md text-start md:text-center">
                        <SectionBadge title="Pricing" />
                        <h2 className="mt-6 font-semibold text-3xl lg:text-4xl">
                            Unlock the right plan for your business
                        </h2>
                        <p className="mt-6 text-muted-foreground">
                            Choose the best plan for your business and start building your dream website today
                        </p>
                    </div>
                </Container>
                <Container className="flex justify-center items-center">
                    <div className="flex-wrap gap-5 md:gap-8 grid grid-cols-1 lg:grid-cols-3 py-10 md:py-20 w-full max-w-4xl">
                        {pricingCards.map((card) => (
                            <Card
                                key={card.title}
                                className={cn("flex flex-col w-full border-neutral-700",
                                    card.title === "Unlimited Saas" && "border-2 border-primary"
                                )}
                            >
                                <CardHeader className="border-b border-border">
                                    <span>
                                        {card.title}
                                    </span>
                                    <CardTitle className={cn(card.title !== "Unlimited Saas" && "text-muted-foreground")}>
                                        {card.price}
                                    </CardTitle>
                                    <CardDescription>
                                        {card.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-6">
                                    {card.features.map((feature) => (
                                        <div key={feature} className="flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-primary fill-primary" />
                                            <p>{feature}</p>
                                        </div>
                                    ))}
                                </CardContent>
                                <CardFooter className="mt-auto">
                                    <Link
                                        href="#"
                                        className={cn(
                                            "w-full text-center text-primary-foreground bg-primary p-2 rounded-md text-sm font-medium",
                                            card.title !== "Unlimited Saas" && "!bg-foreground !text-background"
                                        )}
                                    >
                                        {card.buttonText}
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </Container>
            </Wrapper>

            {/* testimonials */}
            <Wrapper className="relative flex flex-col justify-center items-center py-12">
                <div className="md:block -top-1/4 -left-1/3 -z-10 absolute hidden bg-indigo-500 blur-[10rem] rounded-full w-72 h-72"></div>
                <Container>
                    <div className="mx-auto max-w-md text-start md:text-center">
                        <SectionBadge title="Our Customers" />
                        <h2 className="mt-6 font-semibold text-3xl lg:text-4xl">
                            What people are saying
                        </h2>
                        <p className="mt-6 text-muted-foreground">
                            See how Astra empowers businesses of all sizes. Here&apos;s what real people are saying on Twitter
                        </p>
                    </div>
                </Container>
                <Container>
                    <div className="py-10 md:py-20 w-full">
                        <div className="relative flex flex-col justify-center items-center py-10 w-full h-full overflow-hidden">
                            <Marquee pauseOnHover className="[--duration:20s] select-none">
                                {firstRow.map((review) => (
                                    <figure
                                        key={review.name}
                                        className={cn(
                                            "relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
                                            "border-zinc-50/[.1] bg-background over:bg-zinc-50/[.15]",
                                        )}
                                    >
                                        <div className="flex flex-row items-center gap-2">
                                            <UserIcon className="w-6 h-6" />
                                            <div className="flex flex-col">
                                                <figcaption className="font-medium text-sm">
                                                    {review.name}
                                                </figcaption>
                                                <p className="font-medium text-muted-foreground text-xs">{review.username}</p>
                                            </div>
                                        </div>
                                        <blockquote className="mt-2 text-sm">{review.body}</blockquote>
                                    </figure>
                                ))}
                            </Marquee>
                            <Marquee reverse pauseOnHover className="[--duration:20s] select-none">
                                {secondRow.map((review) => (
                                    <figure
                                        key={review.name}
                                        className={cn(
                                            "relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
                                            "border-zinc-50/[.1] bg-background over:bg-zinc-50/[.15]",
                                        )}
                                    >
                                        <div className="flex flex-row items-center gap-2">
                                            <UserIcon className="w-6 h-6" />
                                            <div className="flex flex-col">
                                                <figcaption className="font-medium text-sm">
                                                    {review.name}
                                                </figcaption>
                                                <p className="font-medium text-muted-foreground text-xs">{review.username}</p>
                                            </div>
                                        </div>
                                        <blockquote className="mt-2 text-sm">{review.body}</blockquote>
                                    </figure>
                                ))}
                            </Marquee>
                            <div className="left-0 absolute inset-y-0 bg-gradient-to-r from-background w-1/3 pointer-events-none"></div>
                            <div className="right-0 absolute inset-y-0 bg-gradient-to-l from-background w-1/3 pointer-events-none"></div>
                        </div>
                    </div>
                </Container>
            </Wrapper>

            {/* newsletter */}
            <Wrapper className="relative flex flex-col justify-center items-center py-12">
                <Container>
                    <LampContainer>
                        <div className="relative flex flex-col justify-center items-center w-full text-center">
                            <h2 className="mt-8 font-semibold text-4xl lg:text-5xl xl:text-6xl lg:!leading-snug">
                                From Idea to Launch <br /> Faster Than Ever
                            </h2>
                            <p className="mx-auto mt-6 max-w-md text-muted-foreground">
                                Build stunning websites with Astra&apos;s intuitive drag-and-drop builder and powerful AI assistant
                            </p>
                            <Button variant="white" className="mt-6" asChild>
                                <Link href="/sign-in">
                                    Get started for free
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Link>
                            </Button>
                        </div>
                    </LampContainer>
                </Container>
                <Container className="relative z-[999999]">
                    <div className="flex justify-center items-center -mt-40 w-full">
                        <div className="flex md:flex-row flex-col justify-start md:justify-between items-start md:items-center px-4 md:px-8 py-4 md:py-8 border border-border/80 rounded-lg lg:rounded-2xl w-full">
                            <div className="flex flex-col items-start gap-4 w-full">
                                <h4 className="font-semibold text-xl md:text-2xl">
                                    Join our newsletter
                                </h4>
                                <p className="text-base text-muted-foreground">
                                    Be up to date with everything about AI builder
                                </p>
                            </div>
                            <div className="flex flex-col items-start gap-2 mt-5 md:mt-0 w-full md:w-max md:min-w-80">
                                <form action="#" className="flex md:flex-row flex-col items-center gap-2 w-full md:max-w-xs">
                                    <Input
                                        required
                                        type="email"
                                        placeholder="Enter your email"
                                        className="focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-transparent w-full duration-300"
                                    />
                                    <Button type="submit" size="sm" variant="secondary" className="w-full md:w-max">
                                        Subscribe
                                    </Button>
                                </form>
                                <p className="text-muted-foreground text-xs">
                                    By subscribing you agree with our{" "}
                                    <Link href="#">
                                        Privacy Policy
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </Container>
            </Wrapper>

        </section>
    )
};

export default HomePage
