#include "MkdirCommand.hpp"
#include <iostream>

namespace Terminal {

bool MkdirCommand::execute(const ParsedCommand& command, std::shared_ptr<VFS> vfs) {
    if (command.arguments.empty()) {
        std::cout << "Usage: mkdir <directory_name>" << std::endl;
        return false;
    }
    
    std::string dirName = command.arguments[0];
    
    if (vfs->createDirectory(dirName)) {
        std::cout << "Directory created: " << dirName << std::endl;
        return true;
    } else {
        std::cout << "Error: Cannot create directory '" << dirName << "'" << std::endl;
        std::cout << "       Directory may already exist or path is invalid." << std::endl;
        return false;
    }
}

} // namespace Terminal

