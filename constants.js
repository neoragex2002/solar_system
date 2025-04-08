// 太阳配置
export const SUN_CONFIG = {
  radius: 5,
  color: 0xffff00,
  glow: {
    radius: 8,
    color: 0xffaa00,
    opacity: 0.3,
    pulseScale: 0.1
  }
};

// 行星配置
export const PLANETS_DATA = [
  { radius: 0.4, orbitRadius: 10, speed: 0.04, color: 0x8a8a8a, name: "水星" },
  { radius: 0.6, orbitRadius: 15, speed: 0.03, color: 0xe6c229, name: "金星" },
  { radius: 0.6, orbitRadius: 20, speed: 0.02, color: 0x3498db, name: "地球" },
  { radius: 0.4, orbitRadius: 25, speed: 0.015, color: 0xe74c3c, name: "火星" },
  { radius: 1.3, orbitRadius: 35, speed: 0.01, color: 0xe67e22, name: "木星" },
  { radius: 1.1, orbitRadius: 45, speed: 0.008, color: 0xf1c40f, name: "土星" },
  { radius: 0.9, orbitRadius: 55, speed: 0.006, color: 0x1abc9c, name: "天王星" },
  { radius: 0.8, orbitRadius: 65, speed: 0.004, color: 0x3498db, name: "海王星" },
  { radius: 0.3, orbitRadius: 75, speed: 0.002, color: 0x9b59b6, name: "冥王星" }
];

// 光照配置
export const LIGHT_CONFIG = {
  ambient: 0x404040,
  directional: {
    color: 0xffffff,
    intensity: 1,
    position: { x: 0, y: 1, z: 0 }
  },
  sunLight: {
    color: 0xffff99,
    intensity: 1,
    distance: 100
  }
};

// 相机初始位置
export const CAMERA_POSITION = { x: 0, y: 50, z: 100 };

// 轨道线配置
export const ORBIT_CONFIG = {
  color: 0x555555,
  segments: 64
};

// 标签配置
export const LABEL_CONFIG = {
  offsetY: 30,
  background: 'rgba(0, 0, 0, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.3)'
};

// 速度控制配置
export const SPEED_CONTROL_CONFIG = {
  min: 0.1,
  max: 20,
  step: 0.1,
  defaultValue: 1
};
