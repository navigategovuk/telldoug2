output "vpc_id" {
  value = module.network.vpc_id
}

output "database_endpoint" {
  value = module.data.database_endpoint
}

output "object_storage_bucket" {
  value = module.data.object_storage_bucket
}

output "queue_url" {
  value = module.data.queue_url
}

output "ecs_cluster_name" {
  value = module.service.cluster_name
}

output "deploy_role_arn" {
  value = module.github_oidc.deploy_role_arn
}
