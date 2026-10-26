// ---------------------------------------------------------------------------
// 50 PERFIS SIMULADOS (BACKLOG-BETA3 M11) — DADOS VERSIONADOS, sem lógica.
//
// Regra do dono: parecem jogadores reais; a flag `simulated` vive SÓ no servidor (perfil KV + metadata do
// ranking) e NUNCA sai em resposta de rota. Nunca recebem prêmio. O motor está em `_simulados.js`.
//
// CAMPOS:
//   id          estável (`sim_NNNN`, 8 chars: precisa passar o VALID_ID `[a-zA-Z0-9_-]{8,64}`); NUNCA mude — vira a
//               chave do save/perfil/ranking. Um save real é hex de 64: nunca colide.
//   nick        apelido de exibição (único entre si; o motor reserva em `nick:` pela mesma régua do jogador).
//   petName     nome que o "jogador" deu ao Soulmon.
//   line        caminho: poder | harmonia | benevolencia (→ `evolutionStage` `<estágio>-power|harmony|benevolence`).
//   element     elemento (os 17 do roster, `src/utils/novosSoulmonData.ts`).
//   artLine     linha de arte EXISTENTE (inicial/linha pronta, `_artLine.js`); sprite gerado vem depois (fila M11).
//   lv0, rate   level no dia-zero (2026-10-25) e levels ganhos por dia: curva de progresso (o estágio sai do level).
//   bond0       Vínculo no dia-zero (sobe 0,8 por level ganho).
//   skill       habilidade geral 0..1 (distribuição: 3 no topo, 7 altos, 15 médios, 25 baixos).
//   frequency   casual | regular | assiduo (chance de jogar no dia: 0,3 / 0,6 / 0,9).
//   prefs       jogo -> competitividade 0..1 (só os jogos que ele joga; ids de `RANKED_GAMES`).
//   daysPlaying dias de "conta" no dia-zero (vira `createdAt`).
// ---------------------------------------------------------------------------

export const SIM_EPOCH = '2026-10-25';

/** @type {ReadonlyArray<{ id: string, nick: string, petName: string, line: 'poder'|'harmonia'|'benevolencia', element: string, artLine: string, lv0: number, rate: number, bond0: number, skill: number, frequency: 'casual'|'regular'|'assiduo', prefs: Partial<Record<string, number>>, daysPlaying: number }>} */
export const SIMULADOS = Object.freeze([
  {id:'sim_0001',nick:'Lia_Moon',petName:'Bolinha',line:'poder',element:'vigor',artLine:'igni',lv0:5,rate:0.12,bond0:8,skill:0.34,frequency:'casual',prefs:{eco:0.35,dino:0.26,'match3':0.5},daysPlaying:170},
  {id:'sim_0002',nick:'kaito88',petName:'Ônix',line:'harmonia',element:'tempo',artLine:'industrial',lv0:1,rate:0.09,bond0:7,skill:0.11,frequency:'regular',prefs:{'soul-barrage':0.3,ppt:0.27,eco:0.34},daysPlaying:144},
  {id:'sim_0003',nick:'PedroH',petName:'Piu',line:'benevolencia',element:'luz',artLine:'thalindra',lv0:7,rate:0.12,bond0:9,skill:0.39,frequency:'casual',prefs:{'endless-rift':0.46,eco:0.52,'rogue-dungeon':0.36},daysPlaying:204},
  {id:'sim_0004',nick:'Nebulosa',petName:'Nuvem',line:'harmonia',element:'arcano',artLine:'industrial',lv0:3,rate:0.1,bond0:5,skill:0.15,frequency:'casual',prefs:{dino:0.55,eco:0.29,'rogue-dungeon':0.17},daysPlaying:147},
  {id:'sim_0005',nick:'mari.silva',petName:'Piu',line:'benevolencia',element:'vida',artLine:'nascente',lv0:2,rate:0.09,bond0:5,skill:0.2,frequency:'regular',prefs:{dino:0.38,'soul-barrage':0.29,ppt:0.2},daysPlaying:244},
  {id:'sim_0006',nick:'Kael_Rune',petName:'Raio',line:'harmonia',element:'espaco',artLine:'industrial',lv0:28,rate:0.19,bond0:25,skill:0.9,frequency:'assiduo',prefs:{'rogue-dungeon':0.74,'soul-barrage':0.65},daysPlaying:111},
  {id:'sim_0007',nick:'Zeca',petName:'Bruma',line:'benevolencia',element:'vida',artLine:'vida',lv0:13,rate:0.16,bond0:14,skill:0.6,frequency:'assiduo',prefs:{eco:0.65,dino:0.38,'soul-barrage':0.43},daysPlaying:46},
  {id:'sim_0008',nick:'luna_k',petName:'Dango',line:'poder',element:'marcial',artLine:'meteoro',lv0:13,rate:0.16,bond0:13,skill:0.62,frequency:'regular',prefs:{'soul-barrage':0.68,ppt:0.67,dino:0.56},daysPlaying:190},
  {id:'sim_0009',nick:'RafaGamer',petName:'Rastro',line:'benevolencia',element:'terra',artLine:'nascente',lv0:8,rate:0.14,bond0:9,skill:0.44,frequency:'casual',prefs:{dino:0.58,eco:0.37,'endless-rift':0.5},daysPlaying:89},
  {id:'sim_0010',nick:'Bia',petName:'Kiko',line:'harmonia',element:'som',artLine:'alento',lv0:3,rate:0.09,bond0:5,skill:0.28,frequency:'regular',prefs:{ppt:0.59,dino:0.22},daysPlaying:93},
  {id:'sim_0011',nick:'aurora7',petName:'Lótus',line:'harmonia',element:'espaco',artLine:'alento',lv0:26,rate:0.21,bond0:25,skill:0.84,frequency:'assiduo',prefs:{dino:0.8,'soul-barrage':0.72},daysPlaying:129},
  {id:'sim_0012',nick:'DuduX',petName:'Brasa',line:'poder',element:'marcial',artLine:'igni',lv0:3,rate:0.09,bond0:6,skill:0.29,frequency:'casual',prefs:{'soul-barrage':0.59,'match3':0.2},daysPlaying:75},
  {id:'sim_0013',nick:'ClaraV',petName:'Rastro',line:'poder',element:'sombra',artLine:'meteoro',lv0:2,rate:0.06,bond0:7,skill:0.05,frequency:'casual',prefs:{'rogue-dungeon':0.42,dino:0.22},daysPlaying:140},
  {id:'sim_0014',nick:'joaoDev',petName:'Kiko',line:'poder',element:'morte',artLine:'industrial',lv0:8,rate:0.13,bond0:10,skill:0.42,frequency:'casual',prefs:{'match3':0.67},daysPlaying:211},
  {id:'sim_0015',nick:'feliperibas',petName:'Tufo',line:'benevolencia',element:'ar',artLine:'nascente',lv0:2,rate:0.07,bond0:6,skill:0.16,frequency:'casual',prefs:{dino:0.32},daysPlaying:299},
  {id:'sim_0016',nick:'Yuki',petName:'Neon',line:'harmonia',element:'eletricidade',artLine:'astrase',lv0:5,rate:0.13,bond0:10,skill:0.38,frequency:'regular',prefs:{eco:0.51,ppt:0.53},daysPlaying:150},
  {id:'sim_0017',nick:'Gabi_R',petName:'Bruma',line:'poder',element:'fogo',artLine:'kaelen',lv0:16,rate:0.18,bond0:16,skill:0.68,frequency:'regular',prefs:{ppt:0.66,'match3':0.52,'rogue-dungeon':0.66},daysPlaying:48},
  {id:'sim_0018',nick:'nando',petName:'Gotinha',line:'benevolencia',element:'ar',artLine:'thalindra',lv0:8,rate:0.12,bond0:12,skill:0.46,frequency:'regular',prefs:{eco:0.73,'soul-barrage':0.44},daysPlaying:297},
  {id:'sim_0019',nick:'sol_e_mar',petName:'Dango',line:'benevolencia',element:'terra',artLine:'nascente',lv0:28,rate:0.22,bond0:27,skill:0.87,frequency:'assiduo',prefs:{'endless-rift':0.98,'soul-barrage':0.72,eco:0.76},daysPlaying:128},
  {id:'sim_0020',nick:'Hugo',petName:'Chispa',line:'poder',element:'marcial',artLine:'igni',lv0:2,rate:0.08,bond0:5,skill:0.21,frequency:'regular',prefs:{dino:0.58,eco:0.34},daysPlaying:104},
  {id:'sim_0021',nick:'tamires',petName:'Brasa',line:'poder',element:'vigor',artLine:'industrial',lv0:2,rate:0.05,bond0:5,skill:0.06,frequency:'regular',prefs:{dino:0.36,eco:0.2,'endless-rift':0.29},daysPlaying:275},
  {id:'sim_0022',nick:'Otavio_M',petName:'Musgo',line:'harmonia',element:'espaco',artLine:'astrase',lv0:4,rate:0.11,bond0:6,skill:0.22,frequency:'casual',prefs:{'soul-barrage':0.47,'match3':0.4},daysPlaying:138},
  {id:'sim_0023',nick:'lucasbm',petName:'Fagulha',line:'benevolencia',element:'ar',artLine:'thalindra',lv0:2,rate:0.1,bond0:5,skill:0.18,frequency:'casual',prefs:{eco:0.49,'rogue-dungeon':0.38},daysPlaying:122},
  {id:'sim_0024',nick:'Cacau',petName:'Rastro',line:'poder',element:'vileza',artLine:'igni',lv0:2,rate:0.11,bond0:7,skill:0.24,frequency:'casual',prefs:{'match3':0.56,ppt:0.34,'endless-rift':0.14},daysPlaying:142},
  {id:'sim_0025',nick:'vini.alves',petName:'Lótus',line:'poder',element:'fogo',artLine:'meteoro',lv0:5,rate:0.11,bond0:9,skill:0.36,frequency:'regular',prefs:{eco:0.68,dino:0.3},daysPlaying:296},
  {id:'sim_0026',nick:'Nina',petName:'Pipoca',line:'benevolencia',element:'ar',artLine:'thalindra',lv0:5,rate:0.12,bond0:8,skill:0.3,frequency:'casual',prefs:{'soul-barrage':0.32,'rogue-dungeon':0.25,ppt:0.18},daysPlaying:188},
  {id:'sim_0027',nick:'Dani_Z',petName:'Jade',line:'benevolencia',element:'vida',artLine:'thalindra',lv0:2,rate:0.12,bond0:5,skill:0.27,frequency:'casual',prefs:{ppt:0.41,'soul-barrage':0.27,'match3':0.33},daysPlaying:73},
  {id:'sim_0028',nick:'Beto',petName:'Chispa',line:'benevolencia',element:'agua',artLine:'vida',lv0:3,rate:0.1,bond0:7,skill:0.32,frequency:'casual',prefs:{dino:0.47,'endless-rift':0.5},daysPlaying:48},
  {id:'sim_0029',nick:'Isa',petName:'Fagulha',line:'benevolencia',element:'luz',artLine:'thalindra',lv0:11,rate:0.14,bond0:12,skill:0.51,frequency:'casual',prefs:{'match3':0.69,'soul-barrage':0.48,dino:0.34},daysPlaying:237},
  {id:'sim_0030',nick:'thales',petName:'Vulto',line:'poder',element:'marcial',artLine:'industrial',lv0:15,rate:0.17,bond0:17,skill:0.66,frequency:'regular',prefs:{eco:0.78,'soul-barrage':0.59,ppt:0.67},daysPlaying:229},
  {id:'sim_0031',nick:'Mel',petName:'Neon',line:'poder',element:'sombra',artLine:'industrial',lv0:4,rate:0.11,bond0:7,skill:0.35,frequency:'casual',prefs:{eco:0.68},daysPlaying:227},
  {id:'sim_0032',nick:'Caio_P',petName:'Quark',line:'poder',element:'sombra',artLine:'igni',lv0:2,rate:0.09,bond0:8,skill:0.17,frequency:'casual',prefs:{dino:0.28},daysPlaying:230},
  {id:'sim_0033',nick:'Pri',petName:'Jade',line:'poder',element:'vigor',artLine:'meteoro',lv0:5,rate:0.1,bond0:9,skill:0.4,frequency:'regular',prefs:{ppt:0.49},daysPlaying:202},
  {id:'sim_0034',nick:'Rodrigo_S',petName:'Tico',line:'poder',element:'vileza',artLine:'industrial',lv0:1,rate:0.07,bond0:5,skill:0.12,frequency:'regular',prefs:{'match3':0.47,eco:0.38,'soul-barrage':0.1},daysPlaying:221},
  {id:'sim_0035',nick:'Lara',petName:'Tico',line:'harmonia',element:'som',artLine:'astrase',lv0:8,rate:0.14,bond0:10,skill:0.48,frequency:'regular',prefs:{'match3':0.46},daysPlaying:184},
  {id:'sim_0036',nick:'Gui',petName:'Chispa',line:'poder',element:'vileza',artLine:'industrial',lv0:10,rate:0.13,bond0:14,skill:0.52,frequency:'regular',prefs:{dino:0.47,ppt:0.56,eco:0.55},daysPlaying:64},
  {id:'sim_0037',nick:'Manu',petName:'Sopro',line:'poder',element:'sombra',artLine:'kaelen',lv0:2,rate:0.07,bond0:7,skill:0.14,frequency:'regular',prefs:{'soul-barrage':0.35},daysPlaying:75},
  {id:'sim_0038',nick:'Davi_L',petName:'Cuco',line:'poder',element:'marcial',artLine:'meteoro',lv0:19,rate:0.19,bond0:18,skill:0.72,frequency:'assiduo',prefs:{'endless-rift':0.78},daysPlaying:41},
  {id:'sim_0039',nick:'Alice_N',petName:'Zumbi',line:'harmonia',element:'espaco',artLine:'astrase',lv0:6,rate:0.13,bond0:9,skill:0.41,frequency:'casual',prefs:{ppt:0.7},daysPlaying:279},
  {id:'sim_0040',nick:'ZePedro',petName:'Breu',line:'poder',element:'morte',artLine:'meteoro',lv0:9,rate:0.15,bond0:13,skill:0.5,frequency:'casual',prefs:{eco:0.75,ppt:0.62,'rogue-dungeon':0.36},daysPlaying:188},
  {id:'sim_0041',nick:'Carol',petName:'Pérola',line:'harmonia',element:'arcano',artLine:'alento',lv0:1,rate:0.1,bond0:6,skill:0.1,frequency:'regular',prefs:{dino:0.24,'match3':0.1},daysPlaying:87},
  {id:'sim_0042',nick:'matheus_r',petName:'Breu',line:'poder',element:'sombra',artLine:'igni',lv0:5,rate:0.13,bond0:10,skill:0.33,frequency:'casual',prefs:{'rogue-dungeon':0.68},daysPlaying:262},
  {id:'sim_0043',nick:'Mika_Sora',petName:'Rastro',line:'poder',element:'morte',artLine:'industrial',lv0:9,rate:0.14,bond0:13,skill:0.47,frequency:'casual',prefs:{'endless-rift':0.73,'soul-barrage':0.37},daysPlaying:233},
  {id:'sim_0044',nick:'leo_tc',petName:'Sopro',line:'poder',element:'marcial',artLine:'industrial',lv0:2,rate:0.1,bond0:8,skill:0.23,frequency:'casual',prefs:{'match3':0.43},daysPlaying:261},
  {id:'sim_0045',nick:'Helo',petName:'Jade',line:'harmonia',element:'gravidade',artLine:'industrial',lv0:17,rate:0.16,bond0:20,skill:0.7,frequency:'assiduo',prefs:{'endless-rift':0.94,dino:0.75,eco:0.48},daysPlaying:233},
  {id:'sim_0046',nick:'Samuel',petName:'Cacto',line:'poder',element:'vigor',artLine:'kaelen',lv0:1,rate:0.09,bond0:5,skill:0.08,frequency:'casual',prefs:{ppt:0.36},daysPlaying:261},
  {id:'sim_0047',nick:'Jujuba',petName:'Pérola',line:'poder',element:'sombra',artLine:'kaelen',lv0:1,rate:0.08,bond0:7,skill:0.09,frequency:'casual',prefs:{eco:0.25},daysPlaying:109},
  {id:'sim_0048',nick:'andre.f',petName:'Tico',line:'harmonia',element:'gravidade',artLine:'astrase',lv0:3,rate:0.11,bond0:5,skill:0.26,frequency:'regular',prefs:{'match3':0.35},daysPlaying:159},
  {id:'sim_0049',nick:'Sofia_M',petName:'Brasa',line:'harmonia',element:'som',artLine:'industrial',lv0:8,rate:0.14,bond0:12,skill:0.45,frequency:'casual',prefs:{ppt:0.53,eco:0.51,dino:0.4},daysPlaying:111},
  {id:'sim_0050',nick:'Kenzo',petName:'Chispa',line:'harmonia',element:'tempo',artLine:'industrial',lv0:16,rate:0.18,bond0:17,skill:0.64,frequency:'regular',prefs:{dino:0.59,'soul-barrage':0.67,'match3':0.55},daysPlaying:86},
]);
