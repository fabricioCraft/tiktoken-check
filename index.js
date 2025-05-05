import express from 'express';
import { encoding_for_model } from '@dqbd/tiktoken';

const app = express();
const port = process.env.PORT || 3000;

// Aumentar o limite de tamanho do body para requisições JSON
// O limite padrão do express.json() é geralmente 1mb,
// aumentar isso permite corpos de requisição maiores.
// Defina um limite que seja razoável para o tamanho máximo esperado
// dos seus inputs/outputs, mas não excessivamente alto para evitar ataques DDoS.
app.use(express.json({ limit: '50mb' })); // Exemplo: Permite até 50MB de corpo JSON

app.post('/tokenize', (req, res) => {
  const { input, output } = req.body;

  // Removida a validação explícita de existência para permitir inputs/outputs vazios se necessário.
  // No entanto, para tokenização, pelo menos uma string vazia é geralmente esperada.
  // Se você *precisa* que eles existam, mantenha a validação, mas ela não limita o TAMANHO.
   if (!input || !output) {
     return res.status(400).json({ error: 'Parâmetros "input" e "output" são obrigatórios.' });
  }

  // Garanta que input e output sejam strings, mesmo que vazias, para evitar erros com enc.encode
  const inputString = typeof input === 'string' ? input : '';
  const outputString = typeof output === 'string' ? output : '';


  let enc;
  try {
      enc = encoding_for_model("gpt-4");

      const inputTokens = enc.encode(inputString);
      const outputTokens = enc.encode(outputString);
      const totalTokens = inputTokens.length + outputTokens.length;

      // Preço GPT-4 Turbo (atualizado em Nov 2023) - Verifique as taxas atuais da OpenAI
      // Input: $0.01 / 1K tokens
      // Output: $0.03 / 1K tokens
      const inputCost = (inputTokens.length * 0.01) / 1000;
      const outputCost = (outputTokens.length * 0.03) / 1000;
      const totalCost = inputCost + outputCost;

      // Libera a memória alocada pelo tokenizador
      enc.free();

      res.json({
        model: "gpt-4", // Especifique a versão exata se souber (ex: gpt-4-turbo-2024-04-09)
        input_characters: inputString.length,
        output_characters: outputString.length,
        input_tokens: inputTokens.length,
        output_tokens: outputTokens.length,
        total_tokens: totalTokens,
        input_cost_usd: parseFloat(inputCost.toFixed(8)), // Aumenta a precisão para custos baixos
        output_cost_usd: parseFloat(outputCost.toFixed(8)),
        total_cost_usd: parseFloat(totalCost.toFixed(8))
      });

  } catch (error) {
      // Captura erros do tokenizador (como memory access out of bounds)
      console.error("Erro durante a tokenização:", error);
      // Libera o tokenizador em caso de erro, se ele foi criado
      if (enc) {
          enc.free();
      }
      // Retorna um erro ao cliente
      res.status(500).json({
          error: "Erro ao processar a tokenização. O input pode ser muito longo.",
          details: error.message
      });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});