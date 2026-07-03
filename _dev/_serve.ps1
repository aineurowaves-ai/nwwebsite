param([int]$Port = 8000)

$root = Split-Path $PSScriptRoot -Parent
$mime = @{
  ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8"; ".js"="application/javascript; charset=utf-8"
  ".json"="application/json"; ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".gif"="image/gif"
  ".svg"="image/svg+xml"; ".webp"="image/webp"; ".webm"="video/webm"; ".mp4"="video/mp4"; ".mov"="video/quicktime"
  ".ico"="image/x-icon"; ".woff"="font/woff"; ".woff2"="font/woff2"; ".ttf"="font/ttf"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving HTTP on http://localhost:$Port/ (root: $root)"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $relPath = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrEmpty($relPath)) { $relPath = "index.html" }
    $fullPath = Join-Path $root $relPath
    if ((Test-Path $fullPath -PathType Container)) { $fullPath = Join-Path $fullPath "index.html" }

    if ((Test-Path $fullPath -PathType Leaf) -and ([System.IO.Path]::GetFullPath($fullPath)).StartsWith($root)) {
      $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
      $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($fullPath)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      Write-Host "200 $($req.Url.AbsolutePath)"
    } else {
      $res.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $res.OutputStream.Write($msg, 0, $msg.Length)
      Write-Host "404 $($req.Url.AbsolutePath)"
    }
  } catch {
    Write-Host "ERR $($_.Exception.Message)"
  } finally {
    $res.OutputStream.Close()
  }
}
