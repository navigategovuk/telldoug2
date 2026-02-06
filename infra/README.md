# Infrastructure (Terraform)

Target region: `eu-west-2`.

## Modules
- `network`: VPC + subnet foundations
- `data`: RDS PostgreSQL, S3, SQS, Secrets Manager
- `service`: ECS cluster/service runtime
- `observability`: CloudWatch alarms for SLO rollback hooks
- `github_oidc`: GitHub Actions OIDC trust role for deployments

## Usage
```bash
cd infra
terraform init
terraform validate
terraform plan \
  -var="project_name=housing-portal" \
  -var="environment=dev" \
  -var="github_repository=owner/repo"
```
