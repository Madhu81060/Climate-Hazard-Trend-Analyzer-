import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, Tuple
import httpx
import pandas as pd
import numpy as np
from app.config import settings

logger = logging.getLogger(__name__)

class WeatherClientError(Exception):
    """Custom exception for external weather API errors."""
    pass

class WeatherClient:
    def __init__(self, base_url: str = settings.OPEN_METEO_ARCHIVE_URL, timeout: float = settings.API_REQUEST_TIMEOUT):
        self.base_url = base_url
        self.timeout = timeout

    async def fetch_historical_weather(
        self,
        latitude: float,
        longitude: float,
        start_year: int,
        end_year: int
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Ingests historical weather data from Open-Meteo API.
        Applies cleaning, gap-handling, outlier checking, and sanity validation.
        """
        start_date = f"{start_year}-01-01"
        end_date = f"{end_year}-12-31"

        params = {
            "latitude": round(latitude, 4),
            "longitude": round(longitude, 4),
            "start_date": start_date,
            "end_date": end_date,
            "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum"],
            "timezone": "UTC"
        }

        headers = {
            "User-Agent": "ClimateHazardTrendAnalyzer/1.0 (FullStackAssessment; Dygnify Ventures)"
        }

        retries = 3
        backoff_delay = 1.0
        response_data = None

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(1, retries + 1):
                try:
                    logger.info(f"Fetching Open-Meteo data for ({latitude}, {longitude}) [{start_date} to {end_date}] - Attempt {attempt}")
                    response = await client.get(self.base_url, params=params, headers=headers)
                    if response.status_code == 200:
                        response_data = response.json()
                        break
                    elif response.status_code == 429:
                        logger.warning(f"Rate limited by Open-Meteo. Backing off for {backoff_delay}s...")
                        await asyncio.sleep(backoff_delay)
                        backoff_delay *= 2
                    else:
                        logger.error(f"Open-Meteo API returned error {response.status_code}: {response.text}")
                        if attempt == retries:
                            raise WeatherClientError(f"Open-Meteo API error: {response.status_code} - {response.text}")
                        await asyncio.sleep(backoff_delay)
                except httpx.RequestError as exc:
                    logger.warning(f"Network error on attempt {attempt}: {exc}")
                    if attempt == retries:
                        raise WeatherClientError(f"Failed to connect to weather data provider: {str(exc)}")
                    await asyncio.sleep(backoff_delay)

        if not response_data or "daily" not in response_data:
            raise WeatherClientError("No weather records returned from data provider for the requested coordinates.")

        # Data Cleaning and Real-world Quality Handling
        df, quality_meta = self._clean_and_validate_data(response_data["daily"], start_date, end_date)
        return df, quality_meta

    def _clean_and_validate_data(
        self,
        daily_dict: Dict[str, Any],
        start_date: str,
        end_date: str
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Handles real-world data issues:
        1. Date continuity and missing calendar days.
        2. Imputation of minor missing temperature/precipitation values (linear interpolation).
        3. Physical bounds / outlier clipping (-90°C to +65°C for temp, 0 to 1500 mm for rain).
        4. Calculation of data completeness metrics.
        """
        raw_df = pd.DataFrame(daily_dict)
        raw_df["time"] = pd.to_datetime(raw_df["time"])
        raw_df.set_index("time", inplace=True)

        # Expected complete date range
        full_index = pd.date_range(start=start_date, end=end_date, freq="D")
        total_expected_days = len(full_index)

        # Reindex to identify and capture missing dates
        df = raw_df.reindex(full_index)
        missing_dates_count = int(df["temperature_2m_max"].isna().sum())

        # Physical sanity bounds
        temp_min_bound = -90.0
        temp_max_bound = 65.0
        rain_min_bound = 0.0
        rain_max_bound = 1500.0

        outliers_detected = int(
            ((df["temperature_2m_max"] < temp_min_bound) | (df["temperature_2m_max"] > temp_max_bound)).sum() +
            ((df["precipitation_sum"] < rain_min_bound) | (df["precipitation_sum"] > rain_max_bound)).sum()
        )

        # Clip values to physically realistic limits
        df["temperature_2m_max"] = df["temperature_2m_max"].clip(lower=temp_min_bound, upper=temp_max_bound)
        df["temperature_2m_min"] = df["temperature_2m_min"].clip(lower=temp_min_bound, upper=temp_max_bound)
        df["precipitation_sum"] = df["precipitation_sum"].clip(lower=rain_min_bound, upper=rain_max_bound)

        # Impute missing values with linear interpolation for small gaps (up to 3 consecutive days)
        df["temperature_2m_max"] = df["temperature_2m_max"].interpolate(method="linear", limit=3).bfill().ffill()
        df["temperature_2m_min"] = df["temperature_2m_min"].interpolate(method="linear", limit=3).bfill().ffill()
        df["precipitation_sum"] = df["precipitation_sum"].fillna(0.0)

        completeness_pct = round(float((1 - (missing_dates_count / max(total_expected_days, 1))) * 100), 2)

        quality_meta = {
            "total_days_processed": total_expected_days,
            "missing_days_interpolated": missing_dates_count,
            "data_completeness_pct": max(0.0, completeness_pct),
            "outliers_clipped": outliers_detected,
            "source_attribution": "ECMWF ERA5 & Open-Meteo Historical Archive (0.25° / ~11km resolution)"
        }

        # Reset index to have 'time' as a column
        df.reset_index(inplace=True)
        df.rename(columns={"index": "time"}, inplace=True)

        return df, quality_meta
