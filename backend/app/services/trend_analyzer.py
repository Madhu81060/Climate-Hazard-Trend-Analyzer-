from typing import List, Tuple
import numpy as np
import pandas as pd
from scipy import stats
from app.models.schemas import AnnualMetric, TrendStatistics, SummaryInsights, HazardType

class TrendAnalyzer:
    """
    Performs rigorous statistical trend analysis on annual climate hazard indicators:
    - Ordinary Least Squares (OLS) Linear Regression
    - Non-parametric Mann-Kendall Trend Test
    - 3-year and 5-year Rolling Centered/Trailing Averages
    - Objective climate insight formulation with significance bounds
    """

    @staticmethod
    def calculate_trends(
        annual_metrics: List[AnnualMetric],
        region_name: str = "Selected Region",
        hazard_type: HazardType = HazardType.HEATWAVE
    ) -> Tuple[List[AnnualMetric], TrendStatistics, SummaryInsights]:
        df = pd.DataFrame([m.model_dump() for m in annual_metrics])
        n = len(df)

        if n < 3:
            raise ValueError("At least 3 years of data are required to calculate trends.")

        # 1. Rolling Averages
        df["rolling_mean_3yr"] = df["hazard_frequency"].rolling(window=3, min_periods=1, center=True).mean().round(2)
        df["rolling_mean_5yr"] = df["hazard_frequency"].rolling(window=5, min_periods=1, center=True).mean().round(2)

        # 2. Linear Regression (OLS)
        x = df["year"].values
        y = df["hazard_frequency"].values

        slope, intercept, r_val, p_val, std_err = stats.linregress(x, y)
        r_squared = float(r_val ** 2) if not np.isnan(r_val) else 0.0
        p_value = float(p_val) if not np.isnan(p_val) else 1.0
        slope = float(slope) if not np.isnan(slope) else 0.0
        intercept = float(intercept) if not np.isnan(intercept) else 0.0

        # Calculate fitted line values for each year
        df["linear_trend_value"] = (slope * x + intercept).round(2)
        # Ensure fitted line doesn't drop below 0 for counts
        df["linear_trend_value"] = df["linear_trend_value"].clip(lower=0.0)

        # 3. Mann-Kendall Non-Parametric Trend Test
        mk_tau, mk_p_val, mk_trend = TrendAnalyzer._mann_kendall_test(y)

        # 4. Period Comparison & Percentage Change
        # Compare first third (or 5-10 years) with final third
        split_len = max(3, n // 3)
        baseline_slice = df.iloc[:split_len]["hazard_frequency"]
        recent_slice = df.iloc[-split_len:]["hazard_frequency"]

        baseline_mean = float(baseline_slice.mean())
        recent_mean = float(recent_slice.mean())

        start_year = int(df["year"].iloc[0])
        end_year = int(df["year"].iloc[-1])

        if baseline_mean > 0:
            pct_change = round(((recent_mean - baseline_mean) / baseline_mean) * 100, 1)
        else:
            pct_change = round((recent_mean - baseline_mean) * 100, 1) if recent_mean > 0 else 0.0

        decade_change = round(slope * 10, 2)
        is_significant = (p_value < 0.05) or (mk_p_val < 0.05)

        trend_stats = TrendStatistics(
            slope=round(slope, 3),
            intercept=round(intercept, 2),
            r_squared=round(r_squared, 3),
            p_value=round(p_value, 4),
            is_statistically_significant=is_significant,
            mann_kendall_tau=round(mk_tau, 3),
            mann_kendall_p_value=round(mk_p_val, 4),
            mann_kendall_trend=mk_trend,
            decade_change_percent=decade_change,
            total_period_change_percent=pct_change,
            baseline_frequency_mean=round(baseline_mean, 2),
            recent_frequency_mean=round(recent_mean, 2)
        )

        # 5. Generate Plain-English Objective Climate Insights
        insights = TrendAnalyzer._generate_insights(
            df=df,
            trend_stats=trend_stats,
            region_name=region_name,
            hazard_type=hazard_type,
            start_year=start_year,
            end_year=end_year
        )

        # Reconstruct updated AnnualMetrics with rolling and linear trend values
        updated_metrics: List[AnnualMetric] = []
        for _, row in df.iterrows():
            updated_metrics.append(
                AnnualMetric(
                    year=int(row["year"]),
                    hazard_frequency=int(row["hazard_frequency"]),
                    total_hazard_days=int(row["total_hazard_days"]),
                    mean_duration_days=float(row["mean_duration_days"]),
                    max_duration_days=int(row["max_duration_days"]),
                    cumulative_intensity=float(row["cumulative_intensity"]),
                    max_peak_value=float(row["max_peak_value"]),
                    rolling_mean_3yr=float(row["rolling_mean_3yr"]),
                    rolling_mean_5yr=float(row["rolling_mean_5yr"]),
                    linear_trend_value=float(row["linear_trend_value"])
                )
            )

        return updated_metrics, trend_stats, insights

    @staticmethod
    def _mann_kendall_test(y: np.ndarray) -> Tuple[float, float, str]:
        """
        Computes the Mann-Kendall test for monotonic trends.
        Returns: (Tau, p-value, trend_direction)
        """
        n = len(y)
        if n < 4:
            return 0.0, 1.0, "insufficient_data"

        # Calculate Kendall's S
        s = 0
        for k in range(n - 1):
            for j in range(k + 1, n):
                diff = y[j] - y[k]
                if diff > 0:
                    s += 1
                elif diff < 0:
                    s -= 1

        # Calculate unique ties variance adjustment
        unique_vals, counts = np.unique(y, return_counts=True)
        tie_adjustment = sum(c * (c - 1) * (2 * c + 5) for c in counts if c > 1)

        var_s = (n * (n - 1) * (2 * n + 5) - tie_adjustment) / 18.0

        if var_s <= 0:
            return 0.0, 1.0, "no_trend"

        std_s = np.sqrt(var_s)

        if s > 0:
            z = (s - 1) / std_s
        elif s < 0:
            z = (s + 1) / std_s
        else:
            z = 0.0

        # Two-tailed test
        p_value = 2.0 * (1.0 - stats.norm.cdf(abs(z)))

        # Kendall Tau
        denom = n * (n - 1) / 2.0
        tau = s / denom if denom > 0 else 0.0

        if p_value < 0.05:
            trend_str = "increasing" if s > 0 else "decreasing"
        else:
            trend_str = "no_trend"

        return float(tau), float(p_value), trend_str

    @staticmethod
    def _generate_insights(
        df: pd.DataFrame,
        trend_stats: TrendStatistics,
        region_name: str,
        hazard_type: HazardType,
        start_year: int,
        end_year: int
    ) -> SummaryInsights:
        hazard_display = {
            HazardType.HEATWAVE: "Heatwaves",
            HazardType.HEAVY_RAINFALL: "Extreme Rainfall Events",
            HazardType.DROUGHT: "Prolonged Dry Spells"
        }.get(hazard_type, "Hazard events")

        pct = trend_stats.total_period_change_percent
        sign = "+" if pct > 0 else ""
        
        # Headline insight
        if pct > 0:
            headline = f"{hazard_display} have increased by {sign}{pct}% in {region_name} since {start_year}."
        elif pct < 0:
            headline = f"{hazard_display} have decreased by {pct}% in {region_name} since {start_year}."
        else:
            headline = f"{hazard_display} frequency has remained stable in {region_name} between {start_year} and {end_year}."

        # Frequency detail
        freq_insight = (
            f"Annual frequency shifted from an average of {trend_stats.baseline_frequency_mean} events/year "
            f"in the early period to {trend_stats.recent_frequency_mean} events/year recently "
            f"({'+' if trend_stats.decade_change_percent > 0 else ''}{trend_stats.decade_change_percent} events per decade)."
        )

        # Duration detail
        early_duration = df.iloc[:len(df)//3]["mean_duration_days"].mean()
        recent_duration = df.iloc[-len(df)//3:]["mean_duration_days"].mean()
        dur_diff = round(recent_duration - early_duration, 1)
        duration_insight = (
            f"Average event duration changed by {'+' if dur_diff > 0 else ''}{dur_diff} days "
            f"(from {round(early_duration, 1)} days to {round(recent_duration, 1)} days per event)."
        )

        # Intensity detail
        total_intensity = round(df["cumulative_intensity"].sum(), 1)
        max_recorded = round(df["max_peak_value"].max(), 1)
        intensity_insight = (
            f"Maximum peak value reached {max_recorded} with a cumulative excess intensity of "
            f"{total_intensity} recorded across the {end_year - start_year + 1}-year timeline."
        )

        # Statistical significance narrative
        if trend_stats.is_statistically_significant:
            sig_text = (
                f"Statistically significant trend detected (Mann-Kendall Tau: {trend_stats.mann_kendall_tau}, "
                f"p-value: {trend_stats.mann_kendall_p_value:.4f} < 0.05, R² = {trend_stats.r_squared}). "
                f"This indicates a non-random climatological shift."
            )
            risk = "High" if pct > 30 else "Moderate"
        else:
            sig_text = (
                f"The observed change is not yet statistically significant at the 95% confidence level "
                f"(Mann-Kendall p = {trend_stats.mann_kendall_p_value:.4f}, OLS p = {trend_stats.p_value:.4f}). "
                f"Interannual natural variability remains a prominent driver."
            )
            risk = "Moderate" if pct > 20 else "Low"

        return SummaryInsights(
            headline=headline,
            frequency_insight=freq_insight,
            duration_insight=duration_insight,
            intensity_insight=intensity_insight,
            scientific_significance=sig_text,
            risk_assessment=risk
        )
