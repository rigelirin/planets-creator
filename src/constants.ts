import { Vector3 } from 'three'

/** Base planet radius in world units. The terrain sphere lives at this radius. */
export const BASE_RADIUS = 1

/** Per-cube-face subdivision for the live (preview) terrain mesh. 6 * (N+1)^2 verts. */
export const LIVE_FACE_SUBDIV = 160

/** Direction from the planet to its star (the single directional light). */
export const STAR_DIRECTION = new Vector3(1, 0.35, 0.6).normalize()

/** Star (sun) tint, shared by the light and the shell specular/glow. */
export const STAR_COLOR = '#fff6e6'

/** Cloud shell radius as a multiple of BASE_RADIUS. */
export const CLOUD_RADIUS_FACTOR = 1.02

/** Cloud noise frequency, shared by the live cloud shell and the export bake. */
export const CLOUD_SCALE = 4.2

/** Atmosphere shell radius as a multiple of BASE_RADIUS. */
export const ATMOSPHERE_RADIUS_FACTOR = 1.14

/** Saturn-like ring system inner/outer radius, as multiples of BASE_RADIUS. */
export const RING_INNER_FACTOR = 1.3
export const RING_OUTER_FACTOR = 2.3

/**
 * Azimuthal tessellation of the ring disc. The concentric radial bands are a
 * fragment-shader effect (radius = length(worldPos)), so a single radial
 * segment is geometrically exact; only the circle needs to be smooth.
 */
export const RING_THETA_SEGMENTS = 256

/** Default ring-plane tilt away from the equatorial (edge-on) plane, in degrees. */
export const RING_DEFAULT_TILT_DEG = 20

/**
 * Optional slow azimuthal drift of the ring plane (rad/s). 0 keeps the ring
 * static. Radial bands are rotationally symmetric, so this is only visible if
 * the shader adds seed-varied azimuthal detail.
 */
export const RING_SPIN_SPEED = 0

/** Initial camera distance from planet center. */
export const CAMERA_DISTANCE = 3.2
