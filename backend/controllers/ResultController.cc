#include "ResultController.h"
#include "../services/SessionService.h"
#include <iostream>

namespace controllers {

json ResultController::getResult(const std::string& sessionId) {
    try {
        if (!services::SessionService::sessionExists(sessionId)) {
            return {
                {"status", "error"},
                {"message", "Session not found"}
            };
        }
        
        json result = services::SessionService::getResultSnapshot(sessionId);
        
        return {
            {"status", "ok"},
            {"data", result}
        };
    } catch (const std::exception& e) {
        return {
            {"status", "error"},
            {"message", e.what()}
        };
    }
}

} // namespace controllers