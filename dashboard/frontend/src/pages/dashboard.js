import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import ProjectsOverview from '../components/ProjectsOverview';
import CreditsUsage from '../components/CreditsUsage';
import RecentActivity from '../components/RecentActivity';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Obtener datos del usuario
    const fetchUserData = async () => {
      try {
        // Aquí iría la llamada a la API
        // const response = await fetch('/api/user', { headers: { Authorization: `Bearer ${token}` } });
        // const data = await response.json();
        
        // Simulamos datos para el ejemplo
        const mockUserData = {
          id: '1',
          name: 'Usuario Demo',
          email: 'demo@example.com',
          plan: 'Professional',
          credits: 750,
          totalCredits: 1000,
          projects: [
            { id: '1', name: 'E-commerce App', status: 'active', progress: 75 },
            { id: '2', name: 'Blog Personal', status: 'completed', progress: 100 },
            { id: '3', name: 'Dashboard Admin', status: 'planning', progress: 20 }
          ],
          recentActivity: [
            { id: '1', action: 'Generó componente', target: 'Tabla de productos', timestamp: '2023-05-15T14:30:00Z' },
            { id: '2', action: 'Ejecutó Vision Agent', target: 'E-commerce App', timestamp: '2023-05-14T10:15:00Z' },
            { id: '3', action: 'Creó proyecto', target: 'Dashboard Admin', timestamp: '2023-05-10T09:00:00Z' }
          ]
        };
        
        setUser(mockUserData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Head>
        <title>Dashboard | CJ.DevMind</title>
        <meta name="description" content="Panel de control de CJ.DevMind" />
      </Head>

      <Sidebar activePage="dashboard" />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Bienvenido de nuevo, {user.name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Plan Actual</h2>
            <div className="text-3xl font-bold text-blue-500 mb-2">{user.plan}</div>
            <p className="text-gray-400">Licencia válida hasta: 15/11/2023</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Créditos API</h2>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    Uso
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {user.credits}/{user.totalCredits}
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div style={{ width: `${(user.credits / user.totalCredits) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
              </div>
            </div>
            <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1 px-3 rounded">
              Comprar más
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Proyectos</h2>
            <div className="text-3xl font-bold text-blue-500 mb-2">{user.projects.length}</div>
            <p className="text-gray-400">
              {user.projects.filter(p => p.status === 'active').length} activos, 
              {user.projects.filter(p => p.status === 'completed').length} completados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ProjectsOverview projects={user.projects} />
          <CreditsUsage />
        </div>

        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <RecentActivity activities={user.recentActivity} />
        </div>
      </main>
    </div>
  );
}