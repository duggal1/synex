import { User } from "@prisma/client"

export interface ExtendedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  invoiceCount: number;
  isSubscribed: boolean;
  subscription?: {
    status: string;
    planType: string;
  };
}

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  className?: string;
  indicatorClassName?: string;
}
