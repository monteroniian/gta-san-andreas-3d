/* ==========================================================================
   GRAND THEFT AUTO: SAN ANDREAS — STORY MISSIONS & INTERACTIVE SHOPS
   Includes 5 Playable Iconic Missions (Tagging Up Turf, Cleaning the Hood,
   Drive-Thru, Wrong Side of the Tracks, Doberman) + Ammu-Nation & Pizza Shop.
   ========================================================================== */

class SAMissionManager {
  constructor(scene, world, entities) {
    this.scene = scene;
    this.world = world;
    this.entities = entities;

    this.completedCount = 0;
    this.activeMission = null;
    this.missionMarkers = [];
    this.storyNPCs = {};

    this.setupStoryCharactersAndMarkers();
  }

  setupStoryCharactersAndMarkers() {
    // Spawn Sweet, Ryder & Big Smoke standing by their houses in Grove Street
    const sweetMesh = SAModelFactory.createCharacterModel({ role: 'sweet' });
    sweetMesh.position.set(14, 0, 19);
    sweetMesh.rotation.y = -Math.PI * 0.75;
    this.scene.add(sweetMesh);
    this.storyNPCs.sweet = sweetMesh;

    const ryderMesh = SAModelFactory.createCharacterModel({ role: 'ryder' });
    ryderMesh.position.set(14, 0, -19);
    ryderMesh.rotation.y = -Math.PI * 0.25;
    this.scene.add(ryderMesh);
    this.storyNPCs.ryder = ryderMesh;

    const smokeMesh = SAModelFactory.createCharacterModel({ role: 'smoke' });
    smokeMesh.position.set(20, 0, 4);
    smokeMesh.rotation.y = -Math.PI / 2;
    this.scene.add(smokeMesh);
    this.storyNPCs.smoke = smokeMesh;

    // 5 Red Glowing Mission Cylinder Markers
    const definitions = [
      {
        id: 'tagging',
        blip: 'S',
        title: 'TAGGING UP TURF (Sweet)',
        x: 13,
        z: 17,
        completed: false
      },
      {
        id: 'cleaning',
        blip: 'R',
        title: 'CLEANING THE HOOD (Ryder)',
        x: 13,
        z: -17,
        completed: false
      },
      {
        id: 'drivethru',
        blip: 'BS',
        title: 'DRIVE-THRU (Big Smoke)',
        x: 19,
        z: 2,
        completed: false
      },
      {
        id: 'train',
        blip: 'BS',
        title: 'WRONG SIDE OF THE TRACKS',
        x: 56,
        z: -12,
        completed: false
      },
      {
        id: 'doberman',
        blip: 'CJ',
        title: 'DOBERMAN (Conquista de Glen Park)',
        x: -68,
        z: -36,
        completed: false
      }
    ];

    definitions.forEach((def) => {
      const markerMesh = this.world.addGlowMarker(def.x, def.z, 0xff1744, 1.7);
      this.missionMarkers.push({ ...def, markerMesh });
    });
  }

  update(dt, game) {
    const px = game.player.pos.x;
    const pz = game.player.pos.z;

    // If no active mission, check if player steps into a Red Mission Marker
    if (!this.activeMission) {
      for (const m of this.missionMarkers) {
        if (!m.markerMesh.visible) continue;
        const dist = Math.hypot(px - m.x, pz - m.z);
        if (dist < 2.2 && !game.player.inVehicle) {
          this.startMission(m, game);
          break;
        }
      }
      return;
    }

    // Update active mission logic
    const am = this.activeMission;

    if (am.id === 'tagging') {
      const sprayedNow = this.world.graffitiTags.filter((t) => t.sprayed).length;
      const needed = Math.max(0, am.targetTags - sprayedNow);
      if (needed > 0) {
        this.setMissionHUD(
          'MISIÓN: TAGGING UP TURF',
          `Pinta graffitis morados con la Lata de Spray (Click Izq): faltan ${needed}`
        );
        // Point radar target to nearest unsprayed tag
        const nextTag = this.world.graffitiTags.find((t) => !t.sprayed);
        if (nextTag) {
          am.targetX = nextTag.x;
          am.targetZ = nextTag.z;
        }
      } else {
        this.setMissionHUD('MISIÓN: TAGGING UP TURF', '¡Regresa a la rotonda de Grove Street!');
        am.targetX = 6;
        am.targetZ = 0;
        if (Math.hypot(px - 6, pz - 0) < 9) {
          this.completeMission(game, 1500, '¡Sweet está orgulloso! Grove Street vuelve a hacerse respetar.');
        }
      }
    } else if (am.id === 'cleaning') {
      const alive = am.targets.filter((n) => n.state !== 'dead').length;
      if (alive > 0) {
        const firstAlive = am.targets.find((n) => n.state !== 'dead');
        am.targetX = firstAlive.mesh.position.x;
        am.targetZ = firstAlive.mesh.position.z;
        this.setMissionHUD('MISIÓN: CLEANING THE HOOD', `Elimina a los traficantes Ballas en Idlewood: ${alive} restantes`);
      } else {
        this.completeMission(game, 2500, 'Ryder: "¡Así es como limpiamos el barrio, CJ!"');
      }
    } else if (am.id === 'drivethru') {
      if (am.step === 1) {
        am.targetX = -95;
        am.targetZ = 78;
        this.setMissionHUD('MISIÓN: DRIVE-THRU', 'Lleva a Big Smoke al Drive-Thru de Idlewood (Punto Amarillo)');
        if (Math.hypot(px - (-95), pz - 78) < 10) {
          am.step = 2;
          game.showSubtitle(
            `<span style="color:#69f0ae">Big Smoke:</span> "Quiero dos números 9, un número 9 grande, un número 6 con extra salsa, dos 45 y una soda grande."`
          );
          // Spawn Ballas hit squad in Idlewood
          am.targets = [
            this.entities.spawnNPC('ballas', -82, 55, 'uzi'),
            this.entities.spawnNPC('ballas', -85, 58, 'uzi'),
            this.entities.spawnNPC('ballas', -79, 58, 'pistol')
          ];
          am.targets.forEach((t) => {
            t.state = 'attack';
            t.missionTag = true;
          });
        }
      } else if (am.step === 2) {
        const alive = am.targets.filter((n) => n.state !== 'dead').length;
        if (alive > 0) {
          const first = am.targets.find((n) => n.state !== 'dead');
          am.targetX = first.mesh.position.x;
          am.targetZ = first.mesh.position.z;
          this.setMissionHUD('MISIÓN: DRIVE-THRU', `¡Emboscada Ballas! Elimina a los atacantes (${alive} restantes)`);
        } else {
          this.completeMission(game, 3500, 'Big Smoke: "¡Nadie se mete con mi comida ni con Grove Street!"');
        }
      }
    } else if (am.id === 'train') {
      const trainZ = this.world.trainZ;
      am.targetX = 68;
      am.targetZ = trainZ;

      // Keep Vagos targets riding on top of the moving freight train!
      am.targets.forEach((vago, idx) => {
        if (vago.state !== 'dead') {
          vago.mesh.position.set(68, 3.8, trainZ - idx * 8);
        }
      });

      const alive = am.targets.filter((n) => n.state !== 'dead').length;
      this.setMissionHUD(
        'MISIÓN: WRONG SIDE OF THE TRACKS',
        `Sigue al tren en las vías del este y elimina a los Vagos en el techo (${alive} restantes)`
      );

      // Iconic line if player gets far from train
      const distToTrain = Math.hypot(px - 68, pz - trainZ);
      if (distToTrain > 95 && !am.warnedTrain) {
        am.warnedTrain = true;
        game.showSubtitle(
          `<span style="color:#69f0ae">Big Smoke:</span> "¡Todo lo que tenías que hacer era seguir el maldito tren, CJ!"`
        );
      }

      if (alive === 0) {
        this.completeMission(game, 5000, '¡Seguiste el maldito tren y eliminaste a todos los Vagos!');
      }
    } else if (am.id === 'doberman') {
      const alive = am.targets.filter((n) => n.state !== 'dead').length;
      if (alive > 0) {
        const first = am.targets.find((n) => n.state !== 'dead');
        am.targetX = first.mesh.position.x;
        am.targetZ = first.mesh.position.z;
        this.setMissionHUD('MISIÓN: DOBERMAN', `Toma el control de Glen Park eliminando a los líderes Ballas (${alive} restantes)`);
      } else {
        const gpTurf = this.world.turfs.find((t) => t.id === 'glenpark');
        if (gpTurf) gpTurf.owner = 'grove';
        this.completeMission(game, 10000, '¡Glen Park ahora pertenece a las familias de Grove Street!');
      }
    }
  }

  startMission(mDef, game) {
    saAudio.playMenuClick();
    mDef.markerMesh.visible = false;

    const currentSprayed = this.world.graffitiTags.filter((t) => t.sprayed).length;
    const totalUnsprayed = 6 - currentSprayed;

    if (mDef.id === 'tagging') {
      game.giveWeapon('spray', 999, true);
      game.showBigBanner('TAGGING UP TURF', 'MISIÓN DE SWEET JOHNSON');
      game.showSubtitle(
        `<span style="color:#69f0ae">Sweet:</span> "¡CJ! Toma esta lata de spray y pinta sobre los graffitis de los Ballas para que sepan que volviste."`
      );
      this.activeMission = {
        id: 'tagging',
        def: mDef,
        targetTags: currentSprayed + Math.min(2, Math.max(1, totalUnsprayed)),
        targetX: -41.5,
        targetZ: -10.8
      };
      if (totalUnsprayed === 0) {
        // Reset 2 tags so mission can still be played
        this.world.graffitiTags[0].sprayed = false;
        this.world.graffitiTags[1].sprayed = false;
        this.activeMission.targetTags = 5;
      }
    } else if (mDef.id === 'cleaning') {
      game.giveWeapon('bat', 1, false);
      game.giveWeapon('pistol', 60, true);
      game.showBigBanner('CLEANING THE HOOD', 'MISIÓN DE RYDER');
      game.showSubtitle(
        `<span style="color:#69f0ae">Ryder:</span> "¡Vamos a Idlewood, CJ! Esos traficantes Ballas están envenenando a nuestra gente."`
      );
      const dealers = [
        this.entities.spawnNPC('ballas', -82, 26, 'pistol'),
        this.entities.spawnNPC('ballas', -86, 29, 'uzi'),
        this.entities.spawnNPC('ballas', -79, 31, 'pistol'),
        this.entities.spawnNPC('ballas', -84, 34, 'uzi')
      ];
      dealers.forEach((d) => {
        d.state = 'attack';
        d.missionTag = true;
      });
      this.activeMission = {
        id: 'cleaning',
        def: mDef,
        targets: dealers,
        targetX: -82,
        targetZ: 28
      };
    } else if (mDef.id === 'drivethru') {
      game.giveWeapon('uzi', 150, true);
      game.showBigBanner('DRIVE-THRU', 'MISIÓN DE BIG SMOKE');
      game.showSubtitle(
        `<span style="color:#69f0ae">Big Smoke:</span> "¡Tengo hambre, CJ! Sube a un auto y llévame al restaurante de Idlewood."`
      );
      this.activeMission = {
        id: 'drivethru',
        def: mDef,
        step: 1,
        targets: [],
        targetX: -95,
        targetZ: 78
      };
    } else if (mDef.id === 'train') {
      game.giveWeapon('uzi', 240, true);
      game.giveWeapon('ak47', 180, true);
      // Spawn a Sanchez dirtbike right beside CJ if needed
      this.entities.spawnVehicle('sanchez', 60, -8, 0, 0xfbc02d);
      this.world.trainZ = -40;

      const vagosOnTrain = [
        this.entities.spawnNPC('vagos', 68, -40, 'uzi'),
        this.entities.spawnNPC('vagos', 68, -48, 'uzi'),
        this.entities.spawnNPC('vagos', 68, -56, 'pistol')
      ];
      vagosOnTrain.forEach((v) => {
        v.missionTag = true;
        v.hp = 65;
      });

      game.showBigBanner('WRONG SIDE OF THE TRACKS', '¡SIGUE EL MALDITO TREN, CJ!');
      game.showSubtitle(
        `<span style="color:#69f0ae">Big Smoke:</span> "¡Sube a la Sanchez, CJ! ¡Sigue al tren por las vías y acaba con esos Vagos en el techo!"`
      );
      this.activeMission = {
        id: 'train',
        def: mDef,
        targets: vagosOnTrain,
        warnedTrain: false,
        targetX: 68,
        targetZ: -40
      };
    } else if (mDef.id === 'doberman') {
      game.giveWeapon('ak47', 250, true);
      game.player.armor = 100;
      const bosses = [
        this.entities.spawnNPC('ballas', -115, -88, 'ak47'),
        this.entities.spawnNPC('ballas', -112, -95, 'uzi'),
        this.entities.spawnNPC('ballas', -118, -95, 'shotgun'),
        this.entities.spawnNPC('ballas', -115, -104, 'ak47'),
        this.entities.spawnNPC('ballas', -108, -98, 'uzi')
      ];
      bosses.forEach((b) => {
        b.state = 'attack';
        b.missionTag = true;
      });

      game.showBigBanner('DOBERMAN', 'ASALTO A GLEN PARK');
      game.showSubtitle(
        `<span style="color:#69f0ae">Sweet:</span> "¡Toma este AK-47 y conquista Glen Park para Grove Street, CJ!"`
      );
      this.activeMission = {
        id: 'doberman',
        def: mDef,
        targets: bosses,
        targetX: -115,
        targetZ: -95
      };
    }
  }

  completeMission(game, cashReward, subtitleMsg) {
    const am = this.activeMission;
    if (!am) return;
    if (!am.def.completed) {
      am.def.completed = true;
      this.completedCount++;
    }
    // Keep marker visible so player can replay missions anytime if they want
    am.def.markerMesh.visible = true;
    this.activeMission = null;
    document.getElementById('mission-hud').classList.add('hidden');

    game.addMoney(cashReward);
    game.addStat('respect', 20, 'RESPECT');
    saAudio.playMissionPassedFanfare();
    game.showBigBanner('¡MISIÓN SUPERADA!', `+$${cashReward}<br>RESPECT +`);
    if (subtitleMsg) {
      game.showSubtitle(subtitleMsg);
    }
  }

  setMissionHUD(title, extra) {
    const box = document.getElementById('mission-hud');
    box.classList.remove('hidden');
    document.getElementById('mission-hud-title').textContent = title;
    document.getElementById('mission-hud-extra').textContent = extra;
  }
}

window.SAMissionManager = SAMissionManager;
