import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, signIn } from "../utils/auth";
import { SubmitButton } from "../components/SubmitButtons";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";


function LoginForm({ 
  callbackUrl, 
  errorMessage 
}: { 
  callbackUrl: string, 
  errorMessage?: string
}) {
  return (
    <Card className="bg-black shadow-xl shadow-zinc-900/20 backdrop-blur-sm border border-zinc-800 w-full max-w-sm text-white">
      <div className="flex justify-center items-center mt-10">
        <Image 
          src="/logo.png" 
          alt="Synex AI" 
          width={100} 
          height={100}
          className="w-auto h-16"
          priority // Improve loading performance
        />
      </div>
      <CardHeader className="font-light text-white text-2xl text-center tracking-tight">Welcome to Synex AI</CardHeader>
      <CardHeader className="pb-6">
        <CardTitle className="font-light text-white text-2xl tracking-tight">Sign In</CardTitle>
        <CardDescription className="text-zinc-400">
          Choose your preferred authentication method
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {errorMessage && (
          <Alert variant="destructive" className="bg-red-900/20 mb-4 border border-red-800 text-red-200">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <form
          action={async () => {
            "use server";
            await signIn("google", {
              callbackUrl,
            });
          }}
        >
          <Button className="bg-zinc-900 hover:bg-zinc-800 py-6 border border-zinc-800 w-full text-white transition-all duration-300">
            <svg className="mr-2 w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="border-zinc-800 border-t w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black px-3 font-medium text-zinc-500">
              Or
            </span>
          </div>
        </div>

        <form
          action={async (formData) => {
            "use server";
            await signIn("nodemailer", {
              email: formData.get("email") as string,
              callbackUrl,
            });
          }}
          className="flex flex-col gap-y-6"
        >
          <div className="flex flex-col gap-y-2">
            <Label className="mb-1 font-normal text-zinc-400 text-sm">Email Address</Label>
            <Input
              name="email"
              type="email"
              required
              placeholder="hello@example.com"
              className="bg-zinc-900 px-4 py-6 border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-white/20 text-white placeholder:text-zinc-600"
            />
          </div>
          <SubmitButton 
            text="Continue with Email" 
          />
        </form>
      </CardContent>
    </Card>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const session = await auth();

  if (session?.user && !searchParams?.error) {
    redirect("/dashboard");
  }

  const callbackUrl = searchParams?.callbackUrl || "/dashboard";
  
  let errorMessage;
  if (searchParams?.error === "OAuthAccountNotLinked") {
    errorMessage = "We've linked your new sign-in method to your account. Please try signing in again.";
  } else if (searchParams?.error) {
    errorMessage = "There was a problem with your authentication. Please try again.";
  }

  return (
    <div className="flex justify-center items-center bg-gradient-to-b from-black to-zinc-900 px-4 w-full min-h-screen">
      <div className="z-0 absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(50,50,50,0.1)_0,_rgba(0,0,0,0)_70%)]"></div>
      <LoginForm 
        callbackUrl={callbackUrl} 
        errorMessage={errorMessage}
      />
    </div>
  );
}