import { StandardTask, Unit, Pendencia } from '../types';

export const INITIAL_UNITS: Unit[] = [
  {
    id: '1',
    name: '01 - Araripina',
    sigla: 'ARA',
    cidadeUf: 'Araripina/PE',
    active: true,
    gerente: 'Aline Oliveira',
    socia: 'Cristina ONE',
    instagramUrl: 'https://www.instagram.com/espacolaser_araripina',
    tiktokUrl: 'https://www.tiktok.com/@espacolaser_araripina',
    notes: 'Unidade muito comprometida com captação local.',
    region: 'PE',
    contactName: 'Aline Oliveira (Gerente)'
  },
  {
    id: '2',
    name: '02 - Serra Talhada',
    sigla: 'ST',
    cidadeUf: 'Serra Talhada/PE',
    active: true,
    gerente: 'Bárbara Souza',
    socia: 'Cristina ONE',
    instagramUrl: 'https://www.instagram.com/espacolaser_serratalhada',
    tiktokUrl: 'https://www.tiktok.com/@espacolaser_serratalhada',
    notes: 'Focar em stories sobre o laser Alex.',
    region: 'PE',
    contactName: 'Bárbara Souza (Gerente)'
  },
  {
    id: '3',
    name: '03 - Garanhuns',
    sigla: 'GUS',
    cidadeUf: 'Garanhuns/PE',
    active: true,
    gerente: 'Camila Tenório',
    socia: 'Simone Vasconcelos',
    instagramUrl: 'https://www.instagram.com/espacolaser_garanhuns',
    tiktokUrl: 'https://www.tiktok.com/@espacolaser_garanhuns',
    notes: 'Inaugurando nova sala de atendimento.',
    region: 'PE',
    contactName: 'Camila Tenório (Gerente)'
  },
  {
    id: '4',
    name: '04 - Cajazeiras',
    sigla: 'CZ',
    cidadeUf: 'Cajazeiras/PB',
    active: true,
    gerente: 'Daniela Lima',
    socia: 'Simone Vasconcelos',
    instagramUrl: 'https://www.instagram.com/espacolaser_cajazeiras',
    tiktokUrl: 'https://www.tiktok.com/@espacolaser_cajazeiras',
    notes: 'Checklist de lives quinzenais deve ser prioridade.',
    region: 'PB',
    contactName: 'Daniela Lima (Gerente)'
  },
  {
    id: '5',
    name: '05 - Vitória de Santo Antão',
    sigla: 'VSA',
    cidadeUf: 'Vitória de Santo Antão/PE',
    active: true,
    gerente: 'Emanuela Rocha',
    socia: 'Cristina ONE',
    instagramUrl: 'https://www.instagram.com/espacolaser_vitoria',
    tiktokUrl: 'https://www.tiktok.com/@espacolaser_vitoria',
    notes: 'Parceria ativa com micro-influenciadora.',
    region: 'PE',
    contactName: 'Emanuela Rocha (Gerente)'
  },
  {
    id: '6',
    name: '06 - Santana do Livramento',
    sigla: 'LIV',
    cidadeUf: 'Santana do Livramento/RS',
    active: true,
    gerente: 'Fernanda Martins',
    socia: 'Mariana Vasconcelos',
    instagramUrl: 'https://www.instagram.com/espacolaser_livramento',
    tiktokUrl: 'https://www.tiktok.com/@espacolaser_livramento',
    notes: 'Excelente engajamento no Reels local.',
    region: 'RS',
    contactName: 'Fernanda Martins (Gerente)'
  },
  {
    id: '7',
    name: '07 - Muriaé',
    sigla: 'MUR',
    cidadeUf: 'Muriaé/MG',
    active: true,
    gerente: 'Gláucia Mendes',
    socia: 'Simone Vasconcelos',
    instagramUrl: 'https://www.instagram.com/espacolaser_muriae',
    tiktokUrl: 'https://www.tiktok.com/@espacolaser_muriae',
    notes: 'Cobrar de perto o cronograma mensal de roteiros.',
    region: 'MG',
    contactName: 'Gláucia Mendes (Gerente)'
  },
  {
    id: '8',
    name: '08 - Vilhena',
    sigla: 'VIL',
    cidadeUf: 'Vilhena/RO',
    active: true,
    gerente: 'Helena Costa',
    socia: 'Mariana Vasconcelos',
    instagramUrl: 'https://www.instagram.com/espacolaser_vilhena',
    tiktokUrl: 'https://www.tiktok.com/@espacolaser_vilhena',
    notes: 'Público responde muito bem a depoimentos.',
    region: 'RO',
    contactName: 'Helena Costa (Gerente)'
  },
  {
    id: '9',
    name: '09 - Corumbá',
    sigla: 'COR',
    cidadeUf: 'Corumbá/MS',
    active: true,
    gerente: 'Isabela Silveira',
    socia: 'Cristina ONE',
    instagramUrl: 'https://www.instagram.com/espacolaser_corumba',
    tiktokUrl: 'https://www.tiktok.com/@espacolaser_corumba',
    notes: 'Ajustando cronograma de stories.',
    region: 'MS',
    contactName: 'Isabela Silveira (Gerente)'
  },
  {
    id: '10',
    name: '10 - Fortaleza',
    sigla: 'FOR',
    cidadeUf: 'Fortaleza/CE',
    active: true,
    gerente: 'Julia Vasques',
    socia: 'Simone Vasconcelos',
    instagramUrl: 'https://www.instagram.com/espacolaser_fortaleza',
    tiktokUrl: 'https://www.tiktok.com/@espacolaser_fortaleza',
    notes: 'Grande volume de clientes diários.',
    region: 'CE',
    contactName: 'Julia Vasques (Gerente)'
  },
  {
    id: '11',
    name: '11 - Macaé Shopping Plaza',
    sigla: 'MACS',
    cidadeUf: 'Macaé/RJ',
    active: true,
    gerente: 'Karla Drummond',
    socia: 'Cristina ONE',
    instagramUrl: 'https://www.instagram.com/espacolaser_macaeshop',
    tiktokUrl: 'https://www.tiktok.com/@espacolaser_macaeshop',
    notes: 'Apropriado para collabs regionais rápidos.',
    region: 'RJ',
    contactName: 'Karla Drummond (Gerente)'
  },
  {
    id: '12',
    name: '12 - Macaé Centro',
    sigla: 'MACE',
    cidadeUf: 'Macaé/RJ',
    active: true,
    gerente: 'Laura Fonseca',
    socia: 'Cristina ONE',
    instagramUrl: 'https://www.instagram.com/espacolaser_macaecentro',
    tiktokUrl: 'https://www.tiktok.com/@espacolaser_macaecentro',
    notes: 'Foco em captação presencial com promotoras.',
    region: 'RJ',
    contactName: 'Laura Fonseca (Gerente)'
  },
  {
    id: '13',
    name: '13 - Quixadá',
    sigla: 'QUIX',
    cidadeUf: 'Quixadá/CE',
    active: true,
    gerente: 'Marina Albuquerque',
    socia: 'Simone Vasconcelos',
    instagramUrl: 'https://www.instagram.com/espacolaser_quixada',
    tiktokUrl: 'https://www.tiktok.com/@espacolaser_quixada',
    notes: 'Produção em massa de depoimentos locais.',
    region: 'CE',
    contactName: 'Marina Albuquerque (Gerente)'
  }
];

export const INITIAL_STANDARD_TASKS: StandardTask[] = [
  // 1. CHECKLIST DIÁRIO
  {
    id: 'story-1',
    title: 'Story diário (1 story)',
    frequency: 'diario',
    description: 'Postar o story diário da unidade (mínimo de 1 story).',
    priority: 'alta'
  },
  {
    id: 'nota-instagram',
    title: 'Notas do Instagram (1 nota)',
    frequency: 'diario',
    description: 'Inserir uma nota no perfil do Instagram da unidade.',
    priority: 'media'
  },
  {
    id: 'postagem-principal',
    title: 'Postagens nas Segundas, Quartas e Sextas',
    frequency: 'diario',
    description: 'Publicar a postagem principal de Feed programada para Segundas, Quartas e Sextas.',
    priority: 'alta'
  },

  // 2. CHECKLIST SEMANAL
  {
    id: 'semanal-revisar-prioridades',
    title: 'Revisar prioridades da semana',
    frequency: 'semanal',
    description: 'Mapear e acompanhar os focos prioritários de tráfego orgânico e apoio para cada unidade ativa.',
    priority: 'alta'
  },
  {
    id: 'semanal-conferir-conteudos',
    title: 'Conferir conteúdos programados',
    frequency: 'semanal',
    description: 'Validar no agendador se todos os criativos estão programados nos horários corretos.',
    priority: 'alta'
  },
  {
    id: 'semanal-acompanhar-videos',
    title: 'Acompanhar vídeos pendentes',
    frequency: 'semanal',
    description: 'Enviar cobrança ativa de tomadas de vídeo faltantes pedidas às gerentes locais.',
    priority: 'media'
  },
  {
    id: 'semanal-revisar-materiais',
    title: 'Revisar materiais recebidos das unidades',
    frequency: 'semanal',
    description: 'Fazer curadoria de fotos e tomadas de vídeo brutas enviadas pelas franquias do Grupo ONE.',
    priority: 'media'
  },
  {
    id: 'semanal-organizar-reels',
    title: 'Organizar Reels da semana',
    frequency: 'semanal',
    description: 'Montar planilha de edição e sincronização de áudios em alta para Reels locais.',
    priority: 'alta'
  },
  {
    id: 'semanal-revisar-tiktok',
    title: 'Revisar TikTok',
    frequency: 'semanal',
    description: 'Verificar a presença e relevância de áudios em alta no perfil de TikTok de cada franquia.',
    priority: 'baixa'
  },
  {
    id: 'semanal-verificar-live',
    title: 'Verificar live gravada da semana',
    frequency: 'semanal',
    description: 'Visualizar andamento ou colab de lives para fechar as ofertas promocionais ativas.',
    priority: 'media'
  },
  {
    id: 'semanal-analise-parcial',
    title: 'Fazer análise parcial simples',
    frequency: 'semanal',
    description: 'Mensurar o progresso das métricas orgânicas básicas na metade da semana operacional.',
    priority: 'media'
  },
  {
    id: 'semanal-baixa-colaboracao',
    title: 'Identificar unidades com baixa colaboração',
    frequency: 'semanal',
    description: 'Sinalizar gerências do Grupo ONE que não estão dando retorno com materiais locais de vídeo.',
    priority: 'alta'
  },
  {
    id: 'semanal-reforcar-ofertas',
    title: 'Reforçar ofertas nos perfis',
    frequency: 'semanal',
    description: 'Subir links promocionais gerenciais e cupons nos destaques e links da bio do Instagram.',
    priority: 'media'
  },
  {
    id: 'semanal-fechar-pendencias',
    title: 'Fechar pendências da semana',
    frequency: 'semanal',
    description: 'Dar baixa em ocorrências antigas resolvidas na plataforma TráfegON Check.',
    priority: 'baixa'
  },
  {
    id: 'semanal-organizar-proxima',
    title: 'Organizar próxima semana',
    frequency: 'semanal',
    description: 'Estruturar o esqueleto e pauta básica do próximo ciclo semanal.',
    priority: 'baixa'
  },
  {
    id: 'semanal-reuniao-quinzenal-pontos',
    title: 'Separar pontos para reunião quinzenal, quando houver',
    frequency: 'semanal',
    description: 'Anotar gargalos críticos para levar à reunião quinzenal com gerentes locais.',
    priority: 'media'
  },

  // 3. CHECKLIST QUINZENAL
  {
    id: 'quinzenal-preparar-leitura',
    title: 'Preparar leitura simples dos resultados',
    frequency: 'quinzenal',
    description: 'Consolidar um pequeno sumário de performance quinzenal para a mesa de discussão.',
    priority: 'alta'
  },
  {
    id: 'quinzenal-conferir-visualizacoes',
    title: 'Conferir visualizações',
    frequency: 'quinzenal',
    description: 'Coletar do Analytics o volume parcial de views obtidos pela rede.',
    priority: 'media'
  },
  {
    id: 'quinzenal-conferir-alcance',
    title: 'Conferir alcance',
    frequency: 'quinzenal',
    description: 'Auditar o alcance orgânico dos posts de feed e reels.',
    priority: 'media'
  },
  {
    id: 'quinzenal-conferir-engajamento',
    title: 'Conferir engajamento',
    frequency: 'quinzenal',
    description: 'Conferir likes, compartilhamentos e salvar de conteúdos selecionados.',
    priority: 'media'
  },
  {
    id: 'quinzenal-conferir-mensagens',
    title: 'Conferir mensagens',
    frequency: 'quinzenal',
    description: 'Mapear tempo de resposta e abordagens recebidas na inbox (Directs e comentários).',
    priority: 'alta'
  },
  {
    id: 'quinzenal-listar-alerta',
    title: 'Listar unidades em alerta',
    frequency: 'quinzenal',
    description: 'Identificar franquias com métricas em queda ou faltas frequentes no check diário.',
    priority: 'alta'
  },
  {
    id: 'quinzenal-registrar-pontos',
    title: 'Registrar pontos de atenção',
    frequency: 'quinzenal',
    description: 'Anotar gargalos estruturais das franquias do Grupo ONE que travam os resultados.',
    priority: 'media'
  },
  {
    id: 'quinzenal-registrar-encaminhamentos',
    title: 'Registrar encaminhamentos',
    frequency: 'quinzenal',
    description: 'Compilar decisões operacionais e responsáveis de cada encaminhamento aprovado.',
    priority: 'baixa'
  },

  // 4. CHECKLIST MENSAL
  {
    id: 'mensal-criar-cronograma',
    title: 'Criar cronograma mensal com roteiros',
    frequency: 'mensal',
    description: 'Elaborar a planilha e orientações completas de posts e gravações locais.',
    priority: 'alta'
  },
  {
    id: 'mensal-enviar-cronograma',
    title: 'Enviar cronograma mensal',
    frequency: 'mensal',
    description: 'Disparar cronogramas validados nos canais de comunicação com gerentes e sócias.',
    priority: 'alta'
  },
  {
    id: 'mensal-datas-comemorativas',
    title: 'Conferir datas comemorativas',
    frequency: 'mensal',
    description: 'Identificar feriados ou eventos especiais do mês corrente para promoções relâmpago.',
    priority: 'media'
  },
  {
    id: 'mensal-comunicados-previstos',
    title: 'Conferir comunicados previstos',
    frequency: 'mensal',
    description: 'Checar com o franqueador se hay comunicados de rede nacionais a serem integrados.',
    priority: 'baixa'
  },
  {
    id: 'mensal-campanhas-ativas',
    title: 'Conferir campanhas ativas',
    frequency: 'mensal',
    description: 'Checar aderência de cupons promocionais ativos em todo o grupo.',
    priority: 'media'
  },
  {
    id: 'mensal-conteudos-gravacao',
    title: 'Separar conteúdos que dependem de gravação',
    frequency: 'mensal',
    description: 'Mapear roteiros complexos de depoimentos ou collabs para as clínicas gravarem de forma guiada.',
    priority: 'alta'
  },
  {
    id: 'mensal-preparar-ciclo',
    title: 'Preparar próximo ciclo',
    frequency: 'mensal',
    description: 'Efetuar planejamento prévio e alinhar novas demandas publicitárias com as sócias.',
    priority: 'media'
  }
];

export const INITIAL_PENDENCIAS: Pendencia[] = [
  {
    id: 'p1',
    unitId: '1',
    description: 'Unidade não enviou depoimento da cliente VIP prometido na terça-feira.',
    responsible: 'gerente',
    dateAdded: '2026-05-20',
    status: 'pendente',
    priority: 'alta',
    urgency: 'alta',
    origin: 'unidade',
    notes: 'Juliana informou que tentaria gravar neste sábado, aguardando envio.',
    prazo: '2026-05-27'
  },
  {
    id: 'p2',
    unitId: '3',
    description: 'Aprovação pendente dos posts do dia das mães pela diretoria do Grupo ONE.',
    responsible: 'socias',
    dateAdded: '2026-05-24',
    status: 'em_andamento',
    priority: 'media',
    urgency: 'media',
    origin: 'agencia',
    notes: 'Enviado para aprovação via WhatsApp das sócias.',
    prazo: '2026-05-26'
  },
  {
    id: 'p3',
    unitId: '4',
    description: 'Relembrar unidade de fazer stories mostrando a nova ponteira da máquina Alexandrite.',
    responsible: 'colaboradora',
    dateAdded: '2026-05-25',
    status: 'pendente',
    priority: 'baixa',
    urgency: 'baixa',
    origin: 'cronograma',
    notes: 'Camila ficou de registrar quando o fluxo de clientes estivesse abaixo da média.',
    prazo: '2026-05-29'
  }
];
