import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agent Conversation | Research Assistant',
  description: 'Interactive agent conversation powered by Research Assistant',
  openGraph: {
    title: 'Agent Conversation | Research Assistant',
    description: 'Interactive agent conversation powered by Research Assistant',
    type: 'website',
  },
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
