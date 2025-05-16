# Test script for API calls

# Change these values as needed
$API_BASE_URL = "http://localhost:8000"
$PROJECT_NAME = "Test Project $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$PROJECT_TOPIC = "Deklarationsanalyse"

# Read token from file or prompt
$TOKEN_FILE = "auth_token.txt"
$TOKEN = ""

if (Test-Path $TOKEN_FILE) {
    $TOKEN = Get-Content $TOKEN_FILE
    Write-Host "Using token from file: $TOKEN_FILE"
} else {
    $TOKEN = Read-Host "Enter your JWT token"
    $TOKEN | Out-File -FilePath $TOKEN_FILE
    Write-Host "Token saved to file: $TOKEN_FILE"
}

# Create JSON payload
$JSON_PAYLOAD = @{
    name = $PROJECT_NAME
    topic = $PROJECT_TOPIC
} | ConvertTo-Json

Write-Host "Sending request to: $API_BASE_URL/projects/create"
Write-Host "Payload: $JSON_PAYLOAD"

# Use curl to make the request
try {
    $response = curl.exe -X POST `
        -H "Content-Type: application/json" `
        -H "Authorization: Bearer $TOKEN" `
        -d $JSON_PAYLOAD `
        "$API_BASE_URL/projects/create" `
        -v

    Write-Host "Response:"
    Write-Host $response
} catch {
    Write-Host "Error making request: $_"
}

Write-Host "Test completed." 