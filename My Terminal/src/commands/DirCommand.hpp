#ifndef DIR_COMMAND_HPP
#define DIR_COMMAND_HPP

#include "../CommandParser.hpp"
#include "../VFS.hpp"
#include <memory>

namespace Terminal {

class DirCommand {
public:
    static bool execute(const ParsedCommand& command, std::shared_ptr<VFS> vfs);
    
private:
    static void printDirectoryListing(const std::vector<std::string>& entries, 
                                     std::shared_ptr<VFS> vfs, 
                                     const std::string& path);
};

} // namespace Terminal

#endif // DIR_COMMAND_HPP


