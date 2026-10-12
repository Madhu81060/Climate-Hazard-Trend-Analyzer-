import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import Response
from app.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    DataQualityInfo
)
from app.services.weather_client import WeatherClient, WeatherClientError
from app.services.hazard_detector import HazardDetector
from app.services.trend_analyzer import TrendAnalyzer
from app.services.cache_service import cache_service
from app.services.export_service import ExportService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Climate Hazard Analysis"])

PRESET_REGIONS = [
    {"name": "New Delhi, India", "lat": 28.6139, "lon": 77.2090, "climate": "Subtropical / Extreme Heatwaves"},
    {"name": "Phoenix, Arizona, USA", "lat": 33.4484, "lon": -112.0740, "climate": "Hot Desert / Sustained High Heat"},
    {"name": "London, United Kingdom", "lat": 51.5074, "lon": -0.1278, "climate": "Temperate Maritime / Emerging Risk"},
    {"name": "Madrid, Spain", "lat": 40.4168, "lon": -3.7038, "climate": "Mediterranean / Intense Heatwaves"},
    {"name": "Tokyo, Japan", "lat": 35.6762, "lon": 139.6503, "climate": "Humid Subtropical"},
    {"name": "Sydney, Australia", "lat": -33.8688, "lon": 151.2093, "climate": "Temperate / Southern Hemisphere"},
    {"name": "Cairo, Egypt", "lat": 30.0444, "lon": 31.2357, "climate": "Arid Desert / Extreme Summer"},
    {"name": "Mumbai, India", "lat": 19.0760, "lon": 72.8777, "climate": "Tropical Monsoon / Heat & Humidity"},
    {"name": "Paris, France", "lat": 48.8566, "lon": 2.3522, "climate": "Oceanic / European Heat Spells"}
]

@router.get("/presets")
async def get_presets():
    """Returns curated geographic regions for immediate one-click testing."""
    return {"presets": PRESET_REGIONS}

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_climate_hazard(req: AnalysisRequest):
    """
    Core API:
    1. Checks NoSQL cache for previous analysis results.
    2. If cache miss, checks/fetches historical weather data via Open-Meteo.
    3. Runs domain-specific percentile hazard spell detection.
    4. Computes OLS linear regression and non-parametric Mann-Kendall trend tests.
    5. Saves result to NoSQL database and returns structured response.
    """
    analysis_key = cache_service.generate_analysis_key(
        latitude=req.latitude,
        longitude=req.longitude,
        start_year=req.start_year,
        end_year=req.end_year,
        hazard_type=req.hazard_type.value,
        threshold_percentile=req.threshold_percentile,
        min_duration_days=req.min_duration_days
    )

    # 1. Check Analysis NoSQL Cache
    cached_result = cache_service.get_analysis(analysis_key)
    if cached_result:
        logger.info(f"Analysis Cache HIT for key {analysis_key[:12]}")
        cached_result["cached"] = True
        return AnalysisResponse(**cached_result)

    # 2. Ingest Historical Weather Data (Check Weather Cache First)
    weather_key = cache_service.generate_weather_key(
        latitude=req.latitude,
        longitude=req.longitude,
        start_year=req.start_year,
        end_year=req.end_year
    )
    
    cached_weather = cache_service.get_weather(weather_key)
    import pandas as pd

    if cached_weather:
        logger.info(f"Weather Raw Data Cache HIT for key {weather_key[:12]}")
        df = pd.DataFrame(cached_weather["records"])
        df["time"] = pd.to_datetime(df["time"])
        quality_meta = cached_weather["quality_meta"]
    else:
        logger.info("Weather Raw Data Cache MISS - Ingesting from Open-Meteo Archive API")
        weather_client = WeatherClient()
        try:
            df, quality_meta = await weather_client.fetch_historical_weather(
                latitude=req.latitude,
                longitude=req.longitude,
                start_year=req.start_year,
                end_year=req.end_year
            )
            # Store in NoSQL Weather Cache
            # Serialize DataFrame
            df_serializable = df.copy()
            df_serializable["time"] = df_serializable["time"].dt.strftime("%Y-%m-%d")
            cache_service.save_weather(weather_key, {
                "records": df_serializable.to_dict(orient="records"),
                "quality_meta": quality_meta
            })
        except WeatherClientError as wce:
            raise HTTPException(status_code=502, detail=f"Weather Data Ingestion Error: {str(wce)}")
        except Exception as e:
            logger.error(f"Unexpected ingestion failure: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error during weather data ingestion.")

    # 3. Detect Climate Hazards (Percentile-based spell detection)
    try:
        annual_metrics, events, daily_points, threshold_val, unit, var_name = HazardDetector.detect_hazards(
            df=df,
            hazard_type=req.hazard_type,
            threshold_percentile=req.threshold_percentile,
            min_duration_days=req.min_duration_days
        )
    except Exception as e:
        logger.error(f"Hazard detection algorithm failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Hazard calculation error: {str(e)}")

    # 4. Statistical Trend Analysis (Linear Regression & Mann-Kendall Test)
    try:
        updated_metrics, trend_stats, insights = TrendAnalyzer.calculate_trends(
            annual_metrics=annual_metrics,
            region_name=req.region_name or f"Lat {req.latitude}, Lon {req.longitude}",
            hazard_type=req.hazard_type
        )
    except Exception as e:
        logger.error(f"Trend analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Trend statistical analysis error: {str(e)}")

    # 5. Build Response
    data_quality_info = DataQualityInfo(
        total_days_processed=quality_meta["total_days_processed"],
        missing_days_interpolated=quality_meta["missing_days_interpolated"],
        data_completeness_pct=quality_meta["data_completeness_pct"],
        outliers_clipped=quality_meta["outliers_clipped"],
        calculated_threshold=threshold_val,
        threshold_unit=unit,
        variable_name=var_name,
        source_attribution=quality_meta["source_attribution"]
    )

    response_payload = AnalysisResponse(
        request_params=req,
        data_quality=data_quality_info,
        summary_insights=insights,
        trend_statistics=trend_stats,
        annual_metrics=updated_metrics,
        recent_events=events[-50:],  # return most recent 50 events to prevent massive JSON payloads
        daily_sample_series=daily_points,
        cached=False,
        cache_timestamp=datetime.utcnow().isoformat()
    )

    # 6. Store in NoSQL Analysis Cache
    cache_service.save_analysis(analysis_key, response_payload.model_dump())

    return response_payload

@router.post("/export/csv")
async def export_csv(payload: dict):
    """Generates downloadable CSV for the current analysis payload."""
    try:
        csv_text = ExportService.generate_csv(payload)
        return Response(
            content=csv_text,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=climate_hazard_trend_analysis.csv"}
        )
    except Exception as e:
        logger.error(f"CSV generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV: {str(e)}")

@router.post("/export/pdf")
async def export_pdf(payload: dict):
    """Generates downloadable executive PDF report for the current analysis payload."""
    try:
        pdf_bytes = ExportService.generate_pdf(payload)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=climate_hazard_report.pdf"}
        )
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint providing DB status and service state."""
    db_info = cache_service.get_database_status()
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_info
    }
