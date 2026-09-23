/**
 * Os 36 exercícios autorados, nas quatro línguas. NÃO é gerado — não corras
 * `scripts/port-content.mjs` por cima deste ficheiro.
 *
 * O cabeçalho dizia que era gerado por esse script a partir da app anterior, e deixou
 * de ser verdade a 2026-09-21: a app é nova e a pasta anterior não é fonte de nada.
 *
 * **Passo F, 2026-09-22.** Ele mudou a app para espanhol e o nome dos exercícios ficou
 * em português. Este ficheiro era metade do bug — tinha `nPT`/`nEN` e duas línguas em
 * cada bloco de técnica, e dois campos não seguram quatro línguas. Passou a `n` e a
 * `{pt,en,es,fr}` em tudo o que é palavra: nome, equipamento, passos, erros, segurança
 * e respiração. 479 frases por língua.
 *
 * O QUE NÃO MUDOU, E NÃO PODE MUDAR: as séries, reps, RPE, cargas e descansos não
 * vivem aqui — vivem em `days.ts` — e nem uma palavra portuguesa ou inglesa foi
 * reescrita. O espanhol e o francês são novos; o resto está byte a byte.
 *
 * O ESPANHOL E O FRANCÊS SÃO TRADUÇÃO, E ELE NÃO OS CONSEGUE CONFERIR COMO CONFERE O
 * PORTUGUÊS. Nos passos e nos erros isto tem consequência física — "sem travar os
 * joelhos" mal traduzido é uma lesão. Os `errs`, os `safe` e os `breath` ficam
 * nomeados como candidatos a revisão humana em
 * `.claude/skills/executar-substitui-o-cartao/PLANO.md`, Passo F.
 */

import type { Exercise } from './schema';

export const EXERCISES: Readonly<Record<string, Exercise>> = {
  "legpress": {
    "n": {
      "pt": "Leg Press 45°",
      "en": "Leg Press",
      "es": "Prensa de piernas 45°",
      "fr": "Presse à cuisses 45°"
    },
    "eq": {
      "pt": "Leg Press 45°",
      "en": "45° Leg Press",
      "es": "Prensa de piernas 45°",
      "fr": "Presse à cuisses 45°"
    },
    "anim": "legpress",
    "pri": [
      "quads",
      "glutes"
    ],
    "sec": [
      "hamstrings",
      "calves"
    ],
    "steps": {
      "pt": [
        "Senta com costas e bacia totalmente apoiadas no encosto.",
        "Pés à largura dos ombros, a meia altura da plataforma.",
        "Destrava as travas e controla a descida.",
        "Desce até ~90° de joelho, sem tirar a lombar do encosto.",
        "Empurra pela planta do pé até quase estender, sem travar os joelhos."
      ],
      "en": [
        "Sit with your back and hips fully against the pad.",
        "Feet shoulder-width, mid-height on the platform.",
        "Release the safety catches and control the descent.",
        "Lower to about 90° of knee bend without letting your lower back lift.",
        "Push through the whole foot to near lockout, without snapping the knees."
      ],
      "es": [
        "Siéntate con la espalda y la cadera totalmente apoyadas en el respaldo.",
        "Pies a la anchura de los hombros, a media altura de la plataforma.",
        "Quita los seguros y controla la bajada.",
        "Baja hasta unos 90° de rodilla, sin despegar la lumbar del respaldo.",
        "Empuja con toda la planta del pie casi hasta estirar, sin bloquear las rodillas."
      ],
      "fr": [
        "Assieds-toi, dos et bassin bien plaqués contre le dossier.",
        "Pieds à la largeur des épaules, à mi-hauteur du plateau.",
        "Déverrouille les sécurités et contrôle la descente.",
        "Descends jusqu’à environ 90° de genou, sans décoller le bas du dos du dossier.",
        "Pousse avec toute la plante du pied presque jusqu’à l’extension, sans verrouiller les genoux."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Lombar sai do encosto no fundo (coluna arredonda).",
          "c": "Reduz a amplitude: desce só até onde a bacia se mantém apoiada."
        },
        {
          "e": "Travar/estalar os joelhos no topo.",
          "c": "Pára a ~5° da extensão total, tensão contínua."
        },
        {
          "e": "Joelhos colapsam para dentro.",
          "c": "Empurra os joelhos para fora, alinhados com os pés."
        }
      ],
      "en": [
        {
          "e": "Lower back lifts off the pad at the bottom (spine rounds).",
          "c": "Cut the range: only go as deep as your hips stay supported."
        },
        {
          "e": "Locking/snapping the knees at the top.",
          "c": "Stop about 5° short of full extension, keep tension."
        },
        {
          "e": "Knees caving inward.",
          "c": "Push the knees out, in line with your feet."
        }
      ],
      "es": [
        {
          "e": "La lumbar se despega del respaldo abajo (la columna se redondea).",
          "c": "Reduce el recorrido: baja solo hasta donde la cadera siga apoyada."
        },
        {
          "e": "Bloquear o chasquear las rodillas arriba.",
          "c": "Párate a unos 5° de la extensión total, tensión continua."
        },
        {
          "e": "Las rodillas se van hacia dentro.",
          "c": "Empuja las rodillas hacia fuera, alineadas con los pies."
        }
      ],
      "fr": [
        {
          "e": "Le bas du dos décolle en bas (la colonne s’arrondit).",
          "c": "Réduis l’amplitude : ne descends que tant que le bassin reste plaqué."
        },
        {
          "e": "Verrouiller ou claquer les genoux en haut.",
          "c": "Arrête-toi à environ 5° de l’extension complète, tension continue."
        },
        {
          "e": "Les genoux rentrent vers l’intérieur.",
          "c": "Pousse les genoux vers l’extérieur, alignés avec les pieds."
        }
      ]
    },
    "safe": {
      "pt": [
        "Mantém a lombar colada ao encosto — chave para as tuas costas.",
        "Usa sempre as travas de segurança."
      ],
      "en": [
        "Keep the lower back glued to the pad — key for your back.",
        "Always use the safety catches."
      ],
      "es": [
        "Mantén la lumbar pegada al respaldo: es la clave para tu espalda.",
        "Usa siempre los seguros."
      ],
      "fr": [
        "Garde le bas du dos collé au dossier — c’est la clé pour ton dos.",
        "Utilise toujours les sécurités."
      ]
    },
    "breath": {
      "pt": "Inspira ao descer, expira ao empurrar.",
      "en": "Breathe in as you lower, out as you press.",
      "es": "Inspira al bajar, espira al empujar.",
      "fr": "Inspire en descendant, expire en poussant."
    }
  },
  "hack": {
    "n": {
      "pt": "Agachamento Hack",
      "en": "Hack Squat",
      "es": "Sentadilla hack",
      "fr": "Squat hack"
    },
    "eq": {
      "pt": "Máquina Hack",
      "en": "Hack machine",
      "es": "Máquina hack",
      "fr": "Machine hack"
    },
    "anim": "squat",
    "pri": [
      "quads"
    ],
    "sec": [
      "glutes"
    ],
    "steps": {
      "pt": [
        "Ombros sob as almofadas, costas apoiadas no encosto.",
        "Pés à largura dos ombros, a meio da plataforma.",
        "Destrava e desce controlando até ~90°.",
        "Mantém a coluna neutra colada ao encosto.",
        "Empurra pelos calcanhares até quase estender."
      ],
      "en": [
        "Shoulders under the pads, back flat against the backrest.",
        "Feet shoulder-width, mid-platform.",
        "Unrack and lower under control to about 90°.",
        "Keep a neutral spine pressed into the pad.",
        "Drive through the heels to near lockout."
      ],
      "es": [
        "Hombros bajo las almohadillas, espalda apoyada en el respaldo.",
        "Pies a la anchura de los hombros, en el centro de la plataforma.",
        "Quita el seguro y baja controlando hasta unos 90°.",
        "Mantén la columna neutra pegada al respaldo.",
        "Empuja con los talones casi hasta estirar."
      ],
      "fr": [
        "Épaules sous les coussinets, dos plaqué contre le dossier.",
        "Pieds à la largeur des épaules, au milieu du plateau.",
        "Déverrouille et descends en contrôlant jusqu’à environ 90°.",
        "Garde la colonne neutre, collée au dossier.",
        "Pousse sur les talons presque jusqu’à l’extension."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Levantar os calcanhares na descida.",
          "c": "Distribui o peso no pé todo; ajusta os pés mais à frente."
        },
        {
          "e": "Descer rápido sem controlo.",
          "c": "2 segundos na descida, controla sempre."
        },
        {
          "e": "Descolar a lombar do encosto.",
          "c": "Não desças além do que mantém as costas apoiadas."
        }
      ],
      "en": [
        {
          "e": "Heels lifting on the way down.",
          "c": "Spread the weight over the whole foot; move your feet further forward."
        },
        {
          "e": "Dropping fast with no control.",
          "c": "Two seconds down, always controlled."
        },
        {
          "e": "Lower back peeling off the pad.",
          "c": "Do not go deeper than your back stays supported."
        }
      ],
      "es": [
        {
          "e": "Levantar los talones al bajar.",
          "c": "Reparte el peso por todo el pie; adelanta un poco los pies."
        },
        {
          "e": "Bajar rápido y sin control.",
          "c": "2 segundos de bajada, siempre controlada."
        },
        {
          "e": "Despegar la lumbar del respaldo.",
          "c": "No bajes más de lo que permita mantener la espalda apoyada."
        }
      ],
      "fr": [
        {
          "e": "Décoller les talons à la descente.",
          "c": "Répartis le poids sur tout le pied ; avance un peu les pieds."
        },
        {
          "e": "Descendre vite, sans contrôle.",
          "c": "2 secondes à la descente, toujours contrôlée."
        },
        {
          "e": "Décoller le bas du dos du dossier.",
          "c": "Ne descends pas plus bas que ce qui garde le dos plaqué."
        }
      ]
    },
    "safe": {
      "pt": [
        "Encosto protege a coluna — mantém o contacto total.",
        "Começa leve para dominar a trajetória."
      ],
      "en": [
        "The backrest protects your spine — keep full contact.",
        "Start light until the groove feels natural."
      ],
      "es": [
        "El respaldo protege la columna: mantén el contacto completo.",
        "Empieza ligero para dominar la trayectoria."
      ],
      "fr": [
        "Le dossier protège la colonne — garde le contact complet.",
        "Commence léger pour maîtriser la trajectoire."
      ]
    },
    "breath": {
      "pt": "Inspira ao descer, expira ao subir.",
      "en": "Breathe in on the way down, out on the way up.",
      "es": "Inspira al bajar, espira al subir.",
      "fr": "Inspire en descendant, expire en montant."
    }
  },
  "legext": {
    "n": {
      "pt": "Cadeira Extensora",
      "en": "Leg Extension",
      "es": "Extensión de piernas",
      "fr": "Extension des jambes"
    },
    "eq": {
      "pt": "Máquina Extensora",
      "en": "Leg extension machine",
      "es": "Máquina de extensión",
      "fr": "Machine à extension"
    },
    "anim": "legext",
    "pri": [
      "quads"
    ],
    "sec": [],
    "steps": {
      "pt": [
        "Ajusta o encosto: joelho alinhado ao eixo da máquina.",
        "Almofada na parte baixa da canela, acima do pé.",
        "Segura os apoios laterais.",
        "Estende as pernas controlado até quase à extensão.",
        "Segura 1s no topo e desce devagar."
      ],
      "en": [
        "Set the backrest so your knee lines up with the machine pivot.",
        "Pad low on the shin, just above the foot.",
        "Hold the side handles.",
        "Extend the legs under control to near full extension.",
        "Hold for 1s at the top and lower slowly."
      ],
      "es": [
        "Ajusta el respaldo: la rodilla alineada con el eje de la máquina.",
        "La almohadilla en la parte baja de la espinilla, por encima del pie.",
        "Agárrate a los apoyos laterales.",
        "Estira las piernas de forma controlada casi hasta la extensión.",
        "Aguanta 1 s arriba y baja despacio."
      ],
      "fr": [
        "Règle le dossier : le genou aligné avec l’axe de la machine.",
        "Le coussinet en bas du tibia, au-dessus du pied.",
        "Tiens les poignées latérales.",
        "Tends les jambes en contrôlant, presque jusqu’à l’extension.",
        "Tiens 1 s en haut et descends lentement."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Balançar o corpo para gerar impulso.",
          "c": "Fixa a bacia no banco; só o joelho se move."
        },
        {
          "e": "Descer a carga em queda livre.",
          "c": "Controla a fase negativa (2s)."
        }
      ],
      "en": [
        {
          "e": "Swinging the body to create momentum.",
          "c": "Pin your hips to the seat; only the knee moves."
        },
        {
          "e": "Letting the weight drop freely.",
          "c": "Control the negative (2s)."
        }
      ],
      "es": [
        {
          "e": "Balancear el cuerpo para coger impulso.",
          "c": "Fija la cadera en el asiento; solo se mueve la rodilla."
        },
        {
          "e": "Dejar caer la carga.",
          "c": "Controla la fase negativa (2 s)."
        }
      ],
      "fr": [
        {
          "e": "Balancer le corps pour prendre de l’élan.",
          "c": "Fixe le bassin sur le siège ; seul le genou bouge."
        },
        {
          "e": "Laisser la charge retomber.",
          "c": "Contrôle la phase négative (2 s)."
        }
      ]
    },
    "safe": {
      "pt": [
        "Negativa lenta protege o joelho.",
        "Sem impulso — isola o quadríceps."
      ],
      "en": [
        "A slow negative protects the knee.",
        "No momentum — isolate the quads."
      ],
      "es": [
        "Una negativa lenta protege la rodilla.",
        "Sin impulso: aísla el cuádriceps."
      ],
      "fr": [
        "Une négative lente protège le genou.",
        "Sans élan — isole le quadriceps."
      ]
    },
    "breath": {
      "pt": "Expira ao estender, inspira ao descer.",
      "en": "Breathe out as you extend, in as you lower.",
      "es": "Espira al estirar, inspira al bajar.",
      "fr": "Expire en tendant, inspire en descendant."
    }
  },
  "lunge": {
    "n": {
      "pt": "Afundo com Halteres",
      "en": "Dumbbell Lunge",
      "es": "Zancada con mancuernas",
      "fr": "Fente avec haltères"
    },
    "eq": {
      "pt": "Halteres",
      "en": "Dumbbells",
      "es": "Mancuernas",
      "fr": "Haltères"
    },
    "anim": "squat",
    "pri": [
      "quads",
      "glutes"
    ],
    "sec": [
      "hamstrings"
    ],
    "steps": {
      "pt": [
        "Em pé, um haltere em cada mão ao lado do corpo.",
        "Dá um passo à frente e desce a bacia na vertical.",
        "Joelho de trás quase a tocar o chão, tronco erguido.",
        "O joelho da frente alinha com o pé, sem passar muito.",
        "Empurra pelo calcanhar da frente para voltar."
      ],
      "en": [
        "Stand with a dumbbell in each hand at your sides.",
        "Step forward and drop your hips straight down.",
        "Back knee almost touching the floor, chest tall.",
        "Front knee tracks over the foot, without drifting far past it.",
        "Push through the front heel to come back."
      ],
      "es": [
        "De pie, una mancuerna en cada mano al lado del cuerpo.",
        "Da un paso adelante y baja la cadera en vertical.",
        "La rodilla de atrás casi toca el suelo, el tronco erguido.",
        "La rodilla de delante se alinea con el pie, sin adelantarse mucho.",
        "Empuja con el talón de delante para volver."
      ],
      "fr": [
        "Debout, un haltère dans chaque main le long du corps.",
        "Fais un pas en avant et descends le bassin à la verticale.",
        "Le genou arrière frôle le sol, le buste droit.",
        "Le genou avant reste aligné avec le pied, sans trop le dépasser.",
        "Pousse sur le talon avant pour revenir."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Tronco inclinado à frente.",
          "c": "Peito erguido, olhar em frente, core firme."
        },
        {
          "e": "Passada curta (joelho passa o pé).",
          "c": "Passo mais longo; desce na vertical."
        }
      ],
      "en": [
        {
          "e": "Torso leaning forward.",
          "c": "Chest up, eyes ahead, core braced."
        },
        {
          "e": "Step too short (knee shoots past the foot).",
          "c": "Take a longer step; drop straight down."
        }
      ],
      "es": [
        {
          "e": "Tronco inclinado hacia delante.",
          "c": "Pecho alto, mirada al frente, core firme."
        },
        {
          "e": "Zancada corta (la rodilla se pasa del pie).",
          "c": "Da un paso más largo; baja en vertical."
        }
      ],
      "fr": [
        {
          "e": "Buste penché en avant.",
          "c": "Poitrine haute, regard devant, gainage ferme."
        },
        {
          "e": "Pas trop court (le genou dépasse le pied).",
          "c": "Allonge le pas ; descends à la verticale."
        }
      ]
    },
    "safe": {
      "pt": [
        "Core firme protege a lombar.",
        "Se o equilíbrio falhar, apoia-te ligeiramente."
      ],
      "en": [
        "A braced core protects your lower back.",
        "If balance fails, hold on lightly for support."
      ],
      "es": [
        "Un core firme protege la lumbar.",
        "Si pierdes el equilibrio, apóyate ligeramente."
      ],
      "fr": [
        "Un gainage ferme protège le bas du dos.",
        "Si l’équilibre lâche, appuie-toi légèrement."
      ]
    },
    "breath": {
      "pt": "Inspira ao descer, expira ao subir.",
      "en": "Breathe in on the way down, out on the way up.",
      "es": "Inspira al bajar, espira al subir.",
      "fr": "Inspire en descendant, expire en montant."
    }
  },
  "calf_s": {
    "n": {
      "pt": "Elevação de Panturrilha em Pé",
      "en": "Standing Calf Raise",
      "es": "Elevación de gemelos de pie",
      "fr": "Extension des mollets debout"
    },
    "eq": {
      "pt": "Máquina de Panturrilha",
      "en": "Calf raise machine",
      "es": "Máquina de gemelos",
      "fr": "Machine à mollets"
    },
    "anim": "calf",
    "pri": [
      "calves"
    ],
    "sec": [],
    "steps": {
      "pt": [
        "Ombros sob as almofadas, ponta dos pés na plataforma.",
        "Deixa os calcanhares descerem abaixo da linha (alongar).",
        "Sobe na ponta dos pés o mais alto possível.",
        "Segura 1s no topo.",
        "Desce devagar controlando."
      ],
      "en": [
        "Shoulders under the pads, balls of the feet on the platform.",
        "Let the heels drop below the platform line (stretch).",
        "Rise onto the toes as high as you can.",
        "Hold for 1s at the top.",
        "Lower slowly under control."
      ],
      "es": [
        "Hombros bajo las almohadillas, las puntas de los pies en la plataforma.",
        "Deja que los talones bajen por debajo de la línea (estirar).",
        "Sube de puntillas lo más alto que puedas.",
        "Aguanta 1 s arriba.",
        "Baja despacio y controlando."
      ],
      "fr": [
        "Épaules sous les coussinets, pointes des pieds sur le plateau.",
        "Laisse les talons descendre sous le niveau du plateau (étirement).",
        "Monte sur la pointe des pieds le plus haut possible.",
        "Tiens 1 s en haut.",
        "Descends lentement, en contrôlant."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Amplitude curta.",
          "c": "Alonga em baixo e contrai no topo, amplitude total."
        },
        {
          "e": "Saltar em vez de controlar.",
          "c": "Movimento lento e deliberado."
        }
      ],
      "en": [
        {
          "e": "Short range of motion.",
          "c": "Stretch at the bottom, squeeze at the top — full range."
        },
        {
          "e": "Bouncing instead of controlling.",
          "c": "Slow, deliberate movement."
        }
      ],
      "es": [
        {
          "e": "Recorrido corto.",
          "c": "Estira abajo y contrae arriba, recorrido completo."
        },
        {
          "e": "Rebotar en vez de controlar.",
          "c": "Movimiento lento y deliberado."
        }
      ],
      "fr": [
        {
          "e": "Amplitude trop courte.",
          "c": "Étire en bas et contracte en haut, amplitude complète."
        },
        {
          "e": "Rebondir au lieu de contrôler.",
          "c": "Mouvement lent et volontaire."
        }
      ]
    },
    "safe": {
      "pt": [
        "Movimento controlado, sem ressaltos."
      ],
      "en": [
        "Controlled movement, no bouncing."
      ],
      "es": [
        "Movimiento controlado, sin rebotes."
      ],
      "fr": [
        "Mouvement contrôlé, sans à-coups."
      ]
    },
    "breath": {
      "pt": "Expira ao subir, inspira ao descer.",
      "en": "Breathe out as you rise, in as you lower.",
      "es": "Espira al subir, inspira al bajar.",
      "fr": "Expire en montant, inspire en descendant."
    }
  },
  "plank": {
    "n": {
      "pt": "Prancha",
      "en": "Plank",
      "es": "Plancha",
      "fr": "Planche"
    },
    "eq": {
      "pt": "Peso corporal",
      "en": "Bodyweight",
      "es": "Peso corporal",
      "fr": "Poids du corps"
    },
    "anim": "plank",
    "pri": [
      "abs"
    ],
    "sec": [
      "obliques",
      "lowerBack"
    ],
    "steps": {
      "pt": [
        "Antebraços no chão, cotovelos sob os ombros.",
        "Pés à largura da bacia, corpo em linha reta.",
        "Contrai abdómen e glúteos.",
        "Bacia levemente enrolada, costelas para baixo.",
        "Mantém o tempo alvo respirando normalmente."
      ],
      "en": [
        "Forearms on the floor, elbows under the shoulders.",
        "Feet hip-width, body in a straight line.",
        "Squeeze abs and glutes.",
        "Tuck the pelvis slightly, ribs down.",
        "Hold for the target time, breathing normally."
      ],
      "es": [
        "Antebrazos en el suelo, codos bajo los hombros.",
        "Pies a la anchura de la cadera, cuerpo en línea recta.",
        "Aprieta abdomen y glúteos.",
        "Cadera ligeramente retrovertida, costillas hacia abajo.",
        "Aguanta el tiempo objetivo respirando con normalidad."
      ],
      "fr": [
        "Avant-bras au sol, coudes sous les épaules.",
        "Pieds à la largeur du bassin, corps en ligne droite.",
        "Contracte les abdominaux et les fessiers.",
        "Bassin légèrement rétroversé, côtes vers le bas.",
        "Tiens la durée visée en respirant normalement."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Bacia muito alta ou muito baixa.",
          "c": "Linha reta ombro-bacia-tornozelo."
        },
        {
          "e": "Prender a respiração.",
          "c": "Respira de forma contínua e lenta."
        }
      ],
      "en": [
        {
          "e": "Hips too high or sagging too low.",
          "c": "Straight line from shoulder to hip to ankle."
        },
        {
          "e": "Holding your breath.",
          "c": "Breathe continuously and slowly."
        }
      ],
      "es": [
        {
          "e": "Cadera demasiado alta o demasiado baja.",
          "c": "Línea recta hombro-cadera-tobillo."
        },
        {
          "e": "Aguantar la respiración.",
          "c": "Respira de forma continua y lenta."
        }
      ],
      "fr": [
        {
          "e": "Bassin trop haut ou trop bas.",
          "c": "Ligne droite épaule-bassin-cheville."
        },
        {
          "e": "Bloquer sa respiration.",
          "c": "Respire de façon continue et lente."
        }
      ]
    },
    "safe": {
      "pt": [
        "Linha reta protege a lombar; pára se ceder."
      ],
      "en": [
        "A straight line protects your lower back; stop when it sags."
      ],
      "es": [
        "La línea recta protege la lumbar; para si cede."
      ],
      "fr": [
        "La ligne droite protège le bas du dos ; arrête si elle s’affaisse."
      ]
    },
    "breath": {
      "pt": "Respira continuamente — nunca prendas o ar.",
      "en": "Keep breathing — never hold your breath.",
      "es": "Respira sin parar: nunca aguantes el aire.",
      "fr": "Respire sans arrêt — ne bloque jamais ta respiration."
    }
  },
  "dbbench": {
    "n": {
      "pt": "Supino com Halteres",
      "en": "Dumbbell Bench Press",
      "es": "Press de banca con mancuernas",
      "fr": "Développé couché avec haltères"
    },
    "eq": {
      "pt": "Halteres + Banco",
      "en": "Dumbbells + Bench",
      "es": "Mancuernas + banco",
      "fr": "Haltères + banc"
    },
    "anim": "benchpress",
    "pri": [
      "chest"
    ],
    "sec": [
      "frontDelt",
      "triceps"
    ],
    "steps": {
      "pt": [
        "Deita no banco, halteres à altura do peito.",
        "Escápulas retraídas, pés firmes no chão.",
        "Cotovelos a ~45° do tronco.",
        "Empurra até quase estender, sem bater os halteres.",
        "Desce controlando até alongar o peito."
      ],
      "en": [
        "Lie on the bench with the dumbbells at chest level.",
        "Shoulder blades retracted, feet planted.",
        "Elbows at about 45° to the torso.",
        "Press to near lockout without clashing the dumbbells.",
        "Lower under control until the chest stretches."
      ],
      "es": [
        "Túmbate en el banco, las mancuernas a la altura del pecho.",
        "Escápulas retraídas, pies firmes en el suelo.",
        "Codos a unos 45° del tronco.",
        "Empuja casi hasta estirar, sin chocar las mancuernas.",
        "Baja controlando hasta estirar el pecho."
      ],
      "fr": [
        "Allonge-toi sur le banc, les haltères à hauteur de poitrine.",
        "Omoplates serrées, pieds bien ancrés au sol.",
        "Coudes à environ 45° du buste.",
        "Pousse presque jusqu’à l’extension, sans cogner les haltères.",
        "Descends en contrôlant jusqu’à étirer la poitrine."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Cotovelos abertos a 90° (stress no ombro).",
          "c": "Mantém ~45° entre braço e tronco."
        },
        {
          "e": "Arquear muito a lombar.",
          "c": "Costelas para baixo, ligeiro arco natural apenas."
        }
      ],
      "en": [
        {
          "e": "Elbows flared to 90° (shoulder stress).",
          "c": "Keep about 45° between arm and torso."
        },
        {
          "e": "Over-arching the lower back.",
          "c": "Ribs down, only a slight natural arch."
        }
      ],
      "es": [
        {
          "e": "Codos abiertos a 90° (carga el hombro).",
          "c": "Mantén unos 45° entre el brazo y el tronco."
        },
        {
          "e": "Arquear demasiado la lumbar.",
          "c": "Costillas hacia abajo, solo el arco natural."
        }
      ],
      "fr": [
        {
          "e": "Coudes ouverts à 90° (contrainte sur l’épaule).",
          "c": "Garde environ 45° entre le bras et le buste."
        },
        {
          "e": "Cambrer trop le bas du dos.",
          "c": "Côtes vers le bas, seulement la cambrure naturelle."
        }
      ]
    },
    "safe": {
      "pt": [
        "Desce só até a amplitude confortável do ombro."
      ],
      "en": [
        "Only lower as far as your shoulder is comfortable."
      ],
      "es": [
        "Baja solo hasta el recorrido cómodo para tu hombro."
      ],
      "fr": [
        "Ne descends que dans l’amplitude confortable pour ton épaule."
      ]
    },
    "breath": {
      "pt": "Inspira ao descer, expira ao empurrar.",
      "en": "Breathe in as you lower, out as you press.",
      "es": "Inspira al bajar, espira al empujar.",
      "fr": "Inspire en descendant, expire en poussant."
    }
  },
  "incldb": {
    "n": {
      "pt": "Supino Inclinado com Halteres",
      "en": "Incline DB Press",
      "es": "Press inclinado con mancuernas",
      "fr": "Développé incliné avec haltères"
    },
    "eq": {
      "pt": "Halteres + Banco inclinado 30°",
      "en": "Dumbbells + 30° incline bench",
      "es": "Mancuernas + banco inclinado 30°",
      "fr": "Haltères + banc incliné à 30°"
    },
    "anim": "incline",
    "pri": [
      "chest"
    ],
    "sec": [
      "frontDelt",
      "triceps"
    ],
    "steps": {
      "pt": [
        "Banco inclinado a ~30°.",
        "Halteres à altura do peito superior.",
        "Escápulas retraídas, pés firmes.",
        "Empurra para cima e ligeiramente para dentro.",
        "Desce controlando ao peito superior."
      ],
      "en": [
        "Set the bench to about 30°.",
        "Dumbbells at upper-chest level.",
        "Shoulder blades retracted, feet planted.",
        "Press up and slightly inward.",
        "Lower under control to the upper chest."
      ],
      "es": [
        "Banco inclinado a unos 30°.",
        "Mancuernas a la altura del pecho alto.",
        "Escápulas retraídas, pies firmes.",
        "Empuja hacia arriba y ligeramente hacia dentro.",
        "Baja controlando hasta el pecho alto."
      ],
      "fr": [
        "Banc incliné à environ 30°.",
        "Haltères à hauteur du haut de la poitrine.",
        "Omoplates serrées, pieds bien ancrés.",
        "Pousse vers le haut et légèrement vers l’intérieur.",
        "Descends en contrôlant jusqu’au haut de la poitrine."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Inclinação demasiado alta (>45°).",
          "c": "Fica em ~30° para focar o peito, não o ombro."
        },
        {
          "e": "Descer pouco.",
          "c": "Amplitude completa até alongar."
        }
      ],
      "en": [
        {
          "e": "Bench angle too steep (>45°).",
          "c": "Stay near 30° to hit chest, not shoulders."
        },
        {
          "e": "Not lowering far enough.",
          "c": "Full range, down to a stretch."
        }
      ],
      "es": [
        {
          "e": "Inclinación demasiado alta (>45°).",
          "c": "Quédate en unos 30° para trabajar el pecho y no el hombro."
        },
        {
          "e": "Bajar poco.",
          "c": "Recorrido completo hasta estirar."
        }
      ],
      "fr": [
        {
          "e": "Inclinaison trop forte (>45°).",
          "c": "Reste vers 30° pour cibler la poitrine et non l’épaule."
        },
        {
          "e": "Ne pas descendre assez.",
          "c": "Amplitude complète, jusqu’à l’étirement."
        }
      ]
    },
    "safe": {
      "pt": [
        "Inclinação moderada poupa o ombro."
      ],
      "en": [
        "A moderate incline spares the shoulder."
      ],
      "es": [
        "Una inclinación moderada cuida el hombro."
      ],
      "fr": [
        "Une inclinaison modérée ménage l’épaule."
      ]
    },
    "breath": {
      "pt": "Inspira ao descer, expira ao empurrar.",
      "en": "Breathe in as you lower, out as you press.",
      "es": "Inspira al bajar, espira al empujar.",
      "fr": "Inspire en descendant, expire en poussant."
    }
  },
  "pecdeck": {
    "n": {
      "pt": "Peck Deck",
      "en": "Pec Deck / Machine Fly",
      "es": "Contractor de pecho",
      "fr": "Pec deck"
    },
    "eq": {
      "pt": "Máquina Peck Deck",
      "en": "Pec deck machine",
      "es": "Máquina contractora",
      "fr": "Machine pec deck"
    },
    "anim": "benchpress",
    "pri": [
      "chest"
    ],
    "sec": [
      "frontDelt"
    ],
    "steps": {
      "pt": [
        "Ajusta o assento: pegas à altura do meio do peito.",
        "Costas apoiadas, antebraços nas almofadas.",
        "Junta os braços à frente contraindo o peito.",
        "Segura 1s na contração.",
        "Volta controlando sem bater os pesos."
      ],
      "en": [
        "Set the seat so the handles sit at mid-chest height.",
        "Back against the pad, forearms on the pads.",
        "Bring the arms together in front, squeezing the chest.",
        "Hold the squeeze for 1s.",
        "Return under control without clanging the stack."
      ],
      "es": [
        "Ajusta el asiento: las agarraderas a la altura media del pecho.",
        "Espalda apoyada, antebrazos en las almohadillas.",
        "Junta los brazos delante contrayendo el pecho.",
        "Aguanta 1 s en la contracción.",
        "Vuelve controlando, sin chocar los discos."
      ],
      "fr": [
        "Règle le siège : les poignées à mi-hauteur de la poitrine.",
        "Dos plaqué, avant-bras sur les coussinets.",
        "Rapproche les bras devant toi en contractant la poitrine.",
        "Tiens 1 s sur la contraction.",
        "Reviens en contrôlant, sans cogner les plaques."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Assento mal ajustado (pegas altas).",
          "c": "Pegas ao nível do meio do peito."
        },
        {
          "e": "Usar impulso.",
          "c": "Movimento controlado, foco no peito."
        }
      ],
      "en": [
        {
          "e": "Seat set wrong (handles too high).",
          "c": "Handles at mid-chest level."
        },
        {
          "e": "Using momentum.",
          "c": "Controlled movement, focus on the chest."
        }
      ],
      "es": [
        {
          "e": "Asiento mal ajustado (agarraderas altas).",
          "c": "Las agarraderas al nivel medio del pecho."
        },
        {
          "e": "Usar impulso.",
          "c": "Movimiento controlado, con el foco en el pecho."
        }
      ],
      "fr": [
        {
          "e": "Siège mal réglé (poignées trop hautes).",
          "c": "Les poignées au niveau du milieu de la poitrine."
        },
        {
          "e": "Utiliser l’élan.",
          "c": "Mouvement contrôlé, en sentant la poitrine."
        }
      ]
    },
    "safe": {
      "pt": [
        "Não forces a abertura para trás do plano do corpo."
      ],
      "en": [
        "Do not force the stretch behind the plane of your body."
      ],
      "es": [
        "No fuerces la apertura por detrás del plano del cuerpo."
      ],
      "fr": [
        "Ne force pas l’ouverture au-delà du plan du corps."
      ]
    },
    "breath": {
      "pt": "Expira ao juntar, inspira ao abrir.",
      "en": "Breathe out as you close, in as you open.",
      "es": "Espira al juntar, inspira al abrir.",
      "fr": "Expire en rapprochant, inspire en ouvrant."
    }
  },
  "pushdown": {
    "n": {
      "pt": "Tríceps na Polia",
      "en": "Triceps Pushdown",
      "es": "Extensión de tríceps en polea",
      "fr": "Extension des triceps à la poulie"
    },
    "eq": {
      "pt": "Polia alta + barra/corda",
      "en": "High pulley + bar/rope",
      "es": "Polea alta + barra o cuerda",
      "fr": "Poulie haute + barre ou corde"
    },
    "anim": "pushdown",
    "pri": [
      "triceps"
    ],
    "sec": [],
    "steps": {
      "pt": [
        "Polia no alto, pega pronada.",
        "Cotovelos junto ao tronco, fixos.",
        "Estende os cotovelos empurrando para baixo.",
        "Segura 1s em baixo.",
        "Sobe controlando."
      ],
      "en": [
        "Pulley set high, overhand grip.",
        "Elbows pinned to your sides.",
        "Extend the elbows, pushing down.",
        "Hold for 1s at the bottom.",
        "Return under control."
      ],
      "es": [
        "Polea arriba, agarre prono.",
        "Codos junto al tronco, fijos.",
        "Estira los codos empujando hacia abajo.",
        "Aguanta 1 s abajo.",
        "Sube controlando."
      ],
      "fr": [
        "Poulie en haut, prise en pronation.",
        "Coudes contre le buste, fixes.",
        "Tends les coudes en poussant vers le bas.",
        "Tiens 1 s en bas.",
        "Remonte en contrôlant."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Afastar os cotovelos do corpo.",
          "c": "Cotovelos colados ao tronco, fixos."
        },
        {
          "e": "Inclinar o tronco para empurrar.",
          "c": "Tronco direito; só o antebraço se move."
        }
      ],
      "en": [
        {
          "e": "Elbows drifting away from the body.",
          "c": "Elbows glued to the torso, fixed."
        },
        {
          "e": "Leaning over to push the weight.",
          "c": "Stay upright; only the forearm moves."
        }
      ],
      "es": [
        {
          "e": "Separar los codos del cuerpo.",
          "c": "Codos pegados al tronco y fijos."
        },
        {
          "e": "Inclinar el tronco para empujar.",
          "c": "Tronco recto; solo se mueve el antebrazo."
        }
      ],
      "fr": [
        {
          "e": "Écarter les coudes du corps.",
          "c": "Coudes collés au buste et fixes."
        },
        {
          "e": "Pencher le buste pour pousser.",
          "c": "Buste droit ; seul l’avant-bras bouge."
        }
      ]
    },
    "safe": {
      "pt": [
        "Cotovelos fixos isolam o tríceps e poupam o ombro."
      ],
      "en": [
        "Fixed elbows isolate the triceps and spare the shoulder."
      ],
      "es": [
        "Con los codos fijos aíslas el tríceps y cuidas el hombro."
      ],
      "fr": [
        "Coudes fixes : le triceps travaille seul et l’épaule est ménagée."
      ]
    },
    "breath": {
      "pt": "Expira ao estender, inspira ao subir.",
      "en": "Breathe out as you extend, in as you return.",
      "es": "Espira al estirar, inspira al subir.",
      "fr": "Expire en tendant, inspire en remontant."
    }
  },
  "ohext": {
    "n": {
      "pt": "Extensão de Tríceps acima da cabeça",
      "en": "Overhead Cable Extension",
      "es": "Extensión de tríceps sobre la cabeza",
      "fr": "Extension des triceps au-dessus de la tête"
    },
    "eq": {
      "pt": "Polia + corda",
      "en": "Cable + rope",
      "es": "Polea + cuerda",
      "fr": "Poulie + corde"
    },
    "anim": "ohext",
    "pri": [
      "triceps"
    ],
    "sec": [],
    "steps": {
      "pt": [
        "De costas para a polia (na posição baixa/alta com corda).",
        "Corda atrás da cabeça, cotovelos apontados à frente e para cima.",
        "Estende os cotovelos à frente até quase esticar.",
        "Contrai o tríceps no fim.",
        "Volta controlando alongando o tríceps."
      ],
      "en": [
        "Face away from the pulley (rope attached low or high).",
        "Rope behind your head, elbows pointing forward and up.",
        "Extend the elbows forward to near lockout.",
        "Squeeze the triceps at the end.",
        "Return under control, stretching the triceps."
      ],
      "es": [
        "De espaldas a la polea (en posición baja o alta, con cuerda).",
        "La cuerda detrás de la cabeza, los codos apuntando adelante y arriba.",
        "Estira los codos hacia delante casi hasta el final.",
        "Contrae el tríceps al terminar.",
        "Vuelve controlando y estirando el tríceps."
      ],
      "fr": [
        "Dos à la poulie (en position basse ou haute, avec la corde).",
        "La corde derrière la tête, les coudes pointés vers l’avant et le haut.",
        "Tends les coudes vers l’avant, presque jusqu’au bout.",
        "Contracte le triceps en fin de mouvement.",
        "Reviens en contrôlant, en étirant le triceps."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Cotovelos abrem para os lados.",
          "c": "Mantém os cotovelos apontados à frente e juntos."
        },
        {
          "e": "Arquear a lombar ao estender.",
          "c": "Core firme, um pé à frente para estabilizar."
        }
      ],
      "en": [
        {
          "e": "Elbows flaring out to the sides.",
          "c": "Keep the elbows pointing forward and close together."
        },
        {
          "e": "Arching the lower back as you extend.",
          "c": "Brace the core, stagger one foot forward for stability."
        }
      ],
      "es": [
        {
          "e": "Los codos se abren hacia los lados.",
          "c": "Mantén los codos apuntando adelante y juntos."
        },
        {
          "e": "Arquear la lumbar al estirar.",
          "c": "Core firme y un pie adelantado para estabilizar."
        }
      ],
      "fr": [
        {
          "e": "Les coudes s’ouvrent sur les côtés.",
          "c": "Garde les coudes pointés vers l’avant et serrés."
        },
        {
          "e": "Cambrer le bas du dos en tendant.",
          "c": "Gainage ferme, un pied devant pour stabiliser."
        }
      ]
    },
    "safe": {
      "pt": [
        "Alonga o tríceps na posição de cima — bom estímulo, controla a carga."
      ],
      "en": [
        "This stretches the triceps overhead — great stimulus, keep the load controlled."
      ],
      "es": [
        "Arriba el tríceps queda muy estirado: buen estímulo, pero controla la carga."
      ],
      "fr": [
        "En haut, le triceps est très étiré — bon stimulus, mais maîtrise la charge."
      ]
    },
    "breath": {
      "pt": "Expira ao estender, inspira ao voltar.",
      "en": "Breathe out as you extend, in as you return.",
      "es": "Espira al estirar, inspira al volver.",
      "fr": "Expire en tendant, inspire au retour."
    }
  },
  "skull": {
    "n": {
      "pt": "Tríceps Testa",
      "en": "Lying Triceps Extension / Skullcrusher",
      "es": "Extensión de tríceps tumbado",
      "fr": "Barre au front"
    },
    "eq": {
      "pt": "Barra EZ ou Halteres + Banco",
      "en": "EZ bar or dumbbells + bench",
      "es": "Barra Z o mancuernas + banco",
      "fr": "Barre EZ ou haltères + banc"
    },
    "anim": "ohext",
    "pri": [
      "triceps"
    ],
    "sec": [],
    "steps": {
      "pt": [
        "Deitado no banco, barra EZ (ou halteres) acima do peito, braços esticados.",
        "Cotovelos apontados para cima e fixos.",
        "Desce a barra em direção à testa flexionando só os cotovelos.",
        "Pára junto à testa/atrás da cabeça, sem abrir os cotovelos.",
        "Estende de volta ao topo contraindo o tríceps."
      ],
      "en": [
        "Lie on the bench, EZ bar (or dumbbells) over the chest, arms straight.",
        "Elbows pointing up and fixed.",
        "Lower the bar toward your forehead, bending only at the elbows.",
        "Stop near the forehead/behind the head without flaring the elbows.",
        "Extend back to the top, squeezing the triceps."
      ],
      "es": [
        "Tumbado en el banco, la barra Z (o las mancuernas) sobre el pecho, brazos estirados.",
        "Codos apuntando hacia arriba y fijos.",
        "Baja la barra hacia la frente flexionando solo los codos.",
        "Párate junto a la frente o detrás de la cabeza, sin abrir los codos.",
        "Estira de vuelta arriba contrayendo el tríceps."
      ],
      "fr": [
        "Allongé sur le banc, barre EZ (ou haltères) au-dessus de la poitrine, bras tendus.",
        "Coudes pointés vers le plafond et fixes.",
        "Descends la barre vers le front en ne fléchissant que les coudes.",
        "Arrête-toi près du front ou derrière la tête, sans ouvrir les coudes.",
        "Tends à nouveau vers le haut en contractant le triceps."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Abrir os cotovelos para os lados.",
          "c": "Cotovelos apontados ao teto e fixos durante todo o movimento."
        },
        {
          "e": "Mexer os ombros/braços (vira supino).",
          "c": "Só o antebraço se move; o braço fica imóvel."
        }
      ],
      "en": [
        {
          "e": "Flaring the elbows out to the sides.",
          "c": "Elbows pointed at the ceiling and fixed throughout."
        },
        {
          "e": "Moving the shoulders/upper arms (it turns into a press).",
          "c": "Only the forearm moves; the upper arm stays still."
        }
      ],
      "es": [
        {
          "e": "Abrir los codos hacia los lados.",
          "c": "Codos apuntando al techo y fijos durante todo el movimiento."
        },
        {
          "e": "Mover los hombros o los brazos (se vuelve un press).",
          "c": "Solo se mueve el antebrazo; el brazo se queda quieto."
        }
      ],
      "fr": [
        {
          "e": "Ouvrir les coudes sur les côtés.",
          "c": "Coudes pointés vers le plafond et fixes pendant tout le mouvement."
        },
        {
          "e": "Bouger les épaules ou les bras (ça devient un développé).",
          "c": "Seul l’avant-bras bouge ; le bras reste immobile."
        }
      ]
    },
    "safe": {
      "pt": [
        "Controla a descida junto à testa; carga moderada para proteger o cotovelo."
      ],
      "en": [
        "Control the descent near your forehead; moderate load to protect the elbow."
      ],
      "es": [
        "Controla la bajada junto a la frente; carga moderada para proteger el codo."
      ],
      "fr": [
        "Contrôle la descente près du front ; charge modérée pour protéger le coude."
      ]
    },
    "breath": {
      "pt": "Inspira ao descer, expira ao estender.",
      "en": "Breathe in as you lower, out as you extend.",
      "es": "Inspira al bajar, espira al estirar.",
      "fr": "Inspire en descendant, expire en tendant."
    }
  },
  "cgbench": {
    "n": {
      "pt": "Supino Fechado",
      "en": "Close-Grip Bench Press",
      "es": "Press de banca con agarre cerrado",
      "fr": "Développé couché prise serrée"
    },
    "eq": {
      "pt": "Barra + Banco",
      "en": "Barbell + bench",
      "es": "Barra + banco",
      "fr": "Barre + banc"
    },
    "anim": "benchpress",
    "pri": [
      "triceps"
    ],
    "sec": [
      "chest",
      "frontDelt"
    ],
    "steps": {
      "pt": [
        "Deitado no banco, pega à largura dos ombros — não mais estreita.",
        "Punhos direitos por cima dos cotovelos.",
        "Cotovelos a ~45° do tronco, não abertos.",
        "Desce a barra à parte baixa do peito, a roçar.",
        "Empurra até quase estender, a pensar em estender o cotovelo."
      ],
      "en": [
        "Lie on the bench, grip at shoulder width — no narrower.",
        "Wrists stacked straight over the elbows.",
        "Elbows about 45° from the torso, not flared.",
        "Lower the bar to the lower chest, just touching.",
        "Press to near lockout, thinking about extending the elbow."
      ],
      "es": [
        "Tumbado en el banco, agarre a la anchura de los hombros: no más estrecho.",
        "Muñecas rectas, justo encima de los codos.",
        "Codos a unos 45° del tronco, sin abrirlos.",
        "Baja la barra rozando la parte baja del pecho.",
        "Empuja casi hasta estirar, pensando en extender el codo."
      ],
      "fr": [
        "Allongé sur le banc, prise à la largeur des épaules — pas plus serrée.",
        "Poignets droits, à l’aplomb des coudes.",
        "Coudes à environ 45° du buste, sans les ouvrir.",
        "Descends la barre en frôlant le bas de la poitrine.",
        "Pousse presque jusqu’à l’extension, en pensant à tendre le coude."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Pega demasiado estreita (mãos a tocar-se).",
          "c": "Largura dos ombros — mais estreito só castiga o punho, não recruta mais tríceps."
        },
        {
          "e": "Abrir os cotovelos como no supino normal.",
          "c": "Cotovelos junto ao tronco; é isso que transfere o trabalho para o tríceps."
        }
      ],
      "en": [
        {
          "e": "Gripping far too narrow (hands touching).",
          "c": "Shoulder width — narrower only punishes the wrist, it does not recruit more triceps."
        },
        {
          "e": "Flaring the elbows as in a regular bench press.",
          "c": "Elbows tucked; that is what shifts the work onto the triceps."
        }
      ],
      "es": [
        {
          "e": "Agarre demasiado estrecho (manos juntas).",
          "c": "A la anchura de los hombros: más estrecho solo castiga la muñeca, no recluta más tríceps."
        },
        {
          "e": "Abrir los codos como en el press normal.",
          "c": "Codos junto al tronco: es eso lo que pasa el trabajo al tríceps."
        }
      ],
      "fr": [
        {
          "e": "Prise trop serrée (mains qui se touchent).",
          "c": "Largeur d’épaules : plus serré ne fait que malmener le poignet, sans recruter plus de triceps."
        },
        {
          "e": "Ouvrir les coudes comme au développé classique.",
          "c": "Coudes près du buste : c’est ce qui transfère le travail sur le triceps."
        }
      ]
    },
    "safe": {
      "pt": [
        "O composto mais pesado do dia — usa suportes de segurança ou um observador.",
        "Punho a doer é sinal de pega estreita demais."
      ],
      "en": [
        "The heaviest compound of the day — use safety pins or a spotter.",
        "Wrist pain means the grip is too narrow."
      ],
      "es": [
        "Es el compuesto más pesado del día: usa los soportes de seguridad o pide que te vigilen.",
        "Si te duele la muñeca, el agarre es demasiado estrecho."
      ],
      "fr": [
        "C’est le mouvement le plus lourd de la séance — utilise les barres de sécurité ou fais-toi parer.",
        "Un poignet qui fait mal signale une prise trop serrée."
      ]
    },
    "breath": {
      "pt": "Inspira ao descer, expira ao empurrar.",
      "en": "Breathe in as you lower, out as you press.",
      "es": "Inspira al bajar, espira al empujar.",
      "fr": "Inspire en descendant, expire en poussant."
    }
  },
  "dip": {
    "n": {
      "pt": "Paralelas para Tríceps",
      "en": "Parallel Bar Dip",
      "es": "Fondos en paralelas",
      "fr": "Dips aux barres parallèles"
    },
    "eq": {
      "pt": "Paralelas (ou máquina assistida)",
      "en": "Parallel bars (or assisted machine)",
      "es": "Paralelas (o máquina asistida)",
      "fr": "Barres parallèles (ou machine assistée)"
    },
    "anim": "pushdown",
    "pri": [
      "triceps"
    ],
    "sec": [
      "chest",
      "frontDelt"
    ],
    "steps": {
      "pt": [
        "Apoia-te nas barras, braços esticados, ombros para baixo.",
        "Tronco o mais vertical possível — inclinar à frente passa o trabalho para o peito.",
        "Cotovelos apontados atrás, junto ao corpo.",
        "Desce até ~90° de cotovelo.",
        "Empurra até estender sem travar."
      ],
      "en": [
        "Support yourself on the bars, arms straight, shoulders pulled down.",
        "Torso as upright as possible — leaning forward shifts the work to the chest.",
        "Elbows pointing back, close to the body.",
        "Lower to about 90° at the elbow.",
        "Press up to extension without snapping the elbows."
      ],
      "es": [
        "Apóyate en las barras, brazos estirados, hombros hacia abajo.",
        "Tronco lo más vertical posible: inclinarte adelante pasa el trabajo al pecho.",
        "Codos apuntando atrás, pegados al cuerpo.",
        "Baja hasta unos 90° de codo.",
        "Empuja hasta estirar sin bloquear."
      ],
      "fr": [
        "Prends appui sur les barres, bras tendus, épaules basses.",
        "Buste le plus vertical possible — te pencher en avant transfère le travail sur la poitrine.",
        "Coudes pointés vers l’arrière, près du corps.",
        "Descends jusqu’à environ 90° de coude.",
        "Pousse jusqu’à l’extension sans verrouiller."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Descer demasiado, ombro à frente da linha do cotovelo.",
          "c": "Pára aos ~90° — mais fundo é onde o ombro se magoa."
        },
        {
          "e": "Ombros a subir até às orelhas.",
          "c": "Ombros para baixo e atrás antes de começar."
        }
      ],
      "en": [
        {
          "e": "Dropping too deep, shoulder passing below the elbow line.",
          "c": "Stop around 90° — deeper is where the shoulder gets hurt."
        },
        {
          "e": "Shoulders shrugging up to the ears.",
          "c": "Set the shoulders down and back before you start."
        }
      ],
      "es": [
        {
          "e": "Bajar demasiado, con el hombro por delante de la línea del codo.",
          "c": "Párate a unos 90°: más abajo es donde se lesiona el hombro."
        },
        {
          "e": "Los hombros suben hacia las orejas.",
          "c": "Hombros abajo y atrás antes de empezar."
        }
      ],
      "fr": [
        {
          "e": "Descendre trop bas, épaule en avant de la ligne du coude.",
          "c": "Arrête-toi vers 90° — plus bas, c’est là que l’épaule se blesse."
        },
        {
          "e": "Les épaules montent vers les oreilles.",
          "c": "Épaules basses et en arrière avant de commencer."
        }
      ]
    },
    "safe": {
      "pt": [
        "Se ainda não fazes com o peso do corpo, usa a máquina assistida — não vale a pena forçar.",
        "Qualquer dor à frente do ombro: pára e reduz a amplitude."
      ],
      "en": [
        "If bodyweight is not there yet, use the assisted machine — forcing it is not worth it.",
        "Any pain at the front of the shoulder: stop and shorten the range."
      ],
      "es": [
        "Si todavía no puedes con tu peso, usa la máquina asistida: no merece la pena forzar.",
        "Cualquier dolor en la parte delantera del hombro: para y reduce el recorrido."
      ],
      "fr": [
        "Si tu n’y arrives pas encore au poids du corps, prends la machine assistée — rien ne sert de forcer.",
        "Toute douleur à l’avant de l’épaule : arrête et réduis l’amplitude."
      ]
    },
    "breath": {
      "pt": "Inspira ao descer, expira ao subir.",
      "en": "Breathe in as you lower, out as you press up.",
      "es": "Inspira al bajar, espira al subir.",
      "fr": "Inspire en descendant, expire en montant."
    }
  },
  "kickback": {
    "n": {
      "pt": "Coice de Tríceps no Cabo",
      "en": "Cable Triceps Kickback",
      "es": "Patada de tríceps en polea",
      "fr": "Kickback triceps à la poulie"
    },
    "eq": {
      "pt": "Polia baixa + pega",
      "en": "Low pulley + handle",
      "es": "Polea baja + agarre",
      "fr": "Poulie basse + poignée"
    },
    "anim": "pushdown",
    "pri": [
      "triceps"
    ],
    "sec": [],
    "steps": {
      "pt": [
        "Polia em baixo, tronco inclinado à frente ~45°.",
        "Braço colado ao tronco, cotovelo a 90°.",
        "Estende só o cotovelo até o braço ficar a direito atrás.",
        "Segura 1s na contração máxima.",
        "Volta controlando até aos 90°."
      ],
      "en": [
        "Pulley set low, torso bent forward about 45°.",
        "Upper arm pinned to the torso, elbow at 90°.",
        "Extend only the elbow until the arm is straight behind you.",
        "Hold the peak contraction for 1s.",
        "Return under control to 90°."
      ],
      "es": [
        "Polea abajo, tronco inclinado adelante unos 45°.",
        "Brazo pegado al tronco, codo a 90°.",
        "Estira solo el codo hasta que el brazo quede recto atrás.",
        "Aguanta 1 s en la contracción máxima.",
        "Vuelve controlando hasta los 90°."
      ],
      "fr": [
        "Poulie en bas, buste penché en avant à environ 45°.",
        "Bras collé au buste, coude à 90°.",
        "Ne tends que le coude, jusqu’à ce que le bras soit droit vers l’arrière.",
        "Tiens 1 s sur la contraction maximale.",
        "Reviens en contrôlant jusqu’à 90°."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "O braço todo balança em vez de só o antebraço.",
          "c": "Cotovelo fixo — se abana, a carga está alta demais."
        },
        {
          "e": "Usar carga pesada e perder a contração no fim.",
          "c": "É um finalizador: carga leve, aperta no fim."
        }
      ],
      "en": [
        {
          "e": "Swinging the whole arm instead of just the forearm.",
          "c": "Fix the elbow — if it swings, the load is too heavy."
        },
        {
          "e": "Going heavy and losing the squeeze at the end.",
          "c": "This is a finisher: light load, squeeze at the top."
        }
      ],
      "es": [
        {
          "e": "Todo el brazo se balancea en vez de solo el antebrazo.",
          "c": "Codo fijo: si se mueve, la carga es demasiado alta."
        },
        {
          "e": "Usar mucha carga y perder la contracción final.",
          "c": "Es un ejercicio de remate: carga ligera y aprieta al final."
        }
      ],
      "fr": [
        {
          "e": "Tout le bras balance au lieu du seul avant-bras.",
          "c": "Coude fixe — s’il bouge, la charge est trop lourde."
        },
        {
          "e": "Prendre lourd et perdre la contraction finale.",
          "c": "C’est un exercice de finition : charge légère, serre à la fin."
        }
      ]
    },
    "safe": {
      "pt": [
        "Trabalho leve de fim de sessão; não há razão para forçar aqui."
      ],
      "en": [
        "Light end-of-session work; no reason to push hard here."
      ],
      "es": [
        "Trabajo ligero de final de sesión; aquí no hay ninguna razón para forzar."
      ],
      "fr": [
        "Travail léger de fin de séance ; aucune raison de forcer ici."
      ]
    },
    "breath": {
      "pt": "Expira ao estender, inspira ao voltar.",
      "en": "Breathe out as you extend, in as you return.",
      "es": "Espira al estirar, inspira al volver.",
      "fr": "Expire en tendant, inspire au retour."
    }
  },
  "dbohp": {
    "n": {
      "pt": "Desenvolvimento com Halteres",
      "en": "Dumbbell Shoulder Press",
      "es": "Press militar con mancuernas",
      "fr": "Développé épaules avec haltères"
    },
    "eq": {
      "pt": "Halteres + Banco vertical",
      "en": "Dumbbells + upright bench",
      "es": "Mancuernas + banco vertical",
      "fr": "Haltères + banc vertical"
    },
    "anim": "ohp",
    "pri": [
      "frontDelt"
    ],
    "sec": [
      "sideDelt",
      "triceps"
    ],
    "steps": {
      "pt": [
        "Sentado, encosto vertical, halteres à altura dos ombros.",
        "Punhos neutros, cotovelos ligeiramente à frente.",
        "Lombar apoiada no encosto.",
        "Empurra até quase estender, sem travar.",
        "Desce até os cotovelos ao nível dos ombros."
      ],
      "en": [
        "Seated, backrest upright, dumbbells at shoulder height.",
        "Neutral wrists, elbows slightly forward.",
        "Lower back supported by the pad.",
        "Press to near lockout, without snapping the elbows.",
        "Lower until the elbows reach shoulder level."
      ],
      "es": [
        "Sentado, respaldo vertical, mancuernas a la altura de los hombros.",
        "Muñecas neutras, codos ligeramente adelantados.",
        "Lumbar apoyada en el respaldo.",
        "Empuja casi hasta estirar, sin bloquear.",
        "Baja hasta que los codos queden al nivel de los hombros."
      ],
      "fr": [
        "Assis, dossier vertical, haltères à hauteur d’épaules.",
        "Poignets neutres, coudes légèrement en avant.",
        "Bas du dos plaqué contre le dossier.",
        "Pousse presque jusqu’à l’extension, sans verrouiller.",
        "Descends jusqu’à ce que les coudes arrivent au niveau des épaules."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Arquear a lombar para empurrar mais peso.",
          "c": "Lombar apoiada; baixa a carga se compensas."
        },
        {
          "e": "Meia amplitude.",
          "c": "Desce até os ombros, sobe até quase esticar."
        }
      ],
      "en": [
        {
          "e": "Arching the lower back to press more weight.",
          "c": "Keep the back supported; drop the load if you compensate."
        },
        {
          "e": "Half range of motion.",
          "c": "Lower to the shoulders, press to near lockout."
        }
      ],
      "es": [
        {
          "e": "Arquear la lumbar para empujar más peso.",
          "c": "Lumbar apoyada; baja la carga si compensas."
        },
        {
          "e": "Media amplitud.",
          "c": "Baja hasta los hombros y sube casi hasta estirar."
        }
      ],
      "fr": [
        {
          "e": "Cambrer le bas du dos pour pousser plus lourd.",
          "c": "Bas du dos plaqué ; baisse la charge si tu compenses."
        },
        {
          "e": "Demi-amplitude.",
          "c": "Descends jusqu’aux épaules, monte presque jusqu’à l’extension."
        }
      ]
    },
    "safe": {
      "pt": [
        "Encosto apoiado protege a lombar.",
        "Sem dor no ombro — reduz amplitude se preciso."
      ],
      "en": [
        "A supported back protects your lumbar spine.",
        "No shoulder pain — shorten the range if needed."
      ],
      "es": [
        "El respaldo apoyado protege la lumbar.",
        "Sin dolor de hombro: reduce el recorrido si hace falta."
      ],
      "fr": [
        "Le dossier protège le bas du dos.",
        "Aucune douleur à l’épaule — réduis l’amplitude si besoin."
      ]
    },
    "breath": {
      "pt": "Inspira em baixo, expira ao empurrar.",
      "en": "Breathe in at the bottom, out as you press.",
      "es": "Inspira abajo, espira al empujar.",
      "fr": "Inspire en bas, expire en poussant."
    }
  },
  "lateral": {
    "n": {
      "pt": "Elevação Lateral",
      "en": "Lateral Raise",
      "es": "Elevación lateral",
      "fr": "Élévation latérale"
    },
    "eq": {
      "pt": "Halteres",
      "en": "Dumbbells",
      "es": "Mancuernas",
      "fr": "Haltères"
    },
    "anim": "lateral",
    "pri": [
      "sideDelt"
    ],
    "sec": [
      "traps"
    ],
    "steps": {
      "pt": [
        "Em pé, halteres ao lado do corpo.",
        "Cotovelos ligeiramente flexionados.",
        "Eleva para os lados até à altura dos ombros.",
        "Lidera com os cotovelos, não com as mãos.",
        "Desce devagar controlando."
      ],
      "en": [
        "Stand with the dumbbells at your sides.",
        "Elbows slightly bent.",
        "Raise out to the sides up to shoulder height.",
        "Lead with the elbows, not the hands.",
        "Lower slowly under control."
      ],
      "es": [
        "De pie, las mancuernas al lado del cuerpo.",
        "Codos ligeramente flexionados.",
        "Eleva hacia los lados hasta la altura de los hombros.",
        "Guía con los codos, no con las manos.",
        "Baja despacio y controlando."
      ],
      "fr": [
        "Debout, les haltères le long du corps.",
        "Coudes légèrement fléchis.",
        "Monte sur les côtés jusqu’à hauteur d’épaules.",
        "Guide avec les coudes, pas avec les mains.",
        "Descends lentement, en contrôlant."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Peso a mais e balanço do corpo.",
          "c": "Carga leve; corpo imóvel, só os braços sobem."
        },
        {
          "e": "Subir acima dos ombros / encolher o trapézio.",
          "c": "Pára à altura dos ombros, ombros para baixo."
        }
      ],
      "en": [
        {
          "e": "Too much weight and body swing.",
          "c": "Go light; body still, only the arms rise."
        },
        {
          "e": "Going above shoulder height / shrugging the traps.",
          "c": "Stop at shoulder height, shoulders down."
        }
      ],
      "es": [
        {
          "e": "Demasiado peso y balanceo del cuerpo.",
          "c": "Carga ligera; el cuerpo quieto, solo suben los brazos."
        },
        {
          "e": "Subir por encima de los hombros o encoger el trapecio.",
          "c": "Párate a la altura de los hombros, hombros abajo."
        }
      ],
      "fr": [
        {
          "e": "Trop lourd, et le corps qui balance.",
          "c": "Charge légère ; le corps immobile, seuls les bras montent."
        },
        {
          "e": "Monter au-dessus des épaules ou hausser le trapèze.",
          "c": "Arrête-toi à hauteur d’épaules, épaules basses."
        }
      ]
    },
    "safe": {
      "pt": [
        "Sem impulso; se balanças, baixa o peso."
      ],
      "en": [
        "No momentum; if you swing, drop the weight."
      ],
      "es": [
        "Sin impulso; si te balanceas, baja el peso."
      ],
      "fr": [
        "Sans élan ; si tu balances, allège."
      ]
    },
    "breath": {
      "pt": "Expira ao subir, inspira ao descer.",
      "en": "Breathe out as you raise, in as you lower.",
      "es": "Espira al subir, inspira al bajar.",
      "fr": "Expire en montant, inspire en descendant."
    }
  },
  "reardelt": {
    "n": {
      "pt": "Elevação Posterior",
      "en": "Reverse Fly",
      "es": "Elevación posterior",
      "fr": "Oiseau (deltoïde postérieur)"
    },
    "eq": {
      "pt": "Halteres ou Máquina",
      "en": "Dumbbells or machine",
      "es": "Mancuernas o máquina",
      "fr": "Haltères ou machine"
    },
    "anim": "reardelt",
    "pri": [
      "rearDelt"
    ],
    "sec": [
      "upperBack",
      "traps"
    ],
    "steps": {
      "pt": [
        "Tronco inclinado à frente (ou peito na almofada da máquina).",
        "Halteres pendentes, cotovelos levemente fletidos.",
        "Abre os braços para os lados e atrás.",
        "Aperta as omoplatas no fim.",
        "Volta controlando."
      ],
      "en": [
        "Hinge the torso forward (or chest on the machine pad).",
        "Dumbbells hanging, elbows slightly bent.",
        "Open the arms out to the sides and back.",
        "Squeeze the shoulder blades at the end.",
        "Return under control."
      ],
      "es": [
        "Tronco inclinado adelante (o el pecho en la almohadilla de la máquina).",
        "Mancuernas colgando, codos ligeramente flexionados.",
        "Abre los brazos hacia los lados y atrás.",
        "Aprieta las escápulas al final.",
        "Vuelve controlando."
      ],
      "fr": [
        "Buste penché en avant (ou la poitrine contre le coussinet de la machine).",
        "Haltères suspendus, coudes légèrement fléchis.",
        "Ouvre les bras sur les côtés et vers l’arrière.",
        "Serre les omoplates en fin de mouvement.",
        "Reviens en contrôlant."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Usar os trapézios/encolher os ombros.",
          "c": "Ombros para baixo; foco na parte de trás do ombro."
        },
        {
          "e": "Peso excessivo com impulso.",
          "c": "Carga leve, movimento limpo."
        }
      ],
      "en": [
        {
          "e": "Using the traps/shrugging the shoulders.",
          "c": "Shoulders down; focus on the rear delt."
        },
        {
          "e": "Too heavy, using momentum.",
          "c": "Light load, clean movement."
        }
      ],
      "es": [
        {
          "e": "Tirar con el trapecio o encoger los hombros.",
          "c": "Hombros abajo; el foco en la parte de atrás del hombro."
        },
        {
          "e": "Demasiado peso, con impulso.",
          "c": "Carga ligera, movimiento limpio."
        }
      ],
      "fr": [
        {
          "e": "Tirer avec le trapèze ou hausser les épaules.",
          "c": "Épaules basses ; concentre-toi sur l’arrière de l’épaule."
        },
        {
          "e": "Trop lourd, avec de l’élan.",
          "c": "Charge légère, mouvement propre."
        }
      ]
    },
    "safe": {
      "pt": [
        "Ótimo para postura — importante para quem passa 8h sentado."
      ],
      "en": [
        "Great for posture — important if you sit 8 hours a day."
      ],
      "es": [
        "Excelente para la postura, importante si pasas 8 h sentado."
      ],
      "fr": [
        "Excellent pour la posture — important quand on passe 8 h assis."
      ]
    },
    "breath": {
      "pt": "Expira ao abrir, inspira ao voltar.",
      "en": "Breathe out as you open, in as you return.",
      "es": "Espira al abrir, inspira al volver.",
      "fr": "Expire en ouvrant, inspire au retour."
    }
  },
  "dbcurl": {
    "n": {
      "pt": "Rosca com Halteres",
      "en": "Dumbbell Curl",
      "es": "Curl con mancuernas",
      "fr": "Curl avec haltères"
    },
    "eq": {
      "pt": "Halteres",
      "en": "Dumbbells",
      "es": "Mancuernas",
      "fr": "Haltères"
    },
    "anim": "curl",
    "pri": [
      "biceps"
    ],
    "sec": [
      "forearm"
    ],
    "steps": {
      "pt": [
        "Em pé, halteres ao lado, palmas à frente.",
        "Cotovelos fixos junto ao tronco.",
        "Flexiona subindo até aos ombros.",
        "Segura 1s na contração.",
        "Desce controlando totalmente."
      ],
      "en": [
        "Stand with the dumbbells at your sides, palms forward.",
        "Elbows fixed against the torso.",
        "Curl up toward the shoulders.",
        "Hold the squeeze for 1s.",
        "Lower under full control."
      ],
      "es": [
        "De pie, mancuernas al lado, palmas hacia delante.",
        "Codos fijos junto al tronco.",
        "Flexiona subiendo hasta los hombros.",
        "Aguanta 1 s en la contracción.",
        "Baja controlando del todo."
      ],
      "fr": [
        "Debout, haltères le long du corps, paumes vers l’avant.",
        "Coudes fixes, contre le buste.",
        "Fléchis en montant jusqu’aux épaules.",
        "Tiens 1 s sur la contraction.",
        "Descends en contrôlant jusqu’au bout."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Balançar o corpo/lombar para subir.",
          "c": "Cotovelos fixos; se balanças, baixa o peso."
        },
        {
          "e": "Mover os cotovelos à frente.",
          "c": "Cotovelos imóveis ao lado do tronco."
        }
      ],
      "en": [
        {
          "e": "Swinging the body/lower back to lift.",
          "c": "Elbows fixed; if you swing, drop the weight."
        },
        {
          "e": "Letting the elbows drift forward.",
          "c": "Elbows stay still at your sides."
        }
      ],
      "es": [
        {
          "e": "Balancear el cuerpo o la lumbar para subir.",
          "c": "Codos fijos; si te balanceas, baja el peso."
        },
        {
          "e": "Adelantar los codos.",
          "c": "Codos inmóviles al lado del tronco."
        }
      ],
      "fr": [
        {
          "e": "Balancer le corps ou le bas du dos pour monter.",
          "c": "Coudes fixes ; si tu balances, allège."
        },
        {
          "e": "Avancer les coudes.",
          "c": "Coudes immobiles, le long du buste."
        }
      ]
    },
    "safe": {
      "pt": [
        "Sem balanço da lombar."
      ],
      "en": [
        "No swinging from the lower back."
      ],
      "es": [
        "Sin balanceo de la lumbar."
      ],
      "fr": [
        "Pas de balancement du bas du dos."
      ]
    },
    "breath": {
      "pt": "Expira ao subir, inspira ao descer.",
      "en": "Breathe out as you curl, in as you lower.",
      "es": "Espira al subir, inspira al bajar.",
      "fr": "Expire en montant, inspire en descendant."
    }
  },
  "hammer": {
    "n": {
      "pt": "Rosca Martelo",
      "en": "Hammer Curl",
      "es": "Curl martillo",
      "fr": "Curl marteau"
    },
    "eq": {
      "pt": "Halteres",
      "en": "Dumbbells",
      "es": "Mancuernas",
      "fr": "Haltères"
    },
    "anim": "curl",
    "pri": [
      "biceps",
      "forearm"
    ],
    "sec": [],
    "steps": {
      "pt": [
        "Em pé, pega neutra (palmas viradas uma para a outra).",
        "Cotovelos fixos ao lado do corpo.",
        "Flexiona mantendo a pega neutra até aos ombros.",
        "Segura 1s.",
        "Desce controlando."
      ],
      "en": [
        "Stand with a neutral grip (palms facing each other).",
        "Elbows fixed at your sides.",
        "Curl to the shoulders keeping the grip neutral.",
        "Hold for 1s.",
        "Lower under control."
      ],
      "es": [
        "De pie, agarre neutro (las palmas enfrentadas).",
        "Codos fijos al lado del cuerpo.",
        "Flexiona manteniendo el agarre neutro hasta los hombros.",
        "Aguanta 1 s.",
        "Baja controlando."
      ],
      "fr": [
        "Debout, prise neutre (paumes face à face).",
        "Coudes fixes, le long du corps.",
        "Fléchis en gardant la prise neutre jusqu’aux épaules.",
        "Tiens 1 s.",
        "Descends en contrôlant."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Rodar o punho durante o movimento.",
          "c": "Mantém a pega neutra do início ao fim."
        },
        {
          "e": "Impulso da lombar.",
          "c": "Corpo imóvel, só o antebraço."
        }
      ],
      "en": [
        {
          "e": "Rotating the wrist during the rep.",
          "c": "Keep the grip neutral start to finish."
        },
        {
          "e": "Momentum from the lower back.",
          "c": "Body still, only the forearm moves."
        }
      ],
      "es": [
        {
          "e": "Girar la muñeca durante el movimiento.",
          "c": "Mantén el agarre neutro de principio a fin."
        },
        {
          "e": "Impulso desde la lumbar.",
          "c": "Cuerpo quieto, solo el antebrazo."
        }
      ],
      "fr": [
        {
          "e": "Tourner le poignet pendant le mouvement.",
          "c": "Garde la prise neutre du début à la fin."
        },
        {
          "e": "Élan venu du bas du dos.",
          "c": "Corps immobile, seul l’avant-bras bouge."
        }
      ]
    },
    "safe": {
      "pt": [
        "Punho neutro alivia o cotovelo."
      ],
      "en": [
        "A neutral wrist is easier on the elbow."
      ],
      "es": [
        "La muñeca neutra alivia el codo."
      ],
      "fr": [
        "Le poignet neutre soulage le coude."
      ]
    },
    "breath": {
      "pt": "Expira ao subir, inspira ao descer.",
      "en": "Breathe out as you curl, in as you lower.",
      "es": "Espira al subir, inspira al bajar.",
      "fr": "Expire en montant, inspire en descendant."
    }
  },
  "cablecurl": {
    "n": {
      "pt": "Rosca no Cabo",
      "en": "Cable Curl",
      "es": "Curl en polea",
      "fr": "Curl à la poulie"
    },
    "eq": {
      "pt": "Polia baixa + barra",
      "en": "Low pulley + bar",
      "es": "Polea baja + barra",
      "fr": "Poulie basse + barre"
    },
    "anim": "curl",
    "pri": [
      "biceps"
    ],
    "sec": [
      "forearm"
    ],
    "steps": {
      "pt": [
        "Polia na posição baixa, pega a barra.",
        "Cotovelos fixos ao lado do tronco.",
        "Flexiona até aos ombros com tensão constante.",
        "Contrai no topo.",
        "Desce controlando."
      ],
      "en": [
        "Pulley set low, grip the bar.",
        "Elbows fixed at your sides.",
        "Curl to the shoulders with constant tension.",
        "Squeeze at the top.",
        "Lower under control."
      ],
      "es": [
        "Polea en posición baja, agarra la barra.",
        "Codos fijos al lado del tronco.",
        "Flexiona hasta los hombros con tensión constante.",
        "Contrae arriba.",
        "Baja controlando."
      ],
      "fr": [
        "Poulie en position basse, saisis la barre.",
        "Coudes fixes, le long du buste.",
        "Fléchis jusqu’aux épaules en gardant une tension constante.",
        "Contracte en haut.",
        "Descends en contrôlant."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Recuar o corpo para ajudar.",
          "c": "Pés firmes, tronco imóvel."
        },
        {
          "e": "Amplitude curta no topo.",
          "c": "Sobe até à contração completa."
        }
      ],
      "en": [
        {
          "e": "Leaning back to help the lift.",
          "c": "Feet planted, torso still."
        },
        {
          "e": "Cutting the range short at the top.",
          "c": "Curl all the way to full contraction."
        }
      ],
      "es": [
        {
          "e": "Echar el cuerpo atrás para ayudarte.",
          "c": "Pies firmes, tronco inmóvil."
        },
        {
          "e": "Recorrido corto arriba.",
          "c": "Sube hasta la contracción completa."
        }
      ],
      "fr": [
        {
          "e": "Reculer le corps pour s’aider.",
          "c": "Pieds ancrés, buste immobile."
        },
        {
          "e": "Amplitude trop courte en haut.",
          "c": "Monte jusqu’à la contraction complète."
        }
      ]
    },
    "safe": {
      "pt": [
        "O cabo mantém tensão constante — ótimo pico de contração."
      ],
      "en": [
        "The cable keeps constant tension — great peak contraction."
      ],
      "es": [
        "La polea mantiene la tensión constante: un pico de contracción excelente."
      ],
      "fr": [
        "La poulie garde une tension constante — excellent pic de contraction."
      ]
    },
    "breath": {
      "pt": "Expira ao subir, inspira ao descer.",
      "en": "Breathe out as you curl, in as you lower.",
      "es": "Espira al subir, inspira al bajar.",
      "fr": "Expire en montant, inspire en descendant."
    }
  },
  "pulldown": {
    "n": {
      "pt": "Puxada na Polia Alta",
      "en": "Lat Pulldown",
      "es": "Jalón al pecho",
      "fr": "Tirage vertical à la poitrine"
    },
    "eq": {
      "pt": "Polia alta + barra",
      "en": "High pulley + bar",
      "es": "Polea alta + barra",
      "fr": "Poulie haute + barre"
    },
    "anim": "pulldown",
    "pri": [
      "lats"
    ],
    "sec": [
      "biceps",
      "rearDelt"
    ],
    "steps": {
      "pt": [
        "Almofada das coxas firme para fixar o corpo.",
        "Pega um pouco mais larga que os ombros.",
        "Peito erguido, ligeira inclinação atrás.",
        "Puxa a barra ao peito, cotovelos para baixo e atrás.",
        "Sobe controlando até quase estender os braços."
      ],
      "en": [
        "Thigh pad snug to anchor your body.",
        "Grip slightly wider than shoulder-width.",
        "Chest up, a slight lean back.",
        "Pull the bar to your chest, elbows down and back.",
        "Let it rise under control to near full arm extension."
      ],
      "es": [
        "La almohadilla de los muslos bien ajustada para fijar el cuerpo.",
        "Agarre algo más ancho que los hombros.",
        "Pecho alto, ligera inclinación hacia atrás.",
        "Tira de la barra al pecho, con los codos hacia abajo y atrás.",
        "Sube controlando casi hasta estirar los brazos."
      ],
      "fr": [
        "Le coussinet des cuisses bien serré pour caler le corps.",
        "Prise un peu plus large que les épaules.",
        "Poitrine haute, léger recul du buste.",
        "Tire la barre vers la poitrine, coudes vers le bas et l’arrière.",
        "Remonte en contrôlant, presque jusqu’à tendre les bras."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Puxar atrás da nuca.",
          "c": "Puxa sempre à frente, ao peito."
        },
        {
          "e": "Balançar o tronco para gerar impulso.",
          "c": "Tronco estável; puxa com as costas, não com o balanço."
        }
      ],
      "en": [
        {
          "e": "Pulling behind the neck.",
          "c": "Always pull in front, to the chest."
        },
        {
          "e": "Rocking the torso for momentum.",
          "c": "Torso steady; pull with your back, not with the swing."
        }
      ],
      "es": [
        {
          "e": "Tirar por detrás de la nuca.",
          "c": "Tira siempre por delante, hacia el pecho."
        },
        {
          "e": "Balancear el tronco para coger impulso.",
          "c": "Tronco estable; tira con la espalda, no con el balanceo."
        }
      ],
      "fr": [
        {
          "e": "Tirer derrière la nuque.",
          "c": "Tire toujours devant, vers la poitrine."
        },
        {
          "e": "Balancer le buste pour prendre de l’élan.",
          "c": "Buste stable ; tire avec le dos, pas avec l’élan."
        }
      ]
    },
    "safe": {
      "pt": [
        "Nunca atrás da nuca — protege ombros e pescoço."
      ],
      "en": [
        "Never behind the neck — protect your shoulders and neck."
      ],
      "es": [
        "Nunca por detrás de la nuca: protege hombros y cuello."
      ],
      "fr": [
        "Jamais derrière la nuque — ça protège les épaules et le cou."
      ]
    },
    "breath": {
      "pt": "Expira ao puxar, inspira ao subir.",
      "en": "Breathe out as you pull, in as it rises.",
      "es": "Espira al tirar, inspira al subir.",
      "fr": "Expire en tirant, inspire en remontant."
    }
  },
  "csrow": {
    "n": {
      "pt": "Remada com Apoio de Peito",
      "en": "Chest-Supported Row",
      "es": "Remo con apoyo de pecho",
      "fr": "Rowing avec appui pectoral"
    },
    "eq": {
      "pt": "Máquina / Banco inclinado",
      "en": "Machine / incline bench",
      "es": "Máquina o banco inclinado",
      "fr": "Machine ou banc incliné"
    },
    "anim": "row",
    "pri": [
      "upperBack",
      "lats"
    ],
    "sec": [
      "biceps",
      "rearDelt"
    ],
    "steps": {
      "pt": [
        "Peito apoiado na almofada, pés firmes.",
        "Braços estendidos a segurar as alças.",
        "Puxa os cotovelos atrás, aperta as omoplatas.",
        "Segura 1s na contração.",
        "Volta controlando."
      ],
      "en": [
        "Chest against the pad, feet planted.",
        "Arms extended, holding the handles.",
        "Drive the elbows back, squeezing the shoulder blades.",
        "Hold the squeeze for 1s.",
        "Return under control."
      ],
      "es": [
        "Pecho apoyado en la almohadilla, pies firmes.",
        "Brazos estirados sujetando las agarraderas.",
        "Lleva los codos atrás y aprieta las escápulas.",
        "Aguanta 1 s en la contracción.",
        "Vuelve controlando."
      ],
      "fr": [
        "Poitrine plaquée contre le coussinet, pieds bien ancrés.",
        "Bras tendus, mains sur les poignées.",
        "Tire les coudes vers l’arrière et serre les omoplates.",
        "Tiens 1 s sur la contraction.",
        "Reviens en contrôlant."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Descolar o peito da almofada (usa a lombar).",
          "c": "Peito sempre apoiado — protege a coluna."
        },
        {
          "e": "Encolher os ombros.",
          "c": "Ombros para baixo, puxa com as costas."
        }
      ],
      "en": [
        {
          "e": "Lifting the chest off the pad (loading the lower back).",
          "c": "Chest stays on the pad — that is what protects your spine."
        },
        {
          "e": "Shrugging the shoulders.",
          "c": "Shoulders down, pull with the back."
        }
      ],
      "es": [
        {
          "e": "Despegar el pecho de la almohadilla (tiras con la lumbar).",
          "c": "El pecho siempre apoyado: es lo que protege la columna."
        },
        {
          "e": "Encoger los hombros.",
          "c": "Hombros abajo, tira con la espalda."
        }
      ],
      "fr": [
        {
          "e": "Décoller la poitrine du coussinet (on tire avec le bas du dos).",
          "c": "Poitrine toujours en appui — c’est ce qui protège la colonne."
        },
        {
          "e": "Hausser les épaules.",
          "c": "Épaules basses, tire avec le dos."
        }
      ]
    },
    "safe": {
      "pt": [
        "Apoio de peito tira a carga da lombar — ideal para ti."
      ],
      "en": [
        "Chest support takes the load off your lower back — ideal for you."
      ],
      "es": [
        "El apoyo de pecho quita carga de la lumbar: ideal para ti."
      ],
      "fr": [
        "L’appui pectoral décharge le bas du dos — idéal pour toi."
      ]
    },
    "breath": {
      "pt": "Expira ao puxar, inspira ao voltar.",
      "en": "Breathe out as you pull, in as you return.",
      "es": "Espira al tirar, inspira al volver.",
      "fr": "Expire en tirant, inspire au retour."
    }
  },
  "seatedrow": {
    "n": {
      "pt": "Remada Sentada no Cabo",
      "en": "Seated Cable Row",
      "es": "Remo sentado en polea",
      "fr": "Rowing assis à la poulie"
    },
    "eq": {
      "pt": "Polia baixa + triângulo",
      "en": "Low pulley + V-handle",
      "es": "Polea baja + triángulo",
      "fr": "Poulie basse + poignée en V"
    },
    "anim": "row",
    "pri": [
      "upperBack",
      "lats"
    ],
    "sec": [
      "biceps"
    ],
    "steps": {
      "pt": [
        "Sentado, pés apoiados, joelhos levemente fletidos.",
        "Coluna neutra, peito erguido.",
        "Puxa a pega ao abdómen, cotovelos junto ao corpo.",
        "Aperta as omoplatas no fim.",
        "Volta controlando sem arredondar as costas."
      ],
      "en": [
        "Seated, feet braced, knees slightly bent.",
        "Neutral spine, chest up.",
        "Pull the handle to your abdomen, elbows close to the body.",
        "Squeeze the shoulder blades at the end.",
        "Return under control without rounding the back."
      ],
      "es": [
        "Sentado, pies apoyados, rodillas ligeramente flexionadas.",
        "Columna neutra, pecho alto.",
        "Lleva el agarre al abdomen, codos junto al cuerpo.",
        "Aprieta las escápulas al final.",
        "Vuelve controlando, sin redondear la espalda."
      ],
      "fr": [
        "Assis, pieds en appui, genoux légèrement fléchis.",
        "Colonne neutre, poitrine haute.",
        "Tire la poignée vers le ventre, coudes près du corps.",
        "Serre les omoplates en fin de mouvement.",
        "Reviens en contrôlant, sans arrondir le dos."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Arredondar/balançar o tronco para trás.",
          "c": "Coluna neutra; o movimento vem dos braços e costas, não da lombar."
        },
        {
          "e": "Amplitude curta.",
          "c": "Estende bem à frente (sem arredondar) e puxa ao abdómen."
        }
      ],
      "en": [
        {
          "e": "Rounding/rocking the torso backwards.",
          "c": "Neutral spine; the movement comes from arms and back, not the lumbar."
        },
        {
          "e": "Short range of motion.",
          "c": "Reach well forward (without rounding) and pull to the abdomen."
        }
      ],
      "es": [
        {
          "e": "Redondear o balancear el tronco hacia atrás.",
          "c": "Columna neutra; el movimiento sale de brazos y espalda, no de la lumbar."
        },
        {
          "e": "Recorrido corto.",
          "c": "Estira bien al frente (sin redondear) y tira al abdomen."
        }
      ],
      "fr": [
        {
          "e": "Arrondir ou balancer le buste vers l’arrière.",
          "c": "Colonne neutre ; le mouvement vient des bras et du dos, pas du bas du dos."
        },
        {
          "e": "Amplitude trop courte.",
          "c": "Tends bien vers l’avant (sans arrondir) et tire vers le ventre."
        }
      ]
    },
    "safe": {
      "pt": [
        "Mantém a coluna neutra — não uses a lombar para puxar."
      ],
      "en": [
        "Keep a neutral spine — do not pull with your lower back."
      ],
      "es": [
        "Mantén la columna neutra: no tires con la lumbar."
      ],
      "fr": [
        "Garde la colonne neutre — ne tire pas avec le bas du dos."
      ]
    },
    "breath": {
      "pt": "Expira ao puxar, inspira ao voltar.",
      "en": "Breathe out as you pull, in as you return.",
      "es": "Espira al tirar, inspira al volver.",
      "fr": "Expire en tirant, inspire au retour."
    }
  },
  "strarm": {
    "n": {
      "pt": "Puxada com Braço Esticado",
      "en": "Straight-Arm Pulldown",
      "es": "Jalón con brazos estirados",
      "fr": "Pull-over à la poulie bras tendus"
    },
    "eq": {
      "pt": "Polia alta + barra",
      "en": "High pulley + bar",
      "es": "Polea alta + barra",
      "fr": "Poulie haute + barre"
    },
    "anim": "strarm",
    "pri": [
      "lats"
    ],
    "sec": [],
    "steps": {
      "pt": [
        "De pé, ligeira inclinação à frente, polia no alto.",
        "Braços quase esticados, pega a barra.",
        "Puxa a barra para baixo até às coxas em arco.",
        "Foco em contrair o dorsal.",
        "Volta controlando com o dorsal."
      ],
      "en": [
        "Stand with a slight forward lean, pulley set high.",
        "Arms nearly straight, grip the bar.",
        "Sweep the bar down to your thighs in an arc.",
        "Focus on squeezing the lats.",
        "Return under control, resisting with the lats."
      ],
      "es": [
        "De pie, ligera inclinación hacia delante, la polea arriba.",
        "Brazos casi estirados, agarrando la barra.",
        "Baja la barra en arco hasta los muslos.",
        "Céntrate en contraer el dorsal.",
        "Vuelve controlando con el dorsal."
      ],
      "fr": [
        "Debout, légèrement penché en avant, poulie en haut.",
        "Bras presque tendus, mains sur la barre.",
        "Descends la barre en arc de cercle jusqu’aux cuisses.",
        "Concentre-toi sur la contraction du grand dorsal.",
        "Reviens en contrôlant, avec le dorsal."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Fletir os cotovelos (vira pushdown).",
          "c": "Braços quase esticados durante todo o movimento."
        },
        {
          "e": "Usar o tronco para empurrar.",
          "c": "Tronco fixo; só os braços descem."
        }
      ],
      "en": [
        {
          "e": "Bending the elbows (it becomes a pushdown).",
          "c": "Arms stay nearly straight throughout."
        },
        {
          "e": "Using the torso to drive the bar.",
          "c": "Torso fixed; only the arms travel."
        }
      ],
      "es": [
        {
          "e": "Flexionar los codos (se convierte en extensión de tríceps).",
          "c": "Brazos casi estirados durante todo el movimiento."
        },
        {
          "e": "Usar el tronco para empujar.",
          "c": "Tronco fijo; solo bajan los brazos."
        }
      ],
      "fr": [
        {
          "e": "Fléchir les coudes (ça devient une extension triceps).",
          "c": "Bras presque tendus pendant tout le mouvement."
        },
        {
          "e": "Utiliser le buste pour pousser.",
          "c": "Buste fixe ; seuls les bras descendent."
        }
      ]
    },
    "safe": {
      "pt": [
        "Isola o dorsal sem carregar a lombar."
      ],
      "en": [
        "Isolates the lats without loading the lower back."
      ],
      "es": [
        "Aísla el dorsal sin cargar la lumbar."
      ],
      "fr": [
        "Isole le grand dorsal sans charger le bas du dos."
      ]
    },
    "breath": {
      "pt": "Expira ao puxar, inspira ao voltar.",
      "en": "Breathe out as you pull, in as you return.",
      "es": "Espira al tirar, inspira al volver.",
      "fr": "Expire en tirant, inspire au retour."
    }
  },
  "facepull": {
    "n": {
      "pt": "Face Pull",
      "en": "Face Pull",
      "es": "Face pull",
      "fr": "Face pull"
    },
    "eq": {
      "pt": "Polia + corda",
      "en": "Cable + rope",
      "es": "Polea + cuerda",
      "fr": "Poulie + corde"
    },
    "anim": "reardelt",
    "pri": [
      "rearDelt"
    ],
    "sec": [
      "traps",
      "upperBack"
    ],
    "steps": {
      "pt": [
        "Corda na polia à altura do rosto.",
        "Pega com polegares para trás.",
        "Puxa a corda à testa, abrindo as mãos.",
        "Cotovelos altos; aperta a parte de trás dos ombros.",
        "Volta controlando."
      ],
      "en": [
        "Rope set at face height.",
        "Grip with thumbs pointing back.",
        "Pull the rope to your forehead, spreading your hands.",
        "Elbows high; squeeze the rear delts.",
        "Return under control."
      ],
      "es": [
        "La cuerda en la polea a la altura de la cara.",
        "Agarra con los pulgares hacia atrás.",
        "Tira de la cuerda hacia la frente, abriendo las manos.",
        "Codos altos; aprieta la parte de atrás de los hombros.",
        "Vuelve controlando."
      ],
      "fr": [
        "La corde à la poulie, à hauteur du visage.",
        "Saisis-la pouces vers l’arrière.",
        "Tire la corde vers le front en écartant les mains.",
        "Coudes hauts ; serre l’arrière des épaules.",
        "Reviens en contrôlant."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Puxar demasiado baixo (vira remada).",
          "c": "Puxa à altura do rosto, cotovelos altos."
        },
        {
          "e": "Peso a mais, forma perdida.",
          "c": "Carga leve, qualidade acima de tudo."
        }
      ],
      "en": [
        {
          "e": "Pulling too low (it becomes a row).",
          "c": "Pull to face height, elbows high."
        },
        {
          "e": "Too heavy, form falls apart.",
          "c": "Light load, quality above all."
        }
      ],
      "es": [
        {
          "e": "Tirar demasiado bajo (se convierte en remo).",
          "c": "Tira a la altura de la cara, con los codos altos."
        },
        {
          "e": "Demasiado peso y la técnica se pierde.",
          "c": "Carga ligera; aquí la calidad está por encima de todo."
        }
      ],
      "fr": [
        {
          "e": "Tirer trop bas (ça devient un rowing).",
          "c": "Tire à hauteur du visage, coudes hauts."
        },
        {
          "e": "Trop lourd, la technique se perd.",
          "c": "Charge légère — ici la qualité prime sur tout."
        }
      ]
    },
    "safe": {
      "pt": [
        "Excelente para saúde do ombro e postura."
      ],
      "en": [
        "Excellent for shoulder health and posture."
      ],
      "es": [
        "Excelente para la salud del hombro y la postura."
      ],
      "fr": [
        "Excellent pour la santé de l’épaule et la posture."
      ]
    },
    "breath": {
      "pt": "Expira ao puxar, inspira ao voltar.",
      "en": "Breathe out as you pull, in as you return.",
      "es": "Espira al tirar, inspira al volver.",
      "fr": "Expire en tirant, inspire au retour."
    }
  },
  "hipthrust": {
    "n": {
      "pt": "Elevação Pélvica",
      "en": "Hip Thrust",
      "es": "Empuje de cadera",
      "fr": "Hip thrust"
    },
    "eq": {
      "pt": "Máquina de Glúteo / Barra",
      "en": "Glute machine / barbell",
      "es": "Máquina de glúteo o barra",
      "fr": "Machine à fessiers ou barre"
    },
    "anim": "hipthrust",
    "pri": [
      "glutes"
    ],
    "sec": [
      "hamstrings",
      "quads"
    ],
    "steps": {
      "pt": [
        "Costas apoiadas na almofada, carga sobre a bacia.",
        "Pés à largura dos ombros, calcanhares firmes.",
        "Estende a bacia para cima contraindo os glúteos.",
        "Topo: corpo em linha, sem hiperestender a lombar.",
        "Desce controlando."
      ],
      "en": [
        "Upper back on the pad, load across the hips.",
        "Feet shoulder-width, heels planted.",
        "Drive the hips up, squeezing the glutes.",
        "At the top: body in line, no lumbar hyperextension.",
        "Lower under control."
      ],
      "es": [
        "Espalda apoyada en la almohadilla, la carga sobre la cadera.",
        "Pies a la anchura de los hombros, talones firmes.",
        "Extiende la cadera hacia arriba contrayendo los glúteos.",
        "Arriba: el cuerpo en línea, sin hiperextender la lumbar.",
        "Baja controlando."
      ],
      "fr": [
        "Dos appuyé sur le coussinet, la charge sur le bassin.",
        "Pieds à la largeur des épaules, talons bien ancrés.",
        "Étends le bassin vers le haut en contractant les fessiers.",
        "En haut : le corps aligné, sans hyperextension du bas du dos.",
        "Descends en contrôlant."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Hiperestender a lombar no topo.",
          "c": "Costelas para baixo; a extensão vem da bacia, não das costas."
        },
        {
          "e": "Empurrar com os dedos dos pés.",
          "c": "Empurra pelos calcanhares."
        }
      ],
      "en": [
        {
          "e": "Hyperextending the lower back at the top.",
          "c": "Ribs down; the extension comes from the hips, not the spine."
        },
        {
          "e": "Pushing through the toes.",
          "c": "Drive through the heels."
        }
      ],
      "es": [
        {
          "e": "Hiperextender la lumbar arriba.",
          "c": "Costillas hacia abajo; la extensión sale de la cadera, no de la espalda."
        },
        {
          "e": "Empujar con la punta de los pies.",
          "c": "Empuja con los talones."
        }
      ],
      "fr": [
        {
          "e": "Hyperextension du bas du dos en haut.",
          "c": "Côtes vers le bas ; l’extension vient du bassin, pas du dos."
        },
        {
          "e": "Pousser sur la pointe des pieds.",
          "c": "Pousse sur les talons."
        }
      ]
    },
    "safe": {
      "pt": [
        "O movimento vem da bacia — protege as costas."
      ],
      "en": [
        "The movement comes from the hips — that protects your back."
      ],
      "es": [
        "El movimiento sale de la cadera: eso protege la espalda."
      ],
      "fr": [
        "Le mouvement vient du bassin — c’est ce qui protège le dos."
      ]
    },
    "breath": {
      "pt": "Expira ao subir, inspira ao descer.",
      "en": "Breathe out as you drive up, in as you lower.",
      "es": "Espira al subir, inspira al bajar.",
      "fr": "Expire en montant, inspire en descendant."
    }
  },
  "dbrdl": {
    "n": {
      "pt": "Levantamento Terra Romeno c/ Halteres",
      "en": "Dumbbell RDL",
      "es": "Peso muerto rumano con mancuernas",
      "fr": "Soulevé de terre roumain avec haltères"
    },
    "eq": {
      "pt": "Halteres",
      "en": "Dumbbells",
      "es": "Mancuernas",
      "fr": "Haltères"
    },
    "anim": "hinge",
    "pri": [
      "hamstrings",
      "glutes"
    ],
    "sec": [
      "lowerBack",
      "forearm"
    ],
    "steps": {
      "pt": [
        "Em pé, halteres à frente das coxas, joelhos levemente fletidos.",
        "Coluna neutra, peito erguido, escápulas encaixadas.",
        "Empurra a bacia atrás descendo os halteres junto às pernas.",
        "Desce até sentir alongar os posteriores (não mais).",
        "Volta empurrando a bacia à frente, apertando os glúteos."
      ],
      "en": [
        "Stand with the dumbbells in front of your thighs, knees slightly bent.",
        "Neutral spine, chest up, shoulder blades set.",
        "Push the hips back, sliding the dumbbells down along your legs.",
        "Lower until you feel the hamstrings stretch — no further.",
        "Come up by driving the hips forward, squeezing the glutes."
      ],
      "es": [
        "De pie, las mancuernas delante de los muslos, rodillas ligeramente flexionadas.",
        "Columna neutra, pecho alto, escápulas encajadas.",
        "Lleva la cadera hacia atrás bajando las mancuernas pegadas a las piernas.",
        "Baja hasta notar el estiramiento en los isquiotibiales, y no más.",
        "Vuelve empujando la cadera hacia delante y apretando los glúteos."
      ],
      "fr": [
        "Debout, haltères devant les cuisses, genoux légèrement fléchis.",
        "Colonne neutre, poitrine haute, omoplates engagées.",
        "Pousse le bassin vers l’arrière en descendant les haltères le long des jambes.",
        "Descends jusqu’à sentir l’étirement des ischio-jambiers, pas plus.",
        "Reviens en poussant le bassin vers l’avant, fessiers serrés."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Arredondar a lombar (erro mais perigoso).",
          "c": "Coluna neutra sempre; pára antes de arredondar."
        },
        {
          "e": "Transformar em agachamento (joelhos à frente).",
          "c": "É uma dobradiça de anca: bacia atrás, joelhos quase fixos."
        }
      ],
      "en": [
        {
          "e": "Rounding the lower back (the most dangerous mistake).",
          "c": "Neutral spine always; stop before it rounds."
        },
        {
          "e": "Turning it into a squat (knees travelling forward).",
          "c": "It is a hip hinge: hips back, knees almost fixed."
        }
      ],
      "es": [
        {
          "e": "Redondear la lumbar (el error más peligroso).",
          "c": "Columna neutra siempre; para antes de que se redondee."
        },
        {
          "e": "Convertirlo en sentadilla (las rodillas se adelantan).",
          "c": "Es una bisagra de cadera: cadera atrás, rodillas casi fijas."
        }
      ],
      "fr": [
        {
          "e": "Arrondir le bas du dos (l’erreur la plus dangereuse).",
          "c": "Colonne neutre en permanence ; arrête-toi avant qu’elle ne s’arrondisse."
        },
        {
          "e": "En faire un squat (les genoux avancent).",
          "c": "C’est une charnière de hanche : bassin en arrière, genoux quasi fixes."
        }
      ]
    },
    "safe": {
      "pt": [
        "CUIDADO COSTAS: carga leve, sobe devagar. RPE máx. 8. Se a lombar reclamar, troca por Mesa Flexora."
      ],
      "en": [
        "BACK CAUTION: light load, build up slowly. RPE 8 max. If your lower back complains, swap it for the Leg Curl."
      ],
      "es": [
        "CUIDADO CON LA ESPALDA: carga ligera, sube despacio. RPE 8 como máximo. Si la lumbar se queja, cámbialo por curl femoral."
      ],
      "fr": [
        "ATTENTION AU DOS : charge légère, progresse lentement. RPE 8 au maximum. Si le bas du dos proteste, remplace par le leg curl."
      ]
    },
    "breath": {
      "pt": "Inspira ao descer, expira ao subir.",
      "en": "Breathe in as you lower, out as you come up.",
      "es": "Inspira al bajar, espira al subir.",
      "fr": "Inspire en descendant, expire en montant."
    }
  },
  "legcurl_seat": {
    "n": {
      "pt": "Mesa Flexora (sentado)",
      "en": "Seated Leg Curl",
      "es": "Curl femoral sentado",
      "fr": "Leg curl assis"
    },
    "eq": {
      "pt": "Máquina Flexora",
      "en": "Leg curl machine",
      "es": "Máquina de curl femoral",
      "fr": "Machine à leg curl"
    },
    "anim": "legcurl",
    "pri": [
      "hamstrings"
    ],
    "sec": [
      "calves"
    ],
    "steps": {
      "pt": [
        "Ajusta o encosto e a almofada das coxas.",
        "Almofada inferior sobre o tendão de Aquiles.",
        "Flexiona os joelhos puxando os calcanhares para baixo/atrás.",
        "Segura no fim.",
        "Volta controlando."
      ],
      "en": [
        "Adjust the backrest and the thigh pad.",
        "Lower pad sitting over the Achilles tendon.",
        "Bend the knees, pulling the heels down and back.",
        "Hold at the end position.",
        "Return under control."
      ],
      "es": [
        "Ajusta el respaldo y la almohadilla de los muslos.",
        "La almohadilla inferior sobre el tendón de Aquiles.",
        "Flexiona las rodillas llevando los talones hacia abajo y atrás.",
        "Aguanta al final del recorrido.",
        "Vuelve controlando."
      ],
      "fr": [
        "Règle le dossier et le coussinet des cuisses.",
        "Le coussinet inférieur sur le tendon d’Achille.",
        "Fléchis les genoux en tirant les talons vers le bas et l’arrière.",
        "Tiens en fin de mouvement.",
        "Reviens en contrôlant."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Bacia desliza para a frente.",
          "c": "Almofada das coxas firme; bacia fixa."
        },
        {
          "e": "Amplitude curta.",
          "c": "Flexão completa, controla a volta."
        }
      ],
      "en": [
        {
          "e": "Hips sliding forward.",
          "c": "Thigh pad snug; hips locked in place."
        },
        {
          "e": "Short range of motion.",
          "c": "Full flexion, control the return."
        }
      ],
      "es": [
        {
          "e": "La cadera se desliza hacia delante.",
          "c": "Almohadilla de los muslos bien ajustada; la cadera fija."
        },
        {
          "e": "Recorrido corto.",
          "c": "Flexión completa, y controla la vuelta."
        }
      ],
      "fr": [
        {
          "e": "Le bassin glisse vers l’avant.",
          "c": "Coussinet des cuisses bien serré ; bassin fixe."
        },
        {
          "e": "Amplitude trop courte.",
          "c": "Flexion complète, et contrôle le retour."
        }
      ]
    },
    "safe": {
      "pt": [
        "Bacia fixa protege a lombar."
      ],
      "en": [
        "Locked hips protect your lower back."
      ],
      "es": [
        "La cadera fija protege la lumbar."
      ],
      "fr": [
        "Le bassin fixe protège le bas du dos."
      ]
    },
    "breath": {
      "pt": "Expira ao flexionar, inspira ao voltar.",
      "en": "Breathe out as you curl, in as you return.",
      "es": "Espira al flexionar, inspira al volver.",
      "fr": "Expire en fléchissant, inspire au retour."
    }
  },
  "legcurl_l": {
    "n": {
      "pt": "Mesa Flexora (deitado)",
      "en": "Lying Leg Curl",
      "es": "Curl femoral tumbado",
      "fr": "Leg curl allongé"
    },
    "eq": {
      "pt": "Máquina Flexora",
      "en": "Leg curl machine",
      "es": "Máquina de curl femoral",
      "fr": "Machine à leg curl"
    },
    "anim": "legcurl",
    "pri": [
      "hamstrings"
    ],
    "sec": [
      "calves"
    ],
    "steps": {
      "pt": [
        "Deita de barriga para baixo, joelhos além da borda.",
        "Almofada acima do calcanhar.",
        "Bacia colada ao banco.",
        "Flexiona puxando os calcanhares aos glúteos.",
        "Desce controlando."
      ],
      "en": [
        "Lie face down with the knees just past the edge.",
        "Pad just above the heels.",
        "Hips pressed into the bench.",
        "Curl the heels toward the glutes.",
        "Lower under control."
      ],
      "es": [
        "Túmbate boca abajo, con las rodillas más allá del borde.",
        "La almohadilla por encima del talón.",
        "La cadera pegada al banco.",
        "Flexiona llevando los talones hacia los glúteos.",
        "Baja controlando."
      ],
      "fr": [
        "Allonge-toi sur le ventre, genoux au-delà du bord.",
        "Le coussinet juste au-dessus du talon.",
        "Bassin collé au banc.",
        "Fléchis en ramenant les talons vers les fessiers.",
        "Descends en contrôlant."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Levantar a bacia (arqueia a lombar).",
          "c": "Bacia sempre no banco."
        },
        {
          "e": "Impulso da bacia.",
          "c": "Movimento só do joelho."
        }
      ],
      "en": [
        {
          "e": "Lifting the hips (arching the lower back).",
          "c": "Hips stay down on the bench."
        },
        {
          "e": "Driving with the hips.",
          "c": "Movement comes from the knee only."
        }
      ],
      "es": [
        {
          "e": "Levantar la cadera (arquea la lumbar).",
          "c": "La cadera siempre en el banco."
        },
        {
          "e": "Impulso desde la cadera.",
          "c": "El movimiento sale solo de la rodilla."
        }
      ],
      "fr": [
        {
          "e": "Soulever le bassin (ça cambre le bas du dos).",
          "c": "Le bassin reste sur le banc."
        },
        {
          "e": "Élan venu du bassin.",
          "c": "Le mouvement vient du genou seul."
        }
      ]
    },
    "safe": {
      "pt": [
        "Bacia no banco evita tensão lombar."
      ],
      "en": [
        "Hips on the bench keeps tension off the lower back."
      ],
      "es": [
        "Con la cadera en el banco evitas tensión en la lumbar."
      ],
      "fr": [
        "Bassin sur le banc : pas de tension sur le bas du dos."
      ]
    },
    "breath": {
      "pt": "Expira ao flexionar, inspira ao voltar.",
      "en": "Breathe out as you curl, in as you return.",
      "es": "Espira al flexionar, inspira al volver.",
      "fr": "Expire en fléchissant, inspire au retour."
    }
  },
  "legpress_h": {
    "n": {
      "pt": "Leg Press (pés altos)",
      "en": "Leg Press (high stance)",
      "es": "Prensa de piernas (pies altos)",
      "fr": "Presse à cuisses (pieds hauts)"
    },
    "eq": {
      "pt": "Leg Press 45°",
      "en": "45° Leg Press",
      "es": "Prensa de piernas 45°",
      "fr": "Presse à cuisses 45°"
    },
    "anim": "legpress",
    "pri": [
      "glutes",
      "hamstrings"
    ],
    "sec": [
      "quads"
    ],
    "steps": {
      "pt": [
        "Configuração do leg press, pés altos na plataforma.",
        "Costas e bacia apoiadas.",
        "Desce controlando com joelho a ~90°.",
        "Empurra pelos calcanhares.",
        "Foco em glúteo e posterior."
      ],
      "en": [
        "Same leg press setup, feet high on the platform.",
        "Back and hips fully supported.",
        "Lower under control to about 90° of knee bend.",
        "Drive through the heels.",
        "Focus on glutes and hamstrings."
      ],
      "es": [
        "Misma colocación que en la prensa, con los pies altos en la plataforma.",
        "Espalda y cadera apoyadas.",
        "Baja controlando hasta unos 90° de rodilla.",
        "Empuja con los talones.",
        "El foco está en el glúteo y el isquiotibial."
      ],
      "fr": [
        "Même installation qu’à la presse, pieds hauts sur le plateau.",
        "Dos et bassin plaqués.",
        "Descends en contrôlant jusqu’à environ 90° de genou.",
        "Pousse sur les talons.",
        "Le travail se concentre sur les fessiers et les ischio-jambiers."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Tirar a lombar do encosto.",
          "c": "Reduz amplitude; lombar apoiada."
        },
        {
          "e": "Travar os joelhos no topo.",
          "c": "Pára antes da extensão total."
        }
      ],
      "en": [
        {
          "e": "Lower back lifting off the pad.",
          "c": "Cut the range; keep the back supported."
        },
        {
          "e": "Locking the knees at the top.",
          "c": "Stop short of full extension."
        }
      ],
      "es": [
        {
          "e": "Despegar la lumbar del respaldo.",
          "c": "Reduce el recorrido; la lumbar apoyada."
        },
        {
          "e": "Bloquear las rodillas arriba.",
          "c": "Párate antes de la extensión total."
        }
      ],
      "fr": [
        {
          "e": "Décoller le bas du dos du dossier.",
          "c": "Réduis l’amplitude ; bas du dos plaqué."
        },
        {
          "e": "Verrouiller les genoux en haut.",
          "c": "Arrête-toi avant l’extension complète."
        }
      ]
    },
    "safe": {
      "pt": [
        "Empurra pelos calcanhares; lombar apoiada."
      ],
      "en": [
        "Drive through the heels; keep the lower back supported."
      ],
      "es": [
        "Empuja con los talones; la lumbar siempre apoyada."
      ],
      "fr": [
        "Pousse sur les talons ; bas du dos toujours plaqué."
      ]
    },
    "breath": {
      "pt": "Inspira ao descer, expira ao empurrar.",
      "en": "Breathe in as you lower, out as you press.",
      "es": "Inspira al bajar, espira al empujar.",
      "fr": "Inspire en descendant, expire en poussant."
    }
  },
  "calf_seat": {
    "n": {
      "pt": "Elevação de Panturrilha Sentado",
      "en": "Seated Calf Raise",
      "es": "Elevación de gemelos sentado",
      "fr": "Extension des mollets assis"
    },
    "eq": {
      "pt": "Máquina de Panturrilha",
      "en": "Calf raise machine",
      "es": "Máquina de gemelos",
      "fr": "Machine à mollets"
    },
    "anim": "calf",
    "pri": [
      "calves"
    ],
    "sec": [],
    "steps": {
      "pt": [
        "Sentado, joelhos sob as almofadas, pontas dos pés na plataforma.",
        "Desce os calcanhares abaixo da linha (alongar).",
        "Sobe na ponta dos pés o máximo.",
        "Segura no topo.",
        "Desce devagar."
      ],
      "en": [
        "Seated, knees under the pads, balls of the feet on the platform.",
        "Let the heels drop below the platform (stretch).",
        "Rise onto the toes as high as possible.",
        "Hold at the top.",
        "Lower slowly."
      ],
      "es": [
        "Sentado, rodillas bajo las almohadillas, puntas de los pies en la plataforma.",
        "Baja los talones por debajo de la línea (estirar).",
        "Sube de puntillas todo lo que puedas.",
        "Aguanta arriba.",
        "Baja despacio."
      ],
      "fr": [
        "Assis, genoux sous les coussinets, pointes des pieds sur le plateau.",
        "Laisse descendre les talons sous le niveau du plateau (étirement).",
        "Monte sur la pointe des pieds au maximum.",
        "Tiens en haut.",
        "Descends lentement."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Amplitude curta.",
          "c": "Alonga bem em baixo, contrai no topo."
        },
        {
          "e": "Ressaltar.",
          "c": "Controla a fase de alongamento."
        }
      ],
      "en": [
        {
          "e": "Short range of motion.",
          "c": "Full stretch at the bottom, squeeze at the top."
        },
        {
          "e": "Bouncing.",
          "c": "Control the stretch phase."
        }
      ],
      "es": [
        {
          "e": "Recorrido corto.",
          "c": "Estira bien abajo y contrae arriba."
        },
        {
          "e": "Rebotar.",
          "c": "Controla la fase de estiramiento."
        }
      ],
      "fr": [
        {
          "e": "Amplitude trop courte.",
          "c": "Étire bien en bas et contracte en haut."
        },
        {
          "e": "Rebondir.",
          "c": "Contrôle la phase d’étirement."
        }
      ]
    },
    "safe": {
      "pt": [
        "Controla o alongamento."
      ],
      "en": [
        "Control the stretch."
      ],
      "es": [
        "Controla el estiramiento."
      ],
      "fr": [
        "Contrôle l’étirement."
      ]
    },
    "breath": {
      "pt": "Expira ao subir, inspira ao descer.",
      "en": "Breathe out as you rise, in as you lower.",
      "es": "Espira al subir, inspira al bajar.",
      "fr": "Expire en montant, inspire en descendant."
    }
  },
  "pallof": {
    "n": {
      "pt": "Pallof Press",
      "en": "Pallof Press",
      "es": "Press Pallof",
      "fr": "Pallof press"
    },
    "eq": {
      "pt": "Polia + pega",
      "en": "Cable + handle",
      "es": "Polea + agarre",
      "fr": "Poulie + poignée"
    },
    "anim": "pallof",
    "pri": [
      "obliques",
      "abs"
    ],
    "sec": [],
    "steps": {
      "pt": [
        "De lado para a polia (altura do peito), pega com as duas mãos.",
        "Afasta-te para criar tensão.",
        "Empurra a pega à frente resistindo à rotação.",
        "Segura 2s.",
        "Volta ao peito. Faz os dois lados."
      ],
      "en": [
        "Stand side-on to the pulley (chest height), grip with both hands.",
        "Step away to create tension.",
        "Press the handle straight out, resisting the rotation.",
        "Hold for 2s.",
        "Bring it back to the chest. Do both sides."
      ],
      "es": [
        "De lado a la polea (a la altura del pecho), agarra con las dos manos.",
        "Sepárate para crear tensión.",
        "Empuja el agarre al frente resistiendo la rotación.",
        "Aguanta 2 s.",
        "Vuelve al pecho. Haz los dos lados."
      ],
      "fr": [
        "De profil par rapport à la poulie (à hauteur de poitrine), saisis la poignée à deux mains.",
        "Éloigne-toi pour créer de la tension.",
        "Pousse la poignée devant toi en résistant à la rotation.",
        "Tiens 2 s.",
        "Ramène vers la poitrine. Fais les deux côtés."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Deixar o tronco rodar para a polia.",
          "c": "Resiste à rotação; core firme."
        },
        {
          "e": "Braços a fazer o trabalho.",
          "c": "A tensão está no core, não nos braços."
        }
      ],
      "en": [
        {
          "e": "Letting the torso rotate toward the pulley.",
          "c": "Resist the rotation; brace the core."
        },
        {
          "e": "Letting the arms do the work.",
          "c": "The tension belongs in the core, not the arms."
        }
      ],
      "es": [
        {
          "e": "Dejar que el tronco gire hacia la polea.",
          "c": "Resiste la rotación; core firme."
        },
        {
          "e": "Que trabajen los brazos.",
          "c": "La tensión está en el core, no en los brazos."
        }
      ],
      "fr": [
        {
          "e": "Laisser le buste tourner vers la poulie.",
          "c": "Résiste à la rotation ; gainage ferme."
        },
        {
          "e": "Laisser les bras faire le travail.",
          "c": "La tension est dans le gainage, pas dans les bras."
        }
      ]
    },
    "safe": {
      "pt": [
        "Anti-rotação — excelente para estabilizar a coluna."
      ],
      "en": [
        "Anti-rotation — excellent for spinal stability."
      ],
      "es": [
        "Antirrotación: excelente para estabilizar la columna."
      ],
      "fr": [
        "Anti-rotation — excellent pour stabiliser la colonne."
      ]
    },
    "breath": {
      "pt": "Expira ao empurrar, respira normal na retenção.",
      "en": "Breathe out as you press, breathe normally during the hold.",
      "es": "Espira al empujar y respira con normalidad mientras aguantas.",
      "fr": "Expire en poussant, et respire normalement pendant le maintien."
    }
  },
  "legraise": {
    "n": {
      "pt": "Elevação de Pernas Suspenso",
      "en": "Hanging Leg Raise",
      "es": "Elevación de piernas colgado",
      "fr": "Relevé de jambes suspendu"
    },
    "eq": {
      "pt": "Barra fixa",
      "en": "Pull-up bar",
      "es": "Barra de dominadas",
      "fr": "Barre de traction"
    },
    "anim": "legraise",
    "pri": [
      "abs"
    ],
    "sec": [
      "obliques"
    ],
    "steps": {
      "pt": [
        "Suspenso na barra, corpo estável.",
        "Sem balançar, contrai o abdómen.",
        "Eleva os joelhos (ou pernas) até acima da bacia.",
        "Enrola a bacia no topo.",
        "Desce controlando sem baloiçar."
      ],
      "en": [
        "Hang from the bar, body steady.",
        "No swinging — brace the abs.",
        "Raise the knees (or legs) above hip level.",
        "Curl the pelvis at the top.",
        "Lower under control without swinging."
      ],
      "es": [
        "Colgado de la barra, el cuerpo estable.",
        "Sin balancearte, aprieta el abdomen.",
        "Sube las rodillas (o las piernas) por encima de la cadera.",
        "Enrolla la cadera arriba.",
        "Baja controlando, sin balanceo."
      ],
      "fr": [
        "Suspendu à la barre, corps stable.",
        "Sans balancer, contracte les abdominaux.",
        "Monte les genoux (ou les jambes) au-dessus du bassin.",
        "Enroule le bassin en haut.",
        "Descends en contrôlant, sans balancement."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Baloiçar o corpo para subir.",
          "c": "Sem impulso; movimento controlado do abdómen."
        },
        {
          "e": "Só levantar as pernas sem enrolar a bacia.",
          "c": "Enrola a bacia para trabalhar mesmo o abdómen."
        }
      ],
      "en": [
        {
          "e": "Swinging the body to get the legs up.",
          "c": "No momentum; controlled movement from the abs."
        },
        {
          "e": "Only lifting the legs without curling the pelvis.",
          "c": "Curl the pelvis to actually work the abs."
        }
      ],
      "es": [
        {
          "e": "Balancear el cuerpo para subir.",
          "c": "Sin impulso; movimiento controlado desde el abdomen."
        },
        {
          "e": "Solo levantar las piernas sin enrollar la cadera.",
          "c": "Enrolla la cadera: es lo que hace trabajar de verdad al abdomen."
        }
      ],
      "fr": [
        {
          "e": "Balancer le corps pour monter.",
          "c": "Pas d’élan ; mouvement contrôlé, venu des abdominaux."
        },
        {
          "e": "Lever seulement les jambes sans enrouler le bassin.",
          "c": "Enroule le bassin — c’est ce qui fait vraiment travailler les abdominaux."
        }
      ]
    },
    "safe": {
      "pt": [
        "Se for difícil, começa com joelhos fletidos."
      ],
      "en": [
        "If it is too hard, start with bent knees."
      ],
      "es": [
        "Si te cuesta, empieza con las rodillas flexionadas."
      ],
      "fr": [
        "Si c’est difficile, commence genoux fléchis."
      ]
    },
    "breath": {
      "pt": "Expira ao subir, inspira ao descer.",
      "en": "Breathe out as you raise, in as you lower.",
      "es": "Espira al subir, inspira al bajar.",
      "fr": "Expire en montant, inspire en descendant."
    }
  },
  "cablecrunch": {
    "n": {
      "pt": "Abdominal na Polia",
      "en": "Cable Crunch",
      "es": "Crunch en polea",
      "fr": "Crunch à la poulie"
    },
    "eq": {
      "pt": "Polia alta + corda",
      "en": "High pulley + rope",
      "es": "Polea alta + cuerda",
      "fr": "Poulie haute + corde"
    },
    "anim": "cablecrunch",
    "pri": [
      "abs"
    ],
    "sec": [
      "obliques"
    ],
    "steps": {
      "pt": [
        "De joelhos de frente para a polia alta, corda atrás da cabeça.",
        "Bacia fixa, ancas imóveis.",
        "Enrola a coluna trazendo as costelas à bacia.",
        "Contrai o abdómen no fim.",
        "Volta controlando."
      ],
      "en": [
        "Kneel facing the high pulley, rope behind your head.",
        "Hips locked, no movement at the hip joint.",
        "Curl the spine, bringing the ribs toward the pelvis.",
        "Squeeze the abs at the end.",
        "Return under control."
      ],
      "es": [
        "De rodillas frente a la polea alta, la cuerda detrás de la cabeza.",
        "Cadera fija, las caderas inmóviles.",
        "Enrolla la columna llevando las costillas hacia la cadera.",
        "Aprieta el abdomen al final.",
        "Vuelve controlando."
      ],
      "fr": [
        "À genoux face à la poulie haute, la corde derrière la tête.",
        "Bassin fixe, hanches immobiles.",
        "Enroule la colonne en amenant les côtes vers le bassin.",
        "Contracte les abdominaux en fin de mouvement.",
        "Reviens en contrôlant."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Puxar com os braços/anca (vira agachamento).",
          "c": "Anca fixa; enrola a coluna com o abdómen."
        },
        {
          "e": "Amplitude curta.",
          "c": "Enrola bem, aproxima o peito da bacia."
        }
      ],
      "en": [
        {
          "e": "Pulling with the arms/hips (it becomes a squat).",
          "c": "Hips fixed; curl the spine with the abs."
        },
        {
          "e": "Short range of motion.",
          "c": "Curl fully, bringing the chest toward the pelvis."
        }
      ],
      "es": [
        {
          "e": "Tirar con los brazos o la cadera (se convierte en sentadilla).",
          "c": "Cadera fija; enrolla la columna con el abdomen."
        },
        {
          "e": "Recorrido corto.",
          "c": "Enrolla bien, acerca el pecho a la cadera."
        }
      ],
      "fr": [
        {
          "e": "Tirer avec les bras ou les hanches (ça devient un squat).",
          "c": "Hanches fixes ; enroule la colonne avec les abdominaux."
        },
        {
          "e": "Amplitude trop courte.",
          "c": "Enroule bien, rapproche la poitrine du bassin."
        }
      ]
    },
    "safe": {
      "pt": [
        "O movimento é enrolar a coluna, não dobrar a anca."
      ],
      "en": [
        "The movement is a spinal curl, not a hip bend."
      ],
      "es": [
        "El movimiento es enrollar la columna, no doblar la cadera."
      ],
      "fr": [
        "Le mouvement consiste à enrouler la colonne, pas à plier la hanche."
      ]
    },
    "breath": {
      "pt": "Expira ao enrolar, inspira ao voltar.",
      "en": "Breathe out as you crunch, in as you return.",
      "es": "Espira al enrollar, inspira al volver.",
      "fr": "Expire en enroulant, inspire au retour."
    }
  },
  "birddog": {
    "n": {
      "pt": "Bird-dog",
      "en": "Bird-dog",
      "es": "Bird-dog",
      "fr": "Bird-dog"
    },
    "eq": {
      "pt": "Peso corporal",
      "en": "Bodyweight",
      "es": "Peso corporal",
      "fr": "Poids du corps"
    },
    "anim": "birddog",
    "pri": [
      "lowerBack",
      "glutes"
    ],
    "sec": [
      "abs"
    ],
    "steps": {
      "pt": [
        "Quatro apoios: mãos sob ombros, joelhos sob a bacia.",
        "Core firme, coluna neutra.",
        "Estende braço direito e perna esquerda.",
        "Segura 2s, bacia estável.",
        "Volta e alterna."
      ],
      "en": [
        "On all fours: hands under shoulders, knees under hips.",
        "Core braced, neutral spine.",
        "Extend the right arm and left leg.",
        "Hold for 2s, hips steady.",
        "Return and alternate."
      ],
      "es": [
        "A cuatro apoyos: manos bajo los hombros, rodillas bajo la cadera.",
        "Core firme, columna neutra.",
        "Estira el brazo derecho y la pierna izquierda.",
        "Aguanta 2 s, con la cadera estable.",
        "Vuelve y alterna."
      ],
      "fr": [
        "À quatre pattes : mains sous les épaules, genoux sous le bassin.",
        "Gainage ferme, colonne neutre.",
        "Tends le bras droit et la jambe gauche.",
        "Tiens 2 s, bassin stable.",
        "Reviens et alterne."
      ]
    },
    "errs": {
      "pt": [
        {
          "e": "Rodar a bacia ao estender.",
          "c": "Bacia estável, como um copo de água nas costas."
        },
        {
          "e": "Arquear a lombar.",
          "c": "Coluna neutra do início ao fim."
        }
      ],
      "en": [
        {
          "e": "Hips rotating as you extend.",
          "c": "Keep the hips level, as if balancing a glass of water on your back."
        },
        {
          "e": "Arching the lower back.",
          "c": "Neutral spine start to finish."
        }
      ],
      "es": [
        {
          "e": "Girar la cadera al estirar.",
          "c": "Cadera estable, como si llevaras un vaso de agua en la espalda."
        },
        {
          "e": "Arquear la lumbar.",
          "c": "Columna neutra de principio a fin."
        }
      ],
      "fr": [
        {
          "e": "Faire tourner le bassin en tendant.",
          "c": "Bassin stable, comme si tu portais un verre d’eau sur le dos."
        },
        {
          "e": "Cambrer le bas du dos.",
          "c": "Colonne neutre du début à la fin."
        }
      ]
    },
    "safe": {
      "pt": [
        "Excelente estabilidade lombar — reforça o que te protege sentado."
      ],
      "en": [
        "Great lumbar stability — it reinforces what protects you while sitting."
      ],
      "es": [
        "Excelente estabilidad lumbar: refuerza justo lo que te protege sentado."
      ],
      "fr": [
        "Excellente stabilité lombaire — renforce exactement ce qui te protège en position assise."
      ]
    },
    "breath": {
      "pt": "Expira ao estender, inspira ao recolher.",
      "en": "Breathe out as you extend, in as you return.",
      "es": "Espira al estirar, inspira al recoger.",
      "fr": "Expire en tendant, inspire en revenant."
    }
  }
};

export type ExerciseKey = keyof typeof EXERCISES;
