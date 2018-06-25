var frames = [],
  shape = 'Square',
  trendx = 0,
  trendy = 0,
  vtx0 = 0,
  vty0 = 0,
  vtx1 = 0,
  vty1 = 0,
  vtleft = 0,
  vtoleft = 0,
  vtmode = 0,
  vtlefty = 0,
  vtolefty = 0,
  mdur = 8,
  mxdur = 11,
  mdurdy = 0,
  mxdurdy = 0,
  mrel = 0.25,
  mreldy = 0,
  mspx = 0.3,
  mspy = 0.3,
  fspace = 0.55,
  fsizex = 0.9,
  fsizedy = 0,
  fz = 0,
  ff = 0.05,
  speed = 0.08,
  nframes = 68,
  zoom = 1;
var mw, canvas = document.getElementById('canvas'),
  ctx = canvas.getContext('2d'),
  persp = 1;
var zfar = 0,
  thickness = 0.019,
  ambient = 55,
  lpx = 0,
  lpy = 0;

var lights = [] //[pos, len, r, g, b, []]
var dcut = 0.28,
  dstep = 0.95,
  dend = 7.5,
  dpeak = 0,
  ddist = 3.3;


var passages = [{
  intensity: 1,
  r: 1,
  g: 1,
  b: 1,
  cut: 0,
  step: 0,
  end: 0,
  peak: 0,
  cosStep: 1.45,
  cosPeak: 0,
  useCosine: true,
  idist: 5,
  dist: 0,
  quantity: 1,
  probability: 1,
  minlast: 0,
  lastdist: 0
}, {
  intensity: 1,
  r: 0.3,
  g: 1.5,
  b: 0.3,
  cut: 0,
  step: 0,
  end: 0,
  peak: 0,
  cosStep: 1.9,
  cosPeak: 0,
  useCosine: false,
  idist: 5,
  dist: 0,
  quantity: 1,
  probability: 0.15,
  minlast: 0,
  lastdist: 0
}, {
  intensity: 1,
  r: 0.3,
  g: 1.5,
  b: 1.5,
  cut: 0,
  step: 0,
  end: 0,
  peak: 0,
  cosStep: 1.9,
  cosPeak: 1,
  useCosine: false,
  idist: 5,
  dist: 0,
  quantity: 1,
  probability: 0.15,
  minlast: 0,
  lastdist: 0
}, {
  intensity: 1,
  r: 1.5,
  g: 1.5,
  b: 0.2,
  cut: 0,
  step: 0,
  end: 0,
  peak: 0,
  idist: 5,
  dist: 0,
  quantity: 1,
  probability: 0.15,
  minlast: 0,
  lastdist: 0,
  cosStep: 1.9,
  cosPeak: 1,
  useCosine: false
}]


var passageLights = [],
  globalLightOffset;
var skipFrames = 0;
var fdensity = 0.08;



function regenerateLights() {
  passageLights.length = 0;
  globalLightOffset = 0;

  for (var t = 0; t < passages.length; t++) {
    passageLights.push([-1, -1, passages[t].r, passages[t].g, passages[t].b]);

    if (!passages[t].useCosine)
      fillLightSpan(passageLights[passageLights.length - 1], passages[t].intensity, dcut + passages[t].cut, dstep + passages[t].step, dend + passages[t].end, dpeak + passages[t].peak);
    else
      fillLightSpanCos(passageLights[passageLights.length - 1], passages[t].intensity, passages[t].cosStep, passages[t].cosPeak);

    globalLightOffset = Math.max(globalLightOffset, passageLights[passageLights.length - 1][1]);
  }
  globalLightOffset = ((globalLightOffset - 1) / 2 | 0);
}


function spawnPassage(p, pl) {
  var t, fdist = 0,
    margin = Math.round((ddist + p.dist) / fspace),
    sep = Math.round(p.idist / fspace) + 1,
    first, last = first = -1 - globalLightOffset,
    evenlength = !(pl[1] % 2);
  last -= margin;

  for (t = 0; t < p.quantity; t++) {
    lights.push(pl.slice());
    lights[lights.length - 1][0] = last + ((pl[1] - 1) / 2 | 0);

    if (t < p.quantity - 1)
      last -= sep + (evenlength ? 1 : 0);
  }
  last -= margin + (evenlength ? 1 : 0);

  p.lastdist = 0;

  skipFrames = first - last;
}




function setSpeed() {
  rspeed = speed % (fspace - 0.02)
  rsteps = 1 + (speed / (fspace - 0.02)) | 0;
}

function fillLightSpan(light, intensity, cut, step, end, peak) {
  step *= fspace;
  peak = Math.round(peak / fspace);

  var t, ln = light.length;

  //push peak stuff now albeit
  for (t = 0; t < peak; t++) {
    light.push(intensity * (1 / Math.pow(cut, 2)));
  }
  for (t = cut + step; t < end; t += step) {
    light.splice(ln, 0, (intensity * (1 / (Math.pow(t, 2)))));
    light.push(light[ln]);
  }
  light[1] = light.length - ln;
}

function fillLightSpanCos(light, intensity, step, peak) {
  step *= fspace;
  peak = Math.round(peak / fspace);

  var t, ln = light.length;

  for (t = 0; t < peak; t++) {
    light.push(intensity);
  }
  for (t = 0; t <= Math.PI; t += step) {
    light.splice(ln, 0, intensity * (Math.cos(t) / 2 + 0.5));
    if (t)
      light.push(light[ln]);
  }
  light[1] = light.length - ln;
}

function setZoom() {
  ctx.setTransform(1, 0, 0, 1, innerWidth / 2, innerHeight / 2);
  ctx.scale(mw * zoom, mw * zoom);
}

function fogLinear(c, z) {
  if (z > fz) {
    return Math.min(c * Math.max((1 - ff * (z - fz)), 0) | 0, 255);
  } else return Math.min(c | 0, 255);
}

function fogExp2(c, z) {
  return c / (Math.exp(fdensity * fdensity * z * z)) | 0;
}
var fog = fogExp2;


function newTunnel() {
  var t, ndiv;

  trendx = trendy = vtx0 = vty0 = vtx1 = vty1 = vtleft = vtoleft = vtlefty = vtolefty = 0; //what a chain :o
  skipFrames = 0;

  mw = Math.max(innerWidth, innerHeight);
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  setZoom();

  frames.length = 0;
  for (t = 0; t < nframes; t++) {
    frames[t] = [0, 0, t * fspace];
  }

  setSpeed();

  regenerateLights();

  step(rspeed, true);
  for (var t = 0; t <= 2 * frames.length; t++)
    step(fspace, false);

  render();
}

function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

function step(speed) {
  if (!speed) return false;

  if (vtmode) {
    vtleft -= speed;
    if (vtleft < 0) {
      vtoleft = vtleft = mdur + ((mxdur - mdur + 1) * Math.random());

      vtx0 = vtx1;
      vtx1 = getRandomNumber(Math.max(vtx0 - mrel * fspace / 2, -mspx * fspace / 2), Math.min(vtx0 + mrel * fspace / 2, mspx * fspace / 2));
    }

    vtlefty -= speed;
    if (vtlefty < 0) {
      vtolefty = vtlefty = mdur + mdurdy + ((mxdur + mxdurdy - mdur - mdurdy + 1) * Math.random());

      vty0 = vty1;
      vty1 = getRandomNumber(Math.max(vty0 - (mrel + mreldy) * fspace / 2, -mspy * fspace / 2), Math.min(vty0 + (mrel + mreldy) * fspace / 2, mspy * fspace / 2));
    }
  } else {
    vtleft -= speed;

    if (vtleft < 0) {
      vtoleft = vtleft = mdur + ((mxdur - mdur + 1) * Math.random());
      vtx0 = vtx1;
      vty0 = vty1;

      while (true) {
        vtx1 = getRandomNumber(Math.max(-mspx * fspace / 2, vtx0 - mrel * fspace), Math.min(mspx * fspace / 2, vtx0 + mrel * fspace));
        vty1 = getRandomNumber(Math.max(-mspy * fspace / 2, vty0 - mrel * fspace), Math.min(mspy * fspace / 2, vty0 + mrel * fspace));

        if (Math.sqrt((vtx0 - vtx1) * (vtx0 - vtx1) + (vty0 - vty1) * (vty0 - vty1)) < mrel * fspace)
          break;
      }
    }
  }

  var t;

  for (t = 0; t < frames.length; t++)
    frames[t][2] -= speed;

  for (t = 0; t < passages.length; t++)
    passages[t].lastdist += speed;

  if (frames[0][2] < 0) {
    lpx = frames[0][0];
    lpy = frames[0][1];
    frames.push([trendx + (vtleft / vtoleft) * vtx0 + (1 - vtleft / vtoleft) * vtx1, trendy + (vtmode ? (vtlefty / vtolefty) : (vtleft / vtoleft)) * vty0 + (1 - ((vtmode ? (vtlefty / vtolefty) : (vtleft / vtoleft)))) * vty1, frames.length * fspace + frames[0][2]]);

    frames.shift();
    trendx = frames[frames.length - 1][0];
    trendy = frames[frames.length - 1][1];

    for (t = 0; t < lights.length; t++) {
      lights[t][0]++;
      if (lights[t][0] >= frames.length + lights[t][1] - 1)
        lights.splice(t--, 1);
    }

    if (!skipFrames) {
      while (true) {
        t = Math.random() * passages.length | 0;
        if (passages[t].lastdist < passages[t].minlast) continue;

        if (Math.random() < passages[t].probability) {
          spawnPassage(passages[t], passageLights[t]);
          break;
        }
      }
    }
    skipFrames--;
  }

  var tx, ty, progress;
  progress = (fspace - frames[0][2]) / fspace;
  tx = -(lpx * (1 - progress) + frames[0][0] * progress);
  ty = -(lpy * (1 - progress) + frames[0][1] * progress)

  for (t = 0; t < frames.length; t++) {
    frames[t][0] += tx;
    frames[t][1] += ty;
  }
  lpx += tx;
  lpy += ty;
  trendx += tx;
  trendy += ty;

}

function centerRect(x, y, w, h) {
  ctx.strokeRect(x - w / 2, y - h / 2, w, h);
}

function render() {
  ctx.fillRect(-0.5 / zoom, -0.5 / zoom, 1 / zoom, 1 / zoom);
  var t, cr, cg, cb, tt, lt, fl = frames.length - 1;
  var minsize, sizefact;
  if (shape == 'Circle') {
    minsize = Math.min(fsizex, fsizex + fsizedy);
    sizefact = (fsizex + fsizedy) / fsizex;
  }
  for (t = fl; t >= 0; t--) {
    if ((frames[t][2] + zfar) < 0) continue;
    cr = cg = cb = ambient;

    lt = fl - t;
    for (tt = 0; tt < lights.length && (lights[tt][0] - lt) >= 0; tt++) {
      if (lights[tt][0] - lt < lights[tt][1]) {
        //light here!
        cr += (255 - ambient) * lights[tt][2] * lights[tt][5 + (lights[tt][0] - lt)];
        cg += (255 - ambient) * lights[tt][3] * lights[tt][5 + (lights[tt][0] - lt)];
        cb += (255 - ambient) * lights[tt][4] * lights[tt][5 + (lights[tt][0] - lt)];
      }
    }

    ctx.strokeStyle = 'rgb(' + fog(cr, frames[t][2] + zfar) + ',' + fog(cg, frames[t][2] + zfar) + ',' + fog(cb, frames[t][2] + zfar) + ')';
    ctx.lineWidth = thickness / ((frames[t][2] + zfar) * persp);
    if (shape == 'Circle') {
      if (sizefact != 1) {
        ctx.save();
        ctx.scale(1, sizefact);
      }
      ctx.beginPath();
      ctx.arc(frames[t][0] / ((frames[t][2] + zfar) * persp), frames[t][1] / ((frames[t][2] + zfar) * persp), 0.5 * fsizex / ((frames[t][2] + zfar) * persp), 0, 2 * Math.PI);

      if (sizefact != 1)
        ctx.restore();

      ctx.stroke();
    } else
      centerRect(frames[t][0] / ((frames[t][2] + zfar) * persp), frames[t][1] / ((frames[t][2] + zfar) * persp), fsizex / ((frames[t][2] + zfar) * persp), (fsizex + fsizedy) / ((frames[t][2] + zfar) * persp));
  }
}

newTunnel();

function paint() {
  requestAnimationFrame(paint);
  for (var t = 0; t < rsteps; t++)
    step(t == rsteps - 1 ? rspeed : fspace, t == 0 ? true : false);
  render();
}

var gui = new dat.GUI();
/*
dat.gui helper functions
*/
function forceStep(ctrl, pow) {
  ctrl.step(Math.pow(10, -pow));
  ctrl.__impliedStep = Math.pow(10, -pow);
  ctrl.__precision = pow;
  return ctrl;
}

function compoundMinimal(ctrl, ctrl2, obj, prop, obj2, prop2, real, callback, maximal, rmax) {
  var f = function() {
    if (obj[prop] < -obj2[prop2] + real)
      obj[prop] = -obj2[prop2] + real;

    if (maximal && obj[prop] > obj2[prop2] - rmax)
      obj[prop] = obj2[prop2] - rmax;


    ctrl.updateDisplay()
    callback();
  };

  var f2 = function() {
    if (Array.isArray(ctrl2.__compoundControllers)) {
      for (var t = 0; t < ctrl2.__compoundControllers.length; t++)
        ctrl2.__compoundControllers[t]();
    }
  }
  if (!Array.isArray(ctrl2.__compoundControllers))
    ctrl2.__compoundControllers = [];
  ctrl2.__compoundControllers.push(f);

  ctrl.onChange(f);

  ctrl2.onChange(f2);
}

function removeFolder(gui, name) {
  gui.__folders[name].close();
  gui.__folders[name].domElement.parentNode.parentNode.removeChild(gui.__folders[name].domElement.parentNode);
  gui.__folders[name] = undefined;
  delete gui.__folders[name];
  gui.onResize();
}

var tgui = gui.addFolder('Tunnel settings');
tgui.add(window, 'fsizex').name('X size');

forceStep(tgui.add(window, 'fsizedy').name('Y-X size').min(-11.1), 2);

tgui.add(window, 'shape', ['Circle', 'Square']).name('Shape').onChange(render);
tgui.add(window, 'fspace').name('Z space').min(0.005).onChange(newTunnel);
tgui.add(window, 'nframes').name('Length').min(5).onChange(newTunnel);
tgui.add(window, 'vtmode', {
  "Together": 0,
  "Separated": 1
}).name('Generation mode').name('XY generation').onChange(function() {
  vtmode = parseInt(vtmode);
  newTunnel();
});

tgui.add(window, 'mdur').name('Min (X) depth').onChange(newTunnel);
tgui.add(window, 'mxdur').name('Max (X) depth').onChange(newTunnel);

forceStep(tgui.add(window, 'mdurdy').name('Min Y-X depth').onChange(newTunnel), 1);
forceStep(tgui.add(window, 'mxdurdy').name('Max Y-X depth').onChange(newTunnel), 1);


tgui.add(window, 'mspx').name('X move span').onChange(newTunnel);
tgui.add(window, 'mspy').name('Y move span').onChange(newTunnel);

var c_mrel = tgui.add(window, 'mrel').name('Max rel move X').min(0.05).onChange(newTunnel);

compoundMinimal(forceStep(tgui.add(window, 'mreldy').name('Max rel move Y-X'), 2), c_mrel, window, 'mreldy', window, 'mrel', 0, newTunnel);


var lgui = gui.addFolder('Lights');
lgui.add(window, 'ambient').min(0).max(255).name('Ambient').onChange(render);
var c_dcut = lgui.add(window, 'dcut').min(0).name('Base exp cut');
var c_dstep = lgui.add(window, 'dstep').min(0.01).name('Base exp step');
var c_dpeak = lgui.add(window, 'dpeak').min(0).name('Base exp peak');
var c_dend = lgui.add(window, 'dend').min(0.1).name('Base exp reach');
var c_ddist = lgui.add(window, 'ddist').min(0.1).name('Base ext dist');
lgui.add(window, 'newPassage').name('New light');


function newPassage() {
  passages.push(JSON.parse(JSON.stringify(passages[passages.length - 1])));
  repaintPassageGUI();
  newTunnel();
}

function repaintPassageGUI() {
  for (var t in lgui.__folders) {
    if (lgui.__folders.hasOwnProperty(t))
      removeFolder(lgui, t);
  }
  for (var t = 0, tl; t < passages.length; t++) {
    tl = lgui.addFolder('Light #' + (t + 1));
    passages[t].removeFunction = (function(t) {
      return function() {
        passages.splice(t, 1);
        repaintPassageGUI();
        newTunnel();
      }
    })(t);
    tl.add(passages[t], 'removeFunction').name('Remove');
    forceStep(tl.add(passages[t], 'intensity').name('Intensity').min(0), 2).onChange(newTunnel);
    forceStep(tl.add(passages[t], 'r').name('Red').min(0), 2).onChange(newTunnel);
    forceStep(tl.add(passages[t], 'g').name('Green').min(0), 2).onChange(newTunnel);
    forceStep(tl.add(passages[t], 'b').name('Blue').min(0), 2).onChange(newTunnel);
    tl.add(passages[t], 'useCosine').name('Use cosine').onChange(newTunnel);


    compoundMinimal(forceStep(tl.add(passages[t], 'cut').name('Exp cut'), 2), c_dcut, passages[t], 'cut', window, 'dcut', 0, newTunnel);
    compoundMinimal(forceStep(tl.add(passages[t], 'step').name('Exp step'), 2), c_dstep, passages[t], 'step', window, 'dstep', 0.01, newTunnel);
    compoundMinimal(tl.add(passages[t], 'peak').name('Exp peak'), c_dpeak, passages[t], 'peak', window, 'dpeak', 0, newTunnel);
    compoundMinimal(forceStep(tl.add(passages[t], 'end').name('Exp reach'), 1), c_dend, passages[t], 'end', window, 'dend', 0.1, newTunnel);

    forceStep(tl.add(passages[t], 'cosStep').name('Cos step'), 2).onChange(newTunnel);
    tl.add(passages[t], 'cosPeak').min(0).name('Cos peak').onChange(newTunnel);

    compoundMinimal(forceStep(tl.add(passages[t], 'dist').name('Ext dist'), 2), c_ddist, passages[t], 'dist', window, 'ddist', 0.1, newTunnel);
    forceStep(tl.add(passages[t], 'idist').name('Int dist'), 2).onChange(newTunnel);
    tl.add(passages[t], 'quantity').name('Quantity').step(1).onChange(newTunnel);
    forceStep(tl.add(passages[t], 'probability').min(0).max(1).name('Probability').onChange(newTunnel), 2);
    forceStep(tl.add(passages[t], 'minlast').name('Grace period').min(0).onChange(newTunnel), 2);
  }
}
repaintPassageGUI();

var vgui = gui.addFolder('Display settings'),
  ftype = 'Exp2';
vgui.add(window, 'thickness').name('Thickness').onChange(render);
vgui.add(window, 'zoom').name('Scale').onChange(function() {
  setZoom();
  render();
});
vgui.add(window, 'zfar').name('Z-far').onChange(render);
vgui.add(window, 'persp').name('Perspective').onChange(render);
vgui.add(window, 'ftype', ['Linear', 'Exp2']).name('Fog type').onChange(chFogType);
vgui.add(window, 'fz').name('Linear Fog start').onChange(render);
vgui.add(window, 'ff').name('Linear Fog factor').onChange(render);
vgui.add(window, 'fdensity').name('Exp fog density').onChange(render);

function chFogType() {
  fog = window['fog' + ftype];
  render();
}

var t_speed = gui.add(window, 'speed').min(0).name('Speed').onChange(setSpeed);
document.addEventListener('wheel', function(event) {
  speed = Math.max(0, speed - Math.sign(event.deltaY) * 0.005);
  setSpeed();
  t_speed.updateDisplay();
});
window.addEventListener('resize', newTunnel);
paint();
