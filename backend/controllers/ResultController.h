#pragma once

#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace controllers {

class ResultController {
public:
    // GET /api/result/:sessionId - 获取选型结果
    static json getResult(const std::string& sessionId);
};

} // namespace controllers