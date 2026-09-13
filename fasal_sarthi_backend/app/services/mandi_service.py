import requests

class MandiService:
    def __init__(self, api_key=None, api_url=None, timeout=15):
        self.api_key = api_key
        self.api_url = api_url or "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
        self.timeout = timeout

    def get_prices(self, state, commodity, district=None):
        if not self.api_key:
            raise ValueError("MANDI_API_KEY is not configured on the server.")

        if not state or not commodity:
            raise ValueError("State and commodity are required.")

        params = {
            'api-key': self.api_key,
            'format': 'json',
            'filters[state]': state,
            'filters[commodity]': commodity,
            'limit': 50
        }
        if district:
            params['filters[district]'] = district

        response = requests.get(self.api_url, params=params, timeout=self.timeout)
        if response.status_code != 200:
            return None, f"Mandi API returned status {response.status_code}", 502

        mandi_data = response.json()
        records = mandi_data.get('records', [])
        if not records:
            return [], None, 200

        simplified_prices = []
        for record in records:
            simplified_prices.append({
                "mandi": record.get('market'),
                "district": record.get('district'),
                "price": record.get('modal_price'),
                "date": record.get('arrival_date'),
                "variety": record.get('variety'),
                "min_price": record.get('min_price'),
                "max_price": record.get('max_price')
            })

        return simplified_prices, None, 200
