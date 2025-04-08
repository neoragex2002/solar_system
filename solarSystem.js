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

// 初始化速度控制
let simulationSpeed = SPEED_CONTROL_CONFIG.defaultValue;
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
  scene.add(new THREE.AmbientLight(LIGHT_CONFIG.ambient));
  
  const directionalLight = new THREE.DirectionalLight(
    LIGHT_CONFIG.directional.color, 
    LIGHT_CONFIG.directional.intensity
  );
  directionalLight.position.set(
    LIGHT_CONFIG.directional.position.x,
    LIGHT_CONFIG.directional.position.y,
    LIGHT_CONFIG.directional.position.z
  );
  scene.add(directionalLight);
}

function createSun() {
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_CONFIG.radius, 64, 64),
    new THREE.MeshBasicMaterial({
      color: SUN_CONFIG.color,
      transparent: true,
      opacity: 0.9
    })
  );
  scene.add(sun);

  // 太阳光源
  scene.add(new THREE.PointLight(
    LIGHT_CONFIG.sunLight.color,
    LIGHT_CONFIG.sunLight.intensity,
    LIGHT_CONFIG.sunLight.distance
  ));

  // 太阳光晕
  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_CONFIG.glow.radius, 64, 64),
    new THREE.MeshBasicMaterial({
      color: SUN_CONFIG.glow.color,
      transparent: true,
      opacity: SUN_CONFIG.glow.opacity
    })
  );
  scene.add(sunGlow);

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
  const points = Array.from({ length: ORBIT_CONFIG.segments + 1 }, (_, i) => {
    const angle = (i / ORBIT_CONFIG.segments) * Math.PI * 2;
    return new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle));
  });
  
  const orbitLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: ORBIT_CONFIG.color })
  );
  scene.add(orbitLine);
}

function initSpeedControl() {
  const speedSlider = document.getElementById('speed-slider');
  const speedValue = document.getElementById('speed-value');

  speedSlider.min = SPEED_CONTROL_CONFIG.min;
  speedSlider.max = SPEED_CONTROL_CONFIG.max;
  speedSlider.step = SPEED_CONTROL_CONFIG.step;
  speedSlider.value = SPEED_CONTROL_CONFIG.defaultValue;
  speedValue.textContent = `${SPEED_CONTROL_CONFIG.defaultValue}x`;

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
  const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight - LABEL_CONFIG.offsetY;

  planet.label.style.display = 'block';
  planet.label.style.left = `${x}px`;
  planet.label.style.top = `${y}px`;
}

function pulseSunGlow() {
  const scale = 1 + Math.sin(Date.now() * 0.001) * SUN_CONFIG.glow.pulseScale;
  sunGlow.scale.set(scale, scale, scale);
}

function animate() {
  requestAnimationFrame(animate);
  
  pulseSunGlow();
  sun.rotation.y += 0.005;
  updatePlanetPositions();
  
  controls.update();
  renderer.render(scene, camera);
}

// 窗口大小变化处理
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 清理标签
window.addEventListener('beforeunload', () => {
  planets.forEach(planet => {
    if (planet.label && planet.label.parentNode) {
      planet.label.parentNode.removeChild(planet.label);
    }
  });
});

// 更新太阳光晕大小
function pulseSunGlow() {
    sunGlow.scale.x = 1 + Math.sin(Date.now() * 0.001) * 0.1;
    sunGlow.scale.y = 1 + Math.sin(Date.now() * 0.001) * 0.1;
    sunGlow.scale.z = 1 + Math.sin(Date.now() * 0.001) * 0.1;
}

// 全局速度控制
let simulationSpeed = 1;

// 初始化速度控制
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');

speedSlider.addEventListener('input', (e) => {
    simulationSpeed = parseFloat(e.target.value);
    speedValue.textContent = `${simulationSpeed.toFixed(1)}x`;
});

// 动画循环
function animate() {
    pulseSunGlow();
    requestAnimationFrame(animate);

    // 旋转太阳
    sun.rotation.y += 0.005;

    // 更新行星位置
    planets.forEach(planet => {
        planet.angle += planet.speed * simulationSpeed;
        planet.mesh.position.x = planet.orbitRadius * Math.cos(planet.angle);
        planet.mesh.position.z = planet.orbitRadius * Math.sin(planet.angle);
        planet.mesh.rotation.y += 0.01 * simulationSpeed;

        // 更新标签位置 - 考虑摄像机视角
        const planetWorldPos = new THREE.Vector3();
        planet.mesh.getWorldPosition(planetWorldPos);

        // 计算从摄像机到行星的方向向量
        const cameraToPlanet = planetWorldPos.clone().sub(camera.position).normalize();

        // 转换为屏幕坐标
        const screenPos = planetWorldPos.clone().project(camera);
        
        // 直接在屏幕空间向上偏移
        const screenYOffset = 30; // 像素偏移量
        const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight - screenYOffset;

        // 确保标签在视锥体内
        if (screenPos.z > 1 || screenPos.z < -1) {
            planet.label.style.display = 'none';
            return;
        }

        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;

        planet.label.style.display = 'block';
        planet.label.style.left = `${x}px`;
        planet.label.style.top = `${y}px`;
    });

    controls.update();
    renderer.render(scene, camera);
}

// 处理窗口大小变化
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 页面卸载时清理标签
window.addEventListener('beforeunload', () => {
    planets.forEach(planet => {
        if (planet.label && planet.label.parentNode) {
            planet.label.parentNode.removeChild(planet.label);
        }
    });
});

animate();
