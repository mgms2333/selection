#pragma once

#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace services {

class ConfigService {
public:
    // 检查访问权限
    static bool checkAccess(const std::string& employeeNo);
    
    // 获取设备列表
    static json getDevices();
    
    // 获取设备详情
    static json getDeviceDetail(const std::string& deviceId);
    
    // 添加型号槽
    static std::string addModelSlot(const std::string& deviceId, const std::string& modelName);
    
    // 删除型号槽
    static void deleteModelSlot(const std::string& slotId);
    
    // 保存配套关系
    static void saveMappings(const std::string& deviceId, const json& mappings);
};

} // namespace services