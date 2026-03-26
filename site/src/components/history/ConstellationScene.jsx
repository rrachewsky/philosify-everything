// ============================================================
// CONSTELLATION SCENE - Three.js 3D scene with Earth and satellites
// ============================================================

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { TRADITION_COLORS, BATTLE_COLORS, SCHOOL_COLORS } from '@hooks/useConstellation';

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

// Calculate relative luminance of a hex color (for contrast calculation)
// Returns value 0-1, where 0 is black and 1 is white
function getRelativeLuminance(hexColor) {
  // Parse hex color
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Apply gamma correction
  const R = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const G = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const B = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// Calculate WCAG contrast ratio between two luminance values
function getContrastRatio(L1, L2) {
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Determine if white or black text has MAXIMUM contrast against a background color
function getContrastTextColor(bgHexColor) {
  const bgLuminance = getRelativeLuminance(bgHexColor);
  const whiteLuminance = 1.0; // #FFFFFF
  const blackLuminance = 0.0; // #000000
  
  const contrastWithWhite = getContrastRatio(bgLuminance, whiteLuminance);
  const contrastWithBlack = getContrastRatio(bgLuminance, blackLuminance);
  
  // Return whichever gives MAXIMUM contrast
  return contrastWithWhite > contrastWithBlack ? '#FFFFFF' : '#000000';
}

// Create double-sided angled card for philosopher name
// Creates a 3D card with school-colored background and high-contrast text
// isFoundational: true for major philosophers (historical_weight >= 0.9)
// isMostFoundational: true for THE foundational philosophers (historical_weight === 1.0)
function createTextCard(text, schoolColor, isFoundational = false, isMostFoundational = false) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  
  // High resolution for crystal clear text (3x base, no cap)
  const pixelRatio = 3;
  
  // Font settings - Arial Narrow, NO bold, sharp rendering
  const baseFontSize = 72;
  const fontSize = isMostFoundational ? 96 : (isFoundational ? 84 : baseFontSize);
  const fontWeight = '400'; // Always normal weight - NO bold
  
  // Arial Narrow as primary, with condensed fallbacks
  const fontFamily = '"Arial Narrow", "Helvetica Neue Condensed", "Arial", sans-serif';
  
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const textWidth = ctx.measureText(text).width;
  
  // Size canvas to fit text with padding
  const padding = 40;
  const canvasWidth = (textWidth + padding * 2) * pixelRatio;
  const canvasHeight = (fontSize + padding) * pixelRatio;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  // Scale context for high DPI rendering
  ctx.scale(pixelRatio, pixelRatio);
  
  // Disable image smoothing for crisp edges
  ctx.imageSmoothingEnabled = false;
  
  // Re-set font after resize
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const centerX = (canvasWidth / pixelRatio) / 2;
  const centerY = (canvasHeight / pixelRatio) / 2;
  
  // School-colored card background
  const bgPadding = 14;
  const radius = 6;
  const bgWidth = textWidth + bgPadding * 2;
  const bgHeight = fontSize * 0.85;
  const bgX = centerX - bgWidth / 2;
  const bgY = centerY - bgHeight / 2;
  
  // Parse school color for rgba
  const hex = schoolColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Draw solid card background with school color
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.beginPath();
  ctx.roundRect(bgX, bgY, bgWidth, bgHeight, radius);
  ctx.fill();
  
  // Crisp border for definition
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Determine text color based on background luminance
  const textColor = getContrastTextColor(schoolColor);
  
  // Draw sharp text - NO shadow, NO blur
  ctx.fillStyle = textColor;
  ctx.fillText(text, centerX, centerY);
  
  // Create texture from canvas - settings for SHARP rendering
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;    // No mipmap blur
  texture.magFilter = THREE.LinearFilter;    // Smooth when close (NearestFilter too pixelated)
  texture.generateMipmaps = false;           // Disable blurry LODs
  texture.anisotropy = 16;                   // Keep anisotropic filtering
  
  // Calculate card dimensions in world units
  const baseScale = 0.05 / pixelRatio;
  const scale = isMostFoundational ? 0.065 / pixelRatio : (isFoundational ? 0.058 / pixelRatio : baseScale);
  const cardWidth = canvasWidth * scale;
  const cardHeight = canvasHeight * scale;
  
  // Create double-sided plane geometry
  const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight);
  
  // Front side material
  const frontMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 1.0,
    side: THREE.FrontSide,
    depthTest: true,
    depthWrite: false,
  });
  
  // Back side material (same texture, will appear mirrored which is fine for readability)
  const backMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 1.0,
    side: THREE.BackSide,
    depthTest: true,
    depthWrite: false,
  });
  
  // Create a group to hold both sides
  const cardGroup = new THREE.Group();
  
  const frontMesh = new THREE.Mesh(geometry, frontMaterial);
  const backMesh = new THREE.Mesh(geometry.clone(), backMaterial);
  
  cardGroup.add(frontMesh);
  cardGroup.add(backMesh);
  
  // Store metadata for later use
  cardGroup.userData.isTextCard = true;
  cardGroup.userData.cardWidth = cardWidth;
  cardGroup.userData.cardHeight = cardHeight;
  
  return cardGroup;
}

// Legacy sprite function kept for compatibility but redirects to card
function createTextSprite(text, color, isFoundational = false, isMostFoundational = false) {
  return createTextCard(text, color, isFoundational, isMostFoundational);
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
const PROXIMITY_THRESHOLD = 2.0; // Degrees - wider threshold to catch more overlaps
const BASE_SPREAD_RADIUS = 20; // Base units to spread philosophers apart tangentially
const ALTITUDE_VARIATION = 15; // Vertical separation for tilting Earth to reveal lower cards
const LABEL_STAGGER = 12; // Vertical gap between card layers for depth reading

// Group nodes by proximity and calculate spread offsets
// Returns a Map of nodeId -> { offsetX, offsetZ, altitudeOffset } in tangent space
function calculateSpreadOffsets(nodes) {
  const offsets = new Map();
  const groups = [];
  const assigned = new Set();

  // Group nodes by proximity (use wider threshold)
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
    // Sort by historical weight (highest first) so most important are centered/highest
    group.sort((a, b) => (b.historical_weight || 0.5) - (a.historical_weight || 0.5));

    const count = group.length;
    // Check if the top philosopher (first after sorting) should stay centered
    const topPhilosopher = group[0];
    const topStaysCentered = topPhilosopher.historical_weight >= 0.9;
    const spreadCount = topStaysCentered ? count - 1 : count;
    
    // For large groups, use a grid/spiral layout instead of pure circle
    const useGridLayout = count > 6;
    
    group.forEach((node, index) => {
      if (count === 1) {
        // Only one philosopher - no offset needed
        offsets.set(node.id, { offsetX: 0, offsetZ: 0, altitudeOffset: 0 });
      } else if (index === 0 && topStaysCentered) {
        // Most important philosopher stays at center and slightly elevated
        offsets.set(node.id, { offsetX: 0, offsetZ: 0, altitudeOffset: ALTITUDE_VARIATION * 1.2 });
      } else {
        const circleIndex = topStaysCentered ? index - 1 : index;
        
        let offsetX, offsetZ, altitudeOffset;
        
        if (useGridLayout) {
          // Grid/spiral layout for large groups - better separation
          const cols = Math.ceil(Math.sqrt(spreadCount));
          const row = Math.floor(circleIndex / cols);
          const col = circleIndex % cols;
          // Offset rows to create staggered pattern (horizontal zigzag)
          const rowOffset = (row % 2) * 0.5;
          const spacing = BASE_SPREAD_RADIUS * 1.2;
          
          offsetX = (col - cols / 2 + rowOffset) * spacing;
          offsetZ = (row - Math.ceil(spreadCount / cols) / 2) * spacing * 0.5;
          // Progressive altitude: each card lower than previous for depth viewing
          altitudeOffset = -circleIndex * LABEL_STAGGER;
        } else {
          // Circle layout for small groups - spread horizontally with vertical stagger
          const angle = (circleIndex / spreadCount) * Math.PI * 2;
          const radius = BASE_SPREAD_RADIUS * (1 + (spreadCount - 1) * 0.15);
          
          offsetX = Math.cos(angle) * radius;
          offsetZ = Math.sin(angle) * radius * 0.3; // Flatten Z spread
          // Progressive altitude: each card at different height for tilted viewing
          altitudeOffset = -circleIndex * LABEL_STAGGER;
        }
        
        offsets.set(node.id, { offsetX, offsetZ, altitudeOffset });
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
  
  // Get school color (primary) with tradition as fallback
  const schoolColorHex = SCHOOL_COLORS[node.school] || TRADITION_COLORS[node.tradition] || '#FFFFFF';
  const color = new THREE.Color(schoolColorHex);
  
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
  const labelSprite = createTextSprite(node.name, schoolColorHex, isFoundational, isMostFoundational);
  labelSprite.position.set(0, labelOffset, 0); // Offset above the satellite (local coords)
  labelSprite.userData.isLabel = true;
  group.add(labelSprite);
  
  // Thin line connecting label to satellite sphere
  const labelLineStart = new THREE.Vector3(0, coreSize + 0.2, 0);
  const labelLineEnd = new THREE.Vector3(0, labelOffset - 1.5, 0);
  const labelLine = createLabelLine(labelLineStart, labelLineEnd, schoolColorHex);
  labelLine.userData.isLabelLine = true;
  group.add(labelLine);
  
  // Position directly above city at calculated altitude
  // This position is in Earth-local coordinates (satellite is child of Earth)
  // Apply altitude offset from spread calculation if provided
  const altitudeBoost = spreadOffset?.altitudeOffset || 0;
  let finalPos = latLngToVector3(node.latitude, node.longitude, earthRadius + altitude + altitudeBoost);
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

// Helper to convert hex string (#RRGGBB) to THREE.js integer
function hexStringToInt(hex) {
  if (typeof hex === 'number') return hex;
  return parseInt(hex.replace('#', ''), 16);
}

// Create hair-thin line connecting philosophers of the same school
function createSchoolConnection(sourcePos, targetPos, schoolName) {
  const hexColor = SCHOOL_COLORS[schoolName] || '#AAAAAA';
  const color = hexStringToInt(hexColor);
  
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
  const hoveredNodeRef = useRef(null); // Track hovered node for mobile tap

  // Keep hoveredNodeRef in sync with hoveredNode prop
  useEffect(() => {
    hoveredNodeRef.current = hoveredNode;
  }, [hoveredNode]);

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
    let suppressClickUntil = 0;

    const updatePointerFromClient = (clientX, clientY) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const getIntersectedNodeId = () => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const satellites = Array.from(satellitesRef.current.values());
      const intersects = raycasterRef.current.intersectObjects(satellites, true);

      if (intersects.length === 0) return null;

      let obj = intersects[0].object;
      while (obj && !obj.userData.nodeId) {
        obj = obj.parent;
      }

      return obj?.userData.nodeId || null;
    };

    const handleMouseDown = (e) => {
      isDragging = true;
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      // Update mouse for raycasting
      updatePointerFromClient(e.clientX, e.clientY);

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
      if (Date.now() < suppressClickUntil) {
        return;
      }

      updatePointerFromClient(e.clientX, e.clientY);
      const nodeId = getIntersectedNodeId();

      if (nodeId) {
        onNodeSelect(nodeId);
      } else {
        onNodeSelect(null);
      }
    };

    // Touch event handlers for mobile
    let lastTouchDistance = 0;
    let lastTouchCenter = { x: 0, y: 0 };
    let touchStartPos = { x: 0, y: 0 };
    let touchStartTime = 0;
    const TAP_THRESHOLD = 50; // pixels - generous for mobile
    const TAP_TIME_THRESHOLD = 500; // ms - generous for mobile

    const handleTouchStart = (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        isDragging = true;
        previousMouse = { x: touch.clientX, y: touch.clientY };
        touchStartPos = { x: touch.clientX, y: touch.clientY };
        touchStartTime = Date.now();
        // Update mouseRef for raycast
        updatePointerFromClient(touch.clientX, touch.clientY);
      } else if (e.touches.length === 2) {
        // Two touches - start pinch zoom
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
        lastTouchCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging && !isAnimatingRef.current) {
        // Single touch drag - rotate globe
        const touch = e.touches[0];
        const deltaX = touch.clientX - previousMouse.x;
        const deltaY = touch.clientY - previousMouse.y;

        spherical.theta -= deltaX * 0.008;
        spherical.phi -= deltaY * 0.008;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);

        previousMouse = { x: touch.clientX, y: touch.clientY };

        // Update mouse for raycasting
        updatePointerFromClient(touch.clientX, touch.clientY);
      } else if (e.touches.length === 2) {
        // Pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const touchDistance = Math.sqrt(dx * dx + dy * dy);

        if (lastTouchDistance > 0) {
          const scale = lastTouchDistance / touchDistance;
          spherical.radius = Math.max(150, Math.min(600, spherical.radius * scale));
          camera.position.setFromSpherical(spherical);
          camera.lookAt(0, 0, 0);
        }

        lastTouchDistance = touchDistance;
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length === 0) {
        e.preventDefault();
        // Check if this was a tap (short time, small movement)
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartPos.x;
        const dy = touch.clientY - touchStartPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const duration = Date.now() - touchStartTime;

        if (distance < TAP_THRESHOLD && duration < TAP_TIME_THRESHOLD) {
          // Re-raycast the exact tap point so mobile selection does not depend on hover timing.
          updatePointerFromClient(touch.clientX, touch.clientY);
          const tappedNodeId = getIntersectedNodeId() || hoveredNodeRef.current?.id || null;
          if (tappedNodeId) {
            suppressClickUntil = Date.now() + 400;
            onNodeSelect(tappedNodeId);
          }
        }

        isDragging = false;
        lastTouchDistance = 0;
      } else if (e.touches.length === 1) {
        // Switched from pinch to single touch
        isDragging = true;
        const touch = e.touches[0];
        previousMouse = { x: touch.clientX, y: touch.clientY };
        touchStartPos = { x: touch.clientX, y: touch.clientY };
        touchStartTime = Date.now();
        lastTouchDistance = 0;
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('click', handleClick);
    
    // Touch events for mobile
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

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
        
        // Rotate text cards to face camera (billboard effect with vertical constraint)
        satellite.children.forEach((child) => {
          if (child.userData?.isLabel && child.userData?.isTextCard) {
            // Get card's world position
            const cardWorldPos = new THREE.Vector3();
            child.getWorldPosition(cardWorldPos);
            
            // Calculate direction from card to camera in world space
            const directionToCamera = new THREE.Vector3();
            directionToCamera.subVectors(camera.position, cardWorldPos);
            
            // Project onto horizontal plane (keep cards upright)
            directionToCamera.y = 0;
            
            // Only rotate if we have a valid direction
            if (directionToCamera.lengthSq() > 0.0001) {
              directionToCamera.normalize();
              
              // Calculate target rotation angle in world space
              const worldAngle = Math.atan2(directionToCamera.x, directionToCamera.z);
              
              // Get the satellite's world rotation (includes Earth rotation)
              const satelliteWorldQuat = new THREE.Quaternion();
              satellite.getWorldQuaternion(satelliteWorldQuat);
              
              // Extract Y rotation from satellite's world quaternion
              const euler = new THREE.Euler().setFromQuaternion(satelliteWorldQuat, 'YXZ');
              const parentYRotation = euler.y;
              
              // Apply rotation relative to parent's world rotation
              child.rotation.y = worldAngle - parentYRotation;
            }
          }
        });
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
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
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
        const schoolColor = SCHOOL_COLORS[node.school] || TRADITION_COLORS[node.tradition] || '#FFFFFF';
        const tetherLine = createTetherLine(surfacePos, targetPos, schoolColor);
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
      {/* Zoom Controls - moved up ~2cm (75px) */}
      <div
        style={{
          position: 'absolute',
          bottom: '95px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 1000,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => { e.stopPropagation(); zoomIn(); }}
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
          onClick={(e) => { e.stopPropagation(); zoomOut(); }}
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
          onClick={(e) => { e.stopPropagation(); resetView(); }}
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
