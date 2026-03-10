#pragma once

#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace controllers {

class ConfigController {
public:
    // POST /api/config/access-check - 检查配置权限
    static json accessCheck(const json& body);
    
    // GET /api/config/devices - 获取设备列表
    static json devices();
    
    // GET /api/config/devices/:id - 获取设备详情
    static json deviceDetail(const std::string& deviceId);
    
    // POST /api/config/devices/:id/model-slots - 添加型号槽
    static json addModelSlot(const std::string& deviceId, const json& body);
    
    // DELETE /api/config/model-slots/:id - 删除型号槽
    static json deleteModelSlot(const std::string& slotId);
    
    // POST /api/config/devices/:id/save-mapping - 保存配套关系
    static json saveMapping(const std::string& deviceId, const json& body);
};

} // namespace controllers