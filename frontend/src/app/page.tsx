// ============================================
// KasirPro — Home Page (redirects to POS)
// ============================================

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/pos');
}
