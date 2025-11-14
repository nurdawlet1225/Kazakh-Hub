#ifndef TERMINAL_HPP
#define TERMINAL_HPP

#include "CommandParser.hpp"
#include "CommandExecutor.hpp"
#include "VFS.hpp"
#include <string>
#include <memory>

namespace Terminal {

class Terminal {
public:
    Terminal();
    ~Terminal();
    
    void run();
    void processInput(const std::string& input);
    void displayPrompt() const;
    
    bool isRunning() const { return running_; }
    void exit() { running_ = false; }

private:
    std::shared_ptr<VFS> vfs_;
    std::unique_ptr<CommandParser> parser_;
    std::unique_ptr<CommandExecutor> executor_;
    bool running_;
    
    void initialize();
};

} // namespace Terminal

#endif // TERMINAL_HPP

