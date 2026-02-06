output "database_endpoint" {
  value = aws_db_instance.postgres.address
}

output "object_storage_bucket" {
  value = aws_s3_bucket.documents.bucket
}

output "queue_url" {
  value = aws_sqs_queue.jobs.url
}
