import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch available junctions from API
export const getJunctions = async () => {
  try {
    const response = await api.get('/junctions');
    return response.data.available_junctions || [];
  } catch (error) {
    console.error('Error fetching junctions:', error);
    // Fallback to mock data if API fails
    return [
      { id: 1, name: 'Junction 1' },
      { id: 2, name: 'Junction 2' },
      { id: 3, name: 'Junction 3' },
      { id: 4, name: 'Junction 4' },
    ];
  }
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
    
    const response = await api.post('/predict', data);
    return transformPredictionResponse(response.data);
  } catch (error) {
    console.error('Error fetching traffic prediction:', error);
    throw error;
  }
};

// Wrapper for citizen prediction (for backward compatibility)
export const getCitizenPrediction = async (source, destination, dateTime) => {
  try {
    const [date, time] = dateTime.split('T');
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