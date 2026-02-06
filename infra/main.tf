module "network" {
  source       = "./modules/network"
  project_name = var.project_name
  environment  = var.environment
}

module "data" {
  source             = "./modules/data"
  project_name       = var.project_name
  environment        = var.environment
  private_subnet_ids = module.network.private_subnet_ids
  vpc_id             = module.network.vpc_id
  db_username        = var.db_username
  db_password        = var.db_password
}

module "service" {
  source             = "./modules/service"
  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
}

module "observability" {
  source       = "./modules/observability"
  project_name = var.project_name
  environment  = var.environment
}

module "github_oidc" {
  source            = "./modules/github_oidc"
  project_name      = var.project_name
  environment       = var.environment
  github_repository = var.github_repository
}
