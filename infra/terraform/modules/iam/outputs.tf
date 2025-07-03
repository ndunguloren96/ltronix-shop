output "access_key_id" {
  description = "The access key ID for the IAM user"
  value       = aws_iam_access_key.default.id
  sensitive   = true
}

output "secret_access_key" {
  description = "The secret access key for the IAM user"
  value       = aws_iam_access_key.default.secret
  sensitive   = true
}

output "iam_user_name" {
  description = "The name of the IAM user"
  value       = aws_iam_user.default.name
}
