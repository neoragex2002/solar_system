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
const { sun, sunGlow } = createSun();
const planets = createPlanets();

// 初始化后期处理
let composer, bloomPass;
function initPostProcessing() {
    const renderScene = new THREE.RenderPass(scene, camera);
    
    bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        2.5,   // strength
        0.6,   // radius
        0.7    // threshold
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

  // 增强的太阳光晕
  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(SolarSystemConfig.SUN_CONFIG.glow.radius * 1.2, 64, 64),
    new THREE.MeshBasicMaterial({
      color: SolarSystemConfig.SUN_CONFIG.glow.color,
      transparent: true,
      opacity: SolarSystemConfig.SUN_CONFIG.glow.opacity,
      blending: THREE.AdditiveBlending // 使用叠加混合模式增强效果
    })
  );
  // scene.add(sunGlow);

  return { sun, sunGlow };
}

function createPlanets() {
  return PLANETS_DATA.map(planetData => {
    const planet = createPlanet(planetData);
    createOrbitLine(planetData.orbitRadius);
    return planet;
  });
}

function createPlanet({ radius, orbitRadius, speed, color, name }) {
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

function createPlanetLabel(name) {
  const label = document.createElement('div');
  label.className = 'planet-label';
  label.textContent = name;
  document.body.appendChild(label);
  return label;
}

function createOrbitLine(radius) {
  const points = Array.from({ length: SolarSystemConfig.ORBIT_CONFIG.segments + 1 }, (_, i) => {
    const angle = (i / SolarSystemConfig.ORBIT_CONFIG.segments) * Math.PI * 2;
    return new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle));
  });
  
  const orbitLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: SolarSystemConfig.ORBIT_CONFIG.color })
  );
  scene.add(orbitLine);
}

function initSpeedControl() {
  const speedSlider = document.getElementById('speed-slider');
  const speedValue = document.getElementById('speed-value');

  speedSlider.min = SolarSystemConfig.SPEED_CONTROL_CONFIG.min;
  speedSlider.max = SolarSystemConfig.SPEED_CONTROL_CONFIG.max;
  speedSlider.step = SolarSystemConfig.SPEED_CONTROL_CONFIG.step;
  speedSlider.value = SolarSystemConfig.SPEED_CONTROL_CONFIG.defaultValue;
  speedValue.textContent = `${SolarSystemConfig.SPEED_CONTROL_CONFIG.defaultValue}x`;

  speedSlider.addEventListener('input', (e) => {
    simulationSpeed = parseFloat(e.target.value);
    speedValue.textContent = `${simulationSpeed.toFixed(1)}x`;
  });
}

function updatePlanetPositions() {
  planets.forEach(planet => {
    planet.angle += planet.speed * simulationSpeed;
    planet.mesh.position.x = planet.orbitRadius * Math.cos(planet.angle);
    planet.mesh.position.z = planet.orbitRadius * Math.sin(planet.angle);
    planet.mesh.rotation.y += 0.01 * simulationSpeed;

    updateLabelPosition(planet);
  });
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
  const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight - SolarSystemConfig.LABEL_CONFIG.offsetY;

  planet.label.style.display = 'block';
  planet.label.style.left = `${x}px`;
  planet.label.style.top = `${y}px`;
}

function pulseSunGlow() {
  const time = Date.now() * 0.001;
  // 更自然的脉动效果
  const scale = 1 + Math.sin(time) * 0.1 + Math.sin(time * 0.5) * 0.05;
  sunGlow.scale.set(scale, scale, scale);
  
  // 动态调整光晕透明度
  const opacity = 0.7 + Math.sin(time * 1.5) * 0.1;
  sunGlow.material.opacity = opacity;
}

function animate() {
  requestAnimationFrame(animate);
  
  pulseSunGlow();
  sun.rotation.y += 0.005;
  updatePlanetPositions();
  
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
  planets.forEach(planet => {
    if (planet.label && planet.label.parentNode) {
      planet.label.parentNode.removeChild(planet.label);
    }
  });
});

