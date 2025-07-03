variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-north-1"
}

variable "db_name" {
  description = "Database name"
  type        = string
  sensitive   = true
}

variable "db_user" {
  description = "Database user"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS DB instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS DB allocated storage in GB"
  type        = number
  default     = 20
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
  default     = "ltronix-shop-bucket"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "ltronix-shop"
}

variable "environment" {
  description = "Deployment environment (e.g., dev, prod)"
  type        = string
  default     = "development"
}