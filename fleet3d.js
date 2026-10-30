/**
 * Interactive 3D Spatial Compute & Fiber Telemetry Engine (`Fleet3D`).
 *
 * The scene is a 3D multi-tiered server architecture ("execution volume"):
 * - X axis: Time (0..100 across the active time window, ending at the live NOW playhead)
 * - Z axis: Repository Server Decks (each repository occupies its own engineered chassis plane)
 * - Y axis: Cantilevered Runner Compute Blades & Fiber Optic Arches
 *
 * Every job execution is rendered with:
 * - A 3D Start Terminal Pod & End Terminal Pod with glowing status caps
 * - A segmented runner-lane execution track along the compute blade
 * - A 16-sided parabolic 3D fiber-optic cable arch with animated data pulse packets
 * - Real-time WebGL2 per-pixel surface normals (via dFdx/dFdy), 3-point studio lighting,
 *   Blinn-Phong specular highlights, and a procedural micro-grid deck surface.
 *
 * Self-contained WebGL2 with zero external dependencies and zero network calls.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Fleet3D = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MINUTE = 60000;
  const MIN_DISTANCE = 12;
  const MAX_DISTANCE = 900;
  const ROW_HEIGHT = 4.2;
  const PLANE_DEPTH = 18;
  const BLOCK_SIZE = 2.2;
  const MIN_BAR_LENGTH = 1.2;
  const FRAME_FILL = 0.82;

  // Heights relative to the repository deck surface.
  const PLATFORM_TOP = 0;
  const PLATFORM_DEPTH_DOWN = 1.5;
  const GRID_Y = 0.05;
  const SHADOW_Y = 0.12;
  const BLOCK_Y = 0.22;

  // Reference illustration palette preserved for deterministic unit tests.
  const PALETTE = {
    ground: [0.961, 0.922, 0.859],
    trace: [0.933, 0.898, 0.835],
    grid: [0.843, 0.765, 0.651],
    platform: [0.906, 0.851, 0.749],
    platformEdge: [0.769, 0.671, 0.529],
    shadow: [0.639, 0.549, 0.435],
    outline: [0.063, 0.063, 0.125],
  };

  const COLORS = {
    success: [0.235, 0.627, 0.392],
    failure: [0.784, 0.235, 0.235],
    timed_out: [0.784, 0.235, 0.235],
    action_required: [0.784, 0.235, 0.235],
    startup_failure: [0.784, 0.235, 0.235],
    cancelled: [0.627, 0.620, 0.596],
    skipped: [0.627, 0.620, 0.596],
    neutral: [0.627, 0.620, 0.596],
    running: [0.941, 0.706, 0.235],
  };
  const DEFAULT_COLOR = [0.941, 0.706, 0.235];

  const THEMES = {
    parchment: {
      palette: PALETTE,
      colors: COLORS,
    },
    aurora: {
      palette: {
        ground: [0.949, 0.961, 0.984],        // Soft Aurora canvas (#F2F5FB)
        trace: [0.878, 0.898, 0.945],         // Hairline (#E0E5ED)
        grid: [0.784, 0.816, 0.886],
        platform: [1.000, 1.000, 1.000],      // Opaque high-readability white deck (#FFFFFF)
        platformEdge: [0.855, 0.878, 0.929],
        platformRim: [0.345, 0.290, 0.631],   // Aurora brand focus (#584AA1)
        blade: [0.969, 0.976, 0.992],
        pillar: [0.604, 0.569, 0.808],
        shadow: [0.835, 0.859, 0.918],
        outline: [0.125, 0.137, 0.176],       // Aurora ink (#20232D)
        highlight: [0.345, 0.290, 0.631],     // Aurora focus (#584AA1)
        nowLine: [0.345, 0.290, 0.631],
      },
      colors: {
        success: [0.129, 0.400, 0.310],       // Verified safe (#21664F)
        failure: [0.647, 0.165, 0.208],       // Verified critical (#A52A35)
        timed_out: [0.647, 0.165, 0.208],
        action_required: [0.647, 0.165, 0.208],
        startup_failure: [0.647, 0.165, 0.208],
        cancelled: [0.388, 0.431, 0.506],     // Muted (#636E81)
        skipped: [0.388, 0.431, 0.506],
        neutral: [0.388, 0.431, 0.506],
        running: [0.745, 0.478, 0.118],       // Verified warning/caution (#BE7A1E)
      },
    },
    light: {
      palette: {
        ground: [0.949, 0.953, 0.945],        // Institutional Paper canvas (#F2F3F1)
        trace: [0.867, 0.882, 0.871],
        grid: [0.765, 0.788, 0.773],          // Paper border (#D1D6D2)
        platform: [1.000, 1.000, 1.000],      // Opaque panel (#FFFFFF)
        platformEdge: [0.820, 0.839, 0.824],
        platformRim: [0.490, 0.388, 0.180],   // Paper brand/focus accent (#7D632E)
        blade: [0.969, 0.973, 0.965],         // Inset (#F7F8F6)
        pillar: [0.620, 0.655, 0.631],
        shadow: [0.831, 0.847, 0.835],
        outline: [0.110, 0.141, 0.129],       // Paper ink (#1C2421)
        highlight: [0.490, 0.388, 0.180],
        nowLine: [0.490, 0.388, 0.180],
      },
      colors: {
        success: [0.129, 0.400, 0.310],       // Safe (#21664F)
        failure: [0.647, 0.165, 0.208],       // Critical (#A52A35)
        timed_out: [0.647, 0.165, 0.208],
        action_required: [0.647, 0.165, 0.208],
        startup_failure: [0.647, 0.165, 0.208],
        cancelled: [0.353, 0.408, 0.376],     // Muted (#5A6860)
        skipped: [0.353, 0.408, 0.376],
        neutral: [0.353, 0.408, 0.376],
        running: [0.686, 0.467, 0.129],       // Warning (#885B18 brightened for 3D)
      },
    },
    dark: {
      palette: {
        ground: [0.043, 0.043, 0.043],        // Institutional Obsidian canvas (#0B0B0B)
        trace: [0.090, 0.106, 0.098],
        grid: [0.204, 0.235, 0.216],          // Obsidian border (#343C37)
        platform: [0.078, 0.090, 0.086],      // Obsidian panel (#141716)
        platformEdge: [0.055, 0.063, 0.059],
        platformRim: [0.741, 0.631, 0.416],   // Obsidian brand/focus (#BDA16A)
        blade: [0.106, 0.125, 0.114],         // Obsidian inset (#1B201D)
        pillar: [0.290, 0.329, 0.306],
        shadow: [0.020, 0.024, 0.020],
        outline: [0.420, 0.475, 0.443],
        highlight: [0.741, 0.631, 0.416],
        nowLine: [0.741, 0.631, 0.416],
      },
      colors: {
        success: [0.514, 0.745, 0.631],       // Obsidian safe (#83BEA1)
        failure: [0.875, 0.600, 0.604],       // Obsidian critical (#DF999A)
        timed_out: [0.875, 0.600, 0.604],
        action_required: [0.875, 0.600, 0.604],
        startup_failure: [0.875, 0.600, 0.604],
        cancelled: [0.627, 0.686, 0.647],     // Obsidian muted (#A0AFA5)
        skipped: [0.627, 0.686, 0.647],
        neutral: [0.627, 0.686, 0.647],
        running: [0.843, 0.718, 0.471],       // Obsidian warning (#D7B778)
      },
    },
    daylight: {
      palette: {
        ground: [0.914, 0.941, 0.973],
        trace: [0.824, 0.871, 0.929],
        grid: [0.698, 0.769, 0.855],
        platform: [0.980, 0.992, 1.000],
        platformEdge: [0.737, 0.804, 0.886],
        platformRim: [0.475, 0.584, 0.725],
        blade: [0.937, 0.961, 0.988],
        pillar: [0.647, 0.733, 0.839],
        shadow: [0.776, 0.831, 0.898],
        outline: [0.118, 0.180, 0.282],
        highlight: [0.020, 0.620, 0.435],
        nowLine: [0.055, 0.525, 0.831],
      },
      colors: {
        success: [0.047, 0.698, 0.478],
        failure: [0.898, 0.192, 0.329],
        timed_out: [0.898, 0.192, 0.329],
        action_required: [0.898, 0.192, 0.329],
        startup_failure: [0.898, 0.192, 0.329],
        cancelled: [0.510, 0.580, 0.675],
        skipped: [0.510, 0.580, 0.675],
        neutral: [0.510, 0.580, 0.675],
        running: [0.937, 0.569, 0.035],
      },
    },
  };

  function colorFor(conclusion, status, colorMap) {
    const map = colorMap || COLORS;
    if (status === 'in_progress' || status === 'queued' || status === 'waiting') return map.running;
    if (!conclusion) return map.running || DEFAULT_COLOR;
    return map[conclusion] || map.neutral;
  }

  function parseTime(value) {
    if (!value) return NaN;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function rowKeyFor(repo, runner) {
    return JSON.stringify([repo || '', runner || '']);
  }

  function boxKeyFor(repo, runner, runId, jobId) {
    return JSON.stringify([repo || '', runner || '', runId || '', jobId || '']);
  }

  /**
   * Turn the job list into a set of positioned bars plus the axis furniture
   * needed to label them. Pure: the same input always yields the same output.
   */
  function buildLayout(jobs, options) {
    const opts = options || {};
    const now = Number.isFinite(opts.now) ? opts.now : Date.now();
    const windowMs = Number.isFinite(opts.windowMs) && opts.windowMs > 0 ? opts.windowMs : 60 * MINUTE;
    const start = now - windowMs;

    const visible = (jobs || []).filter(function (job) {
      if (!job || !job.runner) return false;
      const began = parseTime(job.started);
      if (!Number.isFinite(began)) return false;
      const ended = parseTime(job.completed);
      const finishes = Number.isFinite(ended) ? ended : now;
      return began < now && finishes > start;
    });

    const repos = [];
    const seenRepo = {};
    const rows = [];
    const seenRow = {};
    visible.forEach(function (job) {
      const repo = job.repo || 'unknown repository';
      if (!seenRepo[repo]) {
        seenRepo[repo] = true;
        repos.push(repo);
      }
      const rowKey = rowKeyFor(repo, job.runner);
      if (!seenRow[rowKey]) {
        seenRow[rowKey] = true;
        rows.push({key: rowKey, repo: repo, runner: job.runner});
      }
    });
    repos.sort();
    rows.sort(function (a, b) {
      if (a.repo !== b.repo) return a.repo < b.repo ? -1 : 1;
      return a.runner < b.runner ? -1 : a.runner > b.runner ? 1 : 0;
    });

    const repoIndex = {};
    repos.forEach(function (repo, index) { repoIndex[repo] = index; });
    const rowIndex = {};
    rows.forEach(function (row, index) { rowIndex[row.key] = index; });

    const rowsBeforeIn = {};
    const rowsCountIn = {};
    repos.forEach(function (repo) {
      let count = 0;
      rows.forEach(function (row) {
        if (row.repo !== repo) return;
        rowsBeforeIn[row.key] = count;
        count += 1;
      });
      rowsCountIn[repo] = count;
    });

    const boxes = visible.map(function (job) {
      const began = Math.max(parseTime(job.started), start);
      const endedRaw = parseTime(job.completed);
      const ended = Math.min(Number.isFinite(endedRaw) ? endedRaw : now, now);
      const x0 = (began - start) / windowMs;
      const x1 = (ended - began) / windowMs;
      const repo = job.repo || 'unknown repository';
      const rowKey = rowKeyFor(repo, job.runner);
      const plane = repoIndex[repo];
      const rowsBefore = rowsBeforeIn[rowKey] || 0;
      const position = x0 * 100;
      const span = Math.max(x1 * 100, MIN_BAR_LENGTH);
      return {
        job: job,
        repo: repo,
        runner: job.runner,
        name: job.name || 'job',
        workflow: job.workflow || '',
        conclusion: job.conclusion || (job.status === 'in_progress' ? 'in_progress' : ''),
        status: job.status || '',
        startMs: began,
        endMs: ended,
        x0: position,
        x1: position + span,
        y: rowsBefore * ROW_HEIGHT,
        z: plane * PLANE_DEPTH,
        rowInRepo: rowsBefore,
        color: colorFor(job.conclusion, job.status),
        key: boxKeyFor(repo, job.runner, job.run_id, job.job_id),
      };
    });

    const ticks = [];
    const tickStep = windowMs <= 30 * MINUTE ? 5 * MINUTE : windowMs <= 90 * MINUTE ? 15 * MINUTE : 30 * MINUTE;
    for (let elapsed = 0; elapsed <= windowMs; elapsed += tickStep) {
      const at = start + elapsed;
      const minsAgo = Math.round((windowMs - elapsed) / MINUTE);
      ticks.push({
        x: (elapsed / windowMs) * 100,
        label: minsAgo === 0 ? 'NOW' : '-' + minsAgo + 'm',
        time: at,
      });
    }

    let maxX = 100;
    let maxY = 0;
    let maxZ = 0;
    boxes.forEach(function (box) {
      maxX = Math.max(maxX, box.x1);
      maxY = Math.max(maxY, box.y);
      maxZ = Math.max(maxZ, box.z);
    });
    if (!rows.length) maxY = 0;
    else maxY = Math.max(maxY, (rows.length - 1) * ROW_HEIGHT);

    return {
      boxes: boxes,
      rows: rows.map(function (row) {
        const rInRepo = rowsBeforeIn[row.key] || 0;
        return {
          key: row.key,
          repo: row.repo,
          runner: row.runner,
          y: rowIndex[row.key],
          height: rInRepo * ROW_HEIGHT,
          rowInRepo: rInRepo,
          z: repoIndex[row.repo] * PLANE_DEPTH,
        };
      }),
      planes: repos.map(function (repo, index) {
        return {
          repo: repo,
          z: index * PLANE_DEPTH,
          runnerCount: rowsCountIn[repo] || 1,
        };
      }),
      ticks: ticks,
      bounds: {
        minX: 0, maxX: maxX,
        minY: 0, maxY: maxY,
        minZ: 0, maxZ: maxZ,
      },
      window: {start: start, end: now, span: windowMs},
    };
  }

  // --- 4x4 matrix maths, column-major to match WebGL ------------------------

  const mat4 = {
    identity: function (out) {
      out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
      out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
      out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
      out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
      return out;
    },
    perspective: function (out, fovY, aspect, near, far) {
      const f = 1 / Math.tan(fovY / 2);
      out.fill(0);
      out[0] = f / aspect;
      out[5] = f;
      out[10] = (far + near) / (near - far);
      out[11] = -1;
      out[14] = 2 * far * near / (near - far);
      return out;
    },
    orthographic: function (out, left, right, bottom, top, near, far) {
      out.fill(0);
      out[0] = 2 / (right - left);
      out[5] = 2 / (top - bottom);
      out[10] = -2 / (far - near);
      out[12] = -(right + left) / (right - left);
      out[13] = -(top + bottom) / (top - bottom);
      out[14] = -(far + near) / (far - near);
      out[15] = 1;
      return out;
    },
    lookAt: function (out, eye, center, up) {
      let zx = eye[0] - center[0];
      let zy = eye[1] - center[1];
      let zz = eye[2] - center[2];
      let length = Math.hypot(zx, zy, zz) || 1;
      zx /= length; zy /= length; zz /= length;
      let xx = up[1] * zz - up[2] * zy;
      let xy = up[2] * zx - up[0] * zz;
      let xz = up[0] * zy - up[1] * zx;
      length = Math.hypot(xx, xy, xz) || 1;
      xx /= length; xy /= length; xz /= length;
      const yx = zy * xz - zz * xy;
      const yy = zz * xx - zx * xz;
      const yz = zx * xy - zy * xx;
      out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
      out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
      out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
      out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
      out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
      out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
      out[15] = 1;
      return out;
    },
    multiply: function (out, a, b) {
      const result = new Float32Array(16);
      for (let column = 0; column < 4; column++) {
        for (let row = 0; row < 4; row++) {
          let sum = 0;
          for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[column * 4 + k];
          result[column * 4 + row] = sum;
        }
      }
      out.set(result);
      return out;
    },
    invert: function (out, m) {
      const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
      const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
      const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
      const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
      const b00 = a00 * a11 - a01 * a10;
      const b01 = a00 * a12 - a02 * a10;
      const b02 = a00 * a13 - a03 * a10;
      const b03 = a01 * a12 - a02 * a11;
      const b04 = a01 * a13 - a03 * a11;
      const b05 = a02 * a13 - a03 * a12;
      const b06 = a20 * a31 - a21 * a30;
      const b07 = a20 * a32 - a22 * a30;
      const b08 = a20 * a33 - a23 * a30;
      const b09 = a21 * a32 - a22 * a31;
      const b10 = a21 * a33 - a23 * a31;
      const b11 = a22 * a33 - a23 * a32;
      let determinant = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      if (!determinant) return null;
      determinant = 1 / determinant;
      out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * determinant;
      out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * determinant;
      out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * determinant;
      out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * determinant;
      out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * determinant;
      out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * determinant;
      out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * determinant;
      out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * determinant;
      out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * determinant;
      out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * determinant;
      out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * determinant;
      out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * determinant;
      out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * determinant;
      out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * determinant;
      out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * determinant;
      out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * determinant;
      return out;
    },
    project: function (m, point) {
      const x = point[0], y = point[1], z = point[2];
      const clipX = m[0] * x + m[4] * y + m[8] * z + m[12];
      const clipY = m[1] * x + m[5] * y + m[9] * z + m[13];
      const clipZ = m[2] * x + m[6] * y + m[10] * z + m[14];
      const clipW = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (clipW <= 0) return {x: 0, y: 0, z: 0, visible: false, w: clipW};
      return {
        x: clipX / clipW,
        y: clipY / clipW,
        z: clipZ / clipW,
        w: clipW,
        visible: true,
      };
    },
  };

  function rayBox(origin, direction, box) {
    let tmin = -Infinity;
    let tmax = Infinity;
    for (let axis = 0; axis < 3; axis++) {
      const o = origin[axis];
      const d = direction[axis];
      const lo = box.min[axis];
      const hi = box.max[axis];
      if (Math.abs(d) < 1e-9) {
        if (o < lo || o > hi) return null;
        continue;
      }
      let t1 = (lo - o) / d;
      let t2 = (hi - o) / d;
      if (t1 > t2) { const swap = t1; t1 = t2; t2 = swap; }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return null;
    }
    if (tmax < 0) return null;
    return tmin >= 0 ? tmin : tmax;
  }

  // --- camera ----------------------------------------------------------------

  const ISO_YAW = -Math.PI / 4;
  const ISO_PITCH = Math.asin(1 / Math.sqrt(3));

  function createCamera() {
    return {
      yaw: ISO_YAW,
      pitch: ISO_PITCH,
      distance: 150,
      target: [50, 0, 0],
    };
  }

  function orbit(camera, deltaYaw, deltaPitch) {
    camera.yaw += deltaYaw;
    camera.pitch += deltaPitch;
    const limit = Math.PI / 2 - 0.05;
    if (camera.pitch > limit) camera.pitch = limit;
    if (camera.pitch < -limit) camera.pitch = -limit;
    return camera;
  }

  function zoom(camera, delta) {
    camera.distance *= Math.pow(0.995, delta);
    if (camera.distance < MIN_DISTANCE) camera.distance = MIN_DISTANCE;
    if (camera.distance > MAX_DISTANCE) camera.distance = MAX_DISTANCE;
    return camera;
  }

  function pan(camera, deltaX, deltaY) {
    const scale = camera.distance * 0.0016;
    const cos = Math.cos(camera.yaw);
    const sin = Math.sin(camera.yaw);
    camera.target[0] += (deltaX * cos - deltaY * sin) * scale;
    camera.target[1] += deltaY * scale * 0.6;
    camera.target[2] += (deltaX * sin + deltaY * cos) * scale;
    return camera;
  }

  function resetCamera(camera) {
    const fresh = createCamera();
    camera.yaw = fresh.yaw;
    camera.pitch = fresh.pitch;
    camera.distance = fresh.distance;
    camera.target = fresh.target.slice();
    return camera;
  }

  function cameraEye(camera) {
    const cosPitch = Math.cos(camera.pitch);
    return [
      camera.target[0] + camera.distance * cosPitch * Math.sin(camera.yaw),
      camera.target[1] + camera.distance * Math.sin(camera.pitch),
      camera.target[2] + camera.distance * cosPitch * Math.cos(camera.yaw),
    ];
  }

  function cameraDirection(camera) {
    const cosPitch = Math.cos(camera.pitch);
    return [
      cosPitch * Math.sin(camera.yaw),
      Math.sin(camera.pitch),
      cosPitch * Math.cos(camera.yaw),
    ];
  }

  function cameraRay(camera, ndcX, ndcY, aspect) {
    const dir = cameraDirection(camera);
    const worldUp = [0, 1, 0];
    let rx = worldUp[1] * dir[2] - worldUp[2] * dir[1];
    let ry = worldUp[2] * dir[0] - worldUp[0] * dir[2];
    let rz = worldUp[0] * dir[1] - worldUp[1] * dir[0];
    const rlen = Math.hypot(rx, ry, rz) || 1;
    rx /= rlen; ry /= rlen; rz /= rlen;
    const ux = dir[1] * rz - dir[2] * ry;
    const uy = dir[2] * rx - dir[0] * rz;
    const uz = dir[0] * ry - dir[1] * rx;
    const halfHeight = camera.distance * 0.1;
    const halfWidth = halfHeight * (aspect > 0 ? aspect : 1);
    const origin = [
      camera.target[0] + rx * ndcX * halfWidth + ux * ndcY * halfHeight + dir[0] * camera.distance,
      camera.target[1] + ry * ndcX * halfWidth + uy * ndcY * halfHeight + dir[1] * camera.distance,
      camera.target[2] + rz * ndcX * halfWidth + uz * ndcY * halfHeight + dir[2] * camera.distance,
    ];
    return {origin: origin, direction: [-dir[0], -dir[1], -dir[2]]};
  }

  function viewProjection(camera, aspect) {
    const eye = cameraEye(camera);
    const view = mat4.lookAt(new Float32Array(16), eye, camera.target, [0, 1, 0]);
    const halfHeight = camera.distance * 0.1;
    const halfWidth = halfHeight * (aspect > 0 ? aspect : 1);
    const projection = mat4.orthographic(
      new Float32Array(16), -halfWidth, halfWidth, -halfHeight, halfHeight, -2000, 2000);
    return mat4.multiply(new Float32Array(16), projection, view);
  }

  function frameLayout(camera, layout, aspect) {
    const bounds = layout.bounds;
    camera.target = [
      (bounds.minX + bounds.maxX) / 2,
      (bounds.minY + bounds.maxY) / 2,
      (bounds.minZ + bounds.maxZ) / 2,
    ];

    const corners = [];
    [bounds.minX, bounds.maxX].forEach(function (x) {
      [bounds.minY, bounds.maxY].forEach(function (y) {
        [bounds.minZ, bounds.maxZ].forEach(function (z) { corners.push([x, y, z]); });
      });
    });

    const ratio = aspect > 0 ? aspect : 1;
    const spanX = Math.max(1, bounds.maxX - bounds.minX);
    const spanY = Math.max(1, bounds.maxY - bounds.minY);
    const spanZ = Math.max(1, bounds.maxZ - bounds.minZ);
    let distance = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE,
      Math.sqrt(spanX * spanX + spanY * spanY + spanZ * spanZ) / 2 * 2.1));

    for (let round = 0; round < 6; round++) {
      camera.distance = distance;
      const mvp = viewProjection(camera, ratio);
      let extent = 0;
      corners.forEach(function (corner) {
        const projected = mat4.project(mvp, corner);
        if (!projected.visible) return;
        extent = Math.max(extent, Math.abs(projected.x), Math.abs(projected.y));
      });
      if (!extent) break;
      const scale = extent / FRAME_FILL;
      if (Math.abs(scale - 1) < 0.01) break;
      distance = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, distance * scale));
    }
    camera.distance = distance;
    return camera;
  }

  // --- geometry primitives ---------------------------------------------------

  function faceTone(normal) {
    if (normal[1] > 0.5) return 1.0;      // top face catches the light
    if (normal[1] < -0.5) return 0.60;    // underside stays dark
    if (normal[2] > 0.5) return 0.90;     // front face
    if (normal[2] < -0.5) return 0.72;    // back face
    return 0.80;                          // side faces
  }

  function toneColor(color, tone) {
    return [
      Math.min(1, color[0] * tone),
      Math.min(1, color[1] * tone),
      Math.min(1, color[2] * tone),
    ];
  }

  function mixColor(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
  }

  function pushTriangles(out, a, b, c, color) {
    [a, b, c].forEach(function (point) {
      out.positions.push(point[0], point[1], point[2]);
      out.colors.push(color[0], color[1], color[2]);
    });
  }

  function pushLine(out, a, b, color) {
    [a, b].forEach(function (point) {
      out.positions.push(point[0], point[1], point[2]);
      out.colors.push(color[0], color[1], color[2]);
    });
  }

  function cuboidCorners(x0, x1, y0, y1, z0, z1) {
    return [
      [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
      [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
    ];
  }

  function buildCuboid(x0, x1, y0, y1, z0, z1, baseColor) {
    const out = {positions: [], colors: []};
    const corners = cuboidCorners(x0, x1, y0, y1, z0, z1);
    const faces = [
      {ids: [3, 2, 6, 7], normal: [0, 1, 0]},
      {ids: [0, 1, 2, 3], normal: [0, 0, -1]},
      {ids: [4, 5, 6, 7], normal: [0, 0, 1]},
      {ids: [0, 3, 7, 4], normal: [-1, 0, 0]},
      {ids: [1, 2, 6, 5], normal: [1, 0, 0]},
      {ids: [0, 1, 5, 4], normal: [0, -1, 0]},
    ];
    faces.forEach(function (face) {
      const color = toneColor(baseColor, faceTone(face.normal));
      pushTriangles(out, corners[face.ids[0]], corners[face.ids[1]], corners[face.ids[2]], color);
      pushTriangles(out, corners[face.ids[0]], corners[face.ids[2]], corners[face.ids[3]], color);
    });
    return out;
  }

  function buildCuboidEdges(x0, x1, y0, y1, z0, z1, edgeColor, scaleOut) {
    const out = {positions: [], colors: []};
    const corners = cuboidCorners(x0, x1, y0, y1, z0, z1);
    const factor = scaleOut || 1.04;
    const centre = [0, 0, 0];
    corners.forEach(function (corner) {
      centre[0] += corner[0] / 8;
      centre[1] += corner[1] / 8;
      centre[2] += corner[2] / 8;
    });
    const pushed = corners.map(function (corner) {
      return [
        centre[0] + (corner[0] - centre[0]) * factor,
        centre[1] + (corner[1] - centre[1]) * factor,
        centre[2] + (corner[2] - centre[2]) * factor,
      ];
    });
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];
    edges.forEach(function (edge) {
      pushLine(out, pushed[edge[0]], pushed[edge[1]], edgeColor);
    });
    return out;
  }

  /** A block with three-tone flat shading (36 vertices). */
  function buildBlock(box) {
    return buildCuboid(
      box.x0, box.x0 + BLOCK_SIZE,
      box.y + BLOCK_Y, box.y + BLOCK_Y + BLOCK_SIZE * 0.8,
      box.z, box.z + BLOCK_SIZE,
      box.color
    );
  }

  /** Twelve outline edges around a block (24 vertices). */
  function buildBlockEdges(box, palette) {
    const pal = palette || PALETTE;
    return buildCuboidEdges(
      box.x0, box.x0 + BLOCK_SIZE,
      box.y + BLOCK_Y, box.y + BLOCK_Y + BLOCK_SIZE * 0.8,
      box.z, box.z + BLOCK_SIZE,
      pal.outline, 1.04
    );
  }

  function cableCurvePoint(box, t, riseOverride) {
    const span = Math.max(1, box.x1 - box.x0);
    const rise = riseOverride === undefined ? Math.max(3.6, Math.min(11.5, span * 0.25)) : riseOverride;
    const start = [box.x0 + BLOCK_SIZE * 0.5, box.y + BLOCK_Y + BLOCK_SIZE * 0.55, box.z + BLOCK_SIZE * 0.5];
    const end = [Math.max(box.x0 + BLOCK_SIZE * 0.65, box.x1), box.y + BLOCK_Y + BLOCK_SIZE * 0.55, box.z + BLOCK_SIZE * 0.5];
    const control = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2 + rise, start[2]];
    const u = 1 - t;
    return [
      u * u * start[0] + 2 * u * t * control[0] + t * t * end[0],
      u * u * start[1] + 2 * u * t * control[1] + t * t * end[1],
      u * u * start[2] + 2 * u * t * control[2] + t * t * end[2],
    ];
  }

  /**
   * A parabolic 3D fiber-optic cable from the job's start to its end, arcing above the row.
   */
  function buildCable(box, options) {
    const opts = options || {};
    const segments = opts.segments || 36;
    const sides = opts.sides || 12;
    const radius = opts.radius || 0.64;
    const span = Math.max(1, box.x1 - box.x0);
    const rise = opts.rise === undefined ? Math.max(3.6, Math.min(11.5, span * 0.25)) : opts.rise;
    const out = {positions: [], colors: []};

    function pointAt(t) {
      const start = [box.x0, box.y + BLOCK_Y + BLOCK_SIZE * 0.4, box.z + BLOCK_SIZE / 2];
      const end = [box.x1, box.y + BLOCK_Y + BLOCK_SIZE * 0.4, box.z + BLOCK_SIZE / 2];
      const control = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2 + rise, start[2]];
      const u = 1 - t;
      return [
        u * u * start[0] + 2 * u * t * control[0] + t * t * end[0],
        u * u * start[1] + 2 * u * t * control[1] + t * t * end[1],
        u * u * start[2] + 2 * u * t * control[2] + t * t * end[2],
      ];
    }

    const rings = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = pointAt(t);
      const before = pointAt(Math.max(0, t - 0.01));
      const after = pointAt(Math.min(1, t + 0.01));
      let tx = after[0] - before[0];
      let ty = after[1] - before[1];
      let tz = after[2] - before[2];
      const length = Math.hypot(tx, ty, tz) || 1;
      tx /= length; ty /= length; tz /= length;
      const reference = Math.abs(ty) > 0.95 ? [1, 0, 0] : [0, 1, 0];
      let nx = reference[1] * tz - reference[2] * ty;
      let ny = reference[2] * tx - reference[0] * tz;
      let nz = reference[0] * ty - reference[1] * tx;
      const nlen = Math.hypot(nx, ny, nz) || 1;
      nx /= nlen; ny /= nlen; nz /= nlen;
      const bx = ty * nz - tz * ny;
      const by = tz * nx - tx * nz;
      const bz = tx * ny - ty * nx;
      const taper = 0.85 + 0.25 * Math.sin(t * Math.PI);
      const r = radius * taper;
      const ring = [];
      for (let s = 0; s < sides; s++) {
        const angle = (s / sides) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = nx * cos + bx * sin;
        const dy = ny * cos + by * sin;
        const dz = nz * cos + bz * sin;
        ring.push({
          point: [point[0] + dx * r, point[1] + dy * r, point[2] + dz * r],
          normal: [dx, dy, dz],
        });
      }
      rings.push(ring);
    }

    for (let i = 0; i < rings.length - 1; i++) {
      const a = rings[i];
      const b = rings[i + 1];
      const archCrown = Math.sin((i / Math.max(1, rings.length - 1)) * Math.PI);
      for (let s = 0; s < sides; s++) {
        const next = (s + 1) % sides;
        const p0 = a[s], p1 = a[next], p2 = b[next], p3 = b[s];
        const up = (p0.normal[1] + p2.normal[1]) / 2;
        const front = (p0.normal[2] + p2.normal[2]) / 2;
        const spec = up > 0.55 ? 0.18 * archCrown : 0;
        const tone = 0.72 + 0.26 * (up * 0.5 + 0.5) + 0.08 * (front * 0.5 + 0.5) + spec;
        const color = toneColor(box.color, tone);
        pushTriangles(out, p0.point, p1.point, p2.point, color);
        pushTriangles(out, p0.point, p2.point, p3.point, color);
      }
    }
    return out;
  }

  /** The main structural slab a repository sits on. */
  function buildPlatform(plane, bounds, palette) {
    const pal = palette || PALETTE;
    const out = {positions: [], colors: []};
    const x0 = bounds.minX - 5;
    const x1 = bounds.maxX + 5;
    const z0 = plane.z - 1.8;
    const z1 = plane.z + PLANE_DEPTH * 0.68;
    merge(out, buildCuboid(x0, x1, PLATFORM_TOP - PLATFORM_DEPTH_DOWN, PLATFORM_TOP, z0, z1, pal.platform));
    return out;
  }

  /**
   * Rich 3D Server Deck Architecture for the live viewer:
   * - Main base deck + dark lower chassis + front accent bar + left header pylon
   * - Cantilevered Runner Compute Blades for multi-runner repositories (rowInRepo > 0)
   *   supported by 3D vertical structural columns!
   */
  function buildDeckArchitecture(layout, palette) {
    const pal = palette || PALETTE;
    const solid = {positions: [], colors: []};
    const outlines = {positions: [], colors: []};
    const bounds = layout.bounds;
    const x0 = bounds.minX - 5;
    const x1 = bounds.maxX + 5;

    layout.planes.forEach(function (plane, planeIdx) {
      const z0 = plane.z - 1.8;
      const z1 = plane.z + PLANE_DEPTH * 0.68;
      // 1. Main top deck slab
      merge(solid, buildCuboid(x0, x1, -0.55, PLATFORM_TOP, z0, z1, pal.platform));
      // 2. Deep dark sub-chassis
      merge(solid, buildCuboid(x0 + 0.6, x1 - 0.6, -PLATFORM_DEPTH_DOWN, -0.55, z0 + 0.4, z1 - 0.4, pal.platformEdge));
      // 3. Left repository header block (server rack identification module)
      const headerCol = mixColor(pal.platform, pal.platformRim || pal.grid, 0.45);
      merge(solid, buildCuboid(x0 - 2.6, x0 - 0.2, -0.8, 0.65, z0 + 0.2, z0 + 5.2, headerCol));
      // Glowing status strip on the header module
      const stripCol = planeIdx % 2 === 0 ? (pal.nowLine || [0.22, 0.74, 0.97]) : (pal.highlight || [0.2, 0.9, 0.7]);
      merge(solid, buildCuboid(x0 - 2.7, x0 - 2.4, -0.2, 0.45, z0 + 0.8, z0 + 4.6, stripCol));
      // 4. Crisp deck rim outline
      merge(outlines, buildCuboidEdges(x0, x1, -0.55, PLATFORM_TOP + 0.02, z0, z1, pal.platformRim || pal.grid, 1.001));
    });

    // 5. Elevated Cantilevered Runner Compute Blades (when a repo has multiple runners)
    layout.rows.forEach(function (row) {
      const rowY = (row.rowInRepo || 0) * ROW_HEIGHT;
      const laneZ0 = row.z - 0.55;
      const laneZ1 = row.z + BLOCK_SIZE + 0.55;
      const bladeCol = pal.blade || toneColor(pal.platform, 1.12);
      const pillarCol = pal.pillar || pal.platformRim || pal.grid;

      if (rowY > 0.1) {
        // Elevated cantilevered compute shelf for this runner tier
        merge(solid, buildCuboid(bounds.minX - 2.5, bounds.maxX + 2.5, rowY - 0.28, rowY + 0.02, laneZ0, laneZ1, bladeCol));
        merge(outlines, buildCuboidEdges(bounds.minX - 2.5, bounds.maxX + 2.5, rowY - 0.28, rowY + 0.02, laneZ0, laneZ1, pillarCol, 1.002));
        // Left & right structural rack support columns down to the main deck
        merge(solid, buildCuboid(bounds.minX - 2.2, bounds.minX - 1.3, 0, rowY - 0.28, row.z + 0.3, row.z + BLOCK_SIZE - 0.3, pillarCol));
        merge(solid, buildCuboid(bounds.maxX + 1.3, bounds.maxX + 2.2, 0, rowY - 0.28, row.z + 0.3, row.z + BLOCK_SIZE - 0.3, pillarCol));
      } else {
        // Base runner lane guide track embedded on the main deck
        merge(solid, buildCuboid(bounds.minX - 2.0, bounds.maxX + 2.0, 0.01, 0.07, laneZ0 + 0.2, laneZ1 - 0.2, bladeCol));
      }
    });

    // 6. Live "NOW" Playhead Marker Bar at X = 100 across all decks
    if (layout.planes.length > 0) {
      const minZ = layout.bounds.minZ - 1.8;
      const maxZ = layout.bounds.maxZ + PLANE_DEPTH * 0.68;
      const nowCol = pal.nowLine || [0.22, 0.74, 0.97];
      merge(solid, buildCuboid(99.75, 100.25, 0.02, 0.24, minZ, maxZ, nowCol));
      // Front timeline ruler bar
      const rulerZ = maxZ + 2.8;
      merge(solid, buildCuboid(bounds.minX - 4, bounds.maxX + 4, -0.35, 0.05, rulerZ - 0.4, rulerZ + 0.4, pal.platformRim || pal.grid));
      layout.ticks.forEach(function (tick) {
        const isNow = tick.label === 'NOW';
        const tickCol = isNow ? nowCol : (pal.platformRim || pal.grid);
        merge(solid, buildCuboid(tick.x - 0.25, tick.x + 0.25, -0.2, isNow ? 0.55 : 0.28, rulerZ - 0.6, rulerZ + 0.6, tickCol));
      });
    }

    return {solid: solid, outlines: outlines};
  }

  /**
   * Build rich 3D Job Execution Hardware:
   * - Base shadow & glowing runner-lane conduit rail
   * - Start Terminal Pod + Top Status Beacon Cap
   * - End Terminal Pod + Top Status Beacon Cap
   * - 3D Octahedral/Diamond Energy Pulse Packets along the fiber arch
   * - Focus highlight frame when hovered/selected
   */
  function buildJobHardware(box, pal, isFocus, timeSec) {
    const solid = {positions: [], colors: []};
    const outlines = {positions: [], colors: []};
    const yBase = box.y;

    // 1. Deck shadow pad & glowing duration rail along the compute blade
    const xEnd = Math.max(box.x0 + BLOCK_SIZE + 0.8, box.x1 + BLOCK_SIZE * 0.5);
    merge(solid, buildCuboid(box.x0 - 0.2, xEnd, yBase + 0.04, yBase + 0.11, box.z - 0.2, box.z + BLOCK_SIZE + 0.2, pal.shadow));

    // Raised glowing conduit rail connecting start and end pods
    const railCol = isFocus ? (pal.highlight || box.color) : toneColor(box.color, 0.82);
    merge(solid, buildCuboid(box.x0, Math.max(box.x0 + BLOCK_SIZE, box.x1), yBase + 0.11, yBase + 0.26, box.z + BLOCK_SIZE * 0.32, box.z + BLOCK_SIZE * 0.68, railCol));

    // 2. Start Terminal Pod (base block + upper beacon cap)
    merge(solid, buildBlock(box));
    const capInset = 0.36;
    const capCol = toneColor(box.color, 1.22);
    merge(solid, buildCuboid(
      box.x0 + capInset, box.x0 + BLOCK_SIZE - capInset,
      yBase + BLOCK_Y + BLOCK_SIZE * 0.8, yBase + BLOCK_Y + BLOCK_SIZE * 0.98,
      box.z + capInset, box.z + BLOCK_SIZE - capInset,
      capCol
    ));
    const edgePalette = isFocus ? {outline: pal.highlight || capCol} : pal;
    merge(outlines, buildBlockEdges(box, edgePalette));

    // 3. End Terminal Pod
    const endSize = BLOCK_SIZE * 0.78;
    const endOffset = (BLOCK_SIZE - endSize) / 2;
    const ex0 = Math.max(box.x0 + BLOCK_SIZE * 0.65, box.x1 - endSize * 0.5);
    const ex1 = ex0 + endSize;
    const ey0 = yBase + BLOCK_Y;
    const ey1 = yBase + BLOCK_Y + endSize * 0.82;
    const ez0 = box.z + endOffset;
    const ez1 = ez0 + endSize;
    merge(solid, buildCuboid(ex0, ex1, ey0, ey1, ez0, ez1, box.color));
    merge(solid, buildCuboid(ex0 + 0.25, ex1 - 0.25, ey1, ey1 + 0.26, ez0 + 0.25, ez1 - 0.25, capCol));
    merge(outlines, buildCuboidEdges(ex0, ex1, ey0, ey1, ez0, ez1, edgePalette.outline, 1.04));

    // 4. 3D Parabolic Fiber Optic Cable
    merge(solid, buildCable(box, {
      segments: 38,
      sides: 14,
      radius: isFocus ? 0.84 : 0.64,
    }));

    // 5. 3D Data Pulse Packets along the cable arch
    const isRunning = box.status === 'in_progress' || box.conclusion === 'in_progress';
    const pulseCount = isRunning ? 3 : 2;
    const phase = isRunning && Number.isFinite(timeSec) ? (timeSec * 0.45) % 1 : 0.25;
    const pulseCol = mixColor(box.color, [1, 1, 1], isRunning ? 0.55 : 0.35);
    const pSize = isFocus ? 0.56 : 0.42;

    for (let p = 0; p < pulseCount; p++) {
      const t = ((p / pulseCount) + phase) % 1;
      if (t < 0.08 || t > 0.92) continue;
      const pt = cableCurvePoint(box, t);
      merge(solid, buildCuboid(
        pt[0] - pSize, pt[0] + pSize,
        pt[1] - pSize, pt[1] + pSize,
        pt[2] - pSize, pt[2] + pSize,
        pulseCol
      ));
    }

    // 6. Focus Selection Halo & Apex Drop-Line when hovered/selected
    if (isFocus) {
      const haloCol = pal.highlight || [0.22, 0.96, 0.74];
      merge(outlines, buildCuboidEdges(
        box.x0 - 0.4, Math.max(ex1, box.x1) + 0.4,
        yBase + 0.05, yBase + 0.32,
        box.z - 0.4, box.z + BLOCK_SIZE + 0.4,
        haloCol, 1.01
      ));
      const apex = cableCurvePoint(box, 0.5);
      pushLine(outlines, [apex[0], apex[1], apex[2]], [apex[0], yBase + 0.15, apex[2]], haloCol);
    }

    return {solid: solid, outlines: outlines};
  }

  /** The isometric ground grid: one line per runner row and per time tick. */
  function buildGrid(layout, palette) {
    const pal = palette || PALETTE;
    const out = {positions: [], colors: []};
    const maxZ = layout.bounds.maxZ + PLANE_DEPTH;
    layout.planes.forEach(function (plane) {
      pushLine(out,
        [layout.bounds.minX, PLATFORM_TOP + GRID_Y, plane.z],
        [layout.bounds.maxX, PLATFORM_TOP + GRID_Y, plane.z], pal.grid);
    });
    layout.ticks.forEach(function (tick) {
      pushLine(out,
        [tick.x, PLATFORM_TOP + GRID_Y, layout.bounds.minZ],
        [tick.x, PLATFORM_TOP + GRID_Y, maxZ], pal.grid);
    });
    layout.rows.forEach(function (row) {
      pushLine(out,
        [layout.bounds.minX, PLATFORM_TOP + GRID_Y + 0.02, row.z + PLANE_DEPTH * 0.37],
        [layout.bounds.maxX, PLATFORM_TOP + GRID_Y + 0.02, row.z + PLANE_DEPTH * 0.37], pal.grid);
    });
    return out;
  }

  /** Faint circuit-trace artwork behind the data. */
  function buildTraces(layout, palette) {
    const pal = palette || PALETTE;
    const out = {positions: [], colors: []};
    const y = PLATFORM_TOP - 0.05;
    const x0 = layout.bounds.minX - 26;
    const x1 = layout.bounds.maxX + 26;
    const z0 = layout.bounds.minZ - 30;
    const z1 = layout.bounds.maxZ + PLANE_DEPTH * 1.5;
    const stepX = 9;
    const stepZ = 7;
    let seed = 7;
    function random() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    }
    for (let gx = x0; gx < x1; gx += stepX) {
      for (let gz = z0; gz < z1; gz += stepZ) {
        if (random() > 0.34) continue;
        const turns = 2 + Math.floor(random() * 2);
        let cx = gx + random() * 4;
        let cz = gz + random() * 3;
        const points = [[cx, y, cz]];
        let alongX = random() > 0.5;
        for (let t = 0; t < turns; t++) {
          const run = 3 + random() * 6;
          if (alongX) cx += run; else cz += run;
          points.push([cx, y, cz]);
          alongX = !alongX;
        }
        for (let i = 0; i < points.length - 1; i++) {
          pushLine(out, points[i], points[i + 1], pal.trace);
        }
        const first = points[0];
        const last = points[points.length - 1];
        pushLine(out, [first[0] - 0.9, first[1], first[2]], [first[0] + 0.9, first[1], first[2]], pal.trace);
        pushLine(out, [first[0], first[1], first[2] - 0.9], [first[0], first[1], first[2] + 0.9], pal.trace);
        pushLine(out, [last[0] - 0.9, last[1], last[2]], [last[0] + 0.9, last[1], last[2]], pal.trace);
        pushLine(out, [last[0], last[1], last[2] - 0.9], [last[0], last[1], last[2] + 0.9], pal.trace);
      }
    }
    return out;
  }

  // --- WebGL2 Shaders with Per-Pixel Derivative Lighting & Micro-Grid --------

  const VERTEX_SHADER = [
    '#version 300 es',
    'in vec3 aPosition;',
    'in vec3 aColor;',
    'uniform mat4 uMVP;',
    'out vec3 vColor;',
    'out vec3 vWorldPos;',
    'out vec2 vNdc;',
    'void main() {',
    '  vColor = aColor;',
    '  vWorldPos = aPosition;',
    '  vec4 clip = uMVP * vec4(aPosition, 1.0);',
    '  gl_Position = clip;',
    '  vNdc = clip.xy / max(0.0001, clip.w);',
    '}',
  ].join('\n');

  const FRAGMENT_SHADER = [
    '#version 300 es',
    'precision highp float;',
    'in vec3 vColor;',
    'in vec3 vWorldPos;',
    'in vec2 vNdc;',
    'out vec4 fragColor;',
    'void main() {',
    '  vec3 dx = dFdx(vWorldPos);',
    '  vec3 dy = dFdy(vWorldPos);',
    '  vec3 crossN = cross(dx, dy);',
    '  float nLen = length(crossN);',
    '  vec3 color = vColor;',
    '  if (nLen > 1e-6) {',
    '    vec3 N = crossN / nLen;',
    '    if (N.y < 0.0 && abs(N.x) < 0.2 && abs(N.z) < 0.2) N = -N;',
    '    vec3 keyDir = normalize(vec3(-0.42, 0.82, 0.38));',
    '    vec3 fillDir = normalize(vec3(0.65, 0.35, -0.65));',
    '    vec3 viewDir = normalize(vec3(-0.5, 0.65, 0.58));',
    '    float diffKey = max(0.0, dot(N, keyDir));',
    '    float diffFill = max(0.0, dot(N, fillDir));',
    '    vec3 H = normalize(keyDir + viewDir);',
    '    float spec = pow(max(0.0, dot(N, H)), 24.0);',
    '    float lighting = 0.66 + 0.32 * diffKey + 0.10 * diffFill;',
    '    color = vColor * lighting + vec3(0.11, 0.13, 0.16) * spec;',
    '    // Subtle precision engineering micro-grid on horizontal deck surfaces',
    '    if (abs(N.y) > 0.85 && vWorldPos.y >= -0.05 && vWorldPos.y <= 0.08) {',
    '      vec2 gridUV = abs(fract(vWorldPos.xz * 0.35 - 0.5) - 0.5) / fwidth(vWorldPos.xz * 0.35);',
    '      float line = min(gridUV.x, gridUV.y);',
    '      float gridFactor = 1.0 - smoothstep(0.0, 1.35, line);',
    '      color = mix(color, color * 1.16 + vec3(0.03, 0.05, 0.08), gridFactor * 0.32);',
    '    }',
    '  }',
    '  float dist = length(vNdc * vec2(0.82, 0.92));',
    '  float vignette = clamp(1.0 - dist * dist * 0.11, 0.84, 1.0);',
    '  fragColor = vec4(clamp(color * vignette, 0.0, 1.0), 1.0);',
    '}',
  ].join('\n');

  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('shader compile failed: ' + log);
    }
    return shader;
  }

  function link(gl, vertexSource, fragmentSource) {
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('program link failed: ' + gl.getProgramInfoLog(program));
    }
    return program;
  }

  function merge(target, source) {
    for (let i = 0; i < source.positions.length; i++) {
      target.positions.push(source.positions[i]);
    }
    for (let i = 0; i < source.colors.length; i++) {
      target.colors.push(source.colors[i]);
    }
    return target;
  }

  /**
   * Build the interactive WebGL2 3D viewer. Returns null when WebGL2 is unavailable.
   */
  function createViewer(canvas, options) {
    const opts = options || {};
    if (!canvas || typeof canvas.getContext !== 'function') return null;
    const gl = canvas.getContext('webgl2', {antialias: true, alpha: false});
    if (!gl) return null;

    let program;
    let triBuffer;
    let triColorBuffer;
    let lineBuffer;
    let lineColorBuffer;
    let positionLocation;
    let colorLocation;
    let mvpLocation;
    try {
      program = link(gl, VERTEX_SHADER, FRAGMENT_SHADER);
      triBuffer = gl.createBuffer();
      triColorBuffer = gl.createBuffer();
      lineBuffer = gl.createBuffer();
      lineColorBuffer = gl.createBuffer();
      positionLocation = gl.getAttribLocation(program, 'aPosition');
      colorLocation = gl.getAttribLocation(program, 'aColor');
      mvpLocation = gl.getUniformLocation(program, 'uMVP');
    } catch (error) {
      return null;
    }

    const camera = createCamera();
    let currentThemeName = opts.theme && THEMES[opts.theme] ? opts.theme : 'light';
    let currentWindowMs = Number.isFinite(opts.windowMs) && opts.windowMs > 0 ? opts.windowMs : 60 * MINUTE;
    let rawJobsList = [];
    let lastNowMs = Date.now();
    let layout = buildLayout([], {now: lastNowMs, windowMs: currentWindowMs});
    let triangles = {positions: [], colors: [], count: 0};
    let lines = {positions: [], colors: [], count: 0};
    let backgroundLineCount = 0;
    let hovered = null;
    let selected = null;
    let autoOrbit = false;
    let animFrame = null;
    let cameraTween = null;
    let disposed = false;
    const listeners = {hover: [], select: [], camera: []};

    function activeTheme() {
      return THEMES[currentThemeName] || THEMES.light;
    }

    function notify(name, payload) {
      if (!listeners[name]) return;
      listeners[name].forEach(function (handler) {
        try { handler(payload); } catch (error) { /* ignore listener errors */ }
      });
    }

    function upload(target, buffer, colors, values) {
      target.count = values.positions.length / 3;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values.positions), gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, colors);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values.colors), gl.DYNAMIC_DRAW);
    }

    function buildScene(timeSec) {
      const theme = activeTheme();
      const pal = theme.palette;
      const cols = theme.colors;
      const solid = {positions: [], colors: [], count: 0};
      const outlines = {positions: [], colors: [], count: 0};
      const traceLines = buildTraces(layout, pal);
      const gridLines = buildGrid(layout, pal);

      const deckArch = buildDeckArchitecture(layout, pal);
      merge(solid, deckArch.solid);
      merge(outlines, deckArch.outlines);

      layout.boxes.forEach(function (box) {
        const isFocus = (hovered && hovered.key === box.key) || (selected && selected.key === box.key);
        const baseCol = colorFor(box.conclusion, box.status, cols);
        const activeCol = isFocus ? toneColor(baseCol, 1.2) : baseCol;
        const themedBox = Object.assign({}, box, {
          color: activeCol,
        });
        const hw = buildJobHardware(themedBox, pal, isFocus, timeSec || 0);
        merge(solid, hw.solid);
        merge(outlines, hw.outlines);
      });

      const allLines = {
        positions: traceLines.positions.concat(gridLines.positions, outlines.positions),
        colors: traceLines.colors.concat(gridLines.colors, outlines.colors),
        count: 0,
      };
      upload(solid, triBuffer, triColorBuffer, solid);
      upload(allLines, lineBuffer, lineColorBuffer, allLines);
      triangles = solid;
      lines = allLines;
      backgroundLineCount = (traceLines.positions.length + gridLines.positions.length) / 3;
    }

    function currentAspect() {
      const width = canvas.clientWidth || canvas.width || 1;
      const height = canvas.clientHeight || canvas.height || 1;
      return height > 0 ? width / height : 1;
    }

    function resize() {
      const ratio = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2);
      const width = Math.max(1, Math.floor((canvas.clientWidth || canvas.width || 1) * ratio));
      const height = Math.max(1, Math.floor((canvas.clientHeight || canvas.height || 1) * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function bindAttributes(buffer, colors) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, colors);
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
    }

    function draw() {
      if (disposed) return;
      const pal = activeTheme().palette;
      resize();
      gl.clearColor(pal.ground[0], pal.ground[1], pal.ground[2], 1);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.BLEND);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const mvp = viewProjection(camera, currentAspect());
      gl.useProgram(program);
      gl.uniformMatrix4fv(mvpLocation, false, mvp);

      gl.depthMask(false);
      bindAttributes(lineBuffer, lineColorBuffer);
      gl.drawArrays(gl.LINES, 0, backgroundLineCount);
      gl.depthMask(true);

      bindAttributes(triBuffer, triColorBuffer);
      gl.drawArrays(gl.TRIANGLES, 0, triangles.count);

      bindAttributes(lineBuffer, lineColorBuffer);
      gl.drawArrays(gl.LINES, backgroundLineCount, lines.count - backgroundLineCount);
      notify('camera', camera);
    }

    function boxCandidateBounds(box) {
      const candidates = [
        // Start terminal pod
        {
          min: [box.x0 - 0.35, box.y + BLOCK_Y, box.z - 0.35],
          max: [box.x0 + BLOCK_SIZE + 0.35, box.y + BLOCK_Y + BLOCK_SIZE * 1.05, box.z + BLOCK_SIZE + 0.35],
        },
        // End terminal + deck track
        {
          min: [box.x0, box.y, box.z - 0.25],
          max: [box.x1 + BLOCK_SIZE * 0.55, box.y + BLOCK_Y + BLOCK_SIZE * 0.95, box.z + BLOCK_SIZE + 0.25],
        },
      ];
      // Sample points along the 3D cable arch so hovering any part of the arc hits the job
      for (let step = 1; step <= 7; step++) {
        const pt = cableCurvePoint(box, step / 8);
        candidates.push({
          min: [pt[0] - 1.5, pt[1] - 1.3, pt[2] - 1.3],
          max: [pt[0] + 1.5, pt[1] + 1.3, pt[2] + 1.3],
        });
      }
      return candidates;
    }

    function projectToScreen(point) {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || canvas.clientWidth || 1;
      const height = rect.height || canvas.clientHeight || 1;
      const aspect = height > 0 ? width / height : 1;
      const mvp = viewProjection(camera, aspect);
      const projected = mat4.project(mvp, point);
      if (!projected.visible) return null;
      return {
        x: (projected.x * 0.5 + 0.5) * width,
        y: (0.5 - projected.y * 0.5) * height,
        z: projected.z,
        visible: projected.x >= -1 && projected.x <= 1 && projected.y >= -1 && projected.y <= 1,
      };
    }

    function pickAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = 1 - ((clientY - rect.top) / rect.height) * 2;
      const aspect = rect.height > 0 ? rect.width / rect.height : 1;
      const ray = cameraRay(camera, ndcX, ndcY, aspect);
      const origin = ray.origin;
      const direction = ray.direction;
      let best = null;
      let bestDistance = Infinity;
      layout.boxes.forEach(function (box) {
        const boundsList = boxCandidateBounds(box);
        for (let i = 0; i < boundsList.length; i++) {
          const hit = rayBox(origin, direction, boundsList[i]);
          if (hit !== null && hit < bestDistance) {
            bestDistance = hit;
            best = box;
          }
        }
      });
      return best;
    }

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let moved = 0;
    const activePointers = new Map();
    let lastPinchDist = 0;
    let lastPinchMidX = 0;
    let lastPinchMidY = 0;

    function ensureLoop() {
      if (disposed || animFrame) return;
      if (!autoOrbit && !cameraTween) return;
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        animFrame = window.requestAnimationFrame(stepLoop);
      }
    }

    function stepLoop(timestamp) {
      animFrame = null;
      if (disposed) return;
      let needsDraw = false;
      if (cameraTween) {
        const elapsed = Math.min(1, (timestamp - cameraTween.startMs) / cameraTween.durationMs);
        const ease = 1 - Math.pow(1 - elapsed, 3);
        camera.yaw = cameraTween.fromYaw + (cameraTween.toYaw - cameraTween.fromYaw) * ease;
        camera.pitch = cameraTween.fromPitch + (cameraTween.toPitch - cameraTween.fromPitch) * ease;
        camera.distance = cameraTween.fromDist + (cameraTween.toDist - cameraTween.fromDist) * ease;
        camera.target[0] = cameraTween.fromTarget[0] + (cameraTween.toTarget[0] - cameraTween.fromTarget[0]) * ease;
        camera.target[1] = cameraTween.fromTarget[1] + (cameraTween.toTarget[1] - cameraTween.fromTarget[1]) * ease;
        camera.target[2] = cameraTween.fromTarget[2] + (cameraTween.toTarget[2] - cameraTween.fromTarget[2]) * ease;
        if (elapsed >= 1) cameraTween = null;
        needsDraw = true;
      } else if (autoOrbit && !dragging && !hovered) {
        orbit(camera, 0.0035, 0);
        buildScene((timestamp || 0) * 0.001);
        needsDraw = true;
      }
      if (needsDraw) draw();
      ensureLoop();
    }

    function setAutoOrbit(enabled) {
      autoOrbit = Boolean(enabled);
      if (autoOrbit) {
        ensureLoop();
      } else if (!cameraTween && animFrame && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(animFrame);
        animFrame = null;
      }
      return autoOrbit;
    }

    function setPreset(preset) {
      const targetCam = createCamera();
      frameLayout(targetCam, layout, currentAspect());
      if (preset === 'top') {
        targetCam.yaw = 0;
        targetCam.pitch = Math.PI / 2 - 0.06;
      } else if (preset === 'front') {
        targetCam.yaw = 0;
        targetCam.pitch = 0.18;
      } else if (preset === 'side') {
        targetCam.yaw = -Math.PI / 2 + 0.08;
        targetCam.pitch = 0.28;
      } else {
        targetCam.yaw = ISO_YAW;
        targetCam.pitch = ISO_PITCH;
      }
      if (typeof window !== 'undefined' && typeof window.performance !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        cameraTween = {
          startMs: window.performance.now(),
          durationMs: 360,
          fromYaw: camera.yaw,
          toYaw: targetCam.yaw,
          fromPitch: camera.pitch,
          toPitch: targetCam.pitch,
          fromDist: camera.distance,
          toDist: targetCam.distance,
          fromTarget: camera.target.slice(),
          toTarget: targetCam.target.slice(),
        };
        ensureLoop();
      } else {
        camera.yaw = targetCam.yaw;
        camera.pitch = targetCam.pitch;
        camera.distance = targetCam.distance;
        camera.target = targetCam.target.slice();
      }
      draw();
    }

    function onPointerDown(event) {
      const pid = event.pointerId !== undefined ? event.pointerId : 0;
      activePointers.set(pid, {x: event.clientX, y: event.clientY});
      dragging = true;
      cameraTween = null;
      if (activePointers.size === 1) {
        moved = 0;
        lastX = event.clientX;
        lastY = event.clientY;
      } else if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        lastPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        lastPinchMidX = (pts[0].x + pts[1].x) * 0.5;
        lastPinchMidY = (pts[0].y + pts[1].y) * 0.5;
        moved = 99;
      }
      canvas.setPointerCapture && canvas.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event) {
      const pid = event.pointerId !== undefined ? event.pointerId : 0;
      if (activePointers.has(pid)) {
        activePointers.set(pid, {x: event.clientX, y: event.clientY});
      }
      if (dragging) {
        if (activePointers.size >= 2) {
          const pts = Array.from(activePointers.values());
          const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
          const midX = (pts[0].x + pts[1].x) * 0.5;
          const midY = (pts[0].y + pts[1].y) * 0.5;
          if (lastPinchDist > 0) {
            zoom(camera, (lastPinchDist - dist) * 3.2);
            pan(camera, midX - lastPinchMidX, midY - lastPinchMidY);
          }
          lastPinchDist = dist;
          lastPinchMidX = midX;
          lastPinchMidY = midY;
          draw();
          return;
        }
        const deltaX = event.clientX - lastX;
        const deltaY = event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;
        moved += Math.abs(deltaX) + Math.abs(deltaY);
        if (event.shiftKey) pan(camera, deltaX, deltaY);
        else orbit(camera, deltaX * 0.006, -deltaY * 0.006);
        draw();
        return;
      }
      const hit = pickAt(event.clientX, event.clientY);
      const key = hit ? hit.key : null;
      if (key !== (hovered ? hovered.key : null)) {
        hovered = hit;
        canvas.style.cursor = hit ? 'pointer' : 'grab';
        buildScene();
        notify('hover', hit);
        draw();
      }
    }

    function onPointerUp(event) {
      const pid = event.pointerId !== undefined ? event.pointerId : 0;
      activePointers.delete(pid);
      canvas.releasePointerCapture && canvas.releasePointerCapture(event.pointerId);
      if (activePointers.size === 1) {
        const remaining = Array.from(activePointers.values())[0];
        lastX = remaining.x;
        lastY = remaining.y;
        lastPinchDist = 0;
        return;
      }
      if (!dragging) return;
      dragging = false;
      lastPinchDist = 0;
      if (moved < 8) {
        const hit = pickAt(event.clientX, event.clientY);
        selected = hit;
        buildScene();
        notify('select', hit);
        draw();
      }
    }

    function onWheel(event) {
      event.preventDefault();
      cameraTween = null;
      zoom(camera, event.deltaY);
      draw();
    }

    function onKeyDown(event) {
      const step = 0.12;
      cameraTween = null;
      if (event.key === 'ArrowLeft') orbit(camera, step, 0);
      else if (event.key === 'ArrowRight') orbit(camera, -step, 0);
      else if (event.key === 'ArrowUp') orbit(camera, 0, step);
      else if (event.key === 'ArrowDown') orbit(camera, 0, -step);
      else if (event.key === '+' || event.key === '=') zoom(camera, -120);
      else if (event.key === '-') zoom(camera, 120);
      else if (event.key === 'Home' || event.key === '0') resetCamera(camera);
      else return;
      event.preventDefault();
      draw();
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, {passive: false});
    canvas.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('mouseleave', function () {
      if (hovered) { hovered = null; buildScene(); notify('hover', null); draw(); }
    });

    buildScene();
    draw();

    return {
      camera: camera,
      getLayout: function () { return layout; },
      getTheme: function () { return currentThemeName; },
      setTheme: function (themeName) {
        if (THEMES[themeName]) {
          currentThemeName = themeName;
          buildScene();
          draw();
        }
      },
      setJobs: function (jobs, setOptions) {
        rawJobsList = Array.isArray(jobs) ? jobs : [];
        const optsWithWin = Object.assign({windowMs: currentWindowMs}, setOptions || {});
        if (optsWithWin.windowMs) currentWindowMs = optsWithWin.windowMs;
        if (Number.isFinite(optsWithWin.now)) lastNowMs = optsWithWin.now;
        layout = buildLayout(rawJobsList, optsWithWin);
        hovered = null;
        selected = null;
        frameLayout(camera, layout, currentAspect());
        buildScene();
        draw();
        notify('hover', null);
        notify('select', null);
      },
      setWindow: function (windowMs, nowOverride) {
        if (Number.isFinite(windowMs) && windowMs > 0) currentWindowMs = windowMs;
        if (Number.isFinite(nowOverride)) lastNowMs = nowOverride;
        layout = buildLayout(rawJobsList, {
          now: lastNowMs, windowMs: currentWindowMs,
        });
        frameLayout(camera, layout, currentAspect());
        buildScene();
        draw();
      },
      setPreset: setPreset,
      setAutoOrbit: setAutoOrbit,
      isAutoOrbit: function () { return autoOrbit; },
      reset: function () { cameraTween = null; resetCamera(camera); frameLayout(camera, layout, currentAspect()); draw(); },
      rotate: function (delta) { cameraTween = null; orbit(camera, delta, 0); draw(); },
      zoomBy: function (delta) { cameraTween = null; zoom(camera, delta); draw(); },
      draw: draw,
      pickAt: pickAt,
      projectToScreen: projectToScreen,
      on: function (name, handler) {
        if (listeners[name]) listeners[name].push(handler);
        return this;
      },
      dispose: function () {
        disposed = true;
        cameraTween = null;
        setAutoOrbit(false);
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerup', onPointerUp);
        canvas.removeEventListener('pointercancel', onPointerUp);
        canvas.removeEventListener('wheel', onWheel);
        canvas.removeEventListener('keydown', onKeyDown);
        gl.deleteBuffer(triBuffer);
        gl.deleteBuffer(triColorBuffer);
        gl.deleteBuffer(lineBuffer);
        gl.deleteBuffer(lineColorBuffer);
        gl.deleteProgram(program);
      },
    };
  }

  return {
    buildLayout: buildLayout,
    mat4: mat4,
    rayBox: rayBox,
    createCamera: createCamera,
    orbit: orbit,
    zoom: zoom,
    pan: pan,
    resetCamera: resetCamera,
    frameLayout: frameLayout,
    cameraEye: cameraEye,
    cameraDirection: cameraDirection,
    cameraRay: cameraRay,
    viewProjection: viewProjection,
    createViewer: createViewer,
    buildBlock: buildBlock,
    buildBlockEdges: buildBlockEdges,
    buildCable: buildCable,
    buildPlatform: buildPlatform,
    buildGrid: buildGrid,
    buildTraces: buildTraces,
    faceTone: faceTone,
    MIN_DISTANCE: MIN_DISTANCE,
    MAX_DISTANCE: MAX_DISTANCE,
    ISO_YAW: ISO_YAW,
    ISO_PITCH: ISO_PITCH,
    PALETTE: PALETTE,
    COLORS: COLORS,
    THEMES: THEMES,
  };
});
