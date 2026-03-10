#include <iostream>
#include <string>
#include <memory>
#include <regex>

#include "utils/httplib.h"
#include "utils/JsonUtil.h"
#include "utils/DbUtil.h"
#include "controllers/SessionController.h"
#include "controllers/ComponentController.h"
#include "controllers/ConfigController.h"
#include "controllers/ResultController.h"

// 从路径中提取参数
std::string extractPathParam(const std::string& path, const std::string& pattern, int paramIndex) {
    std::regex re(pattern);
    std::smatch match;
    if (std::regex_search(path, match, re) && match.size() > static_cast<size_t>(paramIndex)) {
        return match[paramIndex].str();
    }
    return "";
}

int main() {
    std::cout << "Product Selection System Backend v1.0.0" << std::endl;
    
    // 初始化数据库连接
    DbUtil::init("localhost", 5432, "selection_db", "selection_user", "selection123");
    
    // 基础 HTTP 服务器 (使用 httplib)
    httplib::Server svr;
    
    // 允许跨域
    svr.set_default_headers({
        {"Access-Control-Allow-Origin", "*"},
        {"Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"},
        {"Access-Control-Allow-Headers", "Content-Type, Authorization"}
    });
    
    // OPTIONS 请求处理
    svr.Options(".*", [](const httplib::Request& req, httplib::Response& res) {
        res.status = 204;
    });
    
    // 健康检查
    svr.Get("/health", [](const httplib::Request& req, httplib::Response& res) {
        nlohmann::json response = {
            {"status", "ok"},
            {"message", "Service is running"}
        };
        res.set_content(response.dump(), "application/json");
    });
    
    // API 根路径
    svr.Get("/", [](const httplib::Request& req, httplib::Response& res) {
        nlohmann::json response = {
            {"status", "ok"},
            {"message", "Product Selection System API"}
        };
        res.set_content(response.dump(), "application/json");
    });
    
    // ========== Auth API ==========
    
    // POST /api/auth/login
    svr.Post("/api/auth/login", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto body = nlohmann::json::parse(req.body);
            std::string username = body.value("username", "");
            std::string password = body.value("password", "");
            
            if (username.empty() || password.empty()) {
                res.set_content(nlohmann::json{
                    {"status", "error"},
                    {"message", "用户名和密码不能为空"}
                }.dump(), "application/json");
                return;
            }
            
            // 查询用户
            auto conn = DbUtil::getConnection();
            std::string sql = "SELECT id, username, email, role, password_hash FROM users WHERE username = '" + username + "'";
            PGresult* dbRes = PQexec(conn, sql.c_str());
            
            if (PQntuples(dbRes) == 0) {
                PQclear(dbRes);
                res.set_content(nlohmann::json{
                    {"status", "error"},
                    {"message", "用户不存在"}
                }.dump(), "application/json");
                return;
            }
            
            std::string userId = PQgetvalue(dbRes, 0, 0);
            std::string dbUsername = PQgetvalue(dbRes, 0, 1);
            std::string dbEmail = PQgetvalue(dbRes, 0, 2);
            std::string dbRole = PQgetvalue(dbRes, 0, 3);
            std::string dbPasswordHash = PQgetvalue(dbRes, 0, 4);
            PQclear(dbRes);
            
            // 简单密码验证
            bool passwordOk = (password == dbPasswordHash);
            
            if (!passwordOk) {
                res.set_content(nlohmann::json{
                    {"status", "error"},
                    {"message", "密码错误"}
                }.dump(), "application/json");
                return;
            }
            
            // 生成简单 token
            std::string token = "token_" + userId + "_" + std::to_string(time(nullptr));
            
            res.set_content(nlohmann::json{
                {"status", "ok"},
                {"token", token},
                {"user", {
                    {"id", userId},
                    {"username", dbUsername},
                    {"name", dbUsername},
                    {"email", dbEmail},
                    {"role", dbRole}
                }}
            }.dump(), "application/json");
        } catch (const std::exception& e) {
            res.set_content(nlohmann::json{
                {"status", "error"},
                {"message", e.what()}
            }.dump(), "application/json");
        }
    });
    
    // ========== Session API ==========
    
    // POST /api/session/start
    svr.Post("/api/session/start", [](const httplib::Request& req, httplib::Response& res) {
        auto body = nlohmann::json::parse(req.body);
        auto result = controllers::SessionController::start(body);
        res.set_content(result.dump(), "application/json");
    });
    
    // POST /api/session/:id/select
    svr.Post(R"(/api/session/([^/]+)/select)", [](const httplib::Request& req, httplib::Response& res) {
        std::string sessionId = extractPathParam(req.path, R"(/api/session/([^/]+)/select)", 1);
        auto body = nlohmann::json::parse(req.body);
        auto result = controllers::SessionController::select(sessionId, body);
        res.set_content(result.dump(), "application/json");
    });
    
    // GET /api/session/:id/summary
    svr.Get(R"(/api/session/([^/]+)/summary)", [](const httplib::Request& req, httplib::Response& res) {
        std::string sessionId = extractPathParam(req.path, R"(/api/session/([^/]+)/summary)", 1);
        auto result = controllers::SessionController::summary(sessionId);
        res.set_content(result.dump(), "application/json");
    });
    
    // POST /api/session/:id/confirm
    svr.Post(R"(/api/session/([^/]+)/confirm)", [](const httplib::Request& req, httplib::Response& res) {
        std::string sessionId = extractPathParam(req.path, R"(/api/session/([^/]+)/confirm)", 1);
        auto result = controllers::SessionController::confirm(sessionId);
        res.set_content(result.dump(), "application/json");
    });
    
    // ========== Component API ==========
    
    // GET /api/component/categories
    svr.Get("/api/component/categories", [](const httplib::Request& req, httplib::Response& res) {
        auto result = controllers::ComponentController::categories();
        res.set_content(result.dump(), "application/json");
    });
    
    // GET /api/component/categories/:id/options
    svr.Get(R"(/api/component/categories/([^/]+)/options)", [](const httplib::Request& req, httplib::Response& res) {
        std::string categoryId = extractPathParam(req.path, R"(/api/component/categories/([^/]+)/options)", 1);
        auto result = controllers::ComponentController::options(categoryId);
        res.set_content(result.dump(), "application/json");
    });
    
    // ========== Result API ==========
    
    // GET /api/result/:sessionId
    svr.Get(R"(/api/result/([^/]+))", [](const httplib::Request& req, httplib::Response& res) {
        std::string sessionId = extractPathParam(req.path, R"(/api/result/([^/]+))", 1);
        auto result = controllers::ResultController::getResult(sessionId);
        res.set_content(result.dump(), "application/json");
    });
    
    // ========== Config API ==========
    
    // POST /api/config/access-check
    svr.Post("/api/config/access-check", [](const httplib::Request& req, httplib::Response& res) {
        auto body = nlohmann::json::parse(req.body);
        auto result = controllers::ConfigController::accessCheck(body);
        res.set_content(result.dump(), "application/json");
    });
    
    // GET /api/config/devices
    svr.Get("/api/config/devices", [](const httplib::Request& req, httplib::Response& res) {
        auto result = controllers::ConfigController::devices();
        res.set_content(result.dump(), "application/json");
    });
    
    // GET /api/config/devices/:id
    svr.Get(R"(/api/config/devices/([^/]+))", [](const httplib::Request& req, httplib::Response& res) {
        std::string deviceId = extractPathParam(req.path, R"(/api/config/devices/([^/]+))", 1);
        auto result = controllers::ConfigController::deviceDetail(deviceId);
        res.set_content(result.dump(), "application/json");
    });
    
    // POST /api/config/devices/:id/model-slots
    svr.Post(R"(/api/config/devices/([^/]+)/model-slots)", [](const httplib::Request& req, httplib::Response& res) {
        std::string deviceId = extractPathParam(req.path, R"(/api/config/devices/([^/]+)/model-slots)", 1);
        auto body = nlohmann::json::parse(req.body);
        auto result = controllers::ConfigController::addModelSlot(deviceId, body);
        res.set_content(result.dump(), "application/json");
    });
    
    // DELETE /api/config/model-slots/:id
    svr.Delete(R"(/api/config/model-slots/([^/]+))", [](const httplib::Request& req, httplib::Response& res) {
        std::string slotId = extractPathParam(req.path, R"(/api/config/model-slots/([^/]+))", 1);
        auto result = controllers::ConfigController::deleteModelSlot(slotId);
        res.set_content(result.dump(), "application/json");
    });
    
    // POST /api/config/devices/:id/save-mapping
    svr.Post(R"(/api/config/devices/([^/]+)/save-mapping)", [](const httplib::Request& req, httplib::Response& res) {
        std::string deviceId = extractPathParam(req.path, R"(/api/config/devices/([^/]+)/save-mapping)", 1);
        auto body = nlohmann::json::parse(req.body);
        auto result = controllers::ConfigController::saveMapping(deviceId, body);
        res.set_content(result.dump(), "application/json");
    });
    
    std::cout << "Server starting on port 8080..." << std::endl;
    svr.listen("0.0.0.0", 8080);
    
    return 0;
}