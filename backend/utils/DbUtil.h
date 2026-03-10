#ifndef UTILS_DB_UTIL_H
#define UTILS_DB_UTIL_H

#include <string>
#include <memory>
#include <mutex>
#include <iostream>
#include <libpq-fe.h>

namespace DbUtil {

/**
 * 数据库配置结构体
 */
struct DbConfig {
    std::string host = "localhost";
    int port = 5432;
    std::string database = "product_selection";
    std::string user = "postgres";
    std::string password = "";
    int connectionTimeout = 5;
    int maxConnections = 10;
};

/**
 * 数据库连接管理器
 * 单例模式，管理连接池
 */
class DbConnectionPool {
public:
    static DbConnectionPool& getInstance() {
        static DbConnectionPool instance;
        return instance;
    }
    
    /**
     * 初始化连接池
     */
    bool init(const DbConfig& config) {
        std::lock_guard<std::mutex> lock(mutex_);
        config_ = config;
        return true;
    }
    
    /**
     * 获取数据库连接
     */
    PGconn* getConnection() {
        std::lock_guard<std::mutex> lock(mutex_);
        
        std::string connInfo = 
            "host=" + config_.host +
            " port=" + std::to_string(config_.port) +
            " dbname=" + config_.database +
            " user=" + config_.user +
            " password=" + config_.password +
            " connect_timeout=" + std::to_string(config_.connectionTimeout);
        
        PGconn* conn = PQconnectdb(connInfo.c_str());
        
        if (PQstatus(conn) != CONNECTION_OK) {
            std::cerr << "Database connection failed: " << PQerrorMessage(conn) << std::endl;
            PQfinish(conn);
            return nullptr;
        }
        
        return conn;
    }
    
    /**
     * 释放数据库连接
     */
    void releaseConnection(PGconn* conn) {
        if (conn) {
            PQfinish(conn);
        }
    }
    
    /**
     * 执行查询
     */
    PGresult* executeQuery(PGconn* conn, const std::string& query) {
        if (!conn) return nullptr;
        return PQexec(conn, query.c_str());
    }
    
    /**
     * 检查连接状态
     */
    bool isConnected(PGconn* conn) {
        return conn && PQstatus(conn) == CONNECTION_OK;
    }

private:
    DbConnectionPool() = default;
    ~DbConnectionPool() = default;
    DbConnectionPool(const DbConnectionPool&) = delete;
    DbConnectionPool& operator=(const DbConnectionPool&) = delete;
    
    DbConfig config_;
    std::mutex mutex_;
};

/**
 * 初始化数据库连接池
 */
inline bool init(const std::string& host, int port, const std::string& database, 
                 const std::string& user, const std::string& password) {
    DbConfig config;
    config.host = host;
    config.port = port;
    config.database = database;
    config.user = user;
    config.password = password;
    return DbConnectionPool::getInstance().init(config);
}

/**
 * 获取数据库连接
 */
inline PGconn* getConnection() {
    return DbConnectionPool::getInstance().getConnection();
}

/**
 * 释放数据库连接
 */
inline void releaseConnection(PGconn* conn) {
    DbConnectionPool::getInstance().releaseConnection(conn);
}

/**
 * RAII 数据库连接包装器
 */
class DbConnection {
public:
    DbConnection() : conn_(nullptr) {
        conn_ = DbConnectionPool::getInstance().getConnection();
    }
    
    ~DbConnection() {
        if (conn_) {
            DbConnectionPool::getInstance().releaseConnection(conn_);
        }
    }
    
    PGconn* get() const { return conn_; }
    bool isValid() const { return conn_ != nullptr; }
    
    // 禁止拷贝
    DbConnection(const DbConnection&) = delete;
    DbConnection& operator=(const DbConnection&) = delete;
    
private:
    PGconn* conn_;
};

} // namespace DbUtil

#endif // UTILS_DB_UTIL_H