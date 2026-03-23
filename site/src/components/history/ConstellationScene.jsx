// ============================================================
// CONSTELLATION SCENE - Three.js 3D scene with Earth and satellites
// ============================================================

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as THREE from 'three';
import { TRADITION_COLORS, BATTLE_COLORS } from '@hooks/useConstellation';

// Connection type colors
const CONNECTION_COLORS = {
  influence: 0x4CAF50,
  opposition: 0xF44336,
  student: 0x2196F3,
  founder: 0xFFD700,
  synthesis: 0x9C27B0,
  contemporary: 0xFF9800,
};

// Earth texture URLs (NASA Blue Marble)
const EARTH_TEXTURE = 'https://unpkg.com/three-globe@2.45.1/example/img/earth-blue-marble.jpg';
const EARTH_BUMP = 'https://unpkg.com/three-globe@2.45.1/example/img/earth-topology.png';
const STAR_TEXTURE = 'https://unpkg.com/three-globe@2.45.1/example/img/night-sky.png';

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
}

// Create glow sprite material
function createGlowMaterial(color) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.4, color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  return new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
}

// Fixed altitude above Earth surface for all philosophers (in Earth-local units)
const SATELLITE_ALTITUDE = 30;

// Create satellite mesh - positioned directly above city, attached to Earth
function createSatellite(node, earthRadius) {
  const group = new THREE.Group();
  group.userData = { nodeId: node.id, node, isAutoEnriched: node.auto_enriched || false };
  
  // Get tradition color
  const traditionColorHex = TRADITION_COLORS[node.tradition] || '#FFFFFF';
  const color = new THREE.Color(traditionColorHex);
  
  // Core sphere - slightly larger for nodes with high mention counts
  const mentionBonus = Math.min(0.5, (node.mention_count || 0) * 0.02);
  const coreSize = 0.8 + mentionBonus;
  const coreGeometry = new THREE.SphereGeometry(coreSize, 16, 16);
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.9,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  group.add(core);
  
  // Outer glow (larger for higher historical weight + mention count boost)
  const baseWeight = node.historical_weight || 0.5;
  const mentionWeight = Math.min(0.3, (node.mention_count || 0) * 0.01);
  const glowScale = 3 + (baseWeight + mentionWeight) * 4;
  const glowMaterial = createGlowMaterial(`rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`);
  const glow = new THREE.Sprite(glowMaterial);
  glow.scale.set(glowScale, glowScale, 1);
  group.add(glow);
  
  // Auto-enriched indicator: pulsing ring (for nodes referenced in Philosify analyses)
  if (node.auto_enriched && node.mention_count > 0) {
    const ringGeometry = new THREE.RingGeometry(coreSize + 0.3, coreSize + 0.5, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xD6158C, // Philosify magenta
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.userData.isPulseRing = true;
    ring.userData.pulsePhase = Math.random() * Math.PI * 2; // Random phase for variety
    group.add(ring);
  }
  
  // Position directly above city at fixed altitude
  // This position is in Earth-local coordinates (satellite is child of Earth)
  const finalPos = latLngToVector3(node.latitude, node.longitude, earthRadius + SATELLITE_ALTITUDE);
  const surfacePos = latLngToVector3(node.latitude, node.longitude, earthRadius);
  
  group.position.copy(finalPos);
  
  // Store positions for launch animation (Earth-local coordinates)
  group.userData.surfacePosition = surfacePos.clone();
  group.userData.targetPosition = finalPos.clone();
  
  return group;
}

// Create connection line between two satellites
function createConnection(edge, sourcePos, targetPos, allNodes) {
  const color = CONNECTION_COLORS[edge.type] || 0x888888;
  const isAutoDiscovered = edge.source_type === 'auto_discovered';
  
  // Create curved line
  const midPoint = new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5);
  const distance = sourcePos.distanceTo(targetPos);
  midPoint.multiplyScalar(1 + distance * 0.002); // Curve outward
  
  const curve = new THREE.QuadraticBezierCurve3(sourcePos, midPoint, targetPos);
  const points = curve.getPoints(32);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  let line;
  
  if (isAutoDiscovered) {
    // Auto-discovered edges: dashed line with slightly different color (more vibrant)
    const material = new THREE.LineDashedMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
      linewidth: 1,
      dashSize: 2,
      gapSize: 1,
    });
    line = new THREE.Line(geometry, material);
    line.computeLineDistances(); // Required for dashed lines
  } else {
    // Seed edges: solid line
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4,
      linewidth: 1,
    });
    line = new THREE.Line(geometry, material);
  }
  
  line.userData = { 
    edge, 
    sourceId: edge.source_id, 
    targetId: edge.target_id,
    isAutoDiscovered,
  };
  
  return line;
}

// School-of-thought color mapping (lighter tones for hair-thin lines)
const SCHOOL_COLORS = {
  'Objectivism': 0xFFD700,
  'Stoicism': 0x87CEEB,
  'Existentialism': 0x9370DB,
  'Confucianism': 0xDC143C,
  'Taoism': 0x228B22,
  'Buddhism': 0xFFB347,
  'Utilitarianism': 0x20B2AA,
  'Rationalism': 0x4169E1,
  'Empiricism': 0x32CD32,
  'Marxism': 0xB22222,
  'Platonism': 0xE6E6FA,
  'Aristotelianism': 0xF0E68C,
  'Phenomenology': 0xDDA0DD,
  'Analytic Philosophy': 0xADD8E6,
  'Classical Liberalism': 0x98FB98,
  'German Idealism': 0xD8BFD8,
  'Neoplatonism': 0xE0B0FF,
  'Social Contract Theory': 0xF5DEB3,
};

// Create hair-thin line connecting philosophers of the same school
function createSchoolConnection(sourcePos, targetPos, schoolName) {
  const color = SCHOOL_COLORS[schoolName] || 0xAAAAAA;
  
  // Create curved line (slight curve to distinguish from edge connections)
  const midPoint = new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5);
  const distance = sourcePos.distanceTo(targetPos);
  midPoint.multiplyScalar(1 + distance * 0.001); // Very subtle curve
  
  const curve = new THREE.QuadraticBezierCurve3(sourcePos, midPoint, targetPos);
  const points = curve.getPoints(24);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  // Hair-thin, very low opacity line
  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.12, // Very subtle
    linewidth: 1,
  });
  
  const line = new THREE.Line(geometry, material);
  line.userData = { 
    isSchoolConnection: true,
    schoolName,
  };
  
  return line;
}

export const ConstellationScene = forwardRef(function ConstellationScene({
  nodes,
  edges,
  allNodes,
  selectedNode,
  hoveredNode,
  onNodeSelect,
  onNodeHover,
  onEdgeSelect,
  currentYear,
}, ref) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const earthRef = useRef(null);
  const satellitesRef = useRef(new Map());
  const connectionsRef = useRef(new Map());
  const schoolConnectionsRef = useRef([]); // Hair-thin school connections
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const isAnimatingRef = useRef(false);
  const targetCameraRef = useRef(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.set(0, 100, 350);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a0f, 1);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

    // Earth
    const textureLoader = new THREE.TextureLoader();
    const earthGeometry = new THREE.SphereGeometry(100, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load(EARTH_TEXTURE),
      bumpMap: textureLoader.load(EARTH_BUMP),
      bumpScale: 1,
      specular: new THREE.Color(0x333333),
      shininess: 5,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    earthRef.current = earth;

    // Atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(102, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x89CFF0) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(glowColor, intensity * 0.4);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Starfield
    textureLoader.load(STAR_TEXTURE, (texture) => {
      const starGeometry = new THREE.SphereGeometry(900, 32, 32);
      const starMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
      });
      const stars = new THREE.Mesh(starGeometry, starMaterial);
      scene.add(stars);
    });

    // Camera controls (simple orbit)
    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };
    let spherical = new THREE.Spherical();
    spherical.setFromVector3(camera.position);

    const handleMouseDown = (e) => {
      isDragging = true;
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      // Update mouse for raycasting
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging && !isAnimatingRef.current) {
        const deltaX = e.clientX - previousMouse.x;
        const deltaY = e.clientY - previousMouse.y;

        spherical.theta -= deltaX * 0.005;
        spherical.phi -= deltaY * 0.005;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);

        previousMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e) => {
      if (isAnimatingRef.current) return;
      e.preventDefault();
      spherical.radius = Math.max(150, Math.min(600, spherical.radius + e.deltaY * 0.5));
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);
    };

    const handleClick = (e) => {
      // Raycast to find clicked satellite
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const satellites = Array.from(satellitesRef.current.values());
      const intersects = raycasterRef.current.intersectObjects(satellites, true);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj && !obj.userData.nodeId) {
          obj = obj.parent;
        }
        if (obj?.userData.nodeId) {
          onNodeSelect(obj.userData.nodeId);
        }
      } else {
        onNodeSelect(null);
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('click', handleClick);

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Rotate Earth slowly
      if (earthRef.current) {
        earthRef.current.rotation.y += 0.0005;
      }

      // Camera fly-to animation
      if (targetCameraRef.current && isAnimatingRef.current) {
        const target = targetCameraRef.current;
        const current = camera.position;
        
        current.lerp(target, 0.05);
        camera.lookAt(0, 0, 0);
        
        if (current.distanceTo(target) < 1) {
          isAnimatingRef.current = false;
          targetCameraRef.current = null;
          spherical.setFromVector3(camera.position);
        }
      }

      // Pulse animation for auto-enriched nodes
      const time = performance.now() * 0.001;
      satellitesRef.current.forEach((satellite) => {
        if (satellite.userData.isAutoEnriched) {
          satellite.children.forEach((child) => {
            if (child.userData?.isPulseRing) {
              const phase = child.userData.pulsePhase || 0;
              const pulse = 0.4 + 0.3 * Math.sin(time * 2 + phase);
              child.material.opacity = pulse;
              const scale = 1 + 0.1 * Math.sin(time * 1.5 + phase);
              child.scale.set(scale, scale, 1);
            }
          });
        }
      });

      // Hover detection
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const satellites = Array.from(satellitesRef.current.values());
      const intersects = raycasterRef.current.intersectObjects(satellites, true);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj && !obj.userData.node) {
          obj = obj.parent;
        }
        if (obj?.userData.node) {
          onNodeHover(obj.userData.node);
          container.style.cursor = 'pointer';
        }
      } else {
        onNodeHover(null);
        container.style.cursor = 'grab';
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('click', handleClick);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [onNodeSelect, onNodeHover]);

  // Update satellites when nodes change
  useEffect(() => {
    if (!sceneRef.current || !earthRef.current) return;

    const earth = earthRef.current;
    const currentIds = new Set(nodes.map(n => n.id));

    // Remove satellites that are no longer visible
    satellitesRef.current.forEach((satellite, id) => {
      if (!currentIds.has(id)) {
        earth.remove(satellite); // Remove from Earth, not scene
        satellitesRef.current.delete(id);
      }
    });

    // Add new satellites as CHILDREN of Earth (so they rotate with Earth)
    nodes.forEach(node => {
      if (!satellitesRef.current.has(node.id)) {
        const satellite = createSatellite(node, 100);
        earth.add(satellite); // Add to Earth so satellites rotate WITH Earth
        satellitesRef.current.set(node.id, satellite);

        // Launch animation - start at surface, animate to altitude
        const surfacePos = satellite.userData.surfacePosition;
        const targetPos = satellite.userData.targetPosition;
        satellite.position.copy(surfacePos); // Start at Earth surface
        satellite.scale.set(0.1, 0.1, 0.1);

        // Animate to final position (Earth-local coordinates)
        const startTime = performance.now();
        const duration = 1500;

        const animateLaunch = (time) => {
          const elapsed = time - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

          satellite.position.lerpVectors(surfacePos, targetPos, eased);
          satellite.scale.setScalar(0.1 + eased * 0.9);

          if (progress < 1) {
            requestAnimationFrame(animateLaunch);
          }
        };
        requestAnimationFrame(animateLaunch);
      }
    });
  }, [nodes]);

  // Update connections when edges change (influence/opposition/student relationships)
  useEffect(() => {
    if (!sceneRef.current || !earthRef.current) return;

    const earth = earthRef.current;
    const currentEdgeKeys = new Set(edges.map(e => `${e.source_id}-${e.target_id}`));

    // Remove connections that are no longer visible
    connectionsRef.current.forEach((line, key) => {
      if (!currentEdgeKeys.has(key)) {
        earth.remove(line); // Connections are also children of Earth
        connectionsRef.current.delete(key);
      }
    });

    // Add new connections (attached to Earth so they rotate with it)
    edges.forEach(edge => {
      const key = `${edge.source_id}-${edge.target_id}`;
      if (!connectionsRef.current.has(key)) {
        const sourceSatellite = satellitesRef.current.get(edge.source_id);
        const targetSatellite = satellitesRef.current.get(edge.target_id);

        if (sourceSatellite && targetSatellite) {
          // Use Earth-local positions (targetPosition is already in Earth coordinates)
          const sourcePos = sourceSatellite.userData.targetPosition || sourceSatellite.position;
          const targetPos = targetSatellite.userData.targetPosition || targetSatellite.position;
          
          const line = createConnection(edge, sourcePos, targetPos, allNodes);
          earth.add(line); // Add to Earth so connections rotate with satellites
          connectionsRef.current.set(key, line);

          // Fade in animation
          line.material.opacity = 0;
          const startTime = performance.now();
          const animateFade = (time) => {
            const progress = Math.min((time - startTime) / 800, 1);
            line.material.opacity = progress * 0.4;
            if (progress < 1) requestAnimationFrame(animateFade);
          };
          requestAnimationFrame(animateFade);
        }
      }
    });
  }, [edges, allNodes]);

  // Create school-of-thought hair-thin connections
  useEffect(() => {
    if (!earthRef.current) return;

    const earth = earthRef.current;

    // Remove old school connections
    schoolConnectionsRef.current.forEach(line => {
      earth.remove(line);
    });
    schoolConnectionsRef.current = [];

    // Group nodes by school_of_thought
    const schoolGroups = new Map();
    nodes.forEach(node => {
      const school = node.school_of_thought;
      if (school) {
        if (!schoolGroups.has(school)) {
          schoolGroups.set(school, []);
        }
        schoolGroups.get(school).push(node);
      }
    });

    // Create hair-thin connections between philosophers of the same school
    schoolGroups.forEach((schoolNodes, schoolName) => {
      // Only connect if there are 2+ philosophers in the school
      if (schoolNodes.length < 2) return;

      // Connect each pair (but limit to avoid too many lines)
      for (let i = 0; i < schoolNodes.length; i++) {
        for (let j = i + 1; j < schoolNodes.length; j++) {
          const sourceSatellite = satellitesRef.current.get(schoolNodes[i].id);
          const targetSatellite = satellitesRef.current.get(schoolNodes[j].id);

          if (sourceSatellite && targetSatellite) {
            const sourcePos = sourceSatellite.userData.targetPosition || sourceSatellite.position;
            const targetPos = targetSatellite.userData.targetPosition || targetSatellite.position;

            const line = createSchoolConnection(sourcePos, targetPos, schoolName);
            earth.add(line);
            schoolConnectionsRef.current.push(line);
          }
        }
      }
    });
  }, [nodes]);

  // Highlight selected node
  useEffect(() => {
    satellitesRef.current.forEach((satellite, id) => {
      const isSelected = selectedNode?.id === id;
      satellite.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.material.opacity = isSelected ? 1 : 0.9;
        }
        if (child instanceof THREE.Sprite) {
          child.scale.setScalar(isSelected ? 8 : 3 + (satellite.userData.node?.historical_weight || 0.5) * 4);
        }
      });
    });
  }, [selectedNode]);

  // Expose flyToNode method
  useImperativeHandle(ref, () => ({
    flyToNode: (node) => {
      if (!cameraRef.current || !node || !earthRef.current) return;
      
      const satellite = satellitesRef.current.get(node.id);
      if (satellite) {
        // Get satellite position in world coordinates (accounting for Earth rotation)
        const worldPos = new THREE.Vector3();
        satellite.getWorldPosition(worldPos);
        const direction = worldPos.clone().normalize();
        targetCameraRef.current = direction.multiplyScalar(250);
        isAnimatingRef.current = true;
      }
    },
  }), []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    />
  );
});

export default ConstellationScene;
