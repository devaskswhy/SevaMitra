import { redirect } from 'next/navigation';

// Folded into the single-scroll /hub as the Register section.
export default function RegisterPage() {
  redirect('/hub#register');
}
