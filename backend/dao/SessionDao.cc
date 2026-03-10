#include "SessionDao.h"
#include "../utils/DbUtil.h"
#include <iostream>

namespace dao {

void SessionDao::create(const std::string& id, const std::string& employeeNo,
                        const std::string& employeeName, const std::string& startedAt) {
    auto conn = DbUtil::getConnection();
    std::string sql = "INSERT INTO selection_session (id, employee_no, employee_name, started_at, status) "
                      "VALUES ('" + id + "', '" + employeeNo + "', '" + employeeName + "', '" + startedAt + "', 'pending')";
    PQexec(conn, sql.c_str());
}

bool SessionDao::exists(const std::string& id) {
    auto conn = DbUtil::getConnection();
    std::string sql = "SELECT id FROM selection_session WHERE id = '" + id + "'";
    PGresult* res = PQexec(conn, sql.c_str());
    bool found = PQntuples(res) > 0;
    PQclear(res);
    return found;
}

json SessionDao::getById(const std::string& id) {
    auto conn = DbUtil::getConnection();
    std::string sql = "SELECT * FROM selection_session WHERE id = '" + id + "'";
    PGresult* res = PQexec(conn, sql.c_str());
    
    json result;
    if (PQntuples(res) > 0) {
        result = {
            {"id", PQgetvalue(res, 0, 0)},
            {"employee_no", PQgetvalue(res, 0, 1)},
            {"employee_name", PQgetvalue(res, 0, 2)},
            {"started_at", PQgetvalue(res, 0, 3)},
            {"submitted_at", PQgetvalue(res, 0, 4)},
            {"status", PQgetvalue(res, 0, 5)}
        };
    }
    PQclear(res);
    return result;
}

void SessionDao::updateStatus(const std::string& id, const std::string& status, const std::string& submittedAt) {
    auto conn = DbUtil::getConnection();
    std::string sql = "UPDATE selection_session SET status = '" + status + "', submitted_at = '" + submittedAt + "' WHERE id = '" + id + "'";
    PQexec(conn, sql.c_str());
}

void SessionDao::saveSelection(const std::string& sessionId, const std::string& categoryId,
                               const std::string& optionId, int stepNo) {
    auto conn = DbUtil::getConnection();
    std::string sql = "INSERT INTO selection_item (session_id, category_id, option_id, step_no) "
                      "VALUES ('" + sessionId + "', '" + categoryId + "', '" + optionId + "', " + std::to_string(stepNo) + ")";
    PQexec(conn, sql.c_str());
}

json SessionDao::getSelections(const std::string& sessionId) {
    auto conn = DbUtil::getConnection();
    std::string sql = "SELECT * FROM selection_item WHERE session_id = '" + sessionId + "' ORDER BY step_no";
    PGresult* res = PQexec(conn, sql.c_str());
    
    json result = json::array();
    for (int i = 0; i < PQntuples(res); i++) {
        result.push_back({
            {"id", PQgetvalue(res, i, 0)},
            {"session_id", PQgetvalue(res, i, 1)},
            {"category_id", PQgetvalue(res, i, 2)},
            {"option_id", PQgetvalue(res, i, 3)},
            {"step_no", std::stoi(PQgetvalue(res, i, 4))}
        });
    }
    PQclear(res);
    return result;
}

json SessionDao::getSnapshot(const std::string& sessionId) {
    auto conn = DbUtil::getConnection();
    std::string sql = "SELECT * FROM selection_result_snapshot WHERE session_id = '" + sessionId + "'";
    PGresult* res = PQexec(conn, sql.c_str());
    
    json result;
    if (PQntuples(res) > 0) {
        result = {
            {"id", PQgetvalue(res, 0, 0)},
            {"session_id", PQgetvalue(res, 0, 1)},
            {"result_json", PQgetvalue(res, 0, 2)},
            {"created_at", PQgetvalue(res, 0, 3)}
        };
    }
    PQclear(res);
    return result;
}

} // namespace dao