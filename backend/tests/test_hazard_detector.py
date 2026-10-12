import pytest
import pandas as pd
import numpy as np
from app.services.hazard_detector import HazardDetector
from app.models.schemas import HazardType

def test_heatwave_detection_consecutive_days():
    """
    Verify that only spells with >= 3 consecutive days above the threshold
    are identified as heatwave events, while 2-day spikes are filtered out.
    """
    # 100-day series: baseline 30°C
    dates = pd.date_range("2020-01-01", periods=100, freq="D")
    temps = np.full(100, 30.0)

    # Spike 1: 2 consecutive days at 42°C (should NOT be detected as heatwave because duration < 3)
    temps[10:12] = 42.0

    # Spike 2: 4 consecutive days at 43°C (SHOULD be detected as heatwave because duration >= 3)
    temps[30:34] = 43.0

    df = pd.DataFrame({
        "time": dates,
        "temperature_2m_max": temps,
        "temperature_2m_min": temps - 10.0,
        "precipitation_sum": np.zeros(100)
    })

    annual_metrics, events, daily_points, threshold_val, unit, var_name = HazardDetector.detect_hazards(
        df=df,
        hazard_type=HazardType.HEATWAVE,
        threshold_percentile=90.0,
        min_duration_days=3
    )

    # Spike 2 is the only one >= 3 days
    assert len(events) == 1
    event = events[0]
    assert event.duration_days == 4
    assert event.peak_value == 43.0
    assert event.year == 2020
    assert annual_metrics[0].hazard_frequency == 1
    assert annual_metrics[0].total_hazard_days == 4

def test_zero_hazard_events_handling():
    """Verify that when no exceedances occur, metrics return 0 cleanly without division errors."""
    dates = pd.date_range("2010-01-01", "2012-12-31", freq="D")
    df = pd.DataFrame({
        "time": dates,
        "temperature_2m_max": np.full(len(dates), 25.0),
        "precipitation_sum": np.zeros(len(dates))
    })

    annual_metrics, events, _, threshold_val, _, _ = HazardDetector.detect_hazards(
        df=df,
        hazard_type=HazardType.HEATWAVE,
        threshold_percentile=95.0,
        min_duration_days=3
    )

    assert len(events) == 0
    for m in annual_metrics:
        assert m.hazard_frequency == 0
        assert m.mean_duration_days == 0.0
        assert m.total_hazard_days == 0
