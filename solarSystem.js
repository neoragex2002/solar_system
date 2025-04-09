/**
 * 太阳系模拟 - 主配置文件
 * https://zh.wikipedia.org/wiki/%E8%B3%BD%E5%BE%B7%E5%A8%9C_(%E5%B0%8F%E8%A1%8C%E6%98%9F)#/media/File:Oort_cloud_Sedna_orbit_zh-cn.svg
 */

// 全局配置
const SolarSystemConfig = {
  SUN_CONFIG: {
    radius: 5,
    color: 0xffaa00
  },

  PLANETS_DATA: [
    { radius: 0.4, semiMajorAxis: 10, eccentricity: 0.2056, speed: 0.04, color: 0x8a8a8a, name: "水星", orbitColor: 0x8a8a8a, trueAnomaly: 4.935 },
    { radius: 0.6, semiMajorAxis: 15, eccentricity: 0.0068, speed: 0.03, color: 0xe6c229, name: "金星", orbitColor: 0xe6c229, trueAnomaly: 3.347 },
    { radius: 0.6, semiMajorAxis: 20, eccentricity: 0.0167, speed: 0.02, color: 0x3498db, name: "地球", orbitColor: 0x3498db, trueAnomaly: 4.578 },
    { radius: 0.4, semiMajorAxis: 25, eccentricity: 0.0934, speed: 0.015, color: 0xe74c3c, name: "火星", orbitColor: 0xe74c3c, trueAnomaly: 5.919 },
    { radius: 0.08, semiMajorAxis: 30, eccentricity: 0.079, speed: 0.008, color: 0xCCCCCC, name: "谷神星", orbitColor: 0x888888, trueAnomaly: 0.785 },
    { radius: 1.3, semiMajorAxis: 35, eccentricity: 0.0484, speed: 0.01, color: 0xe67e22, name: "木星", orbitColor: 0xe67e22, trueAnomaly: 0.257 },
    { radius: 1.1, semiMajorAxis: 45, eccentricity: 0.0542, speed: 0.008, color: 0xf1c40f, name: "土星", orbitColor: 0xf1c40f, trueAnomaly: 1.884 },
    { radius: 0.9, semiMajorAxis: 55, eccentricity: 0.0472, speed: 0.006, color: 0x1abc9c, name: "天王星", orbitColor: 0x1abc9c, trueAnomaly: 2.984 },
    { radius: 0.8, semiMajorAxis: 65, eccentricity: 0.0086, speed: 0.004, color: 0x3498db, name: "海王星", orbitColor: 0x3498db, trueAnomaly: 4.512 },
    { radius: 0.3, semiMajorAxis: 75, eccentricity: 0.2488, speed: 0.002, color: 0x9b59b6, name: "冥王星", orbitColor: 0x9b59b6, trueAnomaly: 5.267 },
    { radius: 0.2, semiMajorAxis: 506, eccentricity: 0.855, speed: 0.0005, color: 0xcc6666, name: "赛德娜", orbitColor: 0xcc6666, trueAnomaly: 3.141 }
  ],

  LIGHT_CONFIG: {
    ambient: 0x404040,
    directional: { color: 0xffffff, intensity: 1, position: { x: 0, y: 1, z: 0 } },
    sunLight: { color: 0xffff99, intensity: 1, distance: 100 }
  },

  CAMERA_POSITION: { x: 0, y: 0, z: 150 },
  ORBIT_CONFIG: { color: 0x555555, segments: 64, opacity: 0.7 },
  LABEL_CONFIG: { offsetY: 30, background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(255, 255, 255, 0.3)' },
  SPEED_CONTROL_CONFIG: { min: 1, max: 1000, step: 1, defaultValue: 1 },

  ASTEROID_BELT_CONFIG: {
    count: 3000,
    innerSemiMajorAxis: 25,
    outerSemiMajorAxis: 35,
    eccentricity: 0.07,
    color: 0x888888,
    size: 0.1,
    rotationSpeed: 0.002
  },

  KUIPER_BELT_CONFIG: {
    count: 1200,
    innerSemiMajorAxis: 70,
    outerSemiMajorAxis: 90,
    eccentricity: 0.128,
    color: 0x66ccff,
    size: 0.15,
    rotationSpeed: 0.0005
  }
};

// 全局变量
let scene, camera, renderer, controls;
let composer, bloomPass;
let sun, planets = [], asteroidBelt, kuiperBelt, axesHelper;
let sunLabel, simulationSpeed = 1;
let lastTime = 0;
const frameRate = 60;
const frameInterval = 1000 / frameRate;

// 初始化函数
function init() {
  // 基础场景设置
  scene = new THREE.Scene();

  // 相机初始化
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 30);
  camera.far = 1000;
  camera.lookAt(0, 0, 0);

  // 渲染器初始化
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // 控制器初始化
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: THREE.MOUSE.DOLLY
  };

  // 后期处理效果初始化
  initComposer();

  // 光照系统初始化
  initLights();

  // 创建太阳、行星与小行星带
  sun = createSun();
  sunLabel = createSunLabel('太阳');
  planets = createPlanets();
  asteroidBelt = createAsteroidBelt();
  kuiperBelt = createKuiperBelt();
  axesHelper = createAxesHelper();

  // 初始化速度控制
  initSpeedControl();

  // 添加事件监听
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('beforeunload', cleanup);

  // 启动动画循环
  animate(performance.now());
}

// 后期处理效果初始化
function initComposer() {
  const renderScene = new THREE.RenderPass(scene, camera);

  bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, 1.2, 0.05
  );
  bloomPass.enabled = true;

  composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);
}

// 光照系统初始化
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

// 创建坐标轴辅助
function createAxesHelper() {
  const helper = new THREE.AxesHelper(15);
  helper.lineWidth = 3;
  helper.position.copy(sun.position);
  scene.add(helper);
  return helper;
}

// 太阳创建
function createSun() {
  const geometry = new THREE.SphereGeometry(
    SolarSystemConfig.SUN_CONFIG.radius,
    64, 64
  );
  const material = new THREE.MeshBasicMaterial({
    color: SolarSystemConfig.SUN_CONFIG.color,
    transparent: true,
    opacity: 0.9
  });
  const sun = new THREE.Mesh(geometry, material);
  scene.add(sun);
  return sun;
}

// 创建行星
function createPlanets() {
  const planets = [];

  for (const planetData of SolarSystemConfig.PLANETS_DATA) {
    if (!planetData.name) {
      console.warn('行星数据缺少名称:', planetData);
      continue;
    }

    try {
      const planet = createPlanet(planetData);
      createOrbitLine(planetData, planetData.orbitColor);
      planets.push(planet);
    } catch (error) {
      console.error(`创建行星 ${planetData.name} 失败:`, error);
    }
  }

  return planets;
}

// 创建单个行星
function createPlanet({ radius, semiMajorAxis, eccentricity = 0, speed, color, name, trueAnomaly = 0 }) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.MeshPhongMaterial({ color })
  );

  const initialPos = getOrbitalPosition(semiMajorAxis, eccentricity, trueAnomaly);
  mesh.position.copy(initialPos);
  scene.add(mesh);

  const label = createPlanetLabel(name);

  mesh.userData = { semiMajorAxis, eccentricity, name };

  return {
    mesh,
    label,
    speed,
    angle: trueAnomaly
  };
}

// 创建小行星带
function createAsteroidBelt() {
  const { count, innerSemiMajorAxis, outerSemiMajorAxis, eccentricity, color, size } = SolarSystemConfig.ASTEROID_BELT_CONFIG;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const semiMajorAxis = innerSemiMajorAxis + Math.random() * (outerSemiMajorAxis - innerSemiMajorAxis);
    const angle = Math.random() * Math.PI * 2;

    const pos = getOrbitalPosition(semiMajorAxis, eccentricity, angle);
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;

    // 随机颜色变化
    colors[i * 3] = color + Math.random() * 0.2;
    colors[i * 3 + 1] = color + Math.random() * 0.2;
    colors[i * 3 + 2] = color + Math.random() * 0.2;

    sizes[i] = size * (0.5 + Math.random() * 0.5);
  }

  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: size,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });

  const asteroidBelt = new THREE.Points(particles, material);
  scene.add(asteroidBelt);
  return asteroidBelt;
}

// 创建柯伊伯带
function createKuiperBelt() {
  const { count, innerSemiMajorAxis, outerSemiMajorAxis, eccentricity, color, size } = SolarSystemConfig.KUIPER_BELT_CONFIG;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const semiMajorAxis = innerSemiMajorAxis + Math.random() * (outerSemiMajorAxis - innerSemiMajorAxis);
    const angle = Math.random() * Math.PI * 2;

    const pos = getOrbitalPosition(semiMajorAxis, eccentricity, angle);
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z * (0.5 + Math.random()); // 添加Z轴分布

    // 冰蓝色调变化
    colors[i * 3] = color + Math.random() * 0.1;
    colors[i * 3 + 1] = color + Math.random() * 0.1;
    colors[i * 3 + 2] = color + Math.random() * 0.2;

    sizes[i] = size * (0.5 + Math.random() * 0.5);
  }

  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: size,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true
  });

  const kuiperBelt = new THREE.Points(particles, material);
  scene.add(kuiperBelt);
  return kuiperBelt;
}

// 创建轨道线
function createOrbitLine(planetData, color) {
  const { semiMajorAxis, eccentricity = 0 } = planetData;
  const segments = SolarSystemConfig.ORBIT_CONFIG.segments;
  const points = [];

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const pos = getOrbitalPosition(semiMajorAxis, eccentricity, angle);
    points.push(pos);
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: color || SolarSystemConfig.ORBIT_CONFIG.color,
    transparent: true,
    opacity: color ? 0.7 : SolarSystemConfig.ORBIT_CONFIG.opacity
  });

  const orbitLine = new THREE.Line(geometry, material);
  scene.add(orbitLine);
  return orbitLine;
}

// 创建标签
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

// 轨道位置计算
function getOrbitalPosition(semiMajorAxis, eccentricity, angle) {
  const semiLatusRectum = semiMajorAxis * (1 - eccentricity * eccentricity);
  const r = semiLatusRectum / (1 + eccentricity * Math.cos(angle));
  return new THREE.Vector3(
    r * Math.cos(angle),
    r * Math.sin(angle),
    0
  );
}

// 初始化速度控制器
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

// 更新位置
function updateSunLabelPosition() {
  const sunWorldPos = new THREE.Vector3();
  sun.getWorldPosition(sunWorldPos);
  const screenPos = sunWorldPos.clone().project(camera);

  if (screenPos.z > 1 || screenPos.z < -1) {
    sunLabel.style.display = 'none';
    return;
  }

  const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

  sunLabel.style.display = 'block';
  sunLabel.style.top = `${y}px`;
  sunLabel.style.left = `${x}px`;
}

function updateLabelPosition(planet) {
  const planetWorldPos = new THREE.Vector3();
  planet.mesh.getWorldPosition(planetWorldPos);
  const screenPos = planetWorldPos.clone().project(camera);

  if (screenPos.z > 1 || screenPos.z < -1) {
    planet.label.style.display = 'none';
    return;
  }

  const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight -
    (planet.labelOffset || SolarSystemConfig.LABEL_CONFIG.offsetY);

  planet.label.style.display = 'block';
  planet.label.style.left = `${x}px`;
  planet.label.style.top = `${y}px`;
}

// 更新行星位置
function updatePlanetPositions() {
  planets.forEach(planet => {
    const semiMajorAxis = planet.mesh.userData.semiMajorAxis;
    const eccentricity = planet.mesh.userData.eccentricity;

    planet.angle += planet.speed * simulationSpeed * 0.01;
    if (planet.angle > Math.PI * 2) planet.angle -= Math.PI * 2;

    const pos = getOrbitalPosition(semiMajorAxis, eccentricity, planet.angle);
    planet.mesh.position.copy(pos);
    planet.mesh.rotation.z += 0.01 * simulationSpeed;
  });
}

// 更新小行星带
function updateAsteroidBelts() {
  asteroidBelt.rotation.z += SolarSystemConfig.ASTEROID_BELT_CONFIG.rotationSpeed * simulationSpeed * 0.001;
  kuiperBelt.rotation.z += SolarSystemConfig.KUIPER_BELT_CONFIG.rotationSpeed * simulationSpeed * 0.001;
}

// 更新所有行星标签
function updatePlanetLabels() {
  planets.forEach(planet => {
    updateLabelPosition(planet);
  });
}

// 清理函数
function cleanup() {
  if (sunLabel?.parentNode) sunLabel.parentNode.removeChild(sunLabel);
  planets.forEach(p => p.label?.parentNode?.removeChild(p.label));
}

// 窗口尺寸变化处理
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

// 动画循环
function animate(timestamp) {
  requestAnimationFrame(animate);

  // 帧率控制
  const deltaTime = timestamp - lastTime;
  if (deltaTime < frameInterval) return;
  lastTime = timestamp - (deltaTime % frameInterval);

  // 更新天体
  sun.rotation.z += 0.005;
  updatePlanetPositions();
  updateAsteroidBelts();

  // 更新标签
  updateSunLabelPosition();
  updatePlanetLabels();

  // 渲染
  controls.update();
  composer.render();
}

// 启动应用
window.onload = init;