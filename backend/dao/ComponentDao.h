#pragma once

#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace dao {

class ComponentDao {
public:
    // 获取所有分类
    static json getCategories();
    
    // 获取分类下的选项
    static json getOptionsByCategory(const std::string& categoryId);
};

} // namespace dao