#pragma once

#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace services {

class SessionService {
public:
    // 创建选型会话
    static std::string createSession(const std::string& employeeNo, const std::string& employeeName);
    
    // 检查会话是否存在
    static bool sessionExists(const std::string& sessionId);
    
    // 保存选型步骤
    static void saveSelection(const std::string& sessionId, const std::string& categoryId, 
                              const std::string& optionId, int stepNo);
    
    // 获取汇总
    static json getSummary(const std::string& sessionId);
    
    // 确认会话
    static void confirmSession(const std::string& sessionId);
    
    // 获取结果快照
    static json getResultSnapshot(const std::string& sessionId);
};

} // namespace services