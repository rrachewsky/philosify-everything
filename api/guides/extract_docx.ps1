param([string]$DocxPath)
Add-Type -Assembly System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($DocxPath)
$entry = $zip.GetEntry('word/document.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlText = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()
$xmlDoc = [xml]$xmlText
$ns = New-Object System.Xml.XmlNamespaceManager($xmlDoc.NameTable)
$ns.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$paragraphs = $xmlDoc.SelectNodes('//w:p', $ns)
foreach ($p in $paragraphs) {
    $line = ($p.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.'#text' }) -join ''
    if ($line.Trim()) { Write-Output $line }
}
