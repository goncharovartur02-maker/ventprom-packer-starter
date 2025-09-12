'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PackResult } from '@ventprom/core';

interface ThreeDViewerProps {
  result: PackResult;
}

export default function ThreeDViewer({ result }: ThreeDViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [currentRow, setCurrentRow] = useState<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Add truck container (simplified)
    const truckGeometry = new THREE.BoxGeometry(2.4, 2.5, 12);
    const truckMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x888888, 
      transparent: true, 
      opacity: 0.3 
    });
    const truck = new THREE.Mesh(truckGeometry, truckMaterial);
    truck.position.set(0, 1.25, 0);
    scene.add(truck);

    // Add wireframe for truck
    const truckWireframe = new THREE.WireframeGeometry(truckGeometry);
    const truckLine = new THREE.LineSegments(
      truckWireframe,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    truckLine.position.set(0, 1.25, 0);
    scene.add(truckLine);

    // Render items
    renderItems();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [result]);

  const renderItems = () => {
    if (!sceneRef.current) return;

    // Clear existing items
    const itemsToRemove: THREE.Object3D[] = [];
    sceneRef.current.traverse((child) => {
      if (child.userData.isItem) {
        itemsToRemove.push(child);
      }
    });
    itemsToRemove.forEach(item => sceneRef.current?.remove(item));

    // Get items to render
    const itemsToRender = currentRow !== null 
      ? result.rows[currentRow] || []
      : result.placements;

    // Render items
    itemsToRender.forEach((placement, index) => {
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1); // Default size
      const material = new THREE.MeshLambertMaterial({ 
        color: new THREE.Color().setHSL(index / itemsToRender.length, 0.7, 0.6)
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position item (convert mm to meters and scale down)
      mesh.position.set(
        placement.x / 1000 - 1.2, // Center around 0
        placement.y / 1000,
        placement.z / 1000 - 6    // Center around 0
      );
      
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.isItem = true;
      mesh.userData.placement = placement;
      
      sceneRef.current?.add(mesh);
    });
  };

  useEffect(() => {
    renderItems();
  }, [currentRow, result]);

  const rowOptions = Object.keys(result.rows).map(Number).sort((a, b) => a - b);

  return (
    <div className="three-container">
      <div ref={mountRef} className="w-full h-full" />
      
      <div className="three-controls">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            View:
          </label>
          <select
            value={currentRow ?? 'all'}
            onChange={(e) => setCurrentRow(e.target.value === 'all' ? null : Number(e.target.value))}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Items</option>
            {rowOptions.map(row => (
              <option key={row} value={row}>
                Row {row}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="three-stats">
        <div className="space-y-1">
          <div className="text-xs">
            <strong>Items:</strong> {result.placements.length}
          </div>
          <div className="text-xs">
            <strong>Bins:</strong> {result.binsUsed}
          </div>
          <div className="text-xs">
            <strong>Volume Fill:</strong> {(result.metrics.volumeFill * 100).toFixed(1)}%
          </div>
          {currentRow !== null && (
            <div className="text-xs">
              <strong>Row {currentRow}:</strong> {result.rows[currentRow]?.length || 0} items
            </div>
          )}
        </div>
      </div>
    </div>
  );
}






