#include "SessionController.h"
#include "../services/SessionService.h"
#include <iostream>

namespace controllers {

json SessionController::start(const json& body) {
    try {
        // 验证输入
        if (!body.contains("employee_no") || !body.contains("employee_name")) {
            return {
                {"status", "error"},
                {"message", "Missing required fields: employee_no, employee_name"}
            };
        }
        
        std::string employeeNo = body["employee_no"];
        std::string employeeName = body["employee_name"];
        
        // 创建会话
        std::string sessionId = services::SessionService::createSession(employeeNo, employeeName);
        
        return {
            {"status", "ok"},
            {"data", {
                {"session_id", sessionId},
                {"employee_no", employeeNo},
                {"employee_name", employeeName}
            }}
        };
    } catch (const std::exception& e) {
        return {
            {"status", "error"},
            {"message", e.what()}
        };
    }
}

json SessionController::select(const std::string& sessionId, const json& body) {
    try {
        // 验证会话存在
        if (!services::SessionService::sessionExists(sessionId)) {
            return {
                {"status", "error"},
                {"message", "Session not found"}
            };
        }
        
        // 验证输入
        if (!body.contains("category_id") || !body.contains("option_id")) {
            return {
                {"status", "error"},
                {"message", "Missing required fields: category_id, option_id"}
            };
        }
        
        std::string categoryId = body["category_id"];
        std::string optionId = body["option_id"];
        int stepNo = body.value("step_no", 0);
        
        // 保存选择
        services::SessionService::saveSelection(sessionId, categoryId, optionId, stepNo);
        
        return {
            {"status", "ok"},
            {"message", "Selection saved"}
        };
    } catch (const std::exception& e) {
        return {
            {"status", "error"},
            {"message", e.what()}
        };
    }
}

json SessionController::summary(const std::string& sessionId) {
    try {
        if (!services::SessionService::sessionExists(sessionId)) {
            return {
                {"status", "error"},
                {"message", "Session not found"}
            };
        }
        
        json summary = services::SessionService::getSummary(sessionId);
        
        return {
            {"status", "ok"},
            {"data", summary}
        };
    } catch (const std::exception& e) {
        return {
            {"status", "error"},
            {"message", e.what()}
        };
    }
}

json SessionController::confirm(const std::string& sessionId) {
    try {
        if (!services::SessionService::sessionExists(sessionId)) {
            return {
                {"status", "error"},
                {"message", "Session not found"}
            };
        }
        
        services::SessionService::confirmSession(sessionId);
        
        return {
            {"status", "ok"},
            {"message", "Session confirmed"}
        };
    } catch (const std::exception& e) {
        return {
            {"status", "error"},
            {"message", e.what()}
        };
    }
}

} // namespace controllers