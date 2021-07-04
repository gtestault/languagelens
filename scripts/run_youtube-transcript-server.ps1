. $PSScriptRoot/../venv/Scripts/Activate.ps1
Set-Location $PSScriptRoot/../youtube-transcript-server
$env:FLASK_APP = "youtube-transcript-server"
flask run -p 5035
