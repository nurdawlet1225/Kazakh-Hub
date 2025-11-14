#include "VFS.hpp"
#include <algorithm>
#include <sstream>

namespace Terminal {

VFS::VFS() {
    root_ = std::make_shared<VFSNode>("/", NodeType::DIRECTORY);
    root_->parent = root_; // Root's parent is itself
    current_ = root_;
}

VFS::~VFS() = default;

std::string VFS::getCurrentPath() const {
    if (current_ == root_) {
        return "/";
    }
    
    std::vector<std::string> pathParts;
    auto node = current_;
    
    while (node != root_) {
        pathParts.push_back(node->name);
        auto parent = node->parent.lock();
        if (!parent || parent == node) break;
        node = parent;
    }
    
    std::reverse(pathParts.begin(), pathParts.end());
    std::ostringstream oss;
    oss << "/";
    for (size_t i = 0; i < pathParts.size(); ++i) {
        if (i > 0) oss << "/";
        oss << pathParts[i];
    }
    return oss.str();
}

std::vector<std::string> VFS::splitPath(const std::string& path) const {
    std::vector<std::string> parts;
    std::string current;
    
    for (char c : path) {
        if (c == '/') {
            if (!current.empty()) {
                parts.push_back(current);
                current.clear();
            }
        } else {
            current += c;
        }
    }
    
    if (!current.empty()) {
        parts.push_back(current);
    }
    
    return parts;
}

std::string VFS::normalizePath(const std::string& path) const {
    if (path.empty()) return getCurrentPath();
    if (path[0] == '/') return path; // Absolute path
    
    // Relative path
    std::string currentPath = getCurrentPath();
    if (currentPath == "/") {
        return "/" + path;
    }
    return currentPath + "/" + path;
}

std::shared_ptr<VFSNode> VFS::findNode(const std::vector<std::string>& pathParts) const {
    auto node = (pathParts.empty() || pathParts[0].empty()) ? current_ : root_;
    
    for (const auto& part : pathParts) {
        if (part.empty() || part == ".") continue;
        if (part == "..") {
            auto parent = node->parent.lock();
            if (parent && parent != node) {
                node = parent;
            }
            continue;
        }
        
        auto it = node->children.find(part);
        if (it == node->children.end()) {
            return nullptr;
        }
        node = it->second;
    }
    
    return node;
}

std::shared_ptr<VFSNode> VFS::resolvePath(const std::string& path) const {
    std::vector<std::string> parts = splitPath(path);
    return findNode(parts);
}

bool VFS::changeDirectory(const std::string& path) {
    if (path.empty()) {
        current_ = root_;
        return true;
    }
    
    std::vector<std::string> parts = splitPath(path);
    auto node = findNode(parts);
    
    if (node && node->type == NodeType::DIRECTORY) {
        current_ = node;
        return true;
    }
    
    return false;
}

bool VFS::createDirectory(const std::string& path) {
    std::vector<std::string> parts = splitPath(path);
    if (parts.empty()) return false;
    
    auto node = (parts[0].empty()) ? root_ : current_;
    std::string dirName = parts.back();
    parts.pop_back();
    
    // Navigate to parent directory
    if (!parts.empty()) {
        node = findNode(parts);
        if (!node || node->type != NodeType::DIRECTORY) {
            return false;
        }
    }
    
    // Check if already exists
    if (node->children.find(dirName) != node->children.end()) {
        return false;
    }
    
    // Create new directory
    auto newDir = std::make_shared<VFSNode>(dirName, NodeType::DIRECTORY);
    newDir->parent = node;
    node->children[dirName] = newDir;
    
    return true;
}

bool VFS::createFile(const std::string& path) {
    std::vector<std::string> parts = splitPath(path);
    if (parts.empty()) return false;
    
    auto node = (parts[0].empty()) ? root_ : current_;
    std::string fileName = parts.back();
    parts.pop_back();
    
    // Navigate to parent directory
    if (!parts.empty()) {
        node = findNode(parts);
        if (!node || node->type != NodeType::DIRECTORY) {
            return false;
        }
    }
    
    // Check if already exists
    if (node->children.find(fileName) != node->children.end()) {
        return false;
    }
    
    // Create new file
    auto newFile = std::make_shared<VFSNode>(fileName, NodeType::FILE);
    newFile->parent = node;
    node->children[fileName] = newFile;
    
    return true;
}

bool VFS::removeNode(const std::string& path) {
    std::vector<std::string> parts = splitPath(path);
    if (parts.empty()) return false;
    
    auto node = (parts[0].empty()) ? root_ : current_;
    std::string nodeName = parts.back();
    parts.pop_back();
    
    // Navigate to parent directory
    if (!parts.empty()) {
        node = findNode(parts);
        if (!node || node->type != NodeType::DIRECTORY) {
            return false;
        }
    }
    
    // Cannot remove root
    if (node == root_ && nodeName.empty()) {
        return false;
    }
    
    auto it = node->children.find(nodeName);
    if (it == node->children.end()) {
        return false;
    }
    
    // Cannot remove current directory
    if (it->second == current_) {
        return false;
    }
    
    node->children.erase(it);
    return true;
}

std::vector<std::string> VFS::listDirectory(const std::string& path) const {
    std::vector<std::string> result;
    
    std::shared_ptr<VFSNode> node;
    if (path.empty()) {
        node = current_;
    } else {
        std::vector<std::string> parts = splitPath(path);
        node = findNode(parts);
    }
    
    if (!node || node->type != NodeType::DIRECTORY) {
        return result;
    }
    
    for (const auto& [name, child] : node->children) {
        result.push_back(name);
    }
    
    std::sort(result.begin(), result.end());
    return result;
}

std::shared_ptr<VFSNode> VFS::getCurrentNode() const {
    return current_;
}

namespace {
    std::shared_ptr<VFSNode> copyNodeRecursive(std::shared_ptr<VFSNode> source) {
    auto newNode = std::make_shared<VFSNode>(source->name, source->type);
    
    if (source->type == NodeType::DIRECTORY) {
        for (const auto& [name, child] : source->children) {
            auto childCopy = copyNodeRecursive(child);
            childCopy->parent = newNode;
            newNode->children[name] = childCopy;
        }
    }
    
    return newNode;
    }
} // anonymous namespace

bool VFS::copyNode(const std::string& source, const std::string& destination) {
    // Resolve source node
    std::vector<std::string> sourceParts = splitPath(source);
    auto sourceNode = findNode(sourceParts);
    
    if (!sourceNode) {
        return false;
    }
    
    // Resolve destination parent directory
    std::vector<std::string> destParts = splitPath(destination);
    if (destParts.empty()) {
        return false;
    }
    
    auto destParent = (destParts[0].empty()) ? root_ : current_;
    std::string destName = destParts.back();
    destParts.pop_back();
    
    // Navigate to destination parent
    if (!destParts.empty()) {
        destParent = findNode(destParts);
        if (!destParent || destParent->type != NodeType::DIRECTORY) {
            return false;
        }
    }
    
    // Check if destination already exists
    if (destParent->children.find(destName) != destParent->children.end()) {
        return false;
    }
    
    // Recursively copy the node
    auto newNode = copyNodeRecursive(sourceNode);
    newNode->name = destName;
    newNode->parent = destParent;
    
    destParent->children[destName] = newNode;
    return true;
}

} // namespace Terminal

