export default function RecentActivity({ activities }) {
  // Función para formatear fechas
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Actividad Reciente</h2>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start">
            <div className="bg-blue-500 rounded-full p-2 mr-4">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white">
                <span className="font-medium">{activity.action}</span> - {activity.target}
              </p>
              <p className="text-gray-400 text-sm">{formatDate(activity.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <button className="text-blue-400 hover:text-blue-300 text-sm">
          Ver todo el historial
        </button>
      </div>
    </div>
  );
}