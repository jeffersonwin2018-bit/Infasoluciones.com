/* INFA | low-poly axonometric steel frame + welding particles. */
(() => {
  try {
  const canvas = document.querySelector('#heroCanvas');
  const hero = document.querySelector('#inicio');
  if (!canvas || !hero || !window.THREE || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (error) {
    console.info('INFA hero: WebGL unavailable; static SVG structure remains visible.', error);
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 90);
  camera.position.set(0, 0, 19);
  const structure = new THREE.Group();
  scene.add(structure);
  scene.add(new THREE.AmbientLight(0x9ba9b7, 1.15));
  const warmLight = new THREE.PointLight(0xD1121F, 28, 32);
  warmLight.position.set(5, 4, 7);
  scene.add(warmLight);
  const coolLight = new THREE.PointLight(0x2c65a8, 16, 35);
  coolLight.position.set(-5, -3, 6);
  scene.add(coolLight);
  const steel = new THREE.MeshStandardMaterial({ color: 0xAFC0D8, metalness: .9, roughness: .28 });
  const hotSteel = new THREE.MeshStandardMaterial({ color: 0xD1121F, emissive: 0x3c0710, metalness: .68, roughness: .25 });
  const jointMaterial = new THREE.MeshStandardMaterial({ color: 0xc8d0d2, metalness: .84, roughness: .23 });
  const parts = [];

  function beam(a, b, radius = .034, material = steel) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = end.clone().sub(start);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 8), material);
    mesh.position.copy(start).add(end).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    structure.add(mesh); parts.push(mesh);
  }
  function node(position, size = .082) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), jointMaterial);
    mesh.position.set(...position); structure.add(mesh); parts.push(mesh);
  }

  // Three structural levels and three bays with crossed truss bracing.
  const xs = [-3.7, -1.25, 1.2, 3.65], ys = [-2.65, 0, 2.65], zs = [-.35, .25, .75];
  ys.forEach((y, row) => xs.forEach((x, bay) => {
    const z = zs[(row + bay) % zs.length];
    node([x, y, z]);
    if (bay < xs.length - 1) beam([x, y, z], [xs[bay + 1], y, zs[(row + bay + 1) % zs.length]]);
    if (row < ys.length - 1) beam([x, y, z], [x, ys[row + 1], zs[(row + bay + 1) % zs.length]]);
  }));
  for (let bay = 0; bay < xs.length - 1; bay++) {
    beam([xs[bay], ys[0], zs[bay % 3]], [xs[bay + 1], ys[2], zs[(bay + 1) % 3]], .026, hotSteel);
    beam([xs[bay + 1], ys[0], zs[(bay + 1) % 3]], [xs[bay], ys[2], zs[bay % 3]], .026, hotSteel);
  }
  const module = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.45, 1.2), new THREE.MeshStandardMaterial({ color: 0x0B2A5B, metalness: .9, roughness: .24, wireframe: true }));
  module.position.set(1.1, -.05, 1.45); structure.add(module); parts.push(module);

  // Small amber sparks, initialized in scene space and recycled in-place.
  const sparkCount = 95, sparkPositions = new Float32Array(sparkCount * 3), sparkVelocity = [];
  for (let i = 0; i < sparkCount; i++) {
    sparkPositions[i * 3] = (Math.random() - .5) * 7;
    sparkPositions[i * 3 + 1] = (Math.random() - .5) * 5;
    sparkPositions[i * 3 + 2] = Math.random() * 2;
    sparkVelocity.push({ x: (Math.random() - .5) * .018, y: .015 + Math.random() * .045, life: Math.random() });
  }
  const sparkGeometry = new THREE.BufferGeometry();
  sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  const sparks = new THREE.Points(sparkGeometry, new THREE.PointsMaterial({ color: 0xD1121F, size: .045, transparent: true, opacity: .85, depthWrite: false, sizeAttenuation: true }));
  structure.add(sparks); parts.push(sparks);

  let pointerX = 0, pointerY = 0, inView = true, raf = 0, disposed = false;
  const onPointer = event => {
    pointerX = (event.clientX / innerWidth - .5) * 2;
    pointerY = (event.clientY / innerHeight - .5) * 2;
  };
  const resize = () => {
    const bounds = hero.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(Math.max(1, bounds.width), Math.max(1, bounds.height), false);
    camera.aspect = Math.max(1, bounds.width) / Math.max(1, bounds.height);
    camera.position.x = bounds.width < 620 ? .4 : 0;
    camera.updateProjectionMatrix();
    structure.position.set(bounds.width < 620 ? 3.5 : bounds.width < 920 ? 4 : 4.5, .05, 0);
  };
  const observer = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView && !raf && !disposed) render();
    if (!inView && raf) { cancelAnimationFrame(raf); raf = 0; }
  }, { threshold: 0 });
  function render() {
    if (disposed || !inView) { raf = 0; return; }
    raf = requestAnimationFrame(render);
    const scrollTurn = Math.min(scrollY / Math.max(innerHeight, 1), 8) * .035;
    structure.rotation.y += (pointerX * .13 + scrollTurn - structure.rotation.y) * .025;
    structure.rotation.x += (-pointerY * .075 - structure.rotation.x) * .025;
    structure.rotation.z = Math.sin(performance.now() * .00018) * .009;
    module.rotation.y += .001;
    const positions = sparkGeometry.attributes.position.array;
    for (let i = 0; i < sparkCount; i++) {
      const v = sparkVelocity[i], k = i * 3;
      positions[k] += v.x; positions[k + 1] += v.y; v.life += .012;
      if (positions[k + 1] > 3.4 || v.life > 1) {
        positions[k] = (Math.random() - .5) * 7;
        positions[k + 1] = -2.6 + Math.random() * .8;
        positions[k + 2] = .5 + Math.random() * 1.8;
        v.x = (Math.random() - .5) * .018; v.y = .02 + Math.random() * .06; v.life = 0;
      }
    }
    sparkGeometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }

  resize(); observer.observe(hero); addEventListener('resize', resize, { passive: true }); addEventListener('pointermove', onPointer, { passive: true });
  document.documentElement.classList.add('webgl-ready');
  render();
  addEventListener('pagehide', () => {
    disposed = true; cancelAnimationFrame(raf); observer.disconnect();
    removeEventListener('resize', resize); removeEventListener('pointermove', onPointer);
    parts.forEach(part => { part.geometry?.dispose(); if (Array.isArray(part.material)) part.material.forEach(m => m.dispose()); else part.material?.dispose(); });
    [steel, hotSteel, jointMaterial].forEach(material => material.dispose());
    renderer.dispose(); renderer.forceContextLoss();
  }, { once: true });
  } catch (error) {
    document.documentElement.classList.remove('webgl-ready');
    console.info('INFA hero: 3D enhancement unavailable; static artwork remains visible.', error);
  }
})();

