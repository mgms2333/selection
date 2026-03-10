#ifndef UTILS_JSON_UTIL_H
#define UTILS_JSON_UTIL_H

#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace JsonUtil {

/**
 * JSON 响应结构
 */
struct JsonResponse {
    std::string status;
    std::string message;
    json data;
    int code = 200;
    
    std::string toJson() const {
        json j;
        j["status"] = status;
        j["message"] = message;
        j["code"] = code;
        if (!data.is_null()) {
            j["data"] = data;
        }
        return j.dump(4);
    }
    
    static JsonResponse success(const std::string& msg = "Success", const json& data = json()) {
        JsonResponse r;
        r.status = "success";
        r.message = msg;
        r.data = data;
        r.code = 200;
        return r;
    }
    
    static JsonResponse error(const std::string& msg = "Error", int code = 400) {
        JsonResponse r;
        r.status = "error";
        r.message = msg;
        r.code = code;
        return r;
    }
};

/**
 * JSON 解析工具函数
 */
inline json parseJson(const std::string& str, bool& success) {
    success = false;
    try {
        auto j = json::parse(str);
        success = true;
        return j;
    } catch (const json::parse_error& e) {
        return json();
    }
}

inline json safeParse(const std::string& str) {
    bool success = false;
    return parseJson(str, success);
}

inline bool isValidJson(const std::string& str) {
    bool success = false;
    parseJson(str, success);
    return success;
}

/**
 * 安全获取 JSON 字段
 */
template<typename T>
T getValue(const json& j, const std::string& key, const T& defaultValue) {
    if (j.contains(key) && !j[key].is_null()) {
        try {
            return j[key].get<T>();
        } catch (...) {
            return defaultValue;
        }
    }
    return defaultValue;
}

/**
 * JSON 字符序列化
 */
inline std::string stringify(const json& j, int indent = -1) {
    return j.dump(indent);
}

} // namespace JsonUtil

#endif // UTILS_JSON_UTIL_H