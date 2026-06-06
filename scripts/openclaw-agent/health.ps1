param(
  [int]$Port = 8003
)

$ErrorActionPreference = "Stop"

$health = Invoke-RestMethod "http://127.0.0.1:$Port/health"
$models = Invoke-RestMethod "http://127.0.0.1:$Port/v1/models"

[PSCustomObject]@{
  health = $health.status
  model = $models.data[0].id
  context = $models.data[0].meta.n_ctx
  trainedContext = $models.data[0].meta.n_ctx_train
  endpoint = "http://127.0.0.1:$Port/v1"
} | ConvertTo-Json
