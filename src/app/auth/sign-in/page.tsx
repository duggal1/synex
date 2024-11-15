// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Icons } from "@/components";
import SignInForm from "@/components/auth/signin-form";
import Link from "next/link";
import Image from "next/image";              

const SignInPage = () => {
    return (
        <div className="flex flex-col items-start mx-auto pt-4 md:pt-20 max-w-sm h-dvh overflow-hidden">
            <Image 
                src="/images/synexai.png" 
                alt="synexAI logo" 
                width={300} 
                height={50}
                className="object-contain"
                priority
            />
           
            <div className="flex items-center py-8 border-b border-border/80 w-full">
                
            </div>

            <SignInForm />

            <div className="flex flex-col items-start w-full">
                <p className="text-gray-200 text-sm">
                    By signing in, you agree to our{" "}
                    <Link href="/terms" className="text-blue-700/80 hover:text-blue-800 hover:underline">
                        Terms of Service{" "}
                    </Link>
                    and{" "}
                    <Link href="/privacy" className="text-blue-700/80 hover:text-blue-800 hover:underline">
                        Privacy Policy
                    </Link>
                </p>
            </div>
            <div className="relative flex items-start mt-8 py-6 bg-clip-border border-t-4 border-transparent w-full" style={{borderImage: "linear-gradient(to right, #8b5cf6, #ec4899, #06b6d4) 1"}}>
                <p className="text-muted-foreground text-sm">
                    Don&apos;t have an account?{" "}
                    <Link href="/auth/sign-up" className="text-primary">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
};

export default SignInPage
