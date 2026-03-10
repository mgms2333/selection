#pragma once

#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace dao {

class ConfigDao {
public:
    // 检查管理员白名单
    static bool isAdminWhitelisted(const std::string& employeeNo);
    
    // 获取所有设备
    static json getAllDevices();
    
    // 获取设备详情
    static json getDeviceById(const std::string& deviceId);
    
    // 获取型号槽
    static json getModelSlots(const std::string& deviceId);
    
    // 获取配套零件
    static json getAccessories(const std::string& deviceId);
    
    // 创建型号槽
    static std::string createModelSlot(const std::string& deviceId, const std::string& modelName);
    
    // 删除型号槽
    static void deleteModelSlot(const std::string& slotId);
    
    // 保存配套关系
    static void saveMappings(const std::string& deviceId, const json& mappings);
};

} // namespace dao