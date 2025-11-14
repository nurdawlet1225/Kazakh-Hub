# DLL қатесін шешу

## Проблема:
`libstdc++-6.dll` табылмады қатесі көрсетілді.

## Шешім:

### ✅ Орындалды:
1. MinGW DLL файлдары көшірілді:
   - `libstdc++-6.dll`
   - `libgcc_s_seh-1.dll`
   - `libwinpthread-1.dll`

2. DLL файлдары `build\bin\` папкасында Terminal.exe-мен бірге орналастырылды.

### Болашақта:

#### Нұсқа 1: copy_dlls.bat пайдалану
Құрастырудан кейін:
```cmd
copy_dlls.bat
```

#### Нұсқа 2: Автоматты көшіру
CMakeLists.txt жаңартылды - келесі құрастыруда DLL-дер автоматты түрде көшіріледі.

## Терминалды іске қосу:

Енді терминал дұрыс жұмыс істеуі керек:

```cmd
cd build\bin
Terminal.exe
```

Немесе:

```cmd
run.bat
```

## Тексеру:

DLL файлдары бар ма тексеру:
```powershell
Get-ChildItem build\bin\*.dll
```

Қажетті файлдар:
- Terminal.exe
- libstdc++-6.dll
- libgcc_s_seh-1.dll
- libwinpthread-1.dll

## Ескерту:

Егер терминалды басқа компьютерге көшірсеңіз, DLL файлдарын да көшіру керек!


