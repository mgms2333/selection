#include "ComponentController.h"
#include "../services/SelectionService.h"
#include <iostream>

namespace controllers {

json ComponentController::categories() {
    try {
        json categories = services::SelectionService::getCategories();
        
        return {
            {"status", "ok"},
            {"data", categories}
        };
    } catch (const std::exception& e) {
        return {
            {"status", "error"},
            {"message", e.what()}
        };
    }
}

json ComponentController::options(const std::string& categoryId) {
    try {
        json options = services::SelectionService::getOptions(categoryId);
        
        return {
            {"status", "ok"},
            {"data", options}
        };
    } catch (const std::exception& e) {
        return {
            {"status", "error"},
            {"message", e.what()}
        };
    }
}

} // namespace controllers