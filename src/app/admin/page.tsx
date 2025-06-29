import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AdminDashboard from './AdminDashboard';

export default async function AdminPage() {
  // Get session from cookie
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  
  if (!session) {
    redirect('/login');
  }

  let user;
  try {
    user = JSON.parse(session);
  } catch {
    redirect('/login');
  }

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    // Redirect to appropriate dashboard based on role
    const redirectUrl = user.role === 'MANAGER' ? '/manager/dashboard' : '/staff/shifts';
    redirect(redirectUrl);
  }

  return <AdminDashboard user={user} />;
} 