"use client";

import { cn } from "@/lib";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import Container from "./contanier";
import { Button } from "./ui/button";
import { PLAN, PLANS } from "../constants/pricing";
import Link from "next/link";

type Plan = "monthly" | "annually";

const Pricing = () => {

    const [billPlan, setBillPlan] = useState<Plan>("monthly");

    const handleSwitch = () => {
        setBillPlan((prev) => (prev === "monthly" ? "annually" : "monthly"));
    };

    return (
        <div className="relative flex flex-col items-center justify-center max-w-5xl py-20 mx-auto">

            <div className="flex flex-col items-center justify-center max-w-2xl mx-auto">
                <Container>
                    <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
                        <h1 className="text-3xl md:text-5xl lg:text-5xl font-heading font-black !leading-snug mt-6">
                            Find the right plan to simplify 
                            <br/> your invoicing.
                            </h1>
                        <p className="text-base md:text-lg text-center text-accent-foreground/80 mt-6">
                            Automate your invoice management with AI-powered efficiency. Generate invoices faster, reduce manual work, and get paid on time effortlessly.
                        </p>
                    </div>
                </Container>

                <Container delay={0.4}>
                    <div className="flex items-center justify-center space-x-4 mt-6">
                        <span className="text-base font-medium">Monthly</span>
                        <button onClick={handleSwitch} className="relative rounded-full focus:outline-none">
                            <div className="w-12 h-6 transition rounded-full shadow-md outline-none bg-blue-500"></div>
                            <div
                                className={cn(
                                    "absolute inline-flex items-center justify-center w-4 h-4 transition-all duration-500 ease-in-out top-1 left-1 rounded-full bg-white",
                                    billPlan === "annually" ? "translate-x-6" : "translate-x-0"
                                )}
                            />
                        </button>
                        <span className="text-base font-medium">Annually</span>
                    </div>
                </Container>
            </div>

            <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pt-8 lg:pt-12 gap-4 lg:gap-6 max-w-6xl mx-auto">
                {PLANS.map((plan, idx) => (
                    <Container key={idx} delay={0.1 * idx + 0.2}>
                        <Plan key={plan.id} plan={plan} billPlan={billPlan} />
                    </Container>
                ))}
            </div>
        </div>
    );
};

const Plan = ({ plan, billPlan }: { plan: PLAN, billPlan: Plan }) => {
    return (
        <div className={cn(
            "flex flex-col relative rounded-2xl lg:rounded-3xl transition-all bg-background/80 backdrop-blur-sm items-start w-full border border-foreground/10 overflow-hidden min-h-full",
            plan.title === "Mastermind" && "border-blue-500"
        )}>
            {plan.title === "Mastermind" && (
                <div className="absolute top-1/2 inset-x-0 mx-auto h-12 -rotate-45 w-full bg-blue-600 rounded-2xl lg:rounded-3xl blur-[8rem] -z-10"></div>
            )}

            <div className="p-4 md:p-8 flex rounded-t-2xl lg:rounded-t-3xl flex-col items-start w-full relative">
                <h2 className="font-black text-2xl text-foreground pt-5">
                    {plan.title}
                </h2>
                <h3 className="mt-3 text-4xl font-black md:text-6xl">
                    <NumberFlow
                        value={billPlan === "monthly" ? plan.monthlyPrice : plan.annuallyPrice}
                        suffix={billPlan === "monthly" ? "/mo" : "/yr"}
                        format={{
                            currency: "USD",
                            style: "currency",
                            currencySign: "standard",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                            currencyDisplay: "narrowSymbol"
                        }}
                    />
                </h3>
                <p className="text-sm md:text-base text-muted-foreground mt-2 font-medium">
                    {plan.desc}
                </p>
            </div>
            <div className="flex flex-col items-start w-full px-4 py-2 md:px-8 flex-grow">
                {plan.title === "Standard" ? (
                    <Link href={plan.link} className="w-full">
                        <button className="w-full py-3 px-4 rounded-full font-bold relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-pink-600 to-blue-600 bg-size-200 animate-gradient-x"></div>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white backdrop-blur-sm rounded-full"></div>
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-fuchsia-700 rounded-full blur opacity-0 group-hover:opacity-75 transition duration-300 group-hover:animate-pulse"></div>
                            <span className="relative z-10 text-white">{plan.buttonText}</span>
                        </button>
                    </Link>
                ) : (
                    <Link href={plan.link} className="w-full">
                        <Button size="lg" variant="secondary" className="w-full font-black">
                            {plan.buttonText}
                        </Button>
                    </Link>
                )}
                
                <div className="h-8 overflow-hidden w-full mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={billPlan}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="text-sm text-center text-muted-foreground mt-3 mx-auto block"
                        >
                            {billPlan === "monthly" ? (
                                "Billed monthly"
                            ) : (
                                "Billed in one annual payment"
                            )}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>
            <div className="flex flex-col items-start w-full p-5 mb-4 ml-1 gap-y-2 flex-grow">
                <span className="text-base text-left mb-2 font-black">
                    Includes: 
                </span>
                {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-start gap-2">
                        <div className="flex items-center justify-center">
                            <CheckIcon className="size-5 text-blue-500" />
                        </div>
                        <span className="font-medium">{feature}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Pricing;