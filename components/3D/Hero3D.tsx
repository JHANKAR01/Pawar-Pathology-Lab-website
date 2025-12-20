
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';

// The previous JSX augmentation was removed as it shadowed the default React JSX namespace,
// causing "Property does not exist on type 'JSX.IntrinsicElements'" errors for standard tags (div, h1, etc.)
// across the entire project.

const RedBloodCell = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.005;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial 
          color="#D32F2F" 
          roughness={0.2} 
          metalness={0.1} 
          emissive="#500000" 
          emissiveIntensity={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
    </Float>
  );
};

const DNAHelix = () => {
  const helixRef = useRef<THREE.Group>(null);
  const strands = useMemo(() => {
    const points = [];
    for (let i = 0; i < 40; i++) {
      const angle = (i / 10) * Math.PI;
      const y = (i - 20) * 0.3;
      // Strand 1
      points.push({ x: Math.sin(angle), z: Math.cos(angle), y });
      // Strand 2 - Fix: Removed corrupted logic and duplicate 'z' property
      points.push({ x: -Math.sin(angle), z: -Math.cos(angle), y });
    }
    return points;
  }, []);

  useFrame((state) => {
    if (helixRef.current) {
      helixRef.current.rotation.y += 0.01;
      helixRef.current.rotation.z = state.mouse.x * 0.1;
    }
  });

  return (
    <group ref={helixRef} scale={1.2}>
      {strands.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#D32F2F" : "#ffffff"} />
        </mesh>
      ))}
    </group>
  );
};

const Hero3D = () => {
  const scrollToTests = () => {
    const el = document.getElementById('tests');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="h-[60vh] md:h-screen w-full relative bg-black overflow-hidden">
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-2xl">
          PAWAR <span className="text-red-600">PATHOLOGY</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl font-light">
          Precision Diagnostics for a Healthier You. Lead by experts, powered by technology.
        </p>
        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <button 
            onClick={scrollToTests}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-xl hover:scale-105"
          >
            Book a Test Now
          </button>
          <button 
            onClick={scrollToTests}
            className="glass text-white px-8 py-4 rounded-full font-bold border border-white/20 transition-all hover:bg-white/10"
          >
            View Reports
          </button>
        </div>
      </div>
      
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <DNAHelix />
        <RedBloodCell position={[3, 2, -1]} />
        <RedBloodCell position={[-4, -2, 2]} />
        <RedBloodCell position={[5, -1, 0]} />
        <RedBloodCell position={[-2, 3, -3]} />
        <Environment preset="city" />
      </Canvas>
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gray-50 to-transparent z-20"></div>
    </div>
  );
};

export default Hero3D;
