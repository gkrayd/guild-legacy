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
  names:['Aldric','Selene','Mira','Finn','Rowan','Lyra','Garrick','Elowen','Cedric','Nadia','Bram','Iris','Toren','Vera','Lucan','Maeve','Dorian','Freya'],
  missions:[
    {id:'goblins',name:'Mina tomada por goblins',difficulty:1,days:2,reward:220,desc:'Combates simples, túneles estrechos y trampas básicas.'},
    {id:'forest',name:'Ruinas del Bosque Negro',difficulty:2,days:3,reward:360,desc:'Bestias, bandidos y ruinas mágicas. La exploración importa.'},
    {id:'crypt',name:'Cripta del Rey Sin Nombre',difficulty:3,days:4,reward:540,desc:'No-muertos y guardianes peligrosos. Las heridas son frecuentes.'},
    {id:'tower',name:'Torre del Astrólogo Caído',difficulty:4,days:5,reward:760,desc:'Magia hostil, enemigos veteranos y alto riesgo de heridas graves.'}
  ]
};
