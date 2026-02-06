resource "aws_ecs_cluster" "this" {
  name = "${var.project_name}-${var.environment}-cluster"
}

resource "aws_security_group" "service" {
  name        = "${var.project_name}-${var.environment}-service-sg"
  description = "Service security group"
  vpc_id      = var.vpc_id
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-${var.environment}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = null
  task_role_arn            = null

  container_definitions = jsonencode([
    {
      name      = "housing-app"
      image     = "ghcr.io/example/housing-portal:latest"
      essential = true
      portMappings = [
        {
          containerPort = 3333
          protocol      = "tcp"
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "app" {
  name            = "${var.project_name}-${var.environment}-service"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.service.id]
    assign_public_ip = false
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
}
