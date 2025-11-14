# Құрастыру Нұсқаулары (Build Instructions)

## Windows үшін

### Нұсқа 1: build.bat пайдалану (ең оңай)

Егер сізде g++ немесе MSVC компиляторы орнатылған болса:

```bash
build.bat
```

Содан кейін:
```bash
build\Terminal.exe
```

### Нұсқа 2: CMake пайдалану

1. CMake орнатыңыз: https://cmake.org/download/
2. Build Tools орнатыңыз (MinGW немесе Visual Studio)

```bash
mkdir build
cd build
cmake ..
cmake --build .
```

Содан кейін:
```bash
build\Terminal.exe
```

### Нұсқа 3: Қолмен компиляция

#### MinGW (g++) арқылы:
```bash
g++ -std=c++17 -Wall -O2 -o Terminal.exe src\main.cpp src\Terminal.cpp src\CommandParser.cpp src\CommandExecutor.cpp src\VFS.cpp src\commands\*.cpp -Isrc -Iinclude
```

#### MSVC арқылы:
```bash
cl /EHsc /std:c++17 /O2 /Fe:Terminal.exe src\main.cpp src\Terminal.cpp src\CommandParser.cpp src\CommandExecutor.cpp src\VFS.cpp src\commands\*.cpp /Isrc /Iinclude
```

## Қажетті құралдар

- C++17 қолдайтын компилятор:
  - MinGW-w64 (g++)
  - Visual Studio 2017+ (cl)
  - Clang

- CMake (міндетті емес, бірақ ұсынылады)

## Орнату

### MinGW-w64 орнату:
1. https://www.mingw-w64.org/downloads/ сайтына барыңыз
2. MSYS2 немесе басқа дистрибутивті жүктеп алыңыз
3. PATH айнымалысына қосыңыз

### Visual Studio Build Tools:
1. https://visualstudio.microsoft.com/downloads/ сайтына барыңыз
2. "Build Tools for Visual Studio" жүктеп алыңыз
3. C++ құрастыру құралдарын таңдаңыз


