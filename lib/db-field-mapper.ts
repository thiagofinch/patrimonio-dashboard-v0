const FIELD_MAPPING: { [key: string]: string } = {
  // Bucket Fields
  id: "id",
  createdAt: "created_at",
  nome: "nome",
  userId: "user_id",
  ownerId: "owner_id",
  moedaPrincipal: "moeda_principal",
  capitalInicialBRL: "capital_inicial_brl",
  capitalInicialUSD: "capital_inicial_usd",
  dataCapitalInicial: "data_capital_inicial",
  capitalInvestido: "capital_investido",
  aportesMensais: "aportes_mensais",
  periodoMeses: "periodo_meses",
  taxaRendimento: "taxa_rendimento",
  taxaEmprestimo: "taxa_emprestimo",
  liquidez: "liquidez",
  objetivo: "objetivo",
  metadata: "metadata",
  categoria: "categoria",

  // Extrato Fields
  bucketId: "bucket_id",
  data: "data",
  transacao: "transacao",
  // categoria: 'categoria', // 'categoria' já está mapeado acima
  descricao: "descricao",
  valorBRL: "valor_brl",
  valorUSD: "valor_usd",
  valor: "valor_brl", // Mapeamento direto adicionado
  finalidade: "finalidade",
  status: "status",
  isRendimento: "is_rendimento",
  loanId: "loan_id",
  relatedLoanId: "related_loan_id",
  statusEmprestimo: "status_emprestimo",
  contaOrigemId: "conta_origem_id",
  contaDestinoId: "conta_destino_id",
  agendamentoId: "agendamento_id",
}

const REVERSE_FIELD_MAPPING: { [key: string]: string } = Object.entries(FIELD_MAPPING).reduce(
  (acc, [key, value]) => {
    acc[value] = key
    return acc
  },
  {} as { [key: string]: string },
)

export function mapToDb(data: { [key: string]: any }): { [key: string]: any } {
  const mapped: { [key: string]: any } = {}
  for (const key in data) {
    if (FIELD_MAPPING[key]) {
      mapped[FIELD_MAPPING[key]] = data[key]
    }
  }
  return mapped
}

export function mapFromDb(data: { [key: string]: any }): { [key: string]: any } {
  const mapped: { [key: string]: any } = {}
  for (const key in data) {
    if (REVERSE_FIELD_MAPPING[key]) {
      mapped[REVERSE_FIELD_MAPPING[key]] = data[key]
    } else {
      mapped[key] = data[key] // Keep unmapped fields
    }
  }
  return mapped
}
