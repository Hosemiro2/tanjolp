export interface ProjetoReal {
  id: string;
  nome: string;
  composicao: string;
  narrativa: string;
  modelUrl: string;
}

export const PROJETOS_REAIS: ProjetoReal[] = [
  {
    id: "anel-marquise-solitario",
    nome: "Anel Marquise Solitário",
    composicao: "Ouro 18k bicolor · diamante marquise central + pavé",
    narrativa: "Peça real · modelada em 3D pela TANJŌ · pronta para fundição em ouro 18k",
    modelUrl: "https://bee.transfr.one/6a048316-17/model.glb",
  },
  {
    id: "anel-design-tanjo",
    nome: "Anel Design TANJŌ",
    composicao: "Ouro 18k · diamantes brancos e fancy yellow",
    narrativa: "Peça real · modelada em 3D pela TANJŌ · pronta para fundição em ouro 18k",
    modelUrl: "https://bee.transfr.one/6a0c5e8c-b4/model.glb",
  },
  {
    id: "pulseira-riviera-oval",
    nome: "Pulseira Riviera Oval 20 pontos",
    composicao: "Ouro 18k · diamantes e esmeraldas ovais",
    narrativa: "Peça real · modelada em 3D pela TANJŌ · pronta para fundição em ouro 18k",
    modelUrl: "https://bee.transfr.one/6a0bc12d-6a/model.glb",
  },
];
