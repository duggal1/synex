"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  DownloadCloudIcon,
  Mail,
  MoreHorizontal,
  Pencil,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface iAppProps {
  id: string;
  status: string;
}

export function InvoiceActions({ id, status }: iAppProps) {
  const handleSendReminder = () => {
    toast.promise(
      fetch(`/api/email/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }),
      {
        loading: "Sending reminder...",
        success: (data) => "Reminder email sent successfully",
        error: "Failed to send reminder email",
        duration: 2000,
        classNames: {
          toast: "bg-black/60 backdrop-blur-sm border border-neutral-800/50",
          title: "text-neutral-200",
          description: "text-neutral-400",
          loader: "text-blue-500",
          success: "text-emerald-500",
          error: "text-red-500",
        }
      }
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={cn(
            "h-8 w-8",
            "bg-transparent",
            "hover:bg-white/5",
            "border-0",
            "transition-colors duration-200",
            "flex items-center justify-center"
          )}
        >
          <MoreHorizontal className="w-4 h-4 text-neutral-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className={cn(
          "bg-black/60 border border-neutral-800/50",
          "backdrop-blur-sm",
          "animate-in fade-in-0 zoom-in-95",
          "duration-200"
        )}
      >
        <DropdownMenuItem 
          asChild
          className="hover:bg-white/5 focus:bg-white/5"
        >
          <Link href={`/dashboard/invoices/${id}`} className="gap-2">
            <Pencil className="size-4 text-neutral-400" /> 
            <span>Edit Invoice</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          asChild
          className="hover:bg-white/5 focus:bg-white/5"
        >
          <Link href={`/api/invoice/${id}`} target="_blank" className="gap-2">
            <DownloadCloudIcon className="size-4 text-neutral-400" /> 
            <span>Download Invoice</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSendReminder}
          className="gap-2 hover:bg-white/5 focus:bg-white/5"
        >
          <Mail className="size-4 text-neutral-400" /> 
          <span>Reminder Email</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          asChild
          className="hover:bg-white/5 focus:bg-white/5"
        >
          <Link href={`/dashboard/invoices/${id}/delete`} className="gap-2">
            <Trash className="size-4 text-red-400" /> 
            <span className="text-red-400">Delete Invoice</span>
          </Link>
        </DropdownMenuItem>
        {status !== "PAID" && (
          <DropdownMenuItem 
            asChild
            className="hover:bg-white/5 focus:bg-white/5"
          >
            <Link href={`/dashboard/invoices/${id}/paid`} className="gap-2">
              <CheckCircle className="size-4 text-emerald-400" /> 
              <span className="text-emerald-400">Mark as Paid</span>
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
