"""Input validation helpers for Fasal Sarthi backend APIs."""


def is_valid_coordinate(lat, lon):
    """Validate that latitude is between -90 and 90, and longitude is between -180 and 180."""
    try:
        lat_f = float(lat)
        lon_f = float(lon)
        return -90.0 <= lat_f <= 90.0 and -180.0 <= lon_f <= 180.0
    except (ValueError, TypeError):
        return False


def is_non_empty_string(val):
    """Validate that value is a non-empty string."""
    return isinstance(val, str) and bool(val.strip())
