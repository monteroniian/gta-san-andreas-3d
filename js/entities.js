/* ==========================================================================
   GRAND THEFT AUTO: SAN ANDREAS — ENTITIES, VEHICLES, GANGS & POLICE AI
   Handles Vehicle Physics, Hydraulics, Helicopters, Tanks, NPCs, Recruited
   Grove Street Homies, Gang Wars, Projectiles, Explosions & Cash Drops.
   ========================================================================== */

class SAEntityManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;

    this.vehicles = [];
    this.npcs = [];
    this.projectiles = [];
    this.particles = [];
    this.cashDrops = [];

    // Gang War State
    this.activeGangWar = null; // { turf, wave, enemiesRemaining, spawnTimer }
    this.recentGangKills = 0;

    this.spawnInitialVehicles();
    this.spawnInitialNPCs();
  }

  /* ------------------- SPAWN ICONIC VEHICLES IN LOS SANTOS ------------------- */
  spawnInitialVehicles() {
    const list = [
      // Grove Street Cul-de-Sac Iconic Vehicles
      { type: 'greenwood', x: 9,   z: 14,   rotY: -Math.PI / 2, color: 0x78909c }, // Sweet's Greenwood
      { type: 'picador',   x: 9,   z: -14,  rotY: -Math.PI / 2, color: 0x6a1b29 }, // Ryder's Picador
      { type: 'savanna',   x: 15,  z: 0,    rotY: Math.PI,      color: 0x2e7d32 }, // Grove St Lowrider
      { type: 'bmx',       x: -2,  z: -4,   rotY: 0.6,          color: 0xb0bec5 }, // Center Cul-de-Sac BMX
      { type: 'sanchez',   x: -26, z: 7,    rotY: 1.2,          color: 0xfbc02d }, // Dirtbike by bridge

      // Idlewood & Glen Park Vehicles
      { type: 'voodoo',    x: -92, z: 45,   rotY: 0,            color: 0x6a1b9a }, // Ballas Lowrider
      { type: 'voodoo',    x: -95, z: -85,  rotY: Math.PI / 2,  color: 0x7b1fa2 },
      { type: 'greenwood', x: -75, z: 18,   rotY: 0,            color: 0x546e7a },

      // Downtown, East LS & Beach Vehicles
      { type: 'infernus',  x: -205, z: 8,   rotY: 0,            color: 0xd32f2f }, // Supercar Downtown
      { type: 'hunter',    x: -230, z: -32, rotY: 0,            color: 0x334d2b }, // Helicopter on Helipad
      { type: 'police',    x: -175, z: -42, rotY: Math.PI / 2,  color: null },     // LSPD HQ Cruiser
      { type: 'sanchez',   x: -35,  z: 168, rotY: 1.5,          color: 0xff5722 }  // Beach Dirtbike
    ];

    list.forEach((v) => this.spawnVehicle(v.type, v.x, v.z, v.rotY, v.color));
  }

  spawnVehicle(type, x, z, rotY = 0, customColor = null) {
    const mesh = SAModelFactory.createVehicleModel(type, customColor);
    mesh.position.set(x, 0, z);
    mesh.rotation.y = rotY;
    this.scene.add(mesh);

    const veh = {
      mesh,
      type,
      displayName: mesh.userData.displayName || type.toUpperCase(),
      speed: 0,
      maxSpeed: mesh.userData.maxSpeed || 34,
      steering: 0,
      hp: type === 'rhino' ? 1200 : 250,
      maxHp: type === 'rhino' ? 1200 : 250,
      driver: null,
      isHelicopter: !!mesh.userData.isHelicopter,
      isTank: !!mesh.userData.isTank,
      lowrider: !!mesh.userData.lowrider,
      police: !!mesh.userData.police,
      hydraulicBounce: 0,
      vy: 0,
      exploded: false,
      sirenTimer: 0
    };

    this.vehicles.push(veh);
    return veh;
  }

  /* ------------------- SPAWN GANGS, HOMIES & PEDESTRIANS ------------------- */
  spawnInitialNPCs() {
    // Grove Street Families Homies in Ganton
    const groveCoords = [
      [8, 6], [6, -8], [-8, 10], [-14, -9], [16, 8], [-25, 4]
    ];
    groveCoords.forEach(([x, z]) => this.spawnNPC('grove', x, z, 'pistol'));

    // Ballas Gang Members in Idlewood & Glen Park
    const ballasCoords = [
      [-80, 32], [-84, 36], [-92, 62], [-96, 65],
      [-105, -78], [-112, -82], [-122, -88], [-118, -112]
    ];
    ballasCoords.forEach(([x, z]) => this.spawnNPC('ballas', x, z, 'uzi'));

    // Vagos Gang Members in East Los Santos
    const vagosCoords = [
      [102, -30], [105, -24], [104, 18], [108, 22]
    ];
    vagosCoords.forEach(([x, z]) => this.spawnNPC('vagos', x, z, 'pistol'));

    // Regular Pedestrians around Los Santos
    for (let i = 0; i < 16; i++) {
      const px = -180 + Math.random() * 280;
      const pz = -130 + Math.random() * 260;
      this.spawnNPC('ped', px, pz, 'fist');
    }
  }

  spawnNPC(role, x, z, weaponId = 'pistol') {
    const mesh = SAModelFactory.createCharacterModel({ role });
    mesh.position.set(x, 0, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;

    if (weaponId && weaponId !== 'fist') {
      const wMesh = SAModelFactory.createWeaponMesh(weaponId);
      mesh.userData.weaponMount.add(wMesh);
    }

    this.scene.add(mesh);

    const npc = {
      role,
      mesh,
      hp: role === 'cop' ? 90 : role === 'ped' ? 50 : 80,
      maxHp: role === 'cop' ? 90 : role === 'ped' ? 50 : 80,
      weaponId,
      state: 'wander', // 'wander', 'follow', 'attack', 'dead'
      recruited: false,
      walkCycle: Math.random() * 10,
      dirTimer: 1 + Math.random() * 4,
      shootCooldown: 0.6 + Math.random() * 0.8,
      deadTimer: 0,
      missionTag: null
    };

    this.npcs.push(npc);
    return npc;
  }

  /* ------------------- UPDATE VEHICLES, NPCS, GANG WARS & FX ------------------- */
  update(dt, time, game) {
    this.updateVehicles(dt, time, game);
    this.updateNPCs(dt, time, game);
    this.updateGangWar(dt, game);
    this.updateProjectiles(dt, game);
    this.updateParticles(dt);
    this.updateCashDrops(dt, time, game);
  }

  updateVehicles(dt, time, game) {
    const keys = game.keys;
    const carsFly = game.cheats.carsFly;

    this.vehicles.forEach((v) => {
      if (v.exploded) return;

      // Police lightbar flash
      if (v.police && v.mesh.userData.sirenRed && v.mesh.userData.sirenBlue) {
        const flash = Math.sin(time * 18) > 0;
        v.mesh.userData.sirenRed.material.color.setHex(flash ? 0xff1744 : 0x4a0010);
        v.mesh.userData.sirenBlue.material.color.setHex(!flash ? 0x00b0ff : 0x002244);
      }

      // Helicopter Rotor Spin
      if (v.isHelicopter && v.mesh.userData.mainRotor) {
        const spinSpeed = v.driver === 'player' ? 18 : 2.5;
        v.mesh.userData.mainRotor.rotation.y += dt * spinSpeed;
      }

      // Smoke particles when vehicle damaged
      if (v.hp < v.maxHp * 0.45 && Math.random() < 0.25) {
        this.spawnParticle(
          v.mesh.position.x + (Math.random() - 0.5),
          v.mesh.position.y + 1.1,
          v.mesh.position.z + 1.5,
          v.hp < v.maxHp * 0.2 ? 0xff5722 : 0x424242,
          0.45,
          0.6
        );
      }

      if (v.hp <= 0 && !v.exploded) {
        this.explodeVehicle(v, game);
        return;
      }

      // If Player is driving this vehicle
      if (v.driver === 'player') {
        const accel = v.type === 'infernus' ? 28 : v.type === 'bmx' ? 14 : 21;
        if (keys['KeyW'] || keys['ArrowUp']) {
          v.speed = Math.min(v.maxSpeed * (keys['ShiftLeft'] ? 1.25 : 1), v.speed + accel * dt);
        } else if (keys['KeyS'] || keys['ArrowDown']) {
          v.speed = Math.max(-v.maxSpeed * 0.45, v.speed - accel * 1.1 * dt);
        } else {
          v.speed *= Math.pow(0.28, dt);
          if (Math.abs(v.speed) < 0.15) v.speed = 0;
        }

        // Handbrake (Space) on ground cars
        if (keys['Space'] && !v.isHelicopter) {
          if (v.type === 'bmx' && v.mesh.position.y <= 0.05 && v.vy === 0) {
            // BMX Bunny Hop!
            v.vy = game.cheats.megaBunnyHop ? 22 : 8.5;
          } else {
            v.speed *= Math.pow(0.06, dt);
            if (Math.abs(v.speed) > 8) {
              this.spawnParticle(v.mesh.position.x, 0.2, v.mesh.position.z, 0xeeeeee, 0.35, 0.4);
            }
          }
        }

        // Steering
        const turnRate = v.isHelicopter ? 1.8 : 2.35;
        const speedFactor = v.isHelicopter ? 1 : Math.min(1, Math.abs(v.speed) / 4) * Math.sign(v.speed || 1);
        if (keys['KeyA'] || keys['ArrowLeft']) {
          v.mesh.rotation.y += turnRate * speedFactor * dt;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
          v.mesh.rotation.y -= turnRate * speedFactor * dt;
        }

        // Helicopter / Flying Cars vertical controls
        if (v.isHelicopter) {
          if (keys['Space']) v.mesh.position.y += 14 * dt;
          if (keys['ShiftLeft'] || keys['ControlLeft']) v.mesh.position.y = Math.max(0, v.mesh.position.y - 12 * dt);
          v.mesh.userData.chassis.rotation.x = (v.speed / v.maxSpeed) * 0.28;
        } else if (carsFly && Math.abs(v.speed) > 12) {
          // RIPAZHA Flying Cars cheat!
          v.mesh.position.y = Math.min(65, v.mesh.position.y + (Math.abs(v.speed) - 12) * 0.35 * dt);
        }

        // Rhino Tank Turret aims with camera yaw
        if (v.isTank && v.mesh.userData.turret) {
          v.mesh.userData.turret.rotation.y = game.camYaw - v.mesh.rotation.y + Math.PI;
        }
      } else {
        // Unoccupied vehicle friction
        v.speed *= Math.pow(0.12, dt);
      }

      // Move vehicle forward
      if (Math.abs(v.speed) > 0.01) {
        const nx = v.mesh.position.x + Math.sin(v.mesh.rotation.y) * v.speed * dt;
        const nz = v.mesh.position.z + Math.cos(v.mesh.rotation.y) * v.speed * dt;

        // Check building collision (unless flying high)
        const hitBuilding = v.mesh.position.y < 6 ? this.world.checkBuildingCollision(nx, nz, 1.4) : null;
        if (hitBuilding) {
          if (Math.abs(v.speed) > 14 && !v.isTank) {
            v.hp -= Math.abs(v.speed) * 0.9;
          }
          v.speed = -v.speed * 0.35;
        } else {
          v.mesh.position.x = nx;
          v.mesh.position.z = nz;
        }

        // Spin wheels
        v.mesh.userData.wheels.forEach((w) => {
          w.rotation.x += v.speed * dt * 1.4;
        });

        // Check if vehicle hits NPCs
        if (Math.abs(v.speed) > 7 && v.mesh.position.y < 2.2) {
          this.npcs.forEach((npc) => {
            if (npc.state === 'dead') return;
            if (npc.recruited && v.driver === 'player') return;
            const dx = npc.mesh.position.x - v.mesh.position.x;
            const dz = npc.mesh.position.z - v.mesh.position.z;
            if (dx * dx + dz * dz < 3.6) {
              this.damageNPC(npc, 120, game, v.driver === 'player');
            }
          });
        }

        // Check if vehicle hits Explosive Gas Station Pumps
        this.world.explosivePumps.forEach((pump) => {
          if (!pump.exploded) {
            const dx = pump.x - v.mesh.position.x;
            const dz = pump.z - v.mesh.position.z;
            if (dx * dx + dz * dz < 6.0 && Math.abs(v.speed) > 6) {
              this.triggerGasPumpExplosion(pump, game);
            }
          }
        });
      }

      // Stunt Ramps & Gravity for non-helicopters
      if (!v.isHelicopter) {
        for (const r of this.world.ramps) {
          if (
            v.mesh.position.x >= r.minX &&
            v.mesh.position.x <= r.maxX &&
            v.mesh.position.z >= r.minZ &&
            v.mesh.position.z <= r.maxZ &&
            Math.abs(v.speed) > 12 &&
            v.mesh.position.y < 2.5
          ) {
            v.vy = Math.abs(v.speed) * 0.42;
          }
        }

        if (v.mesh.position.y > 0 || v.vy !== 0) {
          if (!carsFly || Math.abs(v.speed) <= 12) {
            v.vy -= 22 * dt;
            v.mesh.position.y += v.vy * dt;
            if (v.mesh.position.y <= 0) {
              v.mesh.position.y = 0;
              v.vy = 0;
            }
          }
        }
      }

      // Lowrider Hydraulic Bounce decay
      if (v.hydraulicBounce > 0) {
        v.hydraulicBounce = Math.max(0, v.hydraulicBounce - dt * 3.2);
        v.mesh.userData.chassis.position.y = Math.abs(Math.sin(time * 18)) * v.hydraulicBounce * 0.65;
        v.mesh.userData.chassis.rotation.z = Math.sin(time * 14) * v.hydraulicBounce * 0.16;
      } else if (!v.isHelicopter) {
        v.mesh.userData.chassis.position.y = 0;
        v.mesh.userData.chassis.rotation.z = 0;
      }
    });
  }

  /* ------------------- UPDATE NPCS, GANGS, HOMIES & COPS ------------------- */
  updateNPCs(dt, time, game) {
    const px = game.player.pos.x;
    const pz = game.player.pos.z;

    // Spawn Police if Player has Wanted Stars
    const activeCops = this.npcs.filter((n) => n.role === 'cop' && n.state !== 'dead').length;
    const desiredCops = game.player.wanted * 2;
    if (activeCops < desiredCops && Math.random() < dt * 1.4) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 26 + Math.random() * 14;
      const cx = px + Math.cos(angle) * dist;
      const cz = pz + Math.sin(angle) * dist;
      if (!this.world.checkBuildingCollision(cx, cz, 0.8)) {
        const copWeapon = game.player.wanted >= 3 ? 'shotgun' : 'pistol';
        const cop = this.spawnNPC('cop', cx, cz, copWeapon);
        cop.state = 'attack';
      }
    }

    for (let i = this.npcs.length - 1; i >= 0; i--) {
      const npc = this.npcs[i];

      if (npc.state === 'dead') {
        npc.deadTimer += dt;
        if (npc.deadTimer > 16 && !npc.missionTag) {
          this.scene.remove(npc.mesh);
          this.npcs.splice(i, 1);
        }
        continue;
      }

      const dx = px - npc.mesh.position.x;
      const dz = pz - npc.mesh.position.z;
      const distSq = dx * dx + dz * dz;
      const dist = Math.sqrt(distSq);

      // Determine behavior state
      if (npc.role === 'cop' && game.player.wanted > 0) {
        npc.state = 'attack';
      } else if (npc.role === 'cop' && game.player.wanted === 0) {
        npc.state = 'wander';
      } else if ((npc.role === 'ballas' || npc.role === 'vagos') && dist < 24) {
        npc.state = 'attack';
      }

      // 1. RECRUITED GROVE STREET HOMIE: Follow CJ & shoot CJ's enemies!
      if (npc.recruited) {
        // Look for nearby hostile Ballas/Vagos/Cops
        let targetEnemy = null;
        let bestDist = 24;
        this.npcs.forEach((other) => {
          if (other.state !== 'dead' && (other.role === 'ballas' || other.role === 'vagos' || (other.role === 'cop' && game.player.wanted > 0))) {
            const d = other.mesh.position.distanceTo(npc.mesh.position);
            if (d < bestDist) {
              bestDist = d;
              targetEnemy = other;
            }
          }
        });

        if (targetEnemy) {
          npc.mesh.rotation.y = Math.atan2(
            targetEnemy.mesh.position.x - npc.mesh.position.x,
            targetEnemy.mesh.position.z - npc.mesh.position.z
          );
          npc.mesh.userData.rightArmGroup.rotation.x = -Math.PI / 2;
          npc.shootCooldown -= dt;
          if (npc.shootCooldown <= 0) {
            npc.shootCooldown = 0.75;
            saAudio.playGunshot('pistol');
            this.damageNPC(targetEnemy, 25, game, true);
          }
        } else if (dist > 4.2) {
          npc.mesh.rotation.y = Math.atan2(dx, dz);
          this.moveNPCForward(npc, 7.5, dt);
        } else {
          this.resetNPCLimbs(npc);
        }
        continue;
      }

      // 2. HOSTILE ATTACK STATE (Ballas, Vagos, Cops)
      if (npc.state === 'attack') {
        npc.mesh.rotation.y = Math.atan2(dx, dz);
        if (dist > 11) {
          this.moveNPCForward(npc, 5.8, dt);
        } else {
          this.resetNPCLimbs(npc);
        }

        if (dist < 25) {
          npc.mesh.userData.rightArmGroup.rotation.x = -Math.PI / 2;
          npc.shootCooldown -= dt;
          if (npc.shootCooldown <= 0) {
            npc.shootCooldown = npc.role === 'cop' ? 0.95 : 1.1;
            saAudio.playGunshot(npc.weaponId || 'pistol');
            this.spawnMuzzleFlash(npc.mesh.position.x, 1.5, npc.mesh.position.z);
            if (Math.random() < 0.55) {
              game.damagePlayer(npc.weaponId === 'shotgun' ? 12 : 6);
            }
          }
        }
      } else {
        // 3. WANDER STATE
        npc.dirTimer -= dt;
        if (npc.dirTimer <= 0) {
          npc.dirTimer = 2 + Math.random() * 4;
          npc.mesh.rotation.y += (Math.random() - 0.5) * 2.2;
        }
        this.moveNPCForward(npc, 2.4, dt);
      }
    }
  }

  moveNPCForward(npc, speed, dt) {
    const nx = npc.mesh.position.x + Math.sin(npc.mesh.rotation.y) * speed * dt;
    const nz = npc.mesh.position.z + Math.cos(npc.mesh.rotation.y) * speed * dt;
    if (!this.world.checkBuildingCollision(nx, nz, 0.55)) {
      npc.mesh.position.x = nx;
      npc.mesh.position.z = nz;
    } else {
      npc.mesh.rotation.y += Math.PI * 0.75;
    }

    npc.walkCycle += dt * speed * 2.4;
    const swing = Math.sin(npc.walkCycle) * 0.55;
    npc.mesh.userData.leftLegGroup.rotation.x = swing;
    npc.mesh.userData.rightLegGroup.rotation.x = -swing;
    npc.mesh.userData.leftArmGroup.rotation.x = -swing * 0.7;
    npc.mesh.userData.rightArmGroup.rotation.x = swing * 0.7;
  }

  resetNPCLimbs(npc) {
    npc.mesh.userData.leftLegGroup.rotation.x = 0;
    npc.mesh.userData.rightLegGroup.rotation.x = 0;
    npc.mesh.userData.leftArmGroup.rotation.x = 0;
  }

  /* ------------------- DAMAGE NPC, DROP CASH & TRIGGER GANG WARS ------------------- */
  damageNPC(npc, amount, game, byPlayer = true) {
    if (npc.state === 'dead') return;
    npc.hp -= amount;

    // Blood / hit spark particle
    this.spawnParticle(npc.mesh.position.x, 1.3, npc.mesh.position.z, 0xd50000, 0.28, 0.35);

    if (npc.hp > 0) {
      if (npc.role !== 'ped' && !npc.recruited) {
        npc.state = 'attack';
      }
      return;
    }

    // Knockdown Dead Pose
    npc.state = 'dead';
    npc.mesh.rotation.x = -Math.PI / 2;
    npc.mesh.position.y = 0.25;

    // Spawn green GTA SA Cash Bundle drop!
    this.spawnCashDrop(npc.mesh.position.x, npc.mesh.position.z, 120 + Math.floor(Math.random() * 180));

    if (byPlayer) {
      // Wanted level check if killing cops or civilians
      if (!game.cheats.neverWanted) {
        if (npc.role === 'cop') {
          game.setWantedLevel(Math.min(6, Math.max(2, game.player.wanted + 1)));
        } else if (npc.role === 'ped' && Math.random() < 0.55) {
          game.setWantedLevel(Math.max(1, game.player.wanted));
        }
      }

      // Gang War Check if killing Ballas or Vagos on their turf
      if (npc.role === 'ballas' || npc.role === 'vagos') {
        game.addStat('respect', 3, 'RESPECT');
        if (this.activeGangWar && npc.gangWarMember) {
          this.activeGangWar.enemiesRemaining--;
        } else if (!this.activeGangWar) {
          const turf = this.world.getTurfAt(game.player.pos.x, game.player.pos.z);
          if (turf && turf.owner !== 'grove') {
            this.recentGangKills++;
            if (this.recentGangKills >= 3) {
              this.recentGangKills = 0;
              this.startGangWar(turf, game);
            }
          }
        }
      }
    }
  }

  /* ------------------- GANG WAR SYSTEM (3 WAVES FOR TERRITORY) ------------------- */
  startGangWar(turf, game) {
    turf.underAttack = true;
    this.activeGangWar = {
      turf,
      wave: 1,
      enemiesRemaining: 0
    };
    game.showHelpNotification(`<b>¡HAS PROVOCADO UNA GUERRA DE BANDAS!</b><br>Sobrevive a 3 oleadas en <b>${turf.name}</b> para conquistar el territorio para Grove Street.`);
    this.spawnGangWarWave(game);
  }

  spawnGangWarWave(game) {
    const gw = this.activeGangWar;
    if (!gw) return;
    const count = 3 + gw.wave;
    gw.enemiesRemaining = count;
    const enemyRole = gw.turf.owner === 'vagos' ? 'vagos' : 'ballas';
    const weapon = gw.wave === 1 ? 'pistol' : gw.wave === 2 ? 'uzi' : 'ak47';

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const sx = game.player.pos.x + Math.cos(angle) * 24;
      const sz = game.player.pos.z + Math.sin(angle) * 24;
      const enemy = this.spawnNPC(enemyRole, sx, sz, weapon);
      enemy.state = 'attack';
      enemy.gangWarMember = true;
    }
  }

  updateGangWar(dt, game) {
    const gwHud = document.getElementById('gang-war-hud');
    if (!this.activeGangWar) {
      gwHud.classList.add('hidden');
      return;
    }

    gwHud.classList.remove('hidden');
    const gw = this.activeGangWar;
    document.getElementById('gw-wave-text').textContent =
      `OLEADA ${gw.wave} / 3 — ENEMIGOS RESTANTES: ${gw.enemiesRemaining}`;

    if (gw.enemiesRemaining <= 0) {
      if (gw.wave < 3) {
        gw.wave++;
        game.showSubtitle(`<span style="color:#69f0ae">Sweet:</span> ¡Bien hecho, CJ! ¡Ahí viene la oleada ${gw.wave}!`);
        this.spawnGangWarWave(game);
      } else {
        // Turf conquered for Grove Street Families!
        gw.turf.underAttack = false;
        gw.turf.owner = 'grove';
        this.activeGangWar = null;
        gwHud.classList.add('hidden');
        game.addMoney(2000);
        game.addStat('respect', 15, 'RESPECT');
        game.showBigBanner('¡TERRITORIO CONQUISTADO!', `${gw.turf.name} AHORA ES DE GROVE STREET<br>+$2000 | RESPECT +`);
        saAudio.playMissionPassedFanfare();
      }
    }
  }

  /* ------------------- EXPLOSIONS, ROCKETS & CASH DROPS ------------------- */
  fireRocket(startPos, dirVec) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff6d00 })
    );
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      vel: dirVec.clone().multiplyScalar(55),
      life: 3.0
    });
  }

  updateProjectiles(dt, game) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);

      // Rocket smoke trail
      this.spawnParticle(p.mesh.position.x, p.mesh.position.y, p.mesh.position.z, 0xff9800, 0.35, 0.35);

      const hitGround = p.mesh.position.y <= 0.25;
      const hitWall = this.world.checkBuildingCollision(p.mesh.position.x, p.mesh.position.z, 0.4);
      let hitVeh = false;
      this.vehicles.forEach((v) => {
        if (!v.exploded && v.mesh.position.distanceTo(p.mesh.position) < 2.8) {
          hitVeh = true;
        }
      });

      if (hitGround || hitWall || hitVeh || p.life <= 0) {
        this.createExplosionAt(p.mesh.position.x, Math.max(0.5, p.mesh.position.y), p.mesh.position.z, game);
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  createExplosionAt(x, y, z, game) {
    saAudio.playExplosion();
    for (let i = 0; i < 24; i++) {
      this.spawnParticle(
        x + (Math.random() - 0.5) * 4,
        y + Math.random() * 3,
        z + (Math.random() - 0.5) * 4,
        i % 2 === 0 ? 0xff5722 : 0xffeb3b,
        1.2,
        0.9
      );
    }

    // Damage nearby NPCs
    this.npcs.forEach((npc) => {
      if (npc.state !== 'dead') {
        const d = Math.hypot(npc.mesh.position.x - x, npc.mesh.position.z - z);
        if (d < 9.5) this.damageNPC(npc, 200, game, true);
      }
    });

    // Damage nearby Vehicles
    this.vehicles.forEach((v) => {
      if (!v.exploded) {
        const d = Math.hypot(v.mesh.position.x - x, v.mesh.position.z - z);
        if (d < 8.5) v.hp -= 260;
      }
    });
  }

  explodeVehicle(v, game) {
    v.exploded = true;
    v.speed = 0;
    if (v.driver === 'player') {
      game.exitVehicle();
      game.damagePlayer(45);
    }
    if (v.mesh.userData.bodyMat) {
      v.mesh.userData.bodyMat.color.setHex(0x1c1c1c);
    }
    this.createExplosionAt(v.mesh.position.x, v.mesh.position.y + 1, v.mesh.position.z, game);
  }

  triggerGasPumpExplosion(pump, game) {
    pump.exploded = true;
    pump.mesh.material.color.setHex(0x1a1a1a);
    this.createExplosionAt(pump.x, 1.5, pump.z, game);
  }

  spawnCashDrop(x, z, amount) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.22, 0.32),
      new THREE.MeshBasicMaterial({ color: 0x00e676 })
    );
    mesh.position.set(x, 0.5, z);
    this.scene.add(mesh);
    this.cashDrops.push({ mesh, x, z, amount, life: 25 });
  }

  updateCashDrops(dt, time, game) {
    const px = game.player.pos.x;
    const pz = game.player.pos.z;
    for (let i = this.cashDrops.length - 1; i >= 0; i--) {
      const c = this.cashDrops[i];
      c.life -= dt;
      c.mesh.rotation.y += dt * 3;
      c.mesh.position.y = 0.45 + Math.sin(time * 4 + c.x) * 0.12;

      const dist = Math.hypot(px - c.x, pz - c.z);
      if (dist < 1.8) {
        game.addMoney(c.amount);
        saAudio.playPickupSound();
        this.scene.remove(c.mesh);
        this.cashDrops.splice(i, 1);
      } else if (c.life <= 0) {
        this.scene.remove(c.mesh);
        this.cashDrops.splice(i, 1);
      }
    }
  }

  spawnMuzzleFlash(x, y, z) {
    this.spawnParticle(x, y, z, 0xfff176, 0.32, 0.12);
  }

  spawnParticle(x, y, z, color, size = 0.4, life = 0.5) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshBasicMaterial({ color })
    );
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.particles.push({
      mesh,
      vy: 1.5 + Math.random() * 2.5,
      life,
      maxLife: life
    });
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.mesh.position.y += p.vy * dt;
      const scale = Math.max(0.05, p.life / p.maxLife);
      p.mesh.scale.setScalar(scale);
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }
}

window.SAEntityManager = SAEntityManager;
