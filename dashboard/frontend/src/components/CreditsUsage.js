import { useEffect, useRef } from 'react';

export default function CreditsUsage() {
  const chartRef = useRef(null);

  // Datos de ejemplo para el gráfico
  const mockData = {
    labels: ['GPT-4', 'GPT-3.5', 'Claude', 'Pinecone', 'Otros'],
    datasets: [
      {
        data: [45, 25, 15, 10, 5],
        backgroundColor: [
          '#3B82F6', // blue-500
          '#10B981', // emerald-500
          '#F59E0B', // amber-500
          '#EF4444', // red-500
          '#8B5CF6'  // violet-500
        ],
        borderWidth: 0,
      }
    ]
  };

  useEffect(() => {
    // Aquí normalmente cargaríamos Chart.js y crearíamos el gráfico
    // Para este ejemplo, solo mostraremos un placeholder
    console.log('Chart would be initialized here with data:', mockData);
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-bold text-white mb-6">Uso de Créditos</h2>
      
      <div className="flex flex-col space-y-4">
        {mockData.labels.map((label, index) => (
          <div key={label} className="flex items-center">
            <div 
              className="w-4 h-4 rounded-full mr-2" 
              style={{ backgroundColor: mockData.datasets[0].backgroundColor[index] }}
            ></div>
            <span className="text-white">{label}</span>
            <span className="ml-auto text-white">{mockData.datasets[0].data[index]}%</span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 h-64 flex items-center justify-center border border-gray-700 rounded-lg">
        <div className="text-gray-500 text-center">
          <p>Gráfico de uso de créditos</p>
          <p className="text-sm">(Aquí se mostraría un gráfico circular con Chart.js)</p>
        </div>
      </div>
    </div>
  );
}