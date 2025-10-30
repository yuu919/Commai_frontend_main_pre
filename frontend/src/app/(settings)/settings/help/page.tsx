import { redirect } from 'next/navigation';

export default function HelpRedirectPage() {
  const url = process.env.HELP_CENTER_URL;
  if (url && url.length > 0) {
    redirect(url);
  } else {
    redirect('https://bdc-office.com/');
  }
  return null;
}


