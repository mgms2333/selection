#include "SessionService.h"
#include "../dao/SessionDao.h"
#include <uuid/uuid.h>
#include <chrono>
#include <sstream>
#include <iomanip>

namespace services {

std::string generateUUID() {
    uuid_t uuid;
    uuid_generate(uuid);
    char str[37];
    uuid_unparse(uuid, str);
    return std::string(str);
}

std::string SessionService::createSession(const std::string& employeeNo, const std::string& employeeName) {
    std::string sessionId = generateUUID();
    std::string startedAt = std::to_string(std::chrono::system_clock::now().time_since_epoch().count());
    
    dao::SessionDao::create(sessionId, employeeNo, employeeName, startedAt);
    
    return sessionId;
}

bool SessionService::sessionExists(const std::string& sessionId) {
    return dao::SessionDao::exists(sessionId);
}

void SessionService::saveSelection(const std::string& sessionId, const std::string& categoryId,
                                   const std::string& optionId, int stepNo) {
    dao::SessionDao::saveSelection(sessionId, categoryId, optionId, stepNo);
}

json SessionService::getSummary(const std::string& sessionId) {
    json session = dao::SessionDao::getById(sessionId);
    json selections = dao::SessionDao::getSelections(sessionId);
    
    return {
        {"session", session},
        {"selections", selections}
    };
}

void SessionService::confirmSession(const std::string& sessionId) {
    std::string submittedAt = std::to_string(std::chrono::system_clock::now().time_since_epoch().count());
    dao::SessionDao::updateStatus(sessionId, "confirmed", submittedAt);
}

json SessionService::getResultSnapshot(const std::string& sessionId) {
    return dao::SessionDao::getSnapshot(sessionId);
}

} // namespace services