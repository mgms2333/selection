#include "ConfigService.h"
#include "../dao/ConfigDao.h"

namespace services {

bool ConfigService::checkAccess(const std::string& employeeNo) {
    return dao::ConfigDao::isAdminWhitelisted(employeeNo);
}

json ConfigService::getDevices() {
    return dao::ConfigDao::getAllDevices();
}

json ConfigService::getDeviceDetail(const std::string& deviceId) {
    json device = dao::ConfigDao::getDeviceById(deviceId);
    json modelSlots = dao::ConfigDao::getModelSlots(deviceId);
    json accessories = dao::ConfigDao::getAccessories(deviceId);
    
    return {
        {"device", device},
        {"model_slots", modelSlots},
        {"accessories", accessories}
    };
}

std::string ConfigService::addModelSlot(const std::string& deviceId, const std::string& modelName) {
    return dao::ConfigDao::createModelSlot(deviceId, modelName);
}

void ConfigService::deleteModelSlot(const std::string& slotId) {
    dao::ConfigDao::deleteModelSlot(slotId);
}

void ConfigService::saveMappings(const std::string& deviceId, const json& mappings) {
    dao::ConfigDao::saveMappings(deviceId, mappings);
}

} // namespace services