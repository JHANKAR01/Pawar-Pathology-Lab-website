import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { Environment, Stars, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

const InstancedCells = ({ isMobile }: { isMobile: boolean }) => {
  const rbcMesh = useRef<THREE.InstancedMesh>(null);
  const wbcMesh = useRef<THREE.InstancedMesh>(null);
  
  // 1. Reduced particle count by 50%
  const count = isMobile ? 20 : 50;
  
  const data = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 15 - 5
      ),
      rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
      scale: 0.5 + Math.random() * 0.8,
      // 3. Increased movement speed
      speed: 0.5 + Math.random() * 0.8,
      type: Math.random() > 0.85 ? 'wbc' : 'rbc'
    }));
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    let rbcIdx = 0;
    let wbcIdx = 0;

    const tempObj = new THREE.Object3D();

    data.forEach((d) => {
      tempObj.position.copy(d.position);
      // Increased vertical movement range and speed
      tempObj.position.y += Math.sin(time * d.speed + d.position.x) * 0.2;
      tempObj.rotation.copy(d.rotation);
      tempObj.rotation.x += time * 0.2 * d.speed;
      tempObj.rotation.y += time * 0.2 * d.speed;
      tempObj.scale.setScalar(d.scale);
      tempObj.updateMatrix();

      if (d.type === 'rbc' && rbcMesh.current) {
        rbcMesh.current.setMatrixAt(rbcIdx++, tempObj.matrix);
      } else if (d.type === 'wbc' && wbcMesh.current) {
        wbcMesh.current.setMatrixAt(wbcIdx++, tempObj.matrix);
      }
    });

    if (rbcMesh.current) rbcMesh.current.instanceMatrix.needsUpdate = true;
    if (wbcMesh.current) wbcMesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={rbcMesh} args={[undefined, undefined, count]}>
        {/* 2. Simplified RBC geometry */}
        <torusGeometry args={[0.3, 0.15, 8, 16]} />
        <meshStandardMaterial 
          color="#E11D48" 
          roughness={0.2} 
          metalness={0.6} 
          emissive="#300000" 
          emissiveIntensity={0.4}
        />
      </instancedMesh>
      <instancedMesh ref={wbcMesh} args={[undefined, undefined, count]}>
        {/* 2. Simplified WBC geometry */}
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshStandardMaterial 
          color="#F8FAFC" 
          roughness={0.4} 
          metalness={0.1} 
          emissive="#ffffff" 
          emissiveIntensity={0.1}
        />
      </instancedMesh>
    </>
  );
};

const DNAHelix = () => {
  const helixRef = useRef<THREE.Group>(null);
  
  const helixData = useMemo(() => {
    const points = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
      const angle = (i / 5) * Math.PI;
      const y = (i - count/2) * 0.4;
      const p1 = { x: Math.sin(angle) * 2, z: Math.cos(angle) * 2, y };
      const p2 = { x: -Math.sin(angle) * 2, z: -Math.cos(angle) * 2, y };
      points.push({ p1, p2 });
    }
    return { points };
  }, []);

  useFrame(() => {
    if (helixRef.current) {
      helixRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={helixRef}>
      {helixData.points.map((d, i) => (
        <group key={`dna-group-${i}`}>
          <mesh position={[d.p1.x, d.p1.y, d.p1.z]}>
            {/* 2. Simplified DNA geometry */}
            <sphereGeometry args={[0.1, 6, 6]} />
            <meshStandardMaterial color="#E11D48" emissive="#E11D48" emissiveIntensity={1} />
          </mesh>
          <mesh position={[d.p2.x, d.p2.y, d.p2.z]}>
            <sphereGeometry args={[0.1, 6, 6]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
          </mesh>
        </group>
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
              <DNAHelix />
              <InstancedCells isMobile={isMobile} />
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