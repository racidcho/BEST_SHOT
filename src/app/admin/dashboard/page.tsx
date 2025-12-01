import { supabase } from '@/lib/supabase';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
    const { data: participants } = await supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: true });

    return <AdminDashboardClient initialParticipants={participants || []} />;
}
