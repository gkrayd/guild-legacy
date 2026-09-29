window.GUILD_DATA = {
  classes: {
    Guerrero:{icon:'⚔️',role:'Defensor',power:16,ability:'Interceptar'},
    Maga:{icon:'✨',role:'Daño mágico',power:17,ability:'Explosión Arcana'},
    Sacerdotisa:{icon:'✚',role:'Sanadora',power:13,ability:'Curación'},
    Picaro:{icon:'🗡️',role:'Explorador',power:14,ability:'Desactivar Trampa'},
    Arquera:{icon:'🏹',role:'Rastreadora',power:15,ability:'Disparo Preciso'},
    Paladin:{icon:'🛡️',role:'Protector',power:16,ability:'Juramento Protector'}
  },
  traits: {
    Valiente:{risk:2,social:1,desc:'se arriesga por otros'},
    Prudente:{risk:-2,social:0,desc:'evita riesgos innecesarios'},
    Leal:{risk:1,social:2,desc:'prioriza a sus compañeros'},
    Ambicioso:{risk:1,social:-1,desc:'busca gloria personal'},
    Bromista:{risk:0,social:2,desc:'alivia tensiones'},
    Reservado:{risk:0,social:-1,desc:'le cuesta crear vínculos'},
    Curioso:{risk:1,social:0,desc:'investiga lo desconocido'},
    Protector:{risk:2,social:2,desc:'interviene por aliados'},
    Impulsivo:{risk:3,social:-1,desc:'actúa antes de pensar'},
    Compasivo:{risk:1,social:2,desc:'ayuda incluso con coste propio'},
    Codicioso:{risk:1,social:-2,desc:'prioriza tesoros'},
    Disciplinado:{risk:-1,social:1,desc:'mantiene la formación'}
  },
  expeditionEvents: {
    travel: [
      {icon:'🌤️',title:'Un camino tranquilo',text:'La party avanza con buen ritmo mientras el paisaje cambia alrededor del camino.'},
      {icon:'🌧️',title:'Lluvia en el camino',text:'Una lluvia persistente obliga al grupo a cubrir el equipo y reducir el paso.'},
      {icon:'🛤️',title:'Cruce de caminos',text:'Un viejo poste de madera ofrece dos rutas posibles. El grupo compara mapas antes de continuar.'},
      {icon:'🐎',title:'Caravana amistosa',text:'Una pequeña caravana comparte noticias de la región y algo de conversación antes de separarse.'},
      {icon:'🌄',title:'Amanecer en ruta',text:'El grupo inicia temprano y contempla el amanecer desde una colina antes de seguir hacia el destino.'}
    ],
    exploration: [
      {icon:'🧭',title:'Rastros recientes',text:'El grupo encuentra huellas recientes y decide avanzar con mayor atención.'},
      {icon:'📜',title:'Una inscripción olvidada',text:'Entre piedra y polvo aparece una inscripción antigua que despierta la curiosidad de la party.'},
      {icon:'🗝️',title:'Puerta secundaria',text:'Una entrada parcialmente oculta sugiere que alguien conocía una ruta alternativa.'},
      {icon:'🕯️',title:'Señales de otros viajeros',text:'Restos de una fogata reciente confirman que la zona no está tan abandonada como parecía.'},
      {icon:'💰',title:'Pequeño escondite',text:'Tras revisar una zona apartada, la party encuentra unas monedas escondidas por antiguos viajeros.'}
    ],
    camp: [
      {icon:'🔥',title:'Historias junto al fuego',text:'La conversación se alarga mientras el grupo comparte comida y anécdotas del camino.'},
      {icon:'🌙',title:'Guardia nocturna',text:'Dos compañeros coinciden durante la guardia y tienen tiempo para hablar lejos del resto.'},
      {icon:'🍲',title:'Una cena sencilla',text:'La comida no es extraordinaria, pero después de un día difícil nadie se queja.'},
      {icon:'🎲',title:'Un juego improvisado',text:'Alguien propone un pequeño juego para pasar el tiempo antes de dormir.'},
      {icon:'⭐',title:'Cielo despejado',text:'La noche está tranquila. Por un momento, la expedición parece muy lejos de cualquier peligro.'}
    ],
    encounters: {
      goblins:['exploradores goblin','un grupo de saqueadores goblin','una barricada improvisada','un capataz goblin y sus guardias'],
      forest:['una manada territorial','bandidos ocultos entre las ruinas','una criatura del bosque','guardianes de unas ruinas cubiertas de musgo'],
      crypt:['guardianes no-muertos','un caballero sepultado','sombras inquietas entre los sarcófagos','un grupo de esqueletos armados'],
      tower:['constructos arcanos','un familiar mágico fuera de control','guardianes encantados','una entidad invocada que protege la torre']
    },
    classMoments: {
      Picaro:[
        'detecta un mecanismo sospechoso antes de que alguien lo active',
        'encuentra marcas discretas que revelan una ruta utilizada por contrabandistas'
      ],
      Arquera:[
        'reconoce huellas recientes y guía al grupo por el terreno más seguro',
        'sube a un punto elevado y localiza el camino más despejado'
      ],
      Maga:[
        'identifica el patrón mágico de unas runas y evita que el grupo las toque sin preparación',
        'reconoce residuos arcanos que revelan qué ocurrió en la zona'
      ],
      Sacerdotisa:[
        'encuentra un pequeño santuario abandonado y propone detenerse unos minutos',
        'reconoce símbolos religiosos antiguos y explica su significado al resto'
      ],
      Guerrero:[
        'advierte que el terreno sería perfecto para una emboscada y reorganiza la marcha',
        'encuentra señales de combate y ayuda al grupo a reconstruir lo ocurrido'
      ],
      Paladin:[
        'descubre un emblema de una antigua orden y lo examina con respeto',
        'propone una formación más segura al entrar en una zona estrecha'
      ]
    }
  },
  names:['Aldric','Selene','Mira','Finn','Rowan','Lyra','Garrick','Elowen','Cedric','Nadia','Bram','Iris','Toren','Vera','Lucan','Maeve','Dorian','Freya'],
  missions:[
    {id:'goblins',name:'Mina tomada por goblins',difficulty:1,days:2,reward:220,desc:'Combates simples, túneles estrechos y trampas básicas.'},
    {id:'forest',name:'Ruinas del Bosque Negro',difficulty:2,days:3,reward:360,desc:'Bestias, bandidos y ruinas mágicas. La exploración importa.'},
    {id:'crypt',name:'Cripta del Rey Sin Nombre',difficulty:3,days:4,reward:540,desc:'No-muertos y guardianes peligrosos. Las heridas son frecuentes.'},
    {id:'tower',name:'Torre del Astrólogo Caído',difficulty:4,days:5,reward:760,desc:'Magia hostil, enemigos veteranos y alto riesgo de heridas graves.'}
  ]
};
