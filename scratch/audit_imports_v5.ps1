
$files = Get-ChildItem -Path src -Filter *.jsx -Recurse
$all_results = @()

foreach ($file in $files) {
    # Read-Raw is better but Get-Content -Raw works
    $content = Get-Content $file.FullName -Raw
    
    # regex for Tags
    $tags = [regex]::Matches($content, '<([A-Z][a-zA-Z0-9]*)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
    
    foreach ($tag in $tags) {
        # Check if the tag is imported or defined
        # Use (?s) to allow . to match newlines
        $is_defined = ($content -match "(?s)import\s+.*?\b$tag\b") -or 
                      ($content -match "\bconst\s+$tag\b") -or 
                      ($content -match "\bfunction\s+$tag\b") -or 
                      ($content -match "\bclass\s+$tag\b") -or
                      ($content -match "\bexport\s+default\s+function\s+$tag\b")
        
        if (-not $is_defined) {
            $all_results += "Potential missing import: $tag in $($file.FullName)"
        }
    }
}

$all_results | Out-File -FilePath ..\scratch\audit_imports_v5.txt
$all_results
