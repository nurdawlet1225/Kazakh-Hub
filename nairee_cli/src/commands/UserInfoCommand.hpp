#ifndef USERINFO_COMMAND_HPP
#define USERINFO_COMMAND_HPP

#include "../CommandParser.hpp"

namespace Terminal {

class UserInfoCommand {
public:
    static bool execute(const ParsedCommand& command);
};

} // namespace Terminal

#endif // USERINFO_COMMAND_HPP

