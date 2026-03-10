#include "ConfigController.h"
#include "../services/ConfigService.h"
#include <iostream>

namespace controllers {

json ConfigController::accessCheck(const json& body) {
    try {
        if (!body.contains("employee_no")) {
            return {
                {"status", "error"},
                {"message", "Missing employee_no"}
            };
        }
        
        std::string employeeNo = body["employee_no"];
        bool hasAccess = services::ConfigService::checkAccess(employeeNo);
        
        return {
            {"status", "ok"},
            {"data", {
                {"has_access", hasAccess}
            }}
        };
    } catch (const std::exception& e) {
        return {
            {"status", "error"},
            {"message", e.what()}
        };
    }
}

json ConfigController::devices() {
    try {
        json devices = services::ConfigService::getDevices();
        
        return {
            {"status", "ok"},
            {"data", devices}
        };
    } catch (const std::exception& e) {
        return {
            {"status", "error"},
            {"message", e.what()}
        };
    }
}

json ConfigController::deviceDetail(const std::string& deviceId) {
    try {
        json device = services::ConfigService::getDeviceDetail(deviceId);
        
        return {
            {"status", "ok"},
            {"data", device}
        };
    } catch (const std::exception& e) {
        return {
            {"status", "error"},
            {"message", e.what()}
        };
    }
}

json ConfigController::addModelSlot(const std::string& deviceId, const json& body) {
    try {
        if (!body.contains("model_name")) {
            return {
                {"status", "error"},
                {"message", "Missing model_name"}
            };
        }
        
        std::string modelName = body["model_name"];
        std::string slotId = services::ConfigService::addModelSlot(deviceId, modelName);
        
        return {
            {"status", "ok"},
            {"data", {
                {"slot_id", slotId}
            }}
        };
    } catch (const std::exception& e) {
        return {
            {"status", "error"},
            {"message", e.what()}
        };
    }
}

json ConfigController::deleteModelSlot(const std::string& slotId) {
    try {
        services::ConfigService::deleteModelSlot(slotId);
        
        return {
            {"status", "ok"},
            {"message", "Model slot deleted"}
        };
    } catch (const std::exception& e) {
        return {
            {"status", "error"},
            {"message", e.what()}
        };
    }
}

json ConfigController::saveMapping(const std::string& deviceId, const json& body) {
    try {
        if (!body.contains("mappings")) {
            return {
                {"status", "error"},
                {"message", "Missing mappings"}
            };
        }
        
        services::ConfigService::saveMappings(deviceId, body["mappings"]);
        
        return {
            {"status", "ok"},
            {"message", "Mappings saved"}
        };
    } catch (const std::exception& e) {
        return {
            {"status", "error"},
            {"message", e.what()}
        };
    }
}

} // namespace controllers