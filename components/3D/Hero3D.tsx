import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { Environment, Stars, PresentationControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

const FloatingSyringe = ({ position, speed, rotationSpeed }: { position: [number, number, number], speed: number, rotationSpeed: number }) => {
  const syringeRef = useRef<THREE.Group>(null);
  const baseY = position[1];

  useFrame((state) => {
    if (syringeRef.current) {
      const time = state.clock.getElapsedTime();
      // Smooth vertical micro-oscillation - increased range
      syringeRef.current.position.y = baseY + Math.sin(time * speed) * 0.3;
      // Slow rotation for zero-gravity effect
      syringeRef.current.rotation.y += rotationSpeed;
      syringeRef.current.rotation.x = Math.sin(time * speed * 0.5) * 0.15;
      syringeRef.current.rotation.z = Math.cos(time * speed * 0.3) * 0.1;
    }
  });

  return (
    <group ref={syringeRef} position={position} scale={[3.5, 3.5, 3.5]}>
      {/* Syringe barrel (cylinder) - scaled up */}
      <mesh>
        <cylinderGeometry args={[0.12, 0.12, 1.2, 24]} />
        <meshStandardMaterial 
          color="#E11D48" 
          roughness={0.2} 
          metalness={0.8}
          emissive="#E11D48"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Syringe plunger */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.1} 
          metalness={0.9}
          emissive="#ffffff"
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* Needle tip */}
      <mesh position={[0, -0.7, 0]}>
        <coneGeometry args={[0.03, 0.2, 12]} />
        <meshStandardMaterial 
          color="#C0C0C0" 
          roughness={0.05} 
          metalness={0.95}
          emissive="#E0E0E0"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Glow effect */}
      <mesh position={[0, 0, 0]} scale={[1.2, 1.2, 1.2]}>
        <cylinderGeometry args={[0.12, 0.12, 1.2, 24]} />
        <meshStandardMaterial 
          color="#E11D48"
          transparent
          opacity={0.2}
          emissive="#E11D48"
          emissiveIntensity={0.6}
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
      // Smooth vertical micro-oscillation - increased range
      flaskRef.current.position.y = baseY + Math.sin(time * speed + position[0]) * 0.25;
      // Slow rotation for zero-gravity effect
      flaskRef.current.rotation.y += rotationSpeed;
      flaskRef.current.rotation.z = Math.sin(time * speed * 0.3) * 0.1;
      flaskRef.current.rotation.x = Math.cos(time * speed * 0.4) * 0.08;
    }
  });

  return (
    <group ref={flaskRef} position={position} scale={[4, 4, 4]}>
      {/* Flask body (rounded bottom flask) - scaled up */}
      <mesh>
        <sphereGeometry args={[0.35, 24, 24, 0, Math.PI * 2, 0, Math.PI]} />
        <meshPhysicalMaterial 
          color="#ffffff"
          transparent
          opacity={0.25}
          roughness={0.05}
          metalness={0.0}
          transmission={0.95}
          thickness={0.15}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          ior={1.5}
        />
      </mesh>
      {/* Flask neck */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.12, 0.35, 0.35, 20]} />
        <meshPhysicalMaterial 
          color="#ffffff"
          transparent
          opacity={0.3}
          roughness={0.05}
          metalness={0.0}
          transmission={0.95}
          thickness={0.15}
          clearcoat={1.0}
        />
      </mesh>
      {/* Liquid inside - more visible */}
      <mesh position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.28, 20, 20, 0, Math.PI * 2, 0, Math.PI]} />
        <meshStandardMaterial 
          color="#E11D48"
          transparent
          opacity={0.5}
          emissive="#E11D48"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Glow effect */}
      <mesh position={[0, 0, 0]} scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[0.35, 24, 24, 0, Math.PI * 2, 0, Math.PI]} />
        <meshStandardMaterial 
          color="#E11D48"
          transparent
          opacity={0.15}
          emissive="#E11D48"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
};

const LaboratoryObjects = ({ isMobile }: { isMobile: boolean }) => {
  const count = isMobile ? 6 : 12;
  
  const objects = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const isSyringe = i % 2 === 0;
      // Better positioning - more spread out and closer to camera
      return {
        type: isSyringe ? 'syringe' : 'flask',
        position: [
          (Math.random() - 0.5) * 25,  // Wider spread
          (Math.random() - 0.5) * 15,  // More vertical range
          (Math.random() - 0.5) * 12 - 2  // Closer to camera
        ] as [number, number, number],
        speed: 0.2 + Math.random() * 0.5,
        rotationSpeed: 0.0008 + Math.random() * 0.003
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
    <div className="relative h-[90vh] md:h-screen w-full overflow-hidden bg-gradient-to-br from-white via-slate-50 to-rose-50/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(225,29,72,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/40 pointer-events-none" />

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-start text-center px-6 pointer-events-none pt-28 md:pt-48">
        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 px-6 py-3 rounded-full border-2 border-clinical-rose/20 bg-clinical-rose/10 text-clinical-rose text-xs md:text-sm font-black uppercase tracking-[0.4em] shadow-soft"
        >
          NABL Accredited Excellence • Betul
        </motion.span>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-heading text-5xl sm:text-7xl md:text-9xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.9]"
        >
          PRECISION <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-clinical-rose via-rose-500 to-clinical-rose text-glow-subtle">
            DIAGNOSTICS
          </span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-slate-600 max-w-2xl md:max-w-3xl text-base md:text-xl font-medium leading-relaxed mb-12"
        >
          Pioneering molecular intelligence and high-throughput pathology for advanced clinical insight across Madhya Pradesh.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-5 pointer-events-auto"
        >
          <button 
            onClick={() => document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth' })}
            className="group relative bg-clinical-rose text-white px-16 py-6 rounded-2xl font-black text-sm md:text-base uppercase tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-rose-lg hover:shadow-rose-lg"
          >
            <span className="relative z-10">Schedule Analysis</span>
            <div className="absolute inset-0 bg-gradient-to-r from-clinical-rose-dark to-clinical-rose opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button 
            onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
            className="group px-16 py-6 rounded-2xl font-black text-sm md:text-base uppercase tracking-widest text-clinical-rose border-2 border-clinical-rose bg-white hover:bg-clinical-rose-light transition-all shadow-soft hover:shadow-medium"
          >
            Our Services
          </button>
        </motion.div>

        {/* Hero Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 grid grid-cols-3 gap-6 pointer-events-auto max-w-3xl"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-soft">
            <div className="text-3xl font-black text-clinical-rose mb-2">500+</div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-widest">Tests Available</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-soft">
            <div className="text-3xl font-black text-clinical-rose mb-2">24/7</div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-widest">Support</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-soft">
            <div className="text-3xl font-black text-clinical-rose mb-2">NABL</div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-widest">Accredited</div>
          </div>
        </motion.div>
      </div>

      <div className="absolute inset-0 z-10">
        <Canvas 
          camera={{ position: [0, 0, 15], fov: isMobile ? 60 : 45 }} 
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          dpr={[1, 2]} 
        >
          <PresentationControls global rotation={[0, 0, 0]} polar={[-0.1, 0.1]} azimuth={[-0.1, 0.1]}>
            <group>
              <LaboratoryObjects isMobile={isMobile} />
            </group>
          </PresentationControls>
          {/* Enhanced lighting for better visibility */}
          <ambientLight intensity={1.2} />
          <directionalLight position={[10, 20, 10]} intensity={2} color="#ffffff" />
          <directionalLight position={[-10, 10, -10]} intensity={1} color="#E11D48" />
          <spotLight position={[15, 25, 15]} intensity={3} color="#E11D48" angle={0.3} penumbra={0.5} />
          <pointLight position={[0, 10, 0]} intensity={1.5} color="#ffffff" />
          <Environment preset="sunset" />
        </Canvas>
      </div>
    </div>
  );
};

export default Hero3D;