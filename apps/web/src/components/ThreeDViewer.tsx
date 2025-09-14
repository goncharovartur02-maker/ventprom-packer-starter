'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
    
    if ((result as any).placements) {
      (result as any).placements.forEach((placement: Placement) => {
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
      
      // Нумерация ряда (упрощенная версия без шрифтов)
      // В реальной реализации здесь можно добавить текстовые метки
      
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

  // Render individual duct items with nesting visualization
  const renderDuctItems = (scene: THREE.Scene, result: PackResult) => {
    if ((result as any).placements && (result as any).placements.length > 0) {
      // Используем реальные координаты из placements
      (result as any).placements.forEach((placement: Placement, index: number) => {
        const item = result.items[index] || result.items[0];
        
        // Проверяем, является ли элемент матрешкой (nested)
        const isNested = item.id.includes('nested_');
        
        if (isNested) {
          renderNestedDuctItem(scene, item, placement, index);
        } else {
          renderSingleDuctItem(scene, item, placement);
        }
      });
      
      // Добавляем информационные панели с размерами
      addDimensionLabels(scene, result);
    } else {
      // Fallback: простое размещение элементов
      result.items.forEach((item, index) => {
        const fakePlacement: Placement = {
          itemId: item.id,
          index,
          x: (index % 5) * 400 - 800,
          y: Math.floor(index / 5) * 200 + 100,
          z: 0,
          rot: [0, 0, 0],
          layer: 0,
          row: Math.floor(index / 5)
        };
        renderSingleDuctItem(scene, item, fakePlacement);
      });
    }
  };

  // Render a single duct item with real coordinates and rotation
  // Render nested duct item (матрешка)
  const renderNestedDuctItem = (scene: THREE.Scene, item: DuctItem, placement: Placement, index: number) => {
    // Рендерим внешний воздуховод полупрозрачным
    const outerGeometry = item.type === 'rect' 
      ? new THREE.BoxGeometry(item.w || 100, item.h || 100, item.length || 1000)
      : new THREE.CylinderGeometry((item.d || 100) / 2, (item.d || 100) / 2, item.length || 1000, 32);
    
    if (item.type === 'round') {
      outerGeometry.rotateZ(Math.PI / 2);
    }
    
    // Полупрозрачный материал для внешнего воздуховода
    const outerMaterial = new THREE.MeshLambertMaterial({
      color: 0x2196f3,
      transparent: true,
      opacity: 0.3,
      wireframe: false
    });
    
    const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
    outerMesh.position.set(placement.x, placement.y, placement.z);
    outerMesh.rotation.set(
      placement.rot[0] * Math.PI / 180,
      placement.rot[1] * Math.PI / 180,
      placement.rot[2] * Math.PI / 180
    );
    scene.add(outerMesh);
    
    // Рендерим внутренние воздуховоды (имитация)
    const innerCount = Math.floor(Math.random() * 3) + 1; // 1-3 внутренних элемента
    for (let i = 0; i < innerCount; i++) {
      const innerSize = 0.6 - i * 0.15; // Уменьшающиеся размеры
      const innerGeometry = item.type === 'rect'
        ? new THREE.BoxGeometry((item.w || 100) * innerSize, (item.h || 100) * innerSize, (item.length || 1000) * 0.9)
        : new THREE.CylinderGeometry(((item.d || 100) / 2) * innerSize, ((item.d || 100) / 2) * innerSize, (item.length || 1000) * 0.9, 16);
      
      if (item.type === 'round') {
        innerGeometry.rotateZ(Math.PI / 2);
      }
      
      const innerMaterial = new THREE.MeshLambertMaterial({
        color: i === 0 ? 0x4caf50 : (i === 1 ? 0xff9800 : 0xf44336)
      });
      
      const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
      innerMesh.position.set(placement.x, placement.y, placement.z);
      innerMesh.rotation.set(
        placement.rot[0] * Math.PI / 180,
        placement.rot[1] * Math.PI / 180,
        placement.rot[2] * Math.PI / 180
      );
      scene.add(innerMesh);
    }
    
    // Добавляем метку матрешки
    addNestedLabel(scene, placement, item, innerCount);
  };
  
  // Add label for nested items
  const addNestedLabel = (scene: THREE.Scene, placement: Placement, item: DuctItem, nestedCount: number) => {
    // Создаем текстовую метку
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 128;
    
    context.fillStyle = '#1a1a1a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText(`🪆 Матрешка`, canvas.width / 2, 30);
    context.fillText(`${nestedCount + 1} элементов`, canvas.width / 2, 55);
    context.fillText(`${item.w || item.d}×${item.h || item.d}×${item.length}`, canvas.width / 2, 80);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    sprite.position.set(placement.x, placement.y + (item.h || item.d || 100) + 100, placement.z);
    sprite.scale.set(200, 100, 1);
    scene.add(sprite);
  };
  
  // Add dimension labels to the scene
  const addDimensionLabels = (scene: THREE.Scene, result: PackResult) => {
    const vehicle = result.vehicle;
    
    // Размеры кузова
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 256;
    
    context.fillStyle = '#1a1a1a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.font = 'bold 20px Arial';
    context.textAlign = 'left';
    
    context.fillText(`🚛 ${vehicle.name}`, 20, 40);
    context.font = '16px Arial';
    context.fillText(`Ширина: ${vehicle.width}мм`, 20, 70);
    context.fillText(`Высота: ${vehicle.height}мм`, 20, 95);
    context.fillText(`Длина: ${vehicle.length}мм`, 20, 120);
    context.fillText(`Грузоподъемность: ${vehicle.maxPayloadKg}кг`, 20, 145);
    
    // Статистика упаковки
    const totalItems = result.items.reduce((sum, item) => sum + item.qty, 0);
    const totalWeight = result.totalWeight;
    
    context.fillText(`📦 Воздуховодов: ${totalItems}`, 280, 70);
    context.fillText(`⚖️ Общий вес: ${totalWeight.toFixed(1)}кг`, 280, 95);
    context.fillText(`📊 Утилизация: ${result.utilization.toFixed(1)}%`, 280, 120);
    
    if ((result as any).placements) {
      context.fillText(`📍 Позиций: ${(result as any).placements.length}`, 280, 145);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    sprite.position.set(-vehicle.width / 2 - 300, vehicle.height + 200, vehicle.length / 2);
    sprite.scale.set(400, 200, 1);
    scene.add(sprite);
  };

  // Render a single duct item
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
      context.fillStyle = 'rgba(0, 0, 0, 0.9)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#ffffff';
      context.font = 'bold 14px Arial';
      context.textAlign = 'center';
      
      // Размеры
      const sizeText = item.type === 'rect' 
        ? `${item.w}×${item.h}×${item.length}мм`
        : `Ø${item.d}×${item.length}мм`;
      context.fillText(sizeText, canvas.width / 2, 20);
      
      // Количество и вес
      context.font = '12px Arial';
      context.fillText(`${item.qty}шт | ${(item.weightKg || 0).toFixed(1)}кг`, canvas.width / 2, 40);
      
      // Материал и матрешка
      const materialText = item.material === 'galvanized' ? 'Оцинк.' : (item.material || 'Сталь');
      const nestedText = item.id.includes('nested_') ? ' 🪆' : '';
      context.fillText(`${materialText} | ${item.flangeType || 'NONE'}${nestedText}`, canvas.width / 2, 55);
      
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
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/20">
        <h3 className="text-sm font-semibold mb-2 text-white">🎨 Цветовая индикация:</h3>
        <div className="space-y-1 text-xs text-white/90">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span>Перегруженные (&gt;30кг)</span>
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
      {(result as any).placements && (
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/20">
          <h3 className="text-sm font-semibold mb-2 text-white">📊 Статистика:</h3>
          <div className="space-y-1 text-xs text-white/90">
            <div>Элементов: {result.items.reduce((sum, item) => sum + item.qty, 0)}</div>
            <div>Позиций: {(result as any).placements.length}</div>
            <div>Утилизация: {result.utilization?.toFixed(1)}%</div>
            <div>Рядов: {groupPlacementsByRow(result).size}</div>
          </div>
        </div>
      )}
    </div>
  );
}







