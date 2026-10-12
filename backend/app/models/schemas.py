from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, field_validator

class HazardType(str, Enum):
    HEATWAVE = "heatwave"
    HEAVY_RAINFALL = "heavy_rainfall"
    DROUGHT = "drought"

class AnalysisRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude between -90 and 90")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude between -180 and 180")
    start_year: int = Field(default=1990, ge=1950, le=2024, description="Start year for analysis (>=1950)")
    end_year: int = Field(default=2023, ge=1950, le=2024, description="End year for analysis (<=2024)")
    hazard_type: HazardType = Field(default=HazardType.HEATWAVE, description="Type of climate hazard")
    threshold_percentile: float = Field(default=95.0, ge=70.0, le=99.9, description="Percentile threshold (e.g. 95th)")
    min_duration_days: int = Field(default=3, ge=1, le=30, description="Minimum consecutive days for a hazard event")
    region_name: Optional[str] = Field(default="Selected Region", max_length=100)
    baseline_start_year: Optional[int] = Field(default=None, ge=1950, le=2024)
    baseline_end_year: Optional[int] = Field(default=None, ge=1950, le=2024)

    @field_validator("end_year")
    @classmethod
    def validate_year_range(cls, v: int, info) -> int:
        start_year = info.data.get("start_year")
        if start_year is not None and v < start_year:
            raise ValueError("end_year must be greater than or equal to start_year")
        if start_year is not None and (v - start_year < 4):
            raise ValueError("Please select at least a 5-year span to enable meaningful climate trend analysis")
        return v

class AnnualMetric(BaseModel):
    year: int
    hazard_frequency: int
    total_hazard_days: int
    mean_duration_days: float
    max_duration_days: int
    cumulative_intensity: float
    max_peak_value: float
    rolling_mean_3yr: Optional[float] = None
    rolling_mean_5yr: Optional[float] = None
    linear_trend_value: Optional[float] = None

class HazardEvent(BaseModel):
    event_id: str
    year: int
    start_date: str
    end_date: str
    duration_days: int
    peak_value: float
    mean_value: float
    cumulative_excess: float

class TrendStatistics(BaseModel):
    slope: float
    intercept: float
    r_squared: float
    p_value: float
    is_statistically_significant: bool
    mann_kendall_tau: float
    mann_kendall_p_value: float
    mann_kendall_trend: str
    decade_change_percent: float
    total_period_change_percent: float
    baseline_frequency_mean: float
    recent_frequency_mean: float

class SummaryInsights(BaseModel):
    headline: str
    frequency_insight: str
    duration_insight: str
    intensity_insight: str
    scientific_significance: str
    risk_assessment: str

class DataQualityInfo(BaseModel):
    total_days_processed: int
    missing_days_interpolated: int
    data_completeness_pct: float
    outliers_clipped: int
    calculated_threshold: float
    threshold_unit: str
    variable_name: str
    source_attribution: str

class DailyPoint(BaseModel):
    date: str
    value: float
    is_hazard: bool
    threshold: float

class AnalysisResponse(BaseModel):
    request_params: AnalysisRequest
    data_quality: DataQualityInfo
    summary_insights: SummaryInsights
    trend_statistics: TrendStatistics
    annual_metrics: List[AnnualMetric]
    recent_events: List[HazardEvent]
    daily_sample_series: List[DailyPoint]
    cached: bool = False
    cache_timestamp: Optional[str] = None
