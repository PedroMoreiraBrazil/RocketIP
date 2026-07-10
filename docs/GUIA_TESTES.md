# Guia de testes do RocketIP

## Testes cobertos automaticamente

O arquivo `tests/search-tests.js` verifica:

1. Pesquisa por número exato.
2. Pesquisa por nome exato.
3. Pesquisa por parte do nome ou descrição.
4. Pesquisa com letras maiúsculas e minúsculas diferentes.
5. Pesquisa com e sem acentos.
6. Pesquisa com pequeno erro de digitação.
7. Pesquisa por palavra presente na descrição.
8. Pesquisa por data.
9. Pesquisa por conteúdo do link.
10. Nenhum resultado encontrado.
11. Planilha sem uma das abas.
12. Planilha com coluna ausente.
13. Planilha vazia.
14. Arquivo em formato incorreto.
15. Linhas com células vazias.
16. Links inválidos.
17. Grande quantidade de registros.

## Como executar

1. Abra o Terminal, Prompt de Comando ou PowerShell.
2. Acesse a pasta do projeto.
3. Execute:

```bash
node tests/search-tests.js
```

Resultado esperado:

```text
Todos os testes automatizados de lógica foram aprovados.
```

## Testes que precisam ser feitos visualmente

Os seguintes pontos dependem do navegador e devem ser conferidos manualmente:

1. Aparência da marca.
2. Layout em computador.
3. Layout em celular.
4. Navegação por teclado.
5. Clique nos links externos.
6. Mensagens visuais de sucesso, erro e ausência de resultados.
