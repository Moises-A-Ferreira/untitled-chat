import dynamic from 'next/dynamic';

// Dynamically import the InteractiveLocationSelector to avoid SSR issues with Leaflet
const DynamicLocationSelector = dynamic(
  () => import('./InteractiveLocationSelector'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-96 w-full flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-300/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando seleção de localização...</p>
          <p className="text-gray-500 text-sm mt-1">Aguarde um momento</p>
        </div>
      </div>
    )
  }
);

export default DynamicLocationSelector;