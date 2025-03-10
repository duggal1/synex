import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import prisma from "../utils/db";

function LoginForm({ callbackUrl, errorMessage, previousProvider }: { 
  callbackUrl: string, 
  errorMessage?: string,
  previousProvider?: string 
}) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Choose your preferred way to sign in
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        {previousProvider === 'google' && (
          <form
            action={async () => {
              "use server";
              await signIn("google", {
                callbackUrl,
              });
            }}
          >
            <Button className="bg-blue-600 hover:bg-blue-700 w-full text-white">
              <svg className="mr-2 w-4 h-4" viewBox="0 0 24 24">
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
              Continue with Google (Fast Sign-in)
            </Button>
          </form>
        )}
        
        {!previousProvider && (
          <form
            action={async () => {
              "use server";
              await signIn("google", {
                callbackUrl,
              });
            }}
          >
            <Button className="w-full" variant="outline">
              <svg className="mr-2 w-4 h-4" viewBox="0 0 24 24">
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
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="border-t w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
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
          className="flex flex-col gap-y-4"
        >
          <div className="flex flex-col gap-y-2">
            <Label>Email</Label>
            <Input
              name="email"
              type="email"
              required
              placeholder="hello@hello.com"
            />
          </div>
          <SubmitButton text="Login with Email" />
        </form>
      </CardContent>
    </Card>
  );
}

// Function to get the previous provider from cookies or localStorage
async function getPreviousProvider() {
  try {
    // In a server component, we can't access localStorage directly
    // This would need to be implemented with cookies in a real app
    // For now, we'll check if the user has any Google accounts
    const googleAccounts = await prisma.account.findMany({
      where: {
        provider: "google",
      },
      take: 1,
    });
    
    return googleAccounts.length > 0 ? "google" : undefined;
  } catch (error) {
    console.error("Error getting previous provider:", error);
    return undefined;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const session = await auth();

  // If user is already authenticated and there's no error, redirect to dashboard
  if (session?.user && !searchParams?.error) {
    redirect("/dashboard");
  }

  const callbackUrl = searchParams?.callbackUrl || "/dashboard";
  
  // Get the previous provider to show the fast login button
  const previousProvider = await getPreviousProvider();
  
  let errorMessage;
  if (searchParams?.error === "OAuthAccountNotLinked") {
    errorMessage = "We've linked your new sign-in method to your account. Please try signing in again.";
  } else if (searchParams?.error) {
    errorMessage = "There was a problem with your authentication. Please try again.";
  }

  return (
    <>
      <div className="bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] -z-10 absolute inset-0 bg-white bg-[size:6rem_4rem] w-full h-full">
        <div className="top-0 right-0 bottom-0 left-0 absolute bg-[radial-gradient(circle_500px_at_50%_200px,#C9EBFF,transparent)]"></div>
      </div>
      <div className="flex justify-center items-center px-4 w-full h-screen">
        <LoginForm 
          callbackUrl={callbackUrl} 
          errorMessage={errorMessage} 
          previousProvider={previousProvider}
        />
      </div>
    </>
  );
}
