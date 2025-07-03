resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "ltronix-shop-vpc"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "ltronix-shop-igw"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name        = "ltronix-shop-public-subnet"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "ltronix-shop-public-route-table"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

module "rds" {
  source = "./modules/rds"

  db_name             = var.db_name
  db_user             = var.db_user
  db_password         = var.db_password
  aws_region          = var.aws_region
  db_instance_class   = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  project_name        = var.project_name
  environment         = var.environment

  vpc_id           = aws_vpc.main.id
  public_subnet_id = aws_subnet.public.id
}

module "s3" {
  source = "./modules/s3"

  aws_region   = var.aws_region
  bucket_name  = var.s3_bucket_name
  project_name = var.project_name
  environment  = var.environment
}

module "iam" {
  source = "./modules/iam"

  aws_region     = var.aws_region
  project_name   = var.project_name
  environment    = var.environment
  s3_bucket_name = var.s3_bucket_name
}

module "elasticache" {
  source = "./modules/elasticache"

  aws_region       = var.aws_region
  project_name     = var.project_name
  environment      = var.environment

  vpc_id           = aws_vpc.main.id
  public_subnet_id = aws_subnet.public.id
}

resource "aws_cloudwatch_log_group" "rds_logs" {
  name              = "/aws/rds/instance/${module.rds.db_instance_identifier}"
  retention_in_days = 7

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

output "rds_endpoint" {
  description = "The connection endpoint of the RDS instance"
  value       = module.rds.db_instance_address
}

output "rds_port" {
  description = "The port of the RDS instance"
  value       = module.rds.db_instance_port
}

output "rds_username" {
  description = "The master username for the RDS instance"
  value       = var.db_user
  sensitive   = true
}

output "rds_password" {
  description = "The master password for the RDS instance"
  value       = var.db_password
  sensitive   = true
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket"
  value       = module.s3.bucket_name
}

output "elasticache_endpoint" {
  description = "The connection endpoint of the ElastiCache cluster"
  value       = module.elasticache.cluster_address
}

output "elasticache_port" {
  description = "The port of the ElastiCache cluster"
  value       = module.elasticache.cluster_port
}

output "iam_user_access_key_id" {
  description = "The access key ID for the IAM user"
  value       = module.iam.access_key_id
  sensitive   = true
}

output "iam_user_secret_access_key" {
  description = "The secret access key for the IAM user"
  value       = module.iam.secret_access_key
  sensitive   = true
}

output "vpc_id" {
  description = "The ID of the created VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "The ID of the public subnet"
  value       = aws_subnet.public.id
}
