import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, useGLTF, PointerLockControls, OrbitControls, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';

// Helper to handle GitHub Pages sub-directory paths for local assets
const getAssetPath = (path) => {
  const publicUrl = process.env.PUBLIC_URL || '';
  // Ensure we have a clean path without double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${publicUrl}${cleanPath}`;
};

// --- DATA: Exhibit configuration with all 10 models ---
const exhibits = [
  {
    url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    position: [-15, 0, -10],
    info: 'Astronaut',
    description: 'A detailed model of an astronaut suit, complete with reflective visor and life-support backpack.',
    scale: 2,
    boxSize: [3, 4.5, 2]
  },
  {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    position: [-7.5, 2, -10],
    info: 'Helmet',
    description: 'A battle-damaged sci-fi helmet. The weathering tells a story of past space conflicts.',
    scale: 1,
    boxSize: [3, 3, 3],
    boxYOffset: -1.5
  },
  {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
    position: [0, 0, -10],
    info: 'Vintage Camera',
    description: 'A beautifully modeled vintage box camera representing a classic era of film photography.',
    scale: 0.5,
    boxSize: [2, 4, 3]
  },
  {
    url: getAssetPath('/models/robot.glb'),
    position: [7.5, 2, -10],
    info: 'Deep Space Robot',
    description: 'A humanoid robot designed for deep space exploration and technical maintenance.',
    scale: 3,
    boxSize: [3, 4.25, 3],
    rotation: [0, Math.PI, 0], 
    boxYOffset: -2
  },
  {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb',
    position: [15, 0, -10],
    info: 'Vintage Race Car',
    description: 'A classic collectible toy race car with a vibrant red paint job.',
    scale: 200,
    boxSize: [6, 4, 9]
  },
  {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MosquitoInAmber/glTF-Binary/MosquitoInAmber.glb',
    position: [-15, 2, 10],
    info: 'Amber',
    description: 'A prehistoric mosquito perfectly preserved in fossilized tree resin.',
    scale: 30,
    boxSize: [3, 4, 3],
    boxYOffset: -2
  },
  {
    url: getAssetPath('/models/allosaurus.glb'),
    position: [-7.5, 2.2, 10],
    info: 'Armored Allosaurus',
    description: 'A fearsome Allosaurus equipped with futuristic battle armor plates.',
    scale: 1,
    boxSize: [5, 5, 6.3],
    boxYOffset: -2
  },
  {
    url: getAssetPath('/models/giant_mech.glb'),
    position: [0, 2.1, 10],
    info: 'Giant Mech',
    description: 'A colossal mech warrior, ready for interplanetary planetary defense.',
    scale: 1.3,
    rotation: [0, Math.PI/-2.2, 0], 
    boxSize: [8, 6, 4],
    boxYOffset: -2
  },
  {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DragonAttenuation/glTF-Binary/DragonAttenuation.glb',
    position: [7.5, 1, 10],
    info: 'Dragon',
    description: 'A stylized dragon figure showcasing advanced light attenuation through crystal-like material.',
    scale: 1,
    boxSize: [6, 4, 6],
    boxYOffset: -1
  },
  {
    url: getAssetPath('/models/x_wing.glb'),
    position: [15, 2.5, 10],
    info: 'X-Wing Fighter',
    description: 'A classic starfighter known for its distinctive S-foils and speed.',
    scale: 1,
    boxSize: [6, 4, 11],
    boxYOffset: -2
  },
];

// --- COMPONENT: Loading Screen with simultaneous "L & M" reveal ---
function LoadingScreen({ onStarted }) {
  const [phase, setPhase] = useState('initial'); 
  const virtualPrefix = ['V', 'I', 'R', 'T', 'U', 'A']; 
  const museumSuffix = ['U', 'S', 'E', 'U', 'M'];

  useEffect(() => {
    const startTimer = setTimeout(() => setPhase('emerging'), 1500);
    const endTimer = setTimeout(() => setPhase('complete'), 4000);
    return () => { clearTimeout(startTimer); clearTimeout(endTimer); };
  }, []);

  return (
    <>
      <style>{`
        .loading-container {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: #0a0a0a; color: white; display: flex; flex-direction: column;
          justify-content: center; align-items: center; z-index: 100;
          font-family: 'Courier New', monospace; overflow: hidden;
        }
        .text-row { display: flex; font-size: 4.5rem; font-weight: 900; letter-spacing: 0.15em; align-items: center; }
        .anchor { color: #fff; z-index: 10; position: relative; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
        .emerging-letter {
          display: inline-block; opacity: 0; width: 0;
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden; text-align: center;
        }
        .active .emerging-letter { opacity: 1; width: 1.1em; }
        .btn-start {
          margin-top: 4rem; padding: 1.2rem 3rem; font-size: 1.1rem;
          background: transparent; border: 1px solid white; color: white;
          cursor: pointer; transition: all 0.4s ease; opacity: 0;
          transform: translateY(15px); pointer-events: none;
        }
        .btn-start.visible { opacity: 1; transform: translateY(0); pointer-events: auto; }
        .btn-start:hover { background: white; color: #000; }
      `}</style>
      <div className="loading-container">
        <div className={`text-row ${phase !== 'initial' ? 'active' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {virtualPrefix.map((char, i) => (
              <span key={`v-${i}`} className="emerging-letter" style={{ transitionDelay: `${(virtualPrefix.length - i) * 0.15}s` }}>{char}</span>
            ))}
            <span className="anchor">L</span>
          </div>
          <div style={{ width: '3rem' }} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="anchor">M</span>
            {museumSuffix.map((char, i) => (
              <span key={`m-${i}`} className="emerging-letter" style={{ transitionDelay: `${i * 0.15}s` }}>{char}</span>
            ))}
          </div>
        </div>
        <button className={`btn-start ${phase === 'complete' ? 'visible' : ''}`} onClick={onStarted}>START THE TOUR</button>
      </div>
    </>
  );
}

// --- COMPONENT: Exhibit Logic ---
function Exhibit({ modelData, onSelect, isNavigating, onShowDescription }) {
  const { scene } = useGLTF(modelData.url);
  const [hovered, setHovered] = useState(false);
  const clonedScene = scene.clone();
  const boxSize = modelData.boxSize || [3, 4, 3];
  const boxYOffset = modelData.boxYOffset || 0;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isNavigating) onShowDescription(modelData);
    else onSelect(modelData);
  };

  return (
    <group position={modelData.position}>
      <primitive object={clonedScene} scale={modelData.scale} rotation={modelData.rotation || [0, 0, 0]} />
      <Box args={boxSize} position={[0, (boxSize[1] / 2) + boxYOffset, 0]} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} onClick={handleClick}>
        <meshPhysicalMaterial color={hovered ? '#60a5fa' : '#ffffff'} transmission={1.0} roughness={0.15} thickness={0.05} transparent opacity={hovered ? 0.3 : 0.1} />
      </Box>
      {(hovered || isNavigating) && (
        <Html position={[0, boxSize[1] + boxYOffset + 0.6, 0]} center>
          <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', color: 'white', padding: '5px 12px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'nowrap', pointerEvents: 'none' }}>{modelData.info}</div>
        </Html>
      )}
    </group>
  );
}

// --- COMPONENT: Player Controller ---
function PlayerControls({ exhibits, activeDescription, setActiveDescription }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const moveForward = useRef(false);
  const moveBackward = useRef(false);
  const moveLeft = useRef(false);
  const moveRight = useRef(false);
  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();

  const allObstacles = exhibits.map(ex => {
    const size = ex.boxSize || [3, 4, 3];
    return new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(ex.position[0], (size[1]/2) + (ex.boxYOffset || 0), ex.position[2]),
      new THREE.Vector3(size[0], size[1], size[2])
    );
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': moveForward.current = true; break;
        case 'ArrowLeft': case 'KeyA': moveLeft.current = true; break;
        case 'ArrowDown': case 'KeyS': moveBackward.current = true; break;
        case 'ArrowRight': case 'KeyD': moveRight.current = true; break;
        case 'KeyC': setActiveDescription(null); break;
        default: break;
      }
    };
    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': moveForward.current = false; break;
        case 'ArrowLeft': case 'KeyA': moveLeft.current = false; break;
        case 'ArrowDown': case 'KeyS': moveBackward.current = false; break;
        case 'ArrowRight': case 'KeyD': moveRight.current = false; break;
        default: break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => { 
      document.removeEventListener('keydown', handleKeyDown); 
      document.removeEventListener('keyup', handleKeyUp); 
    };
  }, [setActiveDescription]);

  useFrame((state, delta) => {
    if (controlsRef.current?.isLocked) {
      const prevPos = camera.position.clone();
      velocity.x -= velocity.x * 10.0 * delta;
      velocity.z -= velocity.z * 10.0 * delta;
      direction.z = Number(moveForward.current) - Number(moveBackward.current);
      direction.x = Number(moveRight.current) - Number(moveLeft.current);
      direction.normalize();
      if (moveForward.current || moveBackward.current) velocity.z -= direction.z * 60.0 * delta;
      if (moveLeft.current || moveRight.current) velocity.x -= direction.x * 60.0 * delta;
      controlsRef.current.moveRight(-velocity.x * delta);
      controlsRef.current.moveForward(-velocity.z * delta);
      
      const playerBox = new THREE.Box3().setFromCenterAndSize(camera.position, new THREE.Vector3(1.2, 2, 1.2));
      for (const obstacle of allObstacles) {
        if (playerBox.intersectsBox(obstacle)) { camera.position.copy(prevPos); break; }
      }
      if (activeDescription) {
        const dist = camera.position.distanceTo(new THREE.Vector3(...activeDescription.position));
        if (dist > 12) setActiveDescription(null);
      }
    }
  });
  return <PointerLockControls ref={controlsRef} />;
}

// --- COMPONENT: Main Scene Component ---
function MuseumScene({ onShowDescription, activeDescription, setActiveDescription }) {
  const { camera } = useThree();
  const [target, setTarget] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const textures = useTexture([
    getAssetPath('/textures/Onyx015_1K-JPG_Color.jpg'), 
    getAssetPath('/textures/Fabric081B_1K-JPG_Color.jpg'), 
    getAssetPath('/textures/Fabric082B_1K-JPG_Color.jpg')
  ]);

  const [floorTex, wallTex, ceilTex] = textures;

  useEffect(() => {
    textures.forEach(t => {
      if (t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping; 
        t.repeat.set(8, 8);
      }
    });
    camera.position.set(0, 5, 22);
    camera.lookAt(0, 2, 0);
  }, [camera, textures]);

  const handleSelectExhibit = (exhibit) => {
    if (!isNavigating) {
      setTarget({ 
        position: new THREE.Vector3(exhibit.position[0], exhibit.position[1] + 1.5, exhibit.position[2] + 4), 
        lookAt: new THREE.Vector3(...exhibit.position) 
      });
    }
  };

  useFrame(() => {
    if (target) {
      camera.position.lerp(target.position, 0.06);
      camera.lookAt(new THREE.Vector3().lerpVectors(camera.position, target.lookAt, 0.1));
      if (camera.position.distanceTo(target.position) < 0.1) { setTarget(null); setIsNavigating(true); }
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[20, 30, 10]} intensity={1} castShadow />
      <Box args={[50, 0.4, 50]} position={[0, -0.2, 0]}><meshStandardMaterial map={floorTex} /></Box>
      <Box args={[50, 20, 0.5]} position={[0, 9.8, -25.25]}><meshStandardMaterial map={wallTex} /></Box>
      <Box args={[50, 20, 0.5]} position={[0, 9.8, 25.25]}><meshStandardMaterial map={wallTex} /></Box>
      <Box args={[0.5, 20, 50]} position={[-25.25, 9.8, 0]}><meshStandardMaterial map={wallTex} /></Box>
      <Box args={[0.5, 20, 50]} position={[25.25, 9.8, 0]}><meshStandardMaterial map={wallTex} /></Box>
      <Box args={[50, 0.4, 50]} position={[0, 20, 0]}><meshStandardMaterial map={ceilTex} /></Box>
      <Suspense fallback={null}>
        {exhibits.map((ex, i) => (
          <Exhibit key={i} modelData={ex} onSelect={handleSelectExhibit} isNavigating={isNavigating} onShowDescription={onShowDescription} />
        ))}
      </Suspense>
      {isNavigating ? <PlayerControls exhibits={exhibits} activeDescription={activeDescription} setActiveDescription={setActiveDescription} /> : <OrbitControls target={[0, 2, 0]} enablePan={false} enableZoom={false} />}
    </>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [tourStarted, setTourStarted] = useState(false);
  const [activeDescription, setActiveDescription] = useState(null);
  
  useEffect(() => { 
    exhibits.forEach(ex => useGLTF.preload(ex.url)); 
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
      {!tourStarted && <LoadingScreen onStarted={() => setTourStarted(true)} />}
      <Canvas shadows camera={{ fov: 60 }}>
        {tourStarted && (
          <Suspense fallback={null}>
            <MuseumScene 
              onShowDescription={setActiveDescription} 
              activeDescription={activeDescription} 
              setActiveDescription={setActiveDescription} 
            />
          </Suspense>
        )}
      </Canvas>
      {activeDescription && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', zIndex: 101, background: 'rgba(0,0,0,0.5)' }} onClick={() => setActiveDescription(null)}>
          <div style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(15, 15, 15, 0.95)', color: 'white', padding: '40px', borderRadius: '8px', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }} onClick={(e) => e.stopPropagation()}>
            <h1 style={{ marginTop: 0 }}>{activeDescription.info}</h1>
            <p style={{ lineHeight: '1.6' }}>{activeDescription.description}</p>
            <button onClick={() => setActiveDescription(null)} style={{ background: '#fff', color: '#000', padding: '12px', width: '100%', cursor: 'pointer', border: 'none', fontWeight: 'bold', marginTop: '20px' }}>CLOSE (C)</button>
          </div>
        </div>
      )}
      {tourStarted && !activeDescription && (
         <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', color: 'white', background: 'rgba(0,0,0,0.6)', padding: '10px 30px', borderRadius: '30px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ margin: 0 }}>Click an exhibit to inspect. WASD TO MOVE.</p>
         </div>
      )}
    </div>
  );
}