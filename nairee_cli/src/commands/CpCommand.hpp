#ifndef CP_COMMAND_HPP
#define CP_COMMAND_HPP

#include "../CommandParser.hpp"
#include "../VFS.hpp"
#include <memory>

namespace Terminal {

class CpCommand {
public:
    static bool execute(const ParsedCommand& command, std::shared_ptr<VFS> vfs);
};

} // namespace Terminal

#endif // CP_COMMAND_HPP


