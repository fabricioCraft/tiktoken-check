import express from 'express';
import { encoding_for_model } from '@dqbd/tiktoken';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/tokenize', (req, res) => {
  const { input, output } = req.body;

  if (!input || !output) {
    return res.status(400).json({ error: 'Parâmetros "input" e "output" são obrigatórios.' });
  }

  const enc = encoding_for_model("gpt-4");

  const inputTokens = enc.encode(input);
  const outputTokens = enc.encode(output);
  const totalTokens = inputTokens.length + outputTokens.length;

  // Preço GPT-4 por 1.000 tokens
  const inputCost = (inputTokens.length * 0.03) / 1000;
  const outputCost = (outputTokens.length * 0.06) / 1000;
  const totalCost = inputCost + outputCost;

  enc.free();

  res.json({
    model: "gpt-4",
    input_characters: input.length,
    output_characters: output.length,
    input_tokens: inputTokens.length,
    output_tokens: outputTokens.length,
    total_tokens: totalTokens,
    input_cost_usd: parseFloat(inputCost.toFixed(6)),
    output_cost_usd: parseFloat(outputCost.toFixed(6)),
    total_cost_usd: parseFloat(totalCost.toFixed(6))
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
