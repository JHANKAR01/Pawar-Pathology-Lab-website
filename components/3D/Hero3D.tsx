
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Stars, ContactShadows, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

const RedBloodCell = ({ position, speed = 1 }: { position: [number, number, number], speed?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01 * speed;
      meshRef.current.rotation.y += 0.01 * speed;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed + position[0]) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <mesh ref={meshRef} position={position}>
        <torusGeometry args={[0.3, 0.15, 16, 32]} />
        <meshStandardMaterial 
          color="#D32F2F" 
          roughness={0.1} 
          metalness={0.8} 
          emissive="#200000" 
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
    const count = 50;
    for (let i = 0; i < count; i++) {
      const angle = (i / 8) * Math.PI;
      const y = (i - count/2) * 0.25;
      
      const p1 = { x: Math.sin(angle) * 1.5, z: Math.cos(angle) * 1.5, y };
      const p2 = { x: -Math.sin(angle) * 1.5, z: -Math.cos(angle) * 1.5, y };
      
      points.push({ p1, p2 });
      if (i % 2 === 0) rungs.push({ p1, p2 });
    }
    return { points, rungs };
  }, []);

  useFrame((state) => {
    if (helixRef.current) {
      helixRef.current.rotation.y += 0.005;
      helixRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={helixRef}>
      {helixData.points.map((d, i) => (
        <React.Fragment key={i}>
          <mesh position={[d.p1.x, d.p1.y, d.p1.z]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#D32F2F" emissive="#D32F2F" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[d.p2.x, d.p2.y, d.p2.z]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
          </mesh>
        </React.Fragment>
      ))}
      {helixData.rungs.map((r, i) => (
        <mesh key={`r-${i}`} position={[(r.p1.x + r.p2.x)/2, r.p1.y, (r.p1.z + r.p2.z)/2]} rotation={[0, 0, Math.atan2(r.p2.x - r.p1.x, r.p2.z - r.p1.z)]}>
          <boxGeometry args={[3, 0.02, 0.02]} />
          <meshStandardMaterial color="#444" transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
};

const Hero3D = () => {
  const scrollToTests = () => {
    document.getElementById('tests')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#050505]">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(211,47,47,0.1),transparent_70%)]" />

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
        <span className="mb-6 px-4 py-1 rounded-full border border-red-900/30 bg-red-950/20 text-red-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse-slow">
          Est. 1998 • Trusted by Thousands
        </span>
        <h1 className="font-heading text-6xl md:text-9xl font-black text-white mb-6 tracking-tighter leading-none">
          PRECISION <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-400 to-white text-glow">
            DIAGNOSTICS
          </span>
        </h1>
        <p className="text-gray-400 max-w-xl text-lg md:text-xl font-medium leading-relaxed opacity-80 mb-12">
          Harnessing molecular intelligence and advanced clinical expertise for Betul's most reliable pathology services.
        </p>
        
        <div className="flex flex-col md:flex-row gap-6 pointer-events-auto">
          <button 
            onClick={scrollToTests}
            className="group relative bg-red-600 text-white px-10 py-5 rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(211,47,47,0.4)]"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative">Book Appointment</span>
          </button>
          <button 
            onClick={scrollToTests}
            className="group px-10 py-5 rounded-2xl font-bold text-lg text-white border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all"
          >
            View Directory
          </button>
        </div>
      </div>

      <div className="absolute inset-0 z-10 opacity-60 md:opacity-100">
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <color attach="background" args={['#050505']} />
          <fog attach="fog" args={['#050505', 5, 15]} />
          
          <PresentationControls global rotation={[0, 0, 0]} polar={[-0.4, 0.4]} azimuth={[-0.4, 0.4]}>
            <group scale={1.2}>
              <DNAHelix />
              <RedBloodCell position={[4, 3, -2]} speed={0.5} />
              <RedBloodCell position={[-5, -2, 1]} speed={0.8} />
              <RedBloodCell position={[3, -4, 2]} speed={0.4} />
              <RedBloodCell position={[-4, 4, -1]} speed={1.2} />
            </group>
          </PresentationControls>

          <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
          <ambientLight intensity={0.2} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#D32F2F" />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#ffffff" />
          <ContactShadows opacity={0.4} scale={20} blur={2.4} far={4.5} />
          <Environment preset="night" />
        </Canvas>
      </div>

      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center p-1">
          <div className="w-1 h-2 bg-red-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default Hero3D;
