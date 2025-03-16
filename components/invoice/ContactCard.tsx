'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";

interface ContactCardProps {
  fromEmail: string;
  mailtoLink: string;
}

export function ContactCard({ fromEmail, mailtoLink }: ContactCardProps) {
  const [fallbackClicked, setFallbackClicked] = useState(false);

  const handleMailTo = () => {
    // Try native mailto first
    window.location.href = mailtoLink;
    
    // Set a flag to show fallback after a short delay
    setTimeout(() => {
      setFallbackClicked(true);
    }, 300);
  };

  const handleGmailFallback = () => {
    const subject = `Re: Invoice`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${fromEmail}&su=${encodeURIComponent(subject)}`;
    window.open(gmailUrl, '_blank');
  };

  const handleOutlookFallback = () => {
    const subject = `Re: Invoice`;
    const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${fromEmail}&subject=${encodeURIComponent(subject)}`;
    window.open(outlookUrl, '_blank');
  };

  return (
    <div className="relative">
      <Card className="bg-black/40 border border-zinc-800/30 shadow-2xl rounded-2xl overflow-hidden relative backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5"></div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-violet-500/10">
                <Mail className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm">Contact the sender</p>
                <p className="text-white font-medium">{fromEmail}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="hover:bg-violet-500/10 text-violet-400"
              onClick={handleMailTo}
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {fallbackClicked && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-black/90 border border-zinc-800/50 rounded-xl backdrop-blur-xl shadow-2xl z-20">
          <p className="text-zinc-400 text-sm mb-3">Choose your email client:</p>
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start hover:bg-zinc-800/50"
              onClick={handleGmailFallback}
            >
              Open in Gmail
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start hover:bg-zinc-800/50"
              onClick={handleOutlookFallback}
            >
              Open in Outlook
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start hover:bg-zinc-800/50"
              onClick={() => setFallbackClicked(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
