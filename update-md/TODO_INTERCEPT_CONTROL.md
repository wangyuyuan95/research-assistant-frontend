# Todo拦截控制参数实现

## 概述

将todo.md拦截功能封装成控制参数，允许用户决定是否启用todo.md拦截功能，并添加了用户界面控制。

## 核心业务流程修改

### 1. 控制参数封装

在`useThreadData` hook中添加控制参数：
- `enableTodoIntercept`: boolean - 控制是否启用todo拦截功能（默认true，支持localStorage持久化）
- `setEnableTodoIntercept`: (enabled: boolean) => void - 设置todo拦截开关
- `isTodoInterceptActive`: boolean - 当前是否处于todo拦截状态
- `setIsTodoInterceptActive`: (active: boolean) => void - 设置todo拦截状态

### 2. 拦截逻辑修改

**`src/app/(dashboard)/projects/[projectId]/thread/[threadId]/page.tsx`**
- 修改todo拦截逻辑：只有当`enableTodoIntercept`为true时才执行拦截
- 使用控制参数替换原有的`todoInterceptRef`

**`src/components/thread/tool-views/file-operation/FileOperationToolView.tsx`**
- 优化`checkTodoConfirmed`逻辑：只检查`tool`或`assistant`类型的后续消息
- 确保todo.md确认后不可再次编辑

### 3. 用户界面控制

**设置按钮位置**：输入框submit按钮之前
- 设置图标 + 下拉菜单形式
- Switch开关："自动执行研究流程"（开启=不拦截，关闭=拦截）
- 说明文字："开启后将自动执行科研助手生成研究流程，您可以选择关闭以自定义修改研究流程"

**参数传递链路**：
```
useThreadData → page.tsx → ChatInput → MessageInput
```

### 4. 全页面支持

为所有使用`ChatInput`的页面添加todo拦截控制：
- Dashboard页面 (`/dashboard`)
- Agent Builder页面 (`/agents`)
- Agent Preview页面 (`/agents`)

### 5. 国际化支持

添加多语言文本：
- `computer.autoExecuteResearch`: "自动执行研究流程"
- `computer.autoExecuteResearchDesc`: "开启后将自动执行科研助手生成研究流程，您可以选择关闭以自定义修改研究流程"

## 功能说明

- **默认行为**: `enableTodoIntercept`默认为`true`（手动审阅模式）
- **控制逻辑**: 只有当`enableTodoIntercept`为`true`时，才会执行todo.md文件的拦截逻辑
- **持久化**: 用户选择通过localStorage保存，跨会话保持
- **向后兼容**: 所有现有功能保持不变，只是增加了控制开关
