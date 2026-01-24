# Gmail SMTP Setup Checker
Write-Host "========================================"
Write-Host "Gmail SMTP Setup Checker"
Write-Host "========================================"
Write-Host ""

$errors = 0
$warnings = 0

# Check 1: .env file
Write-Host "[1/6] Checking .env file..." -NoNewline
if (Test-Path ".env") {
    Write-Host " OK" -ForegroundColor Green
    $envContent = Get-Content ".env" -Raw
    if ($envContent -like "*GMAIL_APP_PASSWORD=*") {
        if ($envContent -like "*your-16-digit-app-password-here*") {
            Write-Host "  WARNING: Please set your Gmail app password" -ForegroundColor Yellow
            $warnings++
        } else {
            Write-Host "  OK: GMAIL_APP_PASSWORD is set" -ForegroundColor Green
        }
    } else {
        Write-Host "  ERROR: GMAIL_APP_PASSWORD not found" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host "  Run: copy .env.example .env" -ForegroundColor Yellow
    $errors++
}

Write-Host ""

# Check 2: .gitignore
Write-Host "[2/6] Checking .gitignore..." -NoNewline
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -like "*.env*") {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " WARNING" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host " WARNING" -ForegroundColor Yellow
    $warnings++
}

Write-Host ""

# Check 3: Supabase config.toml
Write-Host "[3/6] Checking Supabase config.toml..." -NoNewline
if (Test-Path "supabase\config.toml") {
    Write-Host " OK" -ForegroundColor Green
    $configContent = Get-Content "supabase\config.toml" -Raw
    
    if ($configContent -like "*[auth.email.smtp]*") {
        Write-Host "  OK: SMTP section found" -ForegroundColor Green
        
        if ($configContent -like "*enabled = true*") {
            Write-Host "  OK: SMTP enabled" -ForegroundColor Green
        } else {
            Write-Host "  ERROR: SMTP not enabled" -ForegroundColor Red
            $errors++
        }
        
        if ($configContent -like "*smtp.gmail.com*") {
            Write-Host "  OK: Gmail SMTP configured" -ForegroundColor Green
        } else {
            Write-Host "  ERROR: Gmail SMTP not configured" -ForegroundColor Red
            $errors++
        }
        
        if ($configContent -like "*your-email@gmail.com*") {
            Write-Host "  WARNING: Please replace with your Gmail address" -ForegroundColor Yellow
            $warnings++
        }
    } else {
        Write-Host "  ERROR: SMTP section not found" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host " FAILED" -ForegroundColor Red
    $errors++
}

Write-Host ""

# Check 4: Node.js
Write-Host "[4/6] Checking Node.js..." -NoNewline
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host " OK ($nodeVersion)" -ForegroundColor Green
    } else {
        Write-Host " FAILED" -ForegroundColor Red
        $errors++
    }
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    $errors++
}

Write-Host ""

# Check 5: Supabase CLI
Write-Host "[5/6] Checking Supabase CLI..." -NoNewline
try {
    $supabaseCheck = Get-Command supabase -ErrorAction SilentlyContinue
    if ($supabaseCheck) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " WARNING" -ForegroundColor Yellow
        $warnings++
    }
} catch {
    Write-Host " WARNING" -ForegroundColor Yellow
    $warnings++
}

Write-Host ""

# Check 6: Docker
Write-Host "[6/6] Checking Docker..." -NoNewline
try {
    $dockerCheck = Get-Command docker -ErrorAction SilentlyContinue
    if ($dockerCheck) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " WARNING" -ForegroundColor Yellow
        $warnings++
    }
} catch {
    Write-Host " WARNING" -ForegroundColor Yellow
    $warnings++
}

Write-Host ""
Write-Host "========================================"
Write-Host "Results"
Write-Host "========================================"

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "All checks passed!" -ForegroundColor Green
} elseif ($errors -eq 0) {
    Write-Host "$warnings warnings found" -ForegroundColor Yellow
} else {
    Write-Host "$errors errors and $warnings warnings found" -ForegroundColor Red
}

Write-Host ""
Write-Host "See docs\GMAIL_SMTP_SETUP.md for details"
Write-Host ""
