#include "DirCommand.hpp"
#include <iostream>
#include <iomanip>

namespace Terminal {

bool DirCommand::execute(const ParsedCommand& command, std::shared_ptr<VFS> vfs) {
    std::string path = command.arguments.empty() ? "" : command.arguments[0];
    
    std::vector<std::string> entries = vfs->listDirectory(path);
    
    if (entries.empty()) {
        std::cout << "(empty)" << std::endl;
        return true;
    }
    
    printDirectoryListing(entries, vfs, path);
    return true;
}

void DirCommand::printDirectoryListing(const std::vector<std::string>& entries, 
                                       std::shared_ptr<VFS> vfs, 
                                       const std::string& path) {
    // Get the node to check types
    auto node = path.empty() ? vfs->getCurrentNode() : vfs->resolvePath(path);
    
    if (!node || node->type != NodeType::DIRECTORY) {
        std::cout << "Error: Invalid directory" << std::endl;
        return;
    }
    
    for (const auto& entry : entries) {
        auto it = node->children.find(entry);
        if (it != node->children.end()) {
            if (it->second->type == NodeType::DIRECTORY) {
                std::cout << "[DIR]  " << entry << std::endl;
            } else {
                std::cout << "[FILE] " << entry << std::endl;
            }
        } else {
            std::cout << "       " << entry << std::endl;
        }
    }
}

} // namespace Terminal


