#ifndef LS_COMMAND_HPP
#define LS_COMMAND_HPP

#include "../CommandParser.hpp"
#include "../VFS.hpp"
#include <memory>

namespace Terminal {

class LsCommand {
public:
    static bool execute(const ParsedCommand& command, std::shared_ptr<VFS> vfs);
    
private:
    static void printDirectoryListing(const std::vector<std::string>& entries, 
                                     std::shared_ptr<VFS> vfs, 
                                     const std::string& path);
};

} // namespace Terminal

#endif // LS_COMMAND_HPP

