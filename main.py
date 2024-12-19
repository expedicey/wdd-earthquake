from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import requests
from datetime import datetime, timedelta
import pytz

app = FastAPI()

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your actual frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/earthquakes")
async def get_earthquakes(
    days: Optional[int] = Query(1, description="Number of days of data to fetch (1, 7, or 30)"),
    min_magnitude: Optional[float] = Query(0.0, description="Minimum magnitude filter"),
    max_magnitude: Optional[float] = Query(None, description="Maximum magnitude filter")
):
    # Map days to USGS feed URLs
    feed_urls = {
        1: "all_day",
        7: "all_week",
        30: "all_month"
    }
    
    period = feed_urls.get(days, "all_day")
    base_url = f"https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/{period}.geojson"
    
    try:
        response = requests.get(base_url)
        response.raise_for_status()
        data = response.json()
        
        # Format earthquake data
        earthquakes = []
        jakarta_tz = pytz.timezone('Asia/Jakarta')
        
        for feature in data['features']:
            props = feature['properties']
            coords = feature['geometry']['coordinates']
            
            magnitude = props.get('mag', 0.0)  # Default to 0.0 if magnitude is None
            
            # Skip if magnitude is None or not within specified range
            if magnitude is None:
                continue
                
            # Apply magnitude filters if specified
            if min_magnitude and magnitude < min_magnitude:
                continue
            if max_magnitude and magnitude > max_magnitude:
                continue
                
            # Convert timestamp to Jakarta time
            timestamp = datetime.fromtimestamp(props['time'] / 1000, tz=pytz.UTC)
            local_time = timestamp.astimezone(jakarta_tz)
            
            earthquake = {
                'id': feature['id'],
                'time': local_time.strftime('%Y-%m-%d %H:%M:%S'),
                'magnitude': magnitude,
                'depth': coords[2],
                'location': props['place'],
                'coordinates': {
                    'latitude': coords[1],
                    'longitude': coords[0]
                },
                'severity': get_severity_level(magnitude)
            }
            earthquakes.append(earthquake)
        
        return {
            'status': 'success',
            'count': len(earthquakes),
            'data': earthquakes
        }
        
    except requests.RequestException as e:
        return {
            'status': 'error',
            'message': f'Failed to fetch earthquake data: {str(e)}'
        }

def get_severity_level(magnitude: float) -> str:
    """Determine earthquake severity level based on magnitude"""
    if magnitude >= 6.0:
        return 'strong'
    elif magnitude >= 5.0:
        return 'moderate'
    elif magnitude >= 4.0:
        return 'light'
    else:
        return 'minor'

@app.get("/earthquakes/latest")
async def get_latest_earthquake():
    """Get the most recent earthquake data"""
    try:
        response = requests.get("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson")
        response.raise_for_status()
        data = response.json()
        
        if data['features']:
            latest = data['features'][0]
            props = latest['properties']
            coords = latest['geometry']['coordinates']
            
            # Convert to Jakarta time
            jakarta_tz = pytz.timezone('Asia/Jakarta')
            timestamp = datetime.fromtimestamp(props['time'] / 1000, tz=pytz.UTC)
            local_time = timestamp.astimezone(jakarta_tz)
            
            return {
                'status': 'success',
                'data': {
                    'id': latest['id'],
                    'time': local_time.strftime('%Y-%m-%d %H:%M:%S'),
                    'magnitude': props['mag'],
                    'depth': coords[2],
                    'location': props['place'],
                    'coordinates': {
                        'latitude': coords[1],
                        'longitude': coords[0]
                    },
                    'severity': get_severity_level(props['mag'])
                }
            }
        else:
            return {
                'status': 'success',
                'data': None,
                'message': 'No recent earthquakes found'
            }
            
    except requests.RequestException as e:
        return {
            'status': 'error',
            'message': f'Failed to fetch latest earthquake data: {str(e)}'
        }