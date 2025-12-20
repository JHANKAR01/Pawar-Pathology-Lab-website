

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { Float, Environment, Stars, ContactShadows, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

// Enhanced type definitions for Three.js intrinsic elements to the global JSX namespace
// This fixes errors like "Property 'mesh' does not exist on type 'JSX.IntrinsicElements'"
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

const Cell: React.FC<{ position: [number, number, number], speed?: number, type?: 'rbc' | 'wbc', scale?: number }> = ({ position, speed = 1, type = 'rbc', scale = 1 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const randomRotationAxis = useMemo(() => new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(), []);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotateOnAxis(randomRotationAxis, 0.01 * speed);
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.3 * speed + position[0]) * 0.4;
    }
  });

  return (
    <Float speed={2 * speed} rotationIntensity={1.5} floatIntensity={1.5}>
      {/* @ts-ignore - Suppressing intrinsic element check for 'mesh' */}
      <mesh ref={meshRef} position={position} scale={scale}>
        {type === 'rbc' ? (
          /* @ts-ignore - Suppressing intrinsic element check for 'torusGeometry' */
          <torusGeometry args={[0.3, 0.15, 12, 24]} />
        ) : (
          /* @ts-ignore - Suppressing intrinsic element check for 'sphereGeometry' */
          <sphereGeometry args={[0.25, 32, 32]} />
        )}
        {/* @ts-ignore - Suppressing intrinsic element check for 'meshStandardMaterial' */}
        <meshStandardMaterial 
          color={type === 'rbc' ? "#E11D48" : "#F8FAFC"} 
          roughness={type === 'rbc' ? 0.2 : 0.4} 
          metalness={type === 'rbc' ? 0.6 : 0.1} 
          emissive={type === 'rbc' ? "#300000" : "#ffffff"} 
          emissiveIntensity={type === 'rbc' ? 0.4 : 0.1}
        />
      </mesh>
    </Float>
  );
};

const DNAHelix = () => {
  const helixRef = useRef<THREE.Group>(null);
  
  const helixData = useMemo(() => {
    const points = [];
    const rungs = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
      const angle = (i / 5) * Math.PI;
      const y = (i - count/2) * 0.4;
      
      const p1 = { x: Math.sin(angle) * 2, z: Math.cos(angle) * 2, y };
      const p2 = { x: -Math.sin(angle) * 2, z: -Math.cos(angle) * 2, y };
      
      points.push({ p1, p2 });
      if (i % 2 === 0) rungs.push({ p1, p2 });
    }
    return { points, rungs };
  }, []);

  useFrame((state) => {
    if (helixRef.current) {
      helixRef.current.rotation.y += 0.005;
      helixRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.2;
    }
  });

  return (
    /* @ts-ignore - Suppressing intrinsic element check for 'group' */
    <group ref={helixRef}>
      {helixData.points.map((d, i) => (
        /* @ts-ignore - Suppressing intrinsic element check for 'group' */
        <group key={`dna-group-${i}`}>
          {/* @ts-ignore - Suppressing intrinsic element check for 'mesh' */}
          <mesh position={[d.p1.x, d.p1.y, d.p1.z]}>
            {/* @ts-ignore - Suppressing intrinsic element check for 'sphereGeometry' */}
            <sphereGeometry args={[0.1, 16, 16]} />
            {/* @ts-ignore - Suppressing intrinsic element check for 'meshStandardMaterial' */}
            <meshStandardMaterial color="#E11D48" emissive="#E11D48" emissiveIntensity={1.2} />
          </mesh>
          {/* @ts-ignore - Suppressing intrinsic element check for 'mesh' */}
          <mesh position={[d.p2.x, d.p2.y, d.p2.z]}>
            {/* @ts-ignore - Suppressing intrinsic element check for 'sphereGeometry' */}
            <sphereGeometry args={[0.1, 16, 16]} />
            {/* @ts-ignore - Suppressing intrinsic element check for 'meshStandardMaterial' */}
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
      {helixData.rungs.map((r, i) => (
        /* @ts-ignore - Suppressing intrinsic element check for 'mesh' */
        <mesh key={`rung-${i}`} position={[(r.p1.x + r.p2.x)/2, r.p1.y, (r.p1.z + r.p2.z)/2]} rotation={[0, 0, Math.atan2(r.p2.x - r.p1.x, r.p2.z - r.p1.z)]}>
          {/* @ts-ignore - Suppressing intrinsic element check for 'boxGeometry' */}
          <boxGeometry args={[4, 0.02, 0.02]} />
          {/* @ts-ignore - Suppressing intrinsic element check for 'meshStandardMaterial' */}
          <meshStandardMaterial color="#ffffff" transparent opacity={0.15} />
        </mesh>
      ))}
    </group>
  );
};

const Hero3D = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToTests = () => {
    const element = document.getElementById('directory');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const cells = useMemo(() => {
    const data = [];
    const count = isMobile ? 35 : 70;
    for (let i = 0; i < count; i++) {
      data.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 24,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 12 - 5
        ] as [number, number, number],
        speed: 0.3 + Math.random() * 0.7,
        type: (Math.random() > 0.85 ? 'wbc' : 'rbc') as 'rbc' | 'wbc',
        scale: 0.5 + Math.random() * 0.9
      });
    }
    return data;
  }, [isMobile]);

  return (
    <div className="relative h-[90vh] md:h-screen w-full overflow-hidden bg-[#050505]">
      {/* Dynamic background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(225,29,72,0.18),transparent_80%)] pointer-events-none" />

      {/* Main Content Container - Increased padding top to prevent navbar overlap on mobile */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 pointer-events-none pt-40 md:pt-0">
        <span className="mb-4 md:mb-8 px-4 md:px-6 py-2 rounded-full border border-rose-900/40 bg-rose-950/20 text-rose-500 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] animate-pulse">
          NABL Accredited Excellence • Betul
        </span>
        <h1 className="font-heading text-4xl sm:text-7xl md:text-9xl font-black text-white mb-6 tracking-tighter leading-[0.85] md:leading-[0.8]">
          PRECISION <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-300 to-white text-glow">
            DIAGNOSTICS
          </span>
        </h1>
        <p className="text-gray-400 max-w-lg md:max-w-2xl text-xs md:text-xl font-medium leading-relaxed opacity-90 mb-10 md:mb-16">
          Pioneering molecular intelligence and high-throughput pathology for advanced clinical insight across Madhya Pradesh.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 pointer-events-auto w-full sm:w-auto px-6 sm:px-0">
          <button 
            onClick={scrollToTests}
            className="group relative bg-rose-600 text-white px-10 md:px-16 py-4 md:py-6 rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-rose-900/40"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative">Book Appointment</span>
          </button>
          <button 
            onClick={scrollToTests}
            className="group px-10 md:px-16 py-4 md:py-6 rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-widest text-white border border-white/20 bg-white/5 backdrop-blur-2xl hover:bg-white/15 transition-all"
          >
            Investigation Menu
          </button>
        </div>
      </div>

      <div className="absolute inset-0 z-10 opacity-70 md:opacity-100">
        <Canvas 
          camera={{ position: [0, 0, 12], fov: isMobile ? 55 : 40 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          {/* @ts-ignore - Suppressing intrinsic element check for 'color' */}
          <color attach="background" args={['#050505']} />
          {/* @ts-ignore - Suppressing intrinsic element check for 'fog' */}
          <fog attach="fog" args={['#050505', 10, 25]} />
          
          <PresentationControls 
            global 
            rotation={[0, 0, 0]} 
            polar={[-0.1, 0.1]} 
            azimuth={[-0.1, 0.1]}
            config={{ mass: 2, tension: 500 }}
          >
            {/* @ts-ignore - Suppressing intrinsic element check for 'group' */}
            <group scale={1}>
              <DNAHelix />
              {cells.map(cell => (
                <Cell 
                  key={cell.id} 
                  position={cell.position} 
                  speed={cell.speed} 
                  type={cell.type} 
                  scale={cell.scale} 
                />
              ))}
            </group>
          </PresentationControls>

          <Stars radius={70} depth={50} count={4000} factor={5} saturation={0} fade speed={2} />
          {/* @ts-ignore - Suppressing intrinsic element check for 'ambientLight' */}
          <ambientLight intensity={0.6} />
          {/* @ts-ignore - Suppressing intrinsic element check for 'spotLight' */}
          <spotLight position={[10, 20, 10]} angle={0.25} penumbra={1} intensity={5} color="#E11D48" />
          {/* @ts-ignore - Suppressing intrinsic element check for 'pointLight' */}
          <pointLight position={[-20, -10, -10]} intensity={3} color="#ffffff" />
          <ContactShadows opacity={0.5} scale={25} blur={2.5} far={15} />
          <Environment preset="night" />
        </Canvas>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 animate-bounce opacity-40">
        <div className="w-6 h-10 rounded-full border border-white/30 flex justify-center p-2">
          <div className="w-1 h-2 bg-rose-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default Hero3D;