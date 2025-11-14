#include "HelpCommand.hpp"
#include <iostream>

namespace Terminal {

bool HelpCommand::execute(const ParsedCommand& command, CommandExecutor& executor) {
    printHelp();
    return true;
}

void HelpCommand::printHelp() {
    std::cout << "\nAvailable Commands:\n" << std::endl;
    std::cout << "  help          - Display this help message" << std::endl;
    std::cout << "  ls [path]     - List directory contents" << std::endl;
    std::cout << "  dir [path]    - List directory contents (alias)" << std::endl;
    std::cout << "  cd [path]     - Change current directory" << std::endl;
    std::cout << "  mkdir <path>  - Create a new directory" << std::endl;
    std::cout << "  cp <src> <dst> - Copy file or directory" << std::endl;
    std::cout << "  copy <src> <dst> - Copy file or directory (alias)" << std::endl;
    std::cout << "  pwd           - Print current working directory" << std::endl;
    std::cout << "  userinfo      - Display user information" << std::endl;
    std::cout << "  clear         - Clear the terminal screen" << std::endl;
    std::cout << std::endl;
}

} // namespace Terminal

