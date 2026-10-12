import uuid
from typing import List, Dict, Any, Tuple
import pandas as pd
import numpy as np
from app.models.schemas import HazardType, AnnualMetric, HazardEvent, DailyPoint

class HazardDetector:
    """
    Implements domain-specific climatological hazard detection rules.
    Standard Heatwave logic: 3+ consecutive days with maximum temperature
    exceeding the 95th percentile of the regional climatological distribution.
    """

    @staticmethod
    def detect_hazards(
        df: pd.DataFrame,
        hazard_type: HazardType = HazardType.HEATWAVE,
        threshold_percentile: float = 95.0,
        min_duration_days: int = 3,
        baseline_df: pd.DataFrame = None
    ) -> Tuple[List[AnnualMetric], List[HazardEvent], List[DailyPoint], float, str, str]:
        """
        Detects hazard spells, aggregates annual indicators, and extracts daily visualization points.
        Returns:
            annual_metrics: List[AnnualMetric]
            events: List[HazardEvent]
            daily_points: List[DailyPoint]
            threshold_val: float
            unit: str
            var_name: str
        """
        # Determine variable and units based on hazard type
        if hazard_type == HazardType.HEATWAVE:
            col_name = "temperature_2m_max"
            unit = "°C"
            var_name = "Maximum Daily Temperature (2m)"
            comparison_op = "greater"
        elif hazard_type == HazardType.HEAVY_RAINFALL:
            col_name = "precipitation_sum"
            unit = "mm"
            var_name = "Daily Precipitation Sum"
            comparison_op = "greater"
        elif hazard_type == HazardType.DROUGHT:
            col_name = "precipitation_sum"
            unit = "mm"
            var_name = "Consecutive Dry Days (<1.0mm)"
            comparison_op = "dry_days"
        else:
            raise ValueError(f"Unsupported hazard type: {hazard_type}")

        # Compute climatological threshold
        base_series = baseline_df[col_name] if baseline_df is not None and not baseline_df.empty else df[col_name]
        
        if comparison_op == "dry_days":
            # For drought, standard WMO threshold for a dry day is < 1.0 mm precipitation
            threshold_val = 1.0
            unit = "days"
        else:
            # Climatological percentile threshold (e.g. 95th percentile)
            threshold_val = float(np.nanpercentile(base_series.dropna(), threshold_percentile))
            threshold_val = round(threshold_val, 2)

        # Flag days exceeding threshold
        df = df.copy()
        if comparison_op == "greater":
            df["is_exceedance"] = df[col_name] > threshold_val
        elif comparison_op == "dry_days":
            df["is_exceedance"] = df[col_name] < threshold_val

        # Detect consecutive spells using Run-Length Encoding
        # Spell ID changes every time is_exceedance transitions
        df["spell_id"] = (df["is_exceedance"] != df["is_exceedance"].shift()).cumsum()
        
        # Only retain exceedance spells
        exceedances = df[df["is_exceedance"] == True]

        events: List[HazardEvent] = []
        df["is_hazard_event"] = False

        if not exceedances.empty:
            for spell_id, group in exceedances.groupby("spell_id"):
                duration = len(group)
                if duration >= min_duration_days:
                    # Mark these days as confirmed hazard event days
                    df.loc[group.index, "is_hazard_event"] = True
                    
                    start_dt = group["time"].iloc[0].strftime("%Y-%m-%d")
                    end_dt = group["time"].iloc[-1].strftime("%Y-%m-%d")
                    event_year = group["time"].iloc[0].year
                    
                    if comparison_op == "greater":
                        peak_val = float(group[col_name].max())
                        mean_val = float(group[col_name].mean())
                        cum_excess = float((group[col_name] - threshold_val).sum())
                    else: # drought
                        peak_val = float(duration)
                        mean_val = float(duration)
                        cum_excess = float(duration - min_duration_days)

                    event = HazardEvent(
                        event_id=f"EVT-{event_year}-{str(uuid.uuid4())[:8]}",
                        year=event_year,
                        start_date=start_dt,
                        end_date=end_dt,
                        duration_days=duration,
                        peak_value=round(peak_val, 2),
                        mean_value=round(mean_val, 2),
                        cumulative_excess=round(cum_excess, 2)
                    )
                    events.append(event)

        # Annual Aggregations across all requested years
        df["year"] = df["time"].dt.year
        years = sorted(df["year"].unique())
        
        events_df = pd.DataFrame([e.model_dump() for e in events]) if events else pd.DataFrame(
            columns=["year", "duration_days", "cumulative_excess", "peak_value"]
        )

        annual_metrics: List[AnnualMetric] = []
        for y in years:
            year_events = events_df[events_df["year"] == y] if not events_df.empty else pd.DataFrame()
            year_hazard_days = int(df[(df["year"] == y) & (df["is_hazard_event"] == True)].shape[0])
            
            if not year_events.empty:
                freq = int(len(year_events))
                mean_dur = float(year_events["duration_days"].mean())
                max_dur = int(year_events["duration_days"].max())
                cum_intensity = float(year_events["cumulative_excess"].sum())
                max_peak = float(year_events["peak_value"].max())
            else:
                freq = 0
                mean_dur = 0.0
                max_dur = 0
                cum_intensity = 0.0
                # Use max daily value of that year if no hazard event
                year_max_val = df[df["year"] == y][col_name].max()
                max_peak = float(year_max_val) if pd.notna(year_max_val) else 0.0

            annual_metrics.append(
                AnnualMetric(
                    year=int(y),
                    hazard_frequency=freq,
                    total_hazard_days=year_hazard_days,
                    mean_duration_days=round(mean_dur, 2),
                    max_duration_days=max_dur,
                    cumulative_intensity=round(cum_intensity, 2),
                    max_peak_value=round(max_peak, 2)
                )
            )

        # Prepare daily sample series for drilldown visualization
        # To keep payload snappy, provide the most recent 3 years of daily series
        recent_years = years[-3:] if len(years) >= 3 else years
        sample_slice = df[df["year"].isin(recent_years)]
        daily_points: List[DailyPoint] = []
        for _, row in sample_slice.iterrows():
            daily_points.append(
                DailyPoint(
                    date=row["time"].strftime("%Y-%m-%d"),
                    value=round(float(row[col_name]), 2),
                    is_hazard=bool(row["is_hazard_event"]),
                    threshold=threshold_val
                )
            )

        return annual_metrics, events, daily_points, threshold_val, unit, var_name
