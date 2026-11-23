/* ==========================================================================
   GRAND THEFT AUTO: SAN ANDREAS — CLASSIC KEYBOARD CHEAT CODE SYSTEM
   Listens to typed keys in real-time (HESOYAM, ROCKETMAN, AIWPRTON, BAGUVIX,
   UZUMYMW, LXGIWYL, AEZAKMI, ASNAEB, BRINGITON, FULLCLIP, KANGAROO, RIPAZHA)
   ========================================================================== */

class SACheatManager {
  constructor(game) {
    this.game = game;
    this.buffer = '';

    window.addEventListener('keydown', (e) => {
      if (e.key && e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        this.buffer = (this.buffer + e.key.toUpperCase()).slice(-20);
        this.checkBuffer();
      }
    });
  }

  checkBuffer() {
    const codes = [
      'HESOYAM',
      'BAGUVIX',
      'FULLCLIP',
      'WANRLTW',
      'ROCKETMAN',
      'YECGAA',
      'UZUMYMW',
      'KJKSZPJ',
      'LXGIWYL',
      'AEZAKMI',
      'ASNAEB',
      'TURNDOWNTHEHEAT',
      'BRINGITON',
      'LJSPQK',
      'AIWPRTON',
      'PDNEJOH',
      'OHDUDE',
      'JUMPJET',
      'KANGAROO',
      'LFGMHAL',
      'CJPHONEHOME',
      'RIPAZHA',
      'CPKTNWT'
    ];

    for (const code of codes) {
      if (this.buffer.endsWith(code)) {
        this.buffer = '';
        this.executeCheat(code);
        break;
      }
    }
  }

  executeCheat(code) {
    const g = this.game;
    saAudio.playCheatSound();

    switch (code) {
      case 'HESOYAM':
        g.player.hp = 100;
        g.player.armor = 100;
        g.addMoney(250000);
        if (g.player.inVehicle) {
          g.player.inVehicle.hp = g.player.inVehicle.maxHp;
          g.player.inVehicle.exploded = false;
        }
        g.showCheatBanner('TRUCO ACTIVADO: HESOYAM (SALUD, CHALECO, +$250,000 Y REPARAR)');
        break;

      case 'BAGUVIX':
        g.cheats.godMode = !g.cheats.godMode;
        g.showCheatBanner(
          g.cheats.godMode
            ? 'TRUCO ACTIVADO: BAGUVIX (SALUD INFINITA)'
            : 'TRUCO DESACTIVADO: SALUD INFINITA'
        );
        break;

      case 'FULLCLIP':
      case 'WANRLTW':
        g.cheats.infiniteAmmo = !g.cheats.infiniteAmmo;
        g.showCheatBanner(
          g.cheats.infiniteAmmo
            ? 'TRUCO ACTIVADO: FULLCLIP (MUNICIÓN INFINITA)'
            : 'TRUCO DESACTIVADO: MUNICIÓN INFINITA'
        );
        break;

      case 'ROCKETMAN':
      case 'YECGAA':
        g.toggleJetpack(true);
        g.showCheatBanner('TRUCO ACTIVADO: ROCKETMAN (JETPACK EQUIPADO)');
        break;

      case 'UZUMYMW':
      case 'KJKSZPJ':
        g.giveWeapon('bat', 1, false);
        g.giveWeapon('pistol', 250, false);
        g.giveWeapon('uzi', 400, false);
        g.giveWeapon('shotgun', 150, false);
        g.giveWeapon('ak47', 450, false);
        g.giveWeapon('rpg', 50, false);
        g.giveWeapon('spray', 999, false);
        g.selectWeapon('ak47');
        g.showCheatBanner('TRUCO ACTIVADO: UZUMYMW (PACK DE ARMAS PESADAS)');
        break;

      case 'LXGIWYL':
        g.giveWeapon('bat', 1, false);
        g.giveWeapon('pistol', 180, false);
        g.giveWeapon('uzi', 250, false);
        g.giveWeapon('shotgun', 90, false);
        g.giveWeapon('spray', 999, false);
        g.selectWeapon('uzi');
        g.showCheatBanner('TRUCO ACTIVADO: LXGIWYL (PACK DE ARMAS DE BANDA)');
        break;

      case 'AEZAKMI':
        g.cheats.neverWanted = !g.cheats.neverWanted;
        if (g.cheats.neverWanted) g.setWantedLevel(0);
        g.showCheatBanner(
          g.cheats.neverWanted
            ? 'TRUCO ACTIVADO: AEZAKMI (NUNCA BUSCADO)'
            : 'TRUCO DESACTIVADO: AEZAKMI'
        );
        break;

      case 'ASNAEB':
      case 'TURNDOWNTHEHEAT':
        g.setWantedLevel(0);
        g.showCheatBanner('TRUCO ACTIVADO: ASNAEB (ESTRELLAS DE BÚSQUEDA BORRADAS)');
        break;

      case 'BRINGITON':
      case 'LJSPQK':
        g.cheats.neverWanted = false;
        g.setWantedLevel(6);
        g.showCheatBanner('TRUCO ACTIVADO: BRINGITON (6 ESTRELLAS — ESTADO DE SITIO)');
        break;

      case 'AIWPRTON':
        g.spawnVehicleInFront('rhino');
        g.showCheatBanner('TRUCO ACTIVADO: AIWPRTON (TANQUE MILITAR RHINO)');
        break;

      case 'PDNEJOH':
        g.spawnVehicleInFront('infernus');
        g.showCheatBanner('TRUCO ACTIVADO: PDNEJOH (SUPERDEPORTIVO INFERNUS)');
        break;

      case 'OHDUDE':
      case 'JUMPJET':
        g.spawnVehicleInFront('hunter');
        g.showCheatBanner('TRUCO ACTIVADO: OHDUDE (HELICÓPTERO MILITAR HUNTER)');
        break;

      case 'KANGAROO':
      case 'LFGMHAL':
        g.cheats.megaJump = !g.cheats.megaJump;
        g.showCheatBanner(
          g.cheats.megaJump
            ? 'TRUCO ACTIVADO: KANGAROO (SÚPER SALTO CANGURO)'
            : 'TRUCO DESACTIVADO: SÚPER SALTO'
        );
        break;

      case 'CJPHONEHOME':
        g.cheats.megaBunnyHop = !g.cheats.megaBunnyHop;
        g.showCheatBanner('TRUCO ACTIVADO: CJPHONEHOME (MEGA SALTO EN BMX)');
        break;

      case 'RIPAZHA':
        g.cheats.carsFly = !g.cheats.carsFly;
        g.showCheatBanner(
          g.cheats.carsFly
            ? 'TRUCO ACTIVADO: RIPAZHA (AUTOS VOLADORES)'
            : 'TRUCO DESACTIVADO: AUTOS VOLADORES'
        );
        break;

      case 'CPKTNWT':
        g.entities.vehicles.forEach((v) => {
          if (!v.exploded && v !== g.player.inVehicle) {
            const d = v.mesh.position.distanceTo(g.player.pos);
            if (d < 65) v.hp = 0;
          }
        });
        g.showCheatBanner('TRUCO ACTIVADO: CPKTNWT (EXPLOTAR TODOS LOS VEHÍCULOS)');
        break;
    }
  }
}

window.SACheatManager = SACheatManager;
