#include "SelectionService.h"
#include "../dao/ComponentDao.h"

namespace services {

json SelectionService::getCategories() {
    return dao::ComponentDao::getCategories();
}

json SelectionService::getOptions(const std::string& categoryId) {
    return dao::ComponentDao::getOptionsByCategory(categoryId);
}

} // namespace services