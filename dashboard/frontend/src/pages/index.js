import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Comprobar si el usuario está autenticado
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <Head>
        <title>CJ.DevMind - Dashboard</title>
        <meta name="description" content="Panel de control para CJ.DevMind" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">CJ.DevMind</h1>
          <p className="text-xl text-gray-300">
            Plataforma modular de desarrollo con IA
          </p>
        </div>

        {isLoggedIn ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Link href="/dashboard">
              <div className="bg-gray-800 rounded-lg p-8 shadow-lg hover:bg-gray-700 transition cursor-pointer">
                <h2 className="text-2xl font-bold text-white mb-4">Dashboard</h2>
                <p className="text-gray-300">
                  Accede a tu panel de control y gestiona tus proyectos
                </p>
              </div>
            </Link>
            
            <Link href="/projects">
              <div className="bg-gray-800 rounded-lg p-8 shadow-lg hover:bg-gray-700 transition cursor-pointer">
                <h2 className="text-2xl font-bold text-white mb-4">Proyectos</h2>
                <p className="text-gray-300">
                  Visualiza y gestiona tus proyectos actuales
                </p>
              </div>
            </Link>
            
            <Link href="/credits">
              <div className="bg-gray-800 rounded-lg p-8 shadow-lg hover:bg-gray-700 transition cursor-pointer">
                <h2 className="text-2xl font-bold text-white mb-4">Créditos</h2>
                <p className="text-gray-300">
                  Monitorea el uso de tus créditos de API
                </p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Bienvenido</h2>
            <p className="text-gray-300 mb-6">
              Inicia sesión o regístrate para acceder a tu dashboard
            </p>
            <div className="flex flex-col space-y-4">
              <button 
                onClick={() => router.push('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Iniciar Sesión
              </button>
              <button 
                onClick={() => router.push('/register')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Registrarse
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}