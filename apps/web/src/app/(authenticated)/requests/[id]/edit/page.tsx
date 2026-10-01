import { EditRequestScreen } from '@/components/requests/request-form-screen';

type EditRequestPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRequestPage({
  params,
}: EditRequestPageProps) {
  const { id } = await params;

  return <EditRequestScreen requestId={id} />;
}
