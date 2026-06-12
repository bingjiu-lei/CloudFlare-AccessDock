# CloudFlare-AccessDock

CloudFlare-AccessDock 是一个部署在 Cloudflare Workers 上的通用访问控制服务。它不绑定固定域名，也不绑定具体业务项目。你可以把它部署到 `auth.leiyun.blog`、`gate.example.com` 或任何自己的域名。

## 能做什么

- 在管理台热配置需要登录的域名和路径。
- 支持固定密码、临时码、仅管理员访问。
- 临时码支持分钟、小时、天级别有效期。
- 不保留登录的临时码会生成一次性 grant，刷新后失效。
- 简历、图床、paste 等项目都可以通过同一个客户端函数接入。

## 项目结构

```text
src/index.js              Worker 主服务和管理台
client/accessdock-client.js 业务项目接入用的小校验函数
migrations/0001_init.sql  D1 数据库表结构
wrangler.toml             Cloudflare Workers 配置
```

## 环境变量

```text
PUBLIC_BASE_URL=https://auth.leiyun.blog
COOKIE_DOMAIN=.leiyun.blog
ADMIN_PASSWORD=你的管理员密码
SESSION_SECRET=一段很长的随机字符串
```

`PUBLIC_BASE_URL` 是 AccessDock 自己的公开访问地址。代码不写死任何默认域名。

## D1

创建 D1 数据库后，把 `wrangler.toml` 里的 `database_id` 替换成真实 ID，然后执行：

```powershell
npm run db:migrate
```

本地开发可以执行：

```powershell
npm run db:migrate:local
npm run dev
```

## 管理台

访问：

```text
https://你的域名/admin
```

管理台可以新增规则：

```text
host: img.leiyun.blog
pathPattern: /file/private/*
mode: password / code / admin
```

保存后立即生效，不需要重新部署。

## 业务项目接入

把 `client/accessdock-client.js` 复制到业务项目里，然后在请求入口调用：

```js
import { checkAccess } from "./accessdock-client.js";

export default {
  async fetch(request, env) {
    const access = await checkAccess(request, env);
    if (!access.ok) return access.response;

    return new Response("原业务逻辑继续执行");
  },
};
```

业务项目需要配置：

```text
ACCESSDOCK_BASE_URL=https://auth.leiyun.blog
```

图床如果只想保护某个文件下载入口，就在返回文件之前调用 `checkAccess`，其他后台、上传、公开文件不受影响。

## 规则匹配

规则支持 `*` 通配：

```text
/file/private/*
/file/notes/a.pdf
/p/*
```

匹配逻辑是 `host + path`。未命中任何启用规则时，AccessDock 返回允许访问。
