# RocketIP

Aplicativo web estático para pesquisar legislações, normativos e documentos legais relacionados ao Direito da Propriedade Intelectual.

## 1. Recomendação da solução

A solução recomendada para a primeira versão é um site estático gratuito, acessado pelo navegador.

Comparação resumida:

| Critério | Site gratuito no navegador | Programa instalado no computador |
|---|---|---|
| Facilidade de uso | Abre pelo navegador; não exige instalação. | Exige instalação e, às vezes, permissões do Windows/macOS. |
| Custo | Pode ser publicado gratuitamente. | Pode exigir empacotamento, assinatura de aplicativo ou suporte técnico. |
| Manutenção | Atualiza os arquivos do site e todos usam a versão nova. | Cada computador precisaria receber a atualização. |
| Atualização da base | Basta carregar outro arquivo .xlsx no próprio site. | Também seria possível, mas com mais camadas de instalação. |
| Privacidade | Nesta versão, a planilha é processada no navegador do usuário. | Pode ser mais privado se usado totalmente offline. |
| Internet | Precisa de internet para abrir o site publicado e carregar a biblioteca de Excel via CDN. Depois de aberto, a busca ocorre localmente. | Pode funcionar sem internet se for construído para isso. |

Conclusão: para uma primeira versão simples, gratuita e fácil de manter, o site estático é a melhor opção. Um programa instalado só faria sentido se o uso precisasse ser totalmente offline, com controle rígido de acesso local.

## 2. Arquitetura escolhida

Arquitetura: aplicação web estática.

Em linguagem simples:

- `index.html` monta a página.
- `css/styles.css` cuida da aparência.
- `js/search-core.js` contém a lógica de validação da planilha e da pesquisa.
- `js/app.js` liga a tela à lógica.
- `assets/Marca.png` contém a marca exibida na página inicial.
- A biblioteca SheetJS é carregada pelo navegador para ler arquivos `.xlsx`.
- A planilha é lida no navegador do usuário e não é enviada a um servidor do RocketIP.

Atenção: o aviso de confidencialidade exibido na página é apenas um aviso visual. Ele não substitui controle técnico de acesso, contrato, senha, criptografia, política interna ou medida jurídica.

## 3. Estrutura de arquivos

```text
rocketip_app/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── search-core.js
│   └── app.js
├── assets/
│   └── Marca.png
├── exemplos/
│   └── modelo_base_rocketip.xlsx
├── tests/
│   └── search-tests.js
└── docs/
    ├── GUIA_TESTES.md
    └── PRIVACIDADE_E_SEGURANCA.md
```

## 4. Código completo de cada arquivo

O código completo está nos próprios arquivos do projeto:

- `index.html`
- `css/styles.css`
- `js/search-core.js`
- `js/app.js`
- `tests/search-tests.js`

Abra esses arquivos com o Bloco de Notas, Visual Studio Code ou outro editor de texto para visualizar o conteúdo.

## 5. Procedimento de testes

### Teste manual principal

1. Abra o arquivo `index.html` no navegador.
2. Clique em “Carregar ou substituir arquivo Excel”.
3. Escolha uma planilha `.xlsx` com as abas `Legislações` e `Normativos`.
4. Verifique se aparece a mensagem de sucesso.
5. Pesquise por:
   1. um número exato, por exemplo `9.279/1996`;
   2. um nome exato, por exemplo `Lei nº 9.279/1996`;
   3. parte de um nome, por exemplo `modelo de utilidade`;
   4. texto com letras maiúsculas, por exemplo `PROPRIEDADE INDUSTRIAL`;
   5. texto sem acento, por exemplo `indicacoes geograficas`;
   6. termo com pequeno erro de digitação;
   7. palavra da descrição;
   8. uma data;
   9. parte de um link;
   10. um termo inexistente.
6. Use o filtro “Legislações” e “Normativos”.
7. Clique em um link de documento.
8. Teste em tela menor, reduzindo a largura do navegador ou abrindo no celular.

### Teste automatizado de lógica

Este teste não publica o site nem testa o navegador visualmente. Ele testa a lógica de pesquisa, validação de abas, colunas, links e ordenação.

1. Instale o Node.js se ainda não tiver.
2. Abra a pasta do projeto no Terminal, Prompt de Comando ou PowerShell.
3. Execute:

```bash
node tests/search-tests.js
```

Resultado esperado:

```text
Todos os testes automatizados de lógica foram aprovados.
```

## 6. Guia de execução local

Opção mais simples:

1. Extraia o arquivo `.zip` do projeto.
2. Entre na pasta `rocketip_app`.
3. Dê dois cliques em `index.html`.
4. O navegador abrirá o aplicativo.
5. Carregue sua planilha `.xlsx`.

Opção recomendada para simular melhor um site real:

1. Instale o Node.js.
2. Abra o Terminal, Prompt de Comando ou PowerShell.
3. Acesse a pasta do projeto. Exemplo:

```bash
cd C:\Users\SeuNome\Desktop\rocketip_app
```

4. Execute:

```bash
npx http-server .
```

5. O terminal mostrará um endereço parecido com:

```text
http://127.0.0.1:8080
```

6. Abra esse endereço no navegador.

## 7. Guia de publicação gratuita

### Opção principal: GitHub Pages

Atenção: se você publicar os arquivos em um repositório público, os arquivos do site ficarão públicos. Não coloque sua planilha confidencial dentro da pasta publicada. Use apenas o carregamento manual pelo navegador.

Passo a passo:

1. Crie uma conta no GitHub.
2. Clique em `+` no canto superior direito.
3. Clique em `New repository`.
4. Nome sugerido: `rocketip`.
5. Escolha `Public` se quiser usar a opção gratuita mais simples.
6. Clique em `Create repository`.
7. Clique em `uploading an existing file`.
8. Arraste para a página os arquivos e pastas do projeto, exceto qualquer planilha confidencial.
9. Clique em `Commit changes`.
10. Entre em `Settings`.
11. No menu lateral, clique em `Pages`.
12. Em `Build and deployment`, escolha:
    - `Source`: `Deploy from a branch`;
    - `Branch`: `main`;
    - pasta: `/root`.
13. Clique em `Save`.
14. Aguarde alguns minutos.
15. A página `Pages` mostrará o link publicado.

### Alternativa: Netlify

O Netlify também permite publicar sites estáticos em plano gratuito. Use apenas se preferir uma interface de arrastar e soltar.

Passo a passo geral:

1. Crie uma conta no Netlify.
2. Procure a opção de adicionar ou publicar um novo site.
3. Escolha a opção de upload manual ou arraste a pasta do projeto.
4. Não inclua planilhas confidenciais no upload.
5. O Netlify criará um link público.

## 8. Guia de atualização da planilha

Para substituir a base:

1. Abra o RocketIP.
2. Clique em “Carregar ou substituir arquivo Excel”.
3. Selecione a nova planilha `.xlsx`.
4. Aguarde a mensagem de sucesso.
5. Faça uma pesquisa de teste.

A planilha precisa conter:

- aba `Legislações`;
- aba `Normativos`;
- colunas:
  - `Nome e Número`;
  - `Data`;
  - `Breve Descrição`;
  - `Link para o Documento`.

O arquivo original não é modificado pelo aplicativo.

## 9. Guia para inserir ou trocar a marca

1. Prepare a imagem da marca em formato `.png`.
2. Renomeie a imagem para `Marca.png`.
3. Substitua o arquivo existente em:

```text
assets/Marca.png
```

4. Reabra o site.

Se a imagem não for encontrada, o site mostrará o texto `[INSERIR MARCA AQUI]`.

## 10. Guia para alterar o texto de proteção autoral

1. Abra o arquivo `index.html`.
2. Procure este trecho:

```text
Confidential and proprietary information. Unauthorized distribution is prohibited. © 2026 Pedro Moreira.
```

3. Substitua pelo texto desejado.
4. Salve o arquivo.
5. Reabra o site ou atualize a página.

## 11. Solução de problemas

### O site abriu, mas a planilha não carrega

Possíveis causas:

1. O arquivo não está em `.xlsx`.
2. A internet está bloqueando o carregamento da biblioteca SheetJS.
3. A planilha está corrompida.
4. O arquivo é maior que o limite definido.

Solução:

1. Salve novamente a planilha como `.xlsx`.
2. Teste em outro navegador.
3. Teste com o arquivo `exemplos/modelo_base_rocketip.xlsx`.

### Aparece erro de aba ausente

Confira se as abas se chamam exatamente:

```text
Legislações
Normativos
```

### Aparece erro de coluna ausente

Confira se a primeira linha de cada aba contém exatamente:

```text
Nome e Número
Data
Breve Descrição
Link para o Documento
```

### O link não abre

Confira se o link começa com:

```text
https://
```

ou

```text
http://
```

Links com `javascript:`, caminhos locais ou texto incompleto são bloqueados ou tratados como inválidos.

### A busca traz poucos resultados

Tente:

1. pesquisar por uma palavra menor;
2. remover abreviações;
3. pesquisar por número;
4. pesquisar sem acentos;
5. verificar se o termo está realmente em uma das quatro colunas.

### A busca traz resultados aproximados demais

No arquivo `js/search-core.js`, localize:

```javascript
const APPROXIMATE_THRESHOLD = 0.78;
```

Aumente para `0.82` ou `0.85` para tornar a busca aproximada mais rigorosa.

## 12. Como pedir futuras alterações ao ChatGPT

Use pedidos objetivos, por exemplo:

```text
No projeto RocketIP, altere a busca para incluir uma nova aba chamada Jurisprudência, com as mesmas quatro colunas.
```

ou:

```text
No projeto RocketIP, adicione um botão para exportar os resultados da busca para CSV.
```

Sempre envie os arquivos atuais do projeto quando pedir alteração.

## 13. Checklist final

- [ ] O site abre no navegador.
- [ ] A marca aparece na página inicial.
- [ ] O arquivo `.xlsx` é carregado.
- [ ] As abas `Legislações` e `Normativos` são lidas.
- [ ] As quatro colunas obrigatórias são reconhecidas.
- [ ] Linhas totalmente vazias são ignoradas.
- [ ] Datas do Excel aparecem em formato legível.
- [ ] Links válidos são clicáveis.
- [ ] Links inválidos são informados.
- [ ] A busca encontra número exato.
- [ ] A busca encontra nome exato.
- [ ] A busca encontra correspondência parcial.
- [ ] A busca ignora diferença entre maiúsculas e minúsculas.
- [ ] A busca ignora acentos.
- [ ] A busca tolera pequenos erros de digitação.
- [ ] Os resultados indicam a origem: `Legislações` ou `Normativos`.
- [ ] Os resultados indicam o tipo de correspondência.
- [ ] O filtro por origem funciona.
- [ ] O botão “Voltar à página inicial” funciona.
- [ ] A interface funciona em computador e celular.
- [ ] A planilha confidencial não foi publicada junto com o site.
