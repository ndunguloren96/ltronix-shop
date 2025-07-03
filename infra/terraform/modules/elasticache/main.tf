resource "aws_elasticache_cluster" "default" {
  cluster_id           = "${var.project_name}-cache"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis6.x"
  port                 = 6379
  engine_version       = "6.x"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}
