import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJunctions, getDeliveryPrediction } from '../utils/api';

const DeliveryPrediction = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    dateTime: ''
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [junctions, setJunctions] = useState([]);
  const [loadingJunctions, setLoadingJunctions] = useState(true);

  // Auto-fill current date and time
  useEffect(() => {
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormData(prev => ({ ...prev, dateTime: localDateTime }));
  }, []);

  // Fetch junctions on component mount
  useEffect(() => {
    const fetchJunctions = async () => {
      try {
        console.log('DeliveryPrediction: Starting to fetch junctions...'); // Debug log
        const junctionData = await getJunctions();
        console.log('DeliveryPrediction: Received junction data:', junctionData); // Debug log
        setJunctions(junctionData);
      } catch (error) {
        console.error('Failed to fetch junctions:', error);
      } finally {
        setLoadingJunctions(false);
        console.log('DeliveryPrediction: Loading complete'); // Debug log
      }
    };

    fetchJunctions();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!formData.source || !formData.destination || !formData.dateTime) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await getDeliveryPrediction(formData.source, formData.destination, formData.dateTime);
      setPrediction(result);
    } catch (error) {
      alert('Error getting prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Delivery Prediction</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Route Optimization</h2>
            <form onSubmit={handlePredict} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Junction
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  disabled={loadingJunctions}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">
                    {loadingJunctions ? 'Loading junctions...' : 'Select source junction'}
                  </option>
                  {junctions
                    .filter(junction => junction && junction.id != null) // Filter out invalid entries
                    .map((junction) => (
                    <option key={`delivery-source-${junction.id}`} value={junction.id}>
                      {junction.id} - {junction.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Junction
                </label>
                <select
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  disabled={loadingJunctions}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">
                    {loadingJunctions ? 'Loading junctions...' : 'Select destination junction'}
                  </option>
                  {junctions
                    .filter(junction => junction && junction.id != null) // Filter out invalid entries
                    .map((junction) => (
                    <option key={`delivery-dest-${junction.id}`} value={junction.id}>
                      {junction.id} - {junction.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Date and Time
                </label>
                <input
                  type="datetime-local"
                  name="dateTime"
                  value={formData.dateTime}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing Routes...' : 'Predict Best Route'}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Route Results</h2>
            
            {!prediction && !loading && (
              <div className="text-center text-gray-500 py-8">
                <p>Enter your delivery details and click predict to see optimal routes</p>
              </div>
            )}

            {loading && (
              <div className="text-center text-green-600 py-8">
                <p>Calculating optimal delivery routes...</p>
              </div>
            )}

            {prediction && (
              <div className="space-y-6">
                {/* Optimal Route */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Optimal Route</h3>
                  <div className="space-y-2">
                    <p className="text-green-700">
                      <span className="font-medium">Path:</span> {prediction.optimalRoute.path}
                    </p>
                    <p className="text-green-700">
                      <span className="font-medium">Estimated Time:</span> {prediction.optimalRoute.estimatedTime}
                    </p>
                    <p className="text-green-700">
                      <span className="font-medium">Distance:</span> {prediction.optimalRoute.distance}
                    </p>
                  </div>
                </div>

                {/* Alternative Routes */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Alternative Routes</h3>
                  <div className="space-y-3">
                    {prediction.alternativeRoutes.map((route, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="space-y-1">
                          <p className="text-gray-700">
                            <span className="font-medium">Path:</span> {route.path}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Time:</span> {route.estimatedTime}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Distance:</span> {route.distance}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Map Placeholder */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Route Map</h3>
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">🗺️</div>
                      <p>Interactive Map</p>
                      <p className="text-sm">(Leaflet.js integration placeholder)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPrediction;