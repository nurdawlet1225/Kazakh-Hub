# N3XUS-OS Terminal

**Байланыс, Cyber Hub Vibe**

## 🚀 Іске қосу

### Нұсқа 1: Бөлек терезеден (ҰСЫНЫЛАДЫ)

**START_N3XUS.bat** файлына қос клик жасаңыз.

Немесе:

**N3XUS-OS.bat** файлына қос клик жасаңыз.

### Нұсқа 2: Command Prompt арқылы

```cmd
START_N3XUS.bat
```

Немесе:

```cmd
start "N3XUS-OS" cmd /k "cd /d C:\Users\nurda\My Terminal\build\bin && Terminal.exe"
```

### Нұсқа 3: Тікелей

```cmd
cd build\bin
Terminal.exe
```

## 📋 Командалар

- `help` - Барлық командаларды көрсету
- `ls [path]` - Бума мазмұнын көрсету
- `cd [path]` - Буманы ауыстыру
- `mkdir <path>` - Бума жасау
- `cp <src> <dst>` - Файл/бума көшіру
- `pwd` - Ағымдағы жолды көрсету
- `userinfo` - Пайдаланушы ақпараты
- `clear` - Экранды тазалау
- `upload <file> [options]` - Код файлын Kazakh Hub-қа жүктеу
- `exit` / `quit` - Шығу

### Код жүктеу командасы

Код файлын сайтқа жүктеу үшін:

```bash
upload <file_path> --author "<author_name>" [options]
```

**Опциялар:**
- `--title <title>` - Код атауы (әдепкі: файл атауы)
- `--author <author>` - Автор аты (міндетті)
- `--language <lang>` - Бағдарламалау тілі (автоматты анықталады, егер көрсетілмесе)
- `--description <desc>` - Код сипаттамасы

**Мысалдар:**
```bash
upload main.cpp --author "John Doe" --title "My C++ Program"
upload app.py --author "Jane Smith" --language "Python" --description "Web application"
upload index.html --author "Bob" --title "Homepage"
```

**Ескерту:** Backend сервері `http://127.0.0.1:3000` адресінде жұмыс істеуі керек. Сондай-ақ, `curl` құралы жүйеде орнатылған болуы керек.

## 🎨 Ерекшеліктер

- ✨ Cyber hub стиліндегі интерфейс
- 🎯 Түсті prompt (N3XUS::)
- 📁 Виртуалды файл жүйесі
- 🔧 Кеңейтілген командалар
- 💻 Windows 10+ түс қолдауы

## 📦 Құрастыру

```cmd
build.bat
```

Немесе:

```cmd
cd build
cmake --build .
```

## 📝 Версия

**N3XUS-OS Terminal v1.0**

---

**Байланыс, Cyber Hub Vibe** 🚀


