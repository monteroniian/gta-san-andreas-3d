/* ==========================================================================
   GRAND THEFT AUTO: SAN ANDREAS — MAIN GAME ENGINE, CJ CONTROLLER & RADAR
   ========================================================================== */

class GTASanAndreasGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.radarCanvas = document.getElementById('radar-canvas');
    this.radarCtx = this.radarCanvas.getContext('2d');

    this.keys = {};
    this.mouseDownLeft = false;
    this.mouseDownRight = false;
    this.isPaused = true; // Starts on Title Screen

    // Camera spherical orbit
    this.camYaw = Math.PI * 0.5; // Facing West down Grove Street from CJ's house
    this.camPitch = 0.28;

    // Game Clock (Starts at 17:30 for that iconic Los Santos Golden Sunset!)
    this.gameHour = 17;
    this.gameMinute = 30;
    this.clockAccum = 0;

    // Active Cheats State
    this.cheats = {
      godMode: false,
      infiniteAmmo: false,
      neverWanted: false,
      megaJump: false,
      megaBunnyHop: false,
      carsFly: false
    };

    // Weapon catalog
    this.weaponCatalog = {
      fist:    { id: 'fist',    name: 'PUÑO',        icon: '👊', damage: 22, range: 2.6,  fireRate: 0.35, clipSize: 0 },
      bat:     { id: 'bat',     name: 'BATE',        icon: '🏏', damage: 45, range: 3.0,  fireRate: 0.42, clipSize: 0 },
      pistol:  { id: 'pistol',  name: '9MM COLT',    icon: '🔫', damage: 28, range: 45.0, fireRate: 0.28, clipSize: 17 },
      uzi:     { id: 'uzi',     name: 'TEC-9 SMG',   icon: '💥', damage: 20, range: 40.0, fireRate: 0.11, clipSize: 50 },
      shotgun: { id: 'shotgun', name: 'ESCOPETA',    icon: '🔥', damage: 85, range: 24.0, fireRate: 0.68, clipSize: 8 },
      ak47:    { id: 'ak47',    name: 'AK-47',       icon: '⚔️', damage: 36, range: 65.0, fireRate: 0.13, clipSize: 30 },
      rpg:     { id: 'rpg',     name: 'RPG-7',       icon: '🚀', damage: 250, range: 90.0, fireRate: 1.2, clipSize: 1 },
      spray:   { id: 'spray',   name: 'SPRAY VERDE', icon: '🧪', damage: 5,  range: 4.5,  fireRate: 0.15, clipSize: 999 }
    };

    // CJ Player State
    this.player = {
      pos: new THREE.Vector3(21, 0, 0), // Right outside CJ's house in Grove Street
      velY: 0,
      rotY: -Math.PI / 2,
      hp: 100,
      maxHp: 100,
      armor: 50,
      breath: 100,
      money: 350,
      wanted: 0,
      wantedDecayTimer: 0,
      inVehicle: null,
      jetpack: false,
      outfit: 'classic',
      walkCycle: 0,
      shootTimer: 0,
      isWasted: false,
      currentZone: 'Ganton — Grove Street',
      weapons: {
        fist:   { owned: true, ammo: 0 },
        bat:    { owned: false, ammo: 0 },
        pistol: { owned: true, ammo: 68 },
        uzi:    { owned: false, ammo: 0 },
        shotgun:{ owned: false, ammo: 0 },
        ak47:   { owned: false, ammo: 0 },
        rpg:    { owned: false, ammo: 0 },
        spray:  { owned: true, ammo: 500 }
      },
      currentWeapon: 'fist',
      stats: {
        respect: 35,
        stamina: 60,
        muscle: 55
      }
    };

    this.lockedTargetNPC = null;
    this.shopCooldown = 0;

    this.initThree();
    this.world = new LosSantosWorld(this.scene);
    this.entities = new SAEntityManager(this.scene, this.world);
    this.missions = new SAMissionManager(this.scene, this.world, this.entities);
    this.cheatManager = new SACheatManager(this);

    this.buildPlayerMesh();
    this.bindEvents();
    this.updateHUD();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.animate(t));
  }

  /* ------------------- THREE.JS SCENE, SKY & LIGHTING ------------------- */
  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xe89954); // Iconic Los Santos Orange Sunset Sky
    this.scene.fog = new THREE.FogExp2(0xe89954, 0.0042);

    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.2, 420);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Warm Golden Los Santos Ambient & Sun Directional Light
    this.ambientLight = new THREE.AmbientLight(0xffd8b0, 0.68);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffa756, 0.95);
    this.sunLight.position.set(-90, 85, 65);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 260;
    const d = 95;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);
  }

  buildPlayerMesh() {
    if (this.playerMesh) {
      this.scene.remove(this.playerMesh);
    }
    this.playerMesh = SAModelFactory.createCharacterModel({
      role: 'cj',
      outfit: this.player.outfit
    });
    this.playerMesh.position.copy(this.player.pos);
    this.playerMesh.rotation.y = this.player.rotY;
    this.scene.add(this.playerMesh);

    this.updatePlayerHandWeaponMesh();
    if (this.player.jetpack && this.playerMesh.userData.jetpackGroup) {
      this.playerMesh.userData.jetpackGroup.visible = true;
    }
  }

  updatePlayerHandWeaponMesh() {
    const mount = this.playerMesh.userData.weaponMount;
    while (mount.children.length > 0) {
      mount.remove(mount.children[0]);
    }
    const wMesh = SAModelFactory.createWeaponMesh(this.player.currentWeapon);
    mount.add(wMesh);
  }

  /* ------------------- INPUT & UI EVENTS ------------------- */
  bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Title Screen Buttons
    document.getElementById('btn-start-game').addEventListener('click', () => {
      saAudio.playMenuClick();
      document.getElementById('title-screen').classList.add('hidden');
      document.getElementById('hud').classList.remove('hidden');
      this.isPaused = false;
      this.showZonePopup('Ganton — Grove Street');
      this.showSubtitle(
        `<span style="color:#69f0ae">CJ:</span> "Grove Street... hogar. Al menos lo era antes de que yo lo arruinara todo."`
      );
      this.container.requestPointerLock?.();
    });

    document.getElementById('btn-open-controls').addEventListener('click', () => {
      saAudio.playMenuClick();
      document.getElementById('title-screen').classList.add('hidden');
      document.getElementById('hud').classList.remove('hidden');
      this.toggleCheatsModal(true);
    });

    const ps2Btn = document.getElementById('btn-toggle-ps2');
    ps2Btn.addEventListener('click', () => {
      saAudio.playMenuHover();
      const filterEl = document.getElementById('ps2-filter');
      filterEl.classList.toggle('ps2-warmth');
      const active = filterEl.classList.contains('ps2-warmth');
      ps2Btn.textContent = `FILTRO PS2 NARANJA: ${active ? 'ACTIVADO' : 'DESACTIVADO'}`;
    });

    // Close Modals
    document.getElementById('btn-close-cheats').addEventListener('click', () => {
      this.toggleCheatsModal(false);
    });
    document.getElementById('btn-close-shop').addEventListener('click', () => {
      document.getElementById('shop-modal').classList.add('hidden');
      this.isPaused = false;
      this.container.requestPointerLock?.();
    });

    // Clickable Cheats inside [TAB] Modal
    document.querySelectorAll('.cheat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-cheat');
        this.cheatManager.executeCheat(code);
        this.updateHUD();
      });
    });

    // Outfit switcher buttons
    document.querySelectorAll('[data-outfit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        saAudio.playPickupSound();
        this.player.outfit = btn.getAttribute('data-outfit');
        this.buildPlayerMesh();
        this.showCheatBanner(`ROPA DE CJ CAMBIADA: ${btn.textContent.toUpperCase()}`);
      });
    });

    // Fast Travel Teleport buttons
    document.querySelectorAll('[data-tp]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dest = btn.getAttribute('data-tp');
        const coords = {
          grove:    [20, 0],
          idlewood: [-92, 42],
          glenpark: [-95, -80],
          downtown: [-202, 0],
          beach:    [-38, 165]
        }[dest] || [20, 0];

        if (this.player.inVehicle) this.exitVehicle();
        this.player.pos.set(coords[0], 0, coords[1]);
        this.toggleCheatsModal(false);
      });
    });

    // Pointer Lock & Mouse Look
    this.container.addEventListener('mousedown', (e) => {
      if (this.isPaused) return;
      if (document.pointerLockElement !== this.container) {
        this.container.requestPointerLock?.();
      }
      if (e.button === 0) this.mouseDownLeft = true;
      if (e.button === 2) this.mouseDownRight = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDownLeft = false;
      if (e.button === 2) this.mouseDownRight = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('mousemove', (e) => {
      if (this.isPaused) return;
      if (document.pointerLockElement === this.container || this.mouseDownRight || this.mouseDownLeft) {
        this.camYaw -= e.movementX * 0.0032;
        this.camPitch = Math.max(-0.35, Math.min(1.15, this.camPitch + e.movementY * 0.0026));
      }
    });

    // Mouse Wheel switches weapons
    window.addEventListener('wheel', (e) => {
      if (this.isPaused) return;
      this.cycleWeapon(e.deltaY > 0 ? 1 : -1);
    });

    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'Tab') {
        e.preventDefault();
        const modal = document.getElementById('cheats-modal');
        this.toggleCheatsModal(modal.classList.contains('hidden'));
        return;
      }

      if (e.code === 'Escape') {
        const shopModal = document.getElementById('shop-modal');
        if (!shopModal.classList.contains('hidden')) {
          shopModal.classList.add('hidden');
          this.isPaused = false;
          return;
        }
      }

      if (this.isPaused) return;

      // Enter / Exit Vehicle (F or Enter)
      if (e.code === 'KeyF' || e.code === 'Enter') {
        this.toggleVehicleEnterExit();
      }

      // Cycle Weapon (Q / E)
      if (e.code === 'KeyQ') this.cycleWeapon(-1);
      if (e.code === 'KeyE') this.cycleWeapon(1);

      // Switch Radio Station (R)
      if (e.code === 'KeyR' && this.player.inVehicle) {
        const st = saAudio.nextStation();
        this.showRadioPopup(st);
      }

      // Lowrider Hydraulics / Horn (H)
      if (e.code === 'KeyH' && this.player.inVehicle) {
        const v = this.player.inVehicle;
        saAudio.playHorn(v.lowrider);
        if (v.lowrider) {
          v.hydraulicBounce = 1.0;
          this.showSubtitle(`<span style="color:#69f0ae">CJ:</span> "¡Mira cómo rebota esta suspensión hidráulica de Grove Street!"`);
        }
      }

      // Recruit Grove Street Homie (G)
      if (e.code === 'KeyG' && !this.player.inVehicle) {
        this.tryRecruitGroveHomie();
      }

      // Toggle Jetpack (J)
      if (e.code === 'KeyJ' && !this.player.inVehicle) {
        this.toggleJetpack(!this.player.jetpack);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  toggleCheatsModal(open) {
    const modal = document.getElementById('cheats-modal');
    if (open) {
      modal.classList.remove('hidden');
      this.isPaused = true;
      document.exitPointerLock?.();
      this.refreshStatsModal();
    } else {
      modal.classList.add('hidden');
      this.isPaused = false;
      this.container.requestPointerLock?.();
    }
  }

  refreshStatsModal() {
    document.getElementById('st-respect').style.width = `${Math.min(100, this.player.stats.respect)}%`;
    document.getElementById('st-stamina').style.width = `${Math.min(100, this.player.stats.stamina)}%`;
    document.getElementById('st-muscle').style.width = `${Math.min(100, this.player.stats.muscle)}%`;

    const groveTurfs = this.world.turfs.filter((t) => t.owner === 'grove').length;
    document.getElementById('st-turfs').textContent = `${groveTurfs} / ${this.world.turfs.length}`;

    const sprayedTags = this.world.graffitiTags.filter((t) => t.sprayed).length;
    document.getElementById('st-tags').textContent = `${sprayedTags} / ${this.world.graffitiTags.length}`;

    document.getElementById('st-missions').textContent = `${this.missions.completedCount} / 5`;
  }

  /* ------------------- WEAPONS, RECRUITING & JETPACK ------------------- */
  giveWeapon(weaponId, ammoAmount = 60, selectImmediately = false) {
    const slot = this.player.weapons[weaponId];
    if (!slot) return;
    slot.owned = true;
    slot.ammo = Math.min(9999, slot.ammo + ammoAmount);
    if (selectImmediately) {
      this.selectWeapon(weaponId);
    }
    this.updateHUD();
  }

  selectWeapon(weaponId) {
    if (!this.player.weapons[weaponId] || !this.player.weapons[weaponId].owned) return;
    this.player.currentWeapon = weaponId;
    this.updatePlayerHandWeaponMesh();
    this.updateHUD();
  }

  cycleWeapon(dir) {
    const order = ['fist', 'bat', 'pistol', 'uzi', 'shotgun', 'ak47', 'rpg', 'spray'];
    const owned = order.filter((id) => this.player.weapons[id].owned);
    if (owned.length <= 1) return;
    const idx = owned.indexOf(this.player.currentWeapon);
    const nextIdx = (idx + dir + owned.length) % owned.length;
    saAudio.playMenuHover();
    this.selectWeapon(owned[nextIdx]);
  }

  toggleJetpack(enable) {
    if (this.player.inVehicle) return;
    this.player.jetpack = enable;
    if (this.playerMesh.userData.jetpackGroup) {
      this.playerMesh.userData.jetpackGroup.visible = enable;
    }
    if (enable) {
      this.selectWeapon('uzi');
      this.giveWeapon('uzi', 150, true);
    }
  }

  tryRecruitGroveHomie() {
    let closest = null;
    let bestD = 12;
    this.entities.npcs.forEach((npc) => {
      if (npc.role === 'grove' && npc.state !== 'dead' && !npc.recruited) {
        const d = npc.mesh.position.distanceTo(this.player.pos);
        if (d < bestD) {
          bestD = d;
          closest = npc;
        }
      }
    });

    if (closest) {
      closest.recruited = true;
      saAudio.playCheatSound();
      this.addStat('respect', 5, 'RESPECT');
      this.showSubtitle(`<span style="color:#69f0ae">Grove Homie:</span> "¡Grove Street 4 Life, CJ! Te cubro la espalda, hermano."`);
    } else {
      this.showHelpNotification('Acércate a un miembro de <b>Grove Street (ropa verde)</b> y pulsa <b>G</b> para reclutarlo.');
    }
  }

  /* ------------------- VEHICLE ENTER / EXIT & SPAWN ------------------- */
  toggleVehicleEnterExit() {
    if (this.player.inVehicle) {
      this.exitVehicle();
      return;
    }

    // Find closest vehicle within 5.5m
    let closest = null;
    let minD = 5.5;
    this.entities.vehicles.forEach((v) => {
      if (!v.exploded) {
        const d = v.mesh.position.distanceTo(this.player.pos);
        if (d < minD) {
          minD = d;
          closest = v;
        }
      }
    });

    if (closest) {
      if (this.player.jetpack) this.toggleJetpack(false);
      this.player.inVehicle = closest;
      closest.driver = 'player';
      this.playerMesh.visible = closest.type === 'bmx' || closest.type === 'sanchez';

      // Show vehicle name in bottom-right gothic script + start Radio
      this.showVehiclePopup(closest.displayName);
      if (closest.type !== 'bmx') {
        saAudio.startRadio();
        this.showRadioPopup(saAudio.radioStations[saAudio.currentStationIndex]);
      }

      // Stealing a Police car adds 1 Wanted Star unless AEZAKMI is active
      if (closest.police && !this.cheats.neverWanted && this.player.wanted === 0) {
        this.setWantedLevel(1);
      }
    }
  }

  exitVehicle() {
    const v = this.player.inVehicle;
    if (!v) return;
    v.driver = null;
    this.player.inVehicle = null;
    this.playerMesh.visible = true;
    this.player.pos.set(
      v.mesh.position.x - Math.cos(v.mesh.rotation.y) * 2.4,
      Math.max(0, v.mesh.position.y),
      v.mesh.position.z + Math.sin(v.mesh.rotation.y) * 2.4
    );
    saAudio.stopRadio();
    document.getElementById('radio-display').classList.add('hidden');
  }

  spawnVehicleInFront(type) {
    const dist = 6.5;
    const sx = this.player.pos.x - Math.sin(this.camYaw) * dist;
    const sz = this.player.pos.z - Math.cos(this.camYaw) * dist;
    this.entities.spawnVehicle(type, sx, sz, this.camYaw + Math.PI);
  }

  /* ------------------- MAIN GAME LOOP ------------------- */
  animate(now) {
    requestAnimationFrame((t) => this.animate(t));
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    const timeSec = now * 0.001;

    if (!this.isPaused) {
      this.updateClockAndSky(dt);
      this.updatePlayer(dt, timeSec);
      this.world.update(dt, timeSec);
      this.entities.update(dt, timeSec, this);
      this.missions.update(dt, this);
      this.checkPickupsAndShops(dt);
      this.updateCamera();
      this.updateTargetIndicator();
      this.updateHUD();
      this.renderRadar(timeSec);
    }

    this.renderer.render(this.scene, this.camera);
  }

  /* ------------------- CLOCK & LOS SANTOS SUNSET CYCLE ------------------- */
  updateClockAndSky(dt) {
    this.clockAccum += dt;
    if (this.clockAccum >= 1.0) {
      this.clockAccum = 0;
      this.gameMinute = (this.gameMinute + 1) % 60;
      if (this.gameMinute === 0) {
        this.gameHour = (this.gameHour + 1) % 24;
      }
    }

    // Dynamic sky tint based on time of day
    const h = this.gameHour + this.gameMinute / 60;
    let skyHex = 0xe89954; // Sunset Orange default
    if (h >= 7 && h < 16) {
      skyHex = 0x64b5f6; // Daytime Los Santos Blue
    } else if (h >= 16 && h < 20.5) {
      skyHex = 0xe89954; // Iconic PS2 Golden Orange Sunset
    } else {
      skyHex = 0x101828; // Nighttime Los Santos
    }
    this.scene.background.lerp(new THREE.Color(skyHex), dt * 0.8);
    this.scene.fog.color.copy(this.scene.background);
  }

  /* ------------------- UPDATE CJ MOVEMENT, JETPACK, SWIMMING & SHOOTING ------------------- */
  updatePlayer(dt, time) {
    if (this.player.isWasted) return;

    // Wanted Level gradual decay if no cops are near
    if (this.player.wanted > 0 && !this.cheats.neverWanted) {
      this.player.wantedDecayTimer += dt;
      if (this.player.wantedDecayTimer > 42) {
        this.player.wantedDecayTimer = 0;
        this.setWantedLevel(this.player.wanted - 1);
      }
    }

    // Police Siren audio check
    const copNear = this.entities.npcs.some((n) => n.role === 'cop' && n.state !== 'dead') || this.player.wanted >= 2;
    saAudio.updateVehicleAudio(
      !!this.player.inVehicle,
      this.player.inVehicle ? this.player.inVehicle.speed : 0,
      this.player.inVehicle ? this.player.inVehicle.type : '',
      copNear
    );

    // 1. IF DRIVING A VEHICLE
    if (this.player.inVehicle) {
      const v = this.player.inVehicle;
      this.player.pos.copy(v.mesh.position);
      this.player.rotY = v.mesh.rotation.y;

      // If on BMX or Sanchez, keep CJ seated on the frame
      if (this.playerMesh.visible) {
        this.playerMesh.position.set(v.mesh.position.x, v.mesh.position.y + 0.15, v.mesh.position.z);
        this.playerMesh.rotation.y = v.mesh.rotation.y;
      }

      // Tank Cannon or Hunter Helicopter Rockets on Left-Click
      this.player.shootTimer = Math.max(0, this.player.shootTimer - dt);
      if (this.mouseDownLeft && this.player.shootTimer <= 0 && (v.isTank || v.isHelicopter)) {
        this.player.shootTimer = 0.9;
        saAudio.playGunshot('rpg');
        const dir = new THREE.Vector3(-Math.sin(this.camYaw), -Math.sin(this.camPitch) * 0.3, -Math.cos(this.camYaw)).normalize();
        const start = v.mesh.position.clone().add(new THREE.Vector3(0, 1.8, 0)).addScaledVector(dir, 3.5);
        this.entities.fireRocket(start, dir);
      }

      this.checkDistrictChange();
      return;
    }

    // 2. ON FOOT / JETPACK MOVEMENT
    let moveX = 0;
    let moveZ = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX += 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX -= 1;

    const isMoving = moveX !== 0 || moveZ !== 0;
    const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const inWater = this.player.pos.z > 205 && this.player.pos.y <= 0.3;

    // Breath bar in ocean water
    const breathBox = document.getElementById('breath-bar-container');
    if (inWater) {
      breathBox.classList.remove('hidden');
      this.player.breath = Math.max(0, this.player.breath - dt * 4);
      document.getElementById('breath-bar-fill').style.width = `${this.player.breath}%`;
    } else {
      breathBox.classList.add('hidden');
      this.player.breath = 100;
    }

    // Forward & Right vectors relative to camera yaw
    const forwardX = -Math.sin(this.camYaw);
    const forwardZ = -Math.cos(this.camYaw);
    const rightX = -Math.cos(this.camYaw);
    const rightZ = Math.sin(this.camYaw);

    if (isMoving) {
      const worldDirX = forwardX * moveZ + rightX * moveX;
      const worldDirZ = forwardZ * moveZ + rightZ * moveX;
      const len = Math.hypot(worldDirX, worldDirZ) || 1;
      const dx = worldDirX / len;
      const dz = worldDirZ / len;

      const moveSpeed = this.player.jetpack ? 19 : isSprinting ? 11.5 : 6.8;
      const nx = this.player.pos.x + dx * moveSpeed * dt;
      const nz = this.player.pos.z + dz * moveSpeed * dt;

      const hit = this.player.pos.y < 7.5 ? this.world.checkBuildingCollision(nx, nz, 0.55) : null;
      if (!hit) {
        this.player.pos.x = nx;
        this.player.pos.z = nz;
      }

      if (!this.mouseDownRight) {
        this.player.rotY = Math.atan2(dx, dz);
      }

      // Limb walk/sprint cycle
      this.player.walkCycle += dt * (isSprinting ? 14 : 9);
      const swing = this.player.jetpack ? 0.15 : Math.sin(this.player.walkCycle) * (isSprinting ? 0.75 : 0.5);
      this.playerMesh.userData.leftLegGroup.rotation.x = swing;
      this.playerMesh.userData.rightLegGroup.rotation.x = -swing;
      this.playerMesh.userData.leftArmGroup.rotation.x = -swing * 0.7;
      if (!this.mouseDownRight && !this.mouseDownLeft) {
        this.playerMesh.userData.rightArmGroup.rotation.x = swing * 0.7;
      }
    } else {
      // Idle pose
      this.playerMesh.userData.leftLegGroup.rotation.x = 0;
      this.playerMesh.userData.rightLegGroup.rotation.x = 0;
      this.playerMesh.userData.leftArmGroup.rotation.x = 0;
      if (!this.mouseDownRight && !this.mouseDownLeft) {
        this.playerMesh.userData.rightArmGroup.rotation.x = 0;
      }
    }

    // Jetpack Vertical Flight vs Ground Jumping & Gravity
    if (this.player.jetpack) {
      if (this.keys['Space'] || this.keys['ShiftLeft']) {
        this.player.pos.y = Math.min(85, this.player.pos.y + 15 * dt);
      } else if (this.keys['ControlLeft'] || this.keys['KeyC']) {
        this.player.pos.y = Math.max(0, this.player.pos.y - 14 * dt);
      } else if (this.player.pos.y > 0) {
        // Gentle hover
        this.player.pos.y = Math.max(0, this.player.pos.y - 1.5 * dt);
      }
      // Flicker jetpack flames
      this.playerMesh.userData.jetpackFlames.forEach((f) => {
        f.scale.y = 0.8 + Math.random() * 0.6;
      });
    } else {
      // Jump on Space
      if (this.keys['Space'] && this.player.pos.y <= 0.05 && this.player.velY === 0) {
        this.player.velY = this.cheats.megaJump ? 28 : 9.2;
      }
      if (this.player.pos.y > 0 || this.player.velY !== 0) {
        this.player.velY -= 24 * dt;
        this.player.pos.y += this.player.velY * dt;
        if (this.player.pos.y <= 0) {
          this.player.pos.y = 0;
          this.player.velY = 0;
        }
      }
    }

    // Aiming & Shooting
    const crosshair = document.getElementById('crosshair');
    if (this.mouseDownRight || this.mouseDownLeft) {
      crosshair.classList.remove('hidden');
      this.player.rotY = this.camYaw + Math.PI;
      this.playerMesh.userData.rightArmGroup.rotation.x = -Math.PI / 2 + this.camPitch * 0.5;
    } else {
      crosshair.classList.add('hidden');
    }

    this.player.shootTimer = Math.max(0, this.player.shootTimer - dt);
    if (this.mouseDownLeft && this.player.shootTimer <= 0) {
      this.performAttack();
    }

    this.playerMesh.position.copy(this.player.pos);
    this.playerMesh.rotation.y = this.player.rotY;

    this.checkDistrictChange();
  }

  /* ------------------- PERFORM WEAPON ATTACK / SPRAY GRAFFITI ------------------- */
  performAttack() {
    const wId = this.player.currentWeapon;
    const spec = this.weaponCatalog[wId];
    const slot = this.player.weapons[wId];

    if (spec.clipSize > 0 && !this.cheats.infiniteAmmo && wId !== 'spray') {
      if (slot.ammo <= 0) {
        this.selectWeapon('fist');
        return;
      }
      slot.ammo--;
    }

    this.player.shootTimer = spec.fireRate;
    saAudio.playGunshot(wId);

    // Punch / Bat swing animation
    if (wId === 'fist' || wId === 'bat') {
      this.playerMesh.userData.rightArmGroup.rotation.x = -Math.PI * 0.75;
    }

    // 1. SPRAY CAN: Check nearby Ballas Graffiti Tags!
    if (wId === 'spray') {
      const sprayPos = this.player.pos.clone().add(
        new THREE.Vector3(-Math.sin(this.camYaw) * 1.5, 1.5, -Math.cos(this.camYaw) * 1.5)
      );
      this.entities.spawnParticle(sprayPos.x, sprayPos.y, sprayPos.z, 0x00e676, 0.35, 0.35);

      this.world.graffitiTags.forEach((tag) => {
        if (!tag.sprayed) {
          const d = Math.hypot(this.player.pos.x - tag.x, this.player.pos.z - tag.z);
          if (d < 5.5) {
            this.world.markTagSprayed(tag);
            const totalSprayed = this.world.graffitiTags.filter((t) => t.sprayed).length;
            saAudio.playCheatSound();
            this.addMoney(250);
            this.addStat('respect', 8, 'RESPECT');
            this.showBigBanner('GRAFFITI PINTADO', `${totalSprayed} DE ${this.world.graffitiTags.length} TAGS EN LOS SANTOS<br>+$250 | RESPECT +`);
          }
        }
      });
      return;
    }

    // 2. ROCKET LAUNCHER (RPG)
    const lookDir = new THREE.Vector3(
      -Math.sin(this.camYaw) * Math.cos(this.camPitch),
      -Math.sin(this.camPitch),
      -Math.cos(this.camYaw) * Math.cos(this.camPitch)
    ).normalize();

    if (wId === 'rpg') {
      const start = this.player.pos.clone().add(new THREE.Vector3(0, 1.6, 0)).addScaledVector(lookDir, 1.5);
      this.entities.fireRocket(start, lookDir);
      return;
    }

    // 3. BULLET / MELEE HIT DETECTION
    const muzzlePos = this.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)).addScaledVector(lookDir, 0.9);
    if (wId !== 'fist' && wId !== 'bat') {
      this.entities.spawnMuzzleFlash(muzzlePos.x, muzzlePos.y, muzzlePos.z);
    }

    // Check if aiming at Locked Target NPC or NPC along sight ray
    if (this.lockedTargetNPC && this.lockedTargetNPC.state !== 'dead') {
      const dist = this.lockedTargetNPC.mesh.position.distanceTo(this.player.pos);
      if (dist <= spec.range) {
        this.entities.damageNPC(this.lockedTargetNPC, spec.damage, this, true);
        return;
      }
    }

    // Check Explosive Gas Pumps
    this.world.explosivePumps.forEach((pump) => {
      if (!pump.exploded && wId !== 'fist' && wId !== 'bat') {
        const toPump = new THREE.Vector3(pump.x - this.player.pos.x, 0, pump.z - this.player.pos.z);
        const dist = toPump.length();
        toPump.normalize();
        const dot = toPump.x * lookDir.x + toPump.z * lookDir.z;
        if (dist < spec.range && dot > 0.92) {
          this.entities.triggerGasPumpExplosion(pump, this);
        }
      }
    });

    // Check Vehicles along ray
    if (wId !== 'fist') {
      this.entities.vehicles.forEach((v) => {
        if (!v.exploded) {
          const toVeh = new THREE.Vector3(v.mesh.position.x - this.player.pos.x, 0, v.mesh.position.z - this.player.pos.z);
          const dist = toVeh.length();
          toVeh.normalize();
          const dot = toVeh.x * lookDir.x + toVeh.z * lookDir.z;
          if (dist < spec.range && dot > 0.92) {
            v.hp -= spec.damage;
            this.entities.spawnParticle(v.mesh.position.x, 1.1, v.mesh.position.z, 0xffeb3b, 0.28, 0.25);
          }
        }
      });
    }
  }

  /* ------------------- TARGET LOCK-ON INDICATOR (3 TRIANGLES ABOVE NPC) ------------------- */
  updateTargetIndicator() {
    const ind = document.getElementById('target-indicator');
    this.lockedTargetNPC = null;

    if (this.player.inVehicle) {
      ind.classList.add('hidden');
      return;
    }

    const lookDir = new THREE.Vector3(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw)).normalize();
    const spec = this.weaponCatalog[this.player.currentWeapon];
    let bestNPC = null;
    let bestScore = 0.85;

    this.entities.npcs.forEach((npc) => {
      if (npc.state === 'dead' || npc.recruited) return;
      const toNPC = new THREE.Vector3(
        npc.mesh.position.x - this.player.pos.x,
        0,
        npc.mesh.position.z - this.player.pos.z
      );
      const dist = toNPC.length();
      if (dist > Math.max(16, spec.range)) return;
      toNPC.normalize();
      const dot = toNPC.x * lookDir.x + toNPC.z * lookDir.z;
      if (dot > bestScore) {
        bestScore = dot;
        bestNPC = npc;
      }
    });

    if (bestNPC && (this.mouseDownRight || bestNPC.state === 'attack')) {
      this.lockedTargetNPC = bestNPC;
      const headWorld = bestNPC.mesh.position.clone().add(new THREE.Vector3(0, 2.55, 0));
      headWorld.project(this.camera);

      if (headWorld.z < 1) {
        const sx = (headWorld.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-headWorld.y * 0.5 + 0.5) * window.innerHeight;
        ind.style.left = `${sx}px`;
        ind.style.top = `${sy}px`;
        ind.classList.remove('hidden');

        // Color triangles based on NPC HP ratio (Green -> Yellow -> Red)
        const ratio = bestNPC.hp / bestNPC.maxHp;
        const triColor = ratio > 0.6 ? '#00e676' : ratio > 0.3 ? '#ffeb3b' : '#ff1744';
        document.querySelectorAll('#target-indicator .tri-down').forEach((el) => {
          el.style.borderTopColor = triColor;
        });
        return;
      }
    }

    ind.classList.add('hidden');
  }

  /* ------------------- PICKUPS & SHOPS (PAY 'N' SPRAY, AMMU-NATION, PIZZA) ------------------- */
  checkPickupsAndShops(dt) {
    const px = this.player.pos.x;
    const pz = this.player.pos.z;

    // 1. Floating Pickups
    this.world.pickups.forEach((p) => {
      if (p.cooldown > 0) return;
      const d = Math.hypot(px - p.x, pz - p.z);
      if (d < 2.1) {
        p.cooldown = 30;
        p.mesh.visible = false;
        saAudio.playPickupSound();

        if (p.type === 'health') {
          this.player.hp = 100;
          this.showHelpNotification('Has recogido un <b>Corazón de Salud (+100 HP)</b>.');
        } else if (p.type === 'armor') {
          this.player.armor = 100;
          this.showHelpNotification('Has recogido un <b>Chaleco Antibalas (+100%)</b>.');
        } else if (p.type === 'bribe') {
          this.setWantedLevel(Math.max(0, this.player.wanted - 1));
          this.showHelpNotification('<b>¡Soborno Policial recogido!</b> Tu nivel de búsqueda ha bajado.');
        } else if (p.type === 'cash') {
          this.addMoney(500);
        } else if (p.type === 'weapon') {
          this.giveWeapon(p.weaponId, 120, true);
          this.showHelpNotification(`Has recogido: <b>${p.label}</b>`);
        }
      }
    });

    // 2. Interactive Shops (Pay 'n' Spray, Ammu-Nation, Well Stacked Pizza)
    this.shopCooldown = Math.max(0, this.shopCooldown - dt);
    if (this.shopCooldown > 0) return;

    this.world.interactiveZones.forEach((iz) => {
      const d = Math.hypot(px - iz.x, pz - iz.z);
      if (d < iz.radius) {
        if (iz.id === 'paynspray' && this.player.inVehicle) {
          this.shopCooldown = 8.0;
          const v = this.player.inVehicle;
          v.hp = v.maxHp;
          if (v.mesh.userData.bodyMat) {
            const colors = [0x2e7d32, 0xd32f2f, 0x1976d2, 0xfbc02d, 0x8e24aa, 0x00897b];
            v.mesh.userData.bodyMat.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
          }
          this.setWantedLevel(0);
          saAudio.playCheatSound();
          this.showBigBanner("PAY 'N' SPRAY", 'VEHÍCULO REPARADO Y REPINTADO<br>ESTRELLAS DE BÚSQUEDA ELIMINADAS');
        } else if (iz.id === 'ammunation' && !this.player.inVehicle) {
          this.shopCooldown = 5.0;
          this.openShopModal('ammunation');
        } else if (iz.id === 'pizza' && !this.player.inVehicle) {
          this.shopCooldown = 5.0;
          this.openShopModal('pizza');
        }
      }
    });
  }

  openShopModal(shopType) {
    this.isPaused = true;
    document.exitPointerLock?.();
    const modal = document.getElementById('shop-modal');
    const title = document.getElementById('shop-title');
    const subtitle = document.getElementById('shop-subtitle');
    const itemsContainer = document.getElementById('shop-items');
    itemsContainer.innerHTML = '';

    let catalog = [];
    if (shopType === 'ammunation') {
      title.textContent = 'AMMU-NATION LOS SANTOS';
      subtitle.textContent = '"Protege a tu familia en Los Santos desde 1962"';
      catalog = [
        { name: 'Pistola 9mm Colt (+68 balas)', price: 200, action: () => this.giveWeapon('pistol', 68, true) },
        { name: 'Micro SMG Tec-9 (+120 balas)', price: 350, action: () => this.giveWeapon('uzi', 120, true) },
        { name: 'Escopeta Cromada (+32 cartuchos)', price: 600, action: () => this.giveWeapon('shotgun', 32, true) },
        { name: 'Rifle de Asalto AK-47 (+120 balas)', price: 1200, action: () => this.giveWeapon('ak47', 120, true) },
        { name: 'Lanzacohetes RPG-7 (+10 cohetes)', price: 2500, action: () => this.giveWeapon('rpg', 10, true) },
        { name: 'Chaleco Antibalas Completo (100%)', price: 200, action: () => { this.player.armor = 100; } }
      ];
    } else {
      title.textContent = 'THE WELL STACKED PIZZA CO.';
      subtitle.textContent = '"¡El menú favorito de Big Smoke en Idlewood!"';
      catalog = [
        { name: 'Menú Buster (+40 Salud)', price: 10, action: () => { this.player.hp = Math.min(100, this.player.hp + 40); } },
        { name: 'Menú Double D-Luxe (+75 Salud)', price: 25, action: () => { this.player.hp = Math.min(100, this.player.hp + 75); } },
        { name: 'El Pedido de Big Smoke (Dos Nº9, Nº6 con extra salsa — 100% Salud)', price: 50, action: () => { this.player.hp = 100; this.addStat('muscle', 5, 'MUSCLE'); } }
      ];
    }

    catalog.forEach((item) => {
      const btn = document.createElement('button');
      btn.className = 'shop-item-btn';
      btn.innerHTML = `<span>${item.name}</span><span class="shop-item-price">$${item.price}</span>`;
      btn.addEventListener('click', () => {
        if (this.player.money >= item.price) {
          this.player.money -= item.price;
          item.action();
          saAudio.playPickupSound();
          this.updateHUD();
        } else {
          saAudio.playMenuHover();
          this.showHelpNotification('No tienes suficiente dinero. Usa <b>HESOYAM</b> o recoge dinero en las calles.');
        }
      });
      itemsContainer.appendChild(btn);
    });

    modal.classList.remove('hidden');
  }

  /* ------------------- DAMAGE, WASTED & BUSTED ------------------- */
  damagePlayer(amount) {
    if (this.cheats.godMode || this.player.isWasted) return;

    // Red flash vignette
    const flash = document.getElementById('damage-flash');
    flash.style.opacity = '0.85';
    setTimeout(() => { flash.style.opacity = '0'; }, 160);

    if (this.player.armor > 0) {
      const absorb = Math.min(this.player.armor, amount * 0.75);
      this.player.armor -= absorb;
      amount -= absorb;
    }

    this.player.hp = Math.max(0, this.player.hp - amount);
    if (this.player.hp <= 0) {
      this.triggerWastedOrBusted();
    }
  }

  triggerWastedOrBusted() {
    this.player.isWasted = true;
    const isBusted = this.player.wanted > 0 && this.entities.npcs.some(
      (n) => n.role === 'cop' && n.state !== 'dead' && n.mesh.position.distanceTo(this.player.pos) < 6
    );

    if (this.player.inVehicle) this.exitVehicle();
    this.playerMesh.rotation.x = -Math.PI / 2;
    saAudio.playWastedSound();

    if (isBusted) {
      this.showBigBanner('ARRESTADO (BUSTED)', 'COMISARÍA DE PERSHING SQUARE (-$100)');
    } else {
      this.showBigBanner('ELIMINADO (WASTED)', 'HOSPITAL GENERAL ALL SAINTS (-$100)');
    }

    setTimeout(() => {
      this.player.isWasted = false;
      this.player.hp = 100;
      this.player.money = Math.max(0, this.player.money - 100);
      this.setWantedLevel(0);
      this.playerMesh.rotation.x = 0;
      // Respawn at Grove Street or Hospital
      this.player.pos.set(isBusted ? -152 : -152, 0, isBusted ? -38 : 38);
      this.showZonePopup('Downtown Los Santos');
    }, 3400);
  }

  /* ------------------- CAMERA ORBIT ------------------- */
  updateCamera() {
    const isVeh = !!this.player.inVehicle;
    const isAiming = this.mouseDownRight && !isVeh;
    const dist = isVeh ? 9.8 : isAiming ? 3.4 : 6.2;
    const heightOffset = isVeh ? 2.6 : isAiming ? 1.85 : 2.1;

    const targetPos = this.player.pos.clone().add(new THREE.Vector3(0, heightOffset, 0));
    if (isAiming) {
      // Over-the-right-shoulder camera shift
      targetPos.x += Math.cos(this.camYaw) * 0.65;
      targetPos.z -= Math.sin(this.camYaw) * 0.65;
    }

    const camX = targetPos.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * dist;
    const camY = Math.max(0.6, targetPos.y + Math.sin(this.camPitch) * dist);
    const camZ = targetPos.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * dist;

    this.camera.position.set(camX, camY, camZ);
    const lookTarget = targetPos.clone().add(
      new THREE.Vector3(
        -Math.sin(this.camYaw) * 6,
        -Math.sin(this.camPitch) * 4,
        -Math.cos(this.camYaw) * 6
      )
    );
    this.camera.lookAt(lookTarget);
  }

  /* ------------------- HUD, POPUPS & BANNERS ------------------- */
  updateHUD() {
    // Clock
    const hh = String(this.gameHour).padStart(2, '0');
    const mm = String(this.gameMinute).padStart(2, '0');
    document.getElementById('hud-clock').textContent = `${hh}:${mm}`;

    // Health & Armor Bars
    document.getElementById('health-bar-fill').style.width = `${Math.max(0, this.player.hp)}%`;
    const armorCont = document.getElementById('armor-bar-container');
    if (this.player.armor > 0) {
      armorCont.classList.remove('hidden');
      document.getElementById('armor-bar-fill').style.width = `${Math.max(0, this.player.armor)}%`;
    } else {
      armorCont.classList.add('hidden');
    }

    // Money ($00000350)
    const formattedMoney = '$' + String(Math.floor(this.player.money)).padStart(8, '0');
    document.getElementById('hud-money').textContent = formattedMoney;

    // Weapon Icon & Ammo
    const wSpec = this.weaponCatalog[this.player.currentWeapon];
    const wSlot = this.player.weapons[this.player.currentWeapon];
    document.getElementById('weapon-icon-svg').textContent = wSpec.icon;
    document.getElementById('weapon-name-mini').textContent = wSpec.name;
    document.getElementById('weapon-ammo').textContent =
      wSpec.clipSize > 0
        ? this.cheats.infiniteAmmo
          ? '∞'
          : `${wSlot.ammo}-${wSpec.clipSize}`
        : '';

    // Wanted Stars (1–6)
    document.querySelectorAll('#hud-wanted .star').forEach((starEl) => {
      const idx = Number(starEl.getAttribute('data-star'));
      starEl.classList.toggle('active', idx <= this.player.wanted);
    });

    // Vehicle Speedometer & Mini HP
    const speedo = document.getElementById('vehicle-speedo');
    if (this.player.inVehicle) {
      speedo.classList.remove('hidden');
      const kmh = Math.round(Math.abs(this.player.inVehicle.speed) * 3.8);
      document.getElementById('speedo-val').textContent = kmh;
      const vRatio = Math.max(0, (this.player.inVehicle.hp / this.player.inVehicle.maxHp) * 100);
      document.getElementById('vehicle-hp-fill').style.width = `${vRatio}%`;
    } else {
      speedo.classList.add('hidden');
    }
  }

  addMoney(amount) {
    this.player.money += amount;
    this.updateHUD();
  }

  setWantedLevel(level) {
    this.player.wanted = Math.max(0, Math.min(6, level));
    this.player.wantedDecayTimer = 0;
    this.updateHUD();
  }

  addStat(statKey, delta, label) {
    this.player.stats[statKey] = Math.min(100, (this.player.stats[statKey] || 50) + delta);
    const box = document.getElementById('stat-popup');
    document.getElementById('stat-popup-label').textContent = label;
    document.getElementById('stat-popup-fill').style.width = `${this.player.stats[statKey]}%`;
    box.classList.remove('hidden');
    clearTimeout(this.statPopupTimeout);
    this.statPopupTimeout = setTimeout(() => box.classList.add('hidden'), 3200);
  }

  showCheatBanner(text) {
    const box = document.getElementById('cheat-box');
    box.textContent = text;
    box.classList.remove('hidden');
    clearTimeout(this.cheatBannerTimeout);
    this.cheatBannerTimeout = setTimeout(() => box.classList.add('hidden'), 3800);
  }

  showHelpNotification(html) {
    const box = document.getElementById('help-box');
    box.innerHTML = html;
    box.classList.remove('hidden');
    clearTimeout(this.helpTimeout);
    this.helpTimeout = setTimeout(() => box.classList.add('hidden'), 6500);
  }

  showSubtitle(html) {
    const cont = document.getElementById('subtitle-container');
    const txt = document.getElementById('subtitle-text');
    txt.innerHTML = html;
    cont.classList.remove('hidden');
    clearTimeout(this.subTimeout);
    this.subTimeout = setTimeout(() => cont.classList.add('hidden'), 5200);
  }

  showBigBanner(mainText, subHtml) {
    const b = document.getElementById('center-banner');
    const m = document.getElementById('banner-main-text');
    const s = document.getElementById('banner-sub-text');
    m.textContent = mainText;
    s.innerHTML = subHtml;

    if (mainText.includes('WASTED') || mainText.includes('ELIMINADO')) {
      m.style.color = '#d32f2f';
    } else if (mainText.includes('BUSTED') || mainText.includes('ARRESTADO')) {
      m.style.color = '#64b5f6';
    } else {
      m.style.color = '#e5a93c';
    }

    b.classList.remove('hidden');
    clearTimeout(this.bigBannerTimeout);
    this.bigBannerTimeout = setTimeout(() => b.classList.add('hidden'), 4200);
  }

  showVehiclePopup(name) {
    const el = document.getElementById('vehicle-name-popup');
    el.textContent = name;
    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'fadeInOut 3.8s forwards';
  }

  showZonePopup(name) {
    const el = document.getElementById('zone-name-popup');
    el.textContent = name;
    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'fadeInOut 4.2s forwards';
  }

  showRadioPopup(station) {
    const box = document.getElementById('radio-display');
    document.getElementById('radio-station-name').textContent = station.name;
    document.getElementById('radio-station-genre').textContent = station.genre;
    box.classList.remove('hidden');
    clearTimeout(this.radioPopupTimeout);
    this.radioPopupTimeout = setTimeout(() => box.classList.add('hidden'), 3200);
  }

  checkDistrictChange() {
    const zName = this.world.getZoneNameAt(this.player.pos.x, this.player.pos.z);
    if (zName !== this.player.currentZone) {
      this.player.currentZone = zName;
      this.showZonePopup(zName);
    }
  }

  /* ------------------- ROTATING 2D CIRCULAR RADAR / MINIMAP ------------------- */
  renderRadar(time) {
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.85; // World meters to radar pixels

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#37474f';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.camYaw);
    ctx.translate(-this.player.pos.x * scale, -this.player.pos.z * scale);

    // 1. Gang Turf Colored Overlays (Green = Grove, Purple = Ballas, Yellow = Vagos)
    this.world.turfs.forEach((turf) => {
      if (turf.underAttack && Math.sin(time * 10) > 0) {
        ctx.fillStyle = 'rgba(229, 57, 53, 0.45)';
      } else if (turf.owner === 'grove') {
        ctx.fillStyle = 'rgba(67, 160, 71, 0.35)';
      } else if (turf.owner === 'ballas') {
        ctx.fillStyle = 'rgba(142, 36, 170, 0.35)';
      } else {
        ctx.fillStyle = 'rgba(253, 216, 53, 0.32)';
      }
      ctx.fillRect(
        turf.minX * scale,
        turf.minZ * scale,
        (turf.maxX - turf.minX) * scale,
        (turf.maxZ - turf.minZ) * scale
      );
    });

    // 2. Ocean Water on South
    ctx.fillStyle = '#0277bd';
    ctx.fillRect(-300 * scale, 165 * scale, 600 * scale, 200 * scale);

    // 3. Roads & Grove Street Cul-de-Sac on Radar
    ctx.fillStyle = '#78909c';
    ctx.fillRect(-235 * scale, -8 * scale, 240 * scale, 16 * scale);
    ctx.fillRect(-94 * scale, -170 * scale, 18 * scale, 340 * scale);
    ctx.fillRect(-205 * scale, -170 * scale, 20 * scale, 340 * scale);
    ctx.fillRect(87 * scale, -160 * scale, 16 * scale, 320 * scale);

    ctx.beginPath();
    ctx.arc(0, 0, 22 * scale, 0, Math.PI * 2);
    ctx.fill();

    // 4. Buildings
    ctx.fillStyle = '#263238';
    this.world.colliders.forEach((c) => {
      ctx.fillRect(
        c.minX * scale,
        c.minZ * scale,
        (c.maxX - c.minX) * scale,
        (c.maxZ - c.minZ) * scale
      );
    });

    // 5. Vehicles on Radar
    this.entities.vehicles.forEach((v) => {
      if (v.exploded || v.driver === 'player') return;
      ctx.fillStyle = v.police ? '#29b6f6' : '#cfd8dc';
      ctx.fillRect(v.mesh.position.x * scale - 2.5, v.mesh.position.z * scale - 2.5, 5, 5);
    });

    // 6. NPCs on Radar (Green = Recruited Homie, Red = Hostile Enemy/Cop)
    this.entities.npcs.forEach((n) => {
      if (n.state === 'dead') return;
      if (n.recruited) {
        ctx.fillStyle = '#00e676';
      } else if (n.state === 'attack' || n.missionTag) {
        ctx.fillStyle = '#ff1744';
      } else {
        return;
      }
      ctx.beginPath();
      ctx.arc(n.mesh.position.x * scale, n.mesh.position.z * scale, 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 7. Interactive Shop Blips (Pay 'n' Spray, Ammu-Nation, Pizza)
    this.world.interactiveZones.forEach((iz) => {
      ctx.fillStyle = iz.id === 'paynspray' ? '#69f0ae' : iz.id === 'ammunation' ? '#ff5252' : '#ffd740';
      ctx.fillRect(iz.x * scale - 4, iz.z * scale - 4, 8, 8);
    });

    // 8. Story Mission Blips (S, R, BS, CJ) or Active Mission Yellow Objective Blip
    if (this.missions.activeMission) {
      const tx = this.missions.activeMission.targetX * scale;
      const tz = this.missions.activeMission.targetZ * scale;
      ctx.fillStyle = '#ffea00';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.fillRect(tx - 5, tz - 5, 10, 10);
      ctx.strokeRect(tx - 5, tz - 5, 10, 10);
    } else {
      this.missions.missionMarkers.forEach((m) => {
        const mx = m.x * scale;
        const mz = m.z * scale;
        ctx.fillStyle = '#000';
        ctx.fillRect(mx - 7, mz - 7, 14, 14);
        ctx.fillStyle = '#ffca28';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.blip, mx, mz);
      });
    }

    ctx.restore();

    // Update North Badge ('N') position on the outer radar ring
    const northAngle = this.camYaw - Math.PI / 2;
    const ringRadius = 92;
    const nx = cx + Math.cos(northAngle) * ringRadius;
    const ny = cy + Math.sin(northAngle) * ringRadius;
    const badge = document.getElementById('radar-north-badge');
    badge.style.left = `${nx}px`;
    badge.style.top = `${ny - 11}px`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new GTASanAndreasGame();
});
