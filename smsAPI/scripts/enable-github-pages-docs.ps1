param(
  [string]$Owner = "KIMJAEYOUNGBUSAN",
  [string]$Repo = "busanpos",
  [string]$Branch = "master",
  [string]$Path = "/docs"
)

$ErrorActionPreference = "Stop"

if (-not $env:GITHUB_TOKEN) {
  Write-Error "GITHUB_TOKEN environment variable is required. Create a GitHub token with repository administration/pages permission, then run this script again."
}

$headers = @{
  "Accept" = "application/vnd.github+json"
  "Authorization" = "Bearer $env:GITHUB_TOKEN"
  "X-GitHub-Api-Version" = "2022-11-28"
}

$baseUrl = "https://api.github.com/repos/$Owner/$Repo/pages"
$body = @{
  source = @{
    branch = $Branch
    path = $Path
  }
} | ConvertTo-Json -Depth 4

try {
  $current = Invoke-RestMethod -Uri $baseUrl -Headers $headers -Method Get
  $updateBody = @{
    source = @{
      branch = $Branch
      path = $Path
    }
  } | ConvertTo-Json -Depth 4
  $result = Invoke-RestMethod -Uri $baseUrl -Headers $headers -Method Put -ContentType "application/json" -Body $updateBody
  Write-Host "GitHub Pages updated."
  Write-Host "URL: $($result.html_url)"
  Write-Host "Source: $Branch $Path"
} catch {
  $statusCode = $_.Exception.Response.StatusCode.value__
  if ($statusCode -eq 404) {
    $result = Invoke-RestMethod -Uri $baseUrl -Headers $headers -Method Post -ContentType "application/json" -Body $body
    Write-Host "GitHub Pages created."
    Write-Host "URL: $($result.html_url)"
    Write-Host "Source: $Branch $Path"
  } else {
    throw
  }
}
