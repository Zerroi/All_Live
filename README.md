# 斗鱼直播

基于 Vue 3 + Vite + TypeScript + pnpm 构建的斗鱼直播观看平台。

## 功能特性

- 📺 直播流播放
- 💬 实时弹幕显示
- 🎨 现代化 UI 设计
- 🔄 自动重连机制
- ⚡ TypeScript 类型安全

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **TypeScript** - JavaScript 的超集
- **Vue Router** - Vue.js 官方路由
- **Pinia** - Vue 状态管理库
- **pnpm** - 快速、节省磁盘空间的包管理器

## 项目结构

```
douyu-live/
├── src/
│   ├── components/      # 组件
│   │   ├── DanmakuDisplay.vue   # 弹幕显示组件
│   │   └── LivePlayer.vue       # 直播播放器组件
│   ├── services/        # 服务层
│   │   ├── douyuDanmaku.ts      # 斗鱼弹幕服务
│   │   └── douyuLive.ts         # 斗鱼直播流服务
│   ├── types/           # 类型定义
│   │   └── danmaku.ts           # 弹幕类型定义
│   ├── utils/           # 工具函数
│   │   └── binary.ts             # 二进制读写工具
│   ├── views/           # 页面
│   │   ├── Home.vue             # 首页
│   │   └── Room.vue             # 直播间页面
│   ├── router/          # 路由配置
│   │   └── index.ts
│   ├── App.vue          # 根组件
│   ├── main.ts          # 入口文件
│   └── style.css        # 全局样式
├── index.html           # HTML 模板
├── package.json         # 项目配置
├── tsconfig.json        # TypeScript 配置
├── vite.config.ts       # Vite 配置
└── README.md            # 项目说明
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

## 使用说明

1. 访问首页
2. 输入斗鱼直播间的房间ID
3. 点击"进入直播间"按钮
4. 开始观看直播和弹幕

## 弹幕协议

本项目实现了斗鱼弹幕协议的解析，包括：

- WebSocket 连接管理
- 心跳保活机制
- 斗鱼 STT 格式解析
- 二进制数据编解码
- 自动重连功能

## 注意事项

- 直播流地址获取可能需要根据斗鱼 API 变化进行调整
- 部分房间可能由于版权或地区限制无法观看
- 弹幕连接需要稳定的网络环境

## 许可证

MIT
