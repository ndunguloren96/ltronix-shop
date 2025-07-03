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

variable "aws_region" {
  description = "AWS region"
  type        = string
}
