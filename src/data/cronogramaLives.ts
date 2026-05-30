export interface CronogramaItem {
  data: string;
  unidade: string;
  sigla: string;
  unitId: string;
  horario: string;
}

export const CRONOGRAMA_LIVES_OFICIAL: CronogramaItem[] = [
  // Junho
  { data: "2026-06-01", unidade: "Araripina", sigla: "ARA", unitId: "1", horario: "15:00" },
  { data: "2026-06-03", unidade: "Serra Talhada", sigla: "ST", unitId: "2", horario: "15:00" },
  { data: "2026-06-08", unidade: "Garanhuns", sigla: "GUS", unitId: "3", horario: "15:00" },
  { data: "2026-06-10", unidade: "Cajazeiras", sigla: "CZ", unitId: "4", horario: "15:00" },
  { data: "2026-06-11", unidade: "Vitória de Santo Antão", sigla: "VSA", unitId: "5", horario: "15:00" },
  { data: "2026-06-15", unidade: "Santana do Livramento", sigla: "LIV", unitId: "6", horario: "15:00" },
  { data: "2026-06-17", unidade: "Muriaé", sigla: "MUR", unitId: "7", horario: "15:00" },
  { data: "2026-06-18", unidade: "Vilhena", sigla: "VIL", unitId: "8", horario: "15:00" },
  { data: "2026-06-22", unidade: "Corumbá", sigla: "COR", unitId: "9", horario: "15:00" },
  { data: "2026-06-23", unidade: "Fortaleza", sigla: "FOR", unitId: "10", horario: "15:00" },
  { data: "2026-06-25", unidade: "Macaé Shopping Plaza", sigla: "MACS", unitId: "11", horario: "15:00" },
  { data: "2026-06-26", unidade: "Macaé Centro", sigla: "MACE", unitId: "12", horario: "15:00" },
  { data: "2026-06-30", unidade: "Quixadá", sigla: "QUIX", unitId: "13", horario: "15:00" },

  // Julho
  { data: "2026-07-01", unidade: "Serra Talhada", sigla: "ST", unitId: "2", horario: "15:00" },
  { data: "2026-07-03", unidade: "Garanhuns", sigla: "GUS", unitId: "3", horario: "15:00" },
  { data: "2026-07-07", unidade: "Cajazeiras", sigla: "CZ", unitId: "4", horario: "15:00" },
  { data: "2026-07-09", unidade: "Vitória de Santo Antão", sigla: "VSA", unitId: "5", horario: "15:00" },
  { data: "2026-07-10", unidade: "Santana do Livramento", sigla: "LIV", unitId: "6", horario: "15:00" },
  { data: "2026-07-14", unidade: "Muriaé", sigla: "MUR", unitId: "7", horario: "15:00" },
  { data: "2026-07-16", unidade: "Vilhena", sigla: "VIL", unitId: "8", horario: "15:00" },
  { data: "2026-07-20", unidade: "Corumbá", sigla: "COR", unitId: "9", horario: "15:00" },
  { data: "2026-07-22", unidade: "Fortaleza", sigla: "FOR", unitId: "10", horario: "15:00" },
  { data: "2026-07-23", unidade: "Macaé Shopping Plaza", sigla: "MACS", unitId: "11", horario: "15:00" },
  { data: "2026-07-27", unidade: "Macaé Centro", sigla: "MACE", unitId: "12", horario: "15:00" },
  { data: "2026-07-29", unidade: "Quixadá", sigla: "QUIX", unitId: "13", horario: "15:00" },
  { data: "2026-07-31", unidade: "Araripina", sigla: "ARA", unitId: "1", horario: "15:00" },

  // Agosto
  { data: "2026-08-03", unidade: "Garanhuns", sigla: "GUS", unitId: "3", horario: "15:00" },
  { data: "2026-08-05", unidade: "Cajazeiras", sigla: "CZ", unitId: "4", horario: "15:00" },
  { data: "2026-08-06", unidade: "Vitória de Santo Antão", sigla: "VSA", unitId: "5", horario: "15:00" },
  { data: "2026-08-10", unidade: "Santana do Livramento", sigla: "LIV", unitId: "6", horario: "15:00" },
  { data: "2026-08-12", unidade: "Muriaé", sigla: "MUR", unitId: "7", horario: "15:00" },
  { data: "2026-08-13", unidade: "Vilhena", sigla: "VIL", unitId: "8", horario: "15:00" },
  { data: "2026-08-17", unidade: "Corumbá", sigla: "COR", unitId: "9", horario: "15:00" },
  { data: "2026-08-19", unidade: "Fortaleza", sigla: "FOR", unitId: "10", horario: "15:00" },
  { data: "2026-08-20", unidade: "Macaé Shopping Plaza", sigla: "MACS", unitId: "11", horario: "15:00" },
  { data: "2026-08-24", unidade: "Macaé Centro", sigla: "MACE", unitId: "12", horario: "15:00" },
  { data: "2026-08-26", unidade: "Quixadá", sigla: "QUIX", unitId: "13", horario: "15:00" },
  { data: "2026-08-27", unidade: "Araripina", sigla: "ARA", unitId: "1", horario: "15:00" },
  { data: "2026-08-31", unidade: "Serra Talhada", sigla: "ST", unitId: "2", horario: "15:00" },

  // Setembro
  { data: "2026-09-01", unidade: "Cajazeiras", sigla: "CZ", unitId: "4", horario: "15:00" },
  { data: "2026-09-03", unidade: "Vitória de Santo Antão", sigla: "VSA", unitId: "5", horario: "15:00" },
  { data: "2026-09-04", unidade: "Santana do Livramento", sigla: "LIV", unitId: "6", horario: "15:00" },
  { data: "2026-09-09", unidade: "Muriaé", sigla: "MUR", unitId: "7", horario: "15:00" },
  { data: "2026-09-11", unidade: "Vilhena", sigla: "VIL", unitId: "8", horario: "15:00" },
  { data: "2026-09-14", unidade: "Corumbá", sigla: "COR", unitId: "9", horario: "15:00" },
  { data: "2026-09-16", unidade: "Fortaleza", sigla: "FOR", unitId: "10", horario: "15:00" },
  { data: "2026-09-18", unidade: "Macaé Shopping Plaza", sigla: "MACS", unitId: "11", horario: "15:00" },
  { data: "2026-09-21", unidade: "Macaé Centro", sigla: "MACE", unitId: "12", horario: "15:00" },
  { data: "2026-09-23", unidade: "Quixadá", sigla: "QUIX", unitId: "13", horario: "15:00" },
  { data: "2026-09-25", unidade: "Araripina", sigla: "ARA", unitId: "1", horario: "15:00" },
  { data: "2026-09-28", unidade: "Serra Talhada", sigla: "ST", unitId: "2", horario: "15:00" },
  { data: "2026-09-30", unidade: "Garanhuns", sigla: "GUS", unitId: "3", horario: "15:00" },

  // Outubro
  { data: "2026-10-01", unidade: "Vitória de Santo Antão", sigla: "VSA", unitId: "5", horario: "15:00" },
  { data: "2026-10-05", unidade: "Santana do Livramento", sigla: "LIV", unitId: "6", horario: "15:00" },
  { data: "2026-10-06", unidade: "Muriaé", sigla: "MUR", unitId: "7", horario: "15:00" },
  { data: "2026-10-08", unidade: "Vilhena", sigla: "VIL", unitId: "8", horario: "15:00" },
  { data: "2026-10-09", unidade: "Corumbá", sigla: "COR", unitId: "9", horario: "15:00" },
  { data: "2026-10-14", unidade: "Fortaleza", sigla: "FOR", unitId: "10", horario: "15:00" },
  { data: "2026-10-16", unidade: "Macaé Shopping Plaza", sigla: "MACS", unitId: "11", horario: "15:00" },
  { data: "2026-10-19", unidade: "Macaé Centro", sigla: "MACE", unitId: "12", horario: "15:00" },
  { data: "2026-10-21", unidade: "Quixadá", sigla: "QUIX", unitId: "13", horario: "15:00" },
  { data: "2026-10-22", unidade: "Araripina", sigla: "ARA", unitId: "1", horario: "15:00" },
  { data: "2026-10-26", unidade: "Serra Talhada", sigla: "ST", unitId: "2", horario: "15:00" },
  { data: "2026-10-27", unidade: "Garanhuns", sigla: "GUS", unitId: "3", horario: "15:00" },
  { data: "2026-10-30", unidade: "Cajazeiras", sigla: "CZ", unitId: "4", horario: "15:00" },

  // Novembro
  { data: "2026-11-03", unidade: "Santana do Livramento", sigla: "LIV", unitId: "6", horario: "15:00" },
  { data: "2026-11-05", unidade: "Muriaé", sigla: "MUR", unitId: "7", horario: "15:00" },
  { data: "2026-11-06", unidade: "Vilhena", sigla: "VIL", unitId: "8", horario: "15:00" },
  { data: "2026-11-09", unidade: "Corumbá", sigla: "COR", unitId: "9", horario: "15:00" },
  { data: "2026-11-11", unidade: "Fortaleza", sigla: "FOR", unitId: "10", horario: "15:00" },
  { data: "2026-11-13", unidade: "Macaé Shopping Plaza", sigla: "MACS", unitId: "11", horario: "15:00" },
  { data: "2026-11-16", unidade: "Macaé Centro", sigla: "MACE", unitId: "12", horario: "15:00" },
  { data: "2026-11-17", unidade: "Quixadá", sigla: "QUIX", unitId: "13", horario: "15:00" },
  { data: "2026-11-19", unidade: "Araripina", sigla: "ARA", unitId: "1", horario: "15:00" },
  { data: "2026-11-24", unidade: "Serra Talhada", sigla: "ST", unitId: "2", horario: "15:00" },
  { data: "2026-11-25", unidade: "Garanhuns", sigla: "GUS", unitId: "3", horario: "15:00" },
  { data: "2026-11-26", unidade: "Cajazeiras", sigla: "CZ", unitId: "4", horario: "15:00" },
  { data: "2026-11-30", unidade: "Vitória de Santo Antão", sigla: "VSA", unitId: "5", horario: "15:00" },

  // Dezembro
  { data: "2026-12-01", unidade: "Muriaé", sigla: "MUR", unitId: "7", horario: "15:00" },
  { data: "2026-12-03", unidade: "Vilhena", sigla: "VIL", unitId: "8", horario: "15:00" },
  { data: "2026-12-04", unidade: "Corumbá", sigla: "COR", unitId: "9", horario: "15:00" },
  { data: "2026-12-08", unidade: "Fortaleza", sigla: "FOR", unitId: "10", horario: "15:00" },
  { data: "2026-12-09", unidade: "Macaé Shopping Plaza", sigla: "MACS", unitId: "11", horario: "15:00" },
  { data: "2026-12-11", unidade: "Macaé Centro", sigla: "MACE", unitId: "12", horario: "15:00" },
  { data: "2026-12-15", unidade: "Quixadá", sigla: "QUIX", unitId: "13", horario: "15:00" },
  { data: "2026-12-16", unidade: "Araripina", sigla: "ARA", unitId: "1", horario: "15:00" },
  { data: "2026-12-18", unidade: "Serra Talhada", sigla: "ST", unitId: "2", horario: "15:00" },
  { data: "2026-12-21", unidade: "Garanhuns", sigla: "GUS", unitId: "3", horario: "15:00" },
  { data: "2026-12-23", unidade: "Cajazeiras", sigla: "CZ", unitId: "4", horario: "15:00" },
  { data: "2026-12-28", unidade: "Vitória de Santo Antão", sigla: "VSA", unitId: "5", horario: "15:00" },
  { data: "2026-12-30", unidade: "Santana do Livramento", sigla: "LIV", unitId: "6", horario: "15:00" }
];
