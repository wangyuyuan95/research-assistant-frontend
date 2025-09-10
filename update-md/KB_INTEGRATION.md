# 知识库集成文档

## 功能概述

本系统集成了RAGFlow知识库，提供以下功能：
1. 用户登录时自动创建对应的知识库账户
2. 在聊天界面提供知识库选择器
3. 通过iframe内嵌知识库管理页面

## 主要组件

### 1. 知识库集成服务 (`src/lib/kb-integration.ts`)
统一的知识库集成文件，包含：

#### 用户登录集成
- 自动为科研助手用户创建对应的知识库账户
- 用户邮箱 `user@example.com` 对应知识库账户，stg环境为 `kyzs-user@example.com`，prod环境为 `prod-kyzs-user@example.com`
- 密码使用相同格式：`kyzs-user@example.com`或 `prod-kyzs-user@example.com`

#### 知识库参数工具函数
- `getDatasetIds()`: 获取选中的知识库数据集IDs
- `getKbApiKey()`: 获取知识库API密钥
- `getKbUrl()`: 获取知识库URL
- `getKnowledgeBaseParams()`: 获取所有知识库参数

#### 显示数据同步
- `sendKnowledgeBaseDisplayData()`: 向知识库iframe发送显示数据（语言和主题）

### 2. 知识库选择器 (`src/components/thread/chat-input/knowledge-base-selector.tsx`)
- 在聊天输入框显示知识库选择按钮
- 支持多选知识库
- 选中的知识库会在AI对话中被使用
- 仅在设置了 `NEXT_PUBLIC_KB_URL` 时显示

### 3. iframe内嵌页面 (`src/app/(dashboard)/knowledge-base/page.tsx`)
- 通过iframe内嵌RAGFlow知识库管理页面
- 支持自动登录和PostMessage通信
- 支持系统语言和主题实时同步
- 自动检查用户认证状态：如果没有`kb_api_key`则自动退出登录

## 智能用户切换解决方案

### 实现方案
当前实现采用智能的用户验证机制：

1. **智能用户验证**：科研助手接收RAGFlow的登录状态，自动判断用户是否匹配
2. **用户匹配检测**：对比RAGFlow当前登录用户与期望用户，匹配则直接展示，不匹配则触发重新登录
3. **自动重新认证**：用户不匹配时自动发送认证数据，无需手动刷新

### 认证数据格式
`kb_integration_details` 包含完整的用户认证信息：
```javascript
{
  userEmail: "user@example.com",        // 科研助手用户邮箱
  kbEmail: "kyzs-user@example.com",     // 对应的知识库邮箱
  apiKey: "ragflow-xxxx",               // API密钥
  timestamp: 1751343712154              // 时间戳
}
```

## 配置说明

### 环境变量
- `NEXT_PUBLIC_KB_URL`: 知识库服务地址（必填）

## 使用流程

### 1. 初始化配置
确保 `.env.local` 文件中设置了 `NEXT_PUBLIC_KB_URL`

### 2. 用户登录
用户登录科研助手后，系统会自动：
- 创建对应的知识库账户
- 存储认证信息到localStorage
- 在聊天界面显示知识库选择器

### 3. 知识库选择
- 点击聊天输入框的知识库图标
- 选择需要使用的知识库
- 选中的知识库会在AI对话中被引用

### 4. 知识库管理
- 点击左侧菜单"个人知识库"（仅在配置了KB_URL时显示）
- 系统自动检查用户是否有`kb_api_key`，如果没有则自动退出登录重新认证
- 通过iframe访问完整的知识库管理界面
- 支持上传文档、管理知识库等操作

## PostMessage通信协议

### 智能通信流程（最多2次通信）

#### 1. iframe加载完成时发送状态（RAGFlow → 科研助手）
```javascript
{
  type: 'IFRAME_READY',
  currentUserEmail: 'kyzs-user@example.com' // 当前登录用户邮箱，未登录时为空
}
```

**科研助手处理逻辑**：
- 如果 `currentUserEmail` 与本地 `kb_integration_details.kbEmail` 匹配：直接展示页面
- 如果不匹配或未登录：发送认证数据触发重新登录

#### 2. 发送认证数据（科研助手 → RAGFlow）
```javascript
{
  type: 'KNOWLEDGE_BASE_AUTH_DATA',
  data: {
    kb_integration_details: '{"userEmail":"user@example.com","kbEmail":"kyzs-user@example.com","apiKey":"ragflow-xxxx","timestamp":1751343712154}'
  }
}
```

#### 3. 发送显示数据（科研助手 → RAGFlow，页面加载时和用户切换语言/主题时）
```javascript
{
  type: 'KNOWLEDGE_BASE_DISPLAY_DATA',
  data: {
    system_language: 'zh',    // zh、zh-TW、en
    system_theme: 'light'     // light、dark
  }
}
```

### 通信特点
- **无域名限制**：PostMessage使用 `'*'` 作为targetOrigin，避免跨域问题
- **数据解耦**：认证数据和显示数据分离发送，概念清晰
- **实时同步**：用户切换语言或主题时，立即同步到RAGFlow
- **智能验证**：自动检测用户匹配度，智能决定是否需要重新认证
- **无缝切换**：用户匹配时直接展示，用户不匹配时自动重新登录

## 动态同步机制

当用户在科研助手中切换语言或主题时，系统会自动向RAGFlow发送新的显示数据：

### 语言切换触发点
- 独立语言切换组件 (`src/components/language-toggle.tsx`)
- 侧边栏用户菜单中的语言切换 (`src/components/sidebar/nav-user-with-teams.tsx`)

### 主题切换触发点
- 独立主题切换组件 (`src/components/home/theme-toggle.tsx`)
- 侧边栏用户菜单中的主题切换 (`src/components/sidebar/nav-user-with-teams.tsx`)

### 同步实现
- 所有切换函数都绑定了 `sendKnowledgeBaseDisplayData()` 方法
  - 该方法自动查找当前页面的知识库iframe
  - 向iframe发送最新的 `KNOWLEDGE_BASE_DISPLAY_DATA` 消息


### 文件结构
```
src/lib/kb-integration.ts              # 统一的知识库集成服务
├── 知识库参数工具函数
├── 显示数据同步函数
└── 知识库集成服务类

src/components/thread/chat-input/
└── knowledge-base-selector.tsx       # 知识库选择器

src/app/(dashboard)/knowledge-base/
└── page.tsx                          # iframe内嵌页面
```
