import httpx

cities = [
    ("New Delhi", 28.6139, 77.2090),
    ("Mumbai", 19.0760, 72.8777),
    ("Kolkata", 22.5726, 88.3639),
    ("Bengaluru", 12.9716, 77.5946),
    ("Chennai", 13.0827, 80.2707),
    ("Hyderabad", 17.3850, 78.4867),
    ("Guwahati", 26.1445, 91.7362),
    ("Nagpur", 21.1458, 79.0882),
    ("Patna", 25.5941, 85.1376),
    ("Jaipur", 26.9124, 75.7873),
    ("Kochi", 9.9312, 76.2673),
    ("Bhubaneswar", 20.2961, 85.8245),
    ("Ahmedabad", 23.0225, 72.5714),
    ("Srinagar", 34.0837, 74.7973),
    ("Port Blair", 11.6234, 92.7265)
]

lats = ",".join(str(c[1]) for c in cities)
lons = ",".join(str(c[2]) for c in cities)

url = f"https://api.open-meteo.com/v1/forecast?latitude={lats}&longitude={lons}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,cape,lifted_index&timezone=Asia/Kolkata"

with httpx.Client(timeout=10.0) as client:
    res = client.get(url).json()
    if isinstance(res, list):
        for c, data in zip(cities, res):
            cur = data.get("current", {})
            print(f"{c[0]}: Temp={cur.get('temperature_2m')}C, CAPE={cur.get('cape')} J/kg, LiftedIndex={cur.get('lifted_index')}, Rain={cur.get('precipitation')}mm, Code={cur.get('weather_code')}, Wind={cur.get('wind_speed_10m')}km/h")
    else:
        print("Single or Dict:", res)
