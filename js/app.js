(function initializeRocketIPApp() {
  "use strict";

  const STORAGE_KEY = "rocketip.database.v1";
  const DEFAULT_DATABASE_URL = "data/base_rocketip.xlsx";
  const PAGE_SIZE = 10;

  const core = window.RocketIPCore;

  const elements = {
    brandImage: document.getElementById("brandImage"),
    brandPlaceholder: document.getElementById("brandPlaceholder"),
    searchForm: document.getElementById("searchForm"),
    searchInput: document.getElementById("searchInput"),
    excelFileInput: document.getElementById("excelFileInput"),
    fileDropArea: document.getElementById("fileDropArea"),
    clearDatabaseButton: document.getElementById("clearDatabaseButton"),
    databaseSummary: document.getElementById("databaseSummary"),
    statusBox: document.getElementById("statusBox"),
    resultsSection: document.getElementById("resultsSection"),
    resultsCount: document.getElementById("resultsCount"),
    resultsList: document.getElementById("resultsList"),
    originFilter: document.getElementById("originFilter"),
    backHomeButton: document.getElementById("backHomeButton"),
    loadMoreWrapper: document.getElementById("loadMoreWrapper"),
    loadMoreButton: document.getElementById("loadMoreButton")
  };

  const state = {
    records: [],
    metadata: null,
    warnings: [],
    results: [],
    visibleCount: PAGE_SIZE,
    lastQuery: ""
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupBrandFallback();
    setupEvents();
    loadPublishedDatabase();
  });

  function setupBrandFallback() {
    elements.brandImage.addEventListener("error", () => {
      elements.brandImage.hidden = true;
      elements.brandPlaceholder.hidden = false;
    });
  }

  function setupEvents() {
    elements.searchForm.addEventListener("submit", handleSearchSubmit);
    elements.excelFileInput.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (file) handleFile(file);
    });
    elements.clearDatabaseButton.addEventListener("click", clearSavedDatabase);
    elements.originFilter.addEventListener("change", () => {
      state.visibleCount = PAGE_SIZE;
      renderResults();
    });
    elements.backHomeButton.addEventListener("click", () => {
      elements.resultsSection.hidden = true;
      window.scrollTo({ top: 0, behavior: "smooth" });
      elements.searchInput.focus();
    });
    elements.loadMoreButton.addEventListener("click", () => {
      state.visibleCount += PAGE_SIZE;
      renderResults();
    });

    elements.fileDropArea.addEventListener("dragover", (event) => {
      event.preventDefault();
      elements.fileDropArea.classList.add("is-dragover");
    });
    elements.fileDropArea.addEventListener("dragleave", () => {
      elements.fileDropArea.classList.remove("is-dragover");
    });
    elements.fileDropArea.addEventListener("drop", (event) => {
      event.preventDefault();
      elements.fileDropArea.classList.remove("is-dragover");
      const file = event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) handleFile(file);
    });
  }

  async function loadPublishedDatabase() {
    if (!window.XLSX) {
      showStatus("error", "Biblioteca de Excel não carregada", [
        "A leitura do arquivo .xlsx depende da biblioteca SheetJS.",
        "Verifique a conexão com a internet e recarregue a página."
      ]);
      updateDatabaseSummary();
      return;
    }

    showStatus("warning", "Carregando base publicada", [
      `Lendo o arquivo ${DEFAULT_DATABASE_URL}. Aguarde alguns segundos.`
    ]);

    try {
      const response = await fetch(DEFAULT_DATABASE_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Arquivo não encontrado ou inacessível. Código HTTP: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const workbook = window.XLSX.read(arrayBuffer, {
        type: "array",
        cellDates: true,
        cellNF: true,
        cellText: false
      });

      const result = core.validateAndConvertWorkbook(workbook, { XLSX: window.XLSX });

      if (result.errors.length) {
        state.records = [];
        state.metadata = null;
        state.warnings = [];
        updateDatabaseSummary();
        showStatus("error", "A planilha publicada possui problemas que impedem o carregamento", result.errors);
        return;
      }

      state.records = result.records;
      state.metadata = {
        ...result.metadata,
        fileName: DEFAULT_DATABASE_URL
      };
      state.warnings = result.warnings;
      updateDatabaseSummary();

      const successMessages = [`${result.records.length} registros carregados com sucesso.`];
      if (result.warnings.length) {
        successMessages.push(`${result.warnings.length} aviso(s) encontrado(s). A busca continuará funcionando, mas revise a planilha.`);
        successMessages.push(...result.warnings.slice(0, 10));
        if (result.warnings.length > 10) successMessages.push("Há avisos adicionais na planilha publicada.");
      }
      showStatus(result.warnings.length ? "warning" : "success", "Base publicada carregada", successMessages);
    } catch (error) {
      state.records = [];
      state.metadata = null;
      state.warnings = [];
      updateDatabaseSummary();
      showStatus("error", "Não foi possível carregar a base publicada", [
        `Confirme se o arquivo existe exatamente em: ${DEFAULT_DATABASE_URL}`,
        "Confirme se o site foi aberto pelo GitHub Pages, e não diretamente por duplo clique no arquivo index.html.",
        `Detalhe técnico: ${error.message}`
      ]);
    }
  }


  function restoreSavedDatabase() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        updateDatabaseSummary();
        return;
      }
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed.records)) throw new Error("Base salva inválida.");
      state.records = parsed.records;
      state.metadata = parsed.metadata || null;
      state.warnings = parsed.warnings || [];
      updateDatabaseSummary();
      showStatus("success", "Base restaurada", ["A base salva neste navegador foi carregada. Você pode substituí-la selecionando outro arquivo .xlsx."]);
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
      updateDatabaseSummary();
      showStatus("warning", "Base salva não pôde ser restaurada", ["Selecione novamente a planilha .xlsx."]);
    }
  }

  async function handleFile(file) {
    const fileErrors = core.validateFileObject(file);
    if (fileErrors.length) {
      showStatus("error", "Arquivo recusado", fileErrors);
      return;
    }

    if (!window.XLSX) {
      showStatus("error", "Biblioteca de Excel não carregada", [
        "A leitura de arquivos .xlsx depende da biblioteca SheetJS.",
        "Verifique a conexão com a internet ou use a orientação do README para instalar a biblioteca localmente."
      ]);
      return;
    }

    showStatus("warning", "Carregando planilha", ["Aguarde alguns segundos enquanto a estrutura do arquivo é validada."]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(arrayBuffer, {
        type: "array",
        cellDates: true,
        cellNF: true,
        cellText: false
      });
      const result = core.validateAndConvertWorkbook(workbook, { XLSX: window.XLSX });

      if (result.errors.length) {
        showStatus("error", "A planilha possui problemas que impedem o carregamento", result.errors);
        return;
      }

      state.records = result.records;
      state.metadata = {
        ...result.metadata,
        fileName: file.name,
        fileSize: file.size
      };
      state.warnings = result.warnings;
      persistDatabase();
      updateDatabaseSummary();

      const successMessages = [`${result.records.length} registros carregados com sucesso.`];
      if (result.warnings.length) {
        successMessages.push(`${result.warnings.length} aviso(s) encontrado(s). A busca continuará funcionando, mas revise os pontos listados abaixo.`);
        successMessages.push(...result.warnings.slice(0, 10));
        if (result.warnings.length > 10) successMessages.push("Há avisos adicionais. Revise a planilha para corrigir células vazias ou links inválidos.");
      }
      showStatus(result.warnings.length ? "warning" : "success", "Base carregada", successMessages);
    } catch (error) {
      showStatus("error", "Não foi possível ler o arquivo", [
        "Confirme se o arquivo está no formato .xlsx e se não está corrompido.",
        `Detalhe técnico: ${error.message}`
      ]);
    }
  }

  function persistDatabase() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        records: state.records,
        metadata: state.metadata,
        warnings: state.warnings
      }));
    } catch (error) {
      showStatus("warning", "Base carregada, mas não salva no navegador", [
        "A busca funciona nesta sessão. Porém, o navegador não permitiu salvar a base localmente, possivelmente por limite de espaço.",
        "Ao recarregar a página, talvez seja necessário carregar a planilha novamente."
      ]);
    }
  }

  function clearSavedDatabase() {
    localStorage.removeItem(STORAGE_KEY);
    state.records = [];
    state.metadata = null;
    state.warnings = [];
    state.results = [];
    state.visibleCount = PAGE_SIZE;
    elements.resultsSection.hidden = true;
    updateDatabaseSummary();
    showStatus("success", "Base removida", ["A base salva neste navegador foi apagada. O arquivo original no seu computador não foi alterado."]);
  }

  function updateDatabaseSummary() {
    if (!state.records.length) {
      elements.databaseSummary.textContent = "Nenhuma base carregada.";
      return;
    }

    const legislationCount = state.records.filter((record) => record.origem === "Legislações").length;
    const normativeCount = state.records.filter((record) => record.origem === "Normativos").length;
    const fileName = state.metadata && state.metadata.fileName ? ` Arquivo: ${state.metadata.fileName}.` : "";
    elements.databaseSummary.textContent = `Base disponível: ${state.records.length} registros (${legislationCount} legislações e ${normativeCount} normativos).${fileName}`;
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const query = elements.searchInput.value.trim();

    if (!state.records.length) {
      showStatus("warning", "Base ainda não disponível", [
        "Aguarde o carregamento automático da base publicada e tente novamente.",
        `Se o problema continuar, confirme se o arquivo existe em ${DEFAULT_DATABASE_URL}.`
      ]);
      return;
    }

    if (!query) {
      showStatus("warning", "Digite um termo de pesquisa", ["Você pode pesquisar por número, nome, data, descrição ou conteúdo do link."]);
      elements.searchInput.focus();
      return;
    }

    state.lastQuery = query;
    state.visibleCount = PAGE_SIZE;
    state.results = core.searchRecords(query, state.records);
    elements.originFilter.value = "Todos";
    renderResults();
    elements.resultsSection.hidden = false;
    elements.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function getFilteredResults() {
    const filter = elements.originFilter.value;
    if (filter === "Todos") return state.results;
    return state.results.filter((result) => result.origem === filter);
  }

  function renderResults() {
    const filteredResults = getFilteredResults();
    const visibleResults = filteredResults.slice(0, state.visibleCount);
    elements.resultsList.textContent = "";

    if (!filteredResults.length) {
      elements.resultsCount.textContent = "Nenhum resultado encontrado.";
      const empty = document.createElement("div");
      empty.className = "empty-results";
      empty.textContent = "Nenhum registro corresponde à pesquisa e ao filtro selecionados. Tente pesquisar por outro número, palavra-chave ou termo sem abreviações.";
      elements.resultsList.appendChild(empty);
      elements.loadMoreWrapper.hidden = true;
      return;
    }

    elements.resultsCount.textContent = `${filteredResults.length} resultado(s) encontrado(s), ordenado(s) por relevância.`;

    for (const result of visibleResults) {
      elements.resultsList.appendChild(createResultCard(result));
    }

    elements.loadMoreWrapper.hidden = visibleResults.length >= filteredResults.length;
  }

  function createResultCard(result) {
    const card = document.createElement("article");
    card.className = "result-card";

    const title = document.createElement("h3");
    title.innerHTML = core.highlightText(result.nomeNumero || "Registro sem nome", state.lastQuery);
    card.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "result-meta";
    meta.appendChild(createBadge(`Origem: ${result.origem}`));
    meta.appendChild(createBadge(`Data: ${result.data || "não informada"}`));
    meta.appendChild(createBadge(`Correspondência: ${result.tipoCorrespondencia}`, result.tipoCorrespondencia));
    if (result.camposCorrespondentes && result.camposCorrespondentes.length) {
      meta.appendChild(createBadge(`Campo(s): ${Array.from(new Set(result.camposCorrespondentes)).join(", ")}`));
    }
    card.appendChild(meta);

    const description = document.createElement("p");
    description.className = "result-description";
    description.innerHTML = core.highlightText(result.descricao || "Sem descrição.", state.lastQuery);
    card.appendChild(description);

    const linkWrapper = document.createElement("p");
    linkWrapper.className = "result-link";
    const safeUrl = core.validateUrl(result.link);
    if (safeUrl.valid) {
      const label = document.createElement("span");
      label.textContent = "Documento: ";
      const link = document.createElement("a");
      link.href = safeUrl.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.innerHTML = core.highlightText(result.link, state.lastQuery);
      linkWrapper.appendChild(label);
      linkWrapper.appendChild(link);
    } else {
      const invalid = document.createElement("span");
      invalid.className = "invalid-link";
      invalid.textContent = `Link inválido ou ausente: ${result.link || "não informado"}`;
      linkWrapper.appendChild(invalid);
    }
    card.appendChild(linkWrapper);

    return card;
  }

  function createBadge(text, kind) {
    const badge = document.createElement("span");
    badge.className = "badge";
    if (kind) badge.classList.add(core.normalizeText(kind));
    badge.textContent = text;
    return badge;
  }

  function showStatus(kind, title, messages) {
    elements.statusBox.hidden = false;
    elements.statusBox.className = `status-box ${kind}`;
    elements.statusBox.textContent = "";

    const strong = document.createElement("strong");
    strong.textContent = title;
    elements.statusBox.appendChild(strong);

    const list = document.createElement("ul");
    for (const message of messages) {
      const item = document.createElement("li");
      item.textContent = message;
      list.appendChild(item);
    }
    elements.statusBox.appendChild(list);
  }
})();
