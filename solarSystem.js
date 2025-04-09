/**
 * 太阳系模拟 - 主配置文件
 */
const SolarSystemConfig = {
  SUN_CONFIG: {
    radius: 5,
    color: 0xffff00,
    glow: {
      radius: 8,
      color: 0xffaa00,
      opacity: 0.3,
      pulseScale: 0.1
    }
  },

  PLANETS_DATA: [
    { radius: 0.4, semiMajorAxis: 10, eccentricity: 0.2056, speed: 0.04, color: 0x8a8a8a, name: "水星", orbitColor: 0x8a8a8a },
    { radius: 0.6, semiMajorAxis: 15, eccentricity: 0.0068, speed: 0.03, color: 0xe6c229, name: "金星", orbitColor: 0xe6c229 },
    { radius: 0.6, semiMajorAxis: 20, eccentricity: 0.0167, speed: 0.02, color: 0x3498db, name: "地球", orbitColor: 0x3498db },
    { radius: 0.4, semiMajorAxis: 25, eccentricity: 0.0934, speed: 0.015, color: 0xe74c3c, name: "火星", orbitColor: 0xe74c3c },
    { radius: 0.08, semiMajorAxis: 30, eccentricity: 0.079, speed: 0.008, color: 0xCCCCCC, name: "谷神星", orbitColor: 0x888888 },
    { radius: 1.3, semiMajorAxis: 35, eccentricity: 0.0484, speed: 0.01, color: 0xe67e22, name: "木星", orbitColor: 0xe67e22 },
    { radius: 1.1, semiMajorAxis: 45, eccentricity: 0.0542, speed: 0.008, color: 0xf1c40f, name: "土星", orbitColor: 0xf1c40f },
    { radius: 0.9, semiMajorAxis: 55, eccentricity: 0.0472, speed: 0.006, color: 0x1abc9c, name: "天王星", orbitColor: 0x1abc9c },
    { radius: 0.8, semiMajorAxis: 65, eccentricity: 0.0086, speed: 0.004, color: 0x3498db, name: "海王星", orbitColor: 0x3498db },
    { radius: 0.3, semiMajorAxis: 75, eccentricity: 0.2488, speed: 0.002, color: 0x9b59b6, name: "冥王星", orbitColor: 0x9b59b6 },
    { radius: 0.2, semiMajorAxis: 506, eccentricity: 0.855, speed: 0.0005, color: 0xcc6666, name: "赛德娜", orbitColor: 0xcc6666 }
  ],

  LIGHT_CONFIG: {
    ambient: 0x404040,
    directional: { color: 0xffffff, intensity: 1, position: { x: 0, y: 1, z: 0 } },
    sunLight: { color: 0xffff99, intensity: 1, distance: 100 }
  },

  CAMERA_POSITION: { x: 0, y: 0, z: 150 },
  ORBIT_CONFIG: { color: 0x555555, segments: 64, opacity: 0.7 },
  LABEL_CONFIG: { offsetY: 30, background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(255, 255, 255, 0.3)' },
  SPEED_CONTROL_CONFIG: { min: 0.1, max: 200, step: 0.1, defaultValue: 1 }
};

// ======================
// 主程序初始化
// ======================

// 核心Three.js对象
const scene = new THREE.Scene();
const camera = initCamera();
const renderer = initRenderer();
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// 太阳系对象
const { sun, sunLabel } = createSun();
const planets = createPlanets();
if (!planets || planets.length === 0) {
  console.error('Failed to create planets!');
}
const axesHelper = initAxesHelper(sun);

// 初始化光照
initLights();

// 后期处理
let composer, bloomPass;
initPostProcessing();

// 状态控制
let simulationSpeed = SolarSystemConfig.SPEED_CONTROL_CONFIG.defaultValue;
initSpeedControl();

// 帧率控制变量
let lastTime = 0;
const frameRate = 60;
const frameInterval = 1000 / frameRate;

// 启动动画循环
animate(performance.now());

// ======================
// 初始化函数
// ======================

function initCamera() {
  const camera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
  );
  camera.position.set(0, 0, 30);
  camera.far = 1000; // Increased to see Sedna's orbit
  camera.lookAt(0, 0, 0);
  return camera;
}

function initRenderer() {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  return renderer;
}

function initAxesHelper(sun) {
  const helper = new THREE.AxesHelper(15);
  helper.lineWidth = 3;
  helper.position.copy(sun.position);
  scene.add(helper);
  return helper;
}

function initPostProcessing() {
  const renderScene = new THREE.RenderPass(scene, camera);
  
  bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5, 1, 0.1 // Lower threshold for better distant object visibility
  );
  bloomPass.enabled = true;
  
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);
}

// ======================
// 光照系统
// ======================

function initLights() {
  // 环境光
  scene.add(new THREE.AmbientLight(SolarSystemConfig.LIGHT_CONFIG.ambient));
  
  // 方向光
  const directionalLight = new THREE.DirectionalLight(
    SolarSystemConfig.LIGHT_CONFIG.directional.color, 
    SolarSystemConfig.LIGHT_CONFIG.directional.intensity
  );
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);
  
  // 太阳光
  scene.add(new THREE.PointLight(
    SolarSystemConfig.LIGHT_CONFIG.sunLight.color,
    SolarSystemConfig.LIGHT_CONFIG.sunLight.intensity,
    SolarSystemConfig.LIGHT_CONFIG.sunLight.distance
  ));
}

// ======================
// 太阳创建
// ======================

function createSun() {
  // 创建太阳网格
  const geometry = new THREE.SphereGeometry(
    SolarSystemConfig.SUN_CONFIG.radius, 
    64, 
    64
  );
  const material = new THREE.MeshBasicMaterial({
    color: SolarSystemConfig.SUN_CONFIG.color,
    transparent: true,
    opacity: 0.9
  });
  const sun = new THREE.Mesh(geometry, material);
  scene.add(sun);

  // 创建标签
  const sunLabel = createSunLabel('太阳');
  
  return { 
    sun, 
    sunLabel 
  };
}

function createPlanets() {
  if (!Array.isArray(SolarSystemConfig.PLANETS_DATA)) {
    throw new Error('PLANETS_DATA 必须是数组');
  }

  return SolarSystemConfig.PLANETS_DATA.map((planetData) => {
    if (!planetData.name) {
      console.warn('行星数据缺少名称', planetData);
    }
    
    try {
      const planet = createPlanet(planetData);
      createOrbitLine(planetData, planetData.orbitColor);
      return planet;
    } catch (e) {
      console.error(`创建行星 ${planetData.name || '未知'} 失败:`, e);
      return null;
    }
  }).filter(Boolean); // 过滤掉创建失败的行星
}

function createPlanet({ radius, semiMajorAxis, eccentricity, speed, color, name, initialAngle = 0 }) {
  if (typeof semiMajorAxis !== 'number' || semiMajorAxis <= 0) {
    throw new Error(`行星 ${name || '未知'} 必须提供有效的 semiMajorAxis 参数`);
  }
  if (typeof eccentricity !== 'number' || eccentricity < 0 || eccentricity >= 1) {
    throw new Error(`行星 ${name || '未知'} 的 eccentricity 必须在 [0,1) 范围内`);
  }

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.MeshPhongMaterial({ color })
  );
  
  // 使用开普勒方程计算初始位置（考虑initialAngle）
  const trueAnomaly = initialAngle;
  const semiLatusRectum = semiMajorAxis * (1 - eccentricity * eccentricity);
  const r = semiLatusRectum / (1 + eccentricity * Math.cos(trueAnomaly));
  
  planet.position.set(
    r * Math.cos(trueAnomaly), // X
    r * Math.sin(trueAnomaly), // Y
    0                          // Z
  );
  scene.add(planet);

  const label = createPlanetLabel(name);
  
  // 将轨道参数存储在mesh的userData中
  planet.userData = { 
    semiMajorAxis,
    eccentricity,
    name,
    initialAngle: 0
  };
  
  return {
    mesh: planet,
    label,
    speed,
    angle: 0 // 所有行星从近地点开始（θ=0）
  };
}

function createSunLabel(name) {
  const label = document.createElement('div');
  label.className = 'planet-label sun-label';
  label.textContent = name;
  document.body.appendChild(label);
  return label;
}

function createPlanetLabel(name) {
  const label = document.createElement('div');
  label.className = 'planet-label';
  label.textContent = name;
  document.body.appendChild(label);
  return label;
}

function createOrbitLine(planetData, color) {
  const { semiMajorAxis, eccentricity = 0 } = planetData;
  if (typeof semiMajorAxis === 'undefined') {
    throw new Error('必须提供 semiMajorAxis 参数');
  }
  const segments = SolarSystemConfig.ORBIT_CONFIG.segments;
  
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    // 严格右手坐标系：X右，Y上，Z屏幕外
    const semiLatusRectum = semiMajorAxis * (1 - eccentricity * eccentricity);
    const r = semiLatusRectum / (1 + eccentricity * Math.cos(angle));
    points.push(new THREE.Vector3(
      r * Math.cos(angle),  // X轴：右侧为正
      r * Math.sin(angle), // Y轴：上为正
      0                    // Z轴：屏幕外为正（XY平面运动）
    ));
  }
  
  const orbitLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color: color || SolarSystemConfig.ORBIT_CONFIG.color,
      transparent: true,
      opacity: color ? 0.7 : SolarSystemConfig.ORBIT_CONFIG.opacity,
      linewidth: 2
    })
  );
  scene.add(orbitLine);
  return orbitLine;
}

function initSpeedControl() {
  const speedSlider = document.getElementById('speed-slider');
  const speedValue = document.getElementById('speed-value');

  if (!speedSlider || !speedValue) return;

  speedSlider.min = SolarSystemConfig.SPEED_CONTROL_CONFIG.min;
  speedSlider.max = SolarSystemConfig.SPEED_CONTROL_CONFIG.max;
  speedSlider.step = SolarSystemConfig.SPEED_CONTROL_CONFIG.step;
  speedSlider.value = SolarSystemConfig.SPEED_CONTROL_CONFIG.defaultValue;
  speedValue.textContent = `${SolarSystemConfig.SPEED_CONTROL_CONFIG.defaultValue}x`;

  const updateSpeed = () => {
    simulationSpeed = parseFloat(speedSlider.value);
    speedValue.textContent = `${simulationSpeed.toFixed(1)}x`;
  };

  speedSlider.addEventListener('input', updateSpeed);
  speedSlider.addEventListener('change', updateSpeed);
}

function updatePlanetPositions() {
  planets.forEach(planet => {
    const { eccentricity = 0 } = planet;
    const semiMajorAxis = planet.mesh.userData.semiMajorAxis;
    if (typeof semiMajorAxis === 'undefined') {
      console.error('行星缺少 semiMajorAxis 参数', planet.mesh.name || '未知行星');
      return;
    }
    
    // 简化计算，使用固定角度增量
    planet.angle += planet.speed * simulationSpeed * 0.01;
    
    // 精确计算椭圆轨道位置（考虑初始角度）
    const initialAngle = planet.mesh.userData.initialAngle || 0;
    const trueAnomaly = initialAngle + planet.angle;
    const semiLatusRectum = semiMajorAxis * (1 - eccentricity * eccentricity);
    const r = semiLatusRectum / (1 + eccentricity * Math.cos(trueAnomaly));
    
    // 严格右手坐标系：X右，Y上，Z屏幕外
    planet.mesh.position.x = r * Math.cos(trueAnomaly);  // X轴：右侧为正
    planet.mesh.position.y = r * Math.sin(trueAnomaly);  // Y轴：上为正
    planet.mesh.position.z = 0;                         // Z轴：屏幕外为正（XY平面运动）
    
    
    // 归一化角度
    if (planet.angle > Math.PI * 2) planet.angle -= Math.PI * 2;
    if (planet.angle < 0) planet.angle += Math.PI * 2;
    
    planet.mesh.rotation.y += 0.01 * simulationSpeed;
    updateLabelPosition(planet);
  });
}

function updateSunLabelPosition() {
  const sunWorldPos = new THREE.Vector3();
  sun.getWorldPosition(sunWorldPos);
  const screenPos = sunWorldPos.clone().project(camera);
  
  if (screenPos.z > 1 || screenPos.z < -1) {
    sunLabel.style.display = 'none';
    return;
  }

  const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight; // 使用Y坐标

  sunLabel.style.display = 'block';
  sunLabel.style.top = `${y}px`;
  sunLabel.style.left = `${x}px`;
}

function updateLabelPosition(planet) {
  const planetWorldPos = new THREE.Vector3();
  planet.mesh.getWorldPosition(planetWorldPos);
  const screenPos = planetWorldPos.clone().project(camera);
  
  // 检查是否在视锥体内
  if (screenPos.z > 1 || screenPos.z < -1) {
    planet.label.style.display = 'none';
    return;
  }

  const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(screenPos.z * 0.5) + 0.5) * window.innerHeight - 
           (planet.labelOffset || SolarSystemConfig.LABEL_CONFIG.offsetY);

  planet.label.style.display = 'block';
  planet.label.style.left = `${x}px`;
  planet.label.style.top = `${y}px`;
}


function animate(timestamp) {
  requestAnimationFrame(animate);
  
  // Frame rate limiting
  const deltaTime = timestamp - lastTime;
  if (deltaTime < frameInterval) return;
  lastTime = timestamp - (deltaTime % frameInterval);
  
  sun.rotation.y += 0.005;
  updatePlanetPositions();
  updateSunLabelPosition();
  
  // 太阳光晕效果（只需设置一次）
  if (bloomPass && !bloomPass._initialized) {
    bloomPass.strength = 2.5;
    bloomPass.radius = 0.6; 
    bloomPass.threshold = 0.7;
    bloomPass._initialized = true;
  }
  
  controls.update();
  composer.render();
}

// 窗口大小变化处理
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// 清理标签
window.addEventListener('beforeunload', () => {
  // 清理标签
  if (sunLabel && sunLabel.parentNode) {
    sunLabel.parentNode.removeChild(sunLabel);
  }
  planets.forEach(planet => {
    if (planet.label && planet.label.parentNode) {
      planet.label.parentNode.removeChild(planet.label);
    }
  });
});

