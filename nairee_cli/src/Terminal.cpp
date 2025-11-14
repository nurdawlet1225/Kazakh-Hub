#include "Terminal.hpp"
#include <iostream>
#include <string>

#ifdef _WIN32
#include <conio.h>
#include <windows.h>
#endif

namespace Terminal {

Terminal::Terminal() : running_(true) {
    initialize();
}

Terminal::~Terminal() = default;

void Terminal::initialize() {
    vfs_ = std::make_shared<VFS>();
    parser_ = std::make_unique<CommandParser>();
    executor_ = std::make_unique<CommandExecutor>(vfs_);
}

void Terminal::displayPrompt() const {
    std::cout << "\033[0;36m"; // Cyan color
    std::cout << "N3XUS";
    std::cout << "\033[0m"; // Reset color
    std::cout << "::";
    std::cout << "\033[0;32m"; // Green color
    std::cout << vfs_->getCurrentPath();
    std::cout << "\033[0m"; // Reset color
    std::cout << " $ ";
    std::cout.flush();
}

void Terminal::processInput(const std::string& input) {
    if (input.empty()) {
        return;
    }
    
    ParsedCommand command = parser_->parse(input);
    executor_->execute(command);
}

#ifdef _WIN32
std::string readLineWithEsc() {
    std::string line;
    int ch;
    
    while (true) {
        ch = _getch();
        
        // ESC key (ASCII 27)
        if (ch == 27) {
            return "\x1B"; // Return ESC character
        }
        
        // Enter key
        if (ch == '\r' || ch == '\n') {
            std::cout << std::endl;
            break;
        }
        
        // Backspace
        if (ch == '\b' || ch == 127) {
            if (!line.empty()) {
                line.pop_back();
                std::cout << "\b \b";
            }
        } 
        // Ctrl+C - ignore or handle separately if needed
        else if (ch == 3) {
            // Ctrl+C - can be ignored or handled
            continue;
        }
        // Printable character
        else if (ch >= 32 && ch < 127) {
            line += static_cast<char>(ch);
            std::cout << static_cast<char>(ch);
        }
    }
    
    return line;
}
#endif

void Terminal::run() {
    std::string input;
    
    while (running_) {
        displayPrompt();
        
#ifdef _WIN32
        input = readLineWithEsc();
        
        // Check if ESC was pressed
        if (input == "\x1B") {
            std::cout << "\n";
            std::cout << "  [*] ESC pressed - Exiting terminal...\n";
            break;
        }
#else
        if (!std::getline(std::cin, input)) {
            // EOF or error
            break;
        }
        
        // Check if input is ESC sequence
        if (input.length() == 1 && static_cast<unsigned char>(input[0]) == 27) {
            std::cout << "\n";
            std::cout << "  [*] ESC pressed - Exiting terminal...\n";
            break;
        }
#endif
        
        processInput(input);
    }
    
    std::cout << "\n";
    std::cout << "  [*] Terminating connection...\n";
    std::cout << "  [*] N3XUS-OS session ended\n";
    std::cout << "  Goodbye!\n";
    std::cout << "\n";
}

} // namespace Terminal

