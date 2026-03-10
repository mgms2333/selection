#include "ConfigDao.h"
#include "../utils/DbUtil.h"
#include <iostream>

namespace dao {

bool ConfigDao::isAdminWhitelisted(const std::string& employeeNo) {
    auto conn = DbUtil::getConnection();
    std::string sql = "SELECT id FROM admin_whitelist WHERE employee_no = '" + employeeNo + "'";
    PGresult* res = PQexec(conn, sql.c_str());
    bool found = PQntuples(res) > 0;
    PQclear(res);
    return found;
}

json ConfigDao::getAllDevices() {
    auto conn = DbUtil::getConnection();
    std::string sql = "SELECT * FROM configurable_device ORDER BY device_code";
    PGresult* res = PQexec(conn, sql.c_str());
    
    json result = json::array();
    for (int i = 0; i < PQntuples(res); i++) {
        result.push_back({
            {"id", PQgetvalue(res, i, 0)},
            {"device_code", PQgetvalue(res, i, 1)},
            {"device_name", PQgetvalue(res, i, 2)}
        });
    }
    PQclear(res);
    return result;
}

json ConfigDao::getDeviceById(const std::string& deviceId) {
    auto conn = DbUtil::getConnection();
    std::string sql = "SELECT * FROM configurable_device WHERE id = '" + deviceId + "'";
    PGresult* res = PQexec(conn, sql.c_str());
    
    json result;
    if (PQntuples(res) > 0) {
        result = {
            {"id", PQgetvalue(res, 0, 0)},
            {"device_code", PQgetvalue(res, 0, 1)},
            {"device_name", PQgetvalue(res, 0, 2)}
        };
    }
    PQclear(res);
    return result;
}

json ConfigDao::getModelSlots(const std::string& deviceId) {
    auto conn = DbUtil::getConnection();
    std::string sql = "SELECT * FROM device_model_slot WHERE device_id = '" + deviceId + "'";
    PGresult* res = PQexec(conn, sql.c_str());
    
    json result = json::array();
    for (int i = 0; i < PQntuples(res); i++) {
        result.push_back({
            {"id", PQgetvalue(res, i, 0)},
            {"device_id", PQgetvalue(res, i, 1)},
            {"model_name", PQgetvalue(res, i, 2)}
        });
    }
    PQclear(res);
    return result;
}

json ConfigDao::getAccessories(const std::string& deviceId) {
    auto conn = DbUtil::getConnection();
    std::string sql = "SELECT * FROM accessory_item WHERE device_id = '" + deviceId + "'";
    PGresult* res = PQexec(conn, sql.c_str());
    
    json result = json::array();
    for (int i = 0; i < PQntuples(res); i++) {
        result.push_back({
            {"id", PQgetvalue(res, i, 0)},
            {"device_id", PQgetvalue(res, i, 1)},
            {"accessory_code", PQgetvalue(res, i, 2)},
            {"accessory_name", PQgetvalue(res, i, 3)}
        });
    }
    PQclear(res);
    return result;
}

std::string ConfigDao::createModelSlot(const std::string& deviceId, const std::string& modelName) {
    auto conn = DbUtil::getConnection();
    // 生成 ID (简化版本)
    std::string id = "slot_" + std::to_string(std::time(nullptr));
    
    std::string sql = "INSERT INTO device_model_slot (id, device_id, model_name) "
                      "VALUES ('" + id + "', '" + deviceId + "', '" + modelName + "')";
    PQexec(conn, sql.c_str());
    return id;
}

void ConfigDao::deleteModelSlot(const std::string& slotId) {
    auto conn = DbUtil::getConnection();
    std::string sql = "DELETE FROM device_model_slot WHERE id = '" + slotId + "'";
    PQexec(conn, sql.c_str());
}

void ConfigDao::saveMappings(const std::string& deviceId, const json& mappings) {
    auto conn = DbUtil::getConnection();
    
    // 先删除旧的映射
    std::string deleteSql = "DELETE FROM model_accessory_mapping WHERE model_slot_id IN "
                            "(SELECT id FROM device_model_slot WHERE device_id = '" + deviceId + "')";
    PQexec(conn, deleteSql.c_str());
    
    // 插入新的映射
    for (const auto& mapping : mappings) {
        std::string modelSlotId = mapping["model_slot_id"];
        std::string accessoryId = mapping["accessory_item_id"];
        
        std::string sql = "INSERT INTO model_accessory_mapping (model_slot_id, accessory_item_id) "
                          "VALUES ('" + modelSlotId + "', '" + accessoryId + "')";
        PQexec(conn, sql.c_str());
    }
}

} // namespace dao