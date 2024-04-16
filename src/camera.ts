import * as twgl from "twgl.js"

export function viewMatrix(
    camera: twgl.v3.Vec3,
    target: twgl.v3.Vec3,
): twgl.m4.Mat4 {
    return twgl.m4.inverse(twgl.m4.lookAt(camera, target, [0, 1, 0]))
}

export function perspectiveMatrix(
    gl: WebGL2RenderingContext,
    verticalFovDeg: number,
): twgl.m4.Mat4 {
    return twgl.m4.perspective(
        verticalFovDeg * (Math.PI / 180),
        gl.canvas.width / gl.canvas.height,
        1,
        100,
    )
}
