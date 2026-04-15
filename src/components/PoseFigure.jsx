import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

// Bones connecting joints in the stick figure
const BONES = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
]

// Convert MediaPipe coords to 3D scene coords (centred + flipped)
function toVec(point) {
  // MediaPipe: x left-to-right (0-1), y top-to-bottom (0-1), z depth
  return new THREE.Vector3(
    (point[0] - 0.5) * 2,
    -(point[1] - 0.5) * 2,
    -point[2] * 2
  )
}

function Skeleton({ pose, color }) {
  const lines = useMemo(() => {
    if (!pose) return []
    return BONES.map(([a, b], i) => {
      const va = toVec(pose[a])
      const vb = toVec(pose[b])
      const geom = new THREE.BufferGeometry().setFromPoints([va, vb])
      return <line key={i}><primitive object={geom} attach="geometry" /><lineBasicMaterial color={color} linewidth={2} /></line>
    })
  }, [pose, color])

  const joints = useMemo(() => {
    if (!pose) return []
    return Object.entries(pose).map(([name, point]) => {
      const v = toVec(point)
      return (
        <mesh key={name} position={[v.x, v.y, v.z]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )
    })
  }, [pose, color])

  return <>{lines}{joints}</>
}

export default function PoseFigure({ userPose, proPose }) {
  return (
    <Canvas camera={{ position: [0, 0, 3.5], fov: 50 }}>
      <ambientLight intensity={0.5} />
      {proPose && <Skeleton pose={proPose} color="#FBBF24" />}
      {userPose && <Skeleton pose={userPose} color="#FFFFFF" />}
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  )
}
