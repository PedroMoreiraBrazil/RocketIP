const assert = require("assert");
const core = require("../js/search-core.js");

const sampleRecords = [
  {
    id: "1",
    nomeNumero: "Lei nº 9.279/1996",
    data: "14/05/1996",
    descricao: "Regula direitos e obrigações relativos à Propriedade Industrial, patentes, marcas, desenhos industriais e indicações geográficas.",
    link: "https://www.planalto.gov.br/ccivil_03/leis/l9279.htm",
    origem: "Legislações"
  },
  {
    id: "2",
    nomeNumero: "Resolução PR 85",
    data: "23/04/2013",
    descricao: "Institui a Diretriz de Exame de Patente de Modelo de Utilidade.",
    link: "https://www.gov.br/inpi/pt-br/backup/centrais-de-conteudo/legislacao/Resoluo0852013.pdf",
    origem: "Normativos"
  },
  {
    id: "3",
    nomeNumero: "Decreto nº 8.772/2016",
    data: "11/05/2016",
    descricao: "Regulamenta acesso ao patrimônio genético e conhecimento tradicional associado.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/decreto/d8772.htm",
    origem: "Legislações"
  }
];

function top(query) {
  return core.searchRecords(query, sampleRecords)[0];
}

assert.strictEqual(top("9.279/1996").nomeNumero, "Lei nº 9.279/1996", "pesquisa por número exato");
assert.strictEqual(top("Lei nº 9.279/1996").tipoCorrespondencia, "Exata", "pesquisa por nome exato");
assert.strictEqual(top("modelo de utilidade").nomeNumero, "Resolução PR 85", "pesquisa por parte do nome/descrição");
assert.strictEqual(top("PROPRIEDADE INDUSTRIAL").nomeNumero, "Lei nº 9.279/1996", "maiúsculas/minúsculas");
assert.strictEqual(top("indicacoes geograficas").nomeNumero, "Lei nº 9.279/1996", "acentos ignorados");
assert.strictEqual(top("patrimonjo genetico").nomeNumero, "Decreto nº 8.772/2016", "pequeno erro de digitação");
assert.strictEqual(top("patentes").nomeNumero, "Lei nº 9.279/1996", "palavra na descrição");
assert.strictEqual(top("14/05/1996").nomeNumero, "Lei nº 9.279/1996", "pesquisa por data");
assert.strictEqual(top("l9279").nomeNumero, "Lei nº 9.279/1996", "pesquisa por conteúdo do link");
assert.strictEqual(core.searchRecords("termo inexistente xyz", sampleRecords).length, 0, "nenhum resultado");

const fakeXLSX = {
  utils: {
    sheet_to_json: (sheet) => sheet.rows
  }
};

const validWorkbook = {
  SheetNames: ["Legislações", "Normativos"],
  Sheets: {
    "Legislações": {
      rows: [
        ["Nome e Número", "Data", "Breve Descrição", "Link para o Documento"],
        ["Lei Teste", 35199, "Descrição válida", "https://example.com/doc.pdf"],
        ["", "", "", ""],
        ["Lei com célula vazia", "", "Descrição", "https://example.com"]
      ]
    },
    "Normativos": {
      rows: [
        ["Nome e Número", "Data", "Breve Descrição", "Link para o Documento"],
        ["Norma com link inválido", "01/01/2020", "Descrição", "javascript:alert(1)"]
      ]
    }
  }
};

let validation = core.validateAndConvertWorkbook(validWorkbook, { XLSX: fakeXLSX });
assert.strictEqual(validation.errors.length, 0, "planilha válida não deve gerar erro fatal");
assert.strictEqual(validation.records.length, 3, "linhas vazias devem ser ignoradas");
assert.ok(validation.records[0].data.includes("1996"), "data serial do Excel deve ser convertida");
assert.ok(validation.warnings.some((warning) => warning.includes("célula vazia")), "células vazias devem gerar aviso");
assert.ok(validation.warnings.some((warning) => warning.includes("link inválido")), "link inválido deve gerar aviso");

const missingSheetWorkbook = {
  SheetNames: ["Legislações"],
  Sheets: { "Legislações": { rows: [["Nome e Número", "Data", "Breve Descrição", "Link para o Documento"]] } }
};
validation = core.validateAndConvertWorkbook(missingSheetWorkbook, { XLSX: fakeXLSX });
assert.ok(validation.errors.some((error) => error.includes("Normativos")), "aba ausente deve gerar erro");

const missingColumnWorkbook = {
  SheetNames: ["Legislações", "Normativos"],
  Sheets: {
    "Legislações": { rows: [["Nome e Número", "Data", "Link para o Documento"]] },
    "Normativos": { rows: [["Nome e Número", "Data", "Breve Descrição", "Link para o Documento"]] }
  }
};
validation = core.validateAndConvertWorkbook(missingColumnWorkbook, { XLSX: fakeXLSX });
assert.ok(validation.errors.some((error) => error.includes("Breve Descrição")), "coluna ausente deve gerar erro");

const emptyWorkbook = {
  SheetNames: ["Legislações", "Normativos"],
  Sheets: {
    "Legislações": { rows: [] },
    "Normativos": { rows: [] }
  }
};
validation = core.validateAndConvertWorkbook(emptyWorkbook, { XLSX: fakeXLSX });
assert.ok(validation.errors.some((error) => error.includes("está vazia")), "aba vazia deve gerar erro");

assert.ok(core.validateFileObject({ name: "base.xls", size: 10 }).length > 0, "arquivo fora de formato deve ser recusado");

const largeRecords = Array.from({ length: 2500 }, (_, index) => ({
  id: `large-${index}`,
  nomeNumero: `Normativo ${index}`,
  data: "01/01/2026",
  descricao: index === 1999 ? "Registro especial sobre marcas e patentes" : "Registro comum",
  link: `https://example.com/${index}`,
  origem: index % 2 ? "Normativos" : "Legislações"
}));
assert.ok(core.searchRecords("marcas e patentes", largeRecords).length >= 1, "grande quantidade de registros");

console.log("Todos os testes automatizados de lógica foram aprovados.");
