/**
 * Compiles and links a WebGL program without blocking the page where the browser allows it
 * (KHR_parallel_shader_compile). Big fragment shaders can take seconds to compile on Windows
 * (ANGLE → D3D11); asking for COMPILE_STATUS straight away would freeze the main thread that long.
 *
 * Returns the program and a ready() check to call each frame: false while still compiling,
 * true once linked; throws with the compiler's log if it failed. Without the extension, ready()
 * simply waits for the compile (the old, blocking behaviour).
 */
export function createProgram(gl, vertexSource, fragmentSource) {
  const shader = (type, source) => {
    const s = gl.createShader(type)
    gl.shaderSource(s, source)
    gl.compileShader(s)
    return s
  }
  const vs = shader(gl.VERTEX_SHADER, vertexSource)
  const fs = shader(gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  const parallel = gl.getExtension('KHR_parallel_shader_compile')

  return {
    program,
    ready() {
      if (parallel && !gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) return false
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getShaderInfoLog(fs) || gl.getShaderInfoLog(vs) || gl.getProgramInfoLog(program) || 'link')
      }
      return true
    },
  }
}
