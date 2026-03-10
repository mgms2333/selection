#pragma once

#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace controllers {

class SessionController {
public:
    // POST /api/session/start - 创建选型会话
    static json start(const json& body);
    
    // POST /api/session/:id/select - 保存选型步骤
    static json select(const std::string& sessionId, const json& body);
    
    // GET /api/session/:id/summary - 获取选型汇总
    static json summary(const std::string& sessionId);
    
    // POST /api/session/:id/confirm - 确认提交
    static json confirm(const std::string& sessionId);
};

} // namespace controllers