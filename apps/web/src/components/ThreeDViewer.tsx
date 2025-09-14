'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import type { PackResult, DuctItem, Placement, Vehicle } from '@ventprom/core';

interface ThreeDViewerProps {
  result: PackResult;
}

export default function ThreeDViewer({ result }: ThreeDViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // Helper function to group placements by row (Y coordinate)
  const groupPlacementsByRow = (result: PackResult): Map<number, Placement[]> => {
    const rowGroups = new Map<number, Placement[]>();
    
    if (result.placements) {
      result.placements.forEach(placement => {
        const rowY = Math.round(placement.y / 100) * 100; // Группируем по 100мм
        if (!rowGroups.has(rowY)) {
          rowGroups.set(rowY, []);
        }
        rowGroups.get(rowY)!.push(placement);
      });
    }
    
    return rowGroups;
  };

  // Determine item color based on conditions
  const getItemColor = (item: DuctItem, placement?: Placement): THREE.Color => {
    const weight = item.weightKg || 0;
    const material = (item as any).material || 'galvanized';
    const flangeType = item.flangeType || 'DEFAULT';
    
    // Красный: перегруженные элементы (>30кг)
    if (weight > 30) {
      return new THREE.Color(0xff4444);
    }
    
    // Желтый: элементы требующие внимания (хрупкие)
    if (material.includes('оцинк') || weight > 20 || flangeType === 'TDC') {
      return new THREE.Color(0xffaa00);
    }
    
    // Зеленый: оптимально размещенные
    return new THREE.Color(0x44ff44);
  };

  // Create row separator planes
  const renderRows = (scene: THREE.Scene, rowGroups: Map<number, Placement[]>, vehicle: any) => {
    if (!vehicle) return;
    
    const sortedRows = Array.from(rowGroups.keys()).sort((a, b) => a - b);
    
    sortedRows.forEach((rowY, index) => {
      if (index === 0) return; // Пропускаем первый ряд (пол)
      
      // Полупрозрачная плоскость между рядами
      const planeGeometry = new THREE.PlaneGeometry(vehicle.width, vehicle.length);
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide
      });
      
      const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
      planeMesh.rotation.x = -Math.PI / 2; // Поворот на 90 градусов
      planeMesh.position.set(0, rowY, 0);
      scene.add(planeMesh);
      
      // Нумерация ряда
      const loader = new THREE.FontLoader();
      // В реальной реализации здесь нужно загрузить шрифт
      // Пока используем простой TextGeometry placeholder
      
      // Создаем простую геометрию для номера ряда
      const textGeometry = new THREE.BoxGeometry(200, 50, 10);
      const textMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      
      textMesh.position.set(
        -vehicle.width / 2 - 300,
        rowY + 25,
        0
      );
      scene.add(textMesh);
    });
  };

  // Render individual duct items
  const renderDuctItems = (scene: THREE.Scene, result: PackResult) => {
    if (result.placements && result.placements.length > 0) {
      // Используем реальные координаты из placements
      result.placements.forEach((placement, index) => {
        const item = result.items[index] || result.items[0]; // Fallback к первому элементу
        renderSingleDuctItem(scene, item, placement);
      });
    } else {
      // Fallback: простое размещение элементов
      result.items.forEach((item, index) => {
        const fakePlacement: Placement = {
          x: (index % 5) * 400 - 800,
          y: Math.floor(index / 5) * 200 + 100,
          z: 0,
          rot: [0, 0, 0]
        };
        renderSingleDuctItem(scene, item, fakePlacement);
      });
    }
  };

  // Render a single duct item with real coordinates and rotation
  const renderSingleDuctItem = (scene: THREE.Scene, item: DuctItem, placement: Placement) => {
    let geometry: THREE.BufferGeometry;
    
    // Создаем геометрию в зависимости от типа воздуховода
    if (item.type === 'rect' && item.w && item.h) {
      geometry = new THREE.BoxGeometry(item.w, item.h, item.length);
    } else if (item.type === 'round' && item.d) {
      geometry = new THREE.CylinderGeometry(
        item.d / 2,
        item.d / 2,
        item.length,
        32
      );
      // Поворачиваем цилиндр горизонтально
      geometry.rotateZ(Math.PI / 2);
    } else {
      // Fallback геометрия
      geometry = new THREE.BoxGeometry(200, 100, 1000);
    }

    // Материал с цветовой индикацией
    const color = getItemColor(item, placement);
    const material = new THREE.MeshPhongMaterial({
      color: color,
      opacity: 0.85,
      transparent: true,
      shininess: 30
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Применяем реальные координаты из placement
    mesh.position.set(placement.x, placement.y, placement.z);
    
    // Применяем правильные повороты
    if (placement.rot) {
      mesh.rotation.set(
        placement.rot[0] * Math.PI / 180,
        placement.rot[1] * Math.PI / 180,
        placement.rot[2] * Math.PI / 180
      );
    }

    // Добавляем wireframe для лучшей видимости
    const wireframeGeometry = new THREE.WireframeGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 1,
      opacity: 0.3,
      transparent: true
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    wireframe.position.copy(mesh.position);
    wireframe.rotation.copy(mesh.rotation);

    // Настройки теней
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Добавляем элементы в сцену
    scene.add(mesh);
    scene.add(wireframe);

    // Добавляем метку с информацией об элементе
    addItemLabel(scene, item, placement);
  };

  // Add information label for each item
  const addItemLabel = (scene: THREE.Scene, item: DuctItem, placement: Placement) => {
    // Создаем простую геометрию для информационной метки
    const labelGeometry = new THREE.PlaneGeometry(100, 30);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (context) {
      canvas.width = 256;
      canvas.height = 64;
      context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'black';
      context.font = '12px Arial';
      context.textAlign = 'center';
      
      const text = item.type === 'rect' 
        ? `${item.w}×${item.h}×${item.length}`
        : `Ø${item.d}×${item.length}`;
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1
      });
      
      const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
      labelMesh.position.set(
        placement.x,
        placement.y + (item.h || item.d || 100) / 2 + 50,
        placement.z
      );
      
      // Метка всегда смотрит на камеру
      labelMesh.lookAt(0, 1000, 1000);
      
      scene.add(labelMesh);
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    console.log('ThreeDViewer: Rendering 3D scene with real coordinates');
    console.log('Result data:', result);

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      1,
      50000
    );

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0xf0f0f0, 1);
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 100;
    controls.maxDistance = 20000;
    controls.maxPolarAngle = Math.PI / 2;

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(2000, 3000, 1000);
    directionalLight1.castShadow = true;
    directionalLight1.shadow.mapSize.width = 4096;
    directionalLight1.shadow.mapSize.height = 4096;
    directionalLight1.shadow.camera.near = 0.5;
    directionalLight1.shadow.camera.far = 10000;
    directionalLight1.shadow.camera.left = -5000;
    directionalLight1.shadow.camera.right = 5000;
    directionalLight1.shadow.camera.top = 5000;
    directionalLight1.shadow.camera.bottom = -5000;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-1000, 1500, -1000);
    scene.add(directionalLight2);

    // Vehicle container
    const vehicle = result.vehicle;
    if (vehicle) {
      console.log('Rendering vehicle:', vehicle);
      
      const vehicleGeometry = new THREE.BoxGeometry(
        vehicle.width,
        vehicle.height,
        vehicle.length
      );
      
      // Прозрачный кузов
      const vehicleMaterial = new THREE.MeshPhongMaterial({
        color: 0x4285f4,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
      });
      const vehicleMesh = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
      vehicleMesh.position.set(0, vehicle.height / 2, 0);
      scene.add(vehicleMesh);

      // Каркас кузова
      const edges = new THREE.EdgesGeometry(vehicleGeometry);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x1565c0, 
        linewidth: 2 
      });
      const wireframe = new THREE.LineSegments(edges, lineMaterial);
      wireframe.position.set(0, vehicle.height / 2, 0);
      scene.add(wireframe);

      // Пол кузова (более заметный)
      const floorGeometry = new THREE.PlaneGeometry(vehicle.width, vehicle.length);
      const floorMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x8d6e63,
        side: THREE.DoubleSide 
      });
      const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.set(0, 0, 0);
      floorMesh.receiveShadow = true;
      scene.add(floorMesh);
    }

    // Enhanced grid
    const gridSize = 10000;
    const divisions = 20;
    const gridHelper = new THREE.GridHelper(gridSize, divisions, 0x888888, 0xdddddd);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // Enhanced axes
    const axesHelper = new THREE.AxesHelper(1500);
    scene.add(axesHelper);

    // Render rows and duct items
    const rowGroups = groupPlacementsByRow(result);
    renderRows(scene, rowGroups, vehicle);
    renderDuctItems(scene, result);

    // Position camera based on content
    if (vehicle) {
      const maxDimension = Math.max(vehicle.width, vehicle.height, vehicle.length);
      camera.position.set(
        maxDimension * 1.2,
        maxDimension * 0.8,
        maxDimension * 1.2
      );
      controls.target.set(0, vehicle.height / 3, 0);
    } else {
      camera.position.set(3000, 2000, 3000);
      controls.target.set(0, 500, 0);
    }

    controls.update();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [result]);

  return (
    <div className="w-full h-full relative">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Color legend */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded-lg shadow-lg">
        <h3 className="text-sm font-semibold mb-2">🎨 Цветовая индикация:</h3>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span>Перегруженные (>30кг)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <span>Требуют внимания</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>Оптимально размещены</span>
          </div>
        </div>
      </div>

      {/* Statistics panel */}
      {result.placements && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded-lg shadow-lg">
          <h3 className="text-sm font-semibold mb-2">📊 Статистика:</h3>
          <div className="space-y-1 text-xs">
            <div>Элементов: {result.items.reduce((sum, item) => sum + item.qty, 0)}</div>
            <div>Позиций: {result.placements.length}</div>
            <div>Утилизация: {result.utilization?.toFixed(1)}%</div>
            <div>Рядов: {groupPlacementsByRow(result).size}</div>
          </div>
        </div>
      )}
    </div>
  );
}







