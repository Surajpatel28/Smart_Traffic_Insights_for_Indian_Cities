import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Smart Traffic Predictor
          </h1>
          <p className="text-gray-600">
            Optimize your travel with AI-powered traffic predictions
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <button
            onClick={() => navigate('/citizen')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow-md"
          >
            Citizen Prediction
          </button>
          
          <button
            onClick={() => navigate('/delivery')}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow-md"
          >
            Delivery Prediction
          </button>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Choose your prediction type to get started
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;