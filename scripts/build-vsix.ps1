$ErrorActionPreference = 'Stop'
$extDir = Join-Path $PWD 'miki-template-extension'
$vsixPath = Join-Path $PWD 'miki-template-1.2.0.vsix'
if (Test-Path $vsixPath) { Remove-Item $vsixPath -Force }
$tempDir = Join-Path $env:TEMP ('vsix-build-' + [Guid]::NewGuid().ToString('N').Substring(0,8))
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
$extTarget = Join-Path $tempDir 'extension'
Copy-Item -Path $extDir -Destination $extTarget -Recurse -Force
$manifest = '<?xml version="1.0" encoding="utf-8"?><PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011"><Metadata><Identity Id="alainmiki.miki-template" Version="1.2.0" Language="en-US" Publisher="alainmiki" /><DisplayName>miki-template</DisplayName><Description>Django-style template language syntax highlighting and snippets for miki-template</Description><Tags>django template miki syntax highlight snippet</Tags><Categories>Programming Languages,Snippets</Categories><GalleryFlags>Public</GalleryFlags><License>LICENSE</License><Icon>extension/icon.png</Icon></Metadata><Installation><InstallationTarget Id="Microsoft.VisualStudio.Code" /></Installation><Dependencies /><Assets><Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" /><Asset Type="Microsoft.VisualStudio.Code.Content" Path="extension/syntaxes/miki-template.tmLanguage.json" Addressable="true" /><Asset Type="Microsoft.VisualStudio.Code.Content" Path="extension/syntaxes/language-configuration.json" Addressable="true" /><Asset Type="Microsoft.VisualStudio.Code.Snippet" Path="extension/snippets/miki-template.json" Addressable="true" /><Asset Type="Microsoft.VisualStudio.Code.Image" Path="extension/icon.png" Addressable="true" /><Asset Type="Microsoft.VisualStudio.Code.Image" Path="extension/icon.svg" Addressable="true" /></Assets></PackageManifest>'
Set-Content -Path (Join-Path $tempDir 'extension.vsixmanifest') -Value $manifest -Encoding UTF8
$ct = '<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="json" ContentType="application/json" /><Default Extension="png" ContentType="image/png" /><Default Extension="svg" ContentType="image/svg+xml" /><Default Extension="md" ContentType="text/markdown" /></Types>'
Set-Content -Path (Join-Path $tempDir '[Content_Types].xml') -Value $ct -Encoding UTF8
Compress-Archive -Path (Join-Path $tempDir '*') -DestinationPath $vsixPath -Force
Remove-Item $tempDir -Recurse -Force
Write-Host "VSIX created at $vsixPath"
