#include "CpCommand.hpp"
#include <iostream>

namespace Terminal {

bool CpCommand::execute(const ParsedCommand& command, std::shared_ptr<VFS> vfs) {
    if (command.arguments.size() < 2) {
        std::cout << "Usage: cp <source> <destination>" << std::endl;
        std::cout << "       Copy a file or directory to another location." << std::endl;
        return false;
    }
    
    std::string source = command.arguments[0];
    std::string destination = command.arguments[1];
    
    if (vfs->copyNode(source, destination)) {
        std::cout << "Copied: " << source << " -> " << destination << std::endl;
        return true;
    } else {
        std::cout << "Error: Cannot copy '" << source << "' to '" << destination << "'" << std::endl;
        std::cout << "       Source may not exist or destination already exists." << std::endl;
        return false;
    }
}

} // namespace Terminal


