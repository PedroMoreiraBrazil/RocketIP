# Privacidade e segurança

## Onde a planilha fica armazenada

Nesta versão, a planilha é lida no navegador do usuário. O aplicativo transforma a planilha em registros de pesquisa e salva esses registros no armazenamento local do navegador para evitar que seja necessário carregar a planilha a cada nova abertura.

O arquivo original `.xlsx` não é modificado.

## O que não acontece

O aplicativo não envia a planilha para um servidor próprio do RocketIP.

## Atenção sobre CDN

A biblioteca SheetJS é carregada por CDN para permitir a leitura de arquivos `.xlsx`. Isso significa que o navegador acessa um arquivo JavaScript externo. O conteúdo da planilha não é enviado a esse CDN pelo código do aplicativo.

Para uma versão com maior controle, baixe `xlsx.full.min.js` de uma fonte confiável, coloque o arquivo em uma pasta local chamada `vendor/` e altere o `index.html` para carregar a cópia local.

## Medidas implementadas

1. Aceita apenas arquivos com extensão `.xlsx`.
2. Define limite de tamanho para o arquivo.
3. Valida abas obrigatórias.
4. Valida colunas obrigatórias.
5. Ignora linhas totalmente vazias.
6. Converte datas seriais do Excel para formato legível.
7. Trata dados da planilha como texto.
8. Não executa fórmulas, scripts ou HTML vindos da planilha.
9. Só abre links externos com `http://` ou `https://`.
10. Abre links em nova aba com `noopener noreferrer`.
11. Inclui política básica de segurança de conteúdo no `index.html`.

## Limitação importante

O texto “Confidential and proprietary information...” não impede acesso, cópia ou distribuição do conteúdo. Para isso, seriam necessários controles técnicos e jurídicos adicionais.
