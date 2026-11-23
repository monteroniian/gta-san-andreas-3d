/* ==========================================================================
   GRAND THEFT AUTO: SAN ANDREAS — LOS SANTOS 3D OPEN WORLD BUILDER
   Includes Grove Street Cul-de-Sac, CJ's House, Sweet's & Ryder's Houses,
   Idlewood Pay 'n' Spray, Well Stacked Pizza, Gas Station, Ammu-Nation,
   Glen Park Pond, Downtown Los Santos Tower, Freight Train & Santa Maria Beach.
   ========================================================================== */

class LosSantosWorld {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];      // AABB boxes { minX, maxX, minZ, maxZ, height, label }
    this.ramps = [];          // Stunt ramps { minX, maxX, minZ, maxZ, dirX, dirZ, maxH }
    this.graffitiTags = [];   // Sprayable walls
    this.pickups = [];        // Spinning 3D pickups (health, armor, bribe, weapons, cash)
    this.explosivePumps = []; // Gas station fuel pumps
    this.interactiveZones = []; // Pay 'n' Spray, Ammu-Nation, Pizza shop
    this.ferrisWheel = null;
    this.oceanMesh = null;
    this.trainGroup = null;
    this.trainZ = -260;

    // Gang Territories for Radar & Gang Wars
    this.turfs = [
      { id: 'ganton',   name: 'Ganton (Grove St)', minX: -45, maxX: 60,  minZ: -65, maxZ: 65,  owner: 'grove',  underAttack: false },
      { id: 'idlewood', name: 'Idlewood',          minX: -145, maxX: -45, minZ: 15,  maxZ: 135, owner: 'ballas', underAttack: false },
      { id: 'glenpark', name: 'Glen Park',         minX: -155, maxX: -55, minZ: -155, maxZ: -55, owner: 'ballas', underAttack: false },
      { id: 'eastls',   name: 'East Los Santos',   minX: 65,  maxX: 165, minZ: -110, maxZ: 90,  owner: 'vagos',  underAttack: false }
    ];

    // Named Districts for Bottom-Right Gothic Popup
    this.zones = [
      { name: 'Ganton — Grove Street', minX: -45, maxX: 60, minZ: -65, maxZ: 65 },
      { name: 'Idlewood', minX: -150, maxX: -45, minZ: 10, maxZ: 145 },
      { name: 'Glen Park', minX: -160, maxX: -45, minZ: -165, maxZ: -45 },
      { name: 'Downtown Los Santos', minX: -280, maxX: -155, minZ: -140, maxZ: 140 },
      { name: 'East Los Santos', minX: 60, maxX: 190, minZ: -150, maxZ: 140 },
      { name: 'Santa Maria Beach', minX: -280, maxX: 190, minZ: 145, maxZ: 320 }
    ];

    this.buildWorld();
  }

  buildWorld() {
    this.buildGroundAndRoads();
    this.buildGroveStreet();
    this.buildIdlewoodAndShops();
    this.buildGlenPark();
    this.buildDowntownLosSantos();
    this.buildTrainTracksAndTrain();
    this.buildSantaMariaBeach();
    this.buildGraffitiTags();
    this.buildPickups();
  }

  /* ------------------- GROUND, ROADS & GROVE CUL-DE-SAC ------------------- */
  buildGroundAndRoads() {
    // Base grass / urban ground
    const groundGeo = new THREE.PlaneGeometry(640, 640);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3d5235 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    const roadMat = new THREE.MeshLambertMaterial({ color: 0x26282a });
    const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x8d8d8d });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffca28 });

    const addRoad = (x, z, w, d, hasCenterLine = true) => {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(w + 4, 0.14, d + 4), sidewalkMat);
      sw.position.set(x, 0.07, z);
      sw.receiveShadow = true;
      this.scene.add(sw);

      const rd = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, d), roadMat);
      rd.position.set(x, 0.08, z);
      rd.receiveShadow = true;
      this.scene.add(rd);

      if (hasCenterLine) {
        const isHoriz = w > d;
        const line = new THREE.Mesh(
          new THREE.BoxGeometry(isHoriz ? w - 6 : 0.35, 0.17, isHoriz ? 0.35 : d - 6),
          lineMat
        );
        line.position.set(x, 0.09, z);
        this.scene.add(line);
      }
    };

    // Main East-West Grove Street road leading out of the cul-de-sac to Downtown
    addRoad(-115, 0, 240, 16);
    // North-South Idlewood / Glen Park Avenue
    addRoad(-85, 0, 18, 340);
    // North-South Downtown Boulevard
    addRoad(-195, 0, 20, 340);
    // East Los Santos Avenue
    addRoad(95, 0, 16, 320);
    // South Beach Coastal Highway
    addRoad(-50, 145, 420, 18);
    // North Glen Park Road
    addRoad(-50, -125, 380, 16);

    // ICONIC GROVE STREET CUL-DE-SAC (Circular Roundabout at 0, 0)
    const culSidewalk = new THREE.Mesh(new THREE.CylinderGeometry(25, 25, 0.14, 32), sidewalkMat);
    culSidewalk.position.set(0, 0.07, 0);
    culSidewalk.receiveShadow = true;
    this.scene.add(culSidewalk);

    const culAsphalt = new THREE.Mesh(new THREE.CylinderGeometry(21, 21, 0.17, 32), roadMat);
    culAsphalt.position.set(0, 0.085, 0);
    culAsphalt.receiveShadow = true;
    this.scene.add(culAsphalt);
  }

  /* ------------------- GROVE STREET HOUSES, OVERPASS & COURT ------------------- */
  buildGroveStreet() {
    // 1. CJ'S HOUSE (The Johnson House — East end of Cul-de-Sac at x: 30, z: 0)
    this.addBuilding(31, 0, 14, 10.5, 14, 0xd7ccc8, 0x4e342e, "Casa de CJ (Johnson House)");
    // CJ's Front Porch & Garage
    const porch = new THREE.Mesh(
      new THREE.BoxGeometry(4, 4.2, 8),
      new THREE.MeshLambertMaterial({ color: 0xbcaaa4 })
    );
    porch.position.set(22.5, 2.1, 0);
    this.scene.add(porch);

    this.addBuilding(31, -11, 10, 4.8, 7, 0xb0bec5, 0x37474f, "Garaje de CJ");

    // 2. SWEET'S HOUSE (South-East of Cul-de-Sac at x: 18, z: 24)
    this.addBuilding(18, 25, 13, 6.2, 11, 0xcfd8dc, 0x5d4037, "Casa de Sweet");

    // 3. RYDER'S HOUSE (North-East of Cul-de-Sac at x: 18, z: -24)
    this.addBuilding(18, -25, 13, 6.2, 11, 0xa5d6a7, 0x3e2723, "Casa de Ryder");

    // 4. Neighboring Grove Street Homes
    this.addBuilding(-4, 28, 12, 6.0, 10, 0xffe0b2, 0x4e342e);
    this.addBuilding(-4, -28, 12, 6.0, 10, 0xdcedc8, 0x37474f);
    this.addBuilding(-22, 28, 12, 6.0, 10, 0xf8bbd0, 0x4e342e);
    this.addBuilding(-22, -28, 12, 6.0, 10, 0xb3e5fc, 0x37474f);

    // 5. GROVE STREET OVERPASS BRIDGE (West exit of Grove Street at x: -42, z: 0)
    const bridgeMat = new THREE.MeshLambertMaterial({ color: 0x757575 });
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(5, 8.5, 6), bridgeMat);
    pillarL.position.set(-42, 4.25, -14);
    const pillarR = pillarL.clone();
    pillarR.position.z = 14;
    const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(8, 1.6, 36), bridgeMat);
    bridgeDeck.position.set(-42, 8.6, 0);
    this.scene.add(pillarL, pillarR, bridgeDeck);
    this.colliders.push(
      { minX: -44.5, maxX: -39.5, minZ: -17, maxZ: -11, height: 8.5 },
      { minX: -44.5, maxX: -39.5, minZ: 11, maxZ: 17, height: 8.5 }
    );

    // Stunt Ramp next to Grove Street Bridge
    this.addStuntRamp(-30, -14, 6, 10, -1, 0, 4.2);

    // 6. Basketball Court in Ganton (x: 34, z: 24)
    const court = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.16, 12),
      new THREE.MeshLambertMaterial({ color: 0x546e7a })
    );
    court.position.set(36, 0.08, 25);
    this.scene.add(court);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 4.5, 8),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    pole.position.set(43.5, 2.25, 25);
    const backboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 1.4, 2.0),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    backboard.position.set(43.2, 4.2, 25);
    this.scene.add(pole, backboard);

    // Grove Street Palm Trees & Streetlights around Cul-de-Sac
    const palmCoords = [
      [12, 14], [12, -14], [-12, 15], [-12, -15], [22, 11], [22, -11],
      [-28, 13], [-28, -13], [5, 22], [5, -22]
    ];
    palmCoords.forEach(([px, pz]) => this.addPalmTree(px, pz));
  }

  /* ------------------- IDLEWOOD: PAY 'N' SPRAY, PIZZA, GAS & AMMU-NATION ------------------- */
  buildIdlewoodAndShops() {
    // 1. PAY 'N' SPRAY GARAGE (x: -112, z: 38)
    this.addBuilding(-114, 38, 16, 8, 14, 0xfbc02d, 0xd32f2f, "Pay 'n' Spray");
    const spraySign = this.createTextSignMesh("PAY 'N' SPRAY", "#ffeb3b", "#b71c1c", 10, 2.4);
    spraySign.position.set(-105.8, 6.8, 38);
    spraySign.rotation.y = Math.PI / 2;
    this.scene.add(spraySign);

    this.interactiveZones.push({
      id: 'paynspray',
      name: "Pay 'n' Spray (Taller de Pintura)",
      x: -101,
      z: 38,
      radius: 6.5,
      color: 0x00e676,
      vehicleOnly: true
    });
    this.addGlowMarker(-101, 38, 0x00e676, 3.2);

    // 2. THE WELL STACKED PIZZA CO. / CLUCKIN' BELL (x: -114, z: 78)
    this.addBuilding(-114, 78, 18, 7.5, 16, 0xc62828, 0xffca28, "Well Stacked Pizza Co.");
    const pizzaSign = this.createTextSignMesh("WELL STACKED PIZZA", "#ffffff", "#b71c1c", 11, 2.4);
    pizzaSign.position.set(-104.8, 6.5, 78);
    pizzaSign.rotation.y = Math.PI / 2;
    this.scene.add(pizzaSign);

    this.interactiveZones.push({
      id: 'pizza',
      name: 'The Well Stacked Pizza Co.',
      x: -102,
      z: 78,
      radius: 3.5,
      color: 0xffca28,
      vehicleOnly: false
    });
    this.addGlowMarker(-102, 78, 0xffca28, 1.8);

    // 3. IDLEWOOD GAS STATION WITH EXPLOSIVE PUMPS (x: -64, z: 52)
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.8, 12),
      new THREE.MeshLambertMaterial({ color: 0xe53935 })
    );
    canopy.position.set(-64, 5.8, 52);
    this.scene.add(canopy);

    [[-70, 48], [-58, 48], [-70, 56], [-58, 56]].forEach(([cx, cz]) => {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 5.8, 8),
        new THREE.MeshLambertMaterial({ color: 0xeeeeee })
      );
      col.position.set(cx, 2.9, cz);
      this.scene.add(col);
    });

    // Explosive Red Fuel Pumps
    [[-64, 49], [-64, 55]].forEach(([px, pz]) => {
      const pump = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 2.2, 0.9),
        new THREE.MeshLambertMaterial({ color: 0xd32f2f })
      );
      pump.position.set(px, 1.1, pz);
      this.scene.add(pump);
      this.explosivePumps.push({ mesh: pump, x: px, z: pz, exploded: false });
    });

    // 4. AMMU-NATION GUN SHOP (x: -64, z: -42)
    this.addBuilding(-64, -42, 16, 8.5, 14, 0x37474f, 0xb71c1c, "Ammu-Nation");
    const ammuSign = this.createTextSignMesh("AMMU-NATION", "#ffffff", "#1565c0", 10, 2.4);
    ammuSign.position.set(-72.2, 7.0, -42);
    ammuSign.rotation.y = -Math.PI / 2;
    this.scene.add(ammuSign);

    this.interactiveZones.push({
      id: 'ammunation',
      name: 'Ammu-Nation Gun Shop',
      x: -75,
      z: -42,
      radius: 3.5,
      color: 0xff1744,
      vehicleOnly: false
    });
    this.addGlowMarker(-75, -42, 0xff1744, 1.8);
  }

  /* ------------------- GLEN PARK (POND, BRIDGE & BALLAS TURF) ------------------- */
  buildGlenPark() {
    // Green Park Grass Patch
    const parkGrass = new THREE.Mesh(
      new THREE.BoxGeometry(76, 0.18, 76),
      new THREE.MeshLambertMaterial({ color: 0x2e7d32 })
    );
    parkGrass.position.set(-115, 0.09, -95);
    this.scene.add(parkGrass);

    // Glen Park Pond Water
    const pond = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 20, 0.24, 24),
      new THREE.MeshLambertMaterial({ color: 0x0288d1 })
    );
    pond.position.set(-115, 0.12, -95);
    this.scene.add(pond);

    // Wooden Footbridge over Glen Park Pond
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.6, 42),
      new THREE.MeshLambertMaterial({ color: 0x6d4c41 })
    );
    bridge.position.set(-115, 0.45, -95);
    this.scene.add(bridge);

    // Surrounding Glen Park Ballas Apartments
    this.addBuilding(-145, -145, 22, 16, 18, 0x7e57c2, 0x311b92, "Glen Park Suites");
    this.addBuilding(-95, -148, 24, 14, 16, 0x9575cd, 0x4527a0);

    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      this.addPalmTree(-115 + Math.cos(angle) * 28, -95 + Math.sin(angle) * 28);
    }
  }

  /* ------------------- DOWNTOWN LOS SANTOS (TOWER, HELIPAD & HOSPITAL) ------------------- */
  buildDowntownLosSantos() {
    // ICONIC LOS SANTOS TOWER (US Bank Tower / Maze Bank Cylinder Skyscraper at x: -230, z: 0)
    const towerBase = new THREE.Mesh(
      new THREE.BoxGeometry(28, 12, 28),
      new THREE.MeshLambertMaterial({ color: 0x90a4ae })
    );
    towerBase.position.set(-230, 6, 0);
    towerBase.castShadow = true;
    this.scene.add(towerBase);

    const towerCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(11.5, 13, 88, 20),
      new THREE.MeshLambertMaterial({ color: 0xb0bec5 })
    );
    towerCyl.position.set(-230, 44, 0);
    towerCyl.castShadow = true;
    this.scene.add(towerCyl);

    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 11.5, 10, 16),
      new THREE.MeshLambertMaterial({ color: 0xfff59d })
    );
    crown.position.set(-230, 91, 0);
    this.scene.add(crown);

    this.colliders.push({ minX: -244, maxX: -216, minZ: -14, maxZ: 14, height: 95, label: 'Los Santos Tower' });

    // Ground Helipad next to Los Santos Tower (x: -230, z: -32)
    const helipad = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.3, 18),
      new THREE.MeshLambertMaterial({ color: 0x37474f })
    );
    helipad.position.set(-230, 0.15, -32);
    this.scene.add(helipad);

    // Downtown Skyscrapers & Hospital
    this.addBuilding(-235, 55, 24, 48, 24, 0x546e7a, 0x263238, "Commerce Tower");
    this.addBuilding(-235, -75, 26, 42, 22, 0x607d8b, 0x263238, "Downtown Plaza");
    this.addBuilding(-162, 48, 22, 18, 18, 0xeceff1, 0xc62828, "All Saints General Hospital");
    this.addBuilding(-162, -48, 22, 20, 18, 0x37474f, 0x1565c0, "LSPD Headquarters");

    // Big Downtown Stunt Ramp
    this.addStuntRamp(-195, 35, 8, 14, 0, -1, 5.5);
  }

  /* ------------------- FREIGHT TRAIN TRACKS & MOVING TRAIN ------------------- */
  buildTrainTracksAndTrain() {
    // Tracks along x = 68 running from z = -290 to z = 290
    const gravel = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.14, 580),
      new THREE.MeshLambertMaterial({ color: 0x4e342e })
    );
    gravel.position.set(68, 0.07, 0);
    this.scene.add(gravel);

    const railMat = new THREE.MeshLambertMaterial({ color: 0xb0bec5 });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 580), railMat);
    railL.position.set(66.8, 0.16, 0);
    const railR = railL.clone();
    railR.position.x = 69.2;
    this.scene.add(railL, railR);

    // Build Brown Streak Freight Train
    this.trainGroup = new THREE.Group();
    const locoMat = new THREE.MeshLambertMaterial({ color: 0xb71c1c });
    const stripeMat = new THREE.MeshLambertMaterial({ color: 0xffca28 });
    const cargoMat = new THREE.MeshLambertMaterial({ color: 0x455a64 });

    const loco = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.8, 11), locoMat);
    loco.position.set(0, 2.1, 0);
    loco.castShadow = true;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.48, 0.55, 11.1), stripeMat);
    stripe.position.set(0, 1.5, 0);

    const car1 = new THREE.Mesh(new THREE.BoxGeometry(3.3, 3.2, 12), cargoMat);
    car1.position.set(0, 1.8, -13);
    car1.castShadow = true;

    const car2 = new THREE.Mesh(new THREE.BoxGeometry(3.3, 3.2, 12), cargoMat);
    car2.position.set(0, 1.8, -26.5);
    car2.castShadow = true;

    this.trainGroup.add(loco, stripe, car1, car2);
    this.trainGroup.position.set(68, 0, this.trainZ);
    this.scene.add(this.trainGroup);

    // East Los Santos Vagos Buildings near the tracks
    this.addBuilding(122, -45, 20, 12, 22, 0xfff59d, 0xf57f17, "Vagos East LS");
    this.addBuilding(122, 25, 20, 10, 20, 0xffe082, 0xe65100, "Las Colinas Block");
  }

  /* ------------------- SANTA MARIA BEACH, OCEAN & FERRIS WHEEL ------------------- */
  buildSantaMariaBeach() {
    // Sandy Beach
    const sand = new THREE.Mesh(
      new THREE.BoxGeometry(640, 0.18, 70),
      new THREE.MeshLambertMaterial({ color: 0xe6ce9c })
    );
    sand.position.set(0, 0.09, 190);
    this.scene.add(sand);

    // Ocean Water
    const oceanGeo = new THREE.PlaneGeometry(640, 160);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshLambertMaterial({ color: 0x0277bd });
    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.position.set(0, 0.14, 275);
    this.scene.add(this.oceanMesh);

    // Wooden Santa Maria Pier (x: -40, z: 215)
    const pier = new THREE.Mesh(
      new THREE.BoxGeometry(24, 1.4, 75),
      new THREE.MeshLambertMaterial({ color: 0x6d4c41 })
    );
    pier.position.set(-40, 0.8, 220);
    this.scene.add(pier);

    // Giant Rotating Ferris Wheel on the Pier
    this.ferrisWheel = new THREE.Group();
    this.ferrisWheel.position.set(-40, 16, 240);

    const ringGeo = new THREE.TorusGeometry(12, 0.45, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffca28 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    this.ferrisWheel.add(ring);

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(24, 0.25, 0.25),
        new THREE.MeshBasicMaterial({ color: 0xff5252 })
      );
      spoke.rotation.z = a;
      this.ferrisWheel.add(spoke);
    }
    this.scene.add(this.ferrisWheel);

    for (let x = -160; x <= 120; x += 28) {
      this.addPalmTree(x, 162);
    }
  }

  /* ------------------- 6 SPRAYABLE GRAFFITI TAGS ------------------- */
  buildGraffitiTags() {
    const tagLocations = [
      { x: -41.5, y: 2.8, z: -10.8, rotY: 0,           zone: 'Puente de Grove Street' },
      { x: 24.0,  y: 2.6, z: 19.3,  rotY: Math.PI,     zone: 'Callejón de Ganton' },
      { x: -105.8, y: 2.6, z: 42.0, rotY: Math.PI / 2, zone: 'Idlewood Pay n Spray' },
      { x: -104.8, y: 2.6, z: 82.0, rotY: Math.PI / 2, zone: 'Idlewood Pizza' },
      { x: -133.8, y: 2.6, z: -145, rotY: Math.PI / 2, zone: 'Glen Park Ballas' },
      { x: 111.8, y: 2.6, z: -45,   rotY: -Math.PI / 2, zone: 'East Los Santos' }
    ];

    tagLocations.forEach((loc, idx) => {
      const mesh = this.createTextSignMesh("BALLAS TURF", "#ea80fc", "#4a148c", 4.2, 2.0);
      mesh.position.set(loc.x, loc.y, loc.z);
      mesh.rotation.y = loc.rotY;
      this.scene.add(mesh);

      this.graffitiTags.push({
        id: idx,
        mesh,
        x: loc.x,
        z: loc.z,
        sprayed: false,
        zone: loc.zone
      });
    });
  }

  /* ------------------- FLOATING 3D PICKUPS (HEARTS, ARMOR, BRIBES, WEAPONS) ------------------- */
  buildPickups() {
    const items = [
      { type: 'health', x: 22, z: 5, color: 0xff1744, label: 'Salud (+100 HP)' },
      { type: 'armor',  x: 24, z: -15, color: 0xe0e0e0, label: 'Chaleco Antibalas (+100)' },
      { type: 'weapon', weaponId: 'bat', x: 39, z: 4, color: 0xff9800, label: 'Bate de Béisbol' },
      { type: 'weapon', weaponId: 'uzi', x: -42, z: -6, color: 0x00e676, label: 'Micro SMG (Tec-9)' },
      { type: 'weapon', weaponId: 'spray', x: 21, z: -4, color: 0x4caf50, label: 'Lata de Spray Verde' },
      { type: 'weapon', weaponId: 'ak47', x: -115, z: -72, color: 0xffeb3b, label: 'Rifle AK-47' },
      { type: 'weapon', weaponId: 'rpg', x: -215, z: -25, color: 0xff5722, label: 'Lanzacohetes RPG' },
      { type: 'bribe',  x: -55, z: 12, color: 0xffd54f, label: 'Soborno Policial (-1★)' },
      { type: 'bribe',  x: -140, z: 12, color: 0xffd54f, label: 'Soborno Policial (-1★)' },
      { type: 'cash',   x: 36, z: 25, color: 0x4caf50, label: 'Fajo de Dólares (+$500)' }
    ];

    items.forEach((item) => {
      const geo = item.type === 'bribe'
        ? new THREE.OctahedronGeometry(0.75, 0)
        : new THREE.BoxGeometry(0.9, 0.9, 0.9);
      const mat = new THREE.MeshBasicMaterial({ color: item.color, wireframe: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(item.x, 1.25, item.z);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.95, 0.08, 8, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      mesh.add(ring);

      this.scene.add(mesh);
      this.pickups.push({ ...item, mesh, cooldown: 0 });
    });
  }

  /* ------------------- HELPERS: BUILDINGS, PALM TREES, SIGNS & MARKERS ------------------- */
  addBuilding(x, z, w, h, d, wallColor, roofColor, label = '') {
    const wallMat = new THREE.MeshLambertMaterial({ color: wallColor });
    const roofMat = new THREE.MeshLambertMaterial({ color: roofColor });

    const bMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    bMesh.position.set(x, h / 2, z);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    this.scene.add(bMesh);

    const rMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.7, d + 0.6), roofMat);
    rMesh.position.set(x, h + 0.35, z);
    this.scene.add(rMesh);

    // Simple window strips
    const winMat = new THREE.MeshBasicMaterial({ color: 0xfff59d });
    const floors = Math.max(1, Math.floor(h / 4.2));
    for (let f = 0; f < floors; f++) {
      const wy = 2.2 + f * 3.8;
      if (wy < h - 1) {
        const winFront = new THREE.Mesh(new THREE.BoxGeometry(w * 0.65, 1.1, d + 0.12), winMat);
        winFront.position.set(x, wy, z);
        this.scene.add(winFront);
      }
    }

    this.colliders.push({
      minX: x - w / 2 - 0.4,
      maxX: x + w / 2 + 0.4,
      minZ: z - d / 2 - 0.4,
      maxZ: z + d / 2 + 0.4,
      height: h,
      label
    });
  }

  addPalmTree(x, z) {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6d4c41 });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 7.5, 7), trunkMat);
    trunk.position.set(x, 3.75, z);
    trunk.castShadow = true;
    this.scene.add(trunk);

    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 0.75), leafMat);
      leaf.position.set(x, 7.4, z);
      leaf.rotation.y = (i / 6) * Math.PI * 2;
      leaf.rotation.z = 0.28;
      this.scene.add(leaf);
    }
  }

  addStuntRamp(x, z, w, d, dirX, dirZ, maxH) {
    const rampMat = new THREE.MeshLambertMaterial({ color: 0xff9800 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, maxH * 0.5, d), rampMat);
    mesh.position.set(x, maxH * 0.22, z);
    if (dirZ !== 0) mesh.rotation.x = dirZ * 0.32;
    if (dirX !== 0) mesh.rotation.z = -dirX * 0.32;
    this.scene.add(mesh);

    this.ramps.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
      maxH
    });
  }

  addGlowMarker(x, z, color, radius = 1.6) {
    const geo = new THREE.CylinderGeometry(radius, radius, 2.6, 18, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.48,
      side: THREE.DoubleSide
    });
    const cyl = new THREE.Mesh(geo, mat);
    cyl.position.set(x, 1.3, z);
    this.scene.add(cyl);
    return cyl;
  }

  createTextSignMesh(text, fgColor, bgColor, width = 6, height = 2) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    ctx.fillStyle = fgColor;
    ctx.font = 'bold 52px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    return new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  }

  markTagSprayed(tag) {
    if (tag.sprayed) return false;
    tag.sprayed = true;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#a5d6a7';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    ctx.fillStyle = '#69f0ae';
    ctx.font = 'italic bold 50px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GROVE ST 4 LIFE', canvas.width / 2, canvas.height / 2);

    tag.mesh.material.map = new THREE.CanvasTexture(canvas);
    tag.mesh.material.needsUpdate = true;
    return true;
  }

  /* ------------------- WORLD UPDATE (TRAIN, FERRIS WHEEL, PICKUPS) ------------------- */
  update(dt, time) {
    // Rotate Santa Maria Beach Ferris Wheel
    if (this.ferrisWheel) {
      this.ferrisWheel.rotation.z += dt * 0.35;
    }

    // Move Freight Train along tracks
    if (this.trainGroup) {
      this.trainZ += dt * 16;
      if (this.trainZ > 280) this.trainZ = -280;
      this.trainGroup.position.z = this.trainZ;
    }

    // Rotate Pickups
    this.pickups.forEach((p) => {
      if (p.cooldown > 0) {
        p.cooldown -= dt;
        if (p.cooldown <= 0) p.mesh.visible = true;
      } else {
        p.mesh.rotation.y += dt * 2.2;
        p.mesh.position.y = 1.15 + Math.sin(time * 3 + p.x) * 0.2;
      }
    });
  }

  getZoneNameAt(x, z) {
    for (const zn of this.zones) {
      if (x >= zn.minX && x <= zn.maxX && z >= zn.minZ && z <= zn.maxZ) {
        return zn.name;
      }
    }
    return 'Los Santos';
  }

  getTurfAt(x, z) {
    for (const t of this.turfs) {
      if (x >= t.minX && x <= t.maxX && z >= t.minZ && z <= t.maxZ) {
        return t;
      }
    }
    return null;
  }

  checkBuildingCollision(x, z, radius = 0.65) {
    for (const c of this.colliders) {
      if (
        x + radius > c.minX &&
        x - radius < c.maxX &&
        z + radius > c.minZ &&
        z - radius < c.maxZ
      ) {
        return c;
      }
    }
    return null;
  }
}

window.LosSantosWorld = LosSantosWorld;
