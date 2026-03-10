cmake_minimum_required(VERSION 3.14)
project(product_selection_backend VERSION 1.0.0 LANGUAGES CXX)

# C++17 标准
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# 编译选项
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra")
set(CMAKE_CXX_FLAGS_DEBUG "-g -O0")
set(CMAKE_CXX_FLAGS_RELEASE "-O3")

# 查找依赖
find_package(PkgConfig REQUIRED)

# PostgreSQL 客户端库
pkg_check_modules(LIBPQ REQUIRED libpq)
include_directories(${LIBPQ_INCLUDE_DIRS})
link_directories(${LIBPQ_LIBRARY_DIRS})

# jsoncpp - 手动设置路径
pkg_check_modules(JSONCPP REQUIRED jsoncpp)
set(JSONCPP_INCLUDE_DIRS /usr/include)
set(JSONCPP_LIBRARIES jsoncpp)
include_directories(${JSONCPP_INCLUDE_DIRS})

# OpenSSL
find_package(OpenSSL REQUIRED)
include_directories(${OPENSSL_INCLUDE_DIR})

# nlohmann_json (Header-only, local)
include_directories(${CMAKE_SOURCE_DIR}/utils)

# uuid
find_library(UUID_LIBRARY uuid)
find_path(UUID_INCLUDE_DIR uuid/uuid.h)

# Drogon - 使用 find_package
# 先设置 jsoncpp 变量让 Drogon 的 FindJsoncpp.cmake 能找到
set(JSONCPP_INCLUDE_DIR /usr/include)
find_library(JSONCPP_LIBRARY NAMES jsoncpp)
find_package(Drogon QUIET)
if(Drogon_FOUND)
    message(STATUS "Drogon found: ${Drogon_VERSION}")
    add_definitions(-DUSE_DROGON)
else()
    message(STATUS "Drogon not found, using basic HTTP server")
endif()

# 源文件
set(SOURCES
    main.cpp
    controllers/SessionController.cc
    controllers/ComponentController.cc
    controllers/ConfigController.cc
    controllers/ResultController.cc
    services/SessionService.cc
    services/SelectionService.cc
    services/ConfigService.cc
    dao/SessionDao.cc
    dao/ComponentDao.cc
    dao/ConfigDao.cc
)

# 头文件目录
include_directories(
    ${CMAKE_SOURCE_DIR}
    ${CMAKE_SOURCE_DIR}/controllers
    ${CMAKE_SOURCE_DIR}/services
    ${CMAKE_SOURCE_DIR}/dao
    ${CMAKE_SOURCE_DIR}/models
    ${CMAKE_SOURCE_DIR}/utils
    ${UUID_INCLUDE_DIR}
)

# 可执行文件
add_executable(${PROJECT_NAME} ${SOURCES})

# 链接库
target_link_libraries(${PROJECT_NAME}
    ${LIBPQ_LIBRARIES}
    ${JSONCPP_LIBRARIES}
    ${UUID_LIBRARY}
    OpenSSL::SSL
    OpenSSL::Crypto
)

if(Drogon_FOUND)
    target_link_libraries(${PROJECT_NAME} Drogon::Drogon)
endif()

# 安装
install(TARGETS ${PROJECT_NAME} DESTINATION bin)