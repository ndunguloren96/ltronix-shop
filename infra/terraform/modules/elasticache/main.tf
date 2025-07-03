resource "aws_elasticache_cluster" "default" {
  cluster_id           = "ltronix-shop-cache"
  engine               = "redis"
  engine_version       = "6.x"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  port                 = 6379
  parameter_group_name = "default.redis6.x"
  security_group_ids   = [aws_security_group.elasticache_sg.id]
  subnet_group_name    = aws_elasticache_subnet_group.default.name
  auto_minor_version_upgrade = true

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_elasticache_subnet_group" "default" {
  name       = "ltronix-shop-cache-subnet-group"
  subnet_ids = var.public_subnet_ids

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_security_group" "elasticache_sg" {
  name        = "ltronix-shop-elasticache-sg"
  description = "Allow inbound traffic to ElastiCache from anywhere (for dev)"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
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
