import { Outlet } from 'react-router';
import { useSession } from '../modules/auth';
import { UnavailablePage } from './UnavailablePage';

export const AdminGate = () => useSession().session?.user.role === 'admin' ? <Outlet /> : <UnavailablePage />;
