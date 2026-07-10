(function attachRocketIPCore(root, factory) {
  const core = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = core;
  }
  if (root) {
    root.RocketIPCore = core;
  }
})(typeof window !== "undefined" ? window : globalThis, function createRocketIPCore() {
  "use strict";

  const REQUIRED_SHEETS = ["Legislações", "Normativos"];
  const REQUIRED_COLUMNS = ["Nome e Número", "Data", "Breve Descrição", "Link para o Documento"];
  const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
  const APPROXIMATE_THRESHOLD = 0.78;

  const FIELD_CONFIG = [
    { key: "nomeNumero", label: "Nome e Número", exact: 1000, partial: 720, approximate: 470 },
    { key: "data", label: "Data", exact: 880, partial: 580, approximate: 330 },
    { key: "descricao", label: "Breve Descrição", exact: 820, partial: 540, approximate: 310 },
    { key: "link", label: "Link para o Documento", exact: 760, partial: 500, approximate: 260 }
  ];

  function normalizeText(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeForIndex(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function compactText(value) {
    return normalizeText(value).replace(/[^a-z0-9]/g, "");
  }

  function tokenize(value) {
    return normalizeText(value)
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function buildNormalizedMap(originalText) {
    const text = String(originalText ?? "");
    let normalized = "";
    const map = [];

    for (let i = 0; i < text.length; i += 1) {
      const normalizedChar = normalizeForIndex(text[i]);
      for (let j = 0; j < normalizedChar.length; j += 1) {
        normalized += normalizedChar[j];
        map.push(i);
      }
    }

    return { normalized, map };
  }

  function mergeRanges(ranges) {
    if (!ranges.length) return [];
    ranges.sort((a, b) => a.start - b.start || a.end - b.end);
    const merged = [ranges[0]];

    for (let i = 1; i < ranges.length; i += 1) {
      const last = merged[merged.length - 1];
      const current = ranges[i];
      if (current.start <= last.end) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  function highlightText(text, query) {
    const original = String(text ?? "");
    const normalizedQuery = normalizeForIndex(query).trim();
    const queryTokens = tokenize(query).filter((token) => token.length >= 3);
    const terms = [];

    if (normalizedQuery.length >= 3) {
      terms.push(normalizedQuery);
    }
    for (const token of queryTokens) {
      if (!terms.includes(token)) terms.push(token);
    }

    if (!terms.length || !original) return escapeHtml(original);

    const { normalized, map } = buildNormalizedMap(original);
    const ranges = [];

    for (const term of terms) {
      let startFrom = 0;
      while (startFrom < normalized.length) {
        const found = normalized.indexOf(term, startFrom);
        if (found === -1) break;
        const originalStart = map[found];
        const originalEnd = map[found + term.length - 1] + 1;
        if (Number.isInteger(originalStart) && Number.isInteger(originalEnd)) {
          ranges.push({ start: originalStart, end: originalEnd });
        }
        startFrom = found + Math.max(1, term.length);
      }
    }

    const merged = mergeRanges(ranges);
    if (!merged.length) return escapeHtml(original);

    let output = "";
    let cursor = 0;
    for (const range of merged) {
      output += escapeHtml(original.slice(cursor, range.start));
      output += `<mark>${escapeHtml(original.slice(range.start, range.end))}</mark>`;
      cursor = range.end;
    }
    output += escapeHtml(original.slice(cursor));
    return output;
  }

  function levenshteinDistance(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    const current = new Array(b.length + 1);

    for (let i = 1; i <= a.length; i += 1) {
      current[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
        current[j] = Math.min(
          previous[j] + 1,
          current[j - 1] + 1,
          previous[j - 1] + substitutionCost
        );
      }
      for (let j = 0; j <= b.length; j += 1) {
        previous[j] = current[j];
      }
    }

    return previous[b.length];
  }

  function similarity(a, b) {
    const left = normalizeText(a);
    const right = normalizeText(b);
    const longest = Math.max(left.length, right.length);
    if (!longest) return 1;
    return 1 - levenshteinDistance(left, right) / longest;
  }

  function bestApproximateMatch(queryTokens, fieldTokens) {
    let bestScore = 0;
    let bestQueryToken = "";
    let bestFieldToken = "";
    let matchedTokenCount = 0;

    const significantQueryTokens = queryTokens.filter((token) => token.length >= 4);
    const significantFieldTokens = fieldTokens.filter((token) => token.length >= 3);

    for (const queryToken of significantQueryTokens) {
      let tokenWasMatched = false;
      for (const fieldToken of significantFieldTokens) {
        const lengthGap = Math.abs(queryToken.length - fieldToken.length);
        if (lengthGap > Math.max(3, Math.ceil(queryToken.length * 0.45))) continue;
        const score = similarity(queryToken, fieldToken);
        if (score > bestScore) {
          bestScore = score;
          bestQueryToken = queryToken;
          bestFieldToken = fieldToken;
        }
        if (score >= APPROXIMATE_THRESHOLD) tokenWasMatched = true;
      }
      if (tokenWasMatched) matchedTokenCount += 1;
    }

    return {
      score: bestScore,
      queryToken: bestQueryToken,
      fieldToken: bestFieldToken,
      matchedTokenCount
    };
  }

  function classifyFieldMatch(fieldValue, query, fieldConfig) {
    const value = String(fieldValue ?? "");
    const normalizedValue = normalizeText(value);
    const compactValue = compactText(value);
    const normalizedQuery = normalizeText(query);
    const compactQuery = compactText(query);
    const queryTokens = tokenize(query);
    const fieldTokens = tokenize(value);

    if (!normalizedQuery || !normalizedValue) return null;

    const exactPhrase = normalizedValue.includes(normalizedQuery);
    const exactCompact = compactQuery.length >= 3 && compactValue.includes(compactQuery);

    if (exactPhrase || exactCompact) {
      return {
        type: "Exata",
        score: fieldConfig.exact + Math.min(80, normalizedQuery.length),
        field: fieldConfig.label,
        detail: exactCompact && !exactPhrase ? "número ou termo sem pontuação" : "termo literal"
      };
    }

    const meaningfulTokens = queryTokens.filter((token) => token.length >= 3);
    const allTokensPresent = meaningfulTokens.length > 0 && meaningfulTokens.every((token) => normalizedValue.includes(token));
    const presentTokenCount = meaningfulTokens.filter((token) => normalizedValue.includes(token)).length;

    if (allTokensPresent || presentTokenCount > 0) {
      return {
        type: "Parcial",
        score: fieldConfig.partial + presentTokenCount * 35 + (allTokensPresent ? 35 : 0),
        field: fieldConfig.label,
        detail: allTokensPresent ? "todas as palavras encontradas" : "parte do termo encontrada"
      };
    }

    const approximate = bestApproximateMatch(queryTokens, fieldTokens);
    if (approximate.score >= APPROXIMATE_THRESHOLD) {
      return {
        type: "Aproximada",
        score: fieldConfig.approximate + Math.round(approximate.score * 100) + approximate.matchedTokenCount * 30,
        field: fieldConfig.label,
        detail: `${approximate.queryToken} ≈ ${approximate.fieldToken}`,
        similarity: approximate.score
      };
    }

    return null;
  }

  function chooseBestType(matches) {
    const order = { Exata: 3, Parcial: 2, Aproximada: 1 };
    return matches.reduce((best, current) => {
      if (!best) return current;
      if (order[current.type] > order[best.type]) return current;
      if (order[current.type] === order[best.type] && current.score > best.score) return current;
      return best;
    }, null);
  }

  function searchRecords(query, records) {
    const cleanQuery = String(query ?? "").trim();
    if (!cleanQuery) return [];

    const results = [];

    for (const record of records || []) {
      const matches = [];
      let totalScore = 0;
      let bestScore = 0;

      for (const fieldConfig of FIELD_CONFIG) {
        const match = classifyFieldMatch(record[fieldConfig.key], cleanQuery, fieldConfig);
        if (match) {
          matches.push(match);
          totalScore += Math.round(match.score * 0.18);
          bestScore = Math.max(bestScore, match.score);
        }
      }

      if (matches.length) {
        const bestType = chooseBestType(matches);
        results.push({
          ...record,
          score: bestScore + totalScore,
          tipoCorrespondencia: bestType.type,
          camposCorrespondentes: matches.map((match) => match.field),
          detalhesCorrespondencia: matches
        });
      }
    }

    return results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.nomeNumero).localeCompare(String(b.nomeNumero), "pt-BR");
    });
  }

  function formatDateFromSerial(serial) {
    const numeric = Number(serial);
    if (!Number.isFinite(numeric)) return String(serial ?? "").trim();
    if (numeric < 1 || numeric > 100000) return String(serial ?? "").trim();

    const utcMilliseconds = Math.round((numeric - 25569) * 86400 * 1000);
    const date = new Date(utcMilliseconds);
    if (Number.isNaN(date.getTime())) return String(serial ?? "").trim();

    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = String(date.getUTCFullYear());
    return `${day}/${month}/${year}`;
  }

  function formatDateValue(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const day = String(value.getDate()).padStart(2, "0");
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const year = String(value.getFullYear());
      return `${day}/${month}/${year}`;
    }

    if (typeof value === "number") {
      return formatDateFromSerial(value);
    }

    const text = String(value ?? "").trim();
    if (/^\d+(\.\d+)?$/.test(text)) {
      const number = Number(text);
      if (number >= 20000 && number <= 70000) {
        return formatDateFromSerial(number);
      }
    }
    return text;
  }

  function cleanCell(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/\s+/g, " ").trim();
  }

  function normalizeHeader(value) {
    return normalizeText(value).replace(/\s+/g, " ");
  }

  function validateUrl(value) {
    const original = String(value ?? "").trim();
    if (!original) return { valid: false, href: "", reason: "link ausente" };

    const candidate = /^www\./i.test(original) ? `https://${original}` : original;
    try {
      const parsed = new URL(candidate);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { valid: false, href: "", reason: "o link deve começar com http:// ou https://" };
      }
      return { valid: true, href: parsed.href, reason: "" };
    } catch (error) {
      return { valid: false, href: "", reason: "link malformado" };
    }
  }

  function validateFileObject(file) {
    const errors = [];
    if (!file) {
      errors.push("Nenhum arquivo foi selecionado.");
      return errors;
    }

    const fileName = String(file.name ?? "");
    if (!fileName.toLowerCase().endsWith(".xlsx")) {
      errors.push("O arquivo deve estar no formato .xlsx.");
    }

    if (Number(file.size) > MAX_FILE_SIZE_BYTES) {
      errors.push(`O arquivo excede o limite de ${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)} MB definido para esta versão inicial.`);
    }

    return errors;
  }

  function validateAndConvertWorkbook(workbook, options = {}) {
    const XLSXRef = options.XLSX || (typeof XLSX !== "undefined" ? XLSX : null);
    const errors = [];
    const warnings = [];
    const records = [];

    if (!XLSXRef || !XLSXRef.utils || typeof XLSXRef.utils.sheet_to_json !== "function") {
      errors.push("A biblioteca de leitura de Excel não foi carregada. Verifique sua conexão ou use a versão local da biblioteca SheetJS.");
      return { errors, warnings, records, metadata: null };
    }

    if (!workbook || !Array.isArray(workbook.SheetNames) || !workbook.Sheets) {
      errors.push("Não foi possível ler a estrutura da planilha. Confirme se o arquivo é um .xlsx válido.");
      return { errors, warnings, records, metadata: null };
    }

    const availableSheetNames = workbook.SheetNames;
    const normalizedSheetMap = new Map(availableSheetNames.map((sheetName) => [normalizeText(sheetName), sheetName]));

    for (const requiredSheetName of REQUIRED_SHEETS) {
      const actualSheetName = normalizedSheetMap.get(normalizeText(requiredSheetName));
      if (!actualSheetName) {
        errors.push(`A aba obrigatória "${requiredSheetName}" não foi encontrada.`);
      }
    }

    if (errors.length) {
      return { errors, warnings, records, metadata: null };
    }

    for (const requiredSheetName of REQUIRED_SHEETS) {
      const actualSheetName = normalizedSheetMap.get(normalizeText(requiredSheetName));
      const worksheet = workbook.Sheets[actualSheetName];
      const rows = XLSXRef.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: true,
        defval: "",
        blankrows: false
      });

      if (!rows.length) {
        errors.push(`A aba "${requiredSheetName}" está vazia.`);
        continue;
      }

      const headerRow = rows[0].map((value) => cleanCell(value));
      const headerMap = new Map(headerRow.map((header, index) => [normalizeHeader(header), index]));
      const columnIndex = {};

      for (const requiredColumn of REQUIRED_COLUMNS) {
        const index = headerMap.get(normalizeHeader(requiredColumn));
        if (index === undefined) {
          errors.push(`A aba "${requiredSheetName}" não contém a coluna obrigatória "${requiredColumn}".`);
        } else {
          columnIndex[requiredColumn] = index;
        }
      }

      if (Object.keys(columnIndex).length !== REQUIRED_COLUMNS.length) {
        continue;
      }

      for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
        const row = rows[rowIndex] || [];
        const nomeNumero = cleanCell(row[columnIndex["Nome e Número"]]);
        const data = formatDateValue(row[columnIndex.Data]);
        const descricao = cleanCell(row[columnIndex["Breve Descrição"]]);
        const link = cleanCell(row[columnIndex["Link para o Documento"]]);
        const requiredValues = [nomeNumero, data, descricao, link];

        if (requiredValues.every((value) => !value)) {
          continue;
        }

        const emptyColumns = REQUIRED_COLUMNS.filter((column, index) => !requiredValues[index]);
        if (emptyColumns.length) {
          warnings.push(`Aba "${requiredSheetName}", linha ${rowIndex + 1}: célula vazia em ${emptyColumns.join(", ")}.`);
        }

        const urlValidation = validateUrl(link);
        if (link && !urlValidation.valid) {
          warnings.push(`Aba "${requiredSheetName}", linha ${rowIndex + 1}: link inválido em "${nomeNumero || "registro sem nome"}" (${urlValidation.reason}).`);
        }

        records.push({
          id: `${requiredSheetName}-${rowIndex + 1}-${records.length + 1}`,
          nomeNumero,
          data,
          descricao,
          link,
          linkValido: urlValidation.valid,
          linkSeguro: urlValidation.href,
          origem: requiredSheetName,
          linha: rowIndex + 1
        });
      }
    }

    if (!records.length && !errors.length) {
      errors.push("A planilha foi lida, mas não há registros nas abas obrigatórias.");
    }

    return {
      errors,
      warnings,
      records,
      metadata: {
        totalRecords: records.length,
        sheets: REQUIRED_SHEETS.map((sheetName) => ({
          name: sheetName,
          count: records.filter((record) => record.origem === sheetName).length
        })),
        loadedAt: new Date().toISOString()
      }
    };
  }

  return {
    REQUIRED_SHEETS,
    REQUIRED_COLUMNS,
    MAX_FILE_SIZE_BYTES,
    APPROXIMATE_THRESHOLD,
    normalizeText,
    compactText,
    tokenize,
    escapeHtml,
    highlightText,
    similarity,
    searchRecords,
    validateUrl,
    validateFileObject,
    validateAndConvertWorkbook,
    formatDateValue,
    formatDateFromSerial
  };
});
