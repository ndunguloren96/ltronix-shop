module "rds" {
  source = "./modules/rds"

  db_name     = var.db_name
  db_user     = var.db_user
  db_password = var.db_password
  aws_region  = var.aws_region
}

module "s3" {
  source = "./modules/s3"

  aws_region = var.aws_region
}

module "iam" {
  source = "./modules/iam"

  aws_region = var.aws_region
}

module "elasticache" {
  source = "./modules/elasticache"

  aws_region = var.aws_region
}

resource "aws_cloudwatch_log_group" "rds_logs" {
  name              = "/aws/rds/instance/${module.rds.db_instance_address}"
  retention_in_days = 7
}