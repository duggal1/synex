// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Image from "next/image";
import SignUpForm from "@/components/auth/signup-form";
import Link from "next/link";

const SignUpPage = () => {
    return (
        <div className="flex flex-col items-center mx-auto pt-10 md:pt-24 max-w-md h-screen text-white/90 overflow-hidden">
            <div className="flex justify-center items-center -mt-32 py-6 border-b w-full">
                <Image
                    src="/images/synexai.png" 
                alt="synexAI logo" 
                width={280} 
                height={50}
                className="object-contain"
                priority
            />
            </div>
   

            <SignUpForm />

            <div className="flex flex-col items-center mt-6 w-full">
                <p className="text-center text-gray-400 text-sm">
                    By signing up, you agree to our{" "}
                    <Link href="/terms" className="text-blue-400 hover:underline">
                        Terms of Service
                    </Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-blue-400 hover:underline">
                        Privacy Policy
                    </Link>
                </p>
            </div>
            <div className="relative flex items-start mt-8 py-6 bg-clip-border border-t-4 border-transparent w-full" style={{borderImage: "linear-gradient(to right, #8b5cf6, #ec4899, #06b6d4) 1"}}>
            <p className="text-muted-foreground text-sm">
                    Already have an account?{" "}
                    <Link href="/auth/sign-in" className="text-blue-400 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
};

export default SignUpPage
