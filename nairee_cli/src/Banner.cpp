#include "Banner.hpp"
#include <iostream>
#include <iomanip>

namespace Terminal {

void Banner::display() {
    std::cout << "\n";
    std::cout << "================================================================\n";
    std::cout << "                                                                \n";
    std::cout << "     _   _  ____  _   _ _   _  ____  _   _  ____              \n";
    std::cout << "    | \\ | ||  _ \\| \\ | | | | |/ ___|| | | |/ ___|             \n";
    std::cout << "    |  \\| || | | |  \\| | | | |\\___ \\| | | |\\___ \\             \n";
    std::cout << "    | |\\  || |_| | |\\  | |_| | ___) | |_| | ___) |            \n";
    std::cout << "    |_| \\_||____/|_| \\_|\\___/ |____/ \\___/ |____/             \n";
    std::cout << "                                                                \n";
    std::cout << "                    ____   ____                                \n";
    std::cout << "                   / __ \\ / ___|                              \n";
    std::cout << "                  | |  | |\\___ \\                              \n";
    std::cout << "                  | |__| | ___) |                             \n";
    std::cout << "                   \\____/ |____/                              \n";
    std::cout << "                                                                \n";
    std::cout << "        --- Байланыс, Cyber Hub Vibe ---                      \n";
    std::cout << "                                                                \n";
    std::cout << "              Terminal Interface v1.0                          \n";
    std::cout << "                                                                \n";
    std::cout << "================================================================\n";
    std::cout << "\n";
    std::cout << "  [*] System initialized...\n";
    std::cout << "  [*] Virtual File System ready\n";
    std::cout << "  [*] Command processor online\n";
    std::cout << "  [*] Connection established\n";
    std::cout << "\n";
    std::cout << "  Type 'help' for available commands or 'exit' to quit.\n";
    std::cout << "\n";
}

} // namespace Terminal

