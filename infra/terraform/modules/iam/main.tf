resource "aws_iam_user" "default" {
  name = "${var.project_name}-user"
  path = "/system/"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_access_key" "default" {
  user = aws_iam_user.default.name
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
          "arn:aws:s3:::${var.project_name}-bucket",
          "arn:aws:s3:::${var.project_name}-bucket/*",
        ]
      },
    ]
  })
}
