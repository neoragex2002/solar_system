// 使用全局变量

// 初始化场景
const scene = new THREE.Scene();

// 初始化相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z);

// 初始化渲染器
const renderer = initRenderer();
document.body.appendChild(renderer.domElement);

// 初始化控制器
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.update();

// 初始化光照
initLights();

// 创建太阳系
const { sun, sunLabel } = createSun();
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
  directionalLight.position.set(
    SolarSystemConfig.LIGHT_CONFIG.directional.position.x,
    SolarSystemConfig.LIGHT_CONFIG.directional.position.y,
    SolarSystemConfig.LIGHT_CONFIG.directional.position.z
  );
  scene.add(directionalLight);
}

function createSun() {
  const sun = new THREE.Mesh(
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
  return PLANETS_DATA.map(planetData => {
    const planet = createPlanet(planetData);
    createOrbitLine(planetData, planetData.orbitColor);
    return planet;
  });
}

function createPlanet({ radius, orbitRadius, semiMajorAxis, eccentricity, speed, color, name }) {
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.MeshPhongMaterial({ color })
  );
  planet.position.x = orbitRadius;
  scene.add(planet);

  const label = createPlanetLabel(name);
  
  return {
    mesh: planet,
    label,
    orbitRadius,
    speed,
    angle: Math.random() * Math.PI * 2
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
  const semiMajorAxis = planetData.semiMajorAxis || planetData.orbitRadius;
  const eccentricity = planetData.eccentricity || 0;
  const segments = planetData.orbitSegments || SolarSystemConfig.ORBIT_CONFIG.segments;
  
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    // 统一使用右手坐标系，Z轴向上
    // 统一使用右手坐标系，Z轴向上
    const r = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(angle));
    // 右手坐标系，Z轴向上，Y轴指向屏幕内
    points.push(new THREE.Vector3(
      r * Math.cos(angle),  // X轴
      r * Math.sin(angle),  // Y轴
      0                     // Z轴
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
    const semiMajorAxis = planet.semiMajorAxis || planet.orbitRadius;
    const eccentricity = planet.eccentricity || 0;
    
    // 简化计算，使用固定角度增量
    planet.angle += planet.speed * simulationSpeed * 0.01;
    
    // 计算椭圆轨道位置
    const r = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(planet.angle));
    // 保持与轨道线相同的坐标系
    // 保持与轨道线相同的坐标系
    // 右手坐标系，Z轴向上，Y轴指向屏幕内
    planet.mesh.position.x = r * Math.cos(planet.angle);  // X轴
    planet.mesh.position.y = r * Math.sin(planet.angle);  // Y轴
    planet.mesh.position.z = 0;                           // Z轴
    
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
  const y = (-(screenPos.z * 0.5) + 0.5) * window.innerHeight; // 使用XZ平面坐标

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
  const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight - 
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

