'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface ThreeDViewerProps {
  result: any;
}

export default function ThreeDViewer({ result }: ThreeDViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      10000
    );
    camera.position.set(5000, 3000, 5000);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Grid Helper
    const gridHelper = new THREE.GridHelper(10000, 20, 0x888888, 0xcccccc);
    scene.add(gridHelper);

    // Axes Helper
    const axesHelper = new THREE.AxesHelper(2000);
    scene.add(axesHelper);

    // Vehicle container
    const vehicle = result.vehicle;
    if (vehicle) {
      const vehicleGeometry = new THREE.BoxGeometry(
        vehicle.width,
        vehicle.height,
        vehicle.length
      );
      const vehicleMaterial = new THREE.MeshPhongMaterial({
        color: 0x2196f3,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      });
      const vehicleMesh = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
      vehicleMesh.position.set(0, vehicle.height / 2, 0);
      scene.add(vehicleMesh);

      // Vehicle wireframe
      const vehicleWireframe = new THREE.WireframeGeometry(vehicleGeometry);
      const vehicleLine = new THREE.LineSegments(
        vehicleWireframe,
        new THREE.LineBasicMaterial({ color: 0x1976d2, linewidth: 2 })
      );
      vehicleLine.position.set(0, vehicle.height / 2, 0);
      scene.add(vehicleLine);
    }

    // Render duct items
    result.items.forEach((item: any, index: number) => {
      const color = new THREE.Color().setHSL(
        (index * 0.1) % 1,
        0.7,
        0.6
      );

      let geometry;
      if (item.type === 'rect' && item.dimensions?.width && item.dimensions?.height) {
        geometry = new THREE.BoxGeometry(
          item.dimensions.width, 
          item.dimensions.height, 
          item.dimensions.length || 1000
        );
      } else if (item.type === 'round' && item.dimensions?.diameter) {
        geometry = new THREE.CylinderGeometry(
          item.dimensions.diameter / 2,
          item.dimensions.diameter / 2,
          item.dimensions.length || 1000,
          32
        );
      } else {
        // Fallback geometry
        geometry = new THREE.BoxGeometry(200, 100, 1000);
      }

      const material = new THREE.MeshPhongMaterial({
        color: color,
        opacity: 0.8,
        transparent: true
      });

      const mesh = new THREE.Mesh(geometry, material);
      
      // Simple grid positioning for demo (should use actual packing positions)
      const itemsPerRow = Math.ceil(Math.sqrt(result.items.length));
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      
      mesh.position.set(
        (col - itemsPerRow / 2) * 300,
        200,
        (row - itemsPerRow / 2) * 1200
      );

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
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

  return <div ref={mountRef} className="w-full h-full" />;
}







