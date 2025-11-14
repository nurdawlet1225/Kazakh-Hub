#ifndef CD_COMMAND_HPP
#define CD_COMMAND_HPP

#include "../CommandParser.hpp"
#include "../VFS.hpp"
#include <memory>

namespace Terminal {

class CdCommand {
public:
    static bool execute(const ParsedCommand& command, std::shared_ptr<VFS> vfs);
};

} // namespace Terminal

#endif // CD_COMMAND_HPP

