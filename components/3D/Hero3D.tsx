import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { Environment, Stars, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

const FloatingSyringe = ({ position, speed, rotationSpeed }: { position: [number, number, number], speed: number, rotationSpeed: number }) => {
  const syringeRef = useRef<THREE.Group>(null);
  const baseY = position[1];

  useFrame((state) => {
    if (syringeRef.current) {
      const time = state.clock.getElapsedTime();
      // Smooth vertical micro-oscillation
      syringeRef.current.position.y = baseY + Math.sin(time * speed) * 0.15;
      // Slow rotation for zero-gravity effect
      syringeRef.current.rotation.y += rotationSpeed;
      syringeRef.current.rotation.x = Math.sin(time * speed * 0.5) * 0.1;
    }
  });

  return (
    <group ref={syringeRef} position={position}>
      {/* Syringe barrel (cylinder) */}
      <mesh>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
        <meshStandardMaterial 
          color="#E11D48" 
          roughness={0.3} 
          metalness={0.7}
          emissive="#300000"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Syringe plunger */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.15, 12]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.2} 
          metalness={0.8}
        />
      </mesh>
      {/* Needle tip */}
      <mesh position={[0, -0.35, 0]}>
        <coneGeometry args={[0.02, 0.1, 8]} />
        <meshStandardMaterial 
          color="#C0C0C0" 
          roughness={0.1} 
          metalness={0.9}
        />
      </mesh>
    </group>
  );
};

const FloatingFlask = ({ position, speed, rotationSpeed }: { position: [number, number, number], speed: number, rotationSpeed: number }) => {
  const flaskRef = useRef<THREE.Group>(null);
  const baseY = position[1];

  useFrame((state) => {
    if (flaskRef.current) {
      const time = state.clock.getElapsedTime();
      // Smooth vertical micro-oscillation
      flaskRef.current.position.y = baseY + Math.sin(time * speed + position[0]) * 0.12;
      // Slow rotation for zero-gravity effect
      flaskRef.current.rotation.y += rotationSpeed;
      flaskRef.current.rotation.z = Math.sin(time * speed * 0.3) * 0.05;
    }
  });

  return (
    <group ref={flaskRef} position={position}>
      {/* Flask body (rounded bottom flask) */}
      <mesh>
        <sphereGeometry args={[0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI]} />
        <meshPhysicalMaterial 
          color="#ffffff"
          transparent
          opacity={0.15}
          roughness={0.1}
          metalness={0.0}
          transmission={0.9}
          thickness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </mesh>
      {/* Flask neck */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.25, 0.2, 16]} />
        <meshPhysicalMaterial 
          color="#ffffff"
          transparent
          opacity={0.2}
          roughness={0.1}
          metalness={0.0}
          transmission={0.9}
          thickness={0.1}
        />
      </mesh>
      {/* Liquid inside (optional, for visual depth) */}
      <mesh position={[0, -0.1, 0]}>
        <sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI]} />
        <meshStandardMaterial 
          color="#E11D48"
          transparent
          opacity={0.3}
          emissive="#E11D48"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
};

const LaboratoryObjects = ({ isMobile }: { isMobile: boolean }) => {
  const count = isMobile ? 4 : 8;
  
  const objects = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const isSyringe = i % 2 === 0;
      return {
        type: isSyringe ? 'syringe' : 'flask',
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 10 - 3
        ] as [number, number, number],
        speed: 0.3 + Math.random() * 0.4,
        rotationSpeed: 0.001 + Math.random() * 0.002
      };
    });
  }, [count]);

  return (
    <>
      {objects.map((obj, i) => {
        if (obj.type === 'syringe') {
          return (
            <FloatingSyringe 
              key={`syringe-${i}`}
              position={obj.position}
              speed={obj.speed}
              rotationSpeed={obj.rotationSpeed}
            />
          );
        } else {
          return (
            <FloatingFlask 
              key={`flask-${i}`}
              position={obj.position}
              speed={obj.speed}
              rotationSpeed={obj.rotationSpeed}
            />
          );
        }
      })}
    </>
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

  return (
    <div className="relative h-[90vh] md:h-screen w-full overflow-hidden bg-[#050505]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(225,29,72,0.18),transparent_80%)] pointer-events-none" />

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-start text-center px-6 pointer-events-none pt-28 md:pt-48">
        <span className="mb-6 px-6 py-2 rounded-full border border-rose-900/40 bg-rose-950/20 text-rose-50 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] animate-pulse">
          NABL Accredited Excellence • Betul
        </span>
        <h1 className="font-heading text-4xl sm:text-7xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-[0.85]">
          PRECISION <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-300 to-white text-glow">
            DIAGNOSTICS
          </span>
        </h1>
        <p className="text-gray-400 max-w-lg md:max-w-xl text-xs md:text-lg font-medium leading-relaxed opacity-90 mb-12">
          Pioneering molecular intelligence and high-throughput pathology for advanced clinical insight across Madhya Pradesh.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 pointer-events-auto">
          <button 
            onClick={() => document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth' })}
            className="group relative bg-rose-600 text-white px-14 py-5 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-rose-900/40"
          >
            Schedule Analysis
          </button>
          <button 
            onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
            className="group px-14 py-5 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest text-white border border-white/20 bg-white/5 backdrop-blur-2xl hover:bg-white/15 transition-all"
          >
            Our Services
          </button>
        </div>
      </div>

      <div className="absolute inset-0 z-10">
        <Canvas 
          camera={{ position: [0, 0, 12], fov: isMobile ? 55 : 40 }} 
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          dpr={[1, 1.5]} // Capped DPR for performance
        >
          <PresentationControls global rotation={[0, 0, 0]} polar={[-0.1, 0.1]} azimuth={[-0.1, 0.1]}>
            <group>
              <LaboratoryObjects isMobile={isMobile} />
            </group>
          </PresentationControls>
          <Stars radius={70} count={isMobile ? 1000 : 3000} factor={5} fade speed={2} />
          <ambientLight intensity={0.6} />
          <spotLight position={[10, 20, 10]} intensity={5} color="#E11D48" />
          <Environment preset="night" />
        </Canvas>
      </div>
    </div>
  );
};

export default Hero3D;