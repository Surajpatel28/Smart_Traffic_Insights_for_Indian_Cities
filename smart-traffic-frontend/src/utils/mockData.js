// Mock data for junction IDs
export const junctions = [
  { id: 'J001', name: 'Main Street & Oak Avenue' },
  { id: 'J002', name: 'Broadway & Pine Street' },
  { id: 'J003', name: 'Central Plaza' },
  { id: 'J004', name: 'Industrial District' },
  { id: 'J005', name: 'University Square' },
  { id: 'J006', name: 'Shopping Center' },
  { id: 'J007', name: 'Hospital Junction' },
  { id: 'J008', name: 'Airport Road' },
];

// Mock traffic prediction data
export const mockCitizenPrediction = {
  bestTimeSlot: "10:30 AM - 11:00 AM",
  message: "Based on historical data, this is the optimal travel time with minimal traffic congestion.",
  trafficData: [
    { time: '08:00', volume: 85 },
    { time: '09:00', volume: 95 },
    { time: '10:00', volume: 45 },
    { time: '11:00', volume: 35 },
    { time: '12:00', volume: 55 },
    { time: '13:00', volume: 70 },
    { time: '14:00', volume: 80 },
  ]
};

// Mock delivery prediction data
export const mockDeliveryPrediction = {
  optimalRoute: {
    path: "J001 → J003 → J005 → J006",
    estimatedTime: "25 minutes",
    distance: "8.5 km"
  },
  alternativeRoutes: [
    {
      path: "J001 → J002 → J004 → J006",
      estimatedTime: "32 minutes",
      distance: "10.2 km"
    },
    {
      path: "J001 → J007 → J006",
      estimatedTime: "28 minutes",
      distance: "9.1 km"
    }
  ]
};