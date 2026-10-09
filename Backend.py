# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import math
from typing import List, Dict

app = FastAPI(title="TerraSense Smart Irrigation Engine")

# Enable CORS for Frontend Interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FarmInput(BaseModel):
    soil_type: str = Field(..., example="Loam") # Sandy, Loam, Clay
    soil_moisture: float = Field(..., ge=0, le=100, example=22.5) # Percentage
    temperature: float = Field(..., ge=-10, le=60, example=34.0) # °C
    rainfall_chance: float = Field(..., ge=0, le=100, example=15.0) # Percentage

class ZoneRecommendation(BaseModel):
    zone_id: int
    zone_name: str
    soil_type: str
    soil_moisture: float
    water_needed_liters_per_m2: float
    water_flow_rate_lpm: float
    irrigation_duration_mins: float
    status: str

class CalculationResponse(BaseModel):
    overall_status: str
    total_water_liters_per_m2: float
    zones: List[ZoneRecommendation]

# Soil parameter matrix
SOIL_DATA = {
    "sandy": {"fc": 15.0, "pwp": 7.0, "kc": 0.85, "efficiency": 0.85, "base_flow": 12.0},
    "loam": {"fc": 26.0, "pwp": 13.0, "kc": 1.05, "efficiency": 0.90, "base_flow": 8.0},
    "clay": {"fc": 36.0, "pwp": 20.0, "kc": 1.15, "efficiency": 0.75, "base_flow": 5.0}
}

def calculate_et0(temp: float) -> float:
    # Hargreaves Simplified Evapotranspiration Estimation
    return 0.0023 * (temp + 17.8) * (temp - 15)**0.5 * 15.0 if temp > 15 else 2.5

@app.post("/api/v1/predict-irrigation", response_model=CalculationResponse)
def predict_irrigation(data: FarmInput):
    soil_key = data.soil_type.lower()
    if soil_key not in SOIL_DATA:
        soil_key = "loam" # Default fallback

    # Base reference ET
    et0 = calculate_et0(data.temperature)
    
    # Zone Variations: Dividing field into 3 distinct micro-zones
    # Zone 1 (Coarser micro-texture, higher temperature drift)
    # Zone 2 (Baseline input values)
    # Zone 3 (Finer micro-texture, lower moisture loss)
    
    zones_input = [
        {
            "id": 1,
            "name": "Zone A - North Ridge",
            "soil": "sandy" if soil_key == "sandy" else "loam",
            "moisture": max(5.0, data.soil_moisture - 4.5),
            "temp": data.temperature + 1.2
        },
        {
            "id": 2,
            "name": "Zone B - Central Plain",
            "soil": soil_key,
            "moisture": data.soil_moisture,
            "temp": data.temperature
        },
        {
            "id": 3,
            "name": "Zone C - South Basin",
            "soil": "clay" if soil_key == "clay" else "loam",
            "moisture": min(95.0, data.soil_moisture + 5.0),
            "temp": data.temperature - 0.8
        }
    ]

    zone_results = []
    total_water = 0.0

    for z in zones_input:
        s_info = SOIL_DATA[z["soil"]]
        
        # Expected rainfall deduction (mm)
        expected_rain = (data.rainfall_chance / 100.0) * 10.0 # 10mm max rainfall scale
        
        # Moisture Deficit calculation
        deficit = max(0.0, s_info["fc"] - z["moisture"])
        
        # Daily Water Needed (Liters / m2)
        crop_et = et0 * s_info["kc"]
        net_water_needed = max(0.0, (deficit * 0.8 + crop_et - expected_rain) / s_info["efficiency"])
        
        # Determine flow rate (Liters per Minute per m2) based on soil intake rate
        flow_rate = s_info["base_flow"] if net_water_needed > 0 else 0.0
        
        # Irrigation duration in minutes
        duration = (net_water_needed / flow_rate * 60) if flow_rate > 0 else 0.0

        # Status Assessment
        if z["moisture"] < s_info["pwp"] + 3.0:
            status = "CRITICAL_WATER_STRESS"
        elif net_water_needed > 5.0:
            status = "IRRIGATION_REQUIRED"
        else:
            status = "OPTIMAL_MOISTURE"

        total_water += net_water_needed

        zone_results.append(ZoneRecommendation(
            zone_id=z["id"],
            zone_name=z["name"],
            soil_type=z["soil"].capitalize(),
            soil_moisture=round(z["moisture"], 1),
            water_needed_liters_per_m2=round(net_water_needed, 2),
            water_flow_rate_lpm=round(flow_rate, 2),
            irrigation_duration_mins=round(duration, 1),
            status=status
        ))

    overall_status = "CRITICAL" if any(r.status == "CRITICAL_WATER_STRESS" for r in zone_results) else "NORMAL"

    return CalculationResponse(
        overall_status=overall_status,
        total_water_liters_per_m2=round(total_water / 3.0, 2),
        zones=zone_results
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)