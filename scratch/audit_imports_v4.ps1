
$files = Get-ChildItem -Path src -Filter *.jsx -Recurse
$all_results = @()

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Find all JSX tags <TagName ...
    # This regex looks for < followed by an Uppercase letter, followed by letters/numbers
    $tags = [regex]::Matches($content, '<([A-Z][a-zA-Z0-9]*)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
    
    foreach ($tag in $tags) {
        # Check if the tag is imported or defined in the same file
        # Check for: import { ... Tag ... } or import Tag from ... or const Tag = ... or class Tag ...
        $is_defined = ($content -match "import\s+.*\b$tag\b") -or 
                      ($content -match "\bconst\s+$tag\b") -or 
                      ($content -match "\bfunction\s+$tag\b") -or 
                      ($content -match "\bclass\s+$tag\b") -or
                      ($content -match "\bexport\s+default\s+function\s+$tag\b")
        
        # Exceptions for common React/browser things if any (Fragment is usually imported)
        if ($tag -eq "Fragment" -and !($content -match "import\s+.*\bFragment\b")) {
            # React.Fragment is often used as <Fragment or <>
        }

        if (-not $is_defined) {
            $all_results += "Potential missing import: $tag in $($file.FullName)"
        }
    }
}

$all_results | Out-File -FilePath ..\scratch\audit_imports_v4.txt
$all_results
