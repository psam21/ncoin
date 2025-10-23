import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Nostr for India – Encrypted Messaging',
  description:
    'A decentralized messaging platform built on Nostr for secure, private communication.',
};

export default function HomePage() {
  redirect('/messages');
}
