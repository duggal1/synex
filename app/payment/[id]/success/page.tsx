"use client";

import { useEffect, useState } from 'react';
import { CheckCircle, Mail, Receipt, CreditCard } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTheme } from "next-themes";

export default function PaymentSuccessPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const response = await fetch(`/api/payment-status?session_id=${sessionId}`);
        const data = await response.json();
        setPaymentDetails(data);
      } catch (error) {
        console.error('Error fetching payment details:', error);
      }
    };

    if (sessionId) {
      fetchPaymentDetails();
    }
  }, [sessionId]);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) return null;

  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-white dark:from-zinc-900 to-gray-100 dark:to-black p-4 w-full min-h-screen transition-colors duration-300">
      <div className="top-4 right-4 absolute">
        <button
          onClick={toggleTheme}
          className="bg-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 dark:bg-zinc-800 p-2 rounded-full transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-zinc-700" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>

      <Card className="bg-white dark:bg-zinc-900 bg-opacity-90 dark:bg-opacity-90 shadow-xl backdrop-blur-sm border-0 rounded-2xl w-full max-w-md overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 dark:from-emerald-500/5 to-emerald-600/5 dark:to-emerald-800/10 rounded-2xl" />
        
        <CardHeader className="relative pt-8 pb-0">
          <div className="flex flex-col items-center">
            <div className="flex justify-center items-center bg-emerald-100 dark:bg-emerald-900/30 mb-6 rounded-full ring-8 ring-emerald-50 dark:ring-emerald-900/20 w-16 h-16">
              <CheckCircle className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h2 className="mb-1 font-bold text-zinc-900 dark:text-white text-2xl">Payment Successful</h2>
            <p className="max-w-xs text-zinc-500 dark:text-zinc-400 text-center">
              Your transaction has been processed successfully
            </p>
          </div>
        </CardHeader>

        <CardContent className="relative pt-6">
          {paymentDetails ? (
            <div className="space-y-6">
              <div className="backdrop-blur-sm rounded-xl overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-zinc-100 dark:border-zinc-800 border-b">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-zinc-500 dark:text-zinc-400 text-sm">Amount Paid</span>
                  </div>
                  <span className="font-medium text-zinc-900 dark:text-white">{paymentDetails.amount}</span>
                </div>
                
                <div className="flex justify-between items-center px-6 py-4 border-zinc-100 dark:border-zinc-800 border-b">
                  <div className="flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-zinc-500 dark:text-zinc-400 text-sm">Invoice Number</span>
                  </div>
                  <span className="font-medium text-zinc-900 dark:text-white">{paymentDetails.invoiceNumber}</span>
                </div>
                
                <div className="flex justify-between items-center px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-zinc-500 dark:text-zinc-400 text-sm">Confirmation sent to</span>
                  </div>
                  <span className="max-w-[180px] font-medium text-zinc-900 dark:text-white truncate">{paymentDetails.fromEmail}</span>
                </div>
              </div>
              
              <div className="pt-4 border-zinc-100 dark:border-zinc-800 border-t">
                <p className="text-zinc-500 dark:text-zinc-400 text-xs text-center">
                  Questions? Contact <span className="text-emerald-500 dark:text-emerald-400">{paymentDetails.fromEmail}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <div className="flex flex-col items-center space-y-4 w-full animate-pulse">
                <div className="bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 h-4"></div>
                <div className="bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 h-4"></div>
                <div className="bg-zinc-200 dark:bg-zinc-700 rounded w-2/3 h-4"></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}