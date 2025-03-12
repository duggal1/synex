"use client";

import { useEffect, useState } from 'react';
import { XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';

export default function PaymentFailedPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const sessionId = searchParams.get('session_id');

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

  const handleRetry = () => {
    window.location.href = `/invoice/${params.id}`;
  };

  return (
    <div className="flex justify-center items-center bg-gray-50 p-4 min-h-screen">
      <Card className="shadow-lg border-red-500 w-full max-w-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto">
            <XCircle className="mx-auto w-16 h-16 text-red-500" />
          </div>
          <CardTitle className="font-bold text-red-500 text-3xl">Payment Failed</CardTitle>
          <CardDescription className="text-lg">
            We were unable to process your payment. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentDetails && (
            <div className="space-y-4">
              <div className="space-y-3 bg-gray-50 p-6 rounded-lg">
                <p className="text-lg"><strong>Amount:</strong> {paymentDetails.amount}</p>
                <p className="text-lg"><strong>Invoice Number:</strong> {paymentDetails.invoiceNumber}</p>
                <p className="text-lg">For assistance, please contact <strong>{paymentDetails.fromEmail}</strong></p>
              </div>
              <div className="flex justify-center mt-8">
                <Button onClick={handleRetry} size="lg" className="px-8 py-6 text-lg">
                  Try Payment Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 