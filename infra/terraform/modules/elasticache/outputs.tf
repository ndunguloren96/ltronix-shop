output "cluster_address" {
  description = "The connection endpoint of the ElastiCache cluster"
  value       = aws_elasticache_cluster.default.cache_nodes[0].address
}

output "cluster_port" {
  description = "The port of the ElastiCache cluster"
  value       = aws_elasticache_cluster.default.port
}

output "cluster_id" {
  description = "The ID of the ElastiCache cluster"
  value       = aws_elasticache_cluster.default.cluster_id
}

output "elasticache_security_group_id" {
  description = "The ID of the ElastiCache security group"
  value       = aws_security_group.elasticache_sg.id
}