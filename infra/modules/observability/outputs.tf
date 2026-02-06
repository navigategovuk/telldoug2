output "error_alarm_name" {
  value = aws_cloudwatch_metric_alarm.error_rate.alarm_name
}

output "p95_alarm_name" {
  value = aws_cloudwatch_metric_alarm.p95_latency.alarm_name
}
