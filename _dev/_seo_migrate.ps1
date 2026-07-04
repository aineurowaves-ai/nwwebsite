$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$site = 'https://neurowaves.ai'
$ogImage = "$site/assets/logo-white.png"

$routes = [ordered]@{
  'index.html' = '/'
  'services.html' = '/services/'
  'faq.html' = '/faq/'
  'cases.html' = '/cases/'
  'contact.html' = '/contact/'
  'blog.html' = '/blog/'
  'case-sion-clinic.html' = '/cases/sion-clinic/'
  'case-riyad-mabrouk-hotel.html' = '/cases/riyad-mabrouk-hotel/'
  'case-electronics-crm.html' = '/cases/electronics-crm/'
  'case-x-trans.html' = '/cases/x-trans/'
  'blog-where-inquiries-die.html' = '/blog/where-inquiries-die/'
  'blog-ai-agents-vs-chatbots.html' = '/blog/ai-agents-vs-chatbots/'
  'blog-pipeline-stages.html' = '/blog/pipeline-stages/'
  'blog-landing-pages-ai-search.html' = '/blog/landing-pages-ai-search/'
  'blog-fractional-cmo.html' = '/blog/fractional-cmo/'
  'blog-reactivation-sequences.html' = '/blog/reactivation-sequences/'
}

function Get-PageMeta([string]$html) {
  $title = ''
  $desc = ''
  if ($html -match '<title>([^<]*)</title>') { $title = $Matches[1].Trim() }
  if ($html -match '<meta name="description"[^>]*content="([^"]*)"') { $desc = $Matches[1].Trim() }
  return @{ title = $title; desc = $desc }
}

function Escape-Attr([string]$value) {
  return $value.Replace('"', '&quot;')
}

function Add-SeoHead([string]$html, [string]$path, [hashtable]$meta) {
  if ($html -match 'rel="canonical"') { return $html }

  $ogType = if ($path -match '^/blog/[^/]+/$' -or $path -match '^/cases/[^/]+/$') { 'article' } else { 'website' }
  $canonical = "$site$path"
  $title = Escape-Attr $meta.title
  $desc = Escape-Attr $meta.desc

  $seo = @"
  <link rel="canonical" href="$canonical">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="$ogType">
  <meta property="og:site_name" content="Neurowaves">
  <meta property="og:title" content="$title">
  <meta property="og:description" content="$desc">
  <meta property="og:url" content="$canonical">
  <meta property="og:image" content="$ogImage">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="$title">
  <meta name="twitter:description" content="$desc">
  <meta name="twitter:image" content="$ogImage">
"@

  if ($path -eq '/') {
    $seo += @"

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Neurowaves",
    "url": "$site/",
    "logo": "$ogImage",
    "email": "aineurowaves@gmail.com",
    "telephone": "+49-175-2078586",
    "sameAs": [
      "https://t.me/arthurrose97"
    ]
  }
  </script>
"@
  }

  return [regex]::Replace($html, '(<meta name="description"[^>]*>)', "`$1`n$seo", 1)
}

function Update-AssetPaths([string]$html) {
  $html = $html -replace 'href="styles\.css', 'href="/styles.css'
  $html = $html -replace 'src="assets/', 'src="/assets/'
  $html = $html -replace 'href="assets/', 'href="/assets/'
  $html = $html -replace 'src="i18n\.js', 'src="/i18n.js'
  $html = $html -replace 'src="script\.js', 'src="/script.js'
  $html = $html -replace 'src="blog-articles-i18n\.js', 'src="/blog-articles-i18n.js'
  return $html
}

function Update-Links([string]$html) {
  $pairs = @(
    @('blog-where-inquiries-die.html', '/blog/where-inquiries-die/'),
    @('blog-reactivation-sequences.html', '/blog/reactivation-sequences/'),
    @('blog-landing-pages-ai-search.html', '/blog/landing-pages-ai-search/'),
    @('blog-ai-agents-vs-chatbots.html', '/blog/ai-agents-vs-chatbots/'),
    @('blog-fractional-cmo.html', '/blog/fractional-cmo/'),
    @('blog-pipeline-stages.html', '/blog/pipeline-stages/'),
    @('case-riyad-mabrouk-hotel.html', '/cases/riyad-mabrouk-hotel/'),
    @('case-electronics-crm.html', '/cases/electronics-crm/'),
    @('case-sion-clinic.html', '/cases/sion-clinic/'),
    @('case-x-trans.html', '/cases/x-trans/'),
    @('services.html', '/services/'),
    @('contact.html', '/contact/'),
    @('cases.html', '/cases/'),
    @('blog.html', '/blog/'),
    @('faq.html', '/faq/'),
    @('index.html', '/')
  )
  foreach ($pair in $pairs) {
    $html = $html -replace [regex]::Escape($pair[0]), $pair[1]
  }
  return $html
}

function Get-TargetPath([string]$fileName) {
  $route = $routes[$fileName]
  if (-not $route) { return $null }
  if ($route -eq '/') { return Join-Path $root 'index.html' }
  $rel = $route.Trim('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
  return Join-Path (Join-Path $root $rel) 'index.html'
}

function Write-Redirect([string]$fileName, [string]$route) {
  if ($route -eq '/') { return }
  $target = Join-Path $root $fileName
  $canonical = "$site$route"
  $content = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting...</title>
  <link rel="canonical" href="$canonical">
  <meta http-equiv="refresh" content="0;url=$route">
  <script>location.replace("$route");</script>
</head>
<body>
  <p><a href="$route">Continue</a></p>
</body>
</html>
"@
  [IO.File]::WriteAllText($target, $content, [Text.UTF8Encoding]::new($false))
}

function Strip-SeoHead([string]$html) {
  $html = [regex]::Replace($html, '\s*<link rel="canonical"[^>]*>', '')
  $html = [regex]::Replace($html, '\s*<meta name="robots"[^>]*>', '')
  $html = [regex]::Replace($html, '\s*<meta property="og:[^"]+"[^>]*>', '')
  $html = [regex]::Replace($html, '\s*<meta name="twitter:[^"]+"[^>]*>', '')
  $html = [regex]::Replace($html, '\s*<script type="application/ld\+json">[\s\S]*?</script>', '')
  return $html
}

function Read-PageContent([string]$fileName) {
  $target = Get-TargetPath $fileName
  return [IO.File]::ReadAllText($target, [Text.UTF8Encoding]::new($false))
}

foreach ($entry in $routes.GetEnumerator()) {
  $html = Read-PageContent $entry.Key
  $html = Strip-SeoHead $html
  $html = Update-AssetPaths $html
  $html = Update-Links $html
  $meta = Get-PageMeta $html
  $html = Add-SeoHead $html $entry.Value $meta

  $target = Get-TargetPath $entry.Key
  [IO.File]::WriteAllText($target, $html, [Text.UTF8Encoding]::new($false))

  if ($entry.Key -ne 'index.html') {
    Write-Redirect $entry.Key $entry.Value
  }
}

$sitemapEntries = @()
foreach ($entry in $routes.GetEnumerator()) {
  $priority = switch -Regex ($entry.Value) {
    '^/$' { '1.0' }
    '^/(services|contact)/$' { '0.9' }
    '^/(cases|blog|faq)/$' { '0.8' }
    default { '0.7' }
  }
  $sitemapEntries += "  <url>`n    <loc>$site$($entry.Value)</loc>`n    <changefreq>monthly</changefreq>`n    <priority>$priority</priority>`n  </url>"
}

$sitemap = @"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
$($sitemapEntries -join "`n")
</urlset>
"@
[IO.File]::WriteAllText((Join-Path $root 'sitemap.xml'), $sitemap, [Text.UTF8Encoding]::new($false))

$robots = @"
User-agent: *
Allow: /

Sitemap: $site/sitemap.xml
"@
[IO.File]::WriteAllText((Join-Path $root 'robots.txt'), $robots, [Text.UTF8Encoding]::new($false))

Write-Host 'SEO migration complete.'
