import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import gsap from 'gsap'
import MeshTransmissionMaterialImpl from './transmissionMaterial'

export default class Canvas {
    constructor () {
        this.clock = new THREE.Clock()
        this.mouse = new THREE.Vector2(0, 0)
        this.axis = new THREE.Vector3(1, 0, 1)
        this.createRenderer()
        this.createScene()
        this.createCamera()
        this.createLights()
        this.createGeometry()
        this.eventListeners()
        this.onResize()
        this.update()
    }

    createRenderer () {
        this.width = window.innerWidth
        this.height = window.innerHeight

        this.renderer = new THREE.WebGLRenderer({
            alpha: false,
            antialias: true,
        })

        this.renderer.setSize(this.width, this.height)
        this.renderer.setPixelRatio(window.devicePixelRatio || 1)
        this.renderer.autoClear = false
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.toneMappingExposure = 1

        document.body.appendChild(this.renderer.domElement)
    }

    createScene () {
        this.scene = new THREE.Scene()
    }

    createCamera () {
        const aspect = this.width / this.height
        const frustumSize = aspect * 4.4
        this.camera = new THREE.OrthographicCamera(-frustumSize, frustumSize, frustumSize / 2, -frustumSize / 2, 1, 1000)
        this.camera.position.z = 10

        this.orbit = new OrbitControls(this.camera, this.renderer.domElement)
        this.orbit.update()
    }

    createLights () {
        const ambient = new THREE.AmbientLight(0xffffff, 1)
        this.scene.add(ambient)

        this.textureLoader = new THREE.TextureLoader()
        const textureEquirec = this.textureLoader.load('/49TH_STREET.jpg')
        textureEquirec.mapping = THREE.EquirectangularReflectionMapping
        textureEquirec.encoding = THREE.sRGBEncoding

        this.scene.environment = textureEquirec
        this.scene.environment.mapping = THREE.EquirectangularReflectionMapping
        this.scene.background = textureEquirec
        this.scene.backgroundBlurriness = 3
        this.scene.backgroundIntensity = 3
    }

    createGeometry () {
        // BACKGROUND PLANE
        const tX = this.textureLoader.load('/text.jpg')
        const planeGeo = new THREE.PlaneGeometry(this.width * 0.01, this.height * 0.01, 1, 1)
        const planeMat = new THREE.MeshStandardMaterial({
            map: tX,
            emissiveMap: tX,
            emissive: 0xffffff,
            emissiveIntensity: 10,
            side: THREE.DoubleSide,
        })
        this.bgTextPlane = new THREE.Mesh(planeGeo, planeMat)
        this.scene.add(this.bgTextPlane)

        // BLOB MODEL
        this.loader = new GLTFLoader(this.manager)
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('/draco/')
        this.loader.setDRACOLoader(dracoLoader)
        this.mesh = null
        this.blobChild = null

        this.loader.load('/blob.glb', (gltf) => {
            this.mesh = gltf.scene

            this.blobChild = gltf.scene.getObjectByName('Sphere')
            this.blobChild.material = Object.assign(new MeshTransmissionMaterialImpl(10), {
                clearcoat: 1,
                clearcoatRoughness: 0,
                transmission: 1,
                chromaticAberration: 0.02,
                anistropy: 0.1,
                roughness: 0.01,
                thickness: 1,
                ior: 1.1,
                distortion: 0.5,
                distortionScale: 0.1,
                temporalDistortion: 0.2,
            })
            this.scene.add(gltf.scene)
        })
    }

    // EVENTS
    eventListeners () {
        window.addEventListener('resize', this.onResize.bind(this))
        window.addEventListener('mousemove', (e) => { this.onMouseMove.bind(this)(e) })
    }

    onMouseMove (e) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

        const vec = new THREE.Vector3(this.mouse.x, this.mouse.y, 0)
        vec.unproject(this.camera)
        const direction = vec.sub(this.camera.position).normalize()
        const distance = -this.camera.position.z / direction.z
        const pos = this.camera.position.clone().add(direction.multiplyScalar(distance))

        gsap.to(this.mesh.position, {
            x: pos.x * 50,
            y: pos.y * 50,
            z: pos.z * 50,
            duration: 1,
        })
    }

    onResize () {
        const reWidth = window.innerWidth
        const reHeight = window.innerHeight

        this.camera.aspect = reWidth / reHeight
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(reWidth, reHeight)
    }

    // LOOP
    update (t) {
        const delta = this.clock.getDelta()

        if (this.blobChild || this.mesh) {
            this.mesh.rotateOnAxis(this.axis, Math.PI / 300)
            this.blobChild.material.time = t / 1000
        }
        this.renderer.render(this.scene, this.camera)
        requestAnimationFrame(this.update.bind(this))
    }
}
