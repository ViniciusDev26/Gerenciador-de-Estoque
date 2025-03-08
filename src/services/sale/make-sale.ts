import { knex } from "../../config/database";
import { logger } from "../../config/pino";
import { adicionarCliente } from "../customer/add-customer";

export async function adicionarVenda(
	nome_cliente: string,
	telefone: string,
	valor_total: number,
	metodo_pagamento: string,
	tipo_cliente: string,
	taxa_entrega: number,
	produtosSelecionados: {
		Produto_ID: number;
		Nome_Produto: string;
		Preco: number;
		Custo: number;
		quantidadeSelecionada: number;
	}[],
) {
	const data_venda = new Date().toISOString().slice(0, 10);
	const trx = await knex.transaction();

	try {
		const cliente_id = await adicionarCliente(
			nome_cliente,
			telefone,
			tipo_cliente,
		);

		let lucro_produto = 0;

		const [vendaId] = await trx("Venda").insert({
			Cliente_ID: cliente_id,
			Data_Venda: data_venda,
			Valor_Total: valor_total,
			Lucro_Produto: lucro_produto,
			Metodo_Pagamento: metodo_pagamento,
			Nome_cliente: nome_cliente,
			Taxa_Entrega: taxa_entrega,
			Tipo_Cliente: tipo_cliente,
		});

		const itemVendaValues = produtosSelecionados.map((produto) => {
			const preco = produto.Preco;
			const custo = produto.Custo;
			const quantidade = produto.quantidadeSelecionada;

			if (
				Number.isNaN(preco) ||
				Number.isNaN(custo) ||
				Number.isNaN(quantidade)
			) {
				throw new Error(
					`Dados inválidos para o produto ${produto.Nome_Produto}`,
				);
			}

			const lucroUnitario = (preco - custo) * quantidade;
			lucro_produto += lucroUnitario;

			return {
				Venda_ID: vendaId,
				Produto_ID: produto.Produto_ID,
				Quantidade_Vendida: quantidade,
				Preco_Unitario: preco,
				Data_Pedido: data_venda,
			};
		});

		await trx("Venda")
			.where("Venda_ID", vendaId)
			.update({ Lucro_Produto: lucro_produto });

		await trx("Item_Venda").insert(itemVendaValues);

		for (const produto of produtosSelecionados) {
			await trx("Estoque")
				.where("Produto_ID", produto.Produto_ID)
				.decrement("Quantidade_Total", produto.quantidadeSelecionada);
		}

		await trx.commit();

		return { vendaId, produtos: produtosSelecionados };
	} catch (error) {
		const err = error as Error;
		await trx.rollback();
		logger.error(`Erro ao registrar a venda: ${err.message}`);
		throw new Error("Erro ao registrar a venda");
	}
}
