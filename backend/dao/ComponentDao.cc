#include "ComponentDao.h"
#include "../utils/DbUtil.h"
#include <iostream>

namespace dao {

json ComponentDao::getCategories() {
    auto conn = DbUtil::getConnection();
    std::string sql = "SELECT * FROM categories WHERE is_active = true ORDER BY sort_order";
    PGresult* res = PQexec(conn, sql.c_str());
    
    json result = json::array();
    for (int i = 0; i < PQntuples(res); i++) {
        result.push_back({
            {"id", std::stoi(PQgetvalue(res, i, 0))},
            {"name", PQgetvalue(res, i, 1)},
            {"code", PQgetvalue(res, i, 2)},
            {"description", PQgetvalue(res, i, 3)},
            {"sort_order", std::stoi(PQgetvalue(res, i, 5))}
        });
    }
    PQclear(res);
    return result;
}

json ComponentDao::getOptionsByCategory(const std::string& categoryId) {
    auto conn = DbUtil::getConnection();
    std::string sql = "SELECT * FROM products WHERE category_id = " + categoryId + " AND is_active = true ORDER BY sort_order";
    PGresult* res = PQexec(conn, sql.c_str());
    
    json result = json::array();
    for (int i = 0; i < PQntuples(res); i++) {
        result.push_back({
            {"id", std::stoi(PQgetvalue(res, i, 0))},
            {"category_id", std::stoi(PQgetvalue(res, i, 1))},
            {"name", PQgetvalue(res, i, 2)},
            {"model", PQgetvalue(res, i, 3)},
            {"description", PQgetvalue(res, i, 4)},
            {"price", std::stod(PQgetvalue(res, i, 7))},
            {"unit", PQgetvalue(res, i, 8)},
            {"stock", std::stoi(PQgetvalue(res, i, 9))}
        });
    }
    PQclear(res);
    return result;
}

} // namespace dao