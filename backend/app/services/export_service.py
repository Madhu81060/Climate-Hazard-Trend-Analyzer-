import io
import csv
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class ExportService:
    """
    Handles CSV and PDF report generation for climate hazard analysis.
    """

    @staticmethod
    def generate_csv(analysis_data: Dict[str, Any]) -> str:
        output = io.StringIO()
        writer = csv.writer(output)

        params = analysis_data.get("request_params", {})
        insights = analysis_data.get("summary_insights", {})
        trends = analysis_data.get("trend_statistics", {})

        # Header Metadata
        writer.writerow(["# CLIMATE HAZARD TREND ANALYZER REPORT"])
        writer.writerow(["Region", params.get("region_name", "N/A")])
        writer.writerow(["Coordinates", f"{params.get('latitude')}, {params.get('longitude')}"])
        writer.writerow(["Hazard Type", params.get("hazard_type", "N/A")])
        writer.writerow(["Analysis Period", f"{params.get('start_year')} - {params.get('end_year')}"])
        writer.writerow(["Headline Insight", insights.get("headline", "")])
        writer.writerow(["Mann-Kendall Trend", trends.get("mann_kendall_trend", "")])
        writer.writerow(["Mann-Kendall p-value", trends.get("mann_kendall_p_value", "")])
        writer.writerow(["Linear Slope (events/yr)", trends.get("slope", "")])
        writer.writerow([])

        # Section 1: Annual Metrics Table
        writer.writerow(["--- ANNUAL METRICS ---"])
        writer.writerow([
            "Year",
            "Hazard Frequency (events)",
            "Total Hazard Days",
            "Mean Duration (days)",
            "Max Duration (days)",
            "Cumulative Intensity",
            "Max Peak Value",
            "3-Yr Rolling Mean",
            "5-Yr Rolling Mean",
            "Linear Trendline"
        ])

        for metric in analysis_data.get("annual_metrics", []):
            writer.writerow([
                metric.get("year"),
                metric.get("hazard_frequency"),
                metric.get("total_hazard_days"),
                metric.get("mean_duration_days"),
                metric.get("max_duration_days"),
                metric.get("cumulative_intensity"),
                metric.get("max_peak_value"),
                metric.get("rolling_mean_3yr"),
                metric.get("rolling_mean_5yr"),
                metric.get("linear_trend_value")
            ])

        writer.writerow([])

        # Section 2: Detected Events Log
        writer.writerow(["--- RECENT DETECTED EVENTS LOG ---"])
        writer.writerow([
            "Event ID",
            "Year",
            "Start Date",
            "End Date",
            "Duration (Days)",
            "Peak Value",
            "Mean Value",
            "Cumulative Excess"
        ])

        for event in analysis_data.get("recent_events", []):
            writer.writerow([
                event.get("event_id"),
                event.get("year"),
                event.get("start_date"),
                event.get("end_date"),
                event.get("duration_days"),
                event.get("peak_value"),
                event.get("mean_value"),
                event.get("cumulative_excess")
            ])

        return output.getvalue()

    @staticmethod
    def generate_pdf(analysis_data: Dict[str, Any]) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#0f172a"),
            fontName="Helvetica-Bold"
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#64748b")
        )
        headline_style = ParagraphStyle(
            'HeadlineText',
            parent=styles['Heading2'],
            fontSize=13,
            leading=18,
            textColor=colors.HexColor("#b91c1c"),
            fontName="Helvetica-Bold"
        )
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155")
        )
        bold_style = ParagraphStyle(
            'ReportBold',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#0f172a"),
            fontName="Helvetica-Bold"
        )

        elements = []

        params = analysis_data.get("request_params", {})
        insights = analysis_data.get("summary_insights", {})
        trends = analysis_data.get("trend_statistics", {})
        quality = analysis_data.get("data_quality", {})

        # Header
        elements.append(Paragraph("Climate Hazard Trend Analyzer", title_style))
        elements.append(Paragraph("Executive Assessment & Climatological Trend Report", subtitle_style))
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#e2e8f0"), spaceAfter=15))

        # Headline Box
        elements.append(Paragraph(f"Key Finding: {insights.get('headline', '')}", headline_style))
        elements.append(Spacer(1, 8))
        elements.append(Paragraph(insights.get("frequency_insight", ""), body_style))
        elements.append(Paragraph(insights.get("duration_insight", ""), body_style))
        elements.append(Paragraph(insights.get("scientific_significance", ""), body_style))
        elements.append(Spacer(1, 12))

        # Metadata Table
        meta_data = [
            [
                Paragraph("<b>Target Region:</b>", bold_style),
                Paragraph(params.get("region_name", "N/A"), body_style),
                Paragraph("<b>Coordinates:</b>", bold_style),
                Paragraph(f"{params.get('latitude')}°, {params.get('longitude')}°", body_style),
            ],
            [
                Paragraph("<b>Hazard Type:</b>", bold_style),
                Paragraph(str(params.get("hazard_type")).capitalize(), body_style),
                Paragraph("<b>Timeline:</b>", bold_style),
                Paragraph(f"{params.get('start_year')} – {params.get('end_year')}", body_style),
            ],
            [
                Paragraph("<b>Percentile Threshold:</b>", bold_style),
                Paragraph(f"{params.get('threshold_percentile')}th ({quality.get('calculated_threshold')} {quality.get('threshold_unit')})", body_style),
                Paragraph("<b>Data Quality:</b>", bold_style),
                Paragraph(f"{quality.get('data_completeness_pct')}% complete ({quality.get('missing_days_interpolated')} days interpolated)", body_style),
            ]
        ]
        meta_table = Table(meta_data, colWidths=[110, 150, 110, 150])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 14))

        # Statistical Trend Metrics
        elements.append(Paragraph("<b>Statistical Trend Indicators:</b>", bold_style))
        elements.append(Spacer(1, 4))
        trend_table_data = [
            ["Metric", "Value", "Metric", "Value"],
            ["Mann-Kendall Trend", str(trends.get("mann_kendall_trend")).replace('_', ' ').capitalize(), "Mann-Kendall Tau", str(trends.get("mann_kendall_tau"))],
            ["Mann-Kendall p-value", f"{trends.get('mann_kendall_p_value'):.4f}", "Linear Slope (events/yr)", str(trends.get("slope"))],
            ["Linear R-Squared (R²)", str(trends.get("r_squared")), "Statistically Significant?", "YES (p < 0.05)" if trends.get("is_statistically_significant") else "NO (p ≥ 0.05)"],
            ["Total Change (%)", f"{'+' if trends.get('total_period_change_percent', 0) > 0 else ''}{trends.get('total_period_change_percent')}%", "Risk Assessment", insights.get("risk_assessment", "Moderate")]
        ]
        stat_table = Table(trend_table_data, colWidths=[130, 130, 130, 130])
        stat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#ffffff")),
        ]))
        elements.append(stat_table)
        elements.append(Spacer(1, 14))

        # Recent Annual Summary (sample rows)
        elements.append(Paragraph("<b>Annual Hazard Indicators (Recent Years):</b>", bold_style))
        elements.append(Spacer(1, 4))

        metrics = analysis_data.get("annual_metrics", [])
        sample_metrics = metrics[-10:] if len(metrics) > 10 else metrics

        metric_rows = [["Year", "Events", "Total Days", "Mean Duration", "Max Duration", "Cumulative Intensity", "Peak Value"]]
        for m in sample_metrics:
            metric_rows.append([
                str(m.get("year")),
                str(m.get("hazard_frequency")),
                str(m.get("total_hazard_days")),
                f"{m.get('mean_duration_days')} d",
                f"{m.get('max_duration_days')} d",
                f"{m.get('cumulative_intensity')}",
                f"{m.get('max_peak_value')} {quality.get('threshold_unit')}"
            ])

        m_table = Table(metric_rows, colWidths=[60, 60, 75, 85, 80, 95, 75])
        m_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#334155")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(m_table)
        elements.append(Spacer(1, 16))

        # Methodology footnote
        elements.append(Paragraph(
            "<b>Methodology:</b> Heatwaves defined as ≥3 consecutive days with Tmax exceeding the local 95th percentile. "
            "Data source: ECMWF ERA5 reanalysis via Open-Meteo API. Trends evaluated via OLS linear regression and Mann-Kendall test.",
            subtitle_style
        ))

        doc.build(elements)
        return buffer.getvalue()
