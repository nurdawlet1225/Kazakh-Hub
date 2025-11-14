#ifndef COMMAND_PARSER_HPP
#define COMMAND_PARSER_HPP

#include <string>
#include <vector>

namespace Terminal {

struct ParsedCommand {
    std::string command;
    std::vector<std::string> arguments;
    std::string rawInput;
    
    ParsedCommand() = default;
    ParsedCommand(const std::string& cmd, const std::vector<std::string>& args, const std::string& raw)
        : command(cmd), arguments(args), rawInput(raw) {}
};

class CommandParser {
public:
    CommandParser();
    ~CommandParser();
    
    ParsedCommand parse(const std::string& input);
    
    static std::vector<std::string> tokenize(const std::string& input);
    static std::string trim(const std::string& str);

private:
    static bool isWhitespace(char c);
};

} // namespace Terminal

#endif // COMMAND_PARSER_HPP

