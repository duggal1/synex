"use client";

import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentSuccessPage({ params }: { params: { id: string } }) {
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

  return (
    <div className="flex justify-center items-center bg-gray-50 p-4 min-h-screen">
      <Card className="shadow-lg border-green-500 w-full max-w-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto">
            <CheckCircle className="mx-auto w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="font-bold text-green-500 text-3xl">Payment Successful!</CardTitle>
          <CardDescription className="text-lg">
            Thank you for your payment. A confirmation has been sent to your email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentDetails && (
            <div className="space-y-4">
              <div className="space-y-3 bg-gray-50 p-6 rounded-lg">
                <p className="text-lg"><strong>Amount Paid:</strong> {paymentDetails.amount}</p>
                <p className="text-lg"><strong>Invoice Number:</strong> {paymentDetails.invoiceNumber}</p>
                <p className="text-lg">You will receive a confirmation email from <strong>{paymentDetails.fromEmail}</strong></p>
              </div>
              <p className="mt-6 text-muted-foreground text-center">
                If you have any questions, please contact {paymentDetails.fromEmail}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 