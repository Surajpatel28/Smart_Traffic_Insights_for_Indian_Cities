# Test script for the traffic prediction API
import requests
import json
import time

def test_api():
    base_url = "http://localhost:8000"
    
    try:
        # Test health endpoint
        print("Testing health endpoint...")
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"Health Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        
        # Test junctions endpoint
        print("\nTesting junctions endpoint...")
        response = requests.get(f"{base_url}/junctions", timeout=5)
        print(f"Junctions Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Available junctions: {response.json().get('available_junctions', [])}")
        
        # Test prediction endpoint
        print("\nTesting prediction endpoint...")
        data = {
            'source_junction': 1,
            'destination_junction': 2,
            'date': '2025-09-20',
            'time': '08:30'
        }
        response = requests.post(f"{base_url}/predict", json=data, timeout=10)
        print(f"Prediction Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Source prediction: {result.get('source_predicted_vehicles')}")
            print(f"Destination prediction: {result.get('destination_predicted_vehicles')}")
            print(f"Route estimate: {result.get('route_traffic_estimate')}")
        else:
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API server. Make sure it's running on localhost:8000")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()