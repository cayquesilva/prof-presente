
$components = @(
    "Label", "Dialog", "DialogContent", "DialogHeader", "DialogTitle", "DialogTrigger", "DialogDescription", "DialogFooter",
    "Loader2", "ImageIcon", "Badge", "Button", "Input", "Textarea", "Plus", "Pencil", "Trash2", "Search", "Users", "Calendar", "MapPin",
    "GraduationCap", "LayoutDashboard", "Share2", "ArrowRight", "AlertCircle", "CheckCircle", "CheckCircle2", "MoreHorizontal"
)

$srcDir = "c:\Users\Usuario\Documents\projects\prof-presente\cracha-virtual-frontend\src"
$files = Get-ChildItem -Path $srcDir -Filter "*.jsx" -Recurse

foreach ($file in $files) {
    # Lee o arquivo mantendo a capitalizao
    $content = Get-Content $file.FullName
    $allInOneLine = $content -join " "
    
    foreach ($comp in $components) {
        # Check case-sensitive match for usage: <Comp, {Comp}, (Comp), Comp.
        if ($allInOneLine -cmatch "<$comp" -or $allInOneLine -cmatch "\{$comp" -or $allInOneLine -cmatch "\($comp\)" -or $allInOneLine -cmatch "\s$comp\.") {
            
            # Check if it is imported (case-insensitive for import string but usually case-sensitive for the specific symbol)
            # Use cmatch to ensure the symbol itself is correctly capitalized in the import
            if ($allInOneLine -notcmatch "import.*$comp.*from") {
                # Special cases
                if ($comp -eq "ImageIcon" -and $allInOneLine -cmatch "Image as ImageIcon") {
                    continue
                }
                if ($comp -eq "CheckCircle" -and $allInOneLine -cmatch "CircleCheck as CheckCircle") {
                    continue
                }
                if ($file.Name -eq "BadgeGenerator.jsx" -and $comp -eq "Badge") {
                    # Might be a local component or export
                    continue
                }
                
                Write-Host "Real missing import: $comp in $($file.FullName)"
            }
        }
    }
}
