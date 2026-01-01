#include "UploadCodeCommand.hpp"
#include <iostream>
#include <fstream>
#include <sstream>
#include <filesystem>
#include <cstdlib>
#include <iomanip>
#include <algorithm>

#ifdef _WIN32
#include <windows.h>
#include <shlwapi.h>
#include <io.h>
#include <process.h>
#pragma comment(lib, "shlwapi.lib")
#else
#include <unistd.h>
#endif

namespace Terminal {

bool UploadCodeCommand::execute(const ParsedCommand& command) {
    if (command.arguments.empty()) {
        std::cout << "Usage: upload <file_path> [options]" << std::endl;
        std::cout << "       Upload a code file to Kazakh Hub" << std::endl;
        std::cout << "\nOptions:" << std::endl;
        std::cout << "  --title <title>        Code title (default: filename)" << std::endl;
        std::cout << "  --author <author>      Author name (required)" << std::endl;
        std::cout << "  --language <lang>      Programming language (auto-detected if not specified)" << std::endl;
        std::cout << "  --description <desc>   Code description" << std::endl;
        std::cout << "\nExample:" << std::endl;
        std::cout << "  upload main.cpp --author \"John Doe\" --title \"My C++ Program\"" << std::endl;
        return false;
    }
    
    std::string filePath = command.arguments[0];
    
    // Parse options
    std::string title;
    std::string author;
    std::string language;
    std::string description;
    
    for (size_t i = 1; i < command.arguments.size(); i++) {
        if (command.arguments[i] == "--title" && i + 1 < command.arguments.size()) {
            title = command.arguments[++i];
        } else if (command.arguments[i] == "--author" && i + 1 < command.arguments.size()) {
            author = command.arguments[++i];
        } else if (command.arguments[i] == "--language" && i + 1 < command.arguments.size()) {
            language = command.arguments[++i];
        } else if (command.arguments[i] == "--description" && i + 1 < command.arguments.size()) {
            description = command.arguments[++i];
        }
    }
    
    // Check if file exists
    if (!std::filesystem::exists(filePath)) {
        std::cout << "Error: File not found: " << filePath << std::endl;
        return false;
    }
    
    // Check if it's a file (not directory)
    if (!std::filesystem::is_regular_file(filePath)) {
        std::cout << "Error: Path is not a file: " << filePath << std::endl;
        return false;
    }
    
    // Author is required
    if (author.empty()) {
        std::cout << "Error: Author is required. Use --author <name>" << std::endl;
        return false;
    }
    
    // Read file content
    std::string content = readFile(filePath);
    if (content.empty() && std::filesystem::file_size(filePath) > 0) {
        std::cout << "Warning: File appears to be empty or binary" << std::endl;
    }
    
    // Auto-detect language if not specified
    if (language.empty()) {
        std::string extension = getFileExtension(filePath);
        language = getLanguageFromExtension(extension);
        if (language.empty()) {
            language = "Text";
        }
    }
    
    // Use filename as title if not specified
    if (title.empty()) {
        title = getFileName(filePath);
    }
    
    // Build JSON payload
    std::ostringstream jsonStream;
    jsonStream << "{";
    jsonStream << "\"title\":\"" << escapeJson(title) << "\",";
    jsonStream << "\"content\":\"" << escapeJson(content) << "\",";
    jsonStream << "\"language\":\"" << escapeJson(language) << "\",";
    jsonStream << "\"author\":\"" << escapeJson(author) << "\"";
    
    if (!description.empty()) {
        jsonStream << ",\"description\":\"" << escapeJson(description) << "\"";
    }
    
    jsonStream << "}";
    
    std::string jsonData = jsonStream.str();
    
    // Send HTTP request
    std::string apiUrl = "http://127.0.0.1:3000/api/codes";
    
    std::cout << "\nUploading code to Kazakh Hub..." << std::endl;
    std::cout << "File: " << filePath << std::endl;
    std::cout << "Title: " << title << std::endl;
    std::cout << "Author: " << author << std::endl;
    std::cout << "Language: " << language << std::endl;
    
    if (sendHttpRequest(apiUrl, jsonData)) {
        std::cout << "\n✓ Code uploaded successfully!" << std::endl;
        std::cout << "  View it at: http://localhost:5173/" << std::endl;
        return true;
    } else {
        std::cout << "\n✗ Failed to upload code" << std::endl;
        std::cout << "  Make sure the backend server is running on http://127.0.0.1:3000" << std::endl;
        return false;
    }
}

std::string UploadCodeCommand::readFile(const std::string& filePath) {
    std::ifstream file(filePath, std::ios::binary);
    if (!file.is_open()) {
        return "";
    }
    
    std::ostringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

std::string UploadCodeCommand::getFileExtension(const std::string& filePath) {
    size_t dotPos = filePath.find_last_of('.');
    if (dotPos == std::string::npos || dotPos == filePath.length() - 1) {
        return "";
    }
    
    std::string extension = filePath.substr(dotPos + 1);
    // Convert to lowercase
    for (char& c : extension) {
        if (c >= 'A' && c <= 'Z') {
            c = c - 'A' + 'a';
        }
    }
    return extension;
}

std::string UploadCodeCommand::getLanguageFromExtension(const std::string& extension) {
    // Common file extensions to language mapping
    if (extension == "cpp" || extension == "cxx" || extension == "cc" || extension == "c++") return "C++";
    if (extension == "c") return "C";
    if (extension == "h" || extension == "hpp" || extension == "hxx") return "C/C++ Header";
    if (extension == "java") return "Java";
    if (extension == "py") return "Python";
    if (extension == "js") return "JavaScript";
    if (extension == "ts") return "TypeScript";
    if (extension == "html" || extension == "htm") return "HTML";
    if (extension == "css") return "CSS";
    if (extension == "json") return "JSON";
    if (extension == "xml") return "XML";
    if (extension == "sql") return "SQL";
    if (extension == "sh" || extension == "bash") return "Shell";
    if (extension == "ps1") return "PowerShell";
    if (extension == "bat" || extension == "cmd") return "Batch";
    if (extension == "rs") return "Rust";
    if (extension == "go") return "Go";
    if (extension == "rb") return "Ruby";
    if (extension == "php") return "PHP";
    if (extension == "swift") return "Swift";
    if (extension == "kt") return "Kotlin";
    if (extension == "scala") return "Scala";
    if (extension == "r") return "R";
    if (extension == "md" || extension == "markdown") return "Markdown";
    if (extension == "txt") return "Text";
    
    return "";
}

std::string UploadCodeCommand::escapeJson(const std::string& str) {
    std::ostringstream escaped;
    for (char c : str) {
        switch (c) {
            case '"': escaped << "\\\""; break;
            case '\\': escaped << "\\\\"; break;
            case '\b': escaped << "\\b"; break;
            case '\f': escaped << "\\f"; break;
            case '\n': escaped << "\\n"; break;
            case '\r': escaped << "\\r"; break;
            case '\t': escaped << "\\t"; break;
            default:
                if (c >= 0 && c < 32) {
                    // Control characters
                    escaped << "\\u" << std::hex << std::setw(4) << std::setfill('0') << (int)c;
                } else {
                    escaped << c;
                }
                break;
        }
    }
    return escaped.str();
}

std::string UploadCodeCommand::getFileName(const std::string& filePath) {
    size_t slashPos = filePath.find_last_of("/\\");
    if (slashPos == std::string::npos) {
        return filePath;
    }
    return filePath.substr(slashPos + 1);
}

bool UploadCodeCommand::sendHttpRequest(const std::string& url, const std::string& jsonData) {
    // Use curl command-line tool if available
    // This is a simple approach that works on Windows, Linux, and macOS
    
    // Create a temporary file for JSON data
    std::filesystem::path tempDir = std::filesystem::temp_directory_path();
    std::filesystem::path tempFile = tempDir / "kazakh_hub_upload.json";
    
    std::ofstream tempStream(tempFile);
    if (!tempStream.is_open()) {
        std::cout << "Error: Cannot create temporary file" << std::endl;
        return false;
    }
    tempStream << jsonData;
    tempStream.close();
    
    std::string tempFilePath = tempFile.string();
    
    // Build curl command
    std::ostringstream curlCmd;
    
    #ifdef _WIN32
    curlCmd << "curl.exe -X POST \"" << url << "\" ";
    curlCmd << "-H \"Content-Type: application/json\" ";
    curlCmd << "--data-binary \"@" << tempFilePath << "\" ";
    curlCmd << "-s -w \"\\nHTTP_CODE:%{http_code}\"";
    #else
    curlCmd << "curl -X POST \"" << url << "\" ";
    curlCmd << "-H \"Content-Type: application/json\" ";
    curlCmd << "--data-binary \"@" << tempFilePath << "\" ";
    curlCmd << "-s -w \"\\nHTTP_CODE:%{http_code}\"";
    #endif
    
    // Execute curl command
    #ifdef _WIN32
    FILE* pipe = _popen(curlCmd.str().c_str(), "r");
    #else
    FILE* pipe = popen(curlCmd.str().c_str(), "r");
    #endif
    
    if (!pipe) {
        std::cout << "Error: curl command not found. Please install curl." << std::endl;
        std::cout << "  Windows: Download from https://curl.se/windows/" << std::endl;
        std::cout << "  Linux: sudo apt-get install curl" << std::endl;
        std::cout << "  macOS: curl is pre-installed" << std::endl;
        std::filesystem::remove(tempFilePath);
        return false;
    }
    
    // Read response
    char buffer[128];
    std::string response;
    while (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
        response += buffer;
    }
    
    #ifdef _WIN32
    int exitCode = _pclose(pipe);
    #else
    int exitCode = pclose(pipe);
    #endif
    
    // Clean up temp file
    std::filesystem::remove(tempFilePath);
    
    // Check HTTP status code
    size_t codePos = response.find("HTTP_CODE:");
    if (codePos != std::string::npos) {
        std::string httpCode = response.substr(codePos + 9);
        // Remove newline
        httpCode.erase(std::remove(httpCode.begin(), httpCode.end(), '\n'), httpCode.end());
        httpCode.erase(std::remove(httpCode.begin(), httpCode.end(), '\r'), httpCode.end());
        
        int statusCode = std::stoi(httpCode);
        if (statusCode >= 200 && statusCode < 300) {
            // Remove HTTP_CODE line from response
            response = response.substr(0, codePos);
            if (!response.empty() && response.find("\"id\"") != std::string::npos) {
                std::cout << "\nResponse: " << response << std::endl;
            }
            return true;
        } else {
            std::cout << "Error: HTTP " << statusCode << std::endl;
            if (!response.empty()) {
                std::cout << "Response: " << response.substr(0, codePos) << std::endl;
            }
            return false;
        }
    }
    
    if (exitCode != 0) {
        std::cout << "Error: curl command failed" << std::endl;
        return false;
    }
    
    return true;
}

} // namespace Terminal

