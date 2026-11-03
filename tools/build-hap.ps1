param(
  [Parameter(Mandatory = $true)]
  [string]$DevEcoRoot,
  [string]$SdkRoot = ''
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$installation = (Resolve-Path -LiteralPath $DevEcoRoot).Path
$nodePath = Join-Path $installation 'tools\node\node.exe'
$hvigorPath = Join-Path $installation 'tools\hvigor\bin\hvigorw.js'
$javaPath = Join-Path $installation 'jbr'
if ($SdkRoot -eq '') {
  $SdkRoot = Join-Path $installation 'sdk'
}
foreach ($required in @($nodePath, $hvigorPath, $javaPath, $SdkRoot)) {
  if (-not (Test-Path -LiteralPath $required)) {
    throw "Required DevEco component not found: $required"
  }
}

$previousSdk = $env:DEVECO_SDK_HOME
$previousJava = $env:JAVA_HOME
$previousPath = $env:PATH
Push-Location -LiteralPath $projectRoot
try {
  $env:DEVECO_SDK_HOME = (Resolve-Path -LiteralPath $SdkRoot).Path
  $env:JAVA_HOME = $javaPath
  $env:PATH = (Join-Path $installation 'tools\node') + ';' +
    (Join-Path $installation 'tools\ohpm\bin') + ';' + $previousPath
  & $nodePath $hvigorPath --mode module -p product=default -p module=entry@default assembleHap --no-daemon
  if ($LASTEXITCODE -ne 0) {
    throw "Hvigor build failed with exit code $LASTEXITCODE"
  }
} finally {
  $env:DEVECO_SDK_HOME = $previousSdk
  $env:JAVA_HOME = $previousJava
  $env:PATH = $previousPath
  Pop-Location
}
