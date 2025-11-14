# Version Control Information

## Current Version: 1.0

This project uses Git for version control. Version 1.0 has been saved and tagged.

## How to Return to Version 1.0

If you need to restore the project to version 1.0, use one of these methods:

### Method 1: Checkout the tag (read-only)
```bash
git checkout v1.0
```

### Method 2: Create a new branch from version 1.0
```bash
git checkout -b restore-v1.0 v1.0
```

### Method 3: Reset current branch to version 1.0 (⚠️ destructive)
```bash
git reset --hard v1.0
```

### Method 4: View version 1.0 files without changing
```bash
git show v1.0:src/main.cpp  # View a specific file
git show v1.0               # View all changes
```

## Version History

- **v1.0** (Current) - Initial terminal implementation
  - Virtual File System (VFS)
  - Command parser and executor
  - Basic commands: help, ls, cd, mkdir, userinfo, pwd, clear, exit

## Creating New Versions

To save a new version:
```bash
git add .
git commit -m "Description of changes"
git tag -a v1.1 -m "Version 1.1 description"
```

