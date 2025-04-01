import { redirect } from 'next/navigation';

export default function Home() {
  // This will perform a server-side redirect to the static landing page
  redirect('/welcome');
}