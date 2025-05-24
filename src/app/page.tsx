import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
  // The redirect function handles the navigation, so this component doesn't need to return JSX.
  // However, to satisfy linters or Next.js expectations for a page component,
  // returning null or an empty fragment is common practice.
  return null;
}
