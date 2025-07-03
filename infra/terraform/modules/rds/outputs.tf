output "db_instance_address" {
  description = "The address of the RDS instance"
  value       = aws_db_instance.default.address
}

output "db_instance_port" {
  description = "The port of the RDS instance"
  value       = aws_db_instance.default.port
}
