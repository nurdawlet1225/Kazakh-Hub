#include "CommandParser.hpp"
#include <sstream>
#include <algorithm>
#include <cctype>

namespace Terminal {

CommandParser::CommandParser() = default;
CommandParser::~CommandParser() = default;

std::string CommandParser::trim(const std::string& str) {
    size_t first = str.find_first_not_of(" \t\n\r");
    if (first == std::string::npos) return "";
    
    size_t last = str.find_last_not_of(" \t\n\r");
    return str.substr(first, (last - first + 1));
}

bool CommandParser::isWhitespace(char c) {
    return std::isspace(static_cast<unsigned char>(c));
}

std::vector<std::string> CommandParser::tokenize(const std::string& input) {
    std::vector<std::string> tokens;
    std::string trimmed = trim(input);
    
    if (trimmed.empty()) {
        return tokens;
    }
    
    std::istringstream iss(trimmed);
    std::string token;
    bool inQuotes = false;
    std::string currentToken;
    
    for (size_t i = 0; i < trimmed.length(); ++i) {
        char c = trimmed[i];
        
        if (c == '"') {
            inQuotes = !inQuotes;
            if (!inQuotes && !currentToken.empty()) {
                tokens.push_back(currentToken);
                currentToken.clear();
            }
        } else if (inQuotes) {
            currentToken += c;
        } else if (isWhitespace(c)) {
            if (!currentToken.empty()) {
                tokens.push_back(currentToken);
                currentToken.clear();
            }
        } else {
            currentToken += c;
        }
    }
    
    if (!currentToken.empty()) {
        tokens.push_back(currentToken);
    }
    
    return tokens;
}

ParsedCommand CommandParser::parse(const std::string& input) {
    ParsedCommand parsed;
    parsed.rawInput = input;
    
    std::vector<std::string> tokens = tokenize(input);
    
    if (tokens.empty()) {
        return parsed;
    }
    
    parsed.command = tokens[0];
    std::transform(parsed.command.begin(), parsed.command.end(), 
                   parsed.command.begin(), ::tolower);
    
    if (tokens.size() > 1) {
        parsed.arguments.assign(tokens.begin() + 1, tokens.end());
    }
    
    return parsed;
}

} // namespace Terminal

