window.GUILD_DATA = {
  version:'1.2.5',
  classes:{
    Guerrero:{icon:'⚔️',role:'Defensor',power:16,ability:'Interceptar'},
    Maga:{icon:'✨',role:'Daño mágico',power:17,ability:'Explosión Arcana'},
    Sacerdotisa:{icon:'✚',role:'Sanadora',power:13,ability:'Curación'},
    Picaro:{icon:'🗡️',role:'Explorador',power:14,ability:'Desactivar Trampa'},
    Arquera:{icon:'🏹',role:'Rastreadora',power:15,ability:'Disparo Preciso'},
    Paladin:{icon:'🛡️',role:'Protector',power:16,ability:'Juramento Protector'}
  },
  specializations:{
    Guerrero:[
      {id:'guardian',name:'Guardián',power:4,ability:'Muro de Acero',effect:{partyInjury:-0.05},desc:'Protege mejor a aliados y reduce riesgos.'},
      {id:'duelist',name:'Duelista',power:6,ability:'Contraataque',effect:{success:0.025},desc:'Aporta precisión ofensiva en encuentros decisivos.'}
    ],
    Maga:[
      {id:'elementalist',name:'Elementalista',power:6,ability:'Tormenta Elemental',effect:{success:0.03},desc:'Especialista en daño y control del campo.'},
      {id:'arcanist',name:'Arcanista',power:4,ability:'Sello Arcano',effect:{arcaneSuccess:0.06,treasure:0.04},desc:'Mejora exploración y resolución de magia antigua.'}
    ],
    Sacerdotisa:[
      {id:'healer',name:'Sanadora Mayor',power:3,ability:'Restauración',effect:{partyInjury:-0.07},desc:'Reduce heridas y favorece recuperación.'},
      {id:'oracle',name:'Oráculo',power:4,ability:'Augurio',effect:{success:0.04},desc:'Mejora preparación y lectura de peligros.'}
    ],
    Picaro:[
      {id:'scout',name:'Explorador',power:4,ability:'Paso Silencioso',effect:{treasure:0.08,explorationSuccess:0.04},desc:'Excelente para rutas, trampas y tesoros.'},
      {id:'shadow',name:'Sombra',power:6,ability:'Golpe Oportuno',effect:{success:0.025},desc:'Mayor eficacia en encuentros peligrosos.'}
    ],
    Arquera:[
      {id:'ranger',name:'Guardabosques',power:5,ability:'Rastreo Maestro',effect:{explorationSuccess:0.05,treasure:0.04},desc:'Mejora viajes y exploración.'},
      {id:'marksman',name:'Tiradora',power:6,ability:'Disparo Certero',effect:{success:0.03},desc:'Especialista en resolver encuentros.'}
    ],
    Paladin:[
      {id:'warden',name:'Custodia',power:4,ability:'Voto Protector',effect:{partyInjury:-0.06},desc:'Reduce riesgo para toda la party.'},
      {id:'champion',name:'Campeón',power:6,ability:'Golpe Radiante',effect:{hardSuccess:0.05},desc:'Mayor poder en misiones difíciles.'}
    ]
  },
  traits:{
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
  origins:[
    'Aldea agrícola','Barrio mercante','Familia militar','Monasterio rural','Bosques fronterizos',
    'Ciudad portuaria','Casa de artesanos','Academia menor','Caravana itinerante','Familia de cazadores'
  ],
  motivations:[
    {id:'protect',name:'Proteger a otros',desc:'Quiere ser alguien en quien los demás puedan confiar.'},
    {id:'glory',name:'Ganar renombre',desc:'Sueña con que su nombre sea recordado en el gremio.'},
    {id:'knowledge',name:'Descubrir secretos',desc:'Busca ruinas, historia y conocimiento perdido.'},
    {id:'family',name:'Ayudar a su familia',desc:'Quiere construir una vida mejor para los suyos.'},
    {id:'wealth',name:'Hacer fortuna',desc:'Ve la aventura como una oportunidad para prosperar.'},
    {id:'mastery',name:'Dominar su oficio',desc:'Desea convertirse en un referente de su clase.'}
  ],
  injuries:[
    {id:'sprain',name:'Esguince',severity:1,days:5,power:-3,desc:'Movimiento limitado durante algunos días.'},
    {id:'cut',name:'Corte profundo',severity:1,days:6,power:-4,desc:'Necesita reposo y vendajes.'},
    {id:'burn',name:'Quemadura',severity:2,days:9,power:-6,desc:'Dolorosa, pero normalmente recuperable.'},
    {id:'ribs',name:'Costillas golpeadas',severity:2,days:10,power:-7,desc:'Reduce mucho el rendimiento físico.'},
    {id:'concussion',name:'Conmoción leve',severity:2,days:8,power:-6,desc:'Requiere reposo antes de volver a exponerse.'},
    {id:'fracture',name:'Fractura',severity:3,days:14,power:-10,desc:'Herida grave que obliga a recuperarse en el gremio.'}
  ],
  facilities:{
    infirmary:{name:'Enfermería',icon:'⚕️',desc:'Reduce duración de heridas.',costs:[220,420,700]},
    tavern:{name:'Taberna',icon:'🍻',desc:'Favorece vínculos y eventos sociales.',costs:[180,360,620]},
    training:{name:'Patio de entrenamiento',icon:'🎯',desc:'Aumenta XP obtenida en expediciones.',costs:[240,460,760]},
    library:{name:'Biblioteca',icon:'📚',desc:'Mejora misiones con magia, historia y exploración.',costs:[260,500,820]}
  },
  planning:{
    pace:{
      cautious:{name:'Cauteloso',chance:0.08,days:1,injury:-0.07,reward:-0.08,desc:'Más lento y seguro.'},
      balanced:{name:'Balanceado',chance:0,days:0,injury:0,reward:0,desc:'Sin modificadores.'},
      fast:{name:'Rápido',chance:-0.05,days:-1,injury:0.06,reward:0.08,desc:'Más rápido, pero más arriesgado.'}
    },
    priority:{
      safety:{name:'Seguridad',chance:0.05,injury:-0.08,reward:-0.12,treasure:0,desc:'Prioriza regresar sanos.'},
      objective:{name:'Objetivo',chance:0.04,injury:0.02,reward:0.05,treasure:0,desc:'Se concentra en completar el contrato.'},
      treasure:{name:'Tesoro',chance:-0.04,injury:0.03,reward:0.18,treasure:0.18,desc:'Busca beneficios adicionales.'}
    },
    supplies:{
      none:{name:'Sin extras',cost:0,chance:0,injury:0,desc:'Equipo estándar del gremio.'},
      bandages:{name:'Vendajes',cost:35,chance:0,injury:-0.08,desc:'Reduce riesgo de heridas.'},
      potions:{name:'Pociones',cost:70,chance:0.06,injury:-0.04,desc:'Ayuda en encuentros difíciles.'},
      maps:{name:'Mapas y guías',cost:55,chance:0.05,injury:0,desc:'Mejora viaje y exploración.'}
    }
  },
  regions:[
    {id:'frontier',name:'Frontera Verde',rep:0,desc:'Caminos, bosques y asentamientos jóvenes.'},
    {id:'oldkingdom',name:'Viejo Reino',rep:10,desc:'Ruinas, criptas y caminos olvidados.'},
    {id:'arcane',name:'Marcas Arcanas',rep:20,desc:'Torres, anomalías y antiguos observatorios.'},
    {id:'highlands',name:'Tierras Altas',rep:35,desc:'Rutas duras, fortalezas y criaturas poderosas.'}
  ],
  missions:[
    {id:'goblins',region:'frontier',name:'Mina tomada por goblins',difficulty:1,days:2,reward:220,type:'combat',desc:'Túneles estrechos, saqueadores y trampas sencillas.'},
    {id:'forest',region:'frontier',name:'Ruinas del Bosque Negro',difficulty:2,days:3,reward:360,type:'exploration',desc:'Bestias, bandidos y ruinas cubiertas por el bosque.'},
    {id:'caravan',region:'frontier',name:'Escolta hacia Valleverde',difficulty:1,days:3,reward:260,type:'escort',desc:'Proteger una caravana a través de caminos poco vigilados.'},
    {id:'crypt',region:'oldkingdom',name:'Cripta del Rey Sin Nombre',difficulty:3,days:4,reward:540,type:'undead',desc:'Guardianes no-muertos y cámaras funerarias peligrosas.'},
    {id:'watchtower',region:'oldkingdom',name:'Atalaya abandonada',difficulty:2,days:3,reward:430,type:'exploration',desc:'Investigar señales de ocupación en una vieja torre de vigilancia.'},
    {id:'tower',region:'arcane',name:'Torre del Astrólogo Caído',difficulty:4,days:5,reward:760,type:'arcane',desc:'Magia hostil, constructos y secretos de un astrólogo desaparecido.'},
    {id:'leyline',region:'arcane',name:'La línea de luz',difficulty:3,days:4,reward:650,type:'arcane',desc:'Estabilizar una anomalía mágica antes de que alcance un poblado.'},
    {id:'giantpass',region:'highlands',name:'Paso del Gigante',difficulty:4,days:5,reward:880,type:'combat',desc:'Abrir de nuevo un paso montañoso cerrado por criaturas enormes.'},
    {id:'stormshrine',region:'highlands',name:'Santuario de la Tormenta',difficulty:5,days:6,reward:1100,type:'legendary',desc:'Una expedición prestigiosa a un santuario casi olvidado.'}
  ],
  encounterPools:{
    combat:['una patrulla hostil','una emboscada bien preparada','una criatura territorial','un líder enemigo con sus guardias'],
    exploration:['un derrumbe inesperado','guardianes de unas ruinas','un paso oculto protegido','una cámara cerrada durante décadas'],
    escort:['bandidos en el camino','una estampida cerca de la caravana','un puente dañado','saqueadores siguiendo el convoy'],
    undead:['guardianes no-muertos','un caballero sepultado','sombras inquietas','esqueletos armados'],
    arcane:['constructos arcanos','un familiar mágico fuera de control','guardianes encantados','una anomalía de energía'],
    legendary:['guardianes veteranos','una criatura ancestral','un campeón rival','la prueba final del santuario']
  },
  expeditionEvents:{
    travel:[
      {icon:'🌤️',title:'Un camino tranquilo',text:'La party avanza con buen ritmo mientras el paisaje cambia alrededor del camino.'},
      {icon:'🌧️',title:'Lluvia en el camino',text:'Una lluvia persistente obliga al grupo a proteger el equipo y reducir el paso.'},
      {icon:'🛤️',title:'Cruce de caminos',text:'Un viejo poste de madera ofrece dos rutas. El grupo compara mapas antes de continuar.'},
      {icon:'🐎',title:'Caravana amistosa',text:'Una pequeña caravana comparte noticias de la región antes de seguir su camino.'},
      {icon:'🌄',title:'Amanecer en ruta',text:'El grupo contempla el amanecer desde una colina antes de continuar.'}
    ],
    exploration:[
      {icon:'🧭',title:'Rastros recientes',text:'El grupo encuentra huellas y decide avanzar con mayor atención.'},
      {icon:'📜',title:'Inscripción olvidada',text:'Entre piedra y polvo aparece una inscripción antigua.'},
      {icon:'🗝️',title:'Puerta secundaria',text:'Una entrada parcialmente oculta sugiere una ruta alternativa.'},
      {icon:'🕯️',title:'Señales de viajeros',text:'Restos de una fogata reciente indican que alguien pasó por aquí.'},
      {icon:'💰',title:'Pequeño escondite',text:'La party encuentra unas monedas escondidas por antiguos viajeros.'}
    ],
    camp:[
      {icon:'🔥',title:'Historias junto al fuego',text:'El grupo comparte comida y anécdotas después de un día largo.'},
      {icon:'🌙',title:'Guardia nocturna',text:'Dos compañeros coinciden durante la guardia y hablan lejos del resto.'},
      {icon:'🍲',title:'Una cena sencilla',text:'Después de un día difícil, una comida caliente es suficiente para levantar el ánimo.'},
      {icon:'🎲',title:'Juego improvisado',text:'Alguien propone un pequeño juego antes de dormir.'},
      {icon:'⭐',title:'Cielo despejado',text:'La noche está tranquila y por un momento el peligro parece lejano.'}
    ]
  },
  classMoments:{
    Picaro:['detecta un mecanismo sospechoso antes de que alguien lo active','encuentra marcas que revelan una ruta utilizada por contrabandistas'],
    Arquera:['reconoce huellas recientes y guía al grupo por terreno seguro','sube a un punto elevado y localiza el camino más despejado'],
    Maga:['interpreta unas runas antes de que alguien las toque','reconoce residuos arcanos que explican qué ocurrió en la zona'],
    Sacerdotisa:['encuentra un pequeño santuario y propone detenerse unos minutos','reconoce símbolos religiosos antiguos y explica su significado'],
    Guerrero:['advierte que el terreno sería perfecto para una emboscada','encuentra señales de combate y reconstruye lo ocurrido'],
    Paladin:['descubre un emblema de una antigua orden','propone una formación más segura antes de entrar en una zona estrecha']
  },
  guildLifeEvents:[
    {id:'festival',title:'Festival local',text:'El gremio participa en una celebración del pueblo.',gold:-25,rep:2,bond:2},
    {id:'merchant',title:'Mercader visitante',text:'Un mercader ofrece suministros y conversa con los aventureros.',gold:-15,rep:1,bond:0},
    {id:'training',title:'Entrenamiento conjunto',text:'Varios miembros convierten una tarde libre en práctica amistosa.',xp:12,bond:1},
    {id:'dinner',title:'Cena del gremio',text:'Una larga mesa reúne a veteranos y recién llegados.',gold:-20,bond:4},
    {id:'letters',title:'Cartas de casa',text:'Llegan cartas y pequeños paquetes para varios aventureros.',bond:1},
    {id:'market',title:'Día de mercado',text:'El barrio alrededor del gremio se llena de comerciantes y viajeros.',gold:30,rep:1}
  ],
  names:['Aldric','Selene','Mira','Finn','Rowan','Lyra','Garrick','Elowen','Cedric','Nadia','Bram','Iris','Toren','Vera','Lucan','Maeve','Dorian','Freya','Orin','Kaia','Hector','Liora','Maren','Silas']
};