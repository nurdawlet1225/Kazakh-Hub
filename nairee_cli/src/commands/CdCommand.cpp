#include "CdCommand.hpp"
#include <iostream>

namespace Terminal {

bool CdCommand::execute(const ParsedCommand& command, std::shared_ptr<VFS> vfs) {
    std::string path = command.arguments.empty() ? "/" : command.arguments[0];
    
    if (vfs->changeDirectory(path)) {
        return true;
    } else {
        std::cout << "Error: Cannot change to directory '" << path << "'" << std::endl;
        return false;
    }
}

} // namespace Terminal

