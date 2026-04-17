
$components = @(
    "Label", "Dialog", "DialogContent", "DialogHeader", "DialogTitle", "DialogTrigger", "DialogDescription", "DialogFooter",
    "Loader2", "ImageIcon", "Badge", "Button", "Input", "Textarea", "Plus", "Pencil", "Trash2", "Search", "Users", "Calendar", "MapPin"
)

$srcDir = "c:\Users\Usuario\Documents\projects\prof-presente\cracha-virtual-frontend\src"
$files = Get-ChildItem -Path $srcDir -Filter "*.jsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName
    $allInOneLine = $content -join " "
    
    foreach ($comp in $components) {
        # Check if component is used in JSX: <Comp or Comp. or as a variable
        # Simple check: <Comp or {Comp} or (Comp)
        if ($allInOneLine -match "<$comp" -or $allInOneLine -match "\{$comp" -or $allInOneLine -match "\($comp\)") {
            if ($allInOneLine -notmatch "import.*$comp.*from") {
                # Special cases for aliased icons like Image as ImageIcon
                if ($comp -eq "ImageIcon" -and $allInOneLine -match "Image as ImageIcon") {
                    continue
                }
                Write-Host "Potential missing import: $comp in $($file.FullName)"
            }
        }
    }
}
