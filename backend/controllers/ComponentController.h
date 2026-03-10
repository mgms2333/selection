#pragma once

#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace controllers {

class ComponentController {
public:
    // GET /api/component/categories - 获取部件分类列表
    static json categories();
    
    // GET /api/component/categories/:id/options - 获取分类下的选项
    static json options(const std::string& categoryId);
};

} // namespace controllers