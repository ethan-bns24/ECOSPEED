"""
Polyline5 decoder for OpenRouteService
Based on the Google polyline algorithm with precision 5
Supports both 2D (lat, lon) and 3D (lat, lon, elevation) encoding
"""
def decode_polyline5(encoded, has_elevation=False):
    """
    Decode a polyline5 encoded string to a list of coordinates.
    OpenRouteService uses precision 5 (multiply by 1e5).
    
    Args:
        encoded: The encoded polyline string
        has_elevation: If True, decode 3D coordinates (lat, lon, elev)
    
    Returns:
        List of [lat, lon] or [lat, lon, elev] coordinates
    """
    if not encoded:
        return []
    
    coords = []
    index = 0
    lat = 0
    lon = 0
    elev = 0
    
    def decode_value():
        """Decode a single delta value from the polyline"""
        nonlocal index
        shift = 0
        result = 0
        byte = 0x20
        
        while byte >= 0x20 and index < len(encoded):
            byte = ord(encoded[index]) - 63
            index += 1
            result |= (byte & 0x1f) << shift
            shift += 5
            if byte < 0x20:
                break
        
        delta = ~(result >> 1) if (result & 1) else (result >> 1)
        return delta
    
    while index < len(encoded):
        # Decode latitude
        delta_lat = decode_value()
        lat += delta_lat
        
        if index >= len(encoded):
            break
        
        # Decode longitude
        delta_lon = decode_value()
        lon += delta_lon
        
        # Decode elevation if present
        if has_elevation and index < len(encoded):
            delta_elev = decode_value()
            elev += delta_elev
            coords.append([lat / 1e5, lon / 1e5, elev / 1e2])  # Elevation precision is 1e2
        else:
            coords.append([lat / 1e5, lon / 1e5])
    
    return coords

