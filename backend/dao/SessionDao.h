#pragma once

#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace dao {

class SessionDao {
public:
    // 创建会话
    static void create(const std::string& id, const std::string& employeeNo, 
                       const std::string& employeeName, const std::string& startedAt);
    
    // 检查会话是否存在
    static bool exists(const std::string& id);
    
    // 获取会话
    static json getById(const std::string& id);
    
    // 更新状态
    static void updateStatus(const std::string& id, const std::string& status, const std::string& submittedAt);
    
    // 保存选型
    static void saveSelection(const std::string& sessionId, const std::string& categoryId,
                              const std::string& optionId, int stepNo);
    
    // 获取选型列表
    static json getSelections(const std::string& sessionId);
    
    // 获取快照
    static json getSnapshot(const std::string& sessionId);
};

} // namespace dao