# 3D太阳系模拟系统

使用Vibe Programming创建的一个基于WebGL和Three.js构建的3D交互式太阳系可视化系统，精确模拟太阳系主要天体的运行轨道和物理特性。

<img src="imgs/screenshot.jpg" alt="太阳系模拟运行截图" width="600"/>

## 功能特性

- 逼真的太阳模型，带有发光效果
- 完整的太阳系行星系统（包括水星到冥王星）
- 小行星带和柯伊伯带模拟
- 实时速度调节（0.1x-1000x）
- 交互式3D视角控制（旋转/缩放/平移）
- 智能行星标签显示
- 自适应光照系统
- 响应式设计，适配不同屏幕尺寸

## 快速开始

1. 启动程序：
    ```bash
    git clone https://github.com/neoragex2002/solar-system.git
    cd solar-system
    python3 -m http.server 8000
    ```
2. 浏览器访问：
    ```
    http://localhost:8000
    ```

## 使用说明

- 使用鼠标拖动旋转视角
- 滚轮缩放视图
- 右侧拖动平移视角
- 顶部滑块控制模拟速度
- 行星标签会自动跟随显示

## 技术架构

- **核心框架**：Three.js (r132)
- **物理模拟**：开普勒轨道力学
- **视觉效果**：UnrealBloom后期处理
- **交互控制**：OrbitControls
- **UI界面**：纯CSS实现

## 项目结构

```
solar-system/
├── index.html          # 主入口文件
├── solarSystem.js      # 核心3D逻辑
├── styles.css          # 样式表
└── README.md           # 项目文档
```

## 天体数据

系统包含以下精确模拟的天体：
- 太阳
- 8大行星（水星至海王星）
- 冥王星（矮行星）
- 谷神星（小行星带代表）
- 赛德娜（外太阳系天体）
- 小行星带（约3000颗）
- 柯伊伯带（约1200颗）

## 许可证

本项目采用 MIT 许可证

## 贡献指南

欢迎AI提交Issue或Pull Request！
