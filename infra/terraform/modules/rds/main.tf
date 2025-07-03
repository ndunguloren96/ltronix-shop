resource "aws_db_instance" "default" {
  allocated_storage    = 20
  db_name              = var.db_name
  engine               = "postgres"
  engine_version       = "13.4"
  instance_class       = "db.t3.micro"
  username             = var.db_user
  password             = var.db_password
  parameter_group_name = "default.postgres13"
  skip_final_snapshot  = true
  publicly_accessible  = true # For development, consider private subnets for production
  vpc_security_group_ids = [] # Add security group IDs here
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  final_snapshot_identifier = "${var.db_name}-final-snapshot"
  performance_insights_enabled = true
  performance_insights_retention_period = 7
  # cloudwatch_log_group_arns = [aws_cloudwatch_log_group.rds_logs.arn] # Uncomment and pass from root module if needed
}
