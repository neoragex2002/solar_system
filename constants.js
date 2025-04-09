// 全局常量配置
const SUN_CONFIG = {
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
const PLANETS_DATA = [
  { 
    radius: 0.4, 
    orbitRadius: 10, 
    semiMajorAxis: 10, // 半长轴
    eccentricity: 0.2056, // 偏心率(水星实际0.2056)
    speed: 0.04, 
    color: 0x8a8a8a, 
    name: "水星" 
  },
  { 
    radius: 0.6, 
    orbitRadius: 15, 
    semiMajorAxis: 15,
    eccentricity: 0.0068, // 金星实际0.0068
    speed: 0.03, 
    color: 0xe6c229, 
    name: "金星" 
  },
  { 
    radius: 0.6, 
    orbitRadius: 20, 
    semiMajorAxis: 20,
    eccentricity: 0.0167,
    speed: 0.02, 
    color: 0x3498db, 
    name: "地球",
    orbitColor: 0x3498db
  },
  { 
    radius: 0.4, 
    orbitRadius: 25, 
    semiMajorAxis: 25,
    eccentricity: 0.0934,
    speed: 0.015, 
    color: 0xe74c3c, 
    name: "火星",
    orbitColor: 0xe74c3c
  },
  { 
    radius: 0.08, 
    orbitRadius: 30, 
    semiMajorAxis: 30,
    eccentricity: 0.079,
    speed: 0.008, 
    color: 0xCCCCCC, 
    name: "谷神星",
    orbitColor: 0x888888 
  },
  { 
    radius: 1.3, 
    orbitRadius: 35, 
    semiMajorAxis: 35,
    eccentricity: 0.0484,
    speed: 0.01, 
    color: 0xe67e22, 
    name: "木星",
    orbitColor: 0xe67e22
  },
  { 
    radius: 1.1, 
    orbitRadius: 45, 
    semiMajorAxis: 45,
    eccentricity: 0.0542,
    speed: 0.008, 
    color: 0xf1c40f, 
    name: "土星",
    orbitColor: 0xf1c40f
  },
  { 
    radius: 0.9, 
    orbitRadius: 55, 
    semiMajorAxis: 55,
    eccentricity: 0.0472,
    speed: 0.006, 
    color: 0x1abc9c, 
    name: "天王星",
    orbitColor: 0x1abc9c
  },
  { 
    radius: 0.8, 
    orbitRadius: 65, 
    semiMajorAxis: 65,
    eccentricity: 0.0086,
    speed: 0.004, 
    color: 0x3498db, 
    name: "海王星",
    orbitColor: 0x3498db
  },
  { 
    radius: 0.3, 
    orbitRadius: 75, 
    semiMajorAxis: 75,
    eccentricity: 0.2488,
    speed: 0.002, 
    color: 0x9b59b6, 
    name: "冥王星",
    orbitColor: 0x9b59b6
  },
  { 
    radius: 0.2,  // 增大可见性
    orbitRadius: 76.1,
    semiMajorAxis: 76.1,
    eccentricity: 0.855,
    speed: 0.0001,  // 适当加快速度
    color: 0xFF6633, 
    name: "塞德娜",
    orbitColor: 0xFF6633,
    labelOffset: 40,
    orbitSegments: 256  // 更高精度的轨道
  }
];

// 光照配置
const LIGHT_CONFIG = {
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
const CAMERA_POSITION = { x: 0, y: -150, z: 50 }; // 从上方斜视角

// 轨道线配置
const ORBIT_CONFIG = {
  color: 0x555555,
  segments: 64
};

// 标签配置
const LABEL_CONFIG = {
  offsetY: 30,
  background: 'rgba(0, 0, 0, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.3)'
};

// 速度控制配置
const SPEED_CONTROL_CONFIG = {
  min: 0.1,
  max: 20,
  step: 0.1,
  defaultValue: 1
};

// 暴露全局变量
window.SolarSystemConfig = {
  SUN_CONFIG,
  PLANETS_DATA,
  LIGHT_CONFIG,
  CAMERA_POSITION,
  ORBIT_CONFIG,
  LABEL_CONFIG,
  SPEED_CONTROL_CONFIG
};
