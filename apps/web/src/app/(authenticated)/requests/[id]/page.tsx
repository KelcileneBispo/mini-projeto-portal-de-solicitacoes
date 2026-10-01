import { RequestDetailScreen } from '@/components/requests/request-detail-screen';

type RequestPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string | string[] }>;
};

export default async function RequestPage({
  params,
  searchParams,
}: RequestPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const notice = typeof query.aviso === 'string' ? query.aviso : undefined;

  return <RequestDetailScreen requestId={id} notice={notice} />;
}
