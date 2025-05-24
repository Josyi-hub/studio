
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Default to login page now that auth is implemented
  redirect('/login'); 
  return null;
}
