#ifndef VFS_HPP
#define VFS_HPP

#include <string>
#include <vector>
#include <memory>
#include <map>

namespace Terminal {

enum class NodeType {
    DIRECTORY,
    FILE
};

struct VFSNode {
    std::string name;
    NodeType type;
    std::map<std::string, std::shared_ptr<VFSNode>> children;
    std::weak_ptr<VFSNode> parent;
    
    VFSNode(const std::string& name, NodeType type) 
        : name(name), type(type) {}
};

class VFS {
public:
    VFS();
    ~VFS();
    
    // Navigation
    std::string getCurrentPath() const;
    bool changeDirectory(const std::string& path);
    std::shared_ptr<VFSNode> getCurrentNode() const;
    
    // Directory operations
    bool createDirectory(const std::string& path);
    bool createFile(const std::string& path);
    bool removeNode(const std::string& path);
    bool copyNode(const std::string& source, const std::string& destination);
    
    // Listing
    std::vector<std::string> listDirectory(const std::string& path = "") const;
    
    // Path utilities
    std::string normalizePath(const std::string& path) const;
    std::shared_ptr<VFSNode> resolvePath(const std::string& path) const;
    
    // Root access
    std::shared_ptr<VFSNode> getRoot() const { return root_; }

private:
    std::shared_ptr<VFSNode> root_;
    std::shared_ptr<VFSNode> current_;
    
    std::vector<std::string> splitPath(const std::string& path) const;
    std::shared_ptr<VFSNode> findNode(const std::vector<std::string>& pathParts) const;
};

} // namespace Terminal

#endif // VFS_HPP

