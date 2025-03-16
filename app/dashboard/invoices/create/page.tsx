import { CreateInvoice } from "@/app/components/CreateInvoice";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/app/utils/hooks";
import prisma from "@/app/utils/db";

export default async function CreateInvoicePage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: {
        select: { status: true }
      }
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  return (
    <Card className="border-none shadow-none">
      <CreateInvoice 
        firstName={user.firstName || ""}
        lastName={user.lastName || ""}
        email={user.email || ""}
        address={user.address || ""}
        invoiceCount={user.invoiceCount || 0}
        isSubscribed={user.subscription?.status === "ACTIVE"}
      />
    </Card>
  );
}
