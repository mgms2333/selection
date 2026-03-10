#pragma once

#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace services {

class SelectionService {
public:
    // 获取部件分类列表
    static json getCategories();
    
    // 获取分类下的选项
    static json getOptions(const std::string& categoryId);
};

} // namespace services