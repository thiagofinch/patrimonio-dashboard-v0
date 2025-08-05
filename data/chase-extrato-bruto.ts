// Colocamos o texto bruto em um arquivo separado para manter a organização.
export const extratoChaseBruto = `
Mês Data Conta do Bucket Saída/Entrada Descrição Valor Saldo Descrição Complementar
Maio 27/05/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 05/26 -42,46 14.470,44 Aplicativo Pessoal de Celular Apple
Maio 27/05/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 05/24 -45,24 14.512,90 Aplicativo Pessoal de Celular Apple
Maio 27/05/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 05/23 -9,99 14.558,14 Aplicativo Pessoal de Celular Apple
Maio 19/05/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 05/17 -44,34 14.568,13 Aplicativo Pessoal de Celular Apple
Maio 19/05/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 05/17 -20,07 14.612,47 Aplicativo Pessoal de Celular Apple
Maio 07/05/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 05/07 -27,29 14.632,54 Aplicativo Pessoal de Celular Apple
Maio 06/05/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 05/06 -44,64 14.659,83 Aplicativo Pessoal de Celular Apple
Maio 06/05/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 05/06 -9,99 14.704,47 Aplicativo Pessoal de Celular Apple
Maio 05/05/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 627156 05/05 -27,60 14.714,46 Aplicativo Pessoal de Celular Apple
Maio 05/05/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 05/04 -35,03 14.742,06 Aplicativo Pessoal de Celular Apple
Maio 05/05/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 946173 05/03 -9,99 14.777,09 Aplicativo Pessoal de Celular Apple
Maio 02/05/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 818922 05/02 -2,99 14.787,08 Aplicativo Pessoal de Celular Apple
Abril 30/04/2025 Chase Física Saída FEDERAL INTEREST WITHHELD -0,02 14.790,07 Retenção de impostos federais sobre rendimentos de juros.
Abril 30/04/2025 Chase Física Entrada INTEREST PAYMENT 0,12 14.790,09 Refere-se a um pagamento de juros que você recebeu.
Abril 30/04/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 04/30 -45,66 14.789,97 Aplicativo Pessoal de Celular Apple
Abril 28/04/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 04/25 -38,22 14.835,63 Aplicativo Pessoal de Celular Apple
Abril 25/04/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 779569 04/25 -26,52 14.873,85 Aplicativo Pessoal de Celular Apple
Abril 24/04/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 04/23 -9,99 14.900,37 Aplicativo Pessoal de Celular Apple
Abril 16/04/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 04/16 -12,72 14.910,36 Aplicativo Pessoal de Celular Apple
Abril 16/04/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 04/16 -5,99 14.923,08 Aplicativo Pessoal de Celular Apple
Abril 10/04/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 04/10 -14,33 14.929,07 Aplicativo Pessoal de Celular Apple
Abril 09/04/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 04/09 -6,36 14.943,40 Aplicativo Pessoal de Celular Apple
Abril 07/04/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 628984 04/07 -21,24 14.949,76 Aplicativo Pessoal de Celular Apple
Abril 07/04/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 798927 04/05 -9,99 14.971,00 Aplicativo Pessoal de Celular Apple
Abril 04/04/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 04/04 -9,99 14.980,99 Aplicativo Pessoal de Celular Apple
Abril 03/04/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 895296 04/03 -9,99 14.990,98 Aplicativo Pessoal de Celular Apple
Abril 03/04/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 04/03 -21,24 15.000,97 Aplicativo Pessoal de Celular Apple
Abril 02/04/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 535022 04/02 -2,99 15.022,21 Aplicativo Pessoal de Celular Apple
Março 31/03/2025 Chase Física Saída FEDERAL INTEREST WITHHELD -0,03 15.025,20 Refere-se a um pagamento de juros que você recebeu.
Março 31/03/2025 Chase Física Entrada INTEREST PAYMENT 0,13 15.025,23 Retenção de impostos federais sobre rendimentos de juros.
Março 31/03/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 03/31 -53,09 15.025,10 Aplicativo Pessoal de Celular Apple
Março 26/03/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 03/26 -53,10 15.078,19 Aplicativo Pessoal de Celular Apple
Março 26/03/2025 Chase Física Entrada APPLE.COM/BILL 866-712-7753 CA 03/26 21,24 15.131,29 Aplicativo Pessoal de Celular Apple
Março 24/03/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 693741 03/23 -9,99 15.110,05 Aplicativo Pessoal de Celular Apple
Março 24/03/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 03/23 -19,09 15.120,04 Aplicativo Pessoal de Celular Apple
Março 24/03/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 03/21 -5,30 15.139,13 Aplicativo Pessoal de Celular Apple
Março 17/03/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 03/16 -27,59 15.144,43 Aplicativo Pessoal de Celular Apple
Março 10/03/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 693782 03/10 -6,36 15.172,02 Aplicativo Pessoal de Celular Apple
Março 10/03/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 706064 03/09 -12,99 15.178,38 Aplicativo Pessoal de Celular Apple
Março 10/03/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 721612 03/08 -21,24 15.191,37 Aplicativo Pessoal de Celular Apple
Março 10/03/2025 Chase Física Entrada APPLE.COM/BILL 866-712-7753 CA 03/07 5,69 15.212,61 Aplicativo Pessoal de Celular Apple
Março 06/03/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 665413 03/06 -21,24 15.206,92 Aplicativo Pessoal de Celular Apple
Março 06/03/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 729019 03/06 -5,30 15.228,16 Aplicativo Pessoal de Celular Apple
Março 06/03/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 727431 03/06 -41,40 15.233,46 Aplicativo Pessoal de Celular Apple
Março 05/03/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 647488 03/05 -10,61 15.274,86 Aplicativo Pessoal de Celular Apple
Março 05/03/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 617507 03/05 -9,99 15.285,47 Aplicativo Pessoal de Celular Apple
Março 04/03/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 555780 03/04 -18,10 15.295,46 Aplicativo Pessoal de Celular Apple
Março 03/03/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 666098 03/02 -10,60 15.313,56 Aplicativo Pessoal de Celular Apple
Março 03/03/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 513362 03/02 -23,08 15.324,16 Aplicativo Pessoal de Celular Apple
Março 03/03/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 943136 03/01 -21,24 15.347,24 Aplicativo Pessoal de Celular Apple
Fevereiro 28/02/2025 Chase Física Saída FEDERAL INTEREST WITHHELD -0,02 15.368,48 Retenção de impostos federais sobre rendimentos de juros.
Fevereiro 28/02/2025 Chase Física Entrada INTEREST PAYMENT 0,12 15.368,50 Refere-se a um pagamento de juros que você recebeu.
Fevereiro 27/02/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 02/27 -5,30 15.368,38 Aplicativo Pessoal de Celular Apple
Fevereiro 26/02/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 02/25 -18,03 15.373,68 Aplicativo Pessoal de Celular Apple
Fevereiro 24/02/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 02/22 -19,10 15.391,71 Aplicativo Pessoal de Celular Apple
Fevereiro 18/02/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 02/16 -19,09 15.410,81 Aplicativo Pessoal de Celular Apple
Fevereiro 14/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 861408 02/14 -82,86 15.429,90 Aplicativo Pessoal de Celular Apple
Fevereiro 10/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 900916 02/10 -12,73 15.512,76 Aplicativo Pessoal de Celular Apple
Fevereiro 10/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 622188 02/09 -10,60 15.525,49 Aplicativo Pessoal de Celular Apple
Fevereiro 10/02/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 02/09 -8,49 15.536,09 Aplicativo Pessoal de Celular Apple
Fevereiro 06/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 965947 02/06 -8,49 15.544,58 Aplicativo Pessoal de Celular Apple
Fevereiro 06/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 804835 02/06 -12,99 15.553,07 Aplicativo Pessoal de Celular Apple
Fevereiro 06/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 802729 02/06 -9,99 15.566,06 Aplicativo Pessoal de Celular Apple
Fevereiro 06/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 794157 02/06 -5,30 15.576,05 Aplicativo Pessoal de Celular Apple
Fevereiro 05/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 839996 02/05 -10,61 15.581,35 Aplicativo Pessoal de Celular Apple
Fevereiro 05/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 691240 02/05 -21,24 15.591,96 Aplicativo Pessoal de Celular Apple
Fevereiro 05/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 678730 02/05 -14,86 15.613,20 Aplicativo Pessoal de Celular Apple
Fevereiro 05/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 674084 02/05 -5,30 15.628,06 Aplicativo Pessoal de Celular Apple
Fevereiro 05/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 672382 02/05 -21,24 15.633,36 Aplicativo Pessoal de Celular Apple
Fevereiro 05/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 663506 02/05 -24,42 15.654,60 Aplicativo Pessoal de Celular Apple
Fevereiro 05/02/2025 Chase Física Saída APPLE.COM/BILL 866-712-7753 CA 02/04 -2,11 15.679,02 Aplicativo Pessoal de Celular Apple
Fevereiro 04/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 554806 02/04 -15,99 15.681,13 Aplicativo Pessoal de Celular Apple
Fevereiro 04/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 615379 02/04 -5,30 15.697,12 Aplicativo Pessoal de Celular Apple
Fevereiro 03/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 854033 02/03 -10,63 15.702,42 Aplicativo Pessoal de Celular Apple
Fevereiro 03/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 851292 02/03 -10,61 15.713,05 Aplicativo Pessoal de Celular Apple
Fevereiro 03/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 519265 02/01 -21,24 15.723,66 Aplicativo Pessoal de Celular Apple
Fevereiro 03/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 982933 02/01 -9,99 15.744,90 Aplicativo Pessoal de Celular Apple
Fevereiro 03/02/2025 Chase Física Saída APPLE COM BILL CUPERTINO CA 969517 02/01 -5,30 15.754,89 Aplicativo Pessoal de Celular Apple
Janeiro 31/01/2025 Chase Física Saída FEDERAL INTEREST WITHHELD -0,03 15.760,19 Retenção de impostos federais sobre rendimentos de juros.
Janeiro 31/01/2025 Chase Física Entrada INTEREST PAYMENT 0,13 15.760,22 Refere-se a um pagamento de juros que você recebeu.
Janeiro 10/01/2025 Chase Física Saída ONLINE DOMESTIC WIRE TRANSFER VIA: WELLS FARGO NA/121000248 A/C: ABA/121042882 CONCORD CA US BEN: MARIA GABRIELA CAMPBELL DANA POINT CA 92629 US REF:/BNF/121042882/TIME/05:24 IMAD: 0110MMQFMP2M003416 TRN: 3134545010ES 01/10 -2,00 15.760,09 Transferência entre Contas
Abril 30/04/2025 Chase Investimento Saída FEDERAL INTEREST WITHHELD -0,54 140.032,21 Retenção de impostos federais sobre rendimentos de juros.
Abril 30/04/2025 Chase Investimento Entrada INTEREST PAYMENT 2,27 140.032,75 Refere-se a um pagamento de juros que você recebeu.
Março 31/03/2025 Chase Investimento Saída FEDERAL INTEREST WITHHELD -0,56 140.030,48 Retenção de impostos federais sobre rendimentos de juros.
Março 31/03/2025 Chase Investimento Entrada INTEREST PAYMENT 2,34 140.031,04 Refere-se a um pagamento de juros que você recebeu.
Fevereiro 28/02/2025 Chase Investimento Saída FEDERAL INTEREST WITHHELD -0,50 140.028,70 Retenção de impostos federais sobre rendimentos de juros.
Fevereiro 28/02/2025 Chase Investimento Entrada INTEREST PAYMENT 2,12 140.029,20 Refere-se a um pagamento de juros que você recebeu.
Janeiro 31/01/2025 Chase Investimento Saída FEDERAL INTEREST WITHHELD -0,56 140.027,08 Retenção de impostos federais sobre rendimentos de juros.
Janeiro 31/01/2025 Chase Investimento Entrada INTEREST PAYMENT 2,34 140.027,64 Refere-se a um pagamento de juros que você recebeu.
Maio 05/05/2025 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 0505MMQFMP2K007843 TRN: 3116995125ES 05/05 -17.160,00 6.887,26 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Abril 07/04/2025 Chase Empresa Saída AMAZON PRIME*VK92L9V Amzn.com/bill WA 04/07 -16,45 24.047,26 Streaming de filmes e series
Abril 04/04/2025 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 0404MMQFMP2L006224 TRN: 3069335094ES 04/04 -17.160,00 24.063,71 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Abril 03/04/2025 Chase Empresa Saída SERVICE CHARGES FOR THE MONTH OF MARCH -95,00 41.223,71 TAXAS DE SERVIÇO PARA O MÊS DE MARÇO
Março 05/03/2025 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 0305MMQFMP2M007352 TRN: 3082665064ES 03/05 -17.160,00 41.318,71 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Fevereiro 05/02/2025 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 0205MMQFMP2K007282 TRN: 3086175036ES 02/05 -17.160,00 58.478,71 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Janeiro 03/01/2025 Chase Empresa Saída ONLINE DOMESTIC WIRE FEE -25,00 75.638,71 Taxa de transferencia LEANDRO REZENDE
Janeiro 03/01/2025 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 0103MMQFMP2K006032 TRN: 3091065003ES 01/03 -17.160,00 75.663,71 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Dezembro 05/12/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE FEE -25 92.823,71 Taxa de transferencia LEANDRO REZENDE
Dezembro 05/12/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 1205MMQFMP2K007661 TRN: 3137014340ES 12/05 -17.160,00 92.848,71 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Novembro 05/11/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE FEE -25 110.008,71 Taxa de transferencia LEANDRO REZENDE
Novembro 05/11/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 1105MMQFMP2N007429 TRN: 3161974310ES 11/05 -17.160,00 110.033,71 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Outubro 10/10/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE FEE -25 127.193,71 Taxa de transferencia LEANDRO REZENDE
Outubro 10/10/2024 Chase Empresa Saída Zelle payment to Angelica Leon JPM99ap5o456 -6.149,89 127.218,71 Advogada da casa de Los Angeles
Outubro 10/10/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 1010MMQFMP2L008121 TRN: 3176314284ES 10/10 -17.160,00 133.368,60 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Setembro 13/09/2024 Chase Empresa Entrada Online Transfer 21719159363 from BRAGA MANAGEMENT INC ####7403 transaction #: 21719159363 09/13 33.479,60 150.528,60 Aumento de capital sobre Aplicacao de investimento
Setembro 05/09/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE FEE -25 117.049,00 Taxa de transferencia LEANDRO REZENDE
Setembro 05/09/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 0905MMQFMP2L005796 TRN: 3055804249ES 09/05 -17.160,00 117.074,00 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Agosto 20/08/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE FEE -25 134.234,00 Taxa de transferencia LEANDRO REZENDE
Agosto 20/08/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: F121000358/121000358 A/C: DAVID A DUBINSKY LOS ANGELES CA 90069 US REF:/TIME/16:55 IMAD: 0820MMQFMP2L029068 TRN: 3592034233ES 08/20 -36.225,00 134.259,00 Referente aos serviços de buffet, decoracao, sistema de som e pessoal para trabalhar no evento do Master House LA
Agosto 20/08/2024 Chase Empresa Entrada Zelle payment from WOOD WORKERS FLORIDA LLC BACpyjhr9ckf 2.773,00 170.484,00 Entrada no evento MasterHouse LA | Joe Douglas (WOOD WORKERS FLORIDA LLC)
Agosto 19/08/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE FEE -25 167.711,00 Taxa de transferencia LEANDRO REZENDE
Agosto 19/08/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: F121000358/121000358 A/C: DAVID A DUBINSKY LOS ANGELES CA 90069 US REF:/TIME/03:41 IMAD: 0819MMQFMP2M002360 TRN: 3082454232ES 08/19 -38.000,00 167.736,00 Referente aos serviços de buffet, decoracao, sistema de som e pessoal para trabalhar no evento do Goldage
Agosto 19/08/2024 Chase Empresa Entrada Zelle payment from AMAZING DEALS MIAMI LLC 21757738014 227 205.736,00 Entrada no evento MasterHouse LA | TIAGO CASTRO
Agosto 19/08/2024 Chase Empresa Entrada Zelle payment from DAVID COSTA WFCT0SGN6T26 1.463,00 205.509,00 Entrada no evento MasterHouse LA | DAVID COSTA| ($1.463,00) R$8.000,00 pelo Zelle R$7.000,00 cartão de crédito (Ticto)
Agosto 16/08/2024 Chase Empresa Entrada Zelle payment from AMAZING DEALS MIAMI LLC 21754984816 1.000,00 204.046,00 Entrada no evento MasterHouse LA | TIAGO CASTRO
Agosto 16/08/2024 Chase Empresa Entrada Zelle payment from TIAGO CASTRO NAV0IP1JMBZT 1.500,00 203.046,00 Entrada no evento MasterHouse LA | TIAGO CASTRO | Tiago Castro: Amazing Deals: $1,000 Tiago Castro: $1,500 Amazing Deals: $227,00 Total: $2,727
Agosto 15/08/2024 Chase Empresa Entrada Online Transfer 21378283705 from BRAGA MANAGEMENT INC ####7403 transaction #: 21378283705 08/15 33.479,60 201.546,00 Aumento de capital sobre Aplicacao de investimento
Agosto 05/08/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE FEE -25 168.066,40 Taxa de transferencia LEANDRO REZENDE
Agosto 05/08/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 0805MMQFMP2N008957 TRN: 3187144218ES 08/05 -17.160,00 168.091,40 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Julho 25/07/2024 Chase Empresa Entrada BOOK TRANSFER CREDIT B/O: WISE US, INC. NEW YORK NY 10010- US REF: PACIFIC TOURS LLC -WR TRN: 3032100207JO 27.000,00 185.251,40 Joaquin Mendez GoldAge | Mentoria MArketing Digital
Julho 15/07/2024 Chase Empresa Entrada Online Transfer 21077738717 from BRAGA MANAGEMENT INC ####7403 transaction #: 21077738717 07/15 33.479,60 158.251,40 Aumento de capital sobre Aplicacao de investimento
Julho 05/07/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE FEE -25 124.771,80 Taxa de transferencia LEANDRO REZENDE
Julho 05/07/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 0705MMQFMP2M014470 TRN: 3318034187ES 07/05 -17.160,00 124.796,80 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Junho 14/06/2024 Chase Empresa Entrada Online Transfer 20770471242 from BRAGA MANAGEMENT INC ####7403 transaction #: 20770471242 06/14 33.479,60 141.956,80 Aumento de capital sobre Aplicacao de investimento
Junho 05/06/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE FEE -25 108.477,20 Taxa de transferencia LEANDRO REZENDE
Junho 05/06/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 0605MMQFMP2M007044 TRN: 3080284157ES 06/05 -17.160,00 108.502,20 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Maio 30/05/2024 Chase Empresa Saída Zelle payment to Camila Frade JPM99ahvxg0g -300 125.662,20 Atrizes produtora
Maio 22/05/2024 Chase Empresa Saída Zelle payment to Camila Frade JPM99ahg982o -300 125.962,20 Atrizes produtora
Maio 15/05/2024 Chase Empresa Entrada Online Transfer 20439962490 from BRAGA MANAGEMENT INC ####7403 transaction #: 20439962490 05/15 33.479,60 126.262,20 Aumento de capital sobre Aplicacao de investimento
Maio 03/05/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE FEE -25 92.782,60 Taxa de transferencia LEANDRO REZENDE
Maio 03/05/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 0503MMQFMP2M006319 TRN: 3169824124ES 05/03 -17.160,00 92.807,60 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Abril 15/04/2024 Chase Empresa Entrada Online Transfer 20148196116 from BRAGA MANAGEMENT INC ####7403 transaction #: 20148196116 04/15 33.479,60 109.967,60 Aumento de capital sobre Aplicacao de investimento
Abril 08/04/2024 Chase Empresa Saída Zelle payment to Angelica Leon JPM99af6p6y4 -2.100,00 76.488,00 Advogada da casa de Los Angeles
Abril 05/04/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE FEE -25 78.588,00 Taxa de transferencia LEANDRO REZENDE
Abril 05/04/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 0405MMQFMP2M007274 TRN: 3083054096ES 04/05 -17.160,00 78.613,00 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Março 15/03/2024 Chase Empresa Entrada Online Transfer 19860048330 from BRAGA MANAGEMENT INC ####7403 transaction #: 19860048330 03/15 33.479,60 95.773,00 Aumento de capital sobre Aplicacao de investimento
Março 06/03/2024 Chase Empresa Saída Zelle payment to Angelica Leon JPM99aatvuye -1.200,00 62.293,40 Advogada da casa de Los Angeles
Março 06/03/2024 Chase Empresa Entrada Online Transfer 20068137070 from BRAGA MANAGEMENT INC ####7403 transaction #: 20068137070 03/06 33.479,60 63.493,40 Aumento de capital sobre Aplicacao de investimento
Março 05/03/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE FEE -25 30.013,80 Taxa de transferencia LEANDRO REZENDE
Março 05/03/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 0305MMQFMP2L025067 TRN: 3499274065ES 03/05 -17.160,00 30.038,80 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Fevereiro 22/02/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE FEE -25 47.198,80 Taxa de transferencia LEANDRO REZENDE
Fevereiro 22/02/2024 Chase Empresa Saída ONLINE DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES INC NEW YORK NY 10010 US IMAD: 0222MMQFMP2M029532 TRN: 3515844053ES 02/22 -17.160,00 47.223,80 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Fevereiro 16/02/2024 Chase Empresa Saída Debit Return: Online Transfer 19552747555 from BRAGA MANAGEMENT INC ####7403 -33.479,60 64.383,80 Retorno da trasnferencia para Aumento de capital sobre Aplicacao de investimento
Fevereiro 15/02/2024 Chase Empresa Entrada Online Transfer 19552747555 from BRAGA MANAGEMENT INC ####7403 transaction #: 19552747555 02/15 33.479,60 97.863,40 Aumento de capital sobre Aplicacao de investimento
Janeiro 12/01/2024 Chase Empresa Entrada Online Transfer 19342127099 from BRAGA MANAGEMENT INC ####7403 transaction #: 19342127099 01/12 33.479,60 64.383,80 Aumento de capital sobre Aplicacao de investimento
Janeiro 09/01/2024 Chase Empresa Saída DOMESTIC WIRE FEE -35 30.904,20 Taxa de transferencia LEANDRO REZENDE
Janeiro 09/01/2024 Chase Empresa Saída DOMESTIC WIRE TRANSFER VIA: COMMUNITY FSB/026073150 A/C: VANHACK TECHNOLOGIES REF: INVOICE NUMBER: 2951 - NAME: LEANDRO REZENDE IMAD: 0109MMQFMP2K015077 TRN: 3255264009ES 01/09 -36.020,00 30.939,20 Leandro Rezende VANHACK TECHNOLOGIES INC NEW YORK
Janeiro 09/01/2024 Chase Empresa Entrada Online Transfer from CHK ...8399 transaction#: 19529405844 33.479,60 66.959,20 Aumento de capital sobre Aplicacao de investimento
Novembro 14/11/2023 Chase Empresa Entrada Online Transfer 18983328397 from BRAGA MANAGEMENT INC ####7403 transaction #: 18983328397 11/14 33.479,60 33.479,60 Aumento de capital sobre Aplicacao de investimento
`
