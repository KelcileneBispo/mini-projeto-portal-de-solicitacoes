import { RequestsScreen } from '@/components/requests/requests-screen';

type HomePageProps = {
  searchParams: Promise<{ aviso?: string | string[] }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const notice = typeof params.aviso === 'string' ? params.aviso : undefined;

  return <RequestsScreen notice={notice} />;
}
