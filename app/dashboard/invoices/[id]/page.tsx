import { EditInvoice } from "@/app/components/EditInvoice";
import prisma from "@/app/utils/db";
import { requireUser } from "@/app/utils/hooks";
import { notFound } from "next/navigation";

async function getData(id: string, userId: string) {
  const data = await prisma.invoice.findUnique({
    where: {
      id: id,
      userId: userId,
    },
  });

  if (!data) {
    return notFound();
  }

  return data;
}

type Params = Promise<{ id: string }>;

export default async function EditInvoiceRoute({ params }: { params: Params }) {
  const { id } = await params;
  const session = await requireUser();
  const data = await getData(id, session.user?.id as string);

  return <EditInvoice data={data} />;
} 