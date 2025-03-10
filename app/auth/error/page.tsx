import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams?.error || "An error occurred during authentication";
  
  let errorMessage = "There was a problem with your authentication.";
  
  if (error === "OAuthAccountNotLinked") {
    errorMessage = "We've detected that you're trying to sign in with a different method than you used previously. We've linked this new sign-in method to your account. Please try signing in again.";
  } else if (error === "AccessDenied") {
    errorMessage = "Access denied. You don't have permission to access this resource.";
  } else if (error === "Verification") {
    errorMessage = "The verification link is invalid or has expired.";
  } else if (error === "invalid_client") {
    errorMessage = "There was an issue with the authentication provider. Please try again.";
  }

  return (
    <div className="flex justify-center items-center px-4 w-full h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <CardTitle>Authentication Error</CardTitle>
          </div>
          <CardDescription>
            We encountered an issue while trying to authenticate you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{errorMessage}</p>
          <p className="text-muted-foreground text-sm">
            Error code: {error}
          </p>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button asChild variant="outline">
            <Link href="/">Go Home</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Try Again</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 