import { PALETTES, TERRAIN_IDS, WORLDS, styleIndex, type WorldSpec } from '../config/catalog';
import type { Settings } from '../config/params';
import type { CameraPose } from '../scene/camera';
import { crystalRotation, crystalShape } from '../scene/crystal';
import type { Storm } from '../scene/storm';
import { seededUnit } from '../util/random';
import { Program, RenderTarget, type TargetFormat } from './gl';
import { sceneView, type SceneView } from './sceneView';
import { compositeFragment, fullscreenVertex, prepassFragment, sceneFragment } from './shaders';

export interface FrameInput {
  settings: Settings;
  pose: CameraPose;
  phase: number;
  clock: number;
  storm: Storm;
  fade: number;
  frameIndex: number;
  scale: number;
}

export interface RendererOptions {
  preserveDrawingBuffer: boolean;
  prepass: boolean;
}

interface Pipeline {
  scene: Program;
  prepass: Program | null;
}

const TAU = Math.PI * 2;
const PREPASS_TILE = 8;
const SEAM_MARGIN_TEXELS = 2;
const SEED_SPREAD = 40;
const AURA = styleIndex('aura');
const CONE_SAFETY = 1.15;

export class Renderer {
  readonly gl: WebGL2RenderingContext;
  sceneWidth = 0;
  sceneHeight = 0;

  private readonly composite: Program;
  private readonly pipelines = new Map<string, Pipeline>();
  private readonly sceneTarget: RenderTarget;
  private readonly prepassTarget: RenderTarget | null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: RendererOptions,
  ) {
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: options.preserveDrawingBuffer,
    });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;

    const floatTargets = Boolean(
      gl.getExtension('EXT_color_buffer_float') ?? gl.getExtension('EXT_color_buffer_half_float'),
    );
    const sceneFormat: TargetFormat = floatTargets
      ? { internalFormat: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT, filter: gl.LINEAR }
      : { internalFormat: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE, filter: gl.LINEAR };
    this.sceneTarget = new RenderTarget(gl, sceneFormat);
    this.prepassTarget =
      floatTargets && options.prepass
        ? new RenderTarget(gl, { internalFormat: gl.R16F, format: gl.RED, type: gl.HALF_FLOAT, filter: gl.NEAREST })
        : null;

    this.composite = Program.create(gl, fullscreenVertex, compositeFragment);
    gl.bindVertexArray(gl.createVertexArray());
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
  }

  prepare(settings: Settings): Pipeline {
    const world = WORLDS[settings.world];
    const terrain = TERRAIN_IDS[world.usesTerrain ? settings.terrain : 0];
    const key = `${world.id}/${terrain}`;
    let pipeline = this.pipelines.get(key);
    if (!pipeline) {
      pipeline = {
        scene: Program.create(this.gl, fullscreenVertex, sceneFragment(world.id, terrain)),
        prepass: this.prepassTarget
          ? Program.create(this.gl, fullscreenVertex, prepassFragment(world.id, terrain))
          : null,
      };
      this.pipelines.set(key, pipeline);
    }
    return pipeline;
  }

  render(frame: FrameInput): void {
    const { canvas } = this;
    const { settings } = frame;
    const pipeline = this.prepare(settings);
    const world = WORLDS[settings.world];

    const pixelsPerUnit = canvas.height * frame.scale;
    const view = sceneView(settings.symmetry, canvas.width / canvas.height, SEAM_MARGIN_TEXELS / pixelsPerUnit);
    this.sceneWidth = Math.max(2, Math.round(view.width * pixelsPerUnit));
    this.sceneHeight = Math.max(2, Math.round(view.height * pixelsPerUnit));
    this.sceneTarget.resize(this.sceneWidth, this.sceneHeight);

    const usePrepass = pipeline.prepass !== null && this.prepassTarget !== null && settings.style !== AURA;
    if (usePrepass) this.drawPrepass(pipeline.prepass!, this.prepassTarget!, frame, world, view);
    this.drawScene(pipeline.scene, frame, world, view, usePrepass);
    this.drawComposite(frame, world, view);
  }

  private drawPrepass(program: Program, target: RenderTarget, frame: FrameInput, world: WorldSpec, view: SceneView): void {
    const { gl } = this;
    target.resize(Math.ceil(this.sceneWidth / PREPASS_TILE), Math.ceil(this.sceneHeight / PREPASS_TILE));
    target.bind();
    program.use();
    this.setGeometryUniforms(program, frame, world, view);
    const tileHalfDiagonal = (PREPASS_TILE / 2) * Math.hypot(view.width / this.sceneWidth, view.height / this.sceneHeight);
    program.float('uConeSlope', (tileHalfDiagonal / frame.settings.lens) * CONE_SAFETY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private drawScene(program: Program, frame: FrameInput, world: WorldSpec, view: SceneView, usePrepass: boolean): void {
    const { gl } = this;
    const { settings, storm } = frame;
    this.sceneTarget.bind();
    program.use();
    this.setGeometryUniforms(program, frame, world, view);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, usePrepass ? this.prepassTarget!.texture : null);
    program.int('uPrepass', 0);
    program.int('uPrepassEnabled', usePrepass ? 1 : 0);
    program.int('uStyle', settings.style);
    program.float('uGlow', settings.glow);
    program.float('uStorm', settings.storm);
    program.float('uFlash', storm.flash);
    program.vec3('uBoltLight', storm.light);
    program.float('uFrame', frame.frameIndex % 997);
    program.int('uPreciseSteps', settings.style === AURA ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private drawComposite(frame: FrameInput, world: WorldSpec, view: SceneView): void {
    const { gl, canvas, composite } = this;
    const { settings, pose, storm } = frame;
    const palette = PALETTES[settings.palette];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    composite.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTarget.texture);
    composite.int('uScene', 0);
    composite.vec2('uResolution', canvas.width, canvas.height);
    composite.vec2('uViewOrigin', view.originX, view.originY);
    composite.vec2('uViewSize', view.width, view.height);
    composite.int('uSymmetry', settings.symmetry);
    composite.float('uContrast', settings.contrast);
    composite.float('uTint', settings.tint);
    composite.float('uIris', settings.iris);
    composite.float('uFade', frame.fade);
    composite.float('uPhase', (frame.phase * world.morphRate) % TAU);
    composite.float('uStorm', settings.storm);
    composite.float('uFlash', storm.flash);
    composite.float('uTime', frame.clock % 3600);
    composite.float('uFrame', frame.frameIndex % 997);
    composite.float('uLens', settings.lens);
    composite.vec3('uOrigin', pose.origin);
    composite.vec3('uForward', pose.forward);
    composite.vec3('uRight', pose.right);
    composite.vec3('uUp', pose.up);
    composite.vec3('uShadow', palette.shadow);
    composite.vec3('uMid', palette.mid);
    composite.vec3('uLight', palette.light);
    composite.vec3('uBolt', storm.bolt);
    composite.vec3('uFork', storm.fork);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private setGeometryUniforms(program: Program, frame: FrameInput, world: WorldSpec, view: SceneView): void {
    const { settings, pose } = frame;
    const phase = frame.phase * world.morphRate;
    program.vec2('uResolution', this.sceneWidth, this.sceneHeight);
    program.vec2('uViewOrigin', view.originX, view.originY);
    program.vec2('uViewSize', view.width, view.height);
    program.vec3('uOrigin', pose.origin);
    program.vec3('uForward', pose.forward);
    program.vec3('uRight', pose.right);
    program.vec3('uUp', pose.up);
    program.float('uLens', settings.lens);
    program.vec3('uPhase', [phase % TAU, (phase * 0.77) % TAU, (phase * 1.31) % TAU]);
    program.vec3('uSeed', [1, 2, 3].map((channel) => seededUnit(settings.seed, channel) * SEED_SPREAD));
    program.mat3('uCrystalRotation', crystalRotation(settings.seed, frame.phase));
    program.vec4('uCrystalShape', crystalShape(settings.seed));
    program.float('uTerrace', settings.terrace);
    program.float('uDetail', settings.detail);
    program.float('uFolds', settings.folds);
    program.float('uTime', frame.clock % 3600);
  }
}
