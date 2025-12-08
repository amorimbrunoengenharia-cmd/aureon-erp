# Script para substituir cores hard-coded por tokens AUREON
$filePaths = @(
    "src\pages\FinanceModule.jsx",
    "src\pages\ExpensesManager.jsx",
    "src\pages\ReceivablesManager.jsx",
    "src\pages\BankAccountsManager.jsx",
    "src\pages\DREReport.jsx",
    "src\pages\UserSettings.jsx",
    "src\pages\UnifiedInventory.jsx"
)

# Mapeamento de cores para tokens
$replacements = @{
    # Text colors
    'text-\[#F3E5AB\](?!/)' = 'text-aureon-text'
    'text-\[#F3E5AB\]/70' = 'text-aureon-subtext'
    'text-\[#F3E5AB\]/60' = 'text-aureon-muted'
    'text-\[#F3E5AB\]/50' = 'text-aureon-muted/70'
    'text-\[#F3E5AB\]/40' = 'text-aureon-muted/40'
    'text-\[#F3E5AB\]/80' = 'text-aureon-text/80'
    
    # Placeholder colors
    'placeholder-\[#F3E5AB\]/30' = 'placeholder-aureon-muted'
    
    # Background colors (dark theme)
    'bg-\[#030305\]' = 'bg-aureon-bg'
    'bg-\[#0A0A0C\]' = 'bg-aureon-surface'
    
    # Gold/Primary colors
    'text-\[#D4AF37\]' = 'text-aureon-gold'
    'border-\[#D4AF37\]' = 'border-aureon-gold'
    'border-\[#D4AF37\]/30' = 'border-aureon-gold/30'
    'border-\[#D4AF37\]/20' = 'border-aureon-gold/20'
    'border-\[#D4AF37\]/10' = 'border-aureon-gold/10'
    
    # Purple (accent)
    'text-\[#8B5CF6\]' = 'text-aureon-purple'
    'border-\[#8B5CF6\]' = 'border-aureon-purple'
    'border-\[#8B5CF6\]/30' = 'border-aureon-purple/30'
    'border-\[#8B5CF6\]/20' = 'border-aureon-purple/20'
    'hover:border-\[#8B5CF6\]' = 'hover:border-aureon-purple'
    'focus:border-\[#8B5CF6\]' = 'focus:border-aureon-purple'
    'hover:bg-\[#8B5CF6\]/10' = 'hover:bg-aureon-purple/10'
}

Write-Host "Iniciando substituição de cores..." -ForegroundColor Cyan

foreach ($file in $filePaths) {
    if (Test-Path $file) {
        Write-Host "Processando: $file" -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        
        foreach ($pattern in $replacements.Keys) {
            $replacement = $replacements[$pattern]
            $content = $content -replace $pattern, $replacement
        }
        
        Set-Content $file $content -NoNewline
        Write-Host "  ✓ Concluído" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ Arquivo não encontrado: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Substituição concluída! Total de arquivos processados: $($filePaths.Count)" -ForegroundColor Cyan
