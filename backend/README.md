# Product Selection System - Backend

C++ backend service for product selection system.

## Requirements

- C++17 compiler
- CMake 3.14+
- PostgreSQL client library (libpq)
- jsoncpp
- OpenSSL

## Optional Dependencies

- **Drogon**: High-performance C++ web framework (recommended for production)
- **cpp-httplib**: Header-only HTTP library (fallback, included)

## Build

```bash
mkdir build && cd build
cmake ..
make -j$(nproc)
```

## Run

```bash
./product_selection_backend
```

Server will start on port 8080.

## API Endpoints

- `GET /` - API info
- `GET /health` - Health check

## Directory Structure

```
backend/
├── CMakeLists.txt      # Build configuration
├── main.cpp            # Application entry point
├── controllers/        # API controllers (to be implemented)
├── services/           # Business logic services
├── dao/                # Data Access Objects
├── models/             # Data models
└── utils/              # Utility classes
    ├── DbUtil.h        # Database connection utilities
    └── JsonUtil.h      # JSON handling utilities
```

## Drogon Installation (Optional)

```bash
# CentOS/RHEL
sudo yum install -y drogon-devel

# Or build from source
git clone https://github.com/drogonframework/drogon.git
cd drogon
mkdir build && cd build
cmake ..
make -j$(nproc)
sudo make install
```

## Database Configuration

Configure database connection in your application code using `DbUtil::DbConfig`.

Default settings:
- Host: localhost
- Port: 5432
- Database: product_selection