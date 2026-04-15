import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

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

// Convert MediaPipe coords to scene coords, with optional x-offset for side-by-side
function toVec(point, xOffset = 0) {
  return new THREE.Vector3(
    (point[0] - 0.5) * 1.4 + xOffset,
    -(point[1] - 0.5) * 1.6 + 0.2, // shift up so feet near floor
    -point[2] * 1.4
  )
}

function Bone({ start, end, color, radius = 0.035 }) {
  const { position, quaternion, length } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(end, start)
    const length = dir.length()
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    )
    return { position: mid, quaternion: quat, length }
  }, [start, end])

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  )
}

function Joint({ point, color, radius = 0.06 }) {
  return (
    <mesh position={point}>
      <sphereGeometry args={[radius, 12, 12]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  )
}

function Skeleton({ pose, color, xOffset = 0, label }) {
  if (!pose) return null

  const points = useMemo(() => {
    const p = {}
    Object.entries(pose).forEach(([name, pt]) => {
      p[name] = toVec(pt, xOffset)
    })
    return p
  }, [pose, xOffset])

  // Head: above the shoulders, using nose position
  const headPos = useMemo(() => {
    if (!points.nose) return null
    const head = points.nose.clone()
    head.y += 0.05
    return head
  }, [points.nose])

  return (
    <group>
      {BONES.map(([a, b], i) => (
        <Bone key={i} start={points[a]} end={points[b]} color={color} />
      ))}
      {Object.entries(points).map(([name, p]) =>
        name === 'nose' ? null : <Joint key={name} point={p} color={color} />
      )}
      {headPos && (
        <mesh position={headPos}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      )}
      {label && (
        <mesh position={[xOffset, -1.05, 0]}>
          <planeGeometry args={[0.7, 0.18]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  )
}

function Floor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1F2937" roughness={0.8} />
      </mesh>
      <gridHelper args={[10, 20, '#374151', '#1F2937']} position={[0, -0.99, 0]} />
    </>
  )
}

export default function PoseFigure({ userPose, proPose }) {
  const offset = 0.85
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.5, 4.2], fov: 45 }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={0.9}
        castShadow
      />
      <Floor />
      <Skeleton pose={userPose} color="#FFFFFF" xOffset={-offset} label="You" />
      <Skeleton pose={proPose} color="#FBBF24" xOffset={offset} label="Pro" />
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={2.5}
        maxDistance={6}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}
