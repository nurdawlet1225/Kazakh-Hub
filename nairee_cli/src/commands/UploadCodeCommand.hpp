#ifndef UPLOAD_CODE_COMMAND_HPP
#define UPLOAD_CODE_COMMAND_HPP

#include "../CommandParser.hpp"
#include <string>

namespace Terminal {

class UploadCodeCommand {
public:
    static bool execute(const ParsedCommand& command);
    
private:
    static std::string readFile(const std::string& filePath);
    static std::string getFileExtension(const std::string& filePath);
    static std::string getLanguageFromExtension(const std::string& extension);
    static std::string escapeJson(const std::string& str);
    static bool sendHttpRequest(const std::string& url, const std::string& jsonData);
    static std::string getFileName(const std::string& filePath);
};

} // namespace Terminal

#endif // UPLOAD_CODE_COMMAND_HPP










