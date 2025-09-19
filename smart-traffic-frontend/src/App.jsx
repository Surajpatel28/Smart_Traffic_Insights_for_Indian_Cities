import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CitizenPrediction from './pages/CitizenPrediction';
import DeliveryPrediction from './pages/DeliveryPrediction';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/citizen" element={<CitizenPrediction />} />
          <Route path="/delivery" element={<DeliveryPrediction />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
