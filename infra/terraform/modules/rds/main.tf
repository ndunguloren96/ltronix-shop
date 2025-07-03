resource "aws_db_instance" "default" {
  identifier            = "ltronix-shop-db"
  engine                = "postgres"
  engine_version        = "15.6"
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  db_name               = var.db_name
  username              = var.db_user
  password              = var.db_password
  port                  = 5432
  publicly_accessible   = true
  skip_final_snapshot   = true
  multi_az              = false
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name  = aws_db_subnet_group.default.name
  parameter_group_name  = "default.postgres15"
  auto_minor_version_upgrade = true
  apply_immediately     = false
  backup_retention_period = 7
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled = true
  performance_insights_retention_period = 7

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "default" {
  name       = "ltronix-shop-db-subnet-group"
  subnet_ids = var.public_subnet_ids

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_security_group" "db_sg" {
  name        = "ltronix-shop-db-sg"
  description = "Allow inbound traffic to RDS from anywhere (for dev)"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}
