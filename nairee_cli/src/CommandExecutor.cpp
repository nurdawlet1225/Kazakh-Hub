#include "CommandExecutor.hpp"
#include "commands/HelpCommand.hpp"
#include "commands/LsCommand.hpp"
#include "commands/DirCommand.hpp"
#include "commands/CdCommand.hpp"
#include "commands/MkdirCommand.hpp"
#include "commands/CpCommand.hpp"
#include "commands/UserInfoCommand.hpp"
#include <iostream>

namespace Terminal {

CommandExecutor::CommandExecutor(std::shared_ptr<VFS> vfs) : vfs_(vfs) {
    initializeCommands();
}

CommandExecutor::~CommandExecutor() = default;

void CommandExecutor::initializeCommands() {
    // Register built-in commands
    registerCommand("help", [this](const ParsedCommand& cmd) {
        return HelpCommand::execute(cmd, *this);
    });
    
    registerCommand("ls", [this](const ParsedCommand& cmd) {
        return LsCommand::execute(cmd, vfs_);
    });
    
    registerCommand("dir", [this](const ParsedCommand& cmd) {
        return DirCommand::execute(cmd, vfs_);
    });
    
    registerCommand("cd", [this](const ParsedCommand& cmd) {
        return CdCommand::execute(cmd, vfs_);
    });
    
    registerCommand("mkdir", [this](const ParsedCommand& cmd) {
        return MkdirCommand::execute(cmd, vfs_);
    });
    
    registerCommand("cp", [this](const ParsedCommand& cmd) {
        return CpCommand::execute(cmd, vfs_);
    });
    
    registerCommand("copy", [this](const ParsedCommand& cmd) {
        return CpCommand::execute(cmd, vfs_);
    });
    
    registerCommand("userinfo", [this](const ParsedCommand& cmd) {
        return UserInfoCommand::execute(cmd);
    });
    
    registerCommand("pwd", [this](const ParsedCommand& cmd) {
        std::cout << vfs_->getCurrentPath() << std::endl;
        return true;
    });
    
    registerCommand("clear", [this](const ParsedCommand& cmd) {
        #ifdef _WIN32
        system("cls");
        #else
        system("clear");
        #endif
        return true;
    });
}

void CommandExecutor::registerCommand(const std::string& name, 
                                     std::function<bool(const ParsedCommand&)> handler) {
    commands_[name] = handler;
}

bool CommandExecutor::execute(const ParsedCommand& command) {
    if (command.command.empty()) {
        return true; // Empty command, just return
    }
    
    auto it = commands_.find(command.command);
    if (it == commands_.end()) {
        std::cout << "Command not found: " << command.command << std::endl;
        std::cout << "Type 'help' for a list of available commands." << std::endl;
        return false;
    }
    
    return it->second(command);
}

} // namespace Terminal

