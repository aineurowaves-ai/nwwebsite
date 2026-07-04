param(
  [string]$Version = "v7"
)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$backupRoot = Join-Path $root '_backup-versions'
$target = Join-Path $backupRoot $Version

if (Test-Path $backupRoot) {
  Remove-Item $backupRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $target -Force | Out-Null

$core = @(
  'index.html',
  'styles.css',
  'script.js',
  'i18n.js',
  'blog-articles-i18n.js',
  'robots.txt',
  'sitemap.xml',
  'CNAME',
  'assets',
  'blog',
  'cases',
  'contact',
  'faq',
  'services'
)

foreach ($item in $core) {
  $src = Join-Path $root $item
  if (-not (Test-Path $src)) { throw "Missing backup source: $item" }
  Copy-Item $src (Join-Path $target $item) -Recurse -Force
}

Get-ChildItem $root -Filter '*.html' -File |
  Where-Object { $_.Name -ne 'index.html' } |
  ForEach-Object { Copy-Item $_.FullName (Join-Path $target $_.Name) -Force }

$date = Get-Date -Format 'yyyy-MM-dd'
$stylesVer = if ((Get-Content (Join-Path $root 'index.html') -Raw) -match 'styles\.css\?v=(\d+)') { $Matches[1] } else { '?' }
$scriptVer = if ((Get-Content (Join-Path $root 'index.html') -Raw) -match 'script\.js\?v=(\d+)') { $Matches[1] } else { '?' }

$vReadme = @"
# Neurowaves — backup $Version

**Snapshot:** $date (production state)

Full copy of the live site: clean URLs, SEO files, all pages, scripts, i18n, blog articles, team photos, and assets.

Cache refs at snapshot time: ``styles.css?v=$stylesVer``, ``script.js?v=$scriptVer``.

## Restore

``````powershell
# From repository root — overwrites current production files
Copy-Item -Path "_backup-versions\$Version\*" -Destination "." -Recurse -Force
``````

Then hard-refresh the browser: **Ctrl+Shift+R**.

## Preview without restoring

``````powershell
powershell -ExecutionPolicy Bypass -File "_dev\_serve.ps1" -Port 8080
``````

Open http://localhost:8080/_backup-versions/$Version/
"@

$rootReadme = @"
# Backup versions

Archived copies of the Neurowaves site. **Not used in production.**

| Version | Notes |
|---------|--------|
| **$Version** | **Full snapshot ($date)** — current site with clean URLs, SEO, contact team block, service CTAs |

The current production site is in the repository root.

To create a fresh backup: ``powershell -ExecutionPolicy Bypass -File "_dev\_backup_site.ps1" -Version v8``
"@

[IO.File]::WriteAllText((Join-Path $target 'README.md'), $vReadme, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $backupRoot 'README.md'), $rootReadme, [Text.UTF8Encoding]::new($false))

Write-Host "Backup saved to $target"
