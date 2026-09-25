# CyFreelance 自由职业者撮合平台

自由职业者撮合平台，覆盖需求发布、报价竞标、合同签署和项目交付管理。

## Docker 一键启动

首次启动前复制环境变量文件：

```bash
cp .env.example .env
docker compose up -d
```

访问地址：

- 前端：http://localhost:28030
- 后端健康检查：http://localhost:29068/health
- MySQL：localhost:38101

## 项目主要功能

- 需求大厅：按关键词、预算、技能和状态筛选需求。
- 需求详情：查看需求、报价列表，登录后提交报价。
- 我的工作台：按角色查看发布需求、我的报价和进行中合同。
- 合同详情：查看合同编号、双方信息、付款方式和阶段进度。
- 个人资料：查看并编辑用户资料、技能标签和历史项目。
- JWT 认证授权：登录后前端请求拦截器自动携带 token，后端 guard/middleware 校验。
- 操作日志：后端请求日志中间件写入 `operation_logs` 表。

## 本地开发

后端：

```bash
cd backend
npm install
npm run start:dev
```

前端：

```bash
cd frontend
npm install
npm run dev
```

本地开发时前端仍调用 `/api`，Vite 代理会转发到 `http://localhost:29068`。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | Vue 3、TypeScript、Vite、Element Plus、Pinia、Vue Router、Axios |
| 后端 | NestJS、TypeScript、TypeORM、JWT、bcryptjs、class-validator、multer |
| 数据库 | MySQL 8.0 |
| 部署 | Docker Compose、Nginx 反向代理 |

## 项目目录结构

```text
.
├── backend/
│   ├── Dockerfile
│   └── src/
│       ├── common/
│       │   ├── enums/
│       │   ├── guards/
│       │   └── middlewares/
│       ├── config/
│       ├── modules/
│       │   ├── auth/
│       │   ├── bid/
│       │   ├── contract/
│       │   ├── requirement/
│       │   └── user/
│       └── utils/
├── database/
│   └── init.sql
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── api/
│       ├── components/common/
│       ├── hooks/
│       ├── pages/
│       ├── router/
│       ├── stores/
│       ├── types/
│       └── utils/
├── docker-compose.yml
├── .env.example
└── README.md
```

## 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `COMPOSE_PROJECT_NAME` | Compose 项目名，避免目录名影响容器名 | `cyfreelance` |
| `DB_NAME` | MySQL 数据库名 | `freelance` |
| `DB_USER` | MySQL 用户名 | `freelance` |
| `DB_PASSWORD` | MySQL 用户密码 | `freelance_pwd` |
| `DB_ROOT_PASSWORD` | MySQL root 密码 | `root_pwd` |
| `JWT_SECRET` | JWT 签名密钥 | `change_me_to_a_long_random_string` |
| `FRONTEND_PORT` | 前端宿主机端口 | `28030` |
| `BACKEND_PORT` | 后端宿主机端口 | `29068` |
| `DB_PORT` | 数据库宿主机端口 | `38101` |

## Docker 部署说明

- `docker-compose.yml` 未使用废弃的 `version:` 字段，并声明 `name: cyfreelance`。
- 容器名带 `${COMPOSE_PROJECT_NAME:-cyfreelance}` 前缀，目录名可以是中文。
- 前端端口映射为 `${FRONTEND_PORT:-28030}:80`。
- Nginx 将 `/api/` 反向代理到 `http://backend:29068/`，前端代码不硬编码 localhost。
- MySQL 数据通过命名卷 `db_data` 持久化。
- 数据库和后端均配置 healthcheck，后端等待数据库 healthy，前端等待后端 healthy。
- 常见问题：如端口冲突，修改 `.env` 中的 `FRONTEND_PORT`、`BACKEND_PORT` 或 `DB_PORT` 后重新执行 `docker compose up -d`。

## 枚举出现位置

`RequirementStatus`：

- 后端定义：`backend/src/common/enums/requirement-status.enum.ts`
- 后端使用：`backend/src/modules/requirement/entity/requirement.entity.ts`
- 后端使用：`backend/src/modules/requirement/dto/create-requirement.dto.ts`
- 后端使用：`backend/src/modules/requirement/dto/update-requirement.dto.ts`
- 后端使用：`backend/src/modules/requirement/requirement.service.ts`
- 后端使用：`backend/src/modules/requirement/requirement.controller.ts`
- 后端使用：`backend/src/modules/bid/bid.service.ts`
- 后端使用：`backend/src/modules/contract/contract.service.ts`
- 前端定义：`frontend/src/types/enums.ts`
- 前端使用：`frontend/src/api/requirement.ts`
- 前端使用：`frontend/src/stores/requirement.ts`
- 前端使用：`frontend/src/components/common/StatusBadge.vue`
- 前端使用：`frontend/src/components/common/FilterBar.vue`

`BidStatus`：

- 后端定义：`backend/src/common/enums/bid-status.enum.ts`
- 后端使用：`backend/src/modules/bid/entity/bid.entity.ts`
- 后端使用：`backend/src/modules/bid/dto/update-bid-status.dto.ts`
- 后端使用：`backend/src/modules/bid/bid.service.ts`
- 前端定义：`frontend/src/types/enums.ts`
- 前端使用：`frontend/src/components/common/StatusBadge.vue`

## 核心实体链路

- Requirement：`database/init.sql`、后端 `modules/requirement`、前端 `api/requirement.ts`、`stores/requirement.ts`、`pages/RequirementsPage.vue`、`components/common/RequirementCard.vue`。
- Bid：`database/init.sql`、后端 `modules/bid`、前端 `api/bid.ts`、`stores/bid.ts`、`pages/RequirementDetailPage.vue`、`components/common/BidCard.vue`。
- Contract：`database/init.sql`、后端 `modules/contract`、前端 `api/contract.ts`、`stores/contract.ts`、`pages/ContractDetailPage.vue`、`components/common/ContractCard.vue`。
- User：`database/init.sql`、后端 `modules/user` 与 `modules/auth`、前端 `api/user.ts`、`stores/user.ts`、`pages/ProfilePage.vue`、`components/common/UserAvatar.vue`。

## License

MIT
