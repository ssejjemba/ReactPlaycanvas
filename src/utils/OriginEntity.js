import pc from 'playcanvas'

class OriginController extends pc.Entity {
    constructor() {
        super('OriginController')

        this.origin = new pc.Entity('Origin')
        this.addChild(this.origin)
    }

    /**
     * adds an entity as another child of the origin
     * @param {pc.Entity} entity
     */
    appendToOrigin = (entity) => {
        this.origin.addChild(entity)
    }

    /**
     * adds an entity as another child of the origin
     * @param {pc.Entity} entity
     */
    removeFromOrigin = (entity) => {
        this.origin.removeChild(entity)
    }

    /**
     * sets an entity as a sole child of the origin
     * @param {pc.Entity} entity
     */
    setOriginChild = (entity) => {
        for (let i = this.origin.children.length - 1; i >= 0; i--) {
            const child = this.origin.children[i]
            this.origin.removeChild(child)
        }

        this.appendToOrigin(entity)
    }

    /**
     * rotates the origin through a given distance
     * @param {{dx: number, dy: number}} drag
     */
    rotateOrigin = (drag) => {
        this.origin.rotate(0.2 * drag.dy, 0.2 * drag.dx, 0)
    }

    /**
     * translates the origin through a given distance
     * @param {{dx: number, dy: number}} drag
     */
    translateOrigin = (drag) => {
        this.origin.translate(0.02 * drag.dx, -0.02 * drag.dy, 0)
    }

    /**
     * scales the origin through a given scale
     * @param {number} scale
     */
    scaleOrigin = (scale) => {
        this.origin.setLocalScale(scale, scale, scale)
    }
}

export default OriginController
