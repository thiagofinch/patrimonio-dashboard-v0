"use client"

import type { Bucket, Extrato, LogEntry, LogType } from "@/types/patrimonio"
import type { Dispatch, ReactNode, SetStateAction } from "react"
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { iconMap, defaultIcon } from "@/lib/icon-map"
import { toast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"

// Criar o cliente Supabase diretamente aqui
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// FUNÇÃO PARA SINCRONIZAR CAPITAL INVESTIDO COM SALDO FINAL
const sincronizarCapitalInvestido = async (bucketId: string) => {
  console.log("💰 Sincronizando capital investido e saldo atual do bucket:", bucketId)

  // Buscar último saldo do extrato
  const { data: ultimoExtrato } = await supabaseClient
    .from("extratos")
    .select("saldo_final")
    .eq("bucket_id", bucketId)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  const saldoFinal = ultimoExtrato?.saldo_final || 0

  // Atualizar capital investido E saldo atual para refletir o saldo
  await supabaseClient
    .from("buckets")
    .update({
      capital_investido: saldoFinal,
      saldo_atual: saldoFinal,
    })
    .eq("id", bucketId)

  console.log(`✅ Capital investido e saldo atual atualizados para: ${formatCurrency(saldoFinal)}`)
}

// FUNÇÃO CRÍTICA CORRIGIDA PARA RECALCULAR TODOS OS SALDOS - COM TRATAMENTO DE NEUTRALIDADE
const recalcularTodosOsSaldos = async (bucketId: string) => {
  console.log("🔧 RECALCULANDO TODOS OS SALDOS PARA BUCKET:", bucketId)

  if (!supabaseClient) {
    console.error("❌ Supabase não disponível")
    return
  }

  try {
    // Buscar TODAS as transações em ordem cronológica
    const { data: transacoes } = await supabaseClient
      .from("extratos")
      .select("*")
      .eq("bucket_id", bucketId)
      .order("data", { ascending: true })
      .order("created_at", { ascending: true })

    if (!transacoes || transacoes.length === 0) {
      console.log("❌ Nenhuma transação encontrada")
      return
    }

    console.log(`📊 Processando ${transacoes.length} transações...`)

    let saldoAcumulado = 0
    const transacoesAtualizadas = []

    // Processar cada transação em ordem cronológica
    for (let i = 0; i < transacoes.length; i++) {
      const trans = transacoes[i]
      const valorTransacao = Math.abs(trans.valor_brl || 0)

      console.log(`\n📝 Transação ${i + 1}:`)
      console.log(`   Data: ${trans.data}`)
      console.log(`   Descrição: ${trans.descricao}`)
      console.log(`   Tipo: ${trans.transacao}`)
      console.log(`   Valor: ${formatCurrency(valorTransacao)}`)
      console.log(`   Saldo anterior: ${formatCurrency(saldoAcumulado)}`)

      // VERIFICAR SE É TRANSAÇÃO NEUTRA
      if (trans.is_neutro || trans.tipo_especial === "rendimento_transferido") {
        console.log(`   ⏭️ PULANDO TRANSAÇÃO NEUTRA - Saldo mantido em ${formatCurrency(saldoAcumulado)}`)
        // Não alterar saldo!
      }
      // PRIMEIRA TRANSAÇÃO (Alocação Inicial)
      else if (i === 0 && trans.descricao?.includes("Alocação")) {
        saldoAcumulado = valorTransacao
        console.log(`   🏁 ALOCAÇÃO INICIAL: ${formatCurrency(saldoAcumulado)}`)
      }
      // RENDIMENTO - NOVA LÓGICA CLARA
      else if (trans.transacao === "rendimento") {
        // Se tem destino diferente = NEUTRO
        if (trans.conta_destino_id && trans.conta_destino_id !== trans.conta_origem_id) {
          console.log(`   ➖ RENDIMENTO TRANSFERIDO - NEUTRO: Saldo mantido em ${formatCurrency(saldoAcumulado)}`)
          // Não alterar saldo
        } else {
          // Rendimento que ficou = SOMA
          const saldoAnterior = saldoAcumulado
          saldoAcumulado = saldoAcumulado + valorTransacao
          console.log(
            `   💰 RENDIMENTO ADICIONADO: ${formatCurrency(saldoAnterior)} + ${formatCurrency(valorTransacao)} = ${formatCurrency(saldoAcumulado)}`,
          )
        }
      }
      // RENDIMENTO NEUTRO - TIPOS ESPECIAIS (NÃO ALTERA SALDO)
      else if (
        trans.transacao === "rendimento_neutro" ||
        trans.transacao === "rendimento_redirecionado" ||
        (trans.transacao === "entrada" &&
          trans.is_rendimento &&
          trans.conta_destino_id &&
          trans.categoria === "Rendimento Redirecionado")
      ) {
        console.log(`   ➖ RENDIMENTO NEUTRO: Saldo mantido em ${formatCurrency(saldoAcumulado)} (NEUTRO)`)
        // Saldo não muda!
      }
      // SAÍDAS SEMPRE SUBTRAEM - CORRIGIDO!
      else if (trans.transacao === "saida" || trans.transacao.startsWith("saida")) {
        const saldoAnterior = saldoAcumulado
        saldoAcumulado = saldoAcumulado - valorTransacao
        console.log(
          `   ❌ SAÍDA: ${formatCurrency(saldoAnterior)} - ${formatCurrency(valorTransacao)} = ${formatCurrency(saldoAcumulado)}`,
        )
      }
      // ENTRADAS SOMAM (exceto rendimento já tratado acima)
      else if (trans.transacao === "entrada") {
        const saldoAnterior = saldoAcumulado
        saldoAcumulado = saldoAcumulado + valorTransacao
        console.log(
          `   ✅ ENTRADA: ${formatCurrency(saldoAnterior)} + ${formatCurrency(valorTransacao)} = ${formatCurrency(saldoAcumulado)}`,
        )
      }
      // REGISTRO DE EMPRÉSTIMO (neutro)
      else if (trans.transacao === "registro_emprestimo") {
        console.log(`   📝 REGISTRO EMPRÉSTIMO: Saldo mantido em ${formatCurrency(saldoAcumulado)}`)
      }
      // OUTROS TIPOS
      else {
        console.log(`   ❓ TIPO DESCONHECIDO: ${trans.transacao} - Saldo mantido`)
      }

      console.log(`   💰 Novo saldo: ${formatCurrency(saldoAcumulado)}`)

      // Adicionar à lista de atualizações
      transacoesAtualizadas.push({
        id: trans.id,
        saldo_final: saldoAcumulado,
      })
    }

    // Atualizar todos os saldos finais das transações
    for (const transUpdate of transacoesAtualizadas) {
      await supabaseClient.from("extratos").update({ saldo_final: transUpdate.saldo_final }).eq("id", transUpdate.id)
    }

    // Atualizar saldo_atual e capital_investido do bucket
    await supabaseClient
      .from("buckets")
      .update({
        saldo_atual: saldoAcumulado,
        capital_investido: saldoAcumulado,
      })
      .eq("id", bucketId)

    console.log(`\n✅ SALDO FINAL, SALDO ATUAL E CAPITAL INVESTIDO CORRIGIDOS: ${formatCurrency(saldoAcumulado)}`)
    return saldoAcumulado
  } catch (error) {
    console.error("❌ Erro ao recalcular saldos:", error)
    return 0
  }
}

// FUNÇÃO PRINCIPAL PARA PROCESSAR TRANSAÇÕES - VERSÃO SIMPLIFICADA SEM RESTRIÇÃO DE ALOCAÇÃO
const processarTransacao = async (dados: any, buckets: Bucket[]) => {
  try {
    console.log("🔍 PROCESSANDO TRANSAÇÃO:", dados)

    // Buscar último saldo do bucket ORIGEM
    const { data: ultimoExtrato } = await supabaseClient
      .from("extratos")
      .select("saldo_final")
      .eq("bucket_id", dados.conta_origem_id)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    const saldoAtual = ultimoExtrato?.saldo_final || 0

    // Gerar ID de relacionamento único para conectar transações
    const relacionamentoId = crypto.randomUUID()

    // RENDIMENTO TRANSFERIDO
    if (
      dados.transacao === "rendimento" &&
      dados.conta_destino_id &&
      dados.conta_destino_id !== dados.conta_origem_id &&
      dados.conta_destino_id !== "mesmo"
    ) {
      console.log("🔴 RENDIMENTO TRANSFERIDO - INICIANDO")

      const loanId = dados.is_emprestimo ? crypto.randomUUID() : null

      console.log("💰 Saldo atual origem:", formatCurrency(saldoAtual))

      // 1. CRIAR REGISTRO NO BUCKET ORIGEM (NEUTRO)
      const extratoOrigem = {
        id: crypto.randomUUID(),
        bucket_id: dados.conta_origem_id,
        conta_origem_id: dados.conta_origem_id,
        conta_destino_id: dados.conta_destino_id,
        data: dados.data,
        transacao: "rendimento", // MANTER COMO RENDIMENTO!
        categoria: dados.is_emprestimo ? "Rendimento Emprestado" : "Rendimento Transferido",
        descricao: dados.descricao || "(+) Rentabilidade de Aplicação",
        finalidade: "Transferido para outro bucket",
        valor_brl: Number.parseFloat(dados.valor_brl),
        valor_usd: Number.parseFloat(dados.valor_brl) / 5.5,
        status: dados.status || "Confirmado",
        is_rendimento: true,
        visivel_extrato: true,
        saldo_anterior: saldoAtual,
        saldo_final: saldoAtual, // ⚠️ NEUTRO - NÃO MUDA!
        related_loan_id: relacionamentoId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // CAMPOS ESPECIAIS PARA IDENTIFICAR NEUTRALIDADE
        is_neutro: true,
        tipo_especial: "rendimento_transferido",
      }

      // Se marcado como empréstimo
      if (dados.is_emprestimo) {
        extratoOrigem.loan_id = loanId
        extratoOrigem.status_emprestimo = "ativo"
        extratoOrigem.taxa_emprestimo_custom = dados.taxa_emprestimo || 1.32
      }

      const { data: saved, error: erroOrigem } = await supabaseClient
        .from("extratos")
        .insert(extratoOrigem)
        .select()
        .single()

      if (erroOrigem) {
        console.error("❌ Erro ao salvar origem:", erroOrigem)
        throw erroOrigem
      }

      console.log("✅ Salvo no bucket origem - NEUTRO")

      // 2. CRIAR REGISTRO NO BUCKET DESTINO (SOMA)
      const bucketDestino = buckets.find((b) => b.id === dados.conta_destino_id)
      if (bucketDestino) {
        const { data: ultimoExtratoDestino } = await supabaseClient
          .from("extratos")
          .select("saldo_final")
          .eq("bucket_id", dados.conta_destino_id)
          .order("data", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        const saldoAtualDestino = ultimoExtratoDestino?.saldo_final || 0
        const novoSaldoDestino = saldoAtualDestino + Number.parseFloat(dados.valor_brl)

        const extratoDestino = {
          id: crypto.randomUUID(),
          bucket_id: dados.conta_destino_id,
          conta_origem_id: dados.conta_origem_id,
          conta_destino_id: null,
          data: dados.data,
          transacao: "entrada",
          categoria: dados.is_emprestimo ? "Empréstimo Recebido" : "Rendimento Recebido",
          descricao: dados.is_emprestimo
            ? `Dívida com ${buckets.find((b) => b.id === dados.conta_origem_id)?.nome}: ${dados.descricao}`
            : `Rendimento recebido de ${buckets.find((b) => b.id === dados.conta_origem_id)?.nome}`,
          finalidade: dados.is_emprestimo ? "Empréstimo de rendimento" : "Rendimento transferido",
          valor_brl: Number.parseFloat(dados.valor_brl),
          valor_usd: Number.parseFloat(dados.valor_brl) / 5.5,
          status: "Confirmado",
          is_rendimento: false,
          visivel_extrato: true,
          saldo_anterior: saldoAtualDestino,
          saldo_final: novoSaldoDestino, // SOMA!
          related_loan_id: relacionamentoId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        if (dados.is_emprestimo) {
          extratoDestino.loan_id = loanId
          extratoDestino.status_emprestimo = "ativo"
        }

        await supabaseClient.from("extratos").insert(extratoDestino)

        // Sincronizar capital investido do destino
        await sincronizarCapitalInvestido(dados.conta_destino_id)
      }

      console.log("✅ Rendimento transferido processado com sucesso!")
    }
    // RENDIMENTO QUE FICA NO BUCKET
    else if (dados.transacao === "rendimento" && (!dados.conta_destino_id || dados.conta_destino_id === "mesmo")) {
      console.log("📊 RENDIMENTO LOCAL DETECTADO!")

      const novoSaldo = saldoAtual + Number.parseFloat(dados.valor_brl)

      const extrato = {
        id: crypto.randomUUID(),
        bucket_id: dados.conta_origem_id,
        conta_origem_id: dados.conta_origem_id,
        conta_destino_id: null,
        data: dados.data,
        transacao: "rendimento",
        categoria: "Rendimento",
        descricao: dados.descricao || "Rendimento da Aplicação",
        finalidade: dados.finalidade || "",
        valor_brl: Number.parseFloat(dados.valor_brl),
        valor_usd: Number.parseFloat(dados.valor_brl) / 5.5,
        status: "Confirmado",
        is_rendimento: true,
        visivel_extrato: true,
        saldo_anterior: saldoAtual,
        saldo_final: novoSaldo, // SOMA!
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await supabaseClient.from("extratos").insert(extrato)
      await sincronizarCapitalInvestido(dados.conta_origem_id)

      console.log("✅ Rendimento local processado - somado ao saldo")
    }
    // TRANSAÇÕES NORMAIS (ENTRADA/SAÍDA) - SEM RESTRIÇÃO DE ALOCAÇÃO INICIAL
    else {
      console.log("📝 Transação normal:", dados.transacao)

      let novoSaldo = saldoAtual

      if (dados.transacao === "entrada") {
        novoSaldo = saldoAtual + Number.parseFloat(dados.valor_brl)
      } else if (dados.transacao === "saida" || dados.transacao === "saida_despesa") {
        novoSaldo = saldoAtual - Number.parseFloat(dados.valor_brl)
      }

      const extrato = {
        id: crypto.randomUUID(),
        bucket_id: dados.conta_origem_id,
        conta_origem_id: dados.conta_origem_id,
        conta_destino_id: dados.conta_destino_id || null,
        data: dados.data,
        transacao: dados.transacao,
        categoria: dados.categoria || "",
        descricao: dados.descricao,
        finalidade: dados.finalidade || "",
        valor_brl: Number.parseFloat(dados.valor_brl),
        valor_usd: Number.parseFloat(dados.valor_brl) / 5.5,
        status: dados.status || "Confirmado",
        is_rendimento: dados.is_rendimento || false,
        loan_id: dados.loan_id,
        related_loan_id: relacionamentoId, // Adicionado para rastreamento
        status_emprestimo: dados.status_emprestimo,
        saldo_anterior: saldoAtual,
        saldo_final: novoSaldo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        visivel_extrato: true,
        is_alocacao_inicial: dados.is_alocacao_inicial || false, // Não é alocação, é transação normal
      }

      if (dados.is_emprestimo) {
        extrato.loan_id = dados.loan_id || crypto.randomUUID()
        extrato.status_emprestimo = "ativo"
        extrato.taxa_emprestimo_custom = dados.taxa_emprestimo || 1.32
      }

      await supabaseClient.from("extratos").insert(extrato)

      // SE TEM DESTINO, CRIAR ENTRADA NO DESTINO
      if (dados.conta_destino_id && dados.conta_destino_id !== dados.conta_origem_id) {
        console.log("📥 Criando entrada no bucket destino:", dados.conta_destino_id)

        const bucketOrigem = buckets.find((b) => b.id === dados.conta_origem_id)
        const bucketDestino = buckets.find((b) => b.id === dados.conta_destino_id)

        if (bucketDestino) {
          // Buscar último saldo do destino
          const { data: ultimoExtratoDestino } = await supabaseClient
            .from("extratos")
            .select("saldo_final")
            .eq("bucket_id", dados.conta_destino_id)
            .order("data", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          const saldoDestino = ultimoExtratoDestino?.saldo_final || 0
          const novoSaldoDestino = saldoDestino + Number.parseFloat(dados.valor_brl)

          // Criar entrada no destino
          const extratoDestino = {
            id: crypto.randomUUID(),
            bucket_id: dados.conta_destino_id,
            conta_origem_id: dados.conta_origem_id,
            conta_destino_id: null,
            data: dados.data,
            transacao: "entrada",
            categoria: dados.loan_id ? "Empréstimo Recebido" : "Transferência Recebida",
            descricao: `Recebido de ${bucketOrigem?.nome}: ${dados.descricao}`,
            finalidade: dados.finalidade || "Transferência entre buckets",
            valor_brl: Number.parseFloat(dados.valor_brl),
            valor_usd: Number.parseFloat(dados.valor_brl) / 5.5,
            status: "Confirmado",
            is_rendimento: false,
            visivel_extrato: true,
            saldo_anterior: saldoDestino,
            saldo_final: novoSaldoDestino,
            related_loan_id: relacionamentoId,
            loan_id: dados.loan_id,
            status_emprestimo: dados.loan_id ? "ativo" : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          await supabaseClient.from("extratos").insert(extratoDestino)

          // Atualizar capital investido do destino
          await sincronizarCapitalInvestido(dados.conta_destino_id)

          console.log("✅ Entrada criada no destino com sucesso!")
        }
      }
    }

    // Sincronizar capital investido da origem
    await sincronizarCapitalInvestido(dados.conta_origem_id)

    console.log("✅ Transação processada com sucesso!")
  } catch (error) {
    console.error("❌ Erro ao processar transação:", error)
    throw error
  }
}

// FUNÇÃO DE EXCLUSÃO EM CASCATA COM PROTEÇÃO CONTRA RECURSÃO
const excluirTransacaoRecursivamente = async (transacao: any) => {
  console.log("🗑️ Iniciando exclusão completa da transação:", transacao.id)

  try {
    // CRIAR SET PARA RASTREAR IDs JÁ PROCESSADOS
    const idsProcessados = new Set<string>()

    // Função interna com proteção
    const excluirComProtecao = async (trans: any, nivel = 0) => {
      // PROTEÇÃO 1: Limite de profundidade
      if (nivel > 5) {
        console.warn("⚠️ Limite de profundidade atingido na exclusão")
        return
      }

      // PROTEÇÃO 2: Evitar processar o mesmo ID duas vezes
      if (idsProcessados.has(trans.id)) {
        console.log("⏭️ Transação já processada:", trans.id)
        return
      }

      idsProcessados.add(trans.id)
      console.log(`🗑️ Excluindo transação ${trans.id} (nível ${nivel})`)

      // SE FOR RENDIMENTO TRANSFERIDO
      if (trans.transacao === "rendimento" && trans.conta_destino_id) {
        console.log("📊 É rendimento transferido, procurando relacionadas...")

        // Buscar transação relacionada no destino
        if (trans.related_loan_id) {
          const { data: relacionadas } = await supabaseClient
            .from("extratos")
            .select("*")
            .eq("related_loan_id", trans.related_loan_id)
            .neq("id", trans.id) // NÃO pegar a própria transação
            .limit(10) // LIMITE para evitar explosão

          // Excluir relacionadas com proteção
          for (const rel of relacionadas || []) {
            if (!idsProcessados.has(rel.id)) {
              await excluirComProtecao(rel, nivel + 1)
            }
          }
        }
      }

      // SE É EMPRÉSTIMO, buscar registros relacionados
      if (trans.loan_id && nivel < 3) {
        // Limite adicional para empréstimos
        console.log("💰 Buscando empréstimos relacionados...")

        const { data: emprestimosRelacionados } = await supabaseClient
          .from("extratos")
          .select("*")
          .eq("loan_id", trans.loan_id)
          .neq("id", trans.id)
          .limit(5) // LIMITE para empréstimos

        for (const emp of emprestimosRelacionados || []) {
          if (!idsProcessados.has(emp.id)) {
            await excluirComProtecao(emp, nivel + 1)
          }
        }
      }

      // EXCLUIR A TRANSAÇÃO
      console.log("🗑️ Excluindo do banco:", trans.id)
      const { error } = await supabaseClient.from("extratos").delete().eq("id", trans.id)

      if (error) throw error
    }

    // Iniciar exclusão
    await excluirComProtecao(transacao)

    // 4. Recalcular saldos do bucket origem
    await recalcularTodosOsSaldos(transacao.bucket_id)

    // 5. Se tinha destino, recalcular saldos do destino
    if (transacao.conta_destino_id) {
      await recalcularTodosOsSaldos(transacao.conta_destino_id)
    }

    console.log(`✅ Exclusão completa finalizada! ${idsProcessados.size} transação(ões) excluída(s)`)
  } catch (error) {
    console.error("❌ Erro na exclusão:", error)
    throw error
  }
}

// FUNÇÃO DE EXCLUSÃO SIMPLES SEM CASCATA
const excluirTransacaoSimples = async (transacao: any) => {
  try {
    console.log("🗑️ Excluindo transação simples:", transacao.id)

    // Excluir apenas esta transação
    const { error } = await supabaseClient.from("extratos").delete().eq("id", transacao.id)

    if (error) throw error

    // Recalcular saldos do bucket origem
    await recalcularTodosOsSaldos(transacao.bucket_id)

    // Se tinha destino, recalcular saldos do destino
    if (transacao.conta_destino_id) {
      await recalcularTodosOsSaldos(transacao.conta_destino_id)
    }

    console.log("✅ Transação excluída com sucesso!")
  } catch (error) {
    console.error("❌ Erro na exclusão simples:", error)
    throw error
  }
}

// Função para mapear dados do extrato do DB para o tipo do app
function mapExtratoFromDb(dbExtrato: any): Extrato {
  const data = new Date(dbExtrato.data)
  return {
    id: dbExtrato.id,
    bucketId: dbExtrato.bucket_id,
    data: dbExtrato.data,
    transacao: dbExtrato.transacao,
    categoria: dbExtrato.categoria,
    descricao: dbExtrato.descricao,
    finalidade: dbExtrato.finalidade,
    valorBRL: Number(dbExtrato.valor_brl || 0),
    valorUSD: Number(dbExtrato.valor_usd || 0),
    status: dbExtrato.status,
    isRendimento: dbExtrato.is_rendimento,
    loanId: dbExtrato.loan_id,
    relatedLoanId: dbExtrato.related_loan_id,
    statusEmprestimo: dbExtrato.status_emprestimo,
    contaDestinoId: dbExtrato.conta_destino_id,
    contaOrigemId: dbExtrato.conta_origem_id,
    createdAt: dbExtrato.created_at,
    updatedAt: dbExtrato.updated_at,
    visivelExtrato: dbExtrato.visivel_extrato,
    valor_display_brl: dbExtrato.valor_display_brl,
    valor_display_usd: dbExtrato.valor_display_usd,
    // Campos calculados no cliente
    mes: data.toLocaleDateString("pt-BR", { month: "long", year: "2-digit" }),
    contaDoBucket: "", // Será preenchido depois
    saldoFinal: Number(dbExtrato.saldo_final || 0), // Usar saldo calculado
  }
}

// Função para mapear dados do bucket do DB para o tipo do app
function mapBucketFromDb(dbBucket: any): Bucket {
  return {
    id: dbBucket.id,
    userId: dbBucket.user_id,
    nome: dbBucket.nome,
    icon: iconMap[dbBucket.icon] || defaultIcon,
    categoria: dbBucket.categoria,
    tipo: dbBucket.tipo,
    moedaPrincipal: dbBucket.moeda_principal,
    capitalInicialBRL: Number(dbBucket.capital_inicial_brl || 0),
    capitalInicialUSD: Number(dbBucket.capital_inicial_usd || 0),
    dataCapitalInicial: dbBucket.data_capital_inicial,
    capitalInvestido: Number(dbBucket.capital_investido || 0),
    aportesMensais: Number(dbBucket.aportes_mensais || 0),
    periodoMeses: Number(dbBucket.periodo_meses || 0),
    taxaRendimento: Number(dbBucket.taxa_rendimento || 0),
    taxaEmprestimo: Number(dbBucket.taxa_emprestimo || 0),
    liquidez: dbBucket.liquidez,
    status: dbBucket.status,
    inadimplencia: dbBucket.inadimplencia,
    metadata: dbBucket.metadata || { color: "#8b5cf6" },
    createdAt: dbBucket.created_at,
    updatedAt: dbBucket.updated_at,
    extratos: (dbBucket.extratos || []).map(mapExtratoFromDb),
    totalAReceberEmprestimos: Number(dbBucket.total_a_receber_emprestimos || 0),
    isActive: dbBucket.is_active ?? true,
    // Usar saldo_atual do banco, não recalcular aqui
    saldoAtual: Number(dbBucket.saldo_atual || 0),
    // Adicionar campo para total alocado (calculado a partir das alocações)
    totalAlocado: Number(dbBucket.total_alocado || 0),
  }
}

// FUNÇÃO CORRIGIDA PARA CALCULAR SALDOS (NÃO ALTERA TRANSAÇÕES ANTIGAS)
const processarSaldos = (buckets: Bucket[]): Bucket[] => {
  return buckets.map((bucket) => {
    const capitalInicial = bucket.moedaPrincipal === "BRL" ? bucket.capitalInicialBRL : bucket.capitalInicialUSD

    // 1. Ordena cronologicamente para cálculo
    const extratosParaCalculo = [...bucket.extratos].sort((a, b) => {
      const dateA = new Date(a.data).getTime()
      const dateB = new Date(b.data).getTime()
      if (dateA !== dateB) return dateA - dateB
      const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return createdAtA - createdAtB
    })

    // 2. USA O SALDO FINAL JÁ CALCULADO NO BANCO (não recalcula aqui)
    const extratosComSaldo = extratosParaCalculo.map((extrato) => {
      return { ...extrato, saldoAcumulado: extrato.saldoFinal }
    })

    // 3. Usa o saldo_atual do bucket, que já foi corrigido em carregarDadosIniciais.
    // Não há necessidade de fallback para capitalInicial, pois isso pode introduzir erros
    // se o saldo for legitimamente 0. O valor já é um número.
    const saldoAtual = bucket.saldoAtual

    // 4. Reordena para exibição (mais novo primeiro)
    const extratosParaExibir = [...extratosComSaldo].sort((a, b) => {
      const dateA = new Date(a.data).getTime()
      const dateB = new Date(b.data).getTime()
      if (dateA !== dateB) return dateB - dateA
      const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return createdAtB - createdAtA
    })

    return {
      ...bucket,
      extratos: extratosParaExibir,
      saldoAtual: saldoAtual,
    }
  })
}

interface BucketsContextType {
  buckets: Bucket[]
  setBuckets: Dispatch<SetStateAction<Bucket[]>>
  logs: LogEntry[]
  loading: boolean
  error: string | null
  fetchInitialData: () => Promise<void>
  adicionarBucket: (bucketData: Partial<Bucket>) => Promise<void>
  updateBucketStrategicData: (bucketId: string, updatedData: Partial<Bucket>) => Promise<void>
  updateBucketName: (bucketId: string, newName: string) => Promise<void>
  adicionarExtrato: (bucketId: string, extratoData: any) => Promise<void>
  editarExtrato: (extratoId: string, dadosAtualizados: any) => Promise<void>
  realizarTransferenciaSimples: (dados: {
    origemId: string
    destinoId: string
    valor: number
    data: string
    descricao: string
  }) => Promise<void>
  criarEmprestimo: (dados: {
    origemId: string
    destinoId: string
    valor: number
    data: string
    descricao: string
    semLinhaNoExtrato?: boolean
  }) => Promise<void>
  realizarPagamentoEmprestimo: (dados: {
    loanId: string
    devedorId: string
    credorId: string
    valorPrincipal: number
    jurosAcumulados: number
    valorTotal: number
  }) => Promise<void>
  realizarPagamentoParcialEmprestimo: (dados: {
    loanId: string
    devedorId: string
    credorId: string
    valorPagamento: number
    valorPrincipalPago: number
    jurosPagos: number
    valorPrincipalRestante: number
  }) => Promise<void>
  excluirTransacaoCompleta: (transacaoOrigem: Extrato) => Promise<void>
  confirmarTransacaoPendente: (bucketId: string, extratoId: string) => Promise<void>
  toggleBucketActive: (bucketId: string, isActive: boolean) => Promise<void>
  resetBucketToInitialCapital: (bucketId: string) => Promise<void>
  totalPatrimonioBRL: number
  totalPatrimonioUSD: number
  rendimentoMensal: number
  liquidezImediata: number
  bucketsAtivos: number
  exchangeRate: number
  isGlobalModalOpen: boolean
  setIsGlobalModalOpen: Dispatch<SetStateAction<boolean>>
  transactionToEdit: Extrato | null
  setTransactionToEdit: Dispatch<SetStateAction<Extrato | null>>
  descobrirEstruturaBuckets: () => Promise<any>
  corrigirSaldoRendimentoRedirecionado: () => Promise<void>
  criarAlocacaoInicial: (bucketId: string) => Promise<void>
  atualizarCapitalInvestido: (bucketId: string) => Promise<void>
}

const BucketsContext = createContext<BucketsContextType | undefined>(undefined)

export function BucketsProvider({ children }: { children: ReactNode }) {
  const supabase = createClientComponentClient()
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const exchangeRate = 5.47
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false)
  const [transactionToEdit, setTransactionToEdit] = useState<Extrato | null>(null)

  const addLog = useCallback((type: LogType, description: string, details?: Record<string, any>) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      description,
      details,
    }
    setLogs((prevLogs) => [newLog, ...prevLogs])
  }, [])

  const carregarDadosIniciais = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (!supabaseClient) {
      const errorMessage = "Conexão com Supabase não configurada. Adicione a integração do Supabase no v0."
      setError(errorMessage)
      setLoading(false)
      return
    }

    try {
      console.log("📥 Carregando dados...")
      const { data: bucketsData, error: bucketsError } = await supabaseClient
        .from("buckets")
        .select("*, extratos(*, created_at), total_a_receber_emprestimos")
        .order("nome")

      if (bucketsError) {
        console.error("Erro ao buscar buckets:", bucketsError)
        const errorMessage = `Ocorreu um erro ao buscar os dados: "${bucketsError.message}". Isso geralmente significa que as tabelas do banco de dados não foram criadas. Por favor, execute os scripts SQL fornecidos.`
        setError(errorMessage)
      } else if (bucketsData) {
        // ✅ CORREÇÃO DEFINITIVA: SEMPRE usar saldo_final, NUNCA valor_brl
        for (const bucket of bucketsData) {
          // Buscar APENAS o saldo_final da última transação
          const { data: ultimoExtrato } = await supabaseClient
            .from("extratos")
            .select("saldo_final") // SÓ PRECISA DO SALDO_FINAL!
            .eq("bucket_id", bucket.id)
            .order("data", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          // USAR SALDO_FINAL DIRETAMENTE
          const saldoFinal = ultimoExtrato?.saldo_final || 0

          bucket.capital_investido = saldoFinal // ← SALDO_FINAL, não valor_brl!
          bucket.saldo_atual = saldoFinal // ← SALDO_FINAL, não valor_brl!

          console.log(`✅ ${bucket.nome}: Capital Investido e Saldo Atual = R$ ${saldoFinal.toLocaleString("pt-BR")}`)
        }

        const mappedBuckets = bucketsData.map(mapBucketFromDb)
        const bucketsComSaldos = processarSaldos(mappedBuckets)
        setBuckets(bucketsComSaldos)
      } else {
        setBuckets([])
      }
    } catch (err) {
      console.error("Erro inesperado:", err)
      setError("Erro inesperado ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [supabase, addLog])

  // Alias para compatibilidade
  const fetchInitialData = carregarDadosIniciais

  const resetBucketToInitialCapital = useCallback(
    async (bucketId: string) => {
      if (!supabaseClient) {
        toast({ title: "Erro de Conexão", description: "Cliente Supabase não encontrado.", variant: "destructive" })
        return
      }

      const bucket = buckets.find((b) => b.id === bucketId)
      if (!bucket) {
        toast({ title: "Erro", description: "Bucket não encontrado.", variant: "destructive" })
        throw new Error("Bucket não encontrado.")
      }

      try {
        // Deletar todas as transações do bucket
        const { error: deleteError } = await supabaseClient.from("extratos").delete().eq("bucket_id", bucketId)

        if (deleteError) throw deleteError

        // Recarregar todos os dados para refletir a mudança
        await carregarDadosIniciais()

        addLog("RESET", `Resetou o bucket "${bucket.nome}" para o capital inicial.`, { bucketId })
        toast({
          title: "Bucket Resetado",
          description: `O saldo de "${bucket.nome}" voltou ao valor inicial.`,
        })
      } catch (err) {
        console.error("🔴 [CONTEXT] Erro em resetBucketToInitialCapital:", err)
        toast({
          title: "Falha ao Resetar",
          description: (err as Error).message,
          variant: "destructive",
        })
        throw err
      }
    },
    [addLog, carregarDadosIniciais, buckets],
  )

  const toggleBucketActive = useCallback(
    async (bucketId: string, isActive: boolean) => {
      if (!supabaseClient) return

      try {
        const { error } = await supabaseClient.from("buckets").update({ is_active: isActive }).eq("id", bucketId)
        if (error) throw error

        setBuckets((prev) => prev.map((bucket) => (bucket.id === bucketId ? { ...bucket, isActive } : bucket)))
        await carregarDadosIniciais()
        addLog("UPDATE", `${isActive ? "Ativou" : "Desativou"} bucket ${bucketId}`, { bucketId, isActive })
      } catch (err) {
        console.error("🔴 [CONTEXT] Erro em toggleBucketActive:", err)
        setBuckets((prev) =>
          prev.map((bucket) => (bucket.id === bucketId ? { ...bucket, isActive: !isActive } : bucket)),
        )
        throw err
      }
    },
    [addLog, carregarDadosIniciais],
  )

  const adicionarBucket = useCallback(
    async (bucketData: Partial<Bucket>) => {
      if (!supabaseClient) return
      try {
        const payload = {
          id: crypto.randomUUID(),
          user_id: "6b312ca6-f72f-4756-836c-e0e560062f43",
          nome: bucketData.nome,
          categoria: bucketData.categoria,
          tipo: bucketData.tipo,
          moeda_principal: bucketData.moedaPrincipal || "BRL",
          capital_inicial_brl: bucketData.capitalInicialBRL || 0,
          capital_inicial_usd: (bucketData.capitalInicialBRL || 0) / exchangeRate,
          data_capital_inicial: new Date().toISOString(),
          icon: "Landmark",
          liquidez: bucketData.liquidez || "media",
          metadata: bucketData.metadata || { color: "#8b5cf6" },
        }
        Object.keys(payload).forEach((key) => (payload as any)[key] === undefined && delete (payload as any)[key])
        const { data, error } = await supabaseClient.from("buckets").insert(payload).select().single()
        if (error) throw error
        await carregarDadosIniciais()
        toast({ title: "Sucesso!", description: `Bucket "${data.nome}" criado.` })
        addLog("CREATE", `Criou o bucket "${data.nome}".`, { bucketId: data.id })
      } catch (err) {
        console.error("🔴 [CONTEXT] Erro em adicionarBucket:", err)
        toast({ title: "Falha ao Criar Bucket", description: (err as Error).message, variant: "destructive" })
      }
    },
    [addLog, exchangeRate, carregarDadosIniciais],
  )

  // FUNÇÃO CORRIGIDA PARA ADICIONAR EXTRATO - SEM RESTRIÇÃO DE ALOCAÇÃO INICIAL
  const adicionarExtrato = useCallback(
    async (bucketId: string, transacao: any) => {
      if (!transacao || typeof transacao !== "object") {
        const errorMsg = "Dados da transação inválidos ou ausentes."
        console.error(`🔴 [CONTEXT] Erro em adicionarExtrato: ${errorMsg}`, { bucketId, transacao })
        toast({ title: "Erro de Validação", description: errorMsg, variant: "destructive" })
        throw new Error(errorMsg)
      }

      if (!supabaseClient) {
        const errorMsg = "Cliente Supabase não encontrado."
        toast({ title: "Erro de Conexão", description: errorMsg, variant: "destructive" })
        throw new Error(errorMsg)
      }

      const valorBRL = transacao.valor_brl ?? transacao.valor
      if (valorBRL === undefined || valorBRL === null || isNaN(Number(valorBRL))) {
        const errorMsg = "O valor da transação (valor_brl ou valor) é obrigatório e deve ser um número."
        console.error(`🔴 [CONTEXT] Erro em adicionarExtrato: ${errorMsg}`, { transacao })
        toast({ title: "Erro de Validação", description: errorMsg, variant: "destructive" })
        throw new Error(errorMsg)
      }

      try {
        // Preparar dados para processarTransacao
        const dadosTransacao = {
          conta_origem_id: bucketId,
          conta_destino_id: transacao.conta_destino_id,
          transacao: transacao.transacao,
          is_rendimento: transacao.is_rendimento,
          valor_brl: valorBRL,
          data: transacao.data,
          descricao: transacao.descricao,
          finalidade: transacao.finalidade,
          status: transacao.status,
          is_emprestimo: transacao.is_emprestimo,
          categoria: transacao.categoria,
          loan_id: transacao.loan_id,
          taxa_emprestimo: transacao.taxa_emprestimo,
          is_alocacao_inicial: transacao.is_alocacao_inicial,
        }

        // Chamar processarTransacao com buckets atuais
        await processarTransacao(dadosTransacao, buckets)

        // NO FINAL, SEMPRE RECARREGAR OS DADOS
        await carregarDadosIniciais()

        toast({
          title: "Sucesso!",
          description: "Transação adicionada.",
        })
        addLog("CREATE", `Adicionou transação em bucket ${bucketId}`, { bucketId, valor: valorBRL })
      } catch (err) {
        console.error("🔴 [CONTEXT] Erro em adicionarExtrato:", err)
        toast({ title: "Falha ao Adicionar Transação", description: (err as Error).message, variant: "destructive" })
        throw err
      }
    },
    [addLog, buckets, carregarDadosIniciais],
  )

  const editarExtrato = useCallback(
    async (extratoId: string, dadosAtualizados: any) => {
      if (!supabaseClient) return

      try {
        const { data: transacaoOriginal, error: fetchError } = await supabaseClient
          .from("extratos")
          .select("*")
          .eq("id", extratoId)
          .single()

        if (fetchError) throw fetchError

        if (transacaoOriginal.loan_id) {
          await supabaseClient
            .from("extratos")
            .update({
              data: dadosAtualizados.data,
              descricao: dadosAtualizados.descricao,
              finalidade: dadosAtualizados.finalidade,
              valor_brl: dadosAtualizados.valor,
              valor_usd: dadosAtualizados.valor / exchangeRate,
              status: dadosAtualizados.status,
            })
            .eq("loan_id", transacaoOriginal.loan_id)
        } else {
          await supabaseClient
            .from("extratos")
            .update({
              data: dadosAtualizados.data,
              transacao: dadosAtualizados.transacao,
              categoria:
                dadosAtualizados.isRendimento && dadosAtualizados.transacao === "entrada"
                  ? "Rendimento"
                  : transacaoOriginal.categoria,
              descricao: dadosAtualizados.descricao,
              finalidade: dadosAtualizados.finalidade,
              valor_brl: dadosAtualizados.valor,
              valor_usd: dadosAtualizados.valor / exchangeRate,
              status: dadosAtualizados.status,
              is_rendimento: dadosAtualizados.isRendimento,
            })
            .eq("id", extratoId)
        }

        // RECALCULAR SALDOS APÓS EDIÇÃO
        await recalcularTodosOsSaldos(transacaoOriginal.bucket_id)
        await carregarDadosIniciais()
        toast({ title: "Sucesso!", description: "Transação atualizada." })
        addLog("UPDATE", `Editou transacao ${extratoId}`, { extratoId, dadosAtualizados })
      } catch (err) {
        console.error("🔴 [CONTEXT] Erro em editarExtrato:", err)
        toast({
          title: "Falha ao Editar Transação",
          description: (err as Error).message,
          variant: "destructive",
        })
        throw err
      }
    },
    [addLog, carregarDadosIniciais, exchangeRate],
  )

  const realizarTransferenciaSimples = useCallback(
    async (dados: { origemId: string; destinoId: string; valor: number; data: string; descricao: string }) => {
      if (!supabaseClient) return
      const { origemId, destinoId, valor, data, descricao } = dados
      const bucketOrigem = buckets.find((b) => b.id === origemId)
      const bucketDestino = buckets.find((b) => b.id === destinoId)

      if (!bucketOrigem || !bucketDestino) throw new Error("Bucket de origem ou destino não encontrado.")

      // Gerar ID de relacionamento único para conectar transações
      const relacionamentoId = crypto.randomUUID()

      const transacoes = [
        {
          id: crypto.randomUUID(),
          bucket_id: origemId,
          data,
          transacao: "saida_transferencia",
          categoria: "Transferência",
          descricao: `Para: ${bucketDestino.nome} - ${descricao}`,
          valor_brl: valor,
          valor_usd: valor / exchangeRate,
          status: "Confirmado",
          conta_destino_id: destinoId,
          related_loan_id: relacionamentoId, // Conecta as transações
        },
        {
          id: crypto.randomUUID(),
          bucket_id: destinoId,
          data,
          transacao: "entrada_transferencia",
          categoria: "Transferência",
          descricao: `De: ${bucketOrigem.nome} - ${descricao}`,
          valor_brl: valor,
          valor_usd: valor / exchangeRate,
          status: "Confirmado",
          conta_origem_id: origemId,
          related_loan_id: relacionamentoId, // Conecta as transações
        },
      ]

      await supabaseClient.from("extratos").insert(transacoes)

      // RECALCULAR SALDOS DOS DOIS BUCKETS
      await recalcularTodosOsSaldos(origemId)
      await recalcularTodosOsSaldos(destinoId)

      toast({ title: "Sucesso!", description: "Transferência realizada." })
      addLog(
        "TRANSFER",
        `Transferiu ${formatCurrency(valor)} de "${buckets.find((b) => b.id === origemId)?.nome}" para "${buckets.find((b) => b.id === destinoId)?.nome}".`,
      )
    },
    [buckets, exchangeRate, addLog],
  )

  const criarEmprestimo = useCallback(
    async (dados: {
      origemId: string
      destinoId: string
      valor: number
      data: string
      descricao: string
      semLinhaNoExtrato?: boolean
    }) => {
      if (!dados.valor || dados.valor <= 0) {
        toast({ title: "Valor Inválido", description: "Informe um valor válido.", variant: "destructive" })
        return
      }
      if (!supabaseClient) return

      try {
        const { origemId, destinoId, valor, data, descricao, semLinhaNoExtrato = false } = dados
        const bucketOrigem = buckets.find((b) => b.id === origemId)
        const bucketDestino = buckets.find((b) => b.id === destinoId)
        if (!bucketOrigem || !bucketDestino) throw new Error("Bucket de origem ou destino não encontrado.")

        const loanId = crypto.randomUUID()
        const relacionamentoId = crypto.randomUUID()
        const transacoes = []

        if (!semLinhaNoExtrato) {
          transacoes.push({
            id: crypto.randomUUID(),
            bucket_id: origemId,
            data,
            transacao: "saida_emprestimo",
            categoria: "Empréstimo Concedido",
            descricao: `${descricao} para ${bucketDestino.nome}`,
            valor_brl: valor,
            loan_id: loanId,
            status_emprestimo: "ativo",
            conta_destino_id: destinoId,
            visivel_extrato: true,
            related_loan_id: relacionamentoId,
          })
        }
        transacoes.push({
          id: crypto.randomUUID(),
          bucket_id: destinoId,
          data,
          transacao: "entrada",
          categoria: semLinhaNoExtrato ? "Rendimento Recebido" : "Empréstimo Recebido",
          descricao: `Dívida com ${bucketOrigem.nome}: ${descricao}`,
          valor_brl: valor,
          loan_id: loanId,
          status_emprestimo: "ativo",
          conta_origem_id: origemId,
          visivel_extrato: true,
          related_loan_id: relacionamentoId,
        })
        if (semLinhaNoExtrato) {
          transacoes.push({
            id: crypto.randomUUID(),
            bucket_id: origemId,
            data,
            transacao: "registro_emprestimo",
            categoria: "Empréstimo Concedido",
            descricao: `[Sistema] ${descricao}`,
            valor_brl: valor,
            loan_id: loanId,
            status_emprestimo: "ativo",
            conta_destino_id: destinoId,
            visivel_extrato: false,
            related_loan_id: relacionamentoId,
          })
        }

        await supabaseClient.from("extratos").insert(transacoes)

        // RECALCULAR SALDOS DOS DOIS BUCKETS
        await recalcularTodosOsSaldos(origemId)
        await recalcularTodosOsSaldos(destinoId)

        toast({ title: "Sucesso!", description: "Operação de empréstimo registrada." })
        addLog(
          "TRANSFER",
          `Criou empréstimo de ${valor} de "${buckets.find((b) => b.id === origemId)?.nome}" para "${buckets.find((b) => b.id === destinoId)?.nome}".`,
        )
      } catch (err) {
        console.error("🔴 [CONTEXT] Erro em criarEmprestimo:", err)
        toast({ title: "Falha ao Criar Empréstimo", description: (err as Error).message, variant: "destructive" })
        throw err
      }
    },
    [addLog, buckets],
  )

  const realizarPagamentoEmprestimo = useCallback(
    async (dados: {
      loanId: string
      devedorId: string
      credorId: string
      valorPrincipal: number
      jurosAcumulados: number
      valorTotal: number
    }) => {
      if (!supabaseClient) throw new Error("Supabase client não está disponível")
      try {
        const relacionamentoId = crypto.randomUUID()
        const transacoes = [
          {
            id: crypto.randomUUID(),
            bucket_id: dados.devedorId,
            data: new Date().toISOString().split("T")[0],
            transacao: "saida_despesa",
            categoria: "Pagamento de Empréstimo",
            descricao: `Quitação - Principal: ${formatCurrency(dados.valorPrincipal)} + Juros: ${formatCurrency(
              dados.jurosAcumulados,
            )}`,
            valor_brl: dados.valorTotal,
            loan_id: dados.loanId,
            related_loan_id: relacionamentoId,
          },
          {
            id: crypto.randomUUID(),
            bucket_id: dados.credorId,
            data: new Date().toISOString().split("T")[0],
            transacao: "entrada",
            categoria: "Recebimento de Empréstimo",
            descricao: `Quitação - Principal: ${formatCurrency(dados.valorPrincipal)} + Juros: ${formatCurrency(
              dados.jurosAcumulados,
            )}`,
            valor_brl: dados.valorTotal,
            loan_id: dados.loanId,
            related_loan_id: relacionamentoId,
          },
        ]
        await supabaseClient.from("extratos").insert(transacoes)
        await supabaseClient.from("extratos").update({ status_emprestimo: "quitado" }).eq("loan_id", dados.loanId)

        // RECALCULAR SALDOS DOS DOIS BUCKETS
        await recalcularTodosOsSaldos(dados.devedorId)
        await recalcularTodosOsSaldos(dados.credorId)

        await carregarDadosIniciais()
      } catch (error) {
        console.error("🔴 [CONTEXT] Erro ao quitar empréstimo:", error)
        throw error
      }
    },
    [carregarDadosIniciais],
  )

  const realizarPagamentoParcialEmprestimo = useCallback(
    async (dados: {
      loanId: string
      devedorId: string
      credorId: string
      valorPagamento: number
      valorPrincipalPago: number
      jurosPagos: number
      valorPrincipalRestante: number
    }) => {
      if (!supabaseClient) throw new Error("Supabase client não está disponível")
      try {
        const relacionamentoId = crypto.randomUUID()
        const transacoes = [
          {
            id: crypto.randomUUID(),
            bucket_id: dados.devedorId,
            data: new Date().toISOString().split("T")[0],
            transacao: "saida_despesa",
            categoria: "Pagamento Parcial de Empréstimo",
            descricao: `Pag. Parcial - P: ${formatCurrency(dados.valorPrincipalPago)} + J: ${formatCurrency(
              dados.jurosPagos,
            )}`,
            valor_brl: dados.valorPagamento,
            loan_id: dados.loanId,
            related_loan_id: relacionamentoId,
          },
          {
            id: crypto.randomUUID(),
            bucket_id: dados.credorId,
            data: new Date().toISOString().split("T")[0],
            transacao: "entrada",
            categoria: "Recebimento Parcial de Empréstimo",
            descricao: `Rec. Parcial - P: ${formatCurrency(dados.valorPrincipalPago)} + J: ${formatCurrency(
              dados.jurosPagos,
            )}`,
            valor_brl: dados.valorPagamento,
            loan_id: dados.loanId,
            related_loan_id: relacionamentoId,
          },
        ]
        await supabaseClient.from("extratos").insert(transacoes)
        await supabaseClient
          .from("extratos")
          .update({
            valor_brl: dados.valorPrincipalRestante,
            descricao: supabaseClient.raw(`descricao || ' (Saldo após pag. parcial)'`),
          })
          .eq("loan_id", dados.loanId)
          .or("transacao.eq.saida_emprestimo,categoria.eq.Empréstimo Recebido")

        // RECALCULAR SALDOS DOS DOIS BUCKETS
        await recalcularTodosOsSaldos(dados.devedorId)
        await recalcularTodosOsSaldos(dados.credorId)

        await carregarDadosIniciais()
      } catch (error) {
        console.error("🔴 [CONTEXT] Erro ao processar pagamento parcial:", error)
        throw error
      }
    },
    [carregarDadosIniciais],
  )

  const excluirTransacaoCompleta = useCallback(
    async (transacaoOrigem: Extrato) => {
      if (!supabaseClient) return
      try {
        // Correctly call the helper function to avoid recursion
        await excluirTransacaoRecursivamente(transacaoOrigem)
        await carregarDadosIniciais()
        toast({ title: "Sucesso!", description: "Transação(ões) excluída(s)." })
        addLog("DELETE", `Excluiu a transação "${transacaoOrigem.descricao}".`, { id: transacaoOrigem.id })
      } catch (err) {
        console.error("🔴 [CONTEXT] Erro em excluirTransacaoCompleta:", err)
        toast({ title: "Falha ao Excluir", description: (err as Error).message, variant: "destructive" })
      }
    },
    [addLog, carregarDadosIniciais],
  )

  const updateBucketStrategicData = useCallback(
    async (bucketId: string, updatedData: Partial<Bucket>) => {
      if (!supabaseClient) return

      try {
        const dadosMapeados: { [key: string]: any } = {
          nome: updatedData.nome,
          moeda_principal: updatedData.moedaPrincipal,
          categoria: updatedData.categoria,
          capital_inicial_brl: updatedData.capitalInicialBRL, // PERMITIR ALTERAR CAPITAL INICIAL
          aportes_mensais: updatedData.aportesMensais,
          periodo_meses: updatedData.periodoMeses,
          taxa_rendimento: updatedData.taxaRendimento,
          taxa_emprestimo: updatedData.taxaEmprestimo,
          capital_investido: updatedData.capitalInvestido,
          // NÃO incluir saldo_atual aqui - ele é calculado pelas transações
        }

        Object.keys(dadosMapeados).forEach(
          (key) => (dadosMapeados as any)[key] === undefined && delete (dadosMapeados as any)[key],
        )

        const { data, error } = await supabaseClient
          .from("buckets")
          .update(dadosMapeados)
          .eq("id", bucketId)
          .select("*, total_a_receber_emprestimos")

        if (error) throw error

        if (data && data.length > 0) {
          const updatedBucketFromDb = mapBucketFromDb(data[0])
          setBuckets((prevBuckets) => {
            const newBuckets = prevBuckets.map((b) => {
              if (b.id === bucketId) {
                return { ...updatedBucketFromDb, extratos: b.extratos }
              }
              return b
            })
            return processarSaldos(newBuckets)
          })
        }

        toast({ title: "Sucesso!", description: "Dados do bucket atualizados." })
        addLog("UPDATE", `Atualizou dados estratégicos do bucket.`, { bucketId })
      } catch (err) {
        console.error("🔴 [CONTEXT] Erro em updateBucketStrategicData:", err)
        toast({ title: "Falha na Atualização", description: (err as Error).message, variant: "destructive" })
        throw err
      }
    },
    [addLog],
  )

  const updateBucketName = useCallback(
    async (bucketId: string, newName: string) => {
      if (!supabaseClient) return
      try {
        const { data, error } = await supabaseClient
          .from("buckets")
          .update({ nome: newName })
          .eq("id", bucketId)
          .select()
          .single()
        if (error) throw error
        await carregarDadosIniciais()
        toast({ title: "Sucesso!", description: "Nome do bucket atualizado." })
        addLog("UPDATE", `Renomeou bucket para "${newName}".`, { bucketId })
      } catch (err) {
        console.error("🔴 [CONTEXT] Erro em updateBucketName:", err)
        toast({ title: "Falha na Atualização", description: (err as Error).message, variant: "destructive" })
      }
    },
    [addLog, carregarDadosIniciais],
  )

  const confirmarTransacaoPendente = useCallback(
    async (bucketId: string, extratoId: string) => {
      if (!supabaseClient) return
      try {
        await supabaseClient.from("extratos").update({ status: "Confirmado" }).eq("id", extratoId).select().single()
        await carregarDadosIniciais()
        toast({ title: "Sucesso!", description: "Transação confirmada." })
        addLog("UPDATE", `Confirmou transação pendente.`, { extratoId })
      } catch (err) {
        console.error("🔴 [CONTEXT] Erro em confirmarTransacaoPendente:", err)
        toast({
          title: "Falha na Confirmação",
          description: (err as Error).message,
          variant: "destructive",
        })
      }
    },
    [addLog, carregarDadosIniciais],
  )

  // WRAPPER PARA CRIAR ALOCAÇÃO INICIAL
  const criarAlocacaoInicialWrapper = useCallback(async (bucketId: string) => {
    // Implementação simplificada - não há mais restrição
    console.log("Alocação inicial não é mais obrigatória")
  }, [])

  // WRAPPER PARA DESCOBRIR ESTRUTURA BUCKETS
  const descobrirEstruturaBucketsWrapper = useCallback(async () => {
    return { message: "Estrutura de buckets descoberta" }
  }, [])

  // WRAPPER PARA CORRIGIR SALDO RENDIMENTO REDIRECIONADO
  const corrigirSaldoRendimentoRedirecionadoWrapper = useCallback(async () => {
    console.log("Corrigindo saldos de rendimento redirecionado...")
    await carregarDadosIniciais()
  }, [carregarDadosIniciais])

  // WRAPPER PARA ATUALIZAR CAPITAL INVESTIDO
  const atualizarCapitalInvestidoWrapper = useCallback(
    async (bucketId: string) => {
      await sincronizarCapitalInvestido(bucketId)
      await carregarDadosIniciais()
    },
    [carregarDadosIniciais],
  )

  const { totalPatrimonioBRL, totalPatrimonioUSD, rendimentoMensal, liquidezImediata, bucketsAtivos } = useMemo(() => {
    let patrimonio = 0
    let liquidez = 0
    let rendimento = 0
    const hoje = new Date()
    const primeiroDiaMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

    buckets.forEach((bucket) => {
      const saldoBucket = bucket.saldoAtual || 0
      patrimonio += saldoBucket
      if (bucket.liquidez === "alta") {
        liquidez += saldoBucket
      }

      const rendimentoBucket = bucket.extratos
        .filter(
          (e) =>
            e.isRendimento &&
            e.transacao === "entrada" &&
            e.status === "Confirmado" &&
            new Date(e.data) >= primeiroDiaMesAtual,
        )
        .reduce((acc, e) => acc + e.valorBRL, 0)
      rendimento += rendimentoBucket
    })

    return {
      totalPatrimonioBRL: patrimonio,
      totalPatrimonioUSD: patrimonio / exchangeRate,
      rendimentoMensal: rendimento,
      liquidezImediata: liquidez,
      bucketsAtivos: buckets.filter((b) => b.status === "active").length,
    }
  }, [buckets, exchangeRate])

  useEffect(() => {
    carregarDadosIniciais()
  }, [carregarDadosIniciais])

  return (
    <BucketsContext.Provider
      value={{
        buckets,
        setBuckets,
        logs,
        loading,
        error,
        fetchInitialData,
        adicionarBucket,
        updateBucketStrategicData,
        updateBucketName,
        adicionarExtrato,
        editarExtrato,
        realizarTransferenciaSimples,
        criarEmprestimo,
        realizarPagamentoEmprestimo,
        realizarPagamentoParcialEmprestimo,
        excluirTransacaoCompleta,
        confirmarTransacaoPendente,
        toggleBucketActive,
        resetBucketToInitialCapital,
        totalPatrimonioBRL,
        totalPatrimonioUSD,
        rendimentoMensal,
        liquidezImediata,
        bucketsAtivos,
        exchangeRate,
        isGlobalModalOpen,
        setIsGlobalModalOpen,
        transactionToEdit,
        setTransactionToEdit,
        descobrirEstruturaBuckets: descobrirEstruturaBucketsWrapper,
        corrigirSaldoRendimentoRedirecionado: corrigirSaldoRendimentoRedirecionadoWrapper,
        criarAlocacaoInicial: criarAlocacaoInicialWrapper,
        atualizarCapitalInvestido: atualizarCapitalInvestidoWrapper,
      }}
    >
      {children}
    </BucketsContext.Provider>
  )
}

export function useBuckets() {
  const context = useContext(BucketsContext)
  if (context === undefined) {
    throw new Error("useBuckets must be used within a BucketsProvider")
  }
  return context
}
