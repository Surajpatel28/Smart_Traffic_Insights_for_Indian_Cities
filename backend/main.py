# app.py
import joblib
import pandas as pd
import xgboost as xgb
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, validator
from datetime import datetime
import os
from functools import lru_cache

# Load model and features
model = xgb.Booster()
model.load_model("traffic_model.json")
features = joblib.load("features.pkl")

# Load historical data once at startup for better performance
@lru_cache(maxsize=1)
def load_traffic_data():
    """Load and cache traffic data"""
    if not os.path.exists("traffic.csv"):
        raise FileNotFoundError("Traffic data file not found")
    
    df = pd.read_csv("traffic.csv")
    df['DateTime'] = pd.to_datetime(df['DateTime'], dayfirst=True)
    
    # Extract time-based features for statistics
    df['hour'] = df['DateTime'].dt.hour
    df['dayofweek'] = df['DateTime'].dt.dayofweek
    
    return df

app = FastAPI(title="Traffic Prediction API", description="API for predicting traffic between junctions")

@app.get("/")
def read_root():
    return {"message": "Traffic Prediction API", "version": "1.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": True}

@app.get("/junctions")
def get_junctions():
    """Get available junction information"""
    try:
        df = load_traffic_data()
        junctions = sorted(df['Junction'].unique().tolist())
        junction_stats = []
        
        for junction in junctions:
            junction_data = df[df['Junction'] == junction]
            stats = {
                "junction_id": int(junction),
                "total_records": len(junction_data),
                "avg_vehicles": round(junction_data['Vehicles'].mean(), 2),
                "max_vehicles": int(junction_data['Vehicles'].max()),
                "min_vehicles": int(junction_data['Vehicles'].min()),
                "last_recorded": junction_data['DateTime'].max().strftime("%Y-%m-%d %H:%M:%S")
            }
            junction_stats.append(stats)
        
        return {
            "available_junctions": junctions,
            "junction_statistics": junction_stats,
            "total_junctions": len(junctions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving junction data: {str(e)}")

@app.get("/traffic-stats")
def get_traffic_stats():
    """Get overall traffic statistics"""
    try:
        df = load_traffic_data()
        
        # Calculate hourly averages
        hourly_avg = df.groupby('hour')['Vehicles'].mean().round(2)
        peak_hours = hourly_avg.nlargest(3).index.tolist()
        
        # Calculate daily averages (0=Monday, 6=Sunday)
        daily_avg = df.groupby('dayofweek')['Vehicles'].mean().round(2)
        
        return {
            "total_records": len(df),
            "date_range": {
                "start": df['DateTime'].min().strftime("%Y-%m-%d"),
                "end": df['DateTime'].max().strftime("%Y-%m-%d")
            },
            "overall_stats": {
                "avg_vehicles": round(df['Vehicles'].mean(), 2),
                "max_vehicles": int(df['Vehicles'].max()),
                "min_vehicles": int(df['Vehicles'].min())
            },
            "peak_hours": peak_hours,
            "hourly_averages": hourly_avg.to_dict(),
            "daily_averages": daily_avg.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving traffic statistics: {str(e)}")

class PredictionRequest(BaseModel):
    source_junction: int
    destination_junction: int
    date: str          # e.g. "2025-09-20"
    time: str          # e.g. "08:00:00" or "08:00"
    
    @validator('source_junction', 'destination_junction')
    def validate_junction(cls, v):
        if v < 1 or v > 4:  # Assuming junctions 1-4 based on your data
            raise ValueError('Junction must be between 1 and 4')
        return v
    
    @validator('date')
    def validate_date(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')
        return v
    
    @validator('time')
    def validate_time(cls, v):
        try:
            # Accept both HH:MM and HH:MM:SS formats
            if len(v.split(':')) == 2:
                datetime.strptime(v, '%H:%M')
            else:
                datetime.strptime(v, '%H:%M:%S')
        except ValueError:
            raise ValueError('Time must be in HH:MM or HH:MM:SS format')
        return v

@app.post("/predict")
def predict(req: PredictionRequest):
    try:
        # Combine date and time into datetime object
        # Handle both HH:MM and HH:MM:SS time formats
        if len(req.time.split(':')) == 2:
            time_str = f"{req.time}:00"
        else:
            time_str = req.time
            
        datetime_str = f"{req.date} {time_str}"
        dt = pd.to_datetime(datetime_str)
        
        # Load historical data using cached function
        df = load_traffic_data()
        
        # Function to get prediction for a single junction
        def predict_junction(junction_id: int):
            # Calculate lag features from recent historical data
            junction_data = df[df['Junction'] == junction_id].sort_values('DateTime')
            
            # Get more accurate lag values
            lag_1 = lag_2 = lag_3 = 0.0
            
            if len(junction_data) >= 3:
                # Use the most recent 3 data points
                recent_vehicles = junction_data['Vehicles'].tail(3).values
                lag_1 = float(recent_vehicles[-1])
                lag_2 = float(recent_vehicles[-2]) 
                lag_3 = float(recent_vehicles[-3])
            elif len(junction_data) >= 2:
                # Use available data and fill missing with the last value
                recent_vehicles = junction_data['Vehicles'].tail(2).values
                lag_1 = float(recent_vehicles[-1])
                lag_2 = float(recent_vehicles[-2])
                lag_3 = lag_2  # Use lag_2 for lag_3
            elif len(junction_data) >= 1:
                # Use the only available value for all lags
                last_value = float(junction_data['Vehicles'].iloc[-1])
                lag_1 = lag_2 = lag_3 = last_value
            else:
                # Use global average if no junction data
                global_avg = float(df['Vehicles'].mean())
                lag_1 = lag_2 = lag_3 = global_avg

            # Create feature DataFrame
            data = pd.DataFrame([{
                "hour": dt.hour,
                "dayofweek": dt.dayofweek,
                "month": dt.month,
                "is_weekend": 1 if dt.dayofweek in [5,6] else 0,
                "is_peak": 1 if dt.hour in [7,8,9,17,18,19] else 0,
                "lag_1": lag_1,
                "lag_2": lag_2,
                "lag_3": lag_3
            }])
            
            # Ensure we have all required features in the correct order
            data = data[features]

            dmatrix = xgb.DMatrix(data)
            pred = model.predict(dmatrix)
            return float(pred[0])
        
        # Get predictions for both junctions
        source_prediction = predict_junction(req.source_junction)
        destination_prediction = predict_junction(req.destination_junction)
        
        # Calculate route metrics
        route_traffic_estimate = (source_prediction + destination_prediction) / 2
        traffic_difference = abs(source_prediction - destination_prediction)

        return {
            "source_junction": req.source_junction,
            "destination_junction": req.destination_junction,
            "date": req.date,
            "time": req.time,
            "datetime": datetime_str,
            "source_predicted_vehicles": round(source_prediction, 2),
            "destination_predicted_vehicles": round(destination_prediction, 2),
            "route_traffic_estimate": round(route_traffic_estimate, 2),
            "traffic_difference": round(traffic_difference, 2),
            "peak_hour": dt.hour in [7,8,9,17,18,19],
            "weekend": dt.dayofweek in [5,6]
        }
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail="Traffic data file not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")