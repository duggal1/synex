'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";

interface ContactCardProps {
  fromEmail: string;
  mailtoLink: string;
}

export function ContactCard({ fromEmail, mailtoLink }: ContactCardProps) {
  const handleMailTo = () => window.open(mailtoLink, '_blank');

  return (
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
  );
}
