import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Background3D = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Create particles with FURTHER REDUCED COUNT
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1200; // Further reduced from 3000
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);

    // Create a color palette with bright multi-colors
    const colors = [
      new THREE.Color(0xFF0000), // Red
      new THREE.Color(0x00FF00), // Green
      new THREE.Color(0x0000FF), // Blue
      new THREE.Color(0xFFFF00), // Yellow
      new THREE.Color(0xFF00FF), // Magenta
      new THREE.Color(0x00FFFF), // Cyan
      new THREE.Color(0xFF8000), // Orange
      new THREE.Color(0x8000FF)  // Purple
    ];

    for (let i = 0; i < particlesCount; i++) {
      // Position
      const i3 = i * 3;
      // Create a cube distribution
      posArray[i3] = (Math.random() - 0.5) * 10;
      posArray[i3 + 1] = (Math.random() - 0.5) * 10;
      posArray[i3 + 2] = (Math.random() - 0.5) * 10;
      
      // Random color from palette
      const color = colors[Math.floor(Math.random() * colors.length)];
      colorsArray[i3] = color.r;
      colorsArray[i3 + 1] = color.g;
      colorsArray[i3 + 2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    // Create circular texture for particles
    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d')!;
    
    // Draw circle gradient
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    
    const circleTexture = new THREE.CanvasTexture(canvas);

    // Create material with circular texture
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      transparent: true,
      opacity: 1,
      vertexColors: true,
      sizeAttenuation: true,
      map: circleTexture,
      alphaTest: 0.001,
      depthWrite: false
    });

    // Create mesh
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Position camera
    camera.position.z = 5;

    // Mouse movement effect
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX / window.innerWidth - 0.5;
      mouseY = event.clientY / window.innerHeight - 0.5;
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate the entire particle system
      particlesMesh.rotation.y += 0.002;
      particlesMesh.rotation.x += 0.001;
      
      // Smooth mouse follow
      particlesMesh.rotation.x += mouseY * 0.005;
      particlesMesh.rotation.y += mouseX * 0.005;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (container) {
        container.removeChild(renderer.domElement);
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-black" /> {/* Change to bg-white for white background */}
      <div ref={containerRef} className="relative h-full" />
    </div>
  );
};

export default Background3D;