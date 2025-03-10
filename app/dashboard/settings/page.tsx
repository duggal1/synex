"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, KeyRound, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { deleteAccount, getStripeSettings, saveStripeKeys } from "./actions";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [stripeApiKey, setStripeApiKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadStripeSettings = async () => {
      setIsLoading(true);
      try {
        const result = await getStripeSettings();
        if (result.success && result.data) {
          setStripeApiKey(result.data.stripeApiKey || "");
          setStripeSecretKey(result.data.stripeSecretKey || "");
        }
      } catch (error) {
        toast.error("Failed to load Stripe settings");
      } finally {
        setIsLoading(false);
      }
    };

    loadStripeSettings();
  }, []);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAccount();
      if (result.success) {
        toast.success("Account deleted successfully");
        router.push("/");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSaveStripeKeys = async () => {
    setIsSaving(true);
    try {
      const result = await saveStripeKeys(stripeApiKey, stripeSecretKey);
      if (result.success) {
        toast.success("Stripe keys saved successfully");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error("Failed to save Stripe keys");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 mx-auto max-w-4xl container">
      <div className="flex flex-col gap-4">
        <h1 className="font-bold text-4xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and Stripe integration
        </p>
      </div>

      <Separator />

      {/* Stripe Integration Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Stripe Integration
          </CardTitle>
          <CardDescription>
            Configure your Stripe account for payment processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Stripe API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={stripeApiKey}
              onChange={(e) => setStripeApiKey(e.target.value)}
              placeholder="pk_test_..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secretKey">Stripe Secret Key</Label>
            <Input
              id="secretKey"
              type="password"
              value={stripeSecretKey}
              onChange={(e) => setStripeSecretKey(e.target.value)}
              placeholder="sk_test_..."
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" disabled>
            Connect with Stripe
            <span className="ml-2 text-muted-foreground text-xs">(Coming Soon)</span>
          </Button>
          <Button onClick={handleSaveStripeKeys} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
            Save Keys
          </Button>
        </CardFooter>
      </Card>

      {/* Danger Zone Section */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Once you delete your account, there is no going back. This action
            cannot be undone.
          </p>
        </CardContent>
        <CardFooter>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 w-4 h-4" />
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                  Delete Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
} 