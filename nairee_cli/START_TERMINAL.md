# Терминалды іске қосу нұсқаулары

## ⚠️ Маңызды ескерту:

Терминал **интерактивті бағдарлама**. Ол сіздің командаларыңызды күтеді және оларды орындайды.

## ✅ Дұрыс іске қосу әдістері:

### 1. Command Prompt (cmd.exe) - ҰСЫНЫЛАДЫ

Windows-та Command Prompt ашыңыз (cmd.exe) және:

```cmd
cd "C:\Users\nurda\My Terminal"
run.bat
```

Немесе тікелей:

```cmd
cd "C:\Users\nurda\My Terminal\build\bin"
Terminal.exe
```

### 2. PowerShell-де (жаңа терезеден)

PowerShell-де терминалды іске қосқанда, ол дұрыс жұмыс істеуі үшін:

```powershell
cd "C:\Users\nurda\My Terminal\build\bin"
Start-Process -FilePath ".\Terminal.exe" -NoNewWindow
```

Немесе тікелей cmd арқылы:

```powershell
cmd /c "cd /d C:\Users\nurda\My Terminal && run.bat"
```

### 3. Windows Explorer-ден

1. `build\bin` папкасына барыңыз
2. `Terminal.exe` файлына қос клик жасаңыз
3. Жаңа терезеден терминал ашылады

## 📝 Терминалды пайдалану:

Терминал іске қосылғаннан кейін:

```
Welcome to Terminal!
Type 'help' for available commands or 'exit' to quit.

/ $ 
```

Мұнда сіз командаларды енгізе аласыз:

- `help` - барлық командаларды көрсету
- `ls` - бума мазмұнын көрсету  
- `mkdir test` - test бумасын жасау
- `cd test` - test бумасына өту
- `pwd` - ағымдағы жолды көрсету
- `userinfo` - пайдаланушы ақпараты
- `clear` - экранды тазалау
- `exit` - шығу

## 🔧 Проблема шешу:

Егер терминал бірден жабылса:

1. **Command Prompt пайдаланыңыз** (PowerShell емес)
2. Немесе `Terminal.exe` файлына қос клик жасаңыз
3. Терминал терезесінде командаларды енгізіңіз

## 💡 Мысал сессия:

```
/ $ help

Available Commands:

  help          - Display this help message
  ls [path]     - List directory contents
  cd [path]     - Change current directory
  mkdir <path>  - Create a new directory
  pwd           - Print current working directory
  userinfo      - Display user information
  clear         - Clear the terminal screen
  exit/quit     - Exit the terminal

/ $ mkdir documents
Directory created: documents

/ $ cd documents
/documents $ ls
(empty)

/documents $ cd ..
/ $ ls
[DIR]  documents

/ $ exit
Goodbye!
```


