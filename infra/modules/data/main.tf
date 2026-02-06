resource "aws_db_subnet_group" "this" {
  name       = "${var.project_name}-${var.environment}-db-subnets"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "db" {
  name        = "${var.project_name}-${var.environment}-db-sg"
  description = "Database access"
  vpc_id      = var.vpc_id
}

resource "aws_db_instance" "postgres" {
  identifier             = "${var.project_name}-${var.environment}-postgres"
  engine                 = "postgres"
  engine_version         = "15"
  instance_class         = "db.t4g.micro"
  allocated_storage      = 20
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.db.id]
  skip_final_snapshot    = true
  publicly_accessible    = false
}

resource "aws_s3_bucket" "documents" {
  bucket = "${var.project_name}-${var.environment}-documents"
}

resource "aws_sqs_queue" "jobs" {
  name = "${var.project_name}-${var.environment}-jobs"
}

resource "aws_secretsmanager_secret" "app" {
  name = "${var.project_name}/${var.environment}/app"
}
