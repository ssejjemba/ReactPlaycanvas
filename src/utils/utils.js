import pc from 'playcanvas'
// check for wasm module support
export function wasmSupported() {
    try {
        if (
            typeof WebAssembly === 'object' &&
            typeof WebAssembly.instantiate === 'function'
        ) {
            const module = new WebAssembly.Module(
                Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
            )
            if (module instanceof WebAssembly.Module)
                return (
                    new WebAssembly.Instance(module) instanceof
                    WebAssembly.Instance
                )
        }
    } catch (e) {
        // empty
    }
    return false
}

// load a script
export function loadScriptAsync(url, doneCallback) {
    const tag = document.createElement('script')
    tag.onload = function () {
        doneCallback()
    }
    tag.onerror = function () {
        throw new Error(`failed to load ${url}`)
    }
    tag.async = true
    tag.src = url
    document.head.appendChild(tag)
}

// load and initialize a wasm module
export function loadWasmModuleAsync(
    moduleName,
    jsUrl,
    binaryUrl,
    doneCallback
) {
    loadScriptAsync(jsUrl, function () {
        const lib = window[moduleName]
        window[`${moduleName}Lib`] = lib
        lib({
            locateFile() {
                return binaryUrl
            },
        }).then(function (instance) {
            window[moduleName] = instance
            doneCallback()
        })
    })
}

export function getPinchDistance(pointA, pointB) {
    // Return the distance between the two points
    const dx = pointA.x - pointB.x
    const dy = pointA.y - pointB.y

    return Math.sqrt(dx * dx + dy * dy)
}

export function calcMidPoint(pointA, pointB, result) {
    result.set(pointB.x - pointA.x, pointB.y - pointA.y)
    result.scale(0.5)
    result.x += pointA.x
    result.y += pointA.y
}
/**
 * Takes in a number in radians and returns a number in degrees
 * @param {number} radians - the number to be converted in radians
 * @returns {number} The converted number in degrees
 */
export function radToDeg(radians) {
    const deg = (radians * 180) / Math.PI
    return deg
}

/**
 * This function takes in an object spec of a light and returns a playcanvas entity with the light component
 * @param {Object} light - The light to be added.
 * @param {Array<number>} light.color - The color of the light.
 * @param {number} light.intensity - The intensity of the light.
 * @param {'directional' | 'point' | 'spot' } light.type - The type of the light.
 * @param {string} light.name - The name of the light entity
 * @param {{innerConeAngle: number, outerConeAngle: number}} [light.spot] Spot only. The inner and outer cone angles, measured from the spotlight's direction, at which light falls from its maximum to zero.
 * @param {number} [light.range] - The range at which the light is visible
 * @param {Array<number>} [light.translation] - The translation for the which the light is transformed
 * @param {Array<number>} light.rotation - The rotation for the which the light is transformed
 * @param {Array<number>} [light.matrix] - A 16 element array with a matrix for the transformation to be applied
 * @returns {pc.Entity}
 *
 */
export function createLight(light) {
    // console.log(light)
    const lightEntity = new pc.Entity(light.name)
    const { color } = light
    lightEntity.addComponent('light', {
        color: new pc.Color(color[0], color[1], color[2]),
        // eslint-disable-next-line no-ternary
        intensity: light.intensity,
        type: light.type,
        range: light.range || 100,
    })

    if (light.type === 'spot' && light.spot) {
        lightEntity.light.innerConeAngle = radToDeg(light.spot.innerConeAngle)
        lightEntity.light.outerConeAngle = radToDeg(light.spot.outerConeAngle)
    }

    return lightEntity
}

export function setTransform(light, node) {
    light.setPosition(node.getPosition())
    light.setRotation(node.getRotation())
}

/**
 * This function receives a JSON string and reads and returns playcanvas light entities from the JSON
 * @param {JSON} json - The JSON string to be interpreted
 * @returns {Array<pc.Entity>}
 */
export function readLights(json) {
    const lightEXT = 'KHR_lights_punctual'
    const renderedLights = []
    const lightObjects = []
    let err = 'no error found'
    try {
        const jsonObj = JSON.parse(json)
        err = 'no extention used'

        if (jsonObj.extensionsUsed) {
            err = 'no light extention'
            if (jsonObj.extensionsUsed.includes(lightEXT)) {
                err = 'Extensions property missing'
                if (jsonObj.extensions) {
                    err = 'no light extention configuration'
                    if (jsonObj.extensions[lightEXT]) {
                        err = 'no lights'
                        /**
                         * @type {Array} lights
                         */
                        const lights = jsonObj.extensions[lightEXT].lights

                        if (lights) {
                            err = 'no error found'
                            lights.forEach((light) => {
                                // const modLight = createLight(light)
                                lightObjects.push(light)
                            })

                            lightObjects.forEach((light) => {
                                const modLight = createLight(light)
                                renderedLights.push(modLight)
                            })
                        }
                    }
                }
            }
        }

        console.log(err)

        return renderedLights
    } catch (e) {
        console.log(e)
        return renderedLights
    }
}

export function buildAabb(
    entity,
    modelsAdded,
    _modelsAabb = new pc.BoundingBox()
) {
    let i = 0

    if (entity.model) {
        const mi = entity.model.meshInstances
        for (i = 0; i < mi.length; i++) {
            if (modelsAdded === 0) {
                _modelsAabb.copy(mi[i].aabb)
            } else {
                _modelsAabb.add(mi[i].aabb)
            }
            modelsAdded++
        }
    }

    for (i = 0; i < entity.children.length; ++i) {
        buildAabb(entity.children[i], modelsAdded, _modelsAabb)
    }

    return _modelsAabb
}

export class Pointer {
    /**
     *
     * @param {{clientX:number, clientY: number}} touch event touch object
     */
    constructor(touch) {
        this.x = touch.clientX
        this.y = touch.clientY
    }
}

/**
 *
 * @param {{x: number, y: number}} p1
 * @param {{x: number, y: number}} p2
 */
export const getDistance = (p1, p2) => {
    const powX = (p1.x - p2.x) ** 2
    const powY = (p1.y - p2.y) ** 2

    return Math.sqrt(powX + powY)
}

/**
 *
 * @param {{x: number, y: number}} p1
 * @param {{x: number, y: number}} p2
 */
export const getAngleDeg = (p1, p2) => {
    return (Math.atan2(p1.y - p2.y, p1.x - p2.x) * 180) / Math.PI
}
