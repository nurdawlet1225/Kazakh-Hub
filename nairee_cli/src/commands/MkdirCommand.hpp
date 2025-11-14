#ifndef MKDIR_COMMAND_HPP
#define MKDIR_COMMAND_HPP

#include "../CommandParser.hpp"
#include "../VFS.hpp"
#include <memory>

namespace Terminal {

class MkdirCommand {
public:
    static bool execute(const ParsedCommand& command, std::shared_ptr<VFS> vfs);
};

} // namespace Terminal

#endif // MKDIR_COMMAND_HPP

