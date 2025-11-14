#ifndef HELP_COMMAND_HPP
#define HELP_COMMAND_HPP

#include "../CommandParser.hpp"
#include "../CommandExecutor.hpp"

namespace Terminal {

class HelpCommand {
public:
    static bool execute(const ParsedCommand& command, CommandExecutor& executor);
    
private:
    static void printHelp();
};

} // namespace Terminal

#endif // HELP_COMMAND_HPP

