// 初始化场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加轨道控制器
const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(0, 50, 100);
controls.update();

// 添加环境光和方向光
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 1, 0);
scene.add(directionalLight);

// 创建太阳和行星
const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.9
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// 添加太阳光源
const sunLight = new THREE.PointLight(0xffff99, 1, 100);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// 添加太阳光晕效果
const sunGlowGeometry = new THREE.SphereGeometry(8, 64, 64);
const sunGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.3
});
const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
scene.add(sunGlow);

// 行星数据: [半径, 轨道半径, 轨道速度, 颜色]
const planetsData = [
    [0.4, 10, 0.04, 0x8a8a8a, "水星"],
    [0.6, 15, 0.03, 0xe6c229, "金星"],
    [0.6, 20, 0.02, 0x3498db, "地球"],
    [0.4, 25, 0.015, 0xe74c3c, "火星"],
    [1.3, 35, 0.01, 0xe67e22, "木星"],
    [1.1, 45, 0.008, 0xf1c40f, "土星"],
    [0.9, 55, 0.006, 0x1abc9c, "天王星"],
    [0.8, 65, 0.004, 0x3498db, "海王星"],
    [0.3, 75, 0.002, 0x9b59b6, "冥王星"]
];

const planets = [];
const orbitLines = [];

// 创建行星和轨道
planetsData.forEach((data, i) => {
    const [radius, orbitRadius, speed, color, name] = data;

    // 创建行星
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color });
    const planet = new THREE.Mesh(geometry, material);
    planet.position.x = orbitRadius;
    scene.add(planet);

    // 创建行星标签
    const label = document.createElement('div');
    label.className = 'planet-label';
    label.textContent = name;
    document.body.appendChild(label);

    planets.push({
        mesh: planet,
        label,
        orbitRadius,
        speed,
        angle: Math.random() * Math.PI * 2
    });

    // 创建轨道线
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x555555 });
    const points = [];
    for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(orbitRadius * Math.cos(angle), 0, orbitRadius * Math.sin(angle)));
    }
    orbitGeometry.setFromPoints(points);
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbitLine);
    orbitLines.push(orbitLine);
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
