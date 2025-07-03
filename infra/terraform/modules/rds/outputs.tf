output "db_instance_address" {
  description = "The address of the RDS instance"
  value       = aws_db_instance.default.address
}

output "db_instance_port" {
  description = "The port of the RDS instance"
  value       = aws_db_instance.default.port
}

output "db_instance_identifier" {
  description = "The identifier of the RDS instance"
  value       = aws_db_instance.default.identifier
}

output "db_security_group_id" {
  description = "The ID of the RDS security group"
  value       = aws_security_group.db_sg.id
}
