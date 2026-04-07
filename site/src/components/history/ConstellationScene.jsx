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

// Earth texture URLs (NASA Blue Marble + Real Topography)
const EARTH_TEXTURE = 'https://unpkg.com/three-globe@2.45.1/example/img/earth-blue-marble.jpg';
const EARTH_BUMP = 'https://unpkg.com/three-globe@2.45.1/example/img/earth-topology.png';
const EARTH_DISPLACEMENT = 'https://unpkg.com/three-globe@2.45.1/example/img/earth-topology.png'; // Elevation map for real 3D topography
const EARTH_SPECULAR = 'https://unpkg.com/three-globe@2.45.1/example/img/earth-water.png'; // Ocean specular map
const STAR_TEXTURE = 'https://unpkg.com/three-globe@2.45.1/example/img/night-sky.png';

// ============================================================
// EARTH ROTATION BY ERA - Geographic center of philosophy
// ============================================================
// Maps timeline year to Earth Y-rotation (radians) to show the 
// geographic center of philosophical activity for that era.
// Longitude is converted to rotation: rotation = -longitude * PI / 180
// (negative because Three.js Y-axis rotation is clockwise from above)
// ============================================================

function getEarthRotationForYear(year) {
  // Define eras and their approximate geographic centers (longitude)
  const eras = [
    { year: -600, longitude: 24 },   // Ancient Greece (Athens ~24°E)
    { year: -300, longitude: 26 },   // Hellenistic (Alexandria ~30°E, Athens ~24°E - blend)
    { year: 200, longitude: 30 },    // Late Antiquity (Alexandria, Constantinople)
    { year: 500, longitude: 35 },    // Early Medieval (Byzantine, early Islamic)
    { year: 900, longitude: 40 },    // Islamic Golden Age (Baghdad ~44°E, Cordoba ~-5°E - eastern emphasis)
    { year: 1200, longitude: 12 },   // High Medieval Europe (Paris, Oxford, Bologna)
    { year: 1500, longitude: 10 },   // Renaissance (Italy, Northern Europe)
    { year: 1700, longitude: 5 },    // Enlightenment (France, Germany, Britain)
    { year: 1850, longitude: 10 },   // 19th Century (Germany dominant - Kant, Hegel, Marx, Nietzsche)
    { year: 1950, longitude: -40 },  // 20th Century (expanding to Americas - pragmatism, Vienna Circle emigrants)
    { year: 2026, longitude: -20 },  // Contemporary (global, slight Western bias)
  ];

  // Find the two eras that bracket the current year
  let prevEra = eras[0];
  let nextEra = eras[eras.length - 1];

  for (let i = 0; i < eras.length - 1; i++) {
    if (year >= eras[i].year && year < eras[i + 1].year) {
      prevEra = eras[i];
      nextEra = eras[i + 1];
      break;
    }
  }

  // Handle edge cases
  if (year <= eras[0].year) {
    return -eras[0].longitude * Math.PI / 180;
  }
  if (year >= eras[eras.length - 1].year) {
    return -eras[eras.length - 1].longitude * Math.PI / 180;
  }

  // Linear interpolation between eras
  const t = (year - prevEra.year) / (nextEra.year - prevEra.year);
  const longitude = prevEra.longitude + t * (nextEra.longitude - prevEra.longitude);

  // Convert longitude to Y-rotation (negative because of Three.js coordinate system)
  return -longitude * Math.PI / 180;
}

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
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
  const layout = getLayoutConfig();
  
  // High resolution for crystal clear text (3x base, no cap)
  const pixelRatio = 3;
  
  // Font settings - Arial Narrow, NO bold, sharp rendering
  const baseFontSize = layout.textBaseFontSize;
  const fontSize = isMostFoundational
    ? layout.textMostFoundationalFontSize
    : (isFoundational ? layout.textFoundationalFontSize : baseFontSize);
  const fontWeight = '400'; // Always normal weight - NO bold
  
  // Arial Narrow as primary, with condensed fallbacks
  const fontFamily = '"Arial Narrow", "Helvetica Neue Condensed", "Arial", sans-serif';
  
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const textWidth = ctx.measureText(text).width;
  
  // Size canvas to fit text with padding
  const padding = layout.textPadding;
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
  const bgPadding = layout.textCardPadding;
  const radius = layout.textCardRadius;
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
  const baseScale = layout.textBaseScale / pixelRatio;
  const scale = isMostFoundational
    ? layout.textMostFoundationalScale / pixelRatio
    : (isFoundational ? layout.textFoundationalScale / pixelRatio : baseScale);
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

function getLayoutConfig() {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const isMobile = viewportWidth < 768;

  return {
    textBaseFontSize: isMobile ? 52 : 60,
    textFoundationalFontSize: isMobile ? 62 : 70,
    textMostFoundationalFontSize: isMobile ? 72 : 82,
    textPadding: isMobile ? 28 : 32,
    textCardPadding: isMobile ? 10 : 12,
    textCardRadius: isMobile ? 5 : 6,
    textBaseScale: isMobile ? 0.041 : 0.044,
    textFoundationalScale: isMobile ? 0.047 : 0.051,
    textMostFoundationalScale: isMobile ? 0.053 : 0.057,
    baseAltitude: isMobile ? 14 : 18,
    foundationalAltitudeBoost: isMobile ? 4 : 6,
    mostFoundationalAltitudeBoost: isMobile ? 8 : 10,
    labelOffset: isMobile ? 3.4 : 4.2,
    proximityThreshold: isMobile ? 10 : 8,     // Moderate detection range
    spreadRadius: isMobile ? 18 : 22,          // Modest horizontal spread
    altitudeVariation: isMobile ? 12 : 14,
    labelStagger: isMobile ? 10 : 12,          // Good vertical separation
  };
}

// Group nodes by proximity and calculate spread offsets
// Returns a Map of nodeId -> { offsetX, offsetZ, altitudeOffset } in tangent space
function calculateSpreadOffsets(nodes) {
  const layout = getLayoutConfig();
  const offsets = new Map();
  const groups = [];
  const assigned = new Set();

  // Group nodes by proximity using approximate spherical distance
  // This catches cards that might visually overlap from any viewing angle
  nodes.forEach((node) => {
    if (assigned.has(node.id)) return;

    const group = [node];
    assigned.add(node.id);

    nodes.forEach((other) => {
      if (assigned.has(other.id)) return;
      const latDiff = Math.abs(node.latitude - other.latitude);
      const lngDiff = Math.abs(node.longitude - other.longitude);
      // Use approximate great-circle distance (simplified for small angles)
      const avgLat = (node.latitude + other.latitude) / 2;
      const latRad = avgLat * Math.PI / 180;
      const effectiveLngDiff = lngDiff * Math.cos(latRad); // Adjust for latitude
      const distance = Math.sqrt(latDiff * latDiff + effectiveLngDiff * effectiveLngDiff);
      
      if (distance < layout.proximityThreshold) {
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
        offsets.set(node.id, {
          offsetX: 0,
          offsetZ: 0,
          altitudeOffset: layout.altitudeVariation * 1.2,
        });
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
          const spacing = layout.spreadRadius * 1.4; // Wider spacing
          
          offsetX = (col - cols / 2 + rowOffset) * spacing;
          offsetZ = (row - Math.ceil(spreadCount / cols) / 2) * spacing * 0.6;
          // Progressive altitude: each card lower than previous for depth viewing
          altitudeOffset = -circleIndex * layout.labelStagger;
        } else {
          // Circle layout for small groups - spread horizontally with vertical stagger
          // Start at 45° offset so no philosopher lands exactly at angle 0 (which has no Z spread)
          const angleOffset = Math.PI / 4;
          const angle = angleOffset + (circleIndex / spreadCount) * Math.PI * 2;
          // Ensure minimum 1.8x spread for pairs (spreadCount=1 means 2 philosophers, 1 centered)
          const radiusMultiplier = Math.max(1.8, 1 + (spreadCount - 1) * 0.2);
          const radius = layout.spreadRadius * radiusMultiplier;
          
          offsetX = Math.cos(angle) * radius;
          offsetZ = Math.sin(angle) * radius * 0.8; // Increased vertical spread
          // Progressive altitude: each card at different height for tilted viewing
          altitudeOffset = -circleIndex * layout.labelStagger;
        }
        
        offsets.set(node.id, { offsetX, offsetZ, altitudeOffset });
      }
    });
  });

  return offsets;
}

// Helper to get translated philosopher name
function getTranslatedName(node, t) {
  const translated = t(`constellation.names.${node.id}`, { defaultValue: '' });
  return translated || node.name;
}

// Apply tether inclination to a radial vector
// x_inclination: East/West angle (degrees, positive = East)
// y_inclination: North/South angle (degrees, positive = North)
function applyTetherInclination(surfacePos, earthRadius, xInclination, yInclination, altitude) {
  // Get the radial direction (from Earth center to surface point)
  const radial = surfacePos.clone().normalize();
  
  // Calculate tangent vectors at this position
  // East vector: perpendicular to radial, pointing East
  const worldUp = new THREE.Vector3(0, 1, 0);
  const eastVec = new THREE.Vector3().crossVectors(worldUp, radial).normalize();
  // North vector: perpendicular to both radial and east
  const northVec = new THREE.Vector3().crossVectors(radial, eastVec).normalize();
  
  // Convert inclination angles to radians
  const xRad = (xInclination || 0) * Math.PI / 180;
  const yRad = (yInclination || 0) * Math.PI / 180;
  
  // Apply rotations to the radial direction
  // First rotate around North axis (for East/West inclination)
  // Then rotate around East axis (for North/South inclination)
  const inclinedDir = radial.clone();
  
  // East/West rotation (around north vector)
  if (xRad !== 0) {
    const cosX = Math.cos(xRad);
    const sinX = Math.sin(xRad);
    // Rodrigues rotation formula
    inclinedDir.multiplyScalar(cosX);
    inclinedDir.add(new THREE.Vector3().crossVectors(northVec, radial).multiplyScalar(sinX));
    inclinedDir.add(northVec.clone().multiplyScalar(northVec.dot(radial) * (1 - cosX)));
    inclinedDir.normalize();
  }
  
  // North/South rotation (around east vector)
  if (yRad !== 0) {
    const cosY = Math.cos(yRad);
    const sinY = Math.sin(yRad);
    const tempDir = inclinedDir.clone();
    inclinedDir.multiplyScalar(cosY);
    inclinedDir.add(new THREE.Vector3().crossVectors(eastVec, tempDir).multiplyScalar(sinY));
    inclinedDir.add(eastVec.clone().multiplyScalar(eastVec.dot(tempDir) * (1 - cosY)));
    inclinedDir.normalize();
  }
  
  // Calculate final position at the specified altitude along the inclined direction
  return inclinedDir.multiplyScalar(earthRadius + altitude);
}

// Create satellite mesh - positioned using orbital tether inclination from API
function createSatellite(node, earthRadius, spreadOffset = null, t = null) {
  const group = new THREE.Group();
  group.userData = { nodeId: node.id, node, isAutoEnriched: node.auto_enriched || false };
  const layout = getLayoutConfig();
  
  // Determine if philosopher is foundational based on historical_weight
  const weight = node.historical_weight || 0.5;
  const isMostFoundational = weight >= 1.0; // Socrates, Plato, Aristotle, Kant, Confucius, Buddha
  const isFoundational = weight >= 0.9; // Major figures in philosophy
  
  // Get school color (primary) with tradition as fallback
  const schoolColorHex = SCHOOL_COLORS[node.school] || TRADITION_COLORS[node.tradition] || '#FFFFFF';
  
  // Get translated name (falls back to node.name if no translation)
  const displayName = t ? getTranslatedName(node, t) : node.name;
  
  // Name label - bold and larger for foundational philosophers
  const labelOffset = layout.labelOffset + (isMostFoundational ? 1.2 : (isFoundational ? 0.6 : 0));
  const labelSprite = createTextSprite(displayName, schoolColorHex, isFoundational, isMostFoundational);
  labelSprite.position.set(0, labelOffset, 0); // Offset above the satellite (local coords)
  labelSprite.userData.isLabel = true;
  group.add(labelSprite);
  
  const cardHeight = labelSprite.userData.cardHeight || 0;
  const tetherAnchorLocal = new THREE.Vector3(0, labelOffset - cardHeight / 2, 0);
  group.userData.tetherAnchorLocal = tetherAnchorLocal.clone();
  
  // Surface position (birthplace on Earth)
  const surfacePos = latLngToVector3(node.latitude, node.longitude, earthRadius);
  
  // Get orbital position from API (if available)
  const orbital = node.orbital_position;
  
  let finalPos;
  if (orbital && (orbital.x_inclination !== undefined || orbital.y_inclination !== undefined)) {
    // Use API-provided orbital tether inclination
    const xInclination = orbital.x_inclination || 0;
    const yInclination = orbital.y_inclination || 0;
    const altitude = orbital.z_altitude ? (orbital.z_altitude - 100) * 0.15 + layout.baseAltitude : layout.baseAltitude;
    
    // Apply foundational boosts
    let finalAltitude = altitude;
    if (isMostFoundational) {
      finalAltitude += layout.mostFoundationalAltitudeBoost;
    } else if (isFoundational) {
      finalAltitude += layout.foundationalAltitudeBoost;
    }
    
    // Calculate position using tether inclination
    finalPos = applyTetherInclination(surfacePos, earthRadius, xInclination, yInclination, finalAltitude);
  } else {
    // Fallback: position directly above birthplace (legacy behavior)
    let altitude = layout.baseAltitude;
    if (isMostFoundational) {
      altitude += layout.mostFoundationalAltitudeBoost;
    } else if (isFoundational) {
      altitude += layout.foundationalAltitudeBoost;
    }
    finalPos = latLngToVector3(node.latitude, node.longitude, earthRadius + altitude);
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
  
  // Straight line from the card down to the birthplace on Earth
  const points = [satellitePos.clone(), surfacePos.clone()];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  // Higher opacity for visibility (linewidth doesn't work in WebGL but opacity does)
  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.6,
    linewidth: 2,
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
  isPlaying,
}, ref) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
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
  const targetEarthRotationRef = useRef(getEarthRotationForYear(-600)); // Target Y-rotation based on timeline year
  const isPlayingRef = useRef(isPlaying !== undefined ? isPlaying : true);

  // Keep hoveredNodeRef in sync with hoveredNode prop
  useEffect(() => {
    hoveredNodeRef.current = hoveredNode;
  }, [hoveredNode]);

  // Keep isPlayingRef in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Update Earth rotation target when timeline year changes
  useEffect(() => {
    if (currentYear !== undefined && currentYear !== null) {
      targetEarthRotationRef.current = getEarthRotationForYear(currentYear);
    }
  }, [currentYear]);

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
    
    // Higher subdivision for smooth displacement topography (256 segments)
    const earthGeometry = new THREE.SphereGeometry(100, 256, 256);
    
    // Load textures
    const earthTexture = textureLoader.load(EARTH_TEXTURE);
    const bumpTexture = textureLoader.load(EARTH_BUMP);
    const displacementTexture = textureLoader.load(EARTH_DISPLACEMENT);
    const specularTexture = textureLoader.load(EARTH_SPECULAR);
    
    // MeshStandardMaterial for realistic PBR rendering with real topography
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.8,
      displacementMap: displacementTexture,
      displacementScale: 2.5, // Real 3D elevation - mountains/valleys visible
      roughnessMap: specularTexture,
      roughness: 0.8,
      metalness: 0.1,
      // Oceans are smoother (specular map makes them shinier)
      metalnessMap: specularTexture,
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    // Initial rotation: face Greece/Eastern Mediterranean when History opens.
    // Camera is at (0, 100, 350) looking at origin — sees the +Z face of the globe.
    // Default Three.js SphereGeometry puts ~90°W (Americas) facing +Z at rotation.y=0.
    // Greece is at ~24°E. To bring 24°E to face +Z:
    //   offset = (targetLongitude - defaultLongitude) in degrees = 24 - (-90) = 114°
    //   rotation.y = +114° in radians = +1.99 rad
    earth.rotation.y = (90 + 24) * Math.PI / 180; // +1.99 rad — Greece/Eastern Med faces camera
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

    // Starfield - Enhanced with point-based stars for better appearance
    const createStarfield = () => {
      const starCount = 8000;
      const positions = new Float32Array(starCount * 3);
      const colors = new Float32Array(starCount * 3);
      const sizes = new Float32Array(starCount);
      
      for (let i = 0; i < starCount; i++) {
        // Distribute stars on a sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 800 + Math.random() * 200; // Vary distance slightly
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        
        // Vary star colors slightly (white to blue-white to warm)
        const colorVariation = Math.random();
        if (colorVariation < 0.7) {
          // White stars (majority)
          colors[i * 3] = 0.9 + Math.random() * 0.1;
          colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
          colors[i * 3 + 2] = 1.0;
        } else if (colorVariation < 0.85) {
          // Blue-white stars
          colors[i * 3] = 0.7 + Math.random() * 0.2;
          colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
          colors[i * 3 + 2] = 1.0;
        } else {
          // Warm stars (yellow/orange)
          colors[i * 3] = 1.0;
          colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
          colors[i * 3 + 2] = 0.6 + Math.random() * 0.3;
        }
        
        // Vary star sizes - mostly small, few bright ones
        const sizeRandom = Math.random();
        if (sizeRandom < 0.8) {
          sizes[i] = 1.0 + Math.random() * 1.5; // Small stars
        } else if (sizeRandom < 0.95) {
          sizes[i] = 2.5 + Math.random() * 2.0; // Medium stars
        } else {
          sizes[i] = 4.5 + Math.random() * 3.0; // Bright stars
        }
      }
      
      const starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      const starMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          varying float vSize;
          void main() {
            vColor = color;
            vSize = size;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vSize;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            // Soft glow effect
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            alpha *= 0.8 + 0.2 * vSize / 7.0; // Brighter for larger stars
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);
      return stars;
    };
    
    const starfield = createStarfield();
    
    // Also add background texture for nebula/milky way effect
    textureLoader.load(STAR_TEXTURE, (texture) => {
      const bgGeometry = new THREE.SphereGeometry(950, 32, 32);
      const bgMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
        opacity: 0.4,
        transparent: true,
      });
      const background = new THREE.Mesh(bgGeometry, bgMaterial);
      scene.add(background);
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

      // Earth rotation: lerp toward target when set, otherwise slow continuous spin
      if (earthRef.current) {
        if (targetEarthRotationRef.current !== null && !isPlayingRef.current) {
          // Smoothly rotate globe toward target (e.g., philosopher's birthplace)
          const current = earthRef.current.rotation.y;
          const target = targetEarthRotationRef.current;
          let diff = target - current;
          // Normalize to [-PI, PI] for shortest rotation path
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) > 0.005) {
            earthRef.current.rotation.y += diff * 0.05;
          } else {
            earthRef.current.rotation.y = target;
          }
        } else if (isPlayingRef.current) {
          earthRef.current.rotation.y += 0.002;
        }
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

  // Track previous language to detect changes
  const prevLanguageRef = useRef(currentLanguage);

  // Update satellites when nodes or language changes
  useEffect(() => {
    if (!sceneRef.current || !earthRef.current) return;

    const earth = earthRef.current;
    const currentIds = new Set(nodes.map(n => n.id));
    const languageChanged = prevLanguageRef.current !== currentLanguage;
    prevLanguageRef.current = currentLanguage;

    // If language changed, clear ALL satellites to rebuild with new translations
    if (languageChanged) {
      satellitesRef.current.forEach((satellite, id) => {
        earth.remove(satellite);
        const tetherLine = tetherLinesRef.current.get(id);
        if (tetherLine) {
          earth.remove(tetherLine);
        }
      });
      satellitesRef.current.clear();
      tetherLinesRef.current.clear();
    } else {
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
    }

    // Add new satellites as CHILDREN of Earth (so they rotate with Earth)
    // Positioning is now handled by the API's orbital_position data
    nodes.forEach(node => {
      if (!satellitesRef.current.has(node.id)) {
        const satellite = createSatellite(node, 100, null, t);
        earth.add(satellite); // Add to Earth so satellites rotate WITH Earth
        satellitesRef.current.set(node.id, satellite);

        // Create tether line from satellite to city on Earth surface
        const surfacePos = satellite.userData.surfacePosition;
        const targetPos = satellite.userData.targetPosition;
        const tetherAnchorLocal = satellite.userData.tetherAnchorLocal || new THREE.Vector3();
        const tetherStart = targetPos.clone().add(tetherAnchorLocal);
        const schoolColor = SCHOOL_COLORS[node.school] || TRADITION_COLORS[node.tradition] || '#FFFFFF';
        const tetherLine = createTetherLine(surfacePos, tetherStart, schoolColor);
        earth.add(tetherLine);
        tetherLinesRef.current.set(node.id, tetherLine);

        // Launch animation - start at surface, animate to altitude
        // Skip animation if language changed (instant rebuild)
        if (languageChanged) {
          satellite.position.copy(targetPos);
          satellite.scale.set(1, 1, 1);
        } else {
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
      }
    });
  }, [nodes, currentLanguage, t]);

  // NOTE: Philosopher-to-philosopher connection lines have been disabled.
  // Only tether lines (philosopher → birthplace on Earth) are shown.
  // The edges data is still used for the info panel connections list.

  // Highlight selected node — enlarge card and thicken tether
  useEffect(() => {
    satellitesRef.current.forEach((satellite, id) => {
      const isSelected = selectedNode?.id === id;
      const scaleFactor = isSelected ? 1.8 : 1.0;

      satellite.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.material.opacity = isSelected ? 1 : 0.9;
        }
        if (child instanceof THREE.Sprite) {
          child.scale.setScalar(isSelected ? 8 : 3 + (satellite.userData.node?.historical_weight || 0.5) * 4);
        }
        // Scale up the text card group when selected
        if (child.userData?.isTextCard) {
          child.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }
      });

      // Thicken and brighten the tether line when selected
      const tetherLine = tetherLinesRef.current.get(id);
      if (tetherLine) {
        tetherLine.material.opacity = isSelected ? 1.0 : 0.6;
        tetherLine.material.linewidth = isSelected ? 4 : 2;
        tetherLine.material.needsUpdate = true;
      }
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
    // Use smooth animation to return to default view
    targetCameraRef.current = new THREE.Vector3(0, 100, 350);
    isAnimatingRef.current = true;
  }, []);

  // Expose flyToNode and zoom methods
  useImperativeHandle(ref, () => ({
    flyToNode: (node) => {
      if (!cameraRef.current || !node || !earthRef.current) return;
      
      // Rotate globe to face the philosopher's birthplace
      if (node.longitude !== undefined) {
        targetEarthRotationRef.current = -node.longitude * Math.PI / 180;
      }
      
      // Delay camera fly-to so the globe has time to rotate toward birthplace
      const doFly = () => {
        const satellite = satellitesRef.current.get(node.id);
        if (satellite) {
          // Get satellite position in world coordinates (accounting for Earth rotation)
          const worldPos = new THREE.Vector3();
          satellite.getWorldPosition(worldPos);
          const direction = worldPos.clone().normalize();
          
          // Position camera further back and lower to center the card in viewport
          // This prevents cards at high latitudes from being hidden by the header
          const cameraPos = direction.multiplyScalar(280);
          
          // For high-latitude positions (card near top/bottom of globe), 
          // adjust camera Y to bring the card toward center of viewport
          const latitudeOffset = worldPos.y * 0.4; // Shift camera opposite to card's Y
          cameraPos.y -= latitudeOffset;
          
          targetCameraRef.current = cameraPos;
          isAnimatingRef.current = true;
        }
      };
      
      // Wait for globe rotation to start, then fly camera
      setTimeout(doFly, 300);
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
    />
  );
});

export default ConstellationScene;
