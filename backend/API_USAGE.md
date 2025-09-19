# Frontend Integration Example for Traffic Prediction API

## API Endpoints

### 1. Health Check
```
GET /health
```
Returns API health status.

### 2. Get Available Junctions
```
GET /junctions
```
Returns information about available junctions and their statistics.

### 3. Get Traffic Statistics
```
GET /traffic-stats
```
Returns overall traffic statistics including peak hours and daily averages.

### 4. Predict Traffic
```
POST /predict
```
Main prediction endpoint for traffic between junctions.

## Prediction Request Format
The frontend should send a JSON request with the following structure:

```json
{
    "source_junction": 1,
    "destination_junction": 3, 
    "date": "2025-09-20",
    "time": "08:30"
}
```

## Request Parameters

- **source_junction**: Integer (1-4) - The starting junction ID
- **destination_junction**: Integer (1-4) - The ending junction ID  
- **date**: String in "YYYY-MM-DD" format - The prediction date
- **time**: String in "HH:MM" or "HH:MM:SS" format - The prediction time

## Enhanced Response Format
The API now returns more comprehensive information:

```json
{
    "source_junction": 1,
    "destination_junction": 3,
    "date": "2025-09-20", 
    "time": "08:30",
    "datetime": "2025-09-20 08:30:00",
    "source_predicted_vehicles": 25.4,
    "destination_predicted_vehicles": 18.7,
    "route_traffic_estimate": 22.05,
    "traffic_difference": 6.7,
    "peak_hour": true,
    "weekend": false
}
```

## Response Fields

- **source_junction**: Echo of source junction ID
- **destination_junction**: Echo of destination junction ID
- **date**: Echo of input date
- **time**: Echo of input time
- **datetime**: Combined datetime string
- **source_predicted_vehicles**: Predicted vehicle count at source junction (rounded to 2 decimals)
- **destination_predicted_vehicles**: Predicted vehicle count at destination junction (rounded to 2 decimals)
- **route_traffic_estimate**: Average traffic estimate for the route (rounded to 2 decimals)
- **traffic_difference**: Absolute difference between source and destination predictions
- **peak_hour**: Boolean indicating if the time is during peak hours (7-9 AM, 5-7 PM)
- **weekend**: Boolean indicating if the date falls on a weekend

## Additional Endpoint Responses

### Junctions Endpoint Response
```json
{
    "available_junctions": [1, 2, 3, 4],
    "junction_statistics": [
        {
            "junction_id": 1,
            "total_records": 12030,
            "avg_vehicles": 15.2,
            "max_vehicles": 45,
            "min_vehicles": 1,
            "last_recorded": "2017-06-30 23:00:00"
        }
    ],
    "total_junctions": 4
}
```

### Traffic Statistics Endpoint Response
```json
{
    "total_records": 48120,
    "date_range": {
        "start": "2015-11-01",
        "end": "2017-06-30"
    },
    "overall_stats": {
        "avg_vehicles": 15.2,
        "max_vehicles": 76,
        "min_vehicles": 1
    },
    "peak_hours": [18, 19, 17],
    "hourly_averages": {
        "0": 8.5,
        "1": 6.7,
        ...
    },
    "daily_averages": {
        "0": 15.8,
        "1": 16.2,
        ...
    }
}
```

## Example Frontend Code (JavaScript/React)

```javascript
const predictTraffic = async (sourceJunction, destJunction, date, time) => {
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_junction: sourceJunction,
                destination_junction: destJunction,
                date: date,
                time: time
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error predicting traffic:', error);
        throw error;
    }
};

// Usage example
predictTraffic(1, 3, "2025-09-20", "08:30")
    .then(result => {
        console.log('Traffic prediction:', result);
        // Use the prediction data in your UI
        displayTrafficPrediction(result);
    })
    .catch(error => {
        console.error('Failed to get traffic prediction:', error);
        // Handle error in UI
        showErrorMessage('Failed to predict traffic');
    });
```

## Error Handling

The API will return HTTP 400 with error details for:
- Invalid junction IDs (must be 1-4)
- Invalid date format (must be YYYY-MM-DD)
- Invalid time format (must be HH:MM or HH:MM:SS)
- Missing required fields

Example error response:
```json
{
    "detail": "Junction must be between 1 and 4"
}
```

## Additional Endpoints

- **GET /**: Returns API information
- **GET /health**: Returns API health status

## Running the API

To start the API server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
Interactive API documentation will be available at `http://localhost:8000/docs`