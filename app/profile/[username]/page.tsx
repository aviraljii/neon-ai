import { ProfileLinksClient } from '@/components/profile/ProfileLinksClient';

type PageProps = {
  params: Promise<{ username: string }>;
};

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  return <ProfileLinksClient username={username} />;
}
