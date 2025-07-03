resource "aws_iam_user" "default" {
  name = "ltronix-shop-user"
  path = "/system/"

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_iam_access_key" "default" {
  user   = aws_iam_user.default.name
  status = "Active"
}

resource "aws_iam_user_policy" "s3_access" {
  name = "s3-access-policy"
  user = aws_iam_user.default.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
        ]
        Effect   = "Allow"
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*",
        ]
      },
    ]
  })
}
