variable "aws_region" {
  type    = string
  default = "eu-west-2"
}

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "github_repository" {
  type = string
}

variable "db_username" {
  type    = string
  default = "housing_admin"
}

variable "db_password" {
  type      = string
  sensitive = true
}
