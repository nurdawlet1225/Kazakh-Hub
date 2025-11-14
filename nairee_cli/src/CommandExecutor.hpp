#ifndef COMMAND_EXECUTOR_HPP
#define COMMAND_EXECUTOR_HPP

#include "CommandParser.hpp"
#include "VFS.hpp"
#include <string>
#include <memory>
#include <map>
#include <functional>

namespace Terminal {

class CommandExecutor {
public:
    CommandExecutor(std::shared_ptr<VFS> vfs);
    ~CommandExecutor();
    
    bool execute(const ParsedCommand& command);
    void registerCommand(const std::string& name, 
                        std::function<bool(const ParsedCommand&)> handler);
    
    std::shared_ptr<VFS> getVFS() const { return vfs_; }

private:
    std::shared_ptr<VFS> vfs_;
    std::map<std::string, std::function<bool(const ParsedCommand&)>> commands_;
    
    void initializeCommands();
};

} // namespace Terminal

#endif // COMMAND_EXECUTOR_HPP

