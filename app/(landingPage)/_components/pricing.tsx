"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon } from "lucide-react";
import Link from "next/link";
import Container from "./contanier";
import SectionBadge from "./ui/section-badge";
import { PLANS } from "../constants/pricing";
import { cn } from "@/lib";
import NumberTicker from "./number-ticker";
import { Button } from "./ui/button";


type Plan = "monthly" | "yearly";

const Pricing = () => {
    return (
        <div className="relative flex flex-col justify-center items-center py-12 md:py-16 lg:py-24 w-full">
            <Container>
                <div className="flex flex-col items-center mx-auto max-w-xl text-center">
                    <SectionBadge title="Choose your plan" />
                    <h2 className="mt-6 font-black text-2xl md:text-4xl lg:text-5xl !leading-snug">
                        Simple and transparent pricing
                    </h2>
                    <p className="mt-6 text-base md:text-lg text-center text-accent-foreground/80">
                        Choose the plan that suits your needs. No hidden fees, no surprises.
                    </p>
                </div>
            </Container>
            <div className="relative flex flex-col justify-center items-center mt-8 w-full">
                <div className="hidden lg:block top-1/2 right-2/3 -z-10 absolute bg-primary/15 blur-[10rem] w-96 h-96 -translate-y-1/2 translate-x-1/4"></div>
                <div className="hidden lg:block top-1/2 left-2/3 -z-10 absolute bg-violet-500/20 blur-[10rem] w-96 h-96 -translate-x-1/4 -translate-y-1/2"></div>
                <div className="hidden lg:block top-1/2 left-2/3 -z-10 absolute bg-black blur-[10rem] w-96 h-96 -translate-x-1/4 -translate-y-1/2"></div>
                <div className="hidden lg:block top-1/2 right-2/3 -z-10 absolute bg-blue-500/20 blur-[10rem] w-96 h-96 -translate-x-1/4 -translate-y-1/2"></div>
                <Container>
                    <Tabs defaultValue="monthly" className="flex flex-col justify-center items-center w-full">
                        <TabsList>
                            <TabsTrigger value="monthly">
                                Monthly
                            </TabsTrigger>
                            <TabsTrigger value="yearly">
                                Yearly
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="monthly">
                            <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-14 w-full">
                                {PLANS.map((plan, index) => (
                                    <Plan
                                        key={index}
                                        index={index}
                                        {...plan}
                                        plan="monthly"
                                    />
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="yearly">
                            <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-14 w-full">
                                {PLANS.map((plan, index) => (
                                    <Plan
                                        key={index}
                                        index={index}
                                        {...plan}
                                        plan="yearly"
                                    />
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </Container>
            </div>
        </div>
    )
};

const Plan = ({
    id,
    title,
    desc,
    monthlyPrice,
    yearlyPrice,
    buttonText,
    features,
    index,
    plan,
}: {
    id: string;
    title: string;
    desc: string;
    monthlyPrice: number;
    yearlyPrice: number;
    buttonText: string;
    features: string[];
    index: number;
    plan: Plan;
}) => {

    const getDisplayedPrice = (plan: string, monthlyPrice: number, yearlyPrice: number) => {
        if (plan === "monthly") {
            return monthlyPrice === 0 ? 0 : monthlyPrice;
        } else if (plan === "yearly") {
            const discountedPrice = Math.round((yearlyPrice * 0.8) / 12);
            return yearlyPrice === 0 ? 0 : discountedPrice;
        }
        return 0;
    };

    const displayedPrice = getDisplayedPrice(plan, monthlyPrice, yearlyPrice);

    return (
        <div key={index} className="relative flex flex-col saturate-150 rounded-2xl w-full">

            <div
                className={cn(
                    "flex flex-col size-full border rounded-2xl relative p-3 [background-image:linear-gradient(345deg,rgba(255,255,255,0.01)_0%,rgba(255,255,255,0.03)_100%)]",
                    id === "pro" ? "border-primary/80" : "border-border/60",
                )}
            >
                {id === "pro" && (
                    <div className="inline-flex -top-3 left-1/2 absolute items-center bg-gradient-to-r from-pink-600 via-blue-600 to-violet-500 px-1 rounded-full min-w-min max-w-fit h-7 whitespace-nowrap -translate-x-1/2 select-none">
                        <span className="flex-1 bg-[length:250%_100%] bg-clip-text bg-gradient-to-r from-foreground to-foreground/80 px-2 font-medium text-transparent text-sm animate-background-shine">
                          🎉  Most Popular
                        </span>
                    </div>
                )}
                <div className="flex flex-col p-3 w-full">
                    <h2 className="font-medium text-xl">
                        {title}
                    </h2>
                    <p className="mt-2 text-muted-foreground text-sm break-words">
                        {desc}
                    </p>
                </div>
                <hr className="bg-border border-none w-full h-px shrink-0" role="separator" />
                <div className="relative flex flex-col flex-1 gap-4 p-3 w-full h-full text-left break-words align-top">
                    <div className="flex items-end gap-2">
                        <div className="flex items-end gap-1 w-40">
                            <span className="font-black text-3xl md:text-4xl">
                                ${displayedPrice === 0 ? 0 : <NumberTicker value={displayedPrice} />}
                            </span>
                            {/* In here 120 * 0.8 = 96 and /12 to get monthly price */}
                            <span className="font-headin font-medium text-muted-foreground text-lg">
                                per {plan === "monthly" ? "month" : "month"}
                            </span>
                        </div>
                        <AnimatePresence>
                            {(id !== "free" && plan === "yearly") && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    transition={{ duration: 0.2 }}
                                    aria-hidden="true"
                                    className="bg-primary mb-1 px-2 py-0.5 rounded font-medium text-foreground text-xs"
                                >
                                    -20%
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                    <ul className="flex flex-col gap-2">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <CheckIcon aria-hidden="true" className="w-5 h-5 text-primary" />
                                <p className="text-muted-foreground text-sm md:text-base">
                                    {feature}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex items-center mt- p-3 w-full h-auto">
                    <Button
                        asChild
                        variant={id === "pro" ? "default" : "tertiary"}
                        className="shadow-none w-full hover:scale-100 hover:translate-y-0"   
                    >

                        <Link href={"/dashboard/upgrade"}>
                            {buttonText}
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
};

export default Pricing