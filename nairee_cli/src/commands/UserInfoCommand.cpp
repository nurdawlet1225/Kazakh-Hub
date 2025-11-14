#include "UserInfoCommand.hpp"
#include <iostream>
#include <ctime>
#include <iomanip>
#include <sstream>

#ifdef _WIN32
#include <windows.h>
#else
#include <unistd.h>
#include <pwd.h>
#endif

namespace Terminal {

bool UserInfoCommand::execute(const ParsedCommand& command) {
    std::cout << "\n=== User Information ===" << std::endl;
    
    // Get username
    #ifdef _WIN32
    char username[256];
    DWORD size = sizeof(username);
    if (GetUserNameA(username, &size)) {
        std::cout << "Username: " << username << std::endl;
    } else {
        std::cout << "Username: (unknown)" << std::endl;
    }
    
    // Get computer name
    char computerName[256];
    size = sizeof(computerName);
    if (GetComputerNameA(computerName, &size)) {
        std::cout << "Computer: " << computerName << std::endl;
    }
    #else
    struct passwd* pw = getpwuid(getuid());
    if (pw) {
        std::cout << "Username: " << pw->pw_name << std::endl;
        std::cout << "Home Directory: " << pw->pw_dir << std::endl;
    }
    
    char hostname[256];
    if (gethostname(hostname, sizeof(hostname)) == 0) {
        std::cout << "Hostname: " << hostname << std::endl;
    }
    #endif
    
    // Get current time
    auto now = std::time(nullptr);
    auto* timeinfo = std::localtime(&now);
    std::cout << "Current Time: " << std::put_time(timeinfo, "%Y-%m-%d %H:%M:%S") << std::endl;
    
    std::cout << "======================\n" << std::endl;
    
    return true;
}

} // namespace Terminal

