/* ==========================================================================
   GRAND THEFT AUTO: SAN ANDREAS — 3D PROCEDURAL MODELS (THREE.JS)
   Builds CJ, Big Smoke, Sweet, Ryder, Gangs, Police, Weapons, Jetpack & Vehicles
   ========================================================================== */

class SAModelFactory {
  static createCharacterModel(config = {}) {
    const {
      role = 'cj',        // 'cj', 'sweet', 'smoke', 'ryder', 'grove', 'ballas', 'vagos', 'cop', 'ped'
      outfit = 'classic'  // 'classic', 'grove', 'black'
    } = config;

    const group = new THREE.Group();

    // Color palettes per character archetype
    let skinColor = 0x5c3822;
    let shirtColor = 0xf5f5f5; // CJ white tank top
    let pantsColor = 0x284b7a; // CJ blue jeans
    let shoeColor = 0xeeeeee;
    let hatColor = null;
    let hasBandana = false;
    let bandanaColor = 0x2e7d32;
    let bodyWidthScale = 1.0;

    if (role === 'cj') {
      skinColor = 0x5c3822;
      if (outfit === 'grove') {
        shirtColor = 0x2e7d32;
        hasBandana = true;
        bandanaColor = 0x2e7d32;
      } else if (outfit === 'black') {
        shirtColor = 0x181818;
        pantsColor = 0x1e1e1e;
      }
    } else if (role === 'sweet') {
      skinColor = 0x52301c;
      shirtColor = 0x1b5e20;
      pantsColor = 0x263238;
      hatColor = 0x1b5e20;
    } else if (role === 'smoke') {
      skinColor = 0x4e2d1a;
      shirtColor = 0x2e7d32;
      pantsColor = 0x1f1f1f;
      hatColor = 0x1a1a1a;
      bodyWidthScale = 1.48; // Big Smoke's iconic build
    } else if (role === 'ryder') {
      skinColor = 0x54321e;
      shirtColor = 0x1b4d20;
      pantsColor = 0x212121;
      hatColor = 0x111111;
    } else if (role === 'grove') {
      skinColor = 0x593620;
      shirtColor = 0x2e7d32;
      pantsColor = 0x2b3a4a;
      hasBandana = true;
      bandanaColor = 0x388e3c;
    } else if (role === 'ballas') {
      skinColor = 0x52311d;
      shirtColor = 0x7b1fa2; // Ballas Purple
      pantsColor = 0x1a1a1a;
      hasBandana = true;
      bandanaColor = 0x9c27b0;
    } else if (role === 'vagos') {
      skinColor = 0xa6744c;
      shirtColor = 0xfafafa;
      pantsColor = 0x37474f;
      hasBandana = true;
      bandanaColor = 0xfbc02d; // Vagos Yellow
    } else if (role === 'cop') {
      skinColor = 0xc5926e;
      shirtColor = 0x141824; // LSPD dark navy/black uniform
      pantsColor = 0x10141d;
      shoeColor = 0x0a0a0a;
      hatColor = 0x141824;
    } else {
      // Random Pedestrian
      const skins = [0xd8a47f, 0x8d5524, 0xc68642, 0x5c3822, 0xe0ac69];
      const shirts = [0xc62828, 0x1565c0, 0xf9a825, 0xeceff1, 0x37474f, 0xad1457];
      skinColor = skins[Math.floor(Math.random() * skins.length)];
      shirtColor = shirts[Math.floor(Math.random() * shirts.length)];
      pantsColor = 0x263238;
    }

    const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: pantsColor });
    const shoeMat = new THREE.MeshLambertMaterial({ color: shoeColor });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.68 * bodyWidthScale, 0.85, 0.36 * bodyWidthScale);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.25;
    torso.castShadow = true;
    group.add(torso);

    // If CJ in classic white tank top, show skin shoulders/neck strap detail
    if (role === 'cj' && outfit === 'classic') {
      const neckSkin = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.37), skinMat);
      neckSkin.position.set(0, 0.36, 0);
      torso.add(neckSkin);
    }

    // Gold chain for black jacket outfit or Smoke
    if (outfit === 'black') {
      const chain = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.22, 0.38),
        new THREE.MeshLambertMaterial({ color: 0xffca28 })
      );
      chain.position.set(0, 0.22, 0);
      torso.add(chain);
    }

    // LSPD Gold Badge for Cops
    if (role === 'cop') {
      const badge = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.12, 0.04),
        new THREE.MeshLambertMaterial({ color: 0xffd54f })
      );
      badge.position.set(0.16, 0.2, 0.19);
      torso.add(badge);
    }

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.92, 0);
    group.add(headGroup);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.48, 0.46), skinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Hair / buzzcut fade
    const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.48), darkMat);
    hairMesh.position.y = 0.2;
    headGroup.add(hairMesh);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.04), eyeMat);
    leftEye.position.set(-0.1, 0.04, 0.23);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.1;
    headGroup.add(leftEye, rightEye);

    // Sunglasses for Ryder / Cops / Black outfit
    if (role === 'ryder' || outfit === 'black') {
      const shades = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.08), darkMat);
      shades.position.set(0, 0.05, 0.22);
      headGroup.add(shades);
    }

    // Bandana
    if (hasBandana) {
      const bandMat = new THREE.MeshLambertMaterial({ color: bandanaColor });
      const bandana = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.5), bandMat);
      bandana.position.y = 0.16;
      headGroup.add(bandana);
    }

    // Hat (Sweet, Big Smoke derby, Ryder cap, Cop cap)
    if (hatColor !== null) {
      const hatMat = new THREE.MeshLambertMaterial({ color: hatColor });
      const crown = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), hatMat);
      crown.position.y = 0.24;
      headGroup.add(crown);

      const brim = new THREE.Mesh(
        new THREE.BoxGeometry(role === 'smoke' ? 0.66 : 0.48, 0.05, role === 'smoke' ? 0.66 : 0.62),
        hatMat
      );
      brim.position.set(0, 0.17, role === 'smoke' ? 0 : 0.08);
      headGroup.add(brim);
    }

    // Left & Right Arms
    const armMat = (role === 'cj' && outfit === 'classic') || role === 'vagos' ? skinMat : shirtMat;
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.46 * bodyWidthScale, 1.58, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.22), armMat);
    leftArmMesh.position.y = -0.32;
    leftArmMesh.castShadow = true;
    leftArmGroup.add(leftArmMesh);
    group.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.46 * bodyWidthScale, 1.58, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.22), armMat);
    rightArmMesh.position.y = -0.32;
    rightArmMesh.castShadow = true;
    rightArmGroup.add(rightArmMesh);
    group.add(rightArmGroup);

    // Weapon Mount inside Right Hand
    const weaponMount = new THREE.Group();
    weaponMount.position.set(0, -0.64, 0.16);
    rightArmGroup.add(weaponMount);

    // Left & Right Legs
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.18 * bodyWidthScale, 0.82, 0);
    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.76, 0.28), pantsMat);
    leftLegMesh.position.y = -0.36;
    leftLegMesh.castShadow = true;
    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.15, 0.38), shoeMat);
    leftShoe.position.set(0, -0.74, 0.05);
    leftLegGroup.add(leftLegMesh, leftShoe);
    group.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.18 * bodyWidthScale, 0.82, 0);
    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.76, 0.28), pantsMat);
    rightLegMesh.position.y = -0.36;
    rightLegMesh.castShadow = true;
    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.15, 0.38), shoeMat);
    rightShoe.position.set(0, -0.74, 0.05);
    rightLegGroup.add(rightLegMesh, rightShoe);
    group.add(rightLegGroup);

    // Jetpack attached to CJ's back (hidden by default)
    let jetpackGroup = null;
    let jetpackFlames = [];
    if (role === 'cj') {
      jetpackGroup = new THREE.Group();
      jetpackGroup.position.set(0, 1.32, -0.28);
      jetpackGroup.visible = false;

      const metalMat = new THREE.MeshLambertMaterial({ color: 0x90a4ae });
      const redMat = new THREE.MeshLambertMaterial({ color: 0xd32f2f });
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xff9800 });

      const cylGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.72, 10);
      const leftTank = new THREE.Mesh(cylGeo, metalMat);
      leftTank.position.set(-0.16, 0, 0);
      const rightTank = new THREE.Mesh(cylGeo, metalMat);
      rightTank.position.set(0.16, 0, 0);

      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.16), redMat);
      jetpackGroup.add(leftTank, rightTank, bridge);

      const flameGeo = new THREE.ConeGeometry(0.11, 0.45, 8);
      flameGeo.rotateX(Math.PI);
      const f1 = new THREE.Mesh(flameGeo, flameMat);
      f1.position.set(-0.16, -0.55, 0);
      const f2 = new THREE.Mesh(flameGeo, flameMat);
      f2.position.set(0.16, -0.55, 0);
      jetpackGroup.add(f1, f2);
      jetpackFlames = [f1, f2];

      group.add(jetpackGroup);
    }

    group.userData = {
      torso,
      headGroup,
      leftArmGroup,
      rightArmGroup,
      leftLegGroup,
      rightLegGroup,
      weaponMount,
      jetpackGroup,
      jetpackFlames,
      shirtMat,
      pantsMat
    };

    return group;
  }

  /* ------------------- 3D WEAPON MESHES FOR HAND ------------------- */
  static createWeaponMesh(weaponId) {
    const group = new THREE.Group();
    const gunMetal = new THREE.MeshLambertMaterial({ color: 0x263238 });
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x6d4c41 });
    const greenCan = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });

    if (weaponId === 'fist') {
      return group;
    } else if (weaponId === 'bat') {
      const bat = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.025, 0.95, 8), woodMat);
      bat.rotation.x = Math.PI / 2;
      bat.position.z = 0.35;
      group.add(bat);
    } else if (weaponId === 'pistol') {
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.36), gunMetal);
      barrel.position.set(0, 0.06, 0.14);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.1), gunMetal);
      group.add(barrel, grip);
    } else if (weaponId === 'uzi') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.38), gunMetal);
      body.position.set(0, 0.08, 0.12);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.28, 0.09), gunMetal);
      mag.position.set(0, -0.05, 0.1);
      group.add(body, mag);
    } else if (weaponId === 'shotgun') {
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.85), gunMetal);
      barrel.position.set(0, 0.06, 0.36);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.34), woodMat);
      stock.position.set(0, 0.02, -0.05);
      group.add(barrel, stock);
    } else if (weaponId === 'ak47') {
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.92), gunMetal);
      barrel.position.set(0, 0.06, 0.38);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.15, 0.32), woodMat);
      stock.position.set(0, 0.02, -0.06);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.26, 0.12), gunMetal);
      mag.position.set(0, -0.08, 0.32);
      mag.rotation.x = 0.3;
      group.add(barrel, stock, mag);
    } else if (weaponId === 'rpg') {
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 1.35, 10),
        new THREE.MeshLambertMaterial({ color: 0x33691e })
      );
      tube.rotation.x = Math.PI / 2;
      tube.position.set(0, 0.12, 0.25);
      const warhead = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 10), woodMat);
      warhead.rotation.x = Math.PI / 2;
      warhead.position.set(0, 0.12, 0.98);
      group.add(tube, warhead);
    } else if (weaponId === 'spray') {
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 10), greenCan);
      can.position.set(0, 0.04, 0.08);
      group.add(can);
    }
    return group;
  }

  /* ------------------- 3D VEHICLES (SEDANS, LOWRIDERS, BMX, TANK, HELI) ------------------- */
  static createVehicleModel(type = 'greenwood', customColor = null) {
    const root = new THREE.Group();
    const chassis = new THREE.Group(); // Allows hydraulic bounce & pitch/roll
    root.add(chassis);

    const tireMat = new THREE.MeshLambertMaterial({ color: 0x181818 });
    const rimMat = new THREE.MeshLambertMaterial({ color: 0xd0d0d0 });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x80deea, transparent: true, opacity: 0.65 });
    const chromeMat = new THREE.MeshLambertMaterial({ color: 0xe0e0e0 });
    const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfff9c4 });
    const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });

    const wheels = [];

    // 1. BMX BICYCLE
    if (type === 'bmx') {
      const frameMat = new THREE.MeshLambertMaterial({ color: customColor || 0xb0bec5 });
      const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 14);
      wheelGeo.rotateZ(Math.PI / 2);

      const frontW = new THREE.Mesh(wheelGeo, tireMat);
      frontW.position.set(0, 0.38, 0.68);
      const backW = new THREE.Mesh(wheelGeo, tireMat);
      backW.position.set(0, 0.38, -0.68);
      wheels.push(frontW, backW);
      root.add(frontW, backW);

      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.35), frameMat);
      bar.position.set(0, 0.58, 0);
      const handlePost = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.08), frameMat);
      handlePost.position.set(0, 0.85, 0.58);
      const handleBar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.07, 0.07), chromeMat);
      handleBar.position.set(0, 1.18, 0.58);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.28), tireMat);
      seat.position.set(0, 0.84, -0.35);

      chassis.add(bar, handlePost, handleBar, seat);
      root.userData = { chassis, wheels, type, displayName: 'BMX', maxSpeed: 22 };
      return root;
    }

    // 2. SANCHEZ DIRTBIKE
    if (type === 'sanchez') {
      const bodyMat = new THREE.MeshLambertMaterial({ color: customColor || 0xfbc02d });
      const wheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.16, 14);
      wheelGeo.rotateZ(Math.PI / 2);

      const frontW = new THREE.Mesh(wheelGeo, tireMat);
      frontW.position.set(0, 0.44, 0.85);
      const backW = new THREE.Mesh(wheelGeo, tireMat);
      backW.position.set(0, 0.44, -0.85);
      wheels.push(frontW, backW);
      root.add(frontW, backW);

      const tank = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 1.45), bodyMat);
      tank.position.set(0, 0.82, 0);
      const handleBar = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.08, 0.08), chromeMat);
      handleBar.position.set(0, 1.24, 0.55);
      const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.1), headLightMat);
      headlight.position.set(0, 1.05, 0.75);

      chassis.add(tank, handleBar, headlight);
      root.userData = { chassis, wheels, type, displayName: 'Sanchez', maxSpeed: 38 };
      return root;
    }

    // 3. HUNTER / POLICE MAVERICK HELICOPTER
    if (type === 'hunter') {
      const heliMat = new THREE.MeshLambertMaterial({ color: customColor || 0x334d2b });
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.5, 3.6), heliMat);
      cabin.position.set(0, 1.35, 0);
      cabin.castShadow = true;

      const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.0, 1.8), glassMat);
      canopy.position.set(0, 1.45, 1.15);

      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 3.8), heliMat);
      tail.position.set(0, 1.55, -3.2);

      // Landing skids
      const skidL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 3.2), tireMat);
      skidL.position.set(-0.9, 0.2, 0.2);
      const skidR = skidL.clone();
      skidR.position.x = 0.9;

      // Main Rotor
      const mainRotor = new THREE.Group();
      mainRotor.position.set(0, 2.3, 0);
      const blade1 = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.06, 0.32), tireMat);
      const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 7.8), tireMat);
      mainRotor.add(blade1, blade2);

      chassis.add(cabin, canopy, tail, skidL, skidR, mainRotor);
      root.userData = {
        chassis,
        wheels,
        mainRotor,
        type,
        displayName: 'Hunter Helicopter',
        maxSpeed: 48,
        isHelicopter: true
      };
      return root;
    }

    // 4. RHINO MILITARY TANK
    if (type === 'rhino') {
      const camoMat = new THREE.MeshLambertMaterial({ color: 0x4b5320 });
      const trackMat = new THREE.MeshLambertMaterial({ color: 0x212121 });

      const hull = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.25, 5.6), camoMat);
      hull.position.set(0, 1.05, 0);
      hull.castShadow = true;

      const leftTrack = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.95, 5.8), trackMat);
      leftTrack.position.set(-1.35, 0.55, 0);
      const rightTrack = leftTrack.clone();
      rightTrack.position.x = 1.35;

      const turret = new THREE.Group();
      turret.position.set(0, 1.9, -0.2);
      const turretBox = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 2.4), camoMat);
      const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 3.8, 10), trackMat);
      cannon.rotation.x = Math.PI / 2;
      cannon.position.set(0, 0.05, 2.4);
      turret.add(turretBox, cannon);

      chassis.add(hull, leftTrack, rightTrack, turret);
      root.userData = {
        chassis,
        wheels,
        turret,
        type,
        displayName: 'Rhino Tank',
        maxSpeed: 24,
        isTank: true
      };
      return root;
    }

    // 5. FOUR-WHEEL CARS (Greenwood, Savanna, Picador, Voodoo, Infernus, Police Cruiser)
    const specs = {
      greenwood: { name: 'Greenwood', color: 0x78909c, roofColor: 0xeceff1, maxSpeed: 33, convertible: false },
      savanna:   { name: 'Savanna Lowrider', color: 0x2e7d32, roofColor: null, maxSpeed: 35, convertible: true, lowrider: true },
      picador:   { name: 'Picador', color: 0x6a1b29, roofColor: 0x6a1b29, maxSpeed: 34, pickup: true },
      voodoo:    { name: 'Voodoo Ballas', color: 0x6a1b9a, roofColor: 0x4a148c, maxSpeed: 35, lowrider: true },
      infernus:  { name: 'Infernus', color: 0xd32f2f, roofColor: 0xd32f2f, maxSpeed: 48, sporty: true },
      police:    { name: 'LSPD Cruiser', color: 0x111111, roofColor: 0xf5f5f5, maxSpeed: 40, police: true }
    };

    const cfg = specs[type] || specs.greenwood;
    const mainColor = customColor || cfg.color;
    const bodyMat = new THREE.MeshLambertMaterial({ color: mainColor });

    // Lower Body
    const bodyH = cfg.sporty ? 0.68 : 0.82;
    const bodyGeo = new THREE.BoxGeometry(2.2, bodyH, 4.7);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 0.78, 0);
    bodyMesh.castShadow = true;
    chassis.add(bodyMesh);

    // Police white doors & lightbar
    let sirenRed = null;
    let sirenBlue = null;
    if (cfg.police) {
      const whiteDoor = new THREE.Mesh(
        new THREE.BoxGeometry(2.24, 0.76, 1.85),
        new THREE.MeshLambertMaterial({ color: 0xf5f5f5 })
      );
      whiteDoor.position.set(0, 0.79, 0);
      chassis.add(whiteDoor);

      sirenRed = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.18, 0.28),
        new THREE.MeshBasicMaterial({ color: 0xff1744 })
      );
      sirenRed.position.set(-0.4, 1.98, -0.1);
      sirenBlue = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.18, 0.28),
        new THREE.MeshBasicMaterial({ color: 0x00b0ff })
      );
      sirenBlue.position.set(0.4, 1.98, -0.1);
      chassis.add(sirenRed, sirenBlue);
    }

    // Cabin / Roof or Convertible Interior
    if (cfg.convertible) {
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.58, 0.12), glassMat);
      windshield.position.set(0, 1.4, 0.65);
      windshield.rotation.x = -0.35;
      const seats = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.45, 1.6),
        new THREE.MeshLambertMaterial({ color: 0xf5f5dc })
      );
      seats.position.set(0, 1.15, -0.2);
      chassis.add(windshield, seats);
    } else {
      const cabinLen = cfg.pickup ? 1.5 : 2.3;
      const cabinZ = cfg.pickup ? 0.35 : -0.15;
      const roofMat = new THREE.MeshLambertMaterial({ color: customColor || cfg.roofColor || mainColor });
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.68, cabinLen), roofMat);
      cabin.position.set(0, 1.48, cabinZ);
      cabin.castShadow = true;

      const glassBox = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.52, cabinLen + 0.06), glassMat);
      glassBox.position.set(0, 1.46, cabinZ);
      chassis.add(cabin, glassBox);
    }

    // Sporty Rear Spoiler for Infernus
    if (cfg.sporty) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.42), bodyMat);
      wing.position.set(0, 1.38, -2.1);
      chassis.add(wing);
    }

    // Bumpers, Headlights & Taillights
    const fBumper = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.24, 0.18), chromeMat);
    fBumper.position.set(0, 0.52, 2.36);
    const rBumper = fBumper.clone();
    rBumper.position.z = -2.36;
    chassis.add(fBumper, rBumper);

    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.1), headLightMat);
    hlL.position.set(-0.74, 0.84, 2.34);
    const hlR = hlL.clone();
    hlR.position.x = 0.74;

    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.2, 0.1), tailLightMat);
    tlL.position.set(-0.74, 0.84, -2.34);
    const tlR = tlL.clone();
    tlR.position.x = 0.74;
    chassis.add(hlL, hlR, tlL, tlR);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.34, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelOffsets = [
      [-1.08, 0.44,  1.45],
      [ 1.08, 0.44,  1.45],
      [-1.08, 0.44, -1.45],
      [ 1.08, 0.44, -1.45]
    ];
    wheelOffsets.forEach(([wx, wy, wz]) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(wx, wy, wz);
      const tire = new THREE.Mesh(wheelGeo, tireMat);
      const rim = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.46, 0.14), rimMat);
      wGroup.add(tire, rim);
      root.add(wGroup);
      wheels.push(wGroup);
    });

    root.userData = {
      chassis,
      wheels,
      bodyMat,
      sirenRed,
      sirenBlue,
      type,
      displayName: cfg.name,
      maxSpeed: cfg.maxSpeed,
      lowrider: !!cfg.lowrider,
      police: !!cfg.police
    };

    return root;
  }
}

window.SAModelFactory = SAModelFactory;
