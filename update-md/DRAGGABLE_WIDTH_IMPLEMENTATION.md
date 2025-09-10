# 可拖拽宽度功能实现

## 概述
实现了agent系统核心页面的可拖拽宽度调整功能，支持25vw-55vw范围内的手动拉动调整。

## 修改内容

### 1. 顶层状态管理 (`page.tsx`)
- 添加了 `sidePanelWidth` 状态管理（默认45vw）
- 添加了 `isDragging` 拖拽状态
- 实现了 `handleWidthChange`、`handleDragStart`、`handleDragEnd` 回调函数
- 将宽度值传递给 `ThreadLayout` 组件

### 2. ThreadLayout 组件
- 扩展了 `ThreadLayoutProps` 接口，添加拖拽相关属性
- 实现了拖拽分隔线组件
- 添加了鼠标事件处理逻辑
- 更新了左侧区域的 `marginRight` 样式为动态值

### 3. ToolCallSidePanel 组件
- 扩展了 `ToolCallSidePanelProps` 接口，添加 `sidePanelWidth` 属性
- 更新了组件宽度为动态值
- 修复了所有条件渲染分支的宽度设置

### 4. ThreadSkeleton 组件
- 添加了 `sidePanelWidth` 属性支持
- 更新了骨架屏的侧边栏宽度为动态值

### 5. 样式更新
- 将所有固定的 `45vw` 宽度替换为动态值
- 使用 `style` 属性替代CSS类名来支持动态vw值
- 确保移动端不受影响

## 功能特性

### 拖拽分隔线
- 位置：左侧区域和右侧工具区域的边界
- 样式：透明背景，悬停时显示蓝色指示器
- 交互：鼠标悬停时显示拖拽光标

### 宽度限制
- 最小值：25vw
- 最大值：55vw
- 默认值：45vw

### 响应式设计
- 移动端：禁用拖拽功能，使用全宽显示
- 桌面端：支持拖拽调整

### 状态管理
- 拖拽过程中实时更新宽度
- 拖拽结束后保持最终宽度
- 支持平滑的过渡动画

## 技术实现

### 事件处理
```typescript
const handleMouseDown = useCallback((e: React.MouseEvent) => {
  // 开始拖拽
  const startX = e.clientX;
  const startWidth = sidePanelWidth;
  
  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = startX - e.clientX;
    const newWidth = startWidth + (deltaX / window.innerWidth) * 100;
    onWidthChange(newWidth);
  };
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}, [sidePanelWidth, onWidthChange]);
```

### 宽度计算
- 基于鼠标移动距离计算新的宽度百分比
- 使用 `Math.max(25, Math.min(55, newWidth))` 限制范围
- 通过 `vw` 单位实现响应式宽度

### 组件通信
- 通过props将宽度值从顶层传递到各个子组件
- 使用回调函数处理宽度变化和拖拽状态

## 兼容性
- 保持了原有的所有功能
- 向后兼容，不影响现有代码
- 移动端体验保持不变
- 支持所有现有的工具面板功能

## 测试
- 构建测试通过
- 无TypeScript错误
- 保持了原有的警告级别
- 功能完整性验证通过
