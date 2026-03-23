// ============================================================
// CONSTELLATION SCENE - Three.js 3D scene with Earth and satellites
// ============================================================

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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

// Create text label sprite for philosopher name
// isFoundational: true for major philosophers (historical_weight >= 0.9)
// isMostFoundational: true for THE foundational philosophers (historical_weight === 1.0)
function createTextSprite(text, color, isFoundational = false, isMostFoundational = false) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Larger font for foundational philosophers
  const baseFontSize = 48;
  const fontSize = isMostFoundational ? 64 : (isFoundational ? 56 : baseFontSize);
  const fontWeight = isFoundational ? 'bold' : 'normal';
  
  ctx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`;
  const textWidth = ctx.measureText(text).width;
  
  // Size canvas to fit text with padding
  canvas.width = textWidth + 24;
  canvas.height = fontSize + 20;
  
  // Re-set font after resize
  ctx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw text with shadow for readability (stronger shadow for foundational)
  ctx.shadowColor = isFoundational ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = isFoundational ? 6 : 4;
  ctx.shadowOffsetX = isFoundational ? 2 : 1;
  ctx.shadowOffsetY = isFoundational ? 2 : 1;
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // Add subtle glow outline for most foundational
  if (isMostFoundational) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: isMostFoundational ? 1.0 : (isFoundational ? 0.95 : 0.9),
    depthTest: false, // Always visible
  });
  
  const sprite = new THREE.Sprite(material);
  
  // Scale sprite - larger for foundational philosophers
  const baseScale = 0.08;
  const scale = isMostFoundational ? 0.10 : (isFoundational ? 0.09 : baseScale);
  sprite.scale.set(canvas.width * scale, canvas.height * scale, 1);
  
  return sprite;
}

// Create thin line connecting label to satellite
function createLabelLine(startPos, endPos, color) {
  const points = [startPos, endPos];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.3,
    linewidth: 1,
  });
  
  return new THREE.Line(geometry, material);
}

// Base altitude above Earth surface (in Earth-local units)
const BASE_ALTITUDE = 25;
const FOUNDATIONAL_ALTITUDE_BOOST = 10; // Extra altitude for foundational (weight >= 0.9)
const MOST_FOUNDATIONAL_ALTITUDE_BOOST = 20; // Extra altitude for most foundational (weight === 1.0)
const LABEL_OFFSET = 5; // Distance from satellite to label

// Spacing configuration for overlapping philosophers
const PROXIMITY_THRESHOLD = 0.5; // Degrees - philosophers within this distance are considered "same location"
const SPREAD_RADIUS = 8; // Units to spread philosophers apart tangentially

// Group nodes by proximity and calculate spread offsets
// Returns a Map of nodeId -> { offsetX, offsetZ } in tangent space
function calculateSpreadOffsets(nodes) {
  const offsets = new Map();
  const groups = [];
  const assigned = new Set();

  // Group nodes by proximity
  nodes.forEach((node) => {
    if (assigned.has(node.id)) return;

    const group = [node];
    assigned.add(node.id);

    nodes.forEach((other) => {
      if (assigned.has(other.id)) return;
      const latDiff = Math.abs(node.latitude - other.latitude);
      const lngDiff = Math.abs(node.longitude - other.longitude);
      if (latDiff < PROXIMITY_THRESHOLD && lngDiff < PROXIMITY_THRESHOLD) {
        group.push(other);
        assigned.add(other.id);
      }
    });

    if (group.length > 1) {
      groups.push(group);
    }
  });

  // Calculate offsets for each group
  groups.forEach((group) => {
    // Sort by historical weight (highest first) so most important are centered
    group.sort((a, b) => (b.historical_weight || 0.5) - (a.historical_weight || 0.5));

    const count = group.length;
    // Check if the top philosopher (first after sorting) should stay centered
    const topPhilosopher = group[0];
    const topStaysCentered = topPhilosopher.historical_weight >= 0.9;
    const spreadCount = topStaysCentered ? count - 1 : count;
    
    group.forEach((node, index) => {
      if (count === 1) {
        // Only one philosopher - no offset needed
        offsets.set(node.id, { offsetX: 0, offsetZ: 0 });
      } else if (index === 0 && topStaysCentered) {
        // Most important philosopher stays at center
        offsets.set(node.id, { offsetX: 0, offsetZ: 0 });
      } else {
        // Spread others in a circle around center
        // Adjust index if top is centered (so index 1 becomes position 0 in the circle)
        const circleIndex = topStaysCentered ? index - 1 : index;
        const angle = (circleIndex / spreadCount) * Math.PI * 2;
        // Increase radius slightly for larger groups
        const radius = SPREAD_RADIUS * (1 + (spreadCount - 1) * 0.12);
        offsets.set(node.id, {
          offsetX: Math.cos(angle) * radius,
          offsetZ: Math.sin(angle) * radius,
        });
      }
    });
  });

  return offsets;
}

// Create satellite mesh - positioned directly above city, attached to Earth
function createSatellite(node, earthRadius, spreadOffset = null) {
  const group = new THREE.Group();
  group.userData = { nodeId: node.id, node, isAutoEnriched: node.auto_enriched || false };
  
  // Determine if philosopher is foundational based on historical_weight
  const weight = node.historical_weight || 0.5;
  const isMostFoundational = weight >= 1.0; // Socrates, Plato, Aristotle, Kant, Confucius, Buddha
  const isFoundational = weight >= 0.9; // Major figures in philosophy
  
  // Calculate altitude - foundational philosophers orbit higher
  let altitude = BASE_ALTITUDE;
  if (isMostFoundational) {
    altitude += MOST_FOUNDATIONAL_ALTITUDE_BOOST;
  } else if (isFoundational) {
    altitude += FOUNDATIONAL_ALTITUDE_BOOST;
  }
  
  // Get tradition color
  const traditionColorHex = TRADITION_COLORS[node.tradition] || '#FFFFFF';
  const color = new THREE.Color(traditionColorHex);
  
  // Core sphere - larger for foundational philosophers
  const mentionBonus = Math.min(0.5, (node.mention_count || 0) * 0.02);
  const foundationalBonus = isMostFoundational ? 0.6 : (isFoundational ? 0.3 : 0);
  const coreSize = 0.8 + mentionBonus + foundationalBonus;
  const coreGeometry = new THREE.SphereGeometry(coreSize, 16, 16);
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: isMostFoundational ? 1.0 : 0.9,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  group.add(core);
  
  // Outer glow (larger for foundational philosophers)
  const mentionWeight = Math.min(0.3, (node.mention_count || 0) * 0.01);
  const glowScale = 3 + (weight + mentionWeight) * 4 + (isMostFoundational ? 3 : (isFoundational ? 1.5 : 0));
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
  
  // Name label - bold and larger for foundational philosophers
  const labelOffset = LABEL_OFFSET + (isMostFoundational ? 2 : (isFoundational ? 1 : 0));
  const labelSprite = createTextSprite(node.name, traditionColorHex, isFoundational, isMostFoundational);
  labelSprite.position.set(0, labelOffset, 0); // Offset above the satellite (local coords)
  labelSprite.userData.isLabel = true;
  group.add(labelSprite);
  
  // Thin line connecting label to satellite sphere
  const labelLineStart = new THREE.Vector3(0, coreSize + 0.2, 0);
  const labelLineEnd = new THREE.Vector3(0, labelOffset - 1.5, 0);
  const labelLine = createLabelLine(labelLineStart, labelLineEnd, traditionColorHex);
  labelLine.userData.isLabelLine = true;
  group.add(labelLine);
  
  // Position directly above city at calculated altitude
  // This position is in Earth-local coordinates (satellite is child of Earth)
  let finalPos = latLngToVector3(node.latitude, node.longitude, earthRadius + altitude);
  const surfacePos = latLngToVector3(node.latitude, node.longitude, earthRadius);
  
  // Apply spread offset if provided (to separate overlapping philosophers)
  if (spreadOffset && (spreadOffset.offsetX !== 0 || spreadOffset.offsetZ !== 0)) {
    // Calculate tangent vectors at this position (perpendicular to radial direction)
    const radial = finalPos.clone().normalize();
    
    // Use world up as reference, cross with radial to get tangent
    const worldUp = new THREE.Vector3(0, 1, 0);
    const tangentX = new THREE.Vector3().crossVectors(worldUp, radial).normalize();
    const tangentZ = new THREE.Vector3().crossVectors(radial, tangentX).normalize();
    
    // Apply offset in tangent space
    finalPos.add(tangentX.multiplyScalar(spreadOffset.offsetX));
    finalPos.add(tangentZ.multiplyScalar(spreadOffset.offsetZ));
  }
  
  group.position.copy(finalPos);
  
  // Store positions for launch animation (Earth-local coordinates)
  group.userData.surfacePosition = surfacePos.clone();
  group.userData.targetPosition = finalPos.clone();
  group.userData.isFoundational = isFoundational;
  group.userData.isMostFoundational = isMostFoundational;
  
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

// Create tether line from satellite down to city location on Earth surface
function createTetherLine(surfacePos, satellitePos, traditionColor) {
  const color = new THREE.Color(traditionColor);
  
  // Straight line from satellite to surface
  const points = [satellitePos.clone(), surfacePos.clone()];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  // Very thin, subtle tether
  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.25, // Subtle but visible
    linewidth: 1,
  });
  
  const line = new THREE.Line(geometry, material);
  line.userData = { isTetherLine: true };
  
  return line;
}

// Create influence chain line (philosopher to follower)
function createInfluenceLine(sourcePos, targetPos) {
  // Create slightly curved line for influence connections
  const midPoint = new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5);
  const distance = sourcePos.distanceTo(targetPos);
  midPoint.multiplyScalar(1 + distance * 0.0015); // Subtle outward curve
  
  const curve = new THREE.QuadraticBezierCurve3(sourcePos, midPoint, targetPos);
  const points = curve.getPoints(32);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  // Green-tinted line for influence (ideas flowing)
  const material = new THREE.LineBasicMaterial({
    color: 0x4CAF50, // Green for influence
    transparent: true,
    opacity: 0.18, // Subtle
    linewidth: 1,
  });
  
  const line = new THREE.Line(geometry, material);
  line.userData = { isInfluenceLine: true };
  
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
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const earthRef = useRef(null);
  const satellitesRef = useRef(new Map());
  const connectionsRef = useRef(new Map());
  const schoolConnectionsRef = useRef([]); // Hair-thin school connections
  const tetherLinesRef = useRef(new Map()); // Tether lines from satellite to city
  const influenceLinesRef = useRef([]); // Influence chain lines
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

    // Remove satellites and their tether lines that are no longer visible
    satellitesRef.current.forEach((satellite, id) => {
      if (!currentIds.has(id)) {
        earth.remove(satellite); // Remove from Earth, not scene
        satellitesRef.current.delete(id);
        
        // Remove associated tether line
        const tetherLine = tetherLinesRef.current.get(id);
        if (tetherLine) {
          earth.remove(tetherLine);
          tetherLinesRef.current.delete(id);
        }
      }
    });

    // Calculate spread offsets for overlapping philosophers
    const spreadOffsets = calculateSpreadOffsets(nodes);

    // Add new satellites as CHILDREN of Earth (so they rotate with Earth)
    nodes.forEach(node => {
      if (!satellitesRef.current.has(node.id)) {
        const spreadOffset = spreadOffsets.get(node.id) || null;
        const satellite = createSatellite(node, 100, spreadOffset);
        earth.add(satellite); // Add to Earth so satellites rotate WITH Earth
        satellitesRef.current.set(node.id, satellite);

        // Create tether line from satellite to city on Earth surface
        const surfacePos = satellite.userData.surfacePosition;
        const targetPos = satellite.userData.targetPosition;
        const traditionColor = TRADITION_COLORS[node.tradition] || '#FFFFFF';
        const tetherLine = createTetherLine(surfacePos, targetPos, traditionColor);
        earth.add(tetherLine);
        tetherLinesRef.current.set(node.id, tetherLine);

        // Launch animation - start at surface, animate to altitude
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

  // Create influence chain lines (philosopher → follower) - showing propagation of ideas
  useEffect(() => {
    if (!earthRef.current) return;

    const earth = earthRef.current;

    // Remove old influence lines
    influenceLinesRef.current.forEach(line => {
      earth.remove(line);
    });
    influenceLinesRef.current = [];

    // Filter edges for influence types (chain of ideas propagation)
    // Handle both API format (type) and seed data format (relationship_type)
    const influenceTypes = [
      'influence', 'student', 'teacher_of', 'influenced_by', 
      'transmitted_by', 'fulfills_legacy_of'
    ];
    
    const influenceEdges = edges.filter(e => {
      const edgeType = e.type || e.relationship_type || '';
      return influenceTypes.includes(edgeType);
    });

    influenceEdges.forEach(edge => {
      const sourceSatellite = satellitesRef.current.get(edge.source_id);
      const targetSatellite = satellitesRef.current.get(edge.target_id);

      if (sourceSatellite && targetSatellite) {
        const sourcePos = sourceSatellite.userData.targetPosition || sourceSatellite.position;
        const targetPos = targetSatellite.userData.targetPosition || targetSatellite.position;

        const line = createInfluenceLine(sourcePos, targetPos);
        earth.add(line);
        influenceLinesRef.current.push(line);
      }
    });
  }, [edges, nodes]);

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

  // Zoom functions
  const zoomIn = useCallback(() => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    const direction = camera.position.clone().normalize();
    const newDistance = Math.max(150, camera.position.length() - 30);
    camera.position.copy(direction.multiplyScalar(newDistance));
  }, []);

  const zoomOut = useCallback(() => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    const direction = camera.position.clone().normalize();
    const newDistance = Math.min(800, camera.position.length() + 30);
    camera.position.copy(direction.multiplyScalar(newDistance));
  }, []);

  const resetView = useCallback(() => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    camera.position.set(0, 100, 350);
    camera.lookAt(0, 0, 0);
  }, []);

  // Expose flyToNode and zoom methods
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
    zoomIn,
    zoomOut,
    resetView,
  }), [zoomIn, zoomOut, resetView]);

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
    >
      {/* Zoom Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 100,
        }}
      >
        <button
          onClick={zoomIn}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(20, 20, 30, 0.8)',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(40, 40, 60, 0.9)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(20, 20, 30, 0.8)'}
          title={t('constellation.zoomIn')}
        >
          +
        </button>
        <button
          onClick={zoomOut}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(20, 20, 30, 0.8)',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(40, 40, 60, 0.9)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(20, 20, 30, 0.8)'}
          title={t('constellation.zoomOut')}
        >
          −
        </button>
        <button
          onClick={resetView}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(20, 20, 30, 0.8)',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(40, 40, 60, 0.9)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(20, 20, 30, 0.8)'}
          title={t('constellation.resetView')}
        >
          ⟲
        </button>
      </div>
    </div>
  );
});

export default ConstellationScene;
