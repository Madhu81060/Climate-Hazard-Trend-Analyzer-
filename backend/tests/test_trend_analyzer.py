import pytest
from app.services.trend_analyzer import TrendAnalyzer
from app.models.schemas import AnnualMetric, HazardType

def test_trend_analyzer_increasing_trend():
    """Verify that a monotonically increasing heatwave frequency series produces positive slope and significance."""
    metrics = [
        AnnualMetric(year=2000 + i, hazard_frequency=1 + i, total_hazard_days=(1+i)*3, mean_duration_days=3.0, max_duration_days=3, cumulative_intensity=5.0, max_peak_value=40.0)
        for i in range(15)
    ]

    updated_metrics, trend_stats, insights = TrendAnalyzer.calculate_trends(
        annual_metrics=metrics,
        region_name="Test City",
        hazard_type=HazardType.HEATWAVE
    )

    assert trend_stats.slope > 0
    assert trend_stats.mann_kendall_trend == "increasing"
    assert trend_stats.is_statistically_significant is True
    assert "increased" in insights.headline
    assert updated_metrics[0].rolling_mean_3yr is not None
    assert updated_metrics[0].linear_trend_value is not None

def test_trend_analyzer_stable_trend():
    """Verify that a flat heatwave series reports no significant trend."""
    metrics = [
        AnnualMetric(year=2000 + i, hazard_frequency=2, total_hazard_days=6, mean_duration_days=3.0, max_duration_days=3, cumulative_intensity=4.0, max_peak_value=38.0)
        for i in range(10)
    ]

    _, trend_stats, insights = TrendAnalyzer.calculate_trends(
        annual_metrics=metrics,
        region_name="Test City",
        hazard_type=HazardType.HEATWAVE
    )

    assert trend_stats.slope == 0.0
    assert trend_stats.mann_kendall_trend == "no_trend"
    assert trend_stats.is_statistically_significant is False
