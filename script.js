// =========================================================================
// 1. 前端 API 适配器 (指向 Cloudflare Function)
// =========================================================================
function cleanJson(text) {
    let clean = text;
    if (clean.includes("```")) {
        clean = clean.split("```json").join("").split("```").join("");
    }
    return clean.trim();
}

async function callAIAdapter(prompt, systemPrompt) {
    try {
        // 请求 Cloudflare Functions 提供的 API
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                systemPrompt: systemPrompt
            })
        });

        if (!response.ok) throw new Error("API Network Error");
        const data = await response.json();
        return data.result; 

    } catch (error) {
        console.error("AI Error:", error);
        return "服务器被二次元老婆挤爆了...稍后再试！📡 (请检查API Key是否配置)";
    }
}

// =========================================================================
// 2. 3D Scene (保持不变)
// =========================================================================
const initThree = () => {
    const container = document.getElementById('bg-canvas');
    if(!container) return;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a0b2e, 0.003); 

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 20); 
    camera.lookAt(0, 2, -100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
    renderer.toneMapping = THREE.ReinhardToneMapping;
    container.appendChild(renderer.domElement);

    // Sun
    const sunGeo = new THREE.CircleGeometry(50, 64);
    const sunCanvas = document.createElement('canvas'); sunCanvas.width = 128; sunCanvas.height = 128;
    const sCtx = sunCanvas.getContext('2d');
    const grd = sCtx.createLinearGradient(0, 0, 0, 128);
    grd.addColorStop(0, '#fde047'); grd.addColorStop(0.5, '#e879f9'); grd.addColorStop(1, '#a21caf'); 
    sCtx.fillStyle = grd; sCtx.fillRect(0, 0, 128, 128);
    sCtx.fillStyle = 'rgba(0,0,0,0.2)'; for(let i=0; i<128; i+=6) sCtx.fillRect(0, i, 128, 2);
    const sunTex = new THREE.CanvasTexture(sunCanvas);
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTex, fog: false, transparent: true });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(0, 20, -180);
    scene.add(sun);

    const gridHelper = new THREE.GridHelper(400, 40, 0xff00ff, 0xdb2777);
    gridHelper.position.y = -5;
    scene.add(gridHelper);

    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    const createBuildingTexture = () => {
        const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#05010a'; ctx.fillRect(0, 0, 64, 128);
        ctx.fillStyle = Math.random() > 0.5 ? '#22d3ee' : '#e879f9';
        for (let y = 4; y < 124; y += 8) { for (let x = 4; x < 60; x += 8) { if (Math.random() > 0.3) ctx.fillRect(x, y, 4, 6); } }
        const tex = new THREE.CanvasTexture(canvas); tex.magFilter = THREE.NearestFilter; return tex;
    };

    const buildings = [];
    const buildingGeo = new THREE.BoxGeometry(1, 1, 1); buildingGeo.translate(0, 0.5, 0); 
    for (let i = 0; i < 40; i++) {
        const mat = new THREE.MeshStandardMaterial({ color: 0x111111, emissiveMap: createBuildingTexture(), emissive: 0xffffff, emissiveIntensity: 1, roughness: 0.1 });
        const mesh = new THREE.Mesh(buildingGeo, mat);
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (15 + Math.random() * 50); const z = -Math.random() * 300;
        mesh.position.set(x, -5, z);
        mesh.scale.set(6 + Math.random()*10, 10 + Math.random()*50, 6 + Math.random()*10);
        cityGroup.add(mesh); buildings.push(mesh);
    }

    const obstacles = [];
    const spikeGeo = new THREE.ConeGeometry(1, 3, 4); 
    const cubeGeo = new THREE.BoxGeometry(2, 2, 2); 
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8, metalness: 0.8 });
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 0.5, wireframe: true });
    const gateMat = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.6 });

    function createObstacle() {
        const type = Math.random(); let mesh;
        if (type < 0.4) { mesh = new THREE.Mesh(spikeGeo, spikeMat); mesh.position.y = -3.5; mesh.userData = { type: 'spike', rotSpeed: 0.05 }; } 
        else if (type < 0.7) { mesh = new THREE.Mesh(cubeGeo, cubeMat); mesh.position.y = -2; mesh.userData = { type: 'cube', rotSpeed: 0.02 }; } 
        else { mesh = new THREE.Group(); const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 0.5), gateMat); p1.position.x = -2; const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 0.5), gateMat); p2.position.x = 2; const top = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.5, 0.5), gateMat); top.position.y = 2; mesh.add(p1); mesh.add(p2); mesh.add(top); mesh.position.y = -5; mesh.userData = { type: 'gate', rotSpeed: 0 }; }
        mesh.position.z = -200 - Math.random() * 100; mesh.position.x = (Math.random() - 0.5) * 25;
        scene.add(mesh); obstacles.push(mesh);
    }
    for(let i=0; i<10; i++) createObstacle();

    const carGroup = new THREE.Group(); scene.add(carGroup);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.9, roughness: 0.2 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 1.0, roughness: 0.0, transparent: true, opacity: 0.9 });
    const glowingMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const redLightMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const s = 1.8; 
    const chassisGeo = new THREE.BoxGeometry(2.2 * s, 0.5 * s, 5 * s); const chassis = new THREE.Mesh(chassisGeo, bodyMat); chassis.position.y = 0.5 * s; carGroup.add(chassis);
    const fenderGeo = new THREE.BoxGeometry(0.4 * s, 0.5 * s, 1.5 * s);
    const fl = new THREE.Mesh(fenderGeo, bodyMat); fl.position.set(1.3 * s, 0.5 * s, -1.5 * s); carGroup.add(fl);
    const fr = new THREE.Mesh(fenderGeo, bodyMat); fr.position.set(-1.3 * s, 0.5 * s, -1.5 * s); carGroup.add(fr);
    const bl = new THREE.Mesh(fenderGeo, bodyMat); bl.position.set(1.3 * s, 0.5 * s, 1.5 * s); carGroup.add(bl);
    const br = new THREE.Mesh(fenderGeo, bodyMat); br.position.set(-1.3 * s, 0.5 * s, 1.5 * s); carGroup.add(br);
    const cabinGeo = new THREE.BoxGeometry(1.8 * s, 0.4 * s, 2.5 * s); const cabin = new THREE.Mesh(cabinGeo, glassMat); cabin.position.set(0, 0.95 * s, -0.2 * s); carGroup.add(cabin);
    const ventGeo = new THREE.BoxGeometry(1.4 * s, 0.1 * s, 1.0 * s); const vents = new THREE.Mesh(ventGeo, new THREE.MeshBasicMaterial({color: 0x333333})); vents.position.set(0, 0.76 * s, 1.8 * s); carGroup.add(vents);
    const wingGeo = new THREE.BoxGeometry(2.6 * s, 0.1 * s, 0.8 * s); const wing = new THREE.Mesh(wingGeo, bodyMat); wing.position.set(0, 1.3 * s, 2.3 * s); carGroup.add(wing);
    const strutGeo = new THREE.BoxGeometry(0.1 * s, 0.6 * s, 0.2 * s); const s1 = new THREE.Mesh(strutGeo, bodyMat); s1.position.set(0.8 * s, 1.0 * s, 2.3 * s); carGroup.add(s1); const s2 = new THREE.Mesh(strutGeo, bodyMat); s2.position.set(-0.8 * s, 1.0 * s, 2.3 * s); carGroup.add(s2);
    const wGeo = new THREE.CylinderGeometry(0.5 * s, 0.5 * s, 0.4 * s, 32); wGeo.rotateZ(Math.PI/2); const wMat = new THREE.MeshStandardMaterial({ color: 0x111111 }); const rimGeo = new THREE.TorusGeometry(0.3 * s, 0.05 * s, 8, 24); rimGeo.rotateY(Math.PI/2); const rimMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const makeWheel = (x, z) => { const g = new THREE.Group(); g.add(new THREE.Mesh(wGeo, wMat)); g.add(new THREE.Mesh(rimGeo, rimMat)); g.position.set(x, 0.5 * s, z); return g; };
    const w1=makeWheel(1.4 * s, 1.5 * s), w2=makeWheel(-1.4 * s, 1.5 * s), w3=makeWheel(1.4 * s, -1.8 * s), w4=makeWheel(-1.4 * s, -1.8 * s); carGroup.add(w1); carGroup.add(w2); carGroup.add(w3); carGroup.add(w4);
    const exhaustGeo = new THREE.CylinderGeometry(0.25 * s, 0.25 * s, 0.1 * s, 6); exhaustGeo.rotateX(Math.PI/2); const exL = new THREE.Mesh(exhaustGeo, redLightMat); exL.position.set(0.6 * s, 0.6 * s, 2.51 * s); carGroup.add(exL); const exR = new THREE.Mesh(exhaustGeo, redLightMat); exR.position.set(-0.6 * s, 0.6 * s, 2.51 * s); carGroup.add(exR);
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.2 * s, 0.1 * s), glowingMat); headL.position.set(0.7 * s, 0.6 * s, -2.51 * s); carGroup.add(headL); const headR = headL.clone(); headR.position.set(-0.7 * s, 0.6 * s, -2.51 * s); carGroup.add(headR);
    const underglowGeo = new THREE.PlaneGeometry(2.5 * s, 5.5 * s); underglowGeo.rotateX(-Math.PI/2); const underglowMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.15, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }); const underglow = new THREE.Mesh(underglowGeo, underglowMat); underglow.position.y = 0.1; carGroup.add(underglow);
    const beam = new THREE.SpotLight(0xffffff, 10, 100, 0.6, 0.5, 1); beam.position.set(0, 2, -2); beam.target.position.set(0, 0, -60); carGroup.add(beam); carGroup.add(beam.target);
    carGroup.position.set(0, -4.5, -8);

    const trailCount = 600; const trailGeo = new THREE.BufferGeometry(); const trailPos = new Float32Array(trailCount * 3); const trailSizes = new Float32Array(trailCount);
    for(let i=0; i<trailCount; i++) { trailPos[i*3] = 999; trailPos[i*3+1] = 999; trailPos[i*3+2] = 999; trailSizes[i] = Math.random(); }
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3)); trailGeo.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1));
    const trailMat = new THREE.PointsMaterial({ color: 0xd946ef, size: 0.3, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    const trailL = new THREE.Points(trailGeo.clone(), trailMat); const trailR = new THREE.Points(trailGeo.clone(), trailMat); scene.add(trailL); scene.add(trailR);
    scene.add(new THREE.AmbientLight(0xffffff, 0.2)); const pLight = new THREE.PointLight(0xd946ef, 1.5, 50); pLight.position.set(0, 10, -5); scene.add(pLight);

    let mx = 0; const handleMove = (x) => { mx = (x / window.innerWidth) * 2 - 1; };
    document.addEventListener('mousemove', e => handleMove(e.clientX)); document.addEventListener('touchmove', e => { if(e.touches.length > 0) handleMove(e.touches[0].clientX); }, { passive: true });

    let mileage = 0; const mileageTarget = 1000; const odoVal = document.getElementById('odometer-value'); const odoBox = document.getElementById('odometer-box'); const odoLabel = document.getElementById('odometer-label'); const odoUnit = document.getElementById('odometer-unit'); let isGoldenMode = false;
    const interpolateColor = (c1, c2, f) => { const r1 = parseInt(c1.substring(1,3), 16), g1 = parseInt(c1.substring(3,5), 16), b1 = parseInt(c1.substring(5,7), 16); const r2 = parseInt(c2.substring(1,3), 16), g2 = parseInt(c2.substring(3,5), 16), b2 = parseInt(c2.substring(5,7), 16); return `rgb(${Math.round(r1+f*(r2-r1))},${Math.round(g1+f*(g2-g1))},${Math.round(b1+f*(b2-b1))})`; };

    const animate = () => {
        requestAnimationFrame(animate);
        const speed = 1.5; gridHelper.position.z += speed; if(gridHelper.position.z > 5) gridHelper.position.z = -5;
        buildings.forEach(b => { b.position.z += speed * 1.5; if(b.position.z > 30) { b.position.z = -300 - Math.random() * 50; b.position.x = (Math.random() > 0.5 ? 1 : -1) * (25 + Math.random() * 40); } });
        obstacles.forEach(o => { o.position.z += speed * 1.5; if(o.userData.rotSpeed) { o.rotation.y += o.userData.rotSpeed; if(o.userData.type === 'spike') o.rotation.x += 0.05; } if(o.position.z > 20) { o.position.z = -200 - Math.random() * 150; o.position.x = (Math.random()-0.5) * 30; } });
        carGroup.position.x += (mx * 15 - carGroup.position.x) * 0.08; carGroup.rotation.z = -carGroup.position.x * 0.04; carGroup.rotation.y = -carGroup.position.x * 0.01;
        const updateTrail = (trailMesh, sideMultiplier) => { const positions = trailMesh.geometry.attributes.position.array; for(let i=0; i<trailCount; i++) { positions[i*3+2] += speed * 2; positions[i*3] += (Math.random()-0.5) * 0.1; if(positions[i*3+2] > 15 || positions[i*3+2] > 900) { const exX = carGroup.position.x + (0.6 * s * sideMultiplier); const exY = carGroup.position.y + (0.6 * s); const exZ = carGroup.position.z + (2.5 * s); const rotInfluence = carGroup.rotation.z * (0.6 * s * sideMultiplier); positions[i*3] = exX + (Math.random()-0.5)*0.2; positions[i*3+1] = exY + rotInfluence + (Math.random()-0.5)*0.2; positions[i*3+2] = exZ; } } trailMesh.geometry.attributes.position.needsUpdate = true; };
        updateTrail(trailL, 1); updateTrail(trailR, -1);
        w1.rotation.x += 0.8; w2.rotation.x += 0.8; w3.rotation.x += 0.8; w4.rotation.x += 0.8;
        camera.position.x += (carGroup.position.x * 0.4 - camera.position.x) * 0.05; camera.lookAt(0, 0, -50);
        mileage += 1.2; const currentVal = Math.floor(mileage); odoVal.innerText = currentVal.toString().padStart(6, '0');
        if (currentVal < mileageTarget) { const progress = currentVal / mileageTarget; let currentColor, borderColor; if(progress < 0.5) { const p = progress * 2; currentColor = interpolateColor("#22d3ee", "#d946ef", p); borderColor = interpolateColor("#22d3ee", "#d946ef", p); } else { const p = (progress - 0.5) * 2; currentColor = interpolateColor("#d946ef", "#ffd700", p); borderColor = interpolateColor("#d946ef", "#ffd700", p); } odoBox.style.borderColor = borderColor; odoBox.style.boxShadow = `0 0 20px ${borderColor}40`; odoVal.style.backgroundImage = `linear-gradient(180deg, #fff 0%, ${currentColor} 100%)`; odoVal.style.textShadow = `0 0 10px ${currentColor}`; odoLabel.style.color = currentColor; odoUnit.style.color = currentColor; } else if (!isGoldenMode) { isGoldenMode = true; odoBox.classList.add('golden'); odoVal.style.backgroundImage = `linear-gradient(180deg, #fff 0%, #ffd700 100%)`; odoVal.style.textShadow = `0 0 20px rgba(255, 215, 0, 0.8)`; odoLabel.style.color = "#ffd700"; odoUnit.style.color = "#ffd700"; }
        renderer.render(scene, camera);
    };
    animate();
    window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
};

const init3DChart = () => {
    const container = document.getElementById('chart-3d-canvas'); if(!container) return;
    const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100); camera.position.set(20, 20, 30); camera.lookAt(0, 5, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setSize(container.clientWidth, container.clientHeight); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); container.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5)); const pLight = new THREE.PointLight(0x22d3ee, 1, 50); pLight.position.set(10, 20, 10); scene.add(pLight);
    const barData = [ { label: 'Q1', height: 4, color: 0x7c3aed }, { label: 'Q2', height: 7, color: 0xc026d3 }, { label: 'Q3', height: 10, color: 0xdb2777 }, { label: 'Q4', height: 14, color: 0x0891b2 }, { label: '2027', height: 18, color: 0x22d3ee } ];
    const bars = []; const barGeo = new THREE.BoxGeometry(2, 1, 2); barGeo.translate(0, 0.5, 0); 
    barData.forEach((d, i) => { const mat = new THREE.MeshStandardMaterial({ color: d.color, emissive: d.color, emissiveIntensity: 0.5, roughness: 0.2, metalness: 0.8, transparent: true, opacity: 0.9 }); const bar = new THREE.Mesh(barGeo, mat); bar.position.set((i - 2) * 3.5, 0, 0); bar.scale.y = 0.1; bar.userData = { targetHeight: d.height }; scene.add(bar); bars.push(bar); const edges = new THREE.EdgesGeometry(barGeo); const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })); bar.add(line); });
    const grid = new THREE.GridHelper(30, 10, 0x555555, 0x222222); scene.add(grid);
    let isDragging = false, prevX = 0, rotationTarget = 0;
    const onDown = e => { isDragging = true; prevX = e.clientX || e.touches[0].clientX; }; const onUp = () => isDragging = false; const onMove = e => { if(!isDragging) return; const clientX = e.clientX || e.touches[0].clientX; rotationTarget += (clientX - prevX) * 0.01; prevX = clientX; if(e.type === 'touchmove') e.preventDefault(); };
    container.addEventListener('mousedown', onDown); window.addEventListener('mouseup', onUp); container.addEventListener('mousemove', onMove); container.addEventListener('touchstart', onDown, {passive:false}); container.addEventListener('touchend', onUp); container.addEventListener('touchmove', onMove, {passive:false});
    const clock = new THREE.Clock();
    const animateChart = () => { requestAnimationFrame(animateChart); const time = clock.getElapsedTime(); scene.rotation.y += (rotationTarget - scene.rotation.y) * 0.1; bars.forEach((bar, i) => { bar.scale.y += (bar.userData.targetHeight - bar.scale.y) * 0.05; const pulse = Math.sin(time * 3 + i) * 0.2; bar.scale.x = 1 + pulse * 0.05; bar.scale.z = 1 + pulse * 0.05; }); renderer.render(scene, camera); };
    animateChart();
    window.addEventListener('resize', () => { const newW = container.clientWidth, newH = container.clientHeight; if(newW && newH) { camera.aspect = newW/newH; camera.updateProjectionMatrix(); renderer.setSize(newW, newH); } });
};

const wishes = { 'study': { title: '🎓 澳洲学霸 (HD拿到手软)', intro: '在土澳读书不容易，防袋鼠还要赶Due。', points: [{title:'HD 收割机',text:'Assignment 全过，Exam 押题全中，轻松拿 PR。'},{title:'英语如母语',text:'雅思四个八，吵架全靠流利英语输出，不再只会说 Yes/No。'},{title:'顺利毕业',text:'毕业典礼最帅的就是你，父母笑得合不拢嘴。'}], activity: 'Mission: 毕业后带我去做代购（开玩笑的）。' }, 'life': { title: '🏋️‍♂️ 肌肉猛男 (Gains)', intro: '没有什么是一顿深蹲解决不了的，如果有，那就两顿。', points: [{title:'体脂新低',text:'腹肌像搓衣板，胸肌会跳舞，在海滩回头率 200%。'},{title:'老婆成群',text:'在二次元的世界里，后宫佳丽三千，纸片人老婆天天换。'},{title:'营养跟上',text:'记得多吃生蚝和袋鼠肉，别只顾着看美女，身体要紧。'}], activity: 'Mission: 卧推冲刺 150KG！' }, 'rich': { title: '🎮 氪金大佬 (Rich AF)', intro: '有钱才能守护二次元笑容！', points: [{title:'手办自由',text:'喜欢的 Figure 随便买，家里摆满老婆，墙上全是限定海报。'},{title:'皮肤全皮',text:'游戏全皮肤，操作猛如虎，装备闪瞎眼。'},{title:'汇率友好',text:'愿澳币汇率对你温柔，每一分钱都花在刀刃（老婆）上。'}], activity: 'Mission: 苟富贵，勿相忘。' } };
const moments = [ { id: 1, title: '当你在健身房看到美女时...', do: '表面：目不斜视专注撸铁。内心：卧槽，这臀围，这线条...（此处省略一万字）', dont: '直接上去要微信。（会被当成变态）' }, { id: 2, title: '关于二次元老婆...', do: '喊“这是我新老婆”，疯狂发图。', dont: '告诉现实中的女生你喜欢纸片人。（注孤生警告）' }, { id: 3, title: '深夜开车时间...', do: '发各种只有我们懂的内涵图，车速飙到 180 迈，互相嘿嘿嘿。', dont: '发给长辈群。' } ];
const showWish = g => { ['study','life','rich'].forEach(k => document.getElementById(`tab-${k}`).className = k===g ? "horseshoe-card p-3 sm:p-4 text-center font-bold border border-pink-500 bg-purple-900/30 text-pink-300 cursor-pointer" : "horseshoe-card p-3 sm:p-4 text-center font-bold border border-slate-700 hover:border-pink-500 text-slate-400 cursor-pointer"); document.getElementById('wish-area').innerHTML = `<h3 class="text-2xl sm:text-3xl font-black text-pink-300 mb-4 sm:mb-6 festive-font">${wishes[g].title}</h3><p class="text-slate-200 text-lg sm:text-xl leading-relaxed">${wishes[g].intro}</p><div class="grid gap-3 sm:gap-4 mt-4 sm:mt-6">${wishes[g].points.map(p=>`<div class="p-3 sm:p-4 bg-white/5 rounded-xl border border-purple-500/20"><h4 class="font-bold text-pink-300">${p.title}</h4><p class="text-xs sm:text-sm text-slate-300">${p.text}</p></div>`).join('')}</div><div class="mt-4 sm:mt-6 text-purple-300 font-bold text-sm sm:text-base">${wishes[g].activity}</div>`; };
const renderMoments = () => { document.getElementById('moment-grid').innerHTML = moments.map(m => `<div class="horseshoe-card p-0 overflow-hidden shadow-2xl"><div class="p-6 sm:p-8 flex justify-between items-center cursor-pointer hover:bg-white/5 transition" onclick="toggleMoment(${m.id})"><h3 class="font-bold text-lg sm:text-xl text-pink-100 leading-snug w-[85%]">${m.title}</h3><span id="icon-${m.id}" class="text-2xl sm:text-4xl">😈</span></div><div id="moment-${m.id}" class="hidden p-6 sm:p-8 bg-black/50 border-t border-purple-500/20 animate-fade-in"><div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8"><div class="p-4 sm:p-5 bg-purple-900/30 border border-blue-500/40 rounded-2xl text-blue-100 text-sm sm:text-base"><strong>你的操作：</strong> ${m.do}</div><div class="p-4 sm:p-5 bg-purple-900/30 border border-purple-500/40 rounded-2xl text-purple-200 text-sm sm:text-base"><strong>普通人：</strong> ${m.dont}</div></div><div class="pt-4 sm:pt-6 border-t border-cyan-500/20 flex flex-col sm:flex-row gap-3 sm:gap-4"><input type="text" id="moment-input-${m.id}" placeholder="神回复..." class="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-black/60 border border-pink-500/30 text-white font-bold outline-none text-sm sm:text-base"><button onclick="analyzeMoment(${m.id}, '${m.title}')" class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-black transition hover:scale-105 text-sm sm:text-base">AI 点评</button></div><div id="ai-feedback-${m.id}" class="hidden mt-4 sm:mt-6 p-4 sm:p-6 bg-blue-900/40 rounded-2xl text-xs sm:text-sm text-cyan-100 border border-blue-500/40"></div></div></div>`).join(''); };
const toggleMoment = id => { document.getElementById(`moment-${id}`).classList.toggle('hidden'); };
const toggleChat = () => { const w = document.getElementById('chat-win'); w.style.display = w.style.display==='flex' ? 'none' : 'flex'; if(w.style.display==='flex') w.classList.add('open'); };
function scrollToSection(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }
function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('hidden'); }
async function sendMsg() { const i = document.getElementById('chat-in'), m = document.getElementById('chat-msgs'), t = i.value.trim(); if(!t) return; m.innerHTML += `<div class="p-3 bg-purple-600 rounded-2xl text-sm self-end ml-auto text-white font-bold shadow-md">${t}</div>`; i.value=''; m.scrollTop = m.scrollHeight; const r = await callAIAdapter(t, "你是小孙的赛博损友AI，说话像个二次元老司机，喜欢用'Bro'、'纳尼'、'车速快'等词，性格很皮。"); m.innerHTML += `<div class="p-4 bg-white/10 rounded-2xl text-sm shadow-xl border border-pink-500/20">${marked.parse(r)}</div>`; m.scrollTop = m.scrollHeight; }
async function createCouplet() { const k = document.getElementById('couplet-key').value; if(!k) return; const r = document.getElementById('couplet-result'), l = document.getElementById('couplet-load'); r.classList.add('hidden'); l.classList.remove('hidden'); const rep = await callAIAdapter(`关键词: ${k}. 对象: 澳洲留学生二次元猛男. 赛博对联(7字)横批(4字). JSON: {"up":"","down":"","batch":""}`, "仅返回 JSON。"); l.classList.add('hidden'); r.classList.remove('hidden'); try { const j = JSON.parse(cleanJson(rep)); r.innerHTML = `<div class="couplet-horizontal mx-auto w-max mb-6 sm:mb-8 text-xl sm:text-2xl">${j.batch}</div><div class="flex justify-center gap-6 sm:gap-24"><div class="couplet-scroll text-lg sm:text-2xl">${j.up}</div><div class="couplet-scroll text-lg sm:text-2xl">${j.down}</div></div>`; r.style.display = 'flex'; } catch(e) { r.innerHTML = "AI 正在学习中文，请重试！"; } }
async function analyzeMoment(id, t) { const v = document.getElementById(`moment-input-${id}`).value; if(!v) return; const box = document.getElementById(`ai-feedback-${id}`); box.classList.remove('hidden'); box.innerHTML = "AI 正在分析..."; const rep = await callAIAdapter(`情境: ${t}. 回答: "${v}". 毒舌点评(带点颜色笑话).`, "二次元老司机"); box.innerHTML = `<strong>AI 吐槽：</strong><br>${marked.parse(rep)}`; }
async function getFortuneBag() { const v = document.getElementById('wish-input').value; if(!v) return; const box = document.getElementById('fortune-result'); box.classList.remove('hidden'); const rep = await callAIAdapter(`愿望: ${v}. 赐予一个二次元赛博装备.`, "中二语气"); box.innerHTML = `<div class="flex items-start gap-4 sm:gap-5"><div class="text-4xl sm:text-5xl mt-2 animate-bounce">🎁</div><div class="text-white text-base sm:text-lg leading-relaxed font-bold">${marked.parse(rep)}</div></div>`; }
const initApp = () => { if (typeof THREE === 'undefined') { setTimeout(initApp, 100); return; } initThree(); init3DChart(); showWish('study'); renderMoments(); };
document.addEventListener('DOMContentLoaded', initApp);