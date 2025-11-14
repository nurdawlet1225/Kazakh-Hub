# Терминалды іске қосу (Quick Start)

## PowerShell-де іске қосу:

### Нұсқа 1: Толық жолмен (ең сенімді)
```powershell
& "C:\Users\nurda\My Terminal\build\bin\Terminal.exe"
```

### Нұсқа 2: build папкасына кіріп
```powershell
cd build
.\bin\Terminal.exe
```

### Нұсқа 3: run.ps1 скрипті
```powershell
.\run.ps1
```

### Нұсқа 4: cmd арқылы run.bat
```powershell
cmd /c run.bat
```

## Command Prompt (cmd.exe)-де:

```cmd
run.bat
```

Немесе:

```cmd
cd build
bin\Terminal.exe
```

## Терминал командалары:

Терминал іске қосылғаннан кейін:

- `help` - барлық командаларды көрсету
- `ls` - бума мазмұнын көрсету
- `cd <path>` - буманы ауыстыру
- `mkdir <name>` - бума жасау
- `pwd` - ағымдағы жолды көрсету
- `userinfo` - пайдаланушы ақпараты
- `clear` - экранды тазалау
- `exit` - шығу

## Ескерту:

PowerShell-де `.bat` файлдарын тікелей іске қосқанда, олар PowerShell командалары ретінде танылмауы мүмкін. 
Сондықтан `cmd /c run.bat` немесе толық жолмен `& "C:\Users\nurda\My Terminal\build\bin\Terminal.exe"` пайдаланыңыз.


