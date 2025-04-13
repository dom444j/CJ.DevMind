import Link from 'next/link';

export default function ProjectsOverview({ projects }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Proyectos Recientes</h2>
        <Link href="/projects">
          <button className="text-sm text-blue-400 hover:text-blue-300">
            Ver todos
          </button>
        </Link>
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-white">{project.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                project.status === 'active' ? 'bg-green-200 text-green-800' :
                project.status === 'completed' ? 'bg-blue-200 text-blue-800' :
                'bg-yellow-200 text-yellow-800'
              }`}>
                {project.status === 'active' ? 'Activo' :
                 project.status === 'completed' ? 'Completado' :
                 'Planificación'}
              </span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2.5">
              <div 
                className="bg-blue-500 h-2.5 rounded-full" 
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
            <div className="mt-2 text-right text-xs text-gray-400">
              {project.progress}% completado
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}