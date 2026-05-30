import { QuickSuggestion } from '../types';

export const INITIAL_SUGGESTIONS: QuickSuggestion[] = [
  // Comerciais
  { id: 'sug_1', text: 'Já agendou sua avaliação?', type: 'nota', category: 'comerciais' },
  { id: 'sug_2', text: 'Agende sua avaliação', type: 'nota', category: 'comerciais' },
  { id: 'sug_3', text: 'Oferta ativa', type: 'nota', category: 'comerciais' },
  { id: 'sug_4', text: 'Agenda aberta hoje', type: 'nota', category: 'comerciais' },
  { id: 'sug_5', text: 'Ainda dá tempo de agendar', type: 'nota', category: 'comerciais' },
  { id: 'sug_6', text: 'Avaliação disponível hoje', type: 'nota', category: 'comerciais' },
  { id: 'sug_7', text: 'Seu horário te espera', type: 'nota', category: 'comerciais' },
  { id: 'sug_8', text: 'Atendimento disponível hoje', type: 'nota', category: 'comerciais' },
  { id: 'sug_9', text: 'Agenda da semana aberta', type: 'nota', category: 'comerciais' },
  { id: 'sug_10', text: 'Comece sem comprar pacote', type: 'nota', category: 'comerciais' },

  // Laser e depilação
  { id: 'sug_11', text: 'Livre-se da lâmina', type: 'nota', category: 'laser' },
  { id: 'sug_12', text: 'Tem dúvida sobre laser?', type: 'nota', category: 'laser' },
  { id: 'sug_13', text: 'Bora começar pelo laser?', type: 'nota', category: 'laser' },
  { id: 'sug_14', text: 'Menos lâmina, mais liberdade', type: 'nota', category: 'laser' },
  { id: 'sug_15', text: 'Pele lisinha começa aqui', type: 'nota', category: 'laser' },
  { id: 'sug_16', text: 'Quer conhecer o laser?', type: 'nota', category: 'laser' },
  { id: 'sug_17', text: 'Laser com segurança', type: 'nota', category: 'laser' },
  { id: 'sug_18', text: 'Conheça antes de decidir', type: 'nota', category: 'laser' },
  { id: 'sug_19', text: 'Depilação sem complicação', type: 'nota', category: 'laser' },
  { id: 'sug_20', text: 'Sua rotina mais prática', type: 'nota', category: 'laser' },

  // Cuidado e pele
  { id: 'sug_21', text: 'Sua pele merece cuidado', type: 'nota', category: 'pele' },
  { id: 'sug_22', text: 'Hoje é dia de se cuidar', type: 'nota', category: 'pele' },
  { id: 'sug_23', text: 'Vamos cuidar da sua pele?', type: 'nota', category: 'pele' },
  { id: 'sug_24', text: 'Seu cuidado começa hoje', type: 'nota', category: 'pele' },
  { id: 'sug_25', text: 'Cuidado de verdade', type: 'nota', category: 'pele' },
  { id: 'sug_26', text: 'Uma pausa pra se cuidar', type: 'nota', category: 'pele' },
  { id: 'sug_27', text: 'Você merece praticidade', type: 'nota', category: 'pele' },
  { id: 'sug_28', text: 'Seu momento de cuidado', type: 'nota', category: 'pele' },
  { id: 'sug_29', text: 'Pele cuidada todos os dias', type: 'nota', category: 'pele' },
  { id: 'sug_30', text: 'Sua pele agradece', type: 'nota', category: 'pele' },

  // Proximidade
  { id: 'sug_31', text: 'Bom dia da Espaçolaser!', type: 'nota', category: 'proximidade' },
  { id: 'sug_32', text: 'Equipe pronta pra te atender!', type: 'nota', category: 'proximidade' },
  { id: 'sug_33', text: 'Passando pra lembrar você', type: 'nota', category: 'proximidade' },
  { id: 'sug_34', text: 'Chama a gente no direct', type: 'nota', category: 'proximidade' },
  { id: 'sug_35', text: 'Dúvidas? A gente te ajuda', type: 'nota', category: 'proximidade' },
  { id: 'sug_36', text: 'Fale com nossa equipe', type: 'nota', category: 'proximidade' },
  { id: 'sug_37', text: 'Hoje tem Espaçolaser', type: 'nota', category: 'proximidade' },
  { id: 'sug_38', text: 'Estamos por aqui', type: 'nota', category: 'proximidade' },
  { id: 'sug_39', text: 'Pode chamar a gente', type: 'nota', category: 'proximidade' },
  { id: 'sug_40', text: 'A equipe já está pronta', type: 'nota', category: 'proximidade' },

  // CTAs
  { id: 'sug_41', text: 'Tire sua dúvida hoje', type: 'nota', category: 'cta' },
  { id: 'sug_42', text: 'Agende sua avaliação', type: 'nota', category: 'cta' },
  { id: 'sug_43', text: 'Chama a gente no direct', type: 'nota', category: 'cta' },
  { id: 'sug_44', text: 'Agende pelo link da bio', type: 'nota', category: 'cta' },
  { id: 'sug_45', text: 'Fale com nossa equipe', type: 'nota', category: 'cta' },
  { id: 'sug_46', text: 'Pode chamar no direct', type: 'nota', category: 'cta' },
  { id: 'sug_47', text: 'Clique no link da bio', type: 'nota', category: 'cta' },
  { id: 'sug_48', text: 'Vem tirar sua dúvida', type: 'nota', category: 'cta' },
  { id: 'sug_49', text: 'Fale com a unidade', type: 'nota', category: 'cta' },
  { id: 'sug_50', text: 'Chama que a gente ajuda', type: 'nota', category: 'cta' },

  // Ideias de stories
  { id: 'sug_51', text: 'Bom dia da unidade', type: 'story', category: 'story' },
  { id: 'sug_52', text: 'Sala sendo preparada', type: 'story', category: 'story' },
  { id: 'sug_53', text: 'Recepção organizada', type: 'story', category: 'story' },
  { id: 'sug_54', text: 'Especialista se preparando', type: 'story', category: 'story' },
  { id: 'sug_55', text: 'Agenda do dia', type: 'story', category: 'story' },
  { id: 'sug_56', text: 'Dúvida frequente', type: 'story', category: 'story' },
  { id: 'sug_57', text: 'Oferta ativa', type: 'story', category: 'story' },
  { id: 'sug_58', text: 'Bastidor da equipe', type: 'story', category: 'story' },
  { id: 'sug_59', text: 'Chamada para avaliação', type: 'story', category: 'story' },
  { id: 'sug_60', text: 'Encerramento do dia', type: 'story', category: 'story' },
  { id: 'sug_61', text: 'Movimento da clínica', type: 'story', category: 'story' },
  { id: 'sug_62', text: 'Preparação da sala', type: 'story', category: 'story' },
  { id: 'sug_63', text: 'Equipe em atendimento', type: 'story', category: 'story' },
  { id: 'sug_64', text: 'Cuidados antes da sessão', type: 'story', category: 'story' },
  { id: 'sug_65', text: 'Cuidados depois da sessão', type: 'story', category: 'story' },

  // Ganchos para Reels
  { id: 'sug_66', text: 'Você ainda usa lâmina?', type: 'reels', category: 'reels' },
  { id: 'sug_67', text: 'Foliculite depois da depilação?', type: 'reels', category: 'reels' },
  { id: 'sug_68', text: 'Antes de comprar pacote, conheça o laser', type: 'reels', category: 'reels' },
  { id: 'sug_69', text: '3 motivos para começar agora', type: 'reels', category: 'reels' },
  { id: 'sug_70', text: 'O que ninguém te conta sobre depilação a laser', type: 'reels', category: 'reels' },
  { id: 'sug_71', text: 'Sua pele irrita depois da lâmina?', type: 'reels', category: 'reels' },
  { id: 'sug_72', text: 'Quer praticidade na rotina?', type: 'reels', category: 'reels' },
  { id: 'sug_73', text: 'Depilação a laser não é só estética', type: 'reels', category: 'reels' },
  { id: 'sug_74', text: 'Pare de sofrer com a lâmina', type: 'reels', category: 'reels' },
  { id: 'sug_75', text: 'Esse recado é pra quem tem foliculite', type: 'reels', category: 'reels' }
];
