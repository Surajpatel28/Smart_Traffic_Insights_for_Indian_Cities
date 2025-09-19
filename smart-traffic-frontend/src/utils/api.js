import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch available junctions from API
export const getJunctions = async () => {
  // Temporarily return fallback data for testing UI
  const fallbackJunctions = [
    { id: 1, name: 'Junction 1' },
    { id: 2, name: 'Junction 2' },
    { id: 3, name: 'Junction 3' },
    { id: 4, name: 'Junction 4' },
  ];
  console.log('Using fallback junctions for testing:', fallbackJunctions);
  return fallbackJunctions;

  /* Commented out for testing - uncomment when backend is ready
  try {
    const response = await api.get('/junctions');
    const junctions = response.data.available_junctions || [];
    console.log('Fetched junctions from API:', junctions); // Debug log
    return junctions;
  } catch (error) {
    console.error('Error fetching junctions:', error);
    // Fallback to mock data if API fails - using integer IDs to match backend
    const fallbackJunctions = [
      { id: 1, name: 'Junction 1' },
      { id: 2, name: 'Junction 2' },
      { id: 3, name: 'Junction 3' },
      { id: 4, name: 'Junction 4' },
    ];
    console.log('Using fallback junctions:', fallbackJunctions); // Debug log
    return fallbackJunctions;
  }
  */
};

// Check API health
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error checking API health:', error);
    throw error;
  }
};
// Transform backend API response to frontend format
const transformPredictionResponse = (apiResponse) => {
  // Create mock traffic data based on the prediction values
  const sourceVehicles = apiResponse.source_predicted_vehicles || 0;
  const destVehicles = apiResponse.destination_predicted_vehicles || 0;
  const routeEstimate = apiResponse.route_traffic_estimate || 'moderate';
  
  // Generate mock hourly traffic data for the chart
  const trafficData = Array.from({ length: 7 }, (_, i) => ({
    time: `${8 + i}:00`,
    volume: Math.max(20, Math.floor(Math.random() * 40) + sourceVehicles + destVehicles - 10)
  }));

  // For citizen prediction format
  const citizenFormat = {
    bestTimeSlot: `${trafficData[0].time} - ${trafficData[1].time}`,
    message: `Based on AI prediction: ${sourceVehicles} vehicles at source, ${destVehicles} at destination. Traffic estimate: ${routeEstimate}`,
    trafficData: trafficData,
    sourceVehicles: sourceVehicles,
    destinationVehicles: destVehicles,
    routeEstimate: routeEstimate
  };

  // For delivery prediction format
  const deliveryFormat = {
    optimalRoute: {
      path: `J${apiResponse.source_junction || 1} → J${apiResponse.destination_junction || 2}`,
      estimatedTime: routeEstimate === 'low' ? '15 minutes' : routeEstimate === 'high' ? '35 minutes' : '25 minutes',
      distance: "8.5 km"
    },
    alternativeRoutes: [
      {
        path: `J${apiResponse.source_junction || 1} → J3 → J${apiResponse.destination_junction || 2}`,
        estimatedTime: routeEstimate === 'low' ? '20 minutes' : routeEstimate === 'high' ? '40 minutes' : '30 minutes',
        distance: "10.2 km"
      }
    ],
    sourceVehicles: sourceVehicles,
    destinationVehicles: destVehicles,
    routeEstimate: routeEstimate
  };

  return { citizenFormat, deliveryFormat };
};

// API call for traffic prediction (both citizen and delivery)
export const getTrafficPrediction = async (sourceJunction, destinationJunction, date, time) => {
  try {
    const data = {
      source_junction: parseInt(sourceJunction),
      destination_junction: parseInt(destinationJunction),
      date: date,
      time: time
    };
    
    console.log('Sending prediction request:', data); // Debug log
    
    const response = await api.post('/predict', data);
    return transformPredictionResponse(response.data);
  } catch (error) {
    console.error('Error fetching traffic prediction:', error);
    console.error('Request data was:', {
      source_junction: parseInt(sourceJunction),
      destination_junction: parseInt(destinationJunction),
      date: date,
      time: time
    });
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

// Wrapper for citizen prediction (for backward compatibility)
export const getCitizenPrediction = async (source, destination, dateTime) => {
  try {
    // Parse the datetime-local input (format: "2025-09-20T08:30")
    const [date, time] = dateTime.split('T');
    console.log('Parsed date:', date, 'time:', time); // Debug log
    const result = await getTrafficPrediction(source, destination, date, time);
    return result.citizenFormat;
  } catch (error) {
    console.error('Error fetching citizen prediction:', error);
    throw error;
  }
};

// Wrapper for delivery prediction (for backward compatibility)
export const getDeliveryPrediction = async (source, destination, dateTime) => {
  try {
    const [date, time] = dateTime.split('T');
    const result = await getTrafficPrediction(source, destination, date, time);
    return result.deliveryFormat;
  } catch (error) {
    console.error('Error fetching delivery prediction:', error);
    throw error;
  }
};

export default api;