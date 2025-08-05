import type { Extrato } from "../types/patrimonio"

// Função para limpar e converter valores monetários (R$ 1.234,56 -> 1234.56)
function parseCurrency(value: string): number {
  if (!value || typeof value !== "string") return 0
  // Remove tudo exceto dígitos, vírgulas e o sinal de menos no início
  const cleanedValue = value.replace(/[^\d,-]/g, "").replace(",", ".")
  return Number(cleanedValue)
}

// Função para converter data (dd/mm/yyyy -> yyyy-mm-dd)
function parseDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") return new Date().toISOString().split("T")[0]
  const parts = dateStr.split("/")
  if (parts.length !== 3) return new Date().toISOString().split("T")[0]
  const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
  return `${year}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`
}

export function processChaseExtrato(extratoBruto: string): { [key: string]: Extrato[] } {
  const extratosProcessados = {
    "chase-fisica": [] as Extrato[],
    "chase-empresa": [] as Extrato[],
    "chase-investimentos": [] as Extrato[],
  }

  const linhas = extratoBruto.trim().split("\n").slice(1) // Pula o cabeçalho

  for (const linha of linhas) {
    // Regex para capturar as colunas, lidando com espaços variáveis
    const match = linha.match(
      /(\w+)\s+(\d{2}\/\d{2}\/\d{4})\s+(Chase\s\w+)\s+(Saída|Entrada)\s+(.*?)\s+(-?[\d.,]+)\s+([\d.,]+)\s+(.*)/,
    )

    if (!match) continue

    const [, mes, data, contaBucket, tipo, descricao, valor, saldo, detalhes] = match

    const valorNum = parseCurrency(valor)
    const transacao = tipo === "Entrada" ? "entrada" : "saida_despesa"

    let bucketKey: keyof typeof extratosProcessados | null = null
    if (contaBucket === "Chase Física") bucketKey = "chase-fisica"
    else if (contaBucket === "Chase Empresa") bucketKey = "chase-empresa"
    else if (contaBucket === "Chase Investimento") bucketKey = "chase-investimentos"

    if (bucketKey) {
      const extrato: Extrato = {
        id: `${bucketKey}-${extratosProcessados[bucketKey].length}`,
        data: parseDate(data),
        transacao,
        categoria: "Movimentação Bancária", // Categoria padrão para extratos bancários
        descricao: descricao.trim(),
        valorBRL: Math.abs(valorNum),
        valorUSD: Math.abs(valorNum) / 5.0, // Cotação fixa para simplicidade
        status: "Confirmado",
        detalhes: detalhes.trim(),
        mes: new Date(parseDate(data)).toLocaleDateString("pt-BR", { month: "long", year: "2-digit" }),
        contaDoBucket: contaBucket,
        saldoFinal: 0, // Será calculado dinamicamente
      }
      extratosProcessados[bucketKey].push(extrato)
    }
  }

  return extratosProcessados
}
