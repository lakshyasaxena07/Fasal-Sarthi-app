import requests
from datetime import datetime, timezone, timedelta

class WeatherService:
    def __init__(self, api_key=None, api_url=None, timeout=10):
        self.api_key = api_key
        self.api_url = api_url or "https://api.openweathermap.org/data/2.5/weather"
        self.timeout = timeout

    def get_weather(self, city=None, lat=None, lon=None):
        if not self.api_key:
            raise ValueError("OWM_API_KEY is not configured on the server.")

        params = {
            'appid': self.api_key,
            'units': 'metric'
        }

        if lat is not None and lon is not None:
            params['lat'] = lat
            params['lon'] = lon
        elif city:
            params['q'] = city
        else:
            raise ValueError("City name or coordinates (lat, lon) are required")

        response = requests.get(self.api_url, params=params, timeout=self.timeout)
        weather_data = response.json()

        if response.status_code != 200 or weather_data.get('cod') != 200:
            error_msg = weather_data.get('message', 'Location not found')
            return None, error_msg, response.status_code if response.status_code != 200 else 404

        main = weather_data.get('main', {})
        wind = weather_data.get('wind', {})
        weather_desc = weather_data.get('weather', [{}])[0]
        sys_data = weather_data.get('sys', {})
        clouds = weather_data.get('clouds', {})
        visibility = weather_data.get('visibility')

        # Local time calculation using the location's specific timezone offset from OWM
        raw_tz = weather_data.get('timezone')
        tz_offset_seconds = 0 if raw_tz is None else int(raw_tz)
        tz_local = timezone(timedelta(seconds=tz_offset_seconds))

        sunrise_ts = sys_data.get('sunrise')
        sunset_ts = sys_data.get('sunset')
        sunrise_local = datetime.fromtimestamp(sunrise_ts, tz=timezone.utc).astimezone(tz_local).strftime('%I:%M %p') if sunrise_ts else 'N/A'
        sunset_local = datetime.fromtimestamp(sunset_ts, tz=timezone.utc).astimezone(tz_local).strftime('%I:%M %p') if sunset_ts else 'N/A'

        def deg_to_cardinal(deg):
            if deg is None:
                return 'N/A'
            dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
            ix = round(deg / (360. / len(dirs)))
            return dirs[ix % len(dirs)]

        wind_direction = deg_to_cardinal(wind.get('deg'))
        rain_1h = weather_data.get('rain', {}).get('1h', 0)

        simplified_data = {
            "city": weather_data.get('name', 'N/A'),
            "country": sys_data.get('country', 'N/A'),
            "temperature": main.get('temp'),
            "feels_like": main.get('feels_like'),
            "temp_min": main.get('temp_min'),
            "temp_max": main.get('temp_max'),
            "humidity": main.get('humidity'),
            "pressure": main.get('pressure'),
            "description": weather_desc.get('description', 'N/A').capitalize(),
            "wind_speed": wind.get('speed'),
            "wind_direction": wind_direction,
            "clouds": clouds.get('all'),
            "rain_1h": rain_1h,
            "visibility": visibility / 1000 if visibility else None,
            "sunrise": sunrise_local,
            "sunset": sunset_local,
            "icon_url": f"http://openweathermap.org/img/wn/{weather_desc.get('icon')}@2x.png" if weather_desc.get('icon') else None
        }

        return {k: v for k, v in simplified_data.items() if v is not None}, None, 200
