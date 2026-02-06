resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTP5xxErrorRate"
  namespace           = "HousingPortal"
  period              = 60
  statistic           = "Average"
  threshold           = 0.02
}

resource "aws_cloudwatch_metric_alarm" "p95_latency" {
  alarm_name          = "${var.project_name}-${var.environment}-p95-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RequestP95LatencyMs"
  namespace           = "HousingPortal"
  period              = 60
  statistic           = "Average"
  threshold           = 2000
}
