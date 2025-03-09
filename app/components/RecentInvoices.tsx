import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "../utils/db";
import { requireUser } from "../utils/hooks";
import { formatCurrency } from "../utils/formatCurrency";

async function getData(userId: string) {
  const data = await prisma.invoice.findMany({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      clientName: true,
      clientEmail: true,
      total: true,
      currency: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 7,
  });
  return data;
}

export async function RecentInvoices() {
  const session = await requireUser();
  const data = await getData(session.user?.id as string);
  
  return (
    <div className="w-full">
      <Card className="bg-black shadow-lg border border-zinc-800 rounded-xl overflow-hidden bo">
        <CardHeader className="pt-6 pb-2">
          <CardTitle className="font-medium text-lg tracking-tight">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-4">
            {data.map((item) => (
              <div 
                key={item.id}
                className="flex items-center gap-4 hover:bg-accent/40 p-3 rounded-lg transition-all"
              >
                <Avatar className="border-2 border-primary/10 size-10">
                  <AvatarFallback className="bg-primary/10 font-medium text-primary">
                    {item.clientName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex flex-col">
                  <p className="font-medium text-sm">
                    {item.clientName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {item.clientEmail}
                  </p>
                </div>
                
                <div className="flex items-center ml-auto font-medium text-green-500 text-sm">
                  <span className="mr-1 text-green-500">+</span>
                  {formatCurrency({
                    amount: item.total,
                    currency: item.currency as any,
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}