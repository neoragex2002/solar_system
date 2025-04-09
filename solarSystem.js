// 使用全局变量

// 初始化场景
const scene = new THREE.Scene();

// 创建太阳系
const { sun, sunLabel } = createSun();

// 添加坐标系辅助（红=X，绿=Y，蓝=Z）
const axesHelper = new THREE.AxesHelper(15); // 更大的坐标系
axesHelper.lineWidth = 3; // 更粗的线条
axesHelper.position.copy(sun.position); // 与太阳中心对齐
scene.add(axesHelper);

// 初始化相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 30); // 从正前方看向XY平面
camera.lookAt(0, 0, 0);

// 初始化渲染器
const renderer = initRenderer();
document.body.appendChild(renderer.domElement);

// 初始化控制器
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.update();

// 初始化光照
initLights();

const planets = createPlanets();

// 初始化后期处理
let composer, bloomPass;
function initPostProcessing() {
    const renderScene = new THREE.RenderPass(scene, camera);
    
    bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.5,   // strength
        1,   // radius
        0.3    // threshold
    );
    bloomPass.enabled = true;
    
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
}
initPostProcessing();

// 初始化速度控制
let simulationSpeed = SolarSystemConfig.SPEED_CONTROL_CONFIG.defaultValue;
initSpeedControl();

// 动画循环
animate();

// ========== 工具函数 ==========

function initRenderer() {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  return renderer;
}

function initLights() {
  scene.add(new THREE.AmbientLight(SolarSystemConfig.LIGHT_CONFIG.ambient));
  
  const directionalLight = new THREE.DirectionalLight(
    SolarSystemConfig.LIGHT_CONFIG.directional.color, 
    SolarSystemConfig.LIGHT_CONFIG.directional.intensity
  );
  directionalLight.position.set(10, 10, 10); // 从右上前方照射
  scene.add(directionalLight);
}

function createSun() {
  const sun = new THREE.Mesh(
    // 太阳几何体
    new THREE.SphereGeometry(SolarSystemConfig.SUN_CONFIG.radius, 64, 64),
    new THREE.MeshBasicMaterial({
      color: SolarSystemConfig.SUN_CONFIG.color,
      transparent: true,
      opacity: 0.9
    })
  );
  scene.add(sun);

  // 太阳光源
  scene.add(new THREE.PointLight(
    SolarSystemConfig.LIGHT_CONFIG.sunLight.color,
    SolarSystemConfig.LIGHT_CONFIG.sunLight.intensity,
    SolarSystemConfig.LIGHT_CONFIG.sunLight.distance
  ));

  // 创建太阳标签
  const sunLabel = createSunLabel('太阳');
  
  return { sun, sunLabel };
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

function createPlanet({ radius, semiMajorAxis, eccentricity, speed, color, name }) {
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
  
  // 使用开普勒方程计算初始位置（近地点）
  const trueAnomaly = 0; // 近地点角度
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
    name
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
  const segments = planetData.orbitSegments || SolarSystemConfig.ORBIT_CONFIG.segments;
  
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
    
    // 精确计算椭圆轨道位置
    const trueAnomaly = planet.angle;
    const semiLatusRectum = semiMajorAxis * (1 - eccentricity * eccentricity);
    const r = semiLatusRectum / (1 + eccentricity * Math.cos(trueAnomaly));
    
    // 严格右手坐标系：X右，Y上，Z屏幕外
    planet.mesh.position.x = r * Math.cos(trueAnomaly);  // X轴：右侧为正
    planet.mesh.position.y = r * Math.sin(trueAnomaly);  // Y轴：上为正
    planet.mesh.position.z = 0;                         // Z轴：屏幕外为正（XY平面运动）
    
    // 验证中心点位置
    const expectedX = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly)) * Math.cos(trueAnomaly);
    const expectedY = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly)) * Math.sin(trueAnomaly);
    console.assert(
      Math.abs(planet.mesh.position.x - expectedX) < 0.001 && 
      Math.abs(planet.mesh.position.y - expectedY) < 0.001,
      'Planet position does not match orbit line'
    );
    
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


function animate() {
  requestAnimationFrame(animate);
  
  sun.rotation.y += 0.005;
  updatePlanetPositions();
  updateSunLabelPosition();
  
  // 更新太阳光晕效果
  if (bloomPass) {
    const sunLight = new THREE.Vector3();
    sun.getWorldPosition(sunLight);
    // 设置光晕效果参数
    bloomPass.enabled = true;
    bloomPass.strength = 2.5;
    bloomPass.radius = 0.6;
    bloomPass.threshold = 0.7;
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

