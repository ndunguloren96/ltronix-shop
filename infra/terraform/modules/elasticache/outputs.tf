output "elasticache_cluster_address" {
  description = "The address of the ElastiCache cluster"
  value       = aws_elasticache_cluster.default.cache_nodes[0].address
}

output "elasticache_cluster_port" {
  description = "The port of the ElastiCache cluster"
  value       = aws_elasticache_cluster.default.port
}
